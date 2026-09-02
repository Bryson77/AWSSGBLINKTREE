import { createClient } from "@supabase/supabase-js";

interface Env {
  RESEND_API_KEY?: string;
  ADMIN_NOTIFICATION_EMAIL: string;
  ENQUIRIES_EMAIL: string;
  NEXT_PUBLIC_SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
}

// ── HTML Email Builders with Hardcore Neo-Brutalism Theme ──

function buildInquiryAdminEmail(data: { name: string; email: string; category: string; message: string; timestamp: string }) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>New Inquiry</title></head>
<body style="margin: 0; padding: 0; background-color: #F4F4F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F4F4F5; padding: 40px 15px;">
    <tr><td align="center">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #FFFFFF; border: 3px solid #000000; box-shadow: 6px 6px 0px #000000; padding: 32px 28px;">
        <tr><td>
          <div style="display: inline-block; background-color: #000000; color: #FFFFFF; font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 900; letter-spacing: 2px; padding: 3px 8px; margin-bottom: 16px;">
            // AWS_SBG // CONTACT_DISPATCH
          </div>
          <h1 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 900; text-transform: uppercase; color: #000000; line-height: 1.1;">
            New Student Inquiry <br>
            <span style="background-color: #7C3AED; color: #FFFFFF; padding: 2px 6px; border: 2px solid #000000; display: inline-block; margin-top: 4px;">
              ${data.category}
            </span>
          </h1>
        </td></tr>
        <tr><td style="padding: 16px 0 20px 0;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F4F4F5; border: 2px solid #000000; padding: 14px; font-family: 'Courier New', Courier, monospace; font-size: 12px;">
            <tr><td style="padding: 4px 0;"><strong>Submitter:</strong> ${data.name}</td></tr>
            <tr><td style="padding: 4px 0;"><strong>Email:</strong> <a href="mailto:${data.email}" style="color: #7C3AED; font-weight: bold;">${data.email}</a></td></tr>
            <tr><td style="padding: 4px 0;"><strong>Category:</strong> ${data.category}</td></tr>
            <tr><td style="padding: 4px 0;"><strong>Timestamp:</strong> ${data.timestamp}</td></tr>
          </table>
          <div style="margin-top: 16px;">
            <div style="font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 900; text-transform: uppercase; color: #52525B; margin-bottom: 6px;">
              // MESSAGE_CONTENT
            </div>
            <div style="background-color: #FFFFFF; border: 2px solid #000000; padding: 14px; font-size: 14px; line-height: 1.6; color: #000000; white-space: pre-wrap;">${data.message}</div>
          </div>
        </td></tr>
        <tr><td align="center" style="padding-bottom: 24px;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td width="50%" style="padding-right: 6px;">
                <a href="mailto:${data.email}?subject=Re:%20AWS%20SBG%20Inquiry%20-%20${encodeURIComponent(data.category)}" target="_blank" style="display: block; background-color: #000000; color: #FFFFFF; border: 2px solid #000000; box-shadow: 3px 3px 0px #7C3AED; font-family: 'Courier New', Courier, monospace; font-size: 12px; font-weight: 900; text-transform: uppercase; text-decoration: none; padding: 12px 16px; text-align: center;">
                  REPLY DIRECTLY &rarr;
                </a>
              </td>
              <td width="50%" style="padding-left: 6px;">
                <a href="https://admin.awssbg.online" target="_blank" style="display: block; background-color: #FFFFFF; color: #000000; border: 2px solid #000000; box-shadow: 3px 3px 0px #000000; font-family: 'Courier New', Courier, monospace; font-size: 12px; font-weight: 900; text-transform: uppercase; text-decoration: none; padding: 12px 16px; text-align: center;">
                  VIEW IN ADMIN &rarr;
                </a>
              </td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="border-top: 2px dashed #000000; padding-top: 14px;">
          <p style="margin: 0; font-family: 'Courier New', Courier, monospace; font-size: 10px; color: #71717A;">
            Dispatched to enquiries@awssbg.online &amp; lethabomabilo33@gmail.com.
          </p>
        </td></tr>
      </table>
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; margin-top: 20px;">
        <tr><td align="center" style="font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 700; color: #71717A;">
          &copy; AWS STUDENT BUILDER GROUP &bull; &ldquo;GO BUILD.&rdquo;
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildInquiryUserConfirmation(data: { name: string; category: string }) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>We Received Your Message</title></head>
<body style="margin: 0; padding: 0; background-color: #F4F4F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F4F4F5; padding: 40px 15px;">
    <tr><td align="center">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; background-color: #FFFFFF; border: 3px solid #000000; box-shadow: 6px 6px 0px #000000; padding: 32px 28px;">
        <tr><td>
          <div style="display: inline-block; background-color: #000000; color: #FFFFFF; font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 900; letter-spacing: 2px; padding: 3px 8px; margin-bottom: 16px;">
            // AWS_SBG // RECEIPT_CONFIRMATION
          </div>
          <h1 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 900; text-transform: uppercase; color: #000000; line-height: 1.1;">
            We Got Your Message, <br>
            <span style="background-color: #2563EB; color: #FFFFFF; padding: 2px 6px; border: 2px solid #000000; display: inline-block; margin-top: 4px;">
              ${data.name}
            </span>
          </h1>
        </td></tr>
        <tr><td style="padding: 16px 0 20px 0; color: #27272A; font-size: 14px; line-height: 1.6;">
          <p style="margin: 0 0 12px 0; font-weight: 500;">
            Thank you for contacting the <strong>AWS Student Builder Group (AWS SBG)</strong>. We have logged your message regarding <strong>${data.category}</strong>.
          </p>
          <p style="margin: 0 0 16px 0; color: #52525B;">
            Our student leadership team reviews incoming inquiries and will follow up with you directly.
          </p>
          <div style="background-color: #F4F4F5; border: 2px solid #000000; padding: 14px; margin-bottom: 20px;">
            <div style="font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 900; text-transform: uppercase; color: #000000; margin-bottom: 6px;">
              // JOIN_COMMUNITY_CHANNELS
            </div>
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #52525B;">
              Connect directly with fellow student cloud builders while you wait:
            </p>
            <table border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <a href="https://discord.gg/invite/awssbg" target="_blank" style="display: inline-block; background-color: #5865F2; color: #FFFFFF; font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 900; padding: 6px 12px; text-decoration: none; border: 1px solid #000000; margin-right: 6px;">
                    DISCORD &rarr;
                  </a>
                </td>
                <td>
                  <a href="https://chat.whatsapp.com/invite/awssbg" target="_blank" style="display: inline-block; background-color: #25D366; color: #000000; font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 900; padding: 6px 12px; text-decoration: none; border: 1px solid #000000;">
                    WHATSAPP &rarr;
                  </a>
                </td>
              </tr>
            </table>
          </div>
        </td></tr>
        <tr><td align="center" style="padding-bottom: 24px;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr><td align="center">
              <a href="https://awssbg.online" target="_blank" style="display: block; background-color: #000000; color: #FFFFFF; border: 2px solid #000000; box-shadow: 4px 4px 0px #7C3AED; font-family: 'Courier New', Courier, monospace; font-size: 13px; font-weight: 900; text-transform: uppercase; text-decoration: none; padding: 12px 20px; text-align: center;">
                EXPLORE AWS SBG HUB &rarr;
              </a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="border-top: 2px dashed #000000; padding-top: 14px;">
          <p style="margin: 0; font-family: 'Courier New', Courier, monospace; font-size: 10px; color: #71717A;">
            Official student cloud community powered by Amazon Web Services. Zero personal data sale guarantee.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildAuthAlertEmail(data: { type: "login" | "password_changed"; email: string; ip: string; userAgent: string; timestamp: string }) {
  const isLogin = data.type === "login";
  const title = isLogin ? "New Admin Sign-In" : "Password Changed";
  const badgeColor = isLogin ? "#2563EB" : "#10B981";
  const badgeText = isLogin ? "SIGN-IN DETECTED" : "SUCCESSFUL";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>${title}</title></head>
<body style="margin: 0; padding: 0; background-color: #F4F4F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F4F4F5; padding: 40px 15px;">
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
            ${isLogin ? `A new administrator sign-in was recorded for <strong>${data.email}</strong> on awssbg Admin.` : `The password for <strong>${data.email}</strong> was successfully updated.`}
          </p>
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F4F4F5; border: 2px solid #000000; padding: 12px; margin: 16px 0; font-family: 'Courier New', Courier, monospace; font-size: 12px;">
            <tr><td style="padding: 4px 0;"><strong>Timestamp:</strong> ${data.timestamp}</td></tr>
            <tr><td style="padding: 4px 0;"><strong>IP Address:</strong> ${data.ip}</td></tr>
            <tr><td style="padding: 4px 0;"><strong>User Agent:</strong> ${data.userAgent}</td></tr>
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
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Email Sender via Resend API ──
async function sendEmail(apiKey: string, payload: { from: string; to: string[]; subject: string; html: string; reply_to?: string }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Resend API failed (${res.status}): ${errorText}`);
  }

  return await res.json();
}

// ── Main Cloudflare Worker ──
export default {
  // 1. Inbound Cloudflare Email Routing Handler (enquiries@awssbg.online)
  async email(message: any, env: Env) {
    const recipient = env.ADMIN_NOTIFICATION_EMAIL || "lethabomabilo33@gmail.com";
    await message.forward(recipient);
  },

  // 2. HTTP Fetch Request Handler
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    const headers = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    };

    // Health / Status Check
    if (url.pathname === "/" || url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          status: "healthy",
          worker: "awssbg-email-worker",
          timestamp: new Date().toISOString(),
          enquiriesEmail: env.ENQUIRIES_EMAIL || "enquiries@awssbg.online",
          adminEmail: env.ADMIN_NOTIFICATION_EMAIL || "lethabomabilo33@gmail.com",
        }),
        { status: 200, headers }
      );
    }

    // Endpoint A: Dispatch Inquiries (Contact Form)
    if (url.pathname === "/api/send-inquiry" && request.method === "POST") {
      try {
        const body = (await request.json()) as {
          name: string;
          email: string;
          category: string;
          message: string;
        };

        const { name, email, category, message } = body;
        if (!name || !email || !message) {
          return new Response(
            JSON.stringify({ error: "Missing required fields (name, email, message)." }),
            { status: 400, headers }
          );
        }

        const timestamp = new Date().toUTCString();

        // 1. Send Alert to Admin & Enquiries inbox
        const apiKey = env.RESEND_API_KEY;
        if (apiKey) {
          // Send to Admin / Enquiries
          await sendEmail(apiKey, {
            from: "AWS SBG Inquiries <enquiries@awssbg.online>",
            to: [env.ENQUIRIES_EMAIL || "enquiries@awssbg.online", env.ADMIN_NOTIFICATION_EMAIL || "lethabomabilo33@gmail.com"],
            subject: `[AWS SBG Inquiry] ${category || "General"} from ${name}`,
            html: buildInquiryAdminEmail({ name, email, category: category || "General Inquiry", message, timestamp }),
            reply_to: email,
          });

          // Send Receipt Confirmation to Student
          await sendEmail(apiKey, {
            from: "AWS Student Builder Group <enquiries@awssbg.online>",
            to: [email],
            subject: `We Received Your Message — AWS Student Builder Group`,
            html: buildInquiryUserConfirmation({ name, category: category || "General Inquiry" }),
          });
        }

        return new Response(
          JSON.stringify({ success: true, message: "Inquiry emails dispatched successfully." }),
          { status: 200, headers }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ error: (err as Error).message }),
          { status: 500, headers }
        );
      }
    }

    // Endpoint B: Dispatch Auth Security Alerts (Sign-in, Password changed)
    if (url.pathname === "/api/send-auth-alert" && request.method === "POST") {
      try {
        const body = (await request.json()) as {
          type: "login" | "password_changed";
          email: string;
          ip?: string;
          userAgent?: string;
        };

        const { type, email, ip, userAgent } = body;
        if (!type || !email) {
          return new Response(
            JSON.stringify({ error: "Missing required fields (type, email)." }),
            { status: 400, headers }
          );
        }

        const apiKey = env.RESEND_API_KEY;
        if (apiKey) {
          const clientIp = ip || request.headers.get("cf-connecting-ip") || "Unknown IP";
          const clientUa = userAgent || request.headers.get("user-agent") || "Unknown Browser";
          const timestamp = new Date().toUTCString();

          const subject = type === "login"
            ? `Security Alert: New Sign-In on awssbg Admin`
            : `Security Notice: Admin Password Changed`;

          await sendEmail(apiKey, {
            from: "AWS SBG Security <notifications@awssbg.online>",
            to: [email],
            subject,
            html: buildAuthAlertEmail({ type, email, ip: clientIp, userAgent: clientUa, timestamp }),
          });
        }

        return new Response(
          JSON.stringify({ success: true, message: "Security alert dispatched." }),
          { status: 200, headers }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ error: (err as Error).message }),
          { status: 500, headers }
        );
      }
    }

    return new Response(JSON.stringify({ error: "Endpoint not found" }), { status: 404, headers });
  },
};
