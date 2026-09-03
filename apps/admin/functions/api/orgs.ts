import { createClient } from "@supabase/supabase-js";
import { enforceRateLimit, RATE_LIMIT_RULES } from "@awssbg/shared/src/lib/rateLimit";
import { logActivity } from "@awssbg/shared/src/lib/audit";
import { escapeHtml } from "@awssbg/shared/src/lib/sanitize";

interface Env {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  RESEND_API_KEY?: string;
}

function buildLeaderInviteEmail(data: {
  leaderName: string;
  leaderEmail: string;
  orgName: string;
  orgSlug: string;
  actionLink: string;
  inviterEmail: string;
}) {
  const safeName = escapeHtml(data.leaderName);
  const safeOrg = escapeHtml(data.orgName);
  const safeSlug = escapeHtml(data.orgSlug.toUpperCase());
  const safeInviter = escapeHtml(data.inviterEmail);

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Appointed Group Leader — AWS SBG @${safeSlug}</title></head>
<body style="margin: 0; padding: 0; background-color: #F4F4F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F4F4F5; padding: 40px 15px;">
    <tr><td align="center">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background-color: #FFFFFF; border: 3px solid #000000; box-shadow: 6px 6px 0px #000000; padding: 32px 28px;">
        <tr><td>
          <div style="display: inline-block; background-color: #000000; color: #FFFFFF; font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 900; letter-spacing: 2px; padding: 3px 8px; margin-bottom: 16px;">
            // AWS_SBG // SBG_ONBOARDING // ${safeSlug}
          </div>
          <h1 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 900; text-transform: uppercase; color: #000000; line-height: 1.1;">
            Welcome, Group Leader! <br>
            <span style="background-color: #7C3AED; color: #FFFFFF; padding: 2px 6px; border: 2px solid #000000; display: inline-block; margin-top: 4px;">
              AWS SBG @${safeSlug}
            </span>
          </h1>
        </td></tr>
        <tr><td style="padding: 16px 0 20px 0; color: #27272A; font-size: 14px; line-height: 1.6;">
          <p style="margin: 0 0 12px 0; font-weight: 500;">
            Hello <strong>${safeName}</strong>,
          </p>
          <p style="margin: 0 0 16px 0; color: #52525B;">
            You have been appointed as the official <strong>Group Leader</strong> for <strong>${safeOrg}</strong> on the AWS Student Builder Group Platform by <strong>${safeInviter}</strong>.
          </p>
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F4F4F5; border: 2px solid #000000; padding: 14px; margin-bottom: 20px; font-family: 'Courier New', Courier, monospace; font-size: 12px;">
            <tr><td style="padding: 4px 0;"><strong>SBG:</strong> ${safeOrg} (@${data.orgSlug})</td></tr>
            <tr><td style="padding: 4px 0;"><strong>Assigned Role:</strong> GROUP LEADER</td></tr>
            <tr><td style="padding: 4px 0;"><strong>Public Hub URL:</strong> https://awssbg.online/${data.orgSlug}</td></tr>
            <tr><td style="padding: 4px 0;"><strong>Admin Console:</strong> https://admin.awssbg.online</td></tr>
          </table>
          <p style="margin: 0 0 16px 0; font-size: 13px; color: #52525B;">
            Click below to activate your account, configure your password, and begin customizing your SBG&rsquo;s links, meetups, team bios, and announcements.
          </p>
        </td></tr>
        <tr><td align="center" style="padding-bottom: 24px;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr><td align="center">
              <a href="${data.actionLink}" target="_blank" style="display: block; background-color: #000000; color: #FFFFFF; border: 2px solid #000000; box-shadow: 4px 4px 0px #7C3AED; font-family: 'Courier New', Courier, monospace; font-size: 13px; font-weight: 900; text-transform: uppercase; text-decoration: none; padding: 14px 20px; text-align: center;">
                ACTIVATE SBG CONSOLE &rarr;
              </a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="border-top: 2px dashed #000000; padding-top: 14px;">
          <p style="margin: 0 0 6px 0; font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #71717A;">
            Direct verification URL:
          </p>
          <p style="margin: 0; word-break: break-all; font-family: 'Courier New', Courier, monospace; font-size: 10px; color: #7C3AED;">
            ${data.actionLink}
          </p>
        </td></tr>
      </table>
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; margin-top: 20px;">
        <tr><td align="center" style="font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 700; color: #71717A;">
          &copy; AWS STUDENT BUILDER GROUP &bull; &ldquo;BUILD. CERTIFY. CONNECT.&rdquo;
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
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  // Rate limiting
  const rateLimitError = enforceRateLimit(request, "org_creation", RATE_LIMIT_RULES.AUTH);
  if (rateLimitError) return rateLimitError;

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || "https://yzmgkreucvbftolijtpl.supabase.co";
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const resendApiKey = env.RESEND_API_KEY;

  if (!serviceKey) {
    return new Response(
      JSON.stringify({ error: "Storage/Auth service temporarily unconfigured." }),
      { status: 500, headers: corsHeaders }
    );
  }

  // Authenticate caller
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Unauthorized. Missing Bearer token." }),
      { status: 401, headers: corsHeaders }
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
      JSON.stringify({ error: "Unauthorized: Invalid or expired session." }),
      { status: 401, headers: corsHeaders }
    );
  }

  // Check if caller is Superadmin
  const { data: callerProfile } = await supabaseAdmin
    .from("admin_users")
    .select("*")
    .eq("id", caller.id)
    .single();

  const isSuperAdmin =
    callerProfile?.is_super_admin === true ||
    callerProfile?.role === "superadmin" ||
    caller.email === "lethabomabilo33@gmail.com";

  if (!isSuperAdmin) {
    return new Response(
      JSON.stringify({ error: "Forbidden: Superadmin privileges required to create new SBGs." }),
      { status: 403, headers: corsHeaders }
    );
  }

  try {
    const body = (await request.json()) as {
      name: string;
      slug: string;
      leader_email: string;
      leader_name?: string;
    };

    const { name, slug, leader_email, leader_name } = body;

    if (!name?.trim() || !slug?.trim() || !leader_email?.trim()) {
      return new Response(
        JSON.stringify({ error: "Organization name, slug, and leader email are required." }),
        { status: 400, headers: corsHeaders }
      );
    }

    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, "");
    if (!cleanSlug || cleanSlug.length < 2) {
      return new Response(
        JSON.stringify({ error: "Slug must contain at least 2 alphanumeric characters or hyphens." }),
        { status: 400, headers: corsHeaders }
      );
    }

    const cleanEmail = leader_email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return new Response(
        JSON.stringify({ error: "Please enter a valid email address for the leader." }),
        { status: 400, headers: corsHeaders }
      );
    }

    const cleanLeaderName = leader_name?.trim() || cleanEmail.split("@")[0];

    // Check if slug already exists
    const { data: existingOrg } = await supabaseAdmin
      .from("orgs")
      .select("id")
      .eq("slug", cleanSlug)
      .maybeSingle();

    if (existingOrg) {
      return new Response(
        JSON.stringify({ error: `An SBG with slug "${cleanSlug}" already exists.` }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 1. Create org
    const { data: newOrg, error: orgError } = await supabaseAdmin
      .from("orgs")
      .insert({
        name: name.trim(),
        slug: cleanSlug,
      })
      .select("*")
      .single();

    if (orgError || !newOrg) {
      return new Response(
        JSON.stringify({ error: "Failed to create organization: " + orgError?.message }),
        { status: 500, headers: corsHeaders }
      );
    }

    // 2. Create default org_settings
    const { error: settingsError } = await supabaseAdmin.from("org_settings").insert({
      org_id: newOrg.id,
      hero_title: `Build, Certify & Connect`,
      hero_subtitle: `AWS Student Builder Group @${cleanSlug.toUpperCase()}`,
      contact_recipient_email: cleanEmail,
    });

    if (settingsError) {
      console.warn("Could not insert default org_settings:", settingsError);
    }

    // 3. Generate Leader invite link
    const redirectUrl = "https://admin.awssbg.online/update-password";
    let actionLink = "";
    let userId = "";

    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "invite",
        email: cleanEmail,
        options: {
          data: {
            name: cleanLeaderName,
            role: "leader",
            org_id: newOrg.id,
          },
          redirectTo: redirectUrl,
        },
      });

    if (linkError) {
      if (
        linkError.message.includes("already been registered") ||
        linkError.message.includes("already exists")
      ) {
        const { data: recData, error: recError } =
          await supabaseAdmin.auth.admin.generateLink({
            type: "recovery",
            email: cleanEmail,
            options: { redirectTo: redirectUrl },
          });

        if (!recError && recData) {
          actionLink = recData.properties.action_link;
          userId = recData.user.id;
        }
      }
    } else if (linkData) {
      actionLink = linkData.properties.action_link;
      userId = linkData.user.id;
    }

    // 4. Upsert admin_user record for leader
    if (userId) {
      const { data: existingAdmin } = await supabaseAdmin
        .from("admin_users")
        .select("is_super_admin, role")
        .eq("id", userId)
        .maybeSingle();

      const preserveSuperAdmin =
        existingAdmin?.is_super_admin === true || existingAdmin?.role === "superadmin";

      await supabaseAdmin.from("admin_users").upsert({
        id: userId,
        email: cleanEmail,
        name: cleanLeaderName,
        role: preserveSuperAdmin ? "superadmin" : "leader",
        org_id: newOrg.id,
        is_super_admin: preserveSuperAdmin,
      });
    } else {
      console.warn("Could not generate auth user ID for leader invite:", linkError);
    }

    // 5. Write human-readable audit log
    await logActivity(supabaseAdmin, {
      org_id: newOrg.id,
      actor_id: caller.id,
      actor_name: callerProfile?.name || caller.email || "Superadmin",
      action: "org.created",
      entity_type: "org",
      entity_id: newOrg.id,
      summary: `Onboarded new SBG "${name}" (@${cleanSlug}) and assigned Leader "${cleanLeaderName}" (${cleanEmail})`,
    });

    // 6. Dispatch Leader Email via Resend
    let emailDispatched = false;
    if (resendApiKey && actionLink) {
      try {
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "AWS SBG Admin <notifications@awssbg.online>",
            to: [cleanEmail],
            reply_to: "enquiries@awssbg.online",
            subject: `You've Been Appointed Leader of AWS SBG @${cleanSlug.toUpperCase()}`,
            html: buildLeaderInviteEmail({
              leaderName: cleanLeaderName,
              leaderEmail: cleanEmail,
              orgName: name.trim(),
              orgSlug: cleanSlug,
              actionLink,
              inviterEmail: caller.email || "Superadmin",
            }),
          }),
        });

        if (resendRes.ok) {
          emailDispatched = true;
        }
      } catch (err) {
        console.error("Failed to send leader invite email:", err);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        org: newOrg,
        inviteLink: actionLink,
        emailDispatched,
      }),
      { status: 201, headers: corsHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Failed creating SBG: " + (err as Error).message }),
      { status: 400, headers: corsHeaders }
    );
  }
};
