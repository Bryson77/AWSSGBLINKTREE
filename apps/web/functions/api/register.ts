import { createClient } from "@supabase/supabase-js";
import { eventRegistrationSchema } from "@awssbg/shared/src/schemas";
import { enforceRateLimit, RATE_LIMIT_RULES } from "@awssbg/shared/src/lib/rateLimit";
import { escapeHtml } from "@awssbg/shared/src/lib/sanitize";

interface Env {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  RESEND_API_KEY?: string;
  ENQUIRIES_EMAIL?: string;
}

// ── HTML Email Builders for Participant Application Confirmations ──

function buildApplicationReceivedEmail(data: {
  name: string;
  eventTitle: string;
  venueName: string;
  startTime: string;
  status: "pending" | "waitlisted";
}) {
  const safeName = escapeHtml(data.name);
  const safeTitle = escapeHtml(data.eventTitle);
  const safeVenue = escapeHtml(data.venueName);
  const isWaitlist = data.status === "waitlisted";

  const dateStr = data.startTime
    ? new Date(data.startTime).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "TBA";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Application Received — AWS SBG</title></head>
<body style="margin: 0; padding: 0; background-color: #F4F4F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F4F4F5; padding: 40px 15px;">
    <tr><td align="center">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #FFFFFF; border: 3px solid #000000; box-shadow: 6px 6px 0px #000000; padding: 32px 28px;">
        <tr><td>
          <div style="display: inline-block; background-color: #000000; color: #FFFFFF; font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 900; letter-spacing: 2px; padding: 3px 8px; margin-bottom: 16px;">
            // AWS_SBG // APPLICATION_ACKNOWLEDGEMENT
          </div>
          <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 900; text-transform: uppercase; color: #000000; line-height: 1.1;">
            ${isWaitlist ? "Waitlist Application Recorded" : "Application Received"} <br>
            <span style="background-color: ${isWaitlist ? "#F59E0B" : "#7C3AED"}; color: ${isWaitlist ? "#000000" : "#FFFFFF"}; padding: 2px 6px; border: 2px solid #000000; display: inline-block; margin-top: 4px; font-size: 14px;">
              ${safeTitle}
            </span>
          </h1>
        </td></tr>
        <tr><td style="padding: 16px 0 20px 0; color: #27272A; font-size: 14px; line-height: 1.6;">
          <p style="margin: 0 0 12px 0;">
            Hello <strong>${safeName}</strong>,
          </p>
          ${
            isWaitlist
              ? `<p style="margin: 0 0 14px 0; color: #52525B;">
                  Thank you for applying to attend <strong>${safeTitle}</strong>. Our standard seating capacity has currently been reached. We have recorded your application on our <strong>priority waitlist</strong>.
                </p>
                <p style="margin: 0 0 14px 0; color: #52525B;">
                  As seats open up due to schedule adjustments or cancellations, we will immediately process and issue official e-tickets to waitlisted applicants.
                </p>`
              : `<p style="margin: 0 0 14px 0; color: #52525B;">
                  Thank you for submitting your application to attend <strong>${safeTitle}</strong>. We have received your registration details.
                </p>
                <p style="margin: 0 0 14px 0; color: #52525B;">
                  All applications are reviewed by the AWS Student Builder Group organizing committee. Once approved, you will receive an official <strong>e-ticket containing your entry QR code and keycard queue line assignment</strong>.
                </p>`
          }

          <div style="border: 2px solid #000000; background-color: #F4F4F5; padding: 14px; font-family: 'Courier New', Courier, monospace; font-size: 12px; margin: 20px 0;">
            <div style="font-weight: 900; margin-bottom: 6px; text-transform: uppercase;">// EVENT_OVERVIEW:</div>
            <div>&bull; <strong>Date:</strong> ${dateStr}</div>
            <div>&bull; <strong>Venue:</strong> ${safeVenue}</div>
            <div>&bull; <strong>Status:</strong> ${isWaitlist ? "WAITLISTED (PRIORITY QUEUE)" : "UNDER REVIEW (PENDING)"}</div>
          </div>

          <p style="margin: 0 0 8px 0; font-size: 12px; color: #71717A;">
            <strong>POPIA Privacy Notice:</strong> Your information is securely stored under POPIA. Sponsor lead scans at exhibition booths will grant those sponsors access to your contact information. You will be able to review all sponsor scans on your live ticket pass.
          </p>
        </td></tr>
        <tr><td style="border-top: 2px dashed #000000; padding-top: 14px; font-family: 'Courier New', Courier, monospace; font-size: 10px; color: #71717A;">
          &copy; AWS Student Builder Group. Powered by Amazon Web Services.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

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

export const onRequest = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  // Rate Limiting Enforcement
  const rateLimitRes = enforceRateLimit(request, "event_registration", RATE_LIMIT_RULES.INQUIRIES);
  if (rateLimitRes) {
    return new Response(JSON.stringify({ error: "Too many registration attempts. Please wait a few moments." }), {
      status: 429,
      headers: corsHeaders,
    });
  }

  try {
    const body = await request.json();
    const parsed = eventRegistrationSchema.parse(body);

    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || "https://yzmgkreucvbftolijtpl.supabase.co";
    const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceKey) {
      return new Response(JSON.stringify({ error: "Server configuration missing" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // 1. Fetch Event Details
    const { data: event, error: eventErr } = await supabase
      .from("events")
      .select("id, title, status, capacity_limit, waitlist_enabled, venue_name, start_time")
      .eq("id", parsed.event_id)
      .single();

    if (eventErr || !event) {
      return new Response(JSON.stringify({ error: "Event not found or invalid" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    if (event.status !== "published") {
      return new Response(JSON.stringify({ error: "Registration is not open for this event" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // 2. Count current approved/pending registrations
    const { count, error: countErr } = await supabase
      .from("event_registrations")
      .select("id", { count: "exact", head: true })
      .eq("event_id", parsed.event_id)
      .neq("status", "rejected")
      .neq("status", "banned");

    if (countErr) {
      throw new Error(`Failed checking capacity: ${countErr.message}`);
    }

    const currentCount = count || 0;
    const isAtCapacity = currentCount >= event.capacity_limit;

    if (isAtCapacity && !event.waitlist_enabled) {
      return new Response(
        JSON.stringify({ error: "Event has reached maximum capacity and the waitlist is closed." }),
        { status: 400, headers: corsHeaders }
      );
    }

    const initialStatus = isAtCapacity ? "waitlisted" : "pending";

    // 3. Generate high-entropy opaque QR token
    const arr = new Uint8Array(24);
    crypto.getRandomValues(arr);
    const qrToken = `sbg_live_${Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("")}`;

    // 4. Insert registration
    const { data: inserted, error: insertErr } = await supabase
      .from("event_registrations")
      .insert({
        ...parsed,
        status: initialStatus,
        assigned_role: "ATTENDEE",
        qr_token: qrToken,
      })
      .select("id, status")
      .single();

    if (insertErr) {
      if (insertErr.code === "23505" || insertErr.message.includes("unique")) {
        return new Response(
          JSON.stringify({ error: "This email address has already submitted an application for this event." }),
          { status: 409, headers: corsHeaders }
        );
      }
      throw insertErr;
    }

    // 5. Dispatch Application Confirmation to Applicant (Resend)
    // NOTE: Strictly never send admin alerts for registrations per PRD
    if (env.RESEND_API_KEY) {
      try {
        const fromEmail = "AWS Student Builder Group <enquiries@awssbg.online>";
        const subject =
          initialStatus === "waitlisted"
            ? `Waitlist Application Confirmed: ${event.title}`
            : `Application Received: ${event.title}`;

        await sendViaResend(env.RESEND_API_KEY, {
          from: fromEmail,
          to: [parsed.email],
          reply_to: env.ENQUIRIES_EMAIL || "enquiries@awssbg.online",
          subject,
          html: buildApplicationReceivedEmail({
            name: `${parsed.first_name} ${parsed.last_name}`,
            eventTitle: event.title,
            venueName: event.venue_name || "TBA",
            startTime: event.start_time || "",
            status: initialStatus,
          }),
        });
      } catch (emailErr) {
        console.error("Non-fatal email dispatch failure:", emailErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: initialStatus,
        message:
          initialStatus === "waitlisted"
            ? "Your application has been placed on the priority waitlist."
            : "Your application has been received and is under review.",
      }),
      { status: 201, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error("Registration error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "An unexpected error occurred while processing registration." }),
      { status: 400, headers: corsHeaders }
    );
  }
};
