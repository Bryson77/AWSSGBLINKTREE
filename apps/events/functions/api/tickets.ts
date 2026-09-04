import { createClient } from "@supabase/supabase-js";
import { enforceRateLimit, RATE_LIMIT_RULES } from "@awssbg/shared/src/lib/rateLimit";
import { escapeHtml } from "@awssbg/shared/src/lib/sanitize";

interface Env {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  RESEND_API_KEY?: string;
}

// ── Secure High-Entropy Opaque Token Generator ──
function generateSecureToken(): string {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  const hex = Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
  return `sbg_live_${hex}`;
}

// ── HTML Email Builder for Neo-Brutalist E-Tickets ──
function buildETicketEmail(data: {
  attendeeName: string;
  eventTitle: string;
  venueName: string;
  eventDate: string;
  role: string;
  queueLine: number;
  qrToken: string;
  ticketUrl: string;
}) {
  const safeName = escapeHtml(data.attendeeName);
  const safeTitle = escapeHtml(data.eventTitle);
  const safeVenue = escapeHtml(data.venueName);
  const safeDate = escapeHtml(data.eventDate);
  const roleLabel = escapeHtml(data.role.toUpperCase());
  const queueDisplay = data.role === "VIP" ? "VIP FAST-TRACK LANE" : `LINE ${data.queueLine} (KEYCARD PICKUP)`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data.qrToken)}&bgcolor=FFFFFF&color=000000&margin=10`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Official E-Ticket — AWS SBG</title></head>
<body style="margin: 0; padding: 0; background-color: #F4F4F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F4F4F5; padding: 40px 15px;">
    <tr><td align="center">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #FFFFFF; border: 3px solid #000000; box-shadow: 8px 8px 0px #000000; padding: 32px 28px;">
        <tr><td>
          <div style="display: inline-block; background-color: #000000; color: #FFFFFF; font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 900; letter-spacing: 2px; padding: 3px 8px; margin-bottom: 16px;">
            // AWS_STUDENT_BUILDER_GROUP // OFFICIAL_PASS
          </div>
          <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 900; text-transform: uppercase; color: #000000; line-height: 1.1;">
            ${safeTitle}
          </h1>
          <div style="background-color: #7C3AED; color: #FFFFFF; font-family: 'Courier New', Courier, monospace; font-size: 12px; font-weight: 900; padding: 4px 8px; border: 2px solid #000000; display: inline-block; margin-bottom: 20px;">
            ${roleLabel} ENTRY PASS
          </div>
        </td></tr>

        <!-- QR Code Ticket Section -->
        <tr><td align="center" style="padding: 10px 0 24px 0;">
          <div style="display: inline-block; border: 3px solid #000000; background-color: #FFFFFF; padding: 14px; box-shadow: 4px 4px 0px #000000;">
            <img src="${qrImageUrl}" alt="Official Ticket QR" width="220" height="220" style="display: block; border: 1px solid #E4E4E7;" />
            <div style="margin-top: 10px; font-family: 'Courier New', Courier, monospace; font-size: 10px; font-weight: 800; color: #71717A;">
              SCAN AT VENUE REGISTRATION DESK
            </div>
          </div>
        </td></tr>

        <!-- Attendee & Logistics Details -->
        <tr><td>
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F4F4F5; border: 2px solid #000000; padding: 16px; margin-bottom: 20px; font-family: 'Courier New', Courier, monospace; font-size: 12px; line-height: 1.8;">
            <tr><td style="color: #71717A;">ATTENDEE:</td><td style="font-weight: 900; text-align: right; color: #000000;">${safeName}</td></tr>
            <tr><td style="color: #71717A;">VENUE:</td><td style="font-weight: 900; text-align: right; color: #000000;">${safeVenue}</td></tr>
            <tr><td style="color: #71717A;">DATE & TIME:</td><td style="font-weight: 900; text-align: right; color: #000000;">${safeDate}</td></tr>
            <tr style="border-top: 1px solid #000000;"><td style="color: #7C3AED; font-weight: 900; padding-top: 6px;">ASSIGNED QUEUE:</td><td style="font-weight: 900; text-align: right; color: #7C3AED; padding-top: 6px;">${queueDisplay}</td></tr>
          </table>
        </td></tr>

        <!-- Digital Pass Link Button -->
        <tr><td align="center" style="padding-bottom: 20px;">
          <a href="${data.ticketUrl}" target="_blank" style="display: block; background-color: #000000; color: #FFFFFF; border: 2px solid #000000; box-shadow: 4px 4px 0px #7C3AED; font-family: 'Courier New', Courier, monospace; font-size: 13px; font-weight: 900; text-transform: uppercase; text-decoration: none; padding: 14px 20px; text-align: center;">
            VIEW INTERACTIVE MOBILE PASS &rarr;
          </a>
        </td></tr>

        <!-- POPIA Sponsor Notice -->
        <tr><td style="border-top: 2px dashed #000000; padding-top: 14px; font-family: 'Courier New', Courier, monospace; font-size: 10px; color: #71717A; line-height: 1.5;">
          <p style="margin: 0 0 6px 0;">
            <strong>POPIA Privacy Notice:</strong> Presenting this badge to be scanned at official sponsor booths authorizes sharing your contact details for career and cloud networking. You will receive a summary of all sponsor scans after the event.
          </p>
          <p style="margin: 0;">
            &copy; AWS Student Builder Group. Powered by Amazon Web Services.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── HTML Email Builder for Capacity Rejections ──
function buildCapacityRejectionEmail(data: {
  attendeeName: string;
  eventTitle: string;
}) {
  const safeName = escapeHtml(data.attendeeName);
  const safeTitle = escapeHtml(data.eventTitle);

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Event Update — AWS SBG</title></head>
<body style="margin: 0; padding: 0; background-color: #F4F4F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F4F4F5; padding: 40px 15px;">
    <tr><td align="center">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #FFFFFF; border: 3px solid #000000; box-shadow: 6px 6px 0px #000000; padding: 32px 28px;">
        <tr><td>
          <div style="display: inline-block; background-color: #000000; color: #FFFFFF; font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 900; letter-spacing: 2px; padding: 3px 8px; margin-bottom: 16px;">
            // AWS_SBG // EVENT_NOTIFICATION
          </div>
          <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 900; text-transform: uppercase; color: #000000; line-height: 1.1;">
            Registration Capacity Reached <br>
            <span style="background-color: #F59E0B; color: #000000; padding: 2px 6px; border: 2px solid #000000; display: inline-block; margin-top: 4px; font-size: 14px;">
              ${safeTitle}
            </span>
          </h1>
        </td></tr>
        <tr><td style="padding: 16px 0 20px 0; color: #27272A; font-size: 14px; line-height: 1.6;">
          <p style="margin: 0 0 12px 0;">
            Hello <strong>${safeName}</strong>,
          </p>
          <p style="margin: 0 0 16px 0; color: #52525B;">
            Thank you for applying to attend <strong>${safeTitle}</strong>. Due to fire safety regulations and venue seat limits, our event has reached full capacity and we are unable to approve further registrations at this time.
          </p>
          <p style="margin: 0 0 16px 0; color: #52525B;">
            We have placed your application on our priority waitlist. If a seat opens up due to cancellations, we will immediately issue your ticket.
          </p>
          <div style="border: 2px solid #000000; background-color: #F4F4F5; padding: 14px; font-family: 'Courier New', Courier, monospace; font-size: 12px;">
            You can still join our community channels for live streams, workshop materials, and certification study groups:
            <br><br>
            &bull; <a href="https://awssbg.online" style="color: #7C3AED; font-weight: 900;">Official AWS SBG Hub &rarr;</a>
          </div>
        </td></tr>
        <tr><td style="border-top: 2px dashed #000000; padding-top: 14px; font-family: 'Courier New', Courier, monospace; font-size: 10px; color: #71717A;">
          &copy; AWS Student Builder Group. "GO BUILD."
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export const onRequest = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  // Rate Limiting Enforcement
  const rateLimitRes = enforceRateLimit(request, "tickets", RATE_LIMIT_RULES.WRITES);
  if (rateLimitRes) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: corsHeaders });
  }

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || "https://yzmgkreucvbftolijtpl.supabase.co";
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    return new Response(JSON.stringify({ error: "Missing server credentials" }), { status: 500, headers: corsHeaders });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
  }

  const token = authHeader.replace("Bearer ", "").trim();
  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401, headers: corsHeaders });
  }

  // Verify caller is admin
  const { data: adminProfile } = await supabaseAdmin
    .from("admin_users")
    .select("id, role, is_super_admin")
    .eq("id", user.id)
    .single();

  const isSuper = adminProfile?.is_super_admin || adminProfile?.role === "leader" || adminProfile?.role === "superadmin";

  if (!isSuper) {
    return new Response(JSON.stringify({ error: "Forbidden: Only community leaders can execute ticketing actions" }), {
      status: 403,
      headers: corsHeaders,
    });
  }

  try {
    const body = await request.json();
    const { action, event_id, registration_ids, role_overrides, queue_count } = body;

    if (!event_id || !action) {
      return new Response(JSON.stringify({ error: "Missing action or event_id" }), { status: 400, headers: corsHeaders });
    }

    // Fetch Event Details
    const { data: eventItem } = await supabaseAdmin
      .from("events")
      .select("id, title, venue_name, start_time")
      .eq("id", event_id)
      .single();

    if (!eventItem) {
      return new Response(JSON.stringify({ error: "Event not found" }), { status: 404, headers: corsHeaders });
    }

    // ── ACTION 1: Approve & Dispatch E-Tickets ──
    if (action === "approve_and_send") {
      if (!Array.isArray(registration_ids) || registration_ids.length === 0) {
        return new Response(JSON.stringify({ error: "No registrations selected" }), { status: 400, headers: corsHeaders });
      }

      const { data: attendees, error: fetchErr } = await supabaseAdmin
        .from("event_registrations")
        .select("id, first_name, last_name, email, assigned_role, assigned_queue, qr_token")
        .in("id", registration_ids);

      if (fetchErr || !attendees) {
        return new Response(JSON.stringify({ error: fetchErr?.message || "Failed to load attendees" }), {
          status: 500,
          headers: corsHeaders,
        });
      }

      const nowIso = new Date().toISOString();
      const updatedList: any[] = [];

      for (const att of attendees) {
        const qrToken = att.qr_token || generateSecureToken();
        const role = role_overrides?.[att.id] || att.assigned_role || "ATTENDEE";
        const queueLine = att.assigned_queue || 1;

        await supabaseAdmin
          .from("event_registrations")
          .update({
            status: "approved",
            assigned_role: role,
            qr_token: qrToken,
            ticket_sent_at: nowIso,
          })
          .eq("id", att.id);

        // Dispatch Email if RESEND_API_KEY is available
        if (env.RESEND_API_KEY) {
          const emailHtml = buildETicketEmail({
            attendeeName: `${att.first_name} ${att.last_name}`,
            eventTitle: eventItem.title,
            venueName: eventItem.venue_name,
            eventDate: new Date(eventItem.start_time).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            role,
            queueLine,
            qrToken,
            ticketUrl: `https://awssbg.online/ticket/${qrToken}`,
          });

          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${env.RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: "AWS Student Builder Group <notifications@awssbg.online>",
              to: [att.email],
              subject: `[CONFIRMED] Your Official E-Ticket for ${eventItem.title}`,
              html: emailHtml,
            }),
          }).catch((e) => console.error("Ticket email error:", e));
        }

        updatedList.push({ id: att.id, qrToken, role });
      }

      return new Response(
        JSON.stringify({ success: true, processed: updatedList.length, attendees: updatedList }),
        { status: 200, headers: corsHeaders }
      );
    }

    // ── ACTION 2: Lock & Balance Queues (Lines 1 to 4) ──
    if (action === "lock_queues") {
      const lineCount = Number(queue_count) || 4;

      const { data: approvedList, error: appErr } = await supabaseAdmin
        .from("event_registrations")
        .select("id, assigned_role")
        .eq("event_id", event_id)
        .eq("status", "approved");

      if (appErr || !approvedList) {
        return new Response(JSON.stringify({ error: appErr?.message || "Failed to load approved attendees" }), {
          status: 500,
          headers: corsHeaders,
        });
      }

      // Fisher-Yates Balanced Pseudo-Random Shuffle
      const attendeesToShuffle = approvedList.filter((a) => a.assigned_role !== "VIP");
      for (let i = attendeesToShuffle.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [attendeesToShuffle[i], attendeesToShuffle[j]] = [attendeesToShuffle[j], attendeesToShuffle[i]];
      }

      // Distribute evenly across 1..lineCount
      const distributionStats: Record<number, number> = {};
      for (let i = 1; i <= lineCount; i++) distributionStats[i] = 0;

      for (let i = 0; i < attendeesToShuffle.length; i++) {
        const assignedLine = (i % lineCount) + 1;
        distributionStats[assignedLine] = (distributionStats[assignedLine] || 0) + 1;
        await supabaseAdmin
          .from("event_registrations")
          .update({ assigned_queue: assignedLine })
          .eq("id", attendeesToShuffle[i].id);
      }

      // VIPs get dedicated lane (queue 0)
      const vips = approvedList.filter((a) => a.assigned_role === "VIP");
      for (const vip of vips) {
        await supabaseAdmin
          .from("event_registrations")
          .update({ assigned_queue: 0 })
          .eq("id", vip.id);
      }

      // Lock queues on Event record
      await supabaseAdmin
        .from("events")
        .update({ queue_count: lineCount, queues_locked: true })
        .eq("id", event_id);

      return new Response(
        JSON.stringify({
          success: true,
          totalApproved: approvedList.length,
          vipsCount: vips.length,
          distribution: distributionStats,
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // ── ACTION 3: Send Capacity Rejection Emails ──
    if (action === "send_capacity_rejections") {
      if (!Array.isArray(registration_ids) || registration_ids.length === 0) {
        return new Response(JSON.stringify({ error: "No registrations specified" }), { status: 400, headers: corsHeaders });
      }

      const { data: rejectedAttendees } = await supabaseAdmin
        .from("event_registrations")
        .select("id, first_name, last_name, email")
        .in("id", registration_ids);

      if (rejectedAttendees) {
        for (const rej of rejectedAttendees) {
          await supabaseAdmin
            .from("event_registrations")
            .update({ status: "rejected" })
            .eq("id", rej.id);

          if (env.RESEND_API_KEY) {
            const html = buildCapacityRejectionEmail({
              attendeeName: `${rej.first_name} ${rej.last_name}`,
              eventTitle: eventItem.title,
            });

            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${env.RESEND_API_KEY}`,
              },
              body: JSON.stringify({
                from: "AWS Student Builder Group <notifications@awssbg.online>",
                to: [rej.email],
                subject: `Event Update: Capacity Reached for ${eventItem.title}`,
                html,
              }),
            }).catch((e) => console.error("Rejection email error:", e));
          }
        }
      }

      return new Response(JSON.stringify({ success: true, count: rejectedAttendees?.length || 0 }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    // ── ACTION 4: 30-Day Sponsor Lead Data Retention Purge ──
    if (action === "purge_sponsor_leads") {
      if (!adminProfile?.is_super_admin) {
        return new Response(JSON.stringify({ error: "Forbidden: Superadmin authorization required for data retention purge" }), {
          status: 403,
          headers: corsHeaders,
        });
      }

      // Purge identifiable notes and scrub text from sponsor_leads
      const { error: purgeErr } = await supabaseAdmin
        .from("sponsor_leads")
        .update({ notes: "[PURGED PER 30-DAY RETENTION POLICY]" })
        .eq("event_id", event_id);

      if (purgeErr) {
        return new Response(JSON.stringify({ error: purgeErr.message }), { status: 500, headers: corsHeaders });
      }

      return new Response(JSON.stringify({ success: true, message: "Sponsor lead personal data purged successfully" }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
};
