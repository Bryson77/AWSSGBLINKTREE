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
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  // Rate Limiting Enforcement
  const rateLimitRes = enforceRateLimit(request, "leads", RATE_LIMIT_RULES.SCANNER);
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

  // Check user context: Must be sponsor or admin
  const { data: adminProfile } = await supabaseAdmin
    .from("admin_users")
    .select("id, role, is_super_admin")
    .eq("id", user.id)
    .single();

  const { data: sponsorProfile } = await supabaseAdmin
    .from("event_users")
    .select("id, event_id, role, sponsor_company_id, name")
    .eq("id", user.id)
    .single();

  const isSuper = adminProfile?.is_super_admin || adminProfile?.role === "superadmin";

  // ── GET /api/leads: Return company's leads list ──
  if (request.method === "GET") {
    const url = new URL(request.url);
    const eventId = url.searchParams.get("event_id") || sponsorProfile?.event_id;
    let companyId = sponsorProfile?.sponsor_company_id;

    if (isSuper && url.searchParams.get("company_id")) {
      companyId = url.searchParams.get("company_id") || undefined;
    }

    if (!companyId && !isSuper) {
      return new Response(JSON.stringify({ error: "Forbidden: No sponsor company assigned to your profile" }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    let query = supabaseAdmin
      .from("sponsor_leads")
      .select(`
        id,
        event_id,
        sponsor_company_id,
        scanned_at,
        rating,
        notes,
        registration:event_registrations (
          id,
          first_name,
          last_name,
          email,
          affiliation_type,
          affiliation_detail,
          assigned_role
        )
      `)
      .order("scanned_at", { ascending: false });

    if (companyId) {
      query = query.eq("sponsor_company_id", companyId);
    }
    if (eventId) {
      query = query.eq("event_id", eventId);
    }

    const { data: leads, error: fetchErr } = await query;
    if (fetchErr) {
      return new Response(JSON.stringify({ error: fetchErr.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ leads: leads || [] }), {
      status: 200,
      headers: corsHeaders,
    });
  }

  // ── POST /api/leads: Capture or update a scanned lead ──
  if (request.method === "POST") {
    try {
      const body = await request.json();
      const { event_id, qr_token, rating, notes } = body;

      const companyId = sponsorProfile?.sponsor_company_id;
      if (!companyId && !isSuper) {
        return new Response(JSON.stringify({ error: "Forbidden: You are not assigned to a Sponsor Company" }), {
          status: 403,
          headers: corsHeaders,
        });
      }

      if (!event_id || !qr_token) {
        return new Response(JSON.stringify({ error: "Missing event_id or qr_token" }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      // Fetch Registration Record
      const { data: registration, error: regError } = await supabaseAdmin
        .from("event_registrations")
        .select("id, event_id, first_name, last_name, email, affiliation_type, affiliation_detail, status, popia_consent_given")
        .eq("event_id", event_id)
        .eq("qr_token", qr_token.trim())
        .single();

      if (regError || !registration) {
        return new Response(JSON.stringify({ error: "INVALID_TOKEN", message: "Attendee QR code invalid or not found." }), {
          status: 404,
          headers: corsHeaders,
        });
      }

      if (registration.status === "banned") {
        return new Response(JSON.stringify({ error: "MEMBER_BANNED", message: "Cannot capture lead: Attendee is flagged or banned." }), {
          status: 403,
          headers: corsHeaders,
        });
      }

      const cleanNotes = notes ? escapeHtml(notes.trim()) : null;
      const cleanRating = typeof rating === "number" && rating >= 1 && rating <= 5 ? rating : null;

      // Upsert Sponsor Lead Record (Consent record = scan log)
      const { data: leadRecord, error: upsertError } = await supabaseAdmin
        .from("sponsor_leads")
        .upsert(
          {
            event_id,
            sponsor_company_id: companyId,
            scanned_by_user_id: user.id,
            registration_id: registration.id,
            rating: cleanRating,
            notes: cleanNotes,
            scanned_at: new Date().toISOString(),
          },
          { onConflict: "sponsor_company_id,registration_id" }
        )
        .select()
        .single();

      if (upsertError) {
        return new Response(JSON.stringify({ error: "Failed to record lead in database" }), {
          status: 500,
          headers: corsHeaders,
        });
      }

      // Return Unlocked Lead Info (Strict POPIA compliance: Excludes student number and dietary restrictions)
      return new Response(
        JSON.stringify({
          success: true,
          lead: {
            id: leadRecord.id,
            first_name: registration.first_name,
            last_name: registration.last_name,
            email: registration.email,
            affiliation_type: registration.affiliation_type,
            affiliation_detail: registration.affiliation_detail,
            rating: cleanRating,
            notes: cleanNotes,
            scanned_at: leadRecord.scanned_at,
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

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: corsHeaders,
  });
};
