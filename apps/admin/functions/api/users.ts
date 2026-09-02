import { createClient } from "@supabase/supabase-js";

interface Env {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  RESEND_API_KEY?: string;
}

// ── HTML Email Builder for Admin Team Invitations (Hardcore Neo-Brutalism) ──

function buildAdminInviteEmail(data: {
  inviteeName: string;
  inviterEmail: string;
  role: string;
  actionLink: string;
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Admin Invitation — AWS SBG</title></head>
<body style="margin: 0; padding: 0; background-color: #F4F4F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F4F4F5; padding: 40px 15px;">
    <tr><td align="center">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #FFFFFF; border: 3px solid #000000; box-shadow: 6px 6px 0px #000000; padding: 32px 28px;">
        <tr><td>
          <div style="display: inline-block; background-color: #000000; color: #FFFFFF; font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 900; letter-spacing: 2px; padding: 3px 8px; margin-bottom: 16px;">
            // AWS_SBG // ACCESS_AUTHORIZATION
          </div>
          <h1 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 900; text-transform: uppercase; color: #000000; line-height: 1.1;">
            Team Invitation <br>
            <span style="background-color: #7C3AED; color: #FFFFFF; padding: 2px 6px; border: 2px solid #000000; display: inline-block; margin-top: 4px;">
              ${data.role.toUpperCase()}
            </span>
          </h1>
        </td></tr>
        <tr><td style="padding: 16px 0 20px 0; color: #27272A; font-size: 14px; line-height: 1.6;">
          <p style="margin: 0 0 12px 0; font-weight: 500;">
            Hello <strong>${data.inviteeName}</strong>,
          </p>
          <p style="margin: 0 0 16px 0; color: #52525B;">
            You have been granted access to the <strong>AWS Student Builder Group Admin Console</strong> by <strong>${data.inviterEmail}</strong>.
          </p>
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F4F4F5; border: 2px solid #000000; padding: 14px; margin-bottom: 20px; font-family: 'Courier New', Courier, monospace; font-size: 12px;">
            <tr><td style="padding: 4px 0;"><strong>Assigned Role:</strong> ${data.role}</td></tr>
            <tr><td style="padding: 4px 0;"><strong>Console URL:</strong> https://admin.awssbg.online</td></tr>
            <tr><td style="padding: 4px 0;"><strong>Security Level:</strong> Supervised Team Member</td></tr>
          </table>
          <p style="margin: 0 0 16px 0; font-size: 13px; color: #52525B;">
            Click the button below to accept your invitation, verify your credentials, and configure your password.
          </p>
        </td></tr>
        <tr><td align="center" style="padding-bottom: 24px;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr><td align="center">
              <a href="${data.actionLink}" target="_blank" style="display: block; background-color: #000000; color: #FFFFFF; border: 2px solid #000000; box-shadow: 4px 4px 0px #7C3AED; font-family: 'Courier New', Courier, monospace; font-size: 13px; font-weight: 900; text-transform: uppercase; text-decoration: none; padding: 14px 20px; text-align: center;">
                ACCEPT INVITATION &rarr;
              </a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="border-top: 2px dashed #000000; padding-top: 14px;">
          <p style="margin: 0 0 6px 0; font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #71717A;">
            If the button does not work, copy and paste this direct verification link into your browser:
          </p>
          <p style="margin: 0; word-break: break-all; font-family: 'Courier New', Courier, monospace; font-size: 10px; color: #7C3AED;">
            ${data.actionLink}
          </p>
        </td></tr>
        <tr><td style="border-top: 2px dashed #000000; padding-top: 14px; margin-top: 14px;">
          <p style="margin: 0; font-family: 'Courier New', Courier, monospace; font-size: 10px; color: #71717A;">
            Official student cloud community powered by Amazon Web Services. Zero personal data sale guarantee.
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

// ── Cloudflare Pages Edge Function Handler ──

export const onRequest = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  // Enable CORS for admin dashboard
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  const supabaseUrl =
    env.NEXT_PUBLIC_SUPABASE_URL || "https://yzmgkreucvbftolijtpl.supabase.co";
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const resendApiKey = env.RESEND_API_KEY;

  if (!serviceKey) {
    return new Response(
      JSON.stringify({ error: "Server authentication service is temporarily unavailable." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Unauthorized. Missing Bearer token." }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const token = authHeader.replace("Bearer ", "").trim();

  // Create admin client with service role key
  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Verify caller identity via JWT
  const {
    data: { user: caller },
    error: authError,
  } = await supabaseAdmin.auth.getUser(token);

  if (authError || !caller) {
    return new Response(
      JSON.stringify({
        error: "Your session has expired. Please sign out and sign back in.",
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // Superadmin authorization check
  const isSuperAdmin =
    (caller as unknown as { is_super_admin?: boolean }).is_super_admin === true ||
    caller.email === "lethabomabilo33@gmail.com" ||
    caller.app_metadata?.role === "superadmin";

  if (!isSuperAdmin) {
    return new Response(
      JSON.stringify({ error: "Access restricted: Superadmin builder privileges required." }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // ── Handle GET (List Users) ──
  if (request.method === "GET") {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 100,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const sanitizedUsers = data.users.map((u) => {
      const isSuper =
        (u as unknown as { is_super_admin?: boolean }).is_super_admin === true ||
        u.email === "lethabomabilo33@gmail.com";
      return {
        id: u.id,
        email: u.email || "",
        name:
          (u.user_metadata?.name as string) ||
          u.email?.split("@")[0] ||
          "Admin",
        role:
          (u.app_metadata?.role as string) || (isSuper ? "superadmin" : "admin"),
        is_super_admin: isSuper,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at || null,
      };
    });

    return new Response(JSON.stringify({ users: sanitizedUsers }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── Handle POST (Invite User via Resend) ──
  if (request.method === "POST") {
    try {
      const body = (await request.json()) as {
        email: string;
        name: string;
        role?: string;
      };
      const { email, name, role } = body;

      if (!email || !email.includes("@")) {
        return new Response(
          JSON.stringify({ error: "Valid email address is required." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const targetEmail = email.toLowerCase().trim();
      const targetName = name?.trim() || targetEmail.split("@")[0];
      const targetRole = role || "admin";
      const redirectUrl = "https://admin.awssbg.online";

      // 1. Generate secure invite verification link from Supabase Auth
      let actionLink = "";
      let userId = "";

      const { data: linkData, error: linkError } =
        await supabaseAdmin.auth.admin.generateLink({
          type: "invite",
          email: targetEmail,
          options: {
            data: {
              name: targetName,
              role: targetRole,
            },
            redirectTo: redirectUrl,
          },
        });

      if (linkError) {
        // If user already exists in auth, fallback to generating a recovery or magic link
        if (
          linkError.message.includes("already been registered") ||
          linkError.message.includes("already exists")
        ) {
          const { data: recoveryData, error: recoveryError } =
            await supabaseAdmin.auth.admin.generateLink({
              type: "recovery",
              email: targetEmail,
              options: {
                redirectTo: redirectUrl,
              },
            });

          if (recoveryError) {
            return new Response(
              JSON.stringify({
                error: "This user is already part of the team. They can sign in directly or request a password reset.",
              }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          actionLink = recoveryData.properties.action_link;
          userId = recoveryData.user.id;
        } else {
          let friendlyMsg = "Unable to create an invitation link. Please verify the email address and try again.";
          if (linkError.message.toLowerCase().includes("rate limit")) {
            friendlyMsg = "Security rate limit reached. Please wait a few minutes before sending another invitation.";
          }
          return new Response(JSON.stringify({ error: friendlyMsg }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      } else {
        actionLink = linkData.properties.action_link;
        userId = linkData.user.id;
      }

      // 2. Dispatch Invitation Email via verified Resend domain
      let emailDispatched = false;
      let emailError: string | null = null;

      try {
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "AWS SBG Admin <notifications@awssbg.online>",
            to: [targetEmail],
            reply_to: "enquiries@awssbg.online",
            subject: "Invitation to Join AWS SBG Admin Team",
            html: buildAdminInviteEmail({
              inviteeName: targetName,
              inviterEmail: caller.email || "Lead Administrator",
              role: targetRole,
              actionLink,
            }),
          }),
        });

        if (resendRes.ok) {
          emailDispatched = true;
        } else {
          const errText = await resendRes.text();
          emailError = `Resend error (${resendRes.status}): ${errText}`;
          console.error("Resend invite error:", emailError);
        }
      } catch (err) {
        emailError = (err as Error).message;
        console.error("Failed sending invite email:", emailError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: emailDispatched
            ? `Invitation email successfully dispatched to ${targetEmail}`
            : `User generated, but email delivery issue: ${emailError}`,
          emailDispatched,
          inviteLink: actionLink,
          user: {
            id: userId,
            email: targetEmail,
            name: targetName,
            role: targetRole,
          },
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      );
    } catch (err) {
      return new Response(
        JSON.stringify({
          error: "Invalid request: " + (err as Error).message,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // ── Handle DELETE (Remove User) ──
  if (request.method === "DELETE") {
    try {
      const body = (await request.json()) as { userId: string };
      const { userId } = body;

      if (!userId) {
        return new Response(JSON.stringify({ error: "userId is required." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Prevent self-deletion
      if (userId === caller.id) {
        return new Response(
          JSON.stringify({ error: "Cannot delete your own superadmin account." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const { error: deleteError } =
        await supabaseAdmin.auth.admin.deleteUser(userId);

      if (deleteError) {
        return new Response(JSON.stringify({ error: deleteError.message }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "User deleted successfully.",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Invalid request: " + (err as Error).message }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  });
};
