import { createClient } from "@supabase/supabase-js";
import { enforceRateLimit, RATE_LIMIT_RULES } from "@awssbg/shared/src/lib/rateLimit";
import { logActivity } from "@awssbg/shared/src/lib/audit";
import { escapeHtml } from "@awssbg/shared/src/lib/sanitize";

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
  orgName?: string;
}) {
  const safeName = escapeHtml(data.inviteeName);
  const safeInviter = escapeHtml(data.inviterEmail);
  const safeRole = escapeHtml(data.role.toUpperCase());
  const safeOrg = data.orgName ? escapeHtml(data.orgName) : "";
  const sbgLine = safeOrg ? ` // ${safeOrg.toUpperCase()}` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Admin Invitation — AWS SBG</title></head>
<body style="margin: 0; padding: 0; background-color: #F4F4F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F4F4F5; padding: 40px 15px;">
    <tr><td align="center">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #FFFFFF; border: 3px solid #000000; box-shadow: 6px 6px 0px #000000; padding: 32px 28px;">
        <tr><td>
          <div style="display: inline-block; background-color: #000000; color: #FFFFFF; font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 900; letter-spacing: 2px; padding: 3px 8px; margin-bottom: 16px;">
            // AWS_SBG // ACCESS_AUTHORIZATION${sbgLine}
          </div>
          <h1 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 900; text-transform: uppercase; color: #000000; line-height: 1.1;">
            Team Invitation <br>
            <span style="background-color: #7C3AED; color: #FFFFFF; padding: 2px 6px; border: 2px solid #000000; display: inline-block; margin-top: 4px;">
              ${safeRole}
            </span>
          </h1>
        </td></tr>
        <tr><td style="padding: 16px 0 20px 0; color: #27272A; font-size: 14px; line-height: 1.6;">
          <p style="margin: 0 0 12px 0; font-weight: 500;">
            Hello <strong>${safeName}</strong>,
          </p>
          <p style="margin: 0 0 16px 0; color: #52525B;">
            You have been granted administrative access to the <strong>AWS Student Builder Group Admin Console</strong>${safeOrg ? ` for <strong>${safeOrg}</strong>` : ""} by <strong>${safeInviter}</strong>.
          </p>
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F4F4F5; border: 2px solid #000000; padding: 14px; margin-bottom: 20px; font-family: 'Courier New', Courier, monospace; font-size: 12px;">
            <tr><td style="padding: 4px 0;"><strong>Assigned Role:</strong> ${safeRole}</td></tr>
            ${safeOrg ? `<tr><td style="padding: 4px 0;"><strong>Group:</strong> ${safeOrg}</td></tr>` : ""}
            <tr><td style="padding: 4px 0;"><strong>Console URL:</strong> https://admin.awssbg.online</td></tr>
          </table>
          <p style="margin: 0 0 16px 0; font-size: 13px; color: #52525B;">
            Click the button below to accept your invitation and create your new password. Once your password is saved, you will sign in to enter the AWS SBG Admin Console.
          </p>
        </td></tr>
        <tr><td align="center" style="padding-bottom: 24px;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr><td align="center">
              <a href="${data.actionLink}" target="_blank" style="display: block; background-color: #000000; color: #FFFFFF; border: 2px solid #000000; box-shadow: 4px 4px 0px #7C3AED; font-family: 'Courier New', Courier, monospace; font-size: 13px; font-weight: 900; text-transform: uppercase; text-decoration: none; padding: 14px 20px; text-align: center;">
                SET NEW PASSWORD & SIGN IN &rarr;
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
        <tr><td style="padding-top: 14px;">
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

  // CORS options
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  // Enforce rate limiting on write endpoints (POST/PATCH/DELETE)
  if (request.method === "POST" || request.method === "PATCH" || request.method === "DELETE") {
    const rateLimitError = enforceRateLimit(request, "users_auth", RATE_LIMIT_RULES.AUTH);
    if (rateLimitError) return rateLimitError;
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

  // Query caller profile from public.admin_users
  const { data: callerProfile } = await supabaseAdmin
    .from("admin_users")
    .select("*")
    .eq("id", caller.id)
    .single();

  const isSuperAdmin =
    callerProfile?.is_super_admin === true ||
    callerProfile?.role === "superadmin" ||
    caller.email === "lethabomabilo33@gmail.com";

  const isLeader = callerProfile?.role === "leader";

  // Only Superadmin or Leader can access user management
  if (!isSuperAdmin && !isLeader) {
    return new Response(
      JSON.stringify({ error: "Access restricted: Group Leader or Superadmin privileges required." }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // ── Handle GET (List Users) ──
  if (request.method === "GET") {
    // If Superadmin: list all users; If Leader: list users matching caller's org_id
    let query = supabaseAdmin.from("admin_users").select("*, orgs(id, name, slug)");

    if (!isSuperAdmin && callerProfile?.org_id) {
      query = query.eq("org_id", callerProfile.org_id);
    }

    const { data: dbUsers, error: dbErr } = await query.order("created_at", { ascending: false });

    if (dbErr) {
      return new Response(JSON.stringify({ error: dbErr.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ users: dbUsers || [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── Handle POST (Invite User via Resend) ──
  if (request.method === "POST") {
    try {
      const body = (await request.json()) as {
        action?: string;
        userId?: string;
        email?: string;
        name?: string;
        role?: string;
        org_id?: string;
      };

      // ── Handle Action: Resend Invite ──
      if (body.action === "resend" || (body as any).resend) {
        const { userId, email: resendEmail } = body;
        let targetUser: any = null;
        if (userId) {
          const { data } = await supabaseAdmin.from("admin_users").select("*").eq("id", userId).single();
          targetUser = data;
        } else if (resendEmail) {
          const { data } = await supabaseAdmin.from("admin_users").select("*").eq("email", resendEmail.toLowerCase().trim()).single();
          targetUser = data;
        }

        if (!targetUser) {
          return new Response(JSON.stringify({ error: "User not found to resend invite." }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (!isSuperAdmin) {
          if (targetUser.org_id !== callerProfile?.org_id) {
            return new Response(JSON.stringify({ error: "Forbidden: Cannot resend invite to member of another group." }), {
              status: 403,
              headers: { "Content-Type": "application/json" },
            });
          }
        }

        const redirectUrl = "https://admin.awssbg.online/update-password";
        let actionLink = "";
        const { data: recData, error: recError } = await supabaseAdmin.auth.admin.generateLink({
          type: "recovery",
          email: targetUser.email,
          options: { redirectTo: redirectUrl },
        });

        if (recError || !recData) {
          const { data: invData, error: invError } = await supabaseAdmin.auth.admin.generateLink({
            type: "invite",
            email: targetUser.email,
            options: {
              redirectTo: redirectUrl,
              data: {
                name: targetUser.name,
                role: targetUser.role,
                org_id: targetUser.org_id,
              },
            },
          });
          if (invError || !invData) {
            return new Response(
              JSON.stringify({ error: invError?.message || recError?.message || "Failed to generate invite link." }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }
          actionLink = invData.properties.action_link;
        } else {
          actionLink = recData.properties.action_link;
        }

        let orgName: string | undefined;
        if (targetUser.org_id) {
          const { data: orgData } = await supabaseAdmin.from("orgs").select("name").eq("id", targetUser.org_id).single();
          orgName = orgData?.name;
        }

        let emailDispatched = false;
        let emailError: string | null = null;
        if (resendApiKey) {
          try {
            const resendRes = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${resendApiKey}`,
              },
              body: JSON.stringify({
                from: "AWS SBG Admin <notifications@awssbg.online>",
                to: [targetUser.email],
                reply_to: "enquiries@awssbg.online",
                subject: `Invitation Reminder: AWS SBG Admin Team${orgName ? ` — ${orgName}` : ""}`,
                html: buildAdminInviteEmail({
                  inviteeName: targetUser.name,
                  inviterEmail: caller.email || "Lead Administrator",
                  role: targetUser.role,
                  actionLink,
                  orgName,
                }),
              }),
            });
            if (resendRes.ok) emailDispatched = true;
            else emailError = await resendRes.text();
          } catch (e) {
            emailError = (e as Error).message;
          }
        }

        await logActivity(supabaseAdmin, {
          org_id: targetUser.org_id || null,
          actor_id: caller.id,
          actor_name: callerProfile?.name || caller.email || "Admin",
          action: "user.invite_resent",
          entity_type: "user",
          entity_id: targetUser.id,
          summary: `Resent invitation to "${targetUser.name}" (${targetUser.email})`,
        });

        return new Response(
          JSON.stringify({
            success: true,
            message: emailDispatched
              ? `Invitation email successfully resent to ${targetUser.email}`
              : `User found and invite link refreshed.`,
            inviteLink: actionLink,
            emailDispatched,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      const { email, name, role, org_id } = body;

      if (!email || !email.includes("@")) {
        return new Response(
          JSON.stringify({ error: "Valid email address is required." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const targetEmail = email.toLowerCase().trim();
      const targetName = name?.trim() || targetEmail.split("@")[0];
      
      // Determine assigned role and org
      let targetRole = role || "member";
      let targetOrgId = org_id;

      if (!isSuperAdmin) {
        // Leaders can only invite Members or Leaders into their own org
        targetOrgId = callerProfile?.org_id || undefined;
        if (targetRole === "superadmin") {
          targetRole = "member";
        }
      }

      // Look up target org name for email display
      let orgName: string | undefined;
      if (targetOrgId) {
        const { data: orgData } = await supabaseAdmin
          .from("orgs")
          .select("name")
          .eq("id", targetOrgId)
          .single();
        orgName = orgData?.name;
      }

      const redirectUrl = "https://admin.awssbg.online/update-password";

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
              org_id: targetOrgId,
            },
            redirectTo: redirectUrl,
          },
        });

      if (linkError) {
        // Fallback for existing auth accounts
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
                error: "This user is already registered. They can sign in directly or request a password reset.",
              }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          actionLink = recoveryData.properties.action_link;
          userId = recoveryData.user.id;
        } else {
          return new Response(JSON.stringify({ error: linkError.message }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      } else {
        actionLink = linkData.properties.action_link;
        userId = linkData.user.id;
      }

      // 2. Insert or update public.admin_users record
      await supabaseAdmin.from("admin_users").upsert({
        id: userId,
        email: targetEmail,
        name: targetName,
        role: targetRole,
        org_id: targetOrgId || null,
        is_super_admin: targetRole === "superadmin",
      });

      // 3. Write human-readable audit log
      await logActivity(supabaseAdmin, {
        org_id: targetOrgId || null,
        actor_id: caller.id,
        actor_name: callerProfile?.name || caller.email || "Admin",
        action: "user.invited",
        entity_type: "user",
        entity_id: userId,
        summary: `Invited "${targetName}" (${targetEmail}) as ${targetRole.toUpperCase()}${orgName ? ` to ${orgName}` : ""}`,
      });

      // 4. Dispatch Invitation Email via verified Resend domain
      let emailDispatched = false;
      let emailError: string | null = null;

      if (resendApiKey) {
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
              subject: `Invitation to Join AWS SBG Admin Team${orgName ? ` — ${orgName}` : ""}`,
              html: buildAdminInviteEmail({
                inviteeName: targetName,
                inviterEmail: caller.email || "Lead Administrator",
                role: targetRole,
                actionLink,
                orgName,
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
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: emailDispatched
            ? `Invitation email successfully dispatched to ${targetEmail}`
            : `User generated, but email delivery issue: ${emailError || "No API key configured"}`,
          emailDispatched,
          inviteLink: actionLink,
          user: {
            id: userId,
            email: targetEmail,
            name: targetName,
            role: targetRole,
            org_id: targetOrgId,
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

  // ── Handle PATCH (Change User Role / SBG Assignment) ──
  if (request.method === "PATCH") {
    if (!isSuperAdmin) {
      return new Response(
        JSON.stringify({ error: "Access restricted: Superadmin builder privileges required to change roles." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    try {
      const body = (await request.json()) as {
        userId: string;
        role?: string;
        org_id?: string | null;
      };
      const { userId, role, org_id } = body;

      if (!userId) {
        return new Response(JSON.stringify({ error: "userId is required." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const validRoles = ["member", "admin", "leader", "superadmin"];
      if (role && !validRoles.includes(role.toLowerCase())) {
        return new Response(
          JSON.stringify({ error: `Invalid role. Allowed values: ${validRoles.join(", ")}` }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const targetRole = role ? role.toLowerCase() : undefined;

      // Look up target user
      const { data: targetUser, error: targetError } = await supabaseAdmin
        .from("admin_users")
        .select("*")
        .eq("id", userId)
        .single();

      if (targetError || !targetUser) {
        return new Response(JSON.stringify({ error: "Target user not found." }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Protection: cannot demote the last Superadmin
      if (targetUser.role === "superadmin" || targetUser.is_super_admin) {
        if (targetRole && targetRole !== "superadmin") {
          const { count } = await supabaseAdmin
            .from("admin_users")
            .select("*", { count: "exact", head: true })
            .or("is_super_admin.eq.true,role.eq.superadmin");

          if ((count ?? 1) <= 1) {
            return new Response(
              JSON.stringify({ error: "Security restriction: Cannot demote the platform's last Super Admin." }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }
        }
      }

      const updates: Record<string, any> = {};
      if (targetRole) {
        updates.role = targetRole;
        updates.is_super_admin = targetRole === "superadmin";
      }
      if (org_id !== undefined) {
        updates.org_id = targetRole === "superadmin" ? null : org_id;
      }

      const { data: updatedUser, error: updateErr } = await supabaseAdmin
        .from("admin_users")
        .update(updates)
        .eq("id", userId)
        .select("*, orgs(id, name, slug)")
        .single();

      if (updateErr) {
        return new Response(JSON.stringify({ error: updateErr.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Sync role into auth.users metadata
      if (targetRole) {
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          app_metadata: { role: targetRole, is_super_admin: targetRole === "superadmin" },
          user_metadata: { role: targetRole },
        });
      }

      // Audit log
      await logActivity(supabaseAdmin, {
        org_id: updatedUser?.org_id || targetUser.org_id || null,
        actor_id: caller.id,
        actor_name: callerProfile?.name || caller.email || "Superadmin",
        action: "user.role_changed",
        entity_type: "user",
        entity_id: userId,
        summary: `Changed role of "${targetUser.name}" (${targetUser.email}) from ${targetUser.role.toUpperCase()} to ${(targetRole || targetUser.role).toUpperCase()}`,
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: `Role for ${targetUser.name} updated to ${(targetRole || targetUser.role).toUpperCase()}`,
          user: updatedUser,
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
          JSON.stringify({ error: "Cannot delete your own account." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Check target user
      const { data: targetUser } = await supabaseAdmin
        .from("admin_users")
        .select("*")
        .eq("id", userId)
        .single();

      if (!isSuperAdmin) {
        // Leaders can only delete members of their own org
        if (targetUser?.org_id !== callerProfile?.org_id || targetUser?.role === "superadmin") {
          return new Response(
            JSON.stringify({ error: "Unauthorized to delete this user." }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }
      }

      // Delete from auth.users
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (deleteError) {
        return new Response(JSON.stringify({ error: deleteError.message }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Delete from public.admin_users
      await supabaseAdmin.from("admin_users").delete().eq("id", userId);

      // Audit log
      await logActivity(supabaseAdmin, {
        org_id: targetUser?.org_id || null,
        actor_id: caller.id,
        actor_name: callerProfile?.name || caller.email || "Admin",
        action: "user.deleted",
        entity_type: "user",
        entity_id: userId,
        summary: `Removed user "${targetUser?.name || userId}" (${targetUser?.email})`,
      });

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
