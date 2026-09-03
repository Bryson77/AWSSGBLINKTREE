import { createClient } from "@supabase/supabase-js";
import { enforceRateLimit, RATE_LIMIT_RULES } from "@awssbg/shared/src/lib/rateLimit";

interface Env {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

// ── Magic Byte Sniffer for Image Validation (§11.4) ──

function detectValidImageType(buffer: Uint8Array): "image/webp" | "image/jpeg" | "image/png" | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  // WebP: RIFF ... WEBP (bytes 0-3 = "RIFF", bytes 8-11 = "WEBP")
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

export const onRequest = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 1. Rate limiting (dedicated 15 uploads / 10 min)
  const rateLimitError = enforceRateLimit(request, "upload", RATE_LIMIT_RULES.UPLOAD);
  if (rateLimitError) return rateLimitError;

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || "https://yzmgkreucvbftolijtpl.supabase.co";
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    return new Response(
      JSON.stringify({ error: "Storage service temporarily unconfigured." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // 2. Authentication check
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Unauthorized. Missing bearer token." }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const token = authHeader.replace("Bearer ", "").trim();
  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const {
    data: { user: caller },
    error: authError,
  } = await supabaseAdmin.auth.getUser(token);

  if (authError || !caller) {
    return new Response(
      JSON.stringify({ error: "Session expired. Please sign in again." }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // Verify caller profile for tenant isolation
  const { data: callerProfile } = await supabaseAdmin
    .from("admin_users")
    .select("role, is_super_admin, org_id")
    .eq("id", caller.id)
    .single();

  const isSuperAdmin =
    callerProfile?.is_super_admin === true ||
    callerProfile?.role === "superadmin" ||
    caller.email === "lethabomabilo33@gmail.com";

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const category = (formData.get("category") as string) || "general";
    const orgId = (formData.get("org_id") as string) || "tut";

    if (!file) {
      return new Response(
        JSON.stringify({ error: "No file provided in form data." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Enforce 20MB cap server-side
    const MAX_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return new Response(
        JSON.stringify({ error: "File exceeds 20MB size limit." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Magic-Byte sniffing (rejecting mismatched/fake extensions)
    const detectedMime = detectValidImageType(bytes);
    if (!detectedMime) {
      return new Response(
        JSON.stringify({ error: "Security rejection: Invalid file header. Only WebP, JPEG, and PNG are allowed." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Determine extension
    let ext = "webp";
    if (detectedMime === "image/jpeg") ext = "jpg";
    if (detectedMime === "image/png") ext = "png";

    // Randomized storage key
    const uniqueId = crypto.randomUUID();
    const cleanCategory = category.replace(/[^a-z0-9_-]/gi, "");
    let cleanOrg = orgId.replace(/[^a-z0-9_-]/gi, "");
    if (!isSuperAdmin && callerProfile?.org_id) {
      cleanOrg = callerProfile.org_id.replace(/[^a-z0-9_-]/gi, "");
    }
    const storagePath = `${cleanOrg}/${cleanCategory}/${uniqueId}.${ext}`;

    // Upload to Supabase Storage bucket `awssbg-media`
    const { error: uploadError } = await supabaseAdmin.storage
      .from("awssbg-media")
      .upload(storagePath, arrayBuffer, {
        contentType: detectedMime,
        cacheControl: "31536000",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: "Failed to save file to storage: " + uploadError.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get public CDN URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from("awssbg-media")
      .getPublicUrl(storagePath);

    return new Response(
      JSON.stringify({
        success: true,
        url: publicUrlData.publicUrl,
        path: storagePath,
        size: file.size,
        contentType: detectedMime,
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
    console.error("Upload error:", err);
    return new Response(
      JSON.stringify({ error: "Upload processing failed: " + (err as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
