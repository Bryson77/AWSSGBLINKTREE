import { enforceRateLimit, RATE_LIMIT_RULES } from "@awssbg/shared/src/lib/rateLimit";
import { escapeHtml } from "@awssbg/shared/src/lib/sanitize";

interface Env {
  RESEND_API_KEY?: string;
  ADMIN_NOTIFICATION_EMAIL?: string;
  ENQUIRIES_EMAIL?: string;
}

export const onRequest = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Rate limiting to prevent email spam / quota exhaustion
  const rateLimitError = enforceRateLimit(request, "notify_auth", RATE_LIMIT_RULES.AUTH);
  if (rateLimitError) return rateLimitError;

  try {
    const body = (await request.json()) as {
      type: "login" | "password_changed";
      email: string;
    };

    const { type, email } = body;
    if (!type || !email) {
      return new Response(JSON.stringify({ error: "Missing type or email" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = env.RESEND_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ warning: "RESEND_API_KEY not configured, skipped email." }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const rawIp = request.headers.get("cf-connecting-ip") || "Unknown IP";
    const rawUa = request.headers.get("user-agent") || "Unknown Browser";
    const timestamp = new Date().toUTCString();

    const safeEmail = escapeHtml(email);
    const safeIp = escapeHtml(rawIp);
    const safeUa = escapeHtml(rawUa);

    const isLogin = type === "login";
    const title = isLogin ? "New Admin Sign-In" : "Password Changed";
    const badgeColor = isLogin ? "#2563EB" : "#10B981";
    const badgeText = isLogin ? "SIGN-IN DETECTED" : "SUCCESSFUL";

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>${title}</title></head>
<body style="margin: 0; padding: 0; background-color: #F4F4F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #F4F4F5; padding: 40px 15px;">
    <tr><td align="center">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 480px; background-color: #FFFFFF; border: 3px solid #000000; box-shadow: 6px 6px 0px #000000; padding: 32px 28px;">
        <tr><td>
          <div style="display: inline-block; background-color: #000000; color: #FFFFFF; font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 900; letter-spacing: 2px; padding: 3px 8px; margin-bottom: 16px;">
            // AWS_SBG // SECURITY_AUDIT
          </div>
          <h1 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 900; text-transform: uppercase; color: #000000; line-height: 1.1;">
            ${title} <br>
            <span style="background-color: ${badgeColor}; color: #FFFFFF; padding: 2px 6px; border: 2px solid #000000; display: inline-block; margin-top: 4px;">
              ${badgeText}
            </span>
          </h1>
        </td></tr>
        <tr><td style="padding: 16px 0 20px 0; color: #27272A; font-size: 14px; line-height: 1.6;">
          <p style="margin: 0 0 12px 0; font-weight: 500;">
            ${isLogin ? `A new administrator session was established for <strong>${safeEmail}</strong> on awssbg Admin.` : `The password for <strong>${safeEmail}</strong> was successfully updated.`}
          </p>
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F4F4F5; border: 2px solid #000000; padding: 12px; margin: 16px 0; font-family: 'Courier New', Courier, monospace; font-size: 12px;">
            <tr><td style="padding: 4px 0;"><strong>Timestamp:</strong> ${timestamp}</td></tr>
            <tr><td style="padding: 4px 0;"><strong>IP Address:</strong> ${safeIp}</td></tr>
            <tr><td style="padding: 4px 0;"><strong>Client:</strong> ${safeUa}</td></tr>
          </table>
        </td></tr>
        <tr><td align="center" style="padding-bottom: 24px;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr><td align="center">
              <a href="https://admin.awssbg.online" target="_blank" style="display: block; background-color: #000000; color: #FFFFFF; border: 2px solid #000000; box-shadow: 4px 4px 0px #7C3AED; font-family: 'Courier New', Courier, monospace; font-size: 13px; font-weight: 900; text-transform: uppercase; text-decoration: none; padding: 12px 20px; text-align: center;">
                OPEN ADMIN CONSOLE &rarr;
              </a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="border-top: 2px dashed #000000; padding-top: 16px;">
          <p style="margin: 0; font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 700; color: #EF4444;">
            [!] IF YOU DID NOT INITIATE THIS ACTION, PLEASE SECURE YOUR ACCOUNT IMMEDIATELY.
          </p>
        </td></tr>
      </table>
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 480px; margin-top: 20px;">
        <tr><td align="center" style="font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 700; color: #71717A;">
          &copy; AWS STUDENT BUILDER GROUP &bull; &ldquo;GO BUILD.&rdquo;
        </td></tr>
      </table>
    </td></tr>
  </table>
 </body>
</html>`;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "AWS SBG Security <notifications@awssbg.online>",
        to: [email, env.ADMIN_NOTIFICATION_EMAIL || "lethabomabilo33@gmail.com"],
        subject: isLogin ? `Security Alert: New Sign-In on awssbg Admin` : `Security Notice: Admin Password Changed`,
        html,
      }),
    });

    return new Response(JSON.stringify({ success: true, message: "Security alert sent" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
