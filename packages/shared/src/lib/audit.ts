import { SupabaseClient } from "@supabase/supabase-js";

export interface LogActivityParams {
  org_id?: string | null;
  actor_id: string;
  actor_name: string;
  action: string;
  entity_type: "link" | "post" | "team_member" | "org_settings" | "org" | "user" | "inquiry";
  entity_id?: string | null;
  summary: string;
}

/**
 * Explicit application-level audit logger for all mutating actions.
 * Logs to `public.audit_log` with an immutable, human-readable summary.
 */
export async function logActivity(
  supabase: SupabaseClient,
  params: LogActivityParams
): Promise<void> {
  try {
    const { error } = await supabase.from("audit_log").insert({
      org_id: params.org_id || null,
      actor_id: params.actor_id,
      actor_name: params.actor_name,
      action: params.action,
      entity_type: params.entity_type,
      entity_id: params.entity_id || null,
      summary: params.summary,
    });

    if (error) {
      console.error("Audit log write warning:", error.message);
    }
  } catch (err) {
    console.error("Audit log failure:", err);
  }
}
