import { createClient } from "@supabase/supabase-js";
import { inquirySchema } from "@awssbg/shared/src/schemas";
import { enforceRateLimit, RATE_LIMIT_RULES } from "@awssbg/shared/src/lib/rateLimit";
import { sanitizeContent, escapeHtml } from "@awssbg/shared/src/lib/sanitize";

interface Env {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  RESEND_API_KEY?: string;
  ADMIN_NOTIFICATION_EMAIL?: string;
  ENQUIRIES_EMAIL?: string;
}

// ── HTML Email Builders with Hardcore Neo-Brutalism Theme ──

function buildInquiryAdminEmail(data: {
  name: string;
  email: string;
  category: string;
  message: string;
  timestamp: string;
  orgName?: string;
}) {
  const safeName = escapeHtml(data.name);
  const safeCategory = escapeHtml(data.category);
  const safeMessage = escapeHtml(data.message);
  const safeOrg = data.orgName ? escapeHtml(data.orgName) : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>New Student Inquiry — AWS SBG</title></head>
<body style="margin: 0; padding: 0; background-color: #F4F4F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F4F4F5; padding: 40px 15px;">
    <tr><td align="center">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #FFFFFF; border: 3px solid #000000; box-shadow: 6px 6px 0px #000000; padding: 32px 28px;">
        <tr><td>
          <div style="display: inline-block; background-color: #000000; color: #FFFFFF; font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 900; letter-spacing: 2px; padding: 3px 8px; margin-bottom: 16px;">
            // AWS_SBG // CONTACT_DISPATCH${safeOrg ? ` // ${safeOrg.toUpperCase()}` : ""}
          </div>
          <h1 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 900; text-transform: uppercase; color: #000000; line-height: 1.1;">
            New Student Inquiry <br>
            <span style="background-color: #7C3AED; color: #FFFFFF; padding: 2px 6px; border: 2px solid #000000; display: inline-block; margin-top: 4px;">
              ${safeCategory}
            </span>
          </h1>
        </td></tr>
        <tr><td style="padding: 16px 0 20px 0;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F4F4F5; border: 2px solid #000000; padding: 14px; font-family: 'Courier New', Courier, monospace; font-size: 12px;">
            <tr><td style="padding: 4px 0;"><strong>Submitter:</strong> ${safeName}</td></tr>
            <tr><td style="padding: 4px 0;"><strong>Email:</strong> <a href="mailto:${escapeHtml(data.email)}" style="color: #7C3AED; font-weight: bold;">${escapeHtml(data.email)}</a></td></tr>
            <tr><td style="padding: 4px 0;"><strong>Category:</strong> ${safeCategory}</td></tr>
            ${safeOrg ? `<tr><td style="padding: 4px 0;"><strong>Group:</strong> ${safeOrg}</td></tr>` : ""}
            <tr><td style="padding: 4px 0;"><strong>Timestamp:</strong> ${escapeHtml(data.timestamp)}</td></tr>
          </table>
          <div style="margin-top: 16px;">
            <div style="font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 900; text-transform: uppercase; color: #52525B; margin-bottom: 6px;">
              // MESSAGE_CONTENT
            </div>
            <div style="background-color: #FFFFFF; border: 2px solid #000000; padding: 14px; font-size: 14px; line-height: 1.6; color: #000000; white-space: pre-wrap;">${safeMessage}</div>
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
            Dispatched securely via verified AWS SBG mail servers.
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
  const safeName = escapeHtml(data.name);
  const safeCategory = escapeHtml(data.category);

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
              ${safeName}
            </span>
          </h1>
        </td></tr>
        <tr><td style="padding: 16px 0 20px 0; color: #27272A; font-size: 14px; line-height: 1.6;">
          <p style="margin: 0 0 12px 0; font-weight: 500;">
            Thank you for contacting the <strong>AWS Student Builder Group (AWS SBG)</strong>. We have logged your message regarding <strong>${safeCategory}</strong>.
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
                  <a href="https://chat.whatsapp.com/CctGVCDhxhA8qcIZzHXpZg?s=cl&p=i&mlu=4&ilr=4" target="_blank" style="display: inline-block; background-color: #25D366; color: #000000; font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 900; padding: 6px 12px; text-decoration: none; border: 1px solid #000000; margin-right: 6px;">
                    WHATSAPP &rarr;
                  </a>
                </td>
                <td>
                  <a href="https://www.instagram.com/awsstudentbuildergroup_tut/" target="_blank" style="display: inline-block; background-color: #E1306C; color: #FFFFFF; font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 900; padding: 6px 12px; text-decoration: none; border: 1px solid #000000;">
                    INSTAGRAM &rarr;
                  </a>
                </td>
              </tr>
            </table>
          </div>
        </td></tr>
        <tr><td align="center" style="padding-bottom: 24px;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td align="center">
                <a href="https://awssbg.online" target="_blank" style="display: block; background-color: #000000; color: #FFFFFF; border: 2px solid #000000; box-shadow: 4px 4px 0px #7C3AED; font-family: 'Courier New', Courier, monospace; font-size: 13px; font-weight: 900; text-transform: uppercase; text-decoration: none; padding: 12px 20px; text-align: center;">
                  EXPLORE AWS SBG HUB &rarr;
                </a>
              </td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="border-top: 2px dashed #000000; padding-top: 14px;">
          <p style="margin: 0; font-family: 'Courier New', Courier, monospace; font-size: 10px; color: #71717A;">
            Official student cloud community powered by Amazon Web Services. Zero personal data sale guarantee.
          </p>
        </td></tr>
      </table>
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; margin-top: 20px;">
        <tr><td align="center" style="font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 700; color: #71717A;">
          &copy; AWS STUDENT BUILDER GROUP &bull; &ldquo;GO BUILD.&rdquo;
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Resend Email Dispatch Helper ──

async function sendViaResend(
  apiKey: string,
  payload: { from: string; to: string[]; subject: string; html: string; reply_to?: string }
) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Resend error (${res.status}): ${errorBody}`);
  }

  return await res.json();
}

// ── Cloudflare Pages Edge Function Handler ──

export const onRequest = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  // Handle CORS preflight
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

  // 1. Enforce Edge Rate Limiting (Cybersecurity Hardening: Max 5 per 10 min)
  const rateLimitError = enforceRateLimit(request, "inquiries", RATE_LIMIT_RULES.INQUIRIES);
  if (rateLimitError) {
    return rateLimitError;
  }

  try {
    const rawBody = await request.json();

    // 2. Enforce Strict Zod Schema Validation
    const validation = inquirySchema.safeParse(rawBody);
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed.",
          details: validation.error.flatten().fieldErrors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { name, email, category, message, org_id } = validation.data;

    // 3. Stored XSS Prevention / Sanitization
    const cleanName = sanitizeContent(name);
    const cleanEmail = email.toLowerCase().trim();
    const cleanCategory = sanitizeContent(category);
    const cleanMessage = sanitizeContent(message);
    const timestamp = new Date().toUTCString();

    // 4. Persist to Supabase inquiries table
    const supabaseUrl =
      env.NEXT_PUBLIC_SUPABASE_URL || "https://yzmgkreucvbftolijtpl.supabase.co";
    const supabaseKey =
      env.SUPABASE_SERVICE_ROLE_KEY ||
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6bWdrcmV1Y3ZiZnRvbGlqdHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyODc3NzcsImV4cCI6MjEwMzg2Mzc3N30.qvIN3i_hTOEclyULEZhUZg_8PbNC4xM277EOjvjH9OU";

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Resolve target organization id if not provided
    let targetOrgId = org_id;
    if (!targetOrgId) {
      const { data: tutOrg } = await supabase
        .from("orgs")
        .select("id")
        .eq("slug", "tut")
        .single();
      targetOrgId = tutOrg?.id;
    }

    let savedId: string | undefined;
    const { data: dbData, error: dbError } = await supabase
      .from("inquiries")
      .insert({
        org_id: targetOrgId,
        name: cleanName,
        email: cleanEmail,
        category: cleanCategory,
        message: cleanMessage,
        status: "unread",
      })
      .select("id")
      .single();

    if (dbError) {
      console.error("Supabase insert warning:", dbError.message);
    } else {
      savedId = dbData?.id;
    }

    // 5. Look up organization recipient email from org_settings
    let adminRecipientEmail = env.ADMIN_NOTIFICATION_EMAIL || "lethabomabilo33@gmail.com";
    if (targetOrgId) {
      const { data: settings } = await supabase
        .from("org_settings")
        .select("contact_recipient_email")
        .eq("org_id", targetOrgId)
        .single();
      if (settings?.contact_recipient_email) {
        adminRecipientEmail = settings.contact_recipient_email;
      }
    }

    // 6. Dispatch Formatted Emails via Resend
    const resendKey = env.RESEND_API_KEY;
    const enquiriesEmail = env.ENQUIRIES_EMAIL || "enquiries@awssbg.online";

    const emailResults: { admin?: any; student?: any; errors?: string[] } = {};
    const errors: string[] = [];

    if (resendKey) {
      // Dispatch A: Formatted Admin Alert
      try {
        emailResults.admin = await sendViaResend(resendKey, {
          from: "AWS SBG Inquiries <enquiries@awssbg.online>",
          to: [adminRecipientEmail, enquiriesEmail],
          reply_to: cleanEmail,
          subject: `[AWS SBG Inquiry] ${cleanCategory} from ${cleanName}`,
          html: buildInquiryAdminEmail({
            name: cleanName,
            email: cleanEmail,
            category: cleanCategory,
            message: cleanMessage,
            timestamp,
          }),
        });
      } catch (e) {
        const msg = `Failed admin email dispatch: ${(e as Error).message}`;
        console.error(msg);
        errors.push(msg);
      }

      // Dispatch B: Formatted Confirmation Receipt to Student
      try {
        emailResults.student = await sendViaResend(resendKey, {
          from: "AWS Student Builder Group <enquiries@awssbg.online>",
          to: [cleanEmail],
          subject: "We Received Your Message — AWS Student Builder Group",
          html: buildInquiryUserConfirmation({
            name: cleanName,
            category: cleanCategory,
          }),
        });
      } catch (e) {
        const msg = `Failed student confirmation dispatch: ${(e as Error).message}`;
        console.error(msg);
        errors.push(msg);
      }
    } else {
      console.warn("RESEND_API_KEY not configured. Email notifications skipped.");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Inquiry processed and dispatched successfully.",
        inquiryId: savedId,
        emails: {
          adminDispatched: !errors.some((e) => e.includes("admin")),
          studentDispatched: !errors.some((e) => e.includes("student")),
        },
        warnings: errors.length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    console.error("Inquiry handler failure:", err);
    return new Response(
      JSON.stringify({
        error: "Failed to process inquiry.",
        details: (err as Error).message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
};
