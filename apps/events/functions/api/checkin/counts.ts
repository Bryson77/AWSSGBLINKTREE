import { createClient } from "@supabase/supabase-js";
import { enforceRateLimit, RATE_LIMIT_RULES } from "@awssbg/shared/src/lib/rateLimit";

interface Env {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
}

export const onRequest = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  // Rate Limiting Enforcement
  const rateLimitRes = enforceRateLimit(request, "checkin_counts", RATE_LIMIT_RULES.READS);
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

  const url = new URL(request.url);
  const eventId = url.searchParams.get("event_id");

  if (!eventId) {
    return new Response(JSON.stringify({ error: "Missing event_id" }), { status: 400, headers: corsHeaders });
  }

  const [{ count: checkedInCount }, { count: totalApprovedCount }] = await Promise.all([
    supabaseAdmin
      .from("event_registrations")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("checked_in", true),
    supabaseAdmin
      .from("event_registrations")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("status", "approved"),
  ]);

  return new Response(
    JSON.stringify({
      checkedIn: checkedInCount || 0,
      totalApproved: totalApprovedCount || 0,
    }),
    { status: 200, headers: corsHeaders }
  );
};
