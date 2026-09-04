import { createClient } from "@supabase/supabase-js";
import { enforceRateLimit, RATE_LIMIT_RULES } from "@awssbg/shared/src/lib/rateLimit";
import { escapeHtml } from "@awssbg/shared/src/lib/sanitize";

interface Env {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  RESEND_API_KEY?: string;
}

function buildEventRoleInviteEmail(data: {
  inviteeName: string;
  role: "event_staff" | "sponsor";
  companyName?: string;
  eventTitle: string;
  actionLink: string;
}) {
  const safeName = escapeHtml(data.inviteeName);
  const safeTitle = escapeHtml(data.eventTitle);
  const roleLabel = data.role === "sponsor" ? "SPONSOR BOOTH SCANNER" : "EVENT CHECK-IN STAFF";
  const safeCompany = data.companyName ? escapeHtml(data.companyName) : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Event Access — AWS SBG</title></head>
<body style="margin: 0; padding: 0; background-color: #F4F4F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F4F4F5; padding: 40px 15px;">
    <tr><td align="center">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #FFFFFF; border: 3px solid #000000; box-shadow: 6px 6px 0px #000000; padding: 32px 28px;">
        <tr><td>
          <div style="display: inline-block; background-color: #000000; color: #FFFFFF; font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 900; letter-spacing: 2px; padding: 3px 8px; margin-bottom: 16px;">
            // AWS_SBG // EVENT_OPERATIONS
          </div>
          <h1 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 900; text-transform: uppercase; color: #000000; line-height: 1.1;">
            Access Credential <br>
            <span style="background-color: #7C3AED; color: #FFFFFF; padding: 2px 6px; border: 2px solid #000000; display: inline-block; margin-top: 4px;">
              ${roleLabel}
            </span>
          </h1>
        </td></tr>
        <tr><td style="padding: 16px 0 20px 0; color: #27272A; font-size: 14px; line-height: 1.6;">
          <p style="margin: 0 0 12px 0; font-weight: 500;">
            Hello <strong>${safeName}</strong>,
          </p>
          <p style="margin: 0 0 16px 0; color: #52525B;">
            You have been assigned access to <strong>${safeTitle}</strong> as <strong>${roleLabel}</strong>${safeCompany ? ` representing <strong>${safeCompany}</strong>` : ""}.
          </p>
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F4F4F5; border: 2px solid #000000; padding: 14px; margin-bottom: 20px; font-family: 'Courier New', Courier, monospace; font-size: 12px;">
            <tr><td style="padding: 4px 0;"><strong>Role:</strong> ${roleLabel}</td></tr>
            ${safeCompany ? `<tr><td style="padding: 4px 0;"><strong>Company:</strong> ${safeCompany}</td></tr>` : ""}
            <tr><td style="padding: 4px 0;"><strong>Event:</strong> ${safeTitle}</td></tr>
            <tr><td style="padding: 4px 0;"><strong>Console:</strong> https://events.awssbg.online</td></tr>
          </table>
          <p style="margin: 0 0 16px 0; font-size: 13px; color: #52525B;">
            Click the button below to activate your scanner account and set your password.
          </p>
        </td></tr>
        <tr><td align="center" style="padding-bottom: 24px;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr><td align="center">
              <a href="${data.actionLink}" target="_blank" style="display: block; background-color: #000000; color: #FFFFFF; border: 2px solid #000000; box-shadow: 4px 4px 0px #7C3AED; font-family: 'Courier New', Courier, monospace; font-size: 13px; font-weight: 900; text-transform: uppercase; text-decoration: none; padding: 14px 20px; text-align: center;">
                ACTIVATE SCANNER ACCESS &rarr;
              </a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="border-top: 2px dashed #000000; padding-top: 14px;">
          <p style="margin: 0 0 6px 0; font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #71717A;">
            Direct setup link:
          </p>
          <p style="margin: 0; word-break: break-all; font-family: 'Courier New', Courier, monospace; font-size: 10px; color: #7C3AED;">
            ${data.actionLink}
          </p>
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
    "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  // Rate Limiting Enforcement
  const rateLimitRes = enforceRateLimit(request, "event_users", RATE_LIMIT_RULES.WRITES);
  if (rateLimitRes) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
      status: 429,
      headers: corsHeaders,
    });
  }

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || "https://yzmgkreucvbftolijtpl.supabase.co";
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    return new Response(JSON.stringify({ error: "Missing server credentials" }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  const token = authHeader.replace("Bearer ", "").trim();
  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Invalid session" }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  // Verify caller is admin
  const { data: adminProfile } = await supabaseAdmin
    .from("admin_users")
    .select("id, role, is_super_admin")
    .eq("id", user.id)
    .single();

  const isSuper = adminProfile?.is_super_admin || adminProfile?.role === "leader" || adminProfile?.role === "superadmin";

  if (!isSuper) {
    return new Response(JSON.stringify({ error: "Forbidden: Only community leaders can invite staff or sponsors" }), {
      status: 403,
      headers: corsHeaders,
    });
  }

  // ── GET: List event users for an event ──
  if (request.method === "GET") {
    const url = new URL(request.url);
    const eventId = url.searchParams.get("event_id");

    if (!eventId) {
      return new Response(JSON.stringify({ error: "Missing event_id" }), { status: 400, headers: corsHeaders });
    }

    const { data: users, error: listErr } = await supabaseAdmin
      .from("event_users")
      .select("id, event_id, sponsor_company_id, email, name, role, created_at")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (listErr) {
      return new Response(JSON.stringify({ error: listErr.message }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ users: users || [] }), { status: 200, headers: corsHeaders });
  }

  // ── POST: Invite new staff volunteer or sponsor rep ──
  if (request.method === "POST") {
    try {
      const body = await request.json();
      const { event_id, sponsor_company_id, email, name, role } = body;

      if (!event_id || !email || !role || !["event_staff", "sponsor"].includes(role)) {
        return new Response(JSON.stringify({ error: "Invalid parameters" }), { status: 400, headers: corsHeaders });
      }

      // Fetch Event Title
      const { data: eventItem } = await supabaseAdmin
        .from("events")
        .select("title")
        .eq("id", event_id)
        .single();

      let companyName = "";
      if (sponsor_company_id) {
        const { data: comp } = await supabaseAdmin
          .from("sponsor_companies")
          .select("name")
          .eq("id", sponsor_company_id)
          .single();
        companyName = comp?.name || "";
      }

      // Generate Supabase Auth Invite Link pointing to events update-password
      const redirectUrl = "https://events.awssbg.online/update-password";
      const { data: linkData, error: inviteErr } = await supabaseAdmin.auth.admin.generateLink({
        type: "invite",
        email: email.trim().toLowerCase(),
        options: { redirectTo: redirectUrl },
      });

      if (inviteErr) {
        return new Response(JSON.stringify({ error: inviteErr.message }), { status: 400, headers: corsHeaders });
      }

      const invitedUserId = linkData.user.id;
      const actionLink = linkData.properties?.action_link || "";

      // Upsert into event_users table
      const { error: eventUserErr } = await supabaseAdmin.from("event_users").upsert({
        id: invitedUserId,
        event_id,
        sponsor_company_id: sponsor_company_id || null,
        email: email.trim().toLowerCase(),
        name: name?.trim() || email.split("@")[0],
        role,
      });

      if (eventUserErr) {
        return new Response(JSON.stringify({ error: eventUserErr.message }), { status: 500, headers: corsHeaders });
      }

      // Dispatch Email via Resend if RESEND_API_KEY is configured
      if (env.RESEND_API_KEY && actionLink) {
        const emailHtml = buildEventRoleInviteEmail({
          inviteeName: name || email.split("@")[0],
          role,
          companyName,
          eventTitle: eventItem?.title || "AWS SBG Community Day",
          actionLink,
        });

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "AWS SBG Events <notifications@awssbg.online>",
            to: [email.trim().toLowerCase()],
            subject: `[AWS SBG] ${role === "sponsor" ? "Sponsor Scanner" : "Staff Check-In"} Invitation — ${eventItem?.title || "Community Day"}`,
            html: emailHtml,
          }),
        }).catch((e) => console.error("Resend error:", e));
      }

      return new Response(
        JSON.stringify({
          success: true,
          inviteLink: actionLink,
          user: {
            id: invitedUserId,
            email,
            name,
            role,
          },
        }),
        { status: 200, headers: corsHeaders }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  }

  // ── DELETE: Remove event user access ──
  if (request.method === "DELETE") {
    try {
      const body = await request.json();
      const { user_id, event_id } = body;

      if (!user_id || !event_id) {
        return new Response(JSON.stringify({ error: "Missing user_id or event_id" }), { status: 400, headers: corsHeaders });
      }

      await supabaseAdmin.from("event_users").delete().eq("id", user_id).eq("event_id", event_id);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders });
};
