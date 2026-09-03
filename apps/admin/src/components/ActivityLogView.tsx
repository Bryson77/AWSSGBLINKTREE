"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase, AuditLogEntry } from "@awssbg/shared";
import { toast } from "sonner";
import {
  HiOutlineClipboardDocumentList,
  HiOutlineArrowDownTray,
  HiOutlineTrash,
  HiOutlineClock,
  HiOutlineFunnel,
} from "react-icons/hi2";

interface ActivityLogViewProps {
  currentOrgId: string;
  isSuperAdmin: boolean;
}

export function ActivityLogView({ currentOrgId, isSuperAdmin }: ActivityLogViewProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEntity, setFilterEntity] = useState("all");
  const [pruning, setPruning] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from("audit_log").select("*");
      if (currentOrgId && currentOrgId !== "all") {
        query = query.eq("org_id", currentOrgId);
      }
      const { data, error } = await query.order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      if (data) setLogs(data as AuditLogEntry[]);
    } catch (err) {
      console.error("Failed loading activity logs:", err);
      toast.error("Failed to load activity logs.");
    } finally {
      setLoading(false);
    }
  }, [currentOrgId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Export & Prune (>90 days)
  const handleExportAndPrune = async () => {
    if (!isSuperAdmin) {
      toast.error("Access restricted: Only Superadmins can export and prune logs.");
      return;
    }

    if (
      !confirm(
        "Download complete CSV archive of all current activity logs and prune entries older than 90 days?"
      )
    ) {
      return;
    }

    setPruning(true);
    try {
      // 1. Fetch all logs for export
      const { data: allLogs, error: fetchErr } = await supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchErr || !allLogs) throw fetchErr;

      // 2. Generate CSV
      const headers = ["ID", "Timestamp", "Org ID", "Actor ID", "Actor Name", "Action", "Entity Type", "Entity ID", "Summary"];
      const rows = allLogs.map((l) => [
        l.id,
        l.created_at,
        l.org_id || "GLOBAL",
        l.actor_id,
        `"${(l.actor_name || "").replace(/"/g, '""')}"`,
        l.action,
        l.entity_type,
        l.entity_id || "",
        `"${(l.summary || "").replace(/"/g, '""')}"`,
      ]);

      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `awssbg_audit_archive_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      // 3. Prune >90 days
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const { error: pruneErr } = await supabase
        .from("audit_log")
        .delete()
        .lt("created_at", ninetyDaysAgo);

      if (pruneErr) {
        console.warn("Prune error:", pruneErr);
      }

      toast.success("Audit archive downloaded & retention pruned (>90 days).");
      fetchLogs();
    } catch (err) {
      console.error("Export & prune error:", err);
      toast.error("Export failed: " + (err as Error).message);
    } finally {
      setPruning(false);
    }
  };

  const filteredLogs = logs.filter((l) => {
    if (filterEntity === "all") return true;
    return l.entity_type === filterEntity;
  });

  const getActionColor = (action: string) => {
    if (action.includes("created") || action.includes("added") || action.includes("published")) {
      return "bg-emerald-300 text-black";
    }
    if (action.includes("deleted") || action.includes("pruned")) {
      return "bg-red-400 text-black";
    }
    return "bg-blue-200 text-black";
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-[3px] border-black bg-white p-5 shadow-[4px_4px_0px_#000000]">
        <div>
          <div className="mb-1 inline-block border-2 border-black bg-black px-2 py-0.5 font-mono text-[9px] font-black uppercase text-white shadow-[2px_2px_0px_#7C3AED]">
            // AUDIT_TRAIL
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight text-black">
            System Activity Log
          </h2>
          <p className="font-mono text-xs text-zinc-600">
            Immutable log of all administrative actions, content publishes, and team adjustments.
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={handleExportAndPrune}
            disabled={pruning}
            className="flex items-center justify-center gap-1.5 border-2 border-black bg-white px-4 py-2 font-mono text-xs font-black uppercase text-black shadow-[2px_2px_0px_#000000] hover:bg-zinc-100 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer disabled:opacity-50"
          >
            <HiOutlineArrowDownTray className="h-4 w-4 text-purple-600" />
            <span>{pruning ? "Archiving..." : "Export & Prune (90d)"}</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 border-[2px] border-black bg-zinc-50 p-3">
        <HiOutlineFunnel className="h-4 w-4 text-black" />
        <span className="font-mono text-xs font-black uppercase">Filter:</span>
        <select
          value={filterEntity}
          onChange={(e) => setFilterEntity(e.target.value)}
          className="border-2 border-black bg-white px-2.5 py-1 font-mono text-xs font-bold text-black"
        >
          <option value="all">ALL ENTITIES</option>
          <option value="post">POSTS / ARTICLES</option>
          <option value="team_member">TEAM MEMBERS</option>
          <option value="link">LINKS</option>
          <option value="user">USER ROLES</option>
          <option value="org_settings">SETTINGS</option>
        </select>
        <span className="font-mono text-xs text-zinc-500 ml-auto">
          Showing {filteredLogs.length} entries
        </span>
      </div>

      {/* Log Feed */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-16 w-full animate-pulse border-2 border-black bg-zinc-200 shadow-[2px_2px_0px_#000000]"
            />
          ))}
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="border-[3px] border-black bg-white p-10 text-center shadow-[4px_4px_0px_#000000]">
          <HiOutlineClipboardDocumentList className="h-10 w-10 text-zinc-400 mx-auto mb-2" />
          <h3 className="font-mono text-xs font-black uppercase text-black">No activity recorded yet</h3>
          <p className="font-mono text-[11px] text-zinc-500 mt-1">
            Admin mutations and publishes will be logged here in real-time.
          </p>
        </div>
      ) : (
        <div className="border-[3px] border-black bg-white shadow-[4px_4px_0px_#000000] overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b-[3px] border-black bg-black text-white">
                <th className="p-3 uppercase">Timestamp</th>
                <th className="p-3 uppercase">Actor</th>
                <th className="p-3 uppercase">Action</th>
                <th className="p-3 uppercase">Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-50">
                  <td className="p-3 text-zinc-600 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="p-3 font-bold text-black whitespace-nowrap">
                    {log.actor_name || log.actor_id.slice(0, 8)}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <span className={`border border-black px-2 py-0.5 text-[10px] font-black uppercase ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 text-zinc-900 font-sans text-xs">
                    {log.summary}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
