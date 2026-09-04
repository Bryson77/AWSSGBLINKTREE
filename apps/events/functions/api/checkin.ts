import { createClient } from "@supabase/supabase-js";
import { enforceRateLimit, RATE_LIMIT_RULES } from "@awssbg/shared/src/lib/rateLimit";
import { escapeHtml } from "@awssbg/shared/src/lib/sanitize";

interface Env {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
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

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  // Rate Limiting Enforcement (Scanner: max 120 per min per IP)
  const rateLimitRes = enforceRateLimit(request, "checkin", RATE_LIMIT_RULES.SCANNER);
  if (rateLimitRes) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment." }), {
      status: 429,
      headers: corsHeaders,
    });
  }

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || "https://yzmgkreucvbftolijtpl.supabase.co";
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    return new Response(JSON.stringify({ error: "Server service configuration missing" }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  // Verify Bearer Auth Token
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized: Missing authentication token" }), {
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
    return new Response(JSON.stringify({ error: "Invalid or expired session token" }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  try {
    const body = await request.json();
    const { event_id, qr_token, allow_override, action, ban_reason } = body;

    if (!event_id || !qr_token) {
      return new Response(JSON.stringify({ error: "Missing event_id or qr_token" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Verify caller role: Must be either admin or assigned event_staff
    const { data: adminProfile } = await supabaseAdmin
      .from("admin_users")
      .select("id, role, is_super_admin")
      .eq("id", user.id)
      .single();

    const { data: staffProfile } = await supabaseAdmin
      .from("event_users")
      .select("id, role, name")
      .eq("id", user.id)
      .eq("event_id", event_id)
      .single();

    const isAuthorized =
      adminProfile?.is_super_admin ||
      adminProfile?.role === "leader" ||
      adminProfile?.role === "superadmin" ||
      staffProfile?.role === "event_staff";

    if (!isAuthorized) {
      return new Response(
        JSON.stringify({ error: "Forbidden: You do not have Staff Check-In permissions for this event" }),
        { status: 403, headers: corsHeaders }
      );
    }

    const scannerName = staffProfile?.name || adminProfile?.role || user.email;

    // Fetch Registration Record
    const { data: registration, error: regError } = await supabaseAdmin
      .from("event_registrations")
      .select("id, event_id, first_name, last_name, status, assigned_role, assigned_queue, checked_in, checked_in_at, checked_in_by, ban_reason")
      .eq("event_id", event_id)
      .eq("qr_token", qr_token.trim())
      .single();

    if (regError || !registration) {
      return new Response(JSON.stringify({ error: "INVALID_TOKEN", message: "Ticket not found or invalid QR code." }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    // Handle Ban Check
    if (registration.status === "banned") {
      await supabaseAdmin.from("checkin_logs").insert({
        event_id,
        registration_id: registration.id,
        scanned_by_user_id: user.id,
        scan_status: "banned_rejected",
      });

      return new Response(
        JSON.stringify({
          error: "MEMBER_BANNED",
          message: "ENTRY DENIED: This attendee has been revoked/banned from the event.",
          ban_reason: registration.ban_reason || "Violation of Code of Conduct",
          attendee: {
            first_name: registration.first_name,
            last_name: registration.last_name,
            assigned_role: registration.assigned_role,
          },
        }),
        { status: 403, headers: corsHeaders }
      );
    }

    // Handle Staff Action: Ban Member
    if (action === "ban") {
      const sanitizedReason = escapeHtml(ban_reason || "Revoked by event desk");
      await supabaseAdmin
        .from("event_registrations")
        .update({
          status: "banned",
          ban_reason: sanitizedReason,
          banned_by: user.id,
          banned_at: new Date().toISOString(),
        })
        .eq("id", registration.id);

      await supabaseAdmin.from("checkin_logs").insert({
        event_id,
        registration_id: registration.id,
        scanned_by_user_id: user.id,
        scan_status: "banned_rejected",
      });

      return new Response(
        JSON.stringify({
          success: true,
          action: "banned",
          message: `Attendee ${registration.first_name} ${registration.last_name} has been banned and QR revoked.`,
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Handle Anti-Passback / Double Check-In Detection
    if (registration.checked_in && !allow_override) {
      // Find staff who scanned previously
      let previousStaffName = "Staff Desk";
      if (registration.checked_in_by) {
        const { data: prevStaff } = await supabaseAdmin
          .from("event_users")
          .select("name")
          .eq("id", registration.checked_in_by)
          .single();
        if (prevStaff?.name) previousStaffName = prevStaff.name;
      }

      await supabaseAdmin.from("checkin_logs").insert({
        event_id,
        registration_id: registration.id,
        scanned_by_user_id: user.id,
        scan_status: "duplicate_rejected",
      });

      return new Response(
        JSON.stringify({
          error: "ALREADY_CHECKED_IN",
          message: "PASS-BACK DETECTED: This badge was already checked in.",
          checked_in_at: registration.checked_in_at,
          checked_in_by_name: previousStaffName,
          attendee: {
            first_name: registration.first_name,
            last_name: registration.last_name,
            assigned_role: registration.assigned_role,
            assigned_queue: registration.assigned_queue,
          },
        }),
        { status: 409, headers: corsHeaders }
      );
    }

    // Execute Valid Check-In
    const nowIso = new Date().toISOString();
    const scanStatus = registration.checked_in ? "duplicate_overridden" : "valid_first_entry";

    const { error: updateError } = await supabaseAdmin
      .from("event_registrations")
      .update({
        checked_in: true,
        checked_in_at: registration.checked_in_at || nowIso,
        checked_in_by: user.id,
      })
      .eq("id", registration.id);

    if (updateError) {
      return new Response(JSON.stringify({ error: "Failed to record check-in in database" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    // Append Checkin Audit Log
    await supabaseAdmin.from("checkin_logs").insert({
      event_id,
      registration_id: registration.id,
      scanned_by_user_id: user.id,
      scan_status: scanStatus,
      scanned_at: nowIso,
    });

    // Return Sanitized Attendee Payload (Strict POPIA Data Minimization: Zero Student IDs or Emails exposed on scanner)
    return new Response(
      JSON.stringify({
        success: true,
        is_override: Boolean(allow_override && registration.checked_in),
        attendee: {
          id: registration.id,
          first_name: registration.first_name,
          last_name: registration.last_name,
          assigned_role: registration.assigned_role,
          assigned_queue: registration.assigned_queue ?? 1,
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
};
