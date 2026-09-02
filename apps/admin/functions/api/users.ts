import { createClient } from "@supabase/supabase-js";

interface Env {
  NEXT_PUBLIC_SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
}

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

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || "https://yzmgkreucvbftolijtpl.supabase.co";
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    return new Response(
      JSON.stringify({ error: "SUPABASE_SERVICE_ROLE_KEY environment variable is not configured." }),
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

  // Create client with service role key
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
      JSON.stringify({ error: "Invalid session token: " + (authError?.message || "User not found") }),
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
      JSON.stringify({ error: "Forbidden. Superadmin privileges required." }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // Handle GET (List Users)
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
      const isSuper = (u as unknown as { is_super_admin?: boolean }).is_super_admin === true || u.email === "lethabomabilo33@gmail.com";
      return {
        id: u.id,
        email: u.email || "",
        name: (u.user_metadata?.name as string) || u.email?.split("@")[0] || "Admin",
        role: (u.app_metadata?.role as string) || (isSuper ? "superadmin" : "admin"),
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

  // Handle POST (Invite User)
  if (request.method === "POST") {
    try {
      const body = (await request.json()) as { email: string; name: string; role?: string };
      const { email, name, role } = body;

      if (!email || !email.includes("@")) {
        return new Response(
          JSON.stringify({ error: "Valid email address is required." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const redirectUrl = "https://admin.awssbg.online";

      // Send official Supabase invitation
      const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email.toLowerCase().trim(), {
        data: {
          name: name?.trim() || email.split("@")[0],
          role: role || "admin",
        },
        redirectTo: redirectUrl,
      });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Invitation sent successfully to " + email,
          user: {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name,
            role: role || "admin",
          },
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON request body: " + (err as Error).message }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // Handle DELETE (Remove User)
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

      if (userId === caller.id) {
        return new Response(
          JSON.stringify({ error: "Action prohibited. You cannot delete your own superadmin account." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Ensure target isn't the primary superadmin
      const { data: targetUser } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (targetUser?.user?.email === "lethabomabilo33@gmail.com") {
        return new Response(
          JSON.stringify({ error: "Action prohibited. Cannot remove primary superadmin." }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }

      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({ success: true, message: "User deleted successfully." }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON request body: " + (err as Error).message }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  return new Response(JSON.stringify({ error: "Method not allowed." }), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  });
};
