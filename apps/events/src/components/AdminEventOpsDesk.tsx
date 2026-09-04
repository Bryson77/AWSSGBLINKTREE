"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  EventItem,
  EventRegistration,
  SponsorCompany,
  EventUser,
  AttendeeRole,
  RegistrationStatus,
  supabase,
} from "@awssbg/shared";
import {
  HiOutlineUserGroup,
  HiOutlineTicket,
  HiOutlineShieldCheck,
  HiOutlineBuildingOffice,
  HiOutlineArrowDownTray,
  HiOutlineArrowPath,
  HiOutlineCheckBadge,
  HiOutlineXMark,
  HiOutlineLockClosed,
  HiOutlineUserPlus,
  HiOutlineTrash,
  HiOutlinePaperAirplane,
  HiPlus,
} from "react-icons/hi2";

interface AdminEventOpsDeskProps {
  events: EventItem[];
  currentEvent: EventItem | null;
  onSelectEvent: (event: EventItem) => void;
  token: string;
  isSuperAdmin: boolean;
  userEmail: string;
  onSignOut: () => void;
  onSwitchToStaffView?: () => void;
  onSwitchToSponsorView?: () => void;
}

export function AdminEventOpsDesk({
  events,
  currentEvent,
  onSelectEvent,
  token,
  isSuperAdmin,
  userEmail,
  onSignOut,
  onSwitchToStaffView,
  onSwitchToSponsorView,
}: AdminEventOpsDeskProps) {
  const [activeTab, setActiveTab] = useState<"attendees" | "queues" | "sponsors" | "staff">("attendees");
  const [attendees, setAttendees] = useState<EventRegistration[]>([]);
  const [sponsors, setSponsors] = useState<SponsorCompany[]>([]);
  const [staffUsers, setStaffUsers] = useState<EventUser[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters & Selection
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [processingBulk, setProcessingBulk] = useState(false);

  // Invite Modals
  const [showInviteModal, setShowInviteModal] = useState<"staff" | "sponsor" | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [selectedSponsorCompanyId, setSelectedSponsorCompanyId] = useState("");
  const [inviting, setInviting] = useState(false);

  // Add Sponsor Modal
  const [showAddSponsorModal, setShowAddSponsorModal] = useState(false);
  const [newSponsorName, setNewSponsorName] = useState("");
  const [newSponsorTier, setNewSponsorTier] = useState("community");

  const eventId = currentEvent?.id;

  const fetchEventData = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      // Fetch Registrations
      const { data: regData } = await supabase
        .from("event_registrations")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });

      if (regData) setAttendees(regData as EventRegistration[]);

      // Fetch Sponsors
      const { data: sponData } = await supabase
        .from("sponsor_companies")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });

      if (sponData) setSponsors(sponData as SponsorCompany[]);

      // Fetch Staff / Event Users
      const res = await fetch(`/api/users?event_id=${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const u = await res.json();
        setStaffUsers(u.users || []);
      }
    } catch (err: any) {
      toast.error("Failed to load event data", { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [eventId, token]);

  useEffect(() => {
    fetchEventData();
  }, [fetchEventData]);

  // Statistics
  const stats = useMemo(() => {
    const total = attendees.length;
    const approved = attendees.filter((a) => a.status === "approved").length;
    const waitlisted = attendees.filter((a) => a.status === "waitlisted").length;
    const checkedIn = attendees.filter((a) => a.checked_in).length;
    const vips = attendees.filter((a) => a.assigned_role === "VIP").length;
    return {
      total,
      approved,
      waitlisted,
      checkedIn,
      vips,
      checkInPct: approved > 0 ? Math.round((checkedIn / approved) * 100) : 0,
    };
  }, [attendees]);

  // Filtered Attendees
  const filteredAttendees = useMemo(() => {
    return attendees.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (roleFilter !== "all" && a.assigned_role !== roleFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const fullName = `${a.first_name} ${a.last_name}`.toLowerCase();
        const email = a.email.toLowerCase();
        const aff = a.affiliation_detail.toLowerCase();
        return fullName.includes(q) || email.includes(q) || aff.includes(q);
      }
      return true;
    });
  }, [attendees, statusFilter, roleFilter, searchQuery]);

  // Selection toggles
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredAttendees.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAttendees.map((a) => a.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Bulk Approve & Send E-Tickets
  const handleBulkApproveAndSend = async () => {
    if (selectedIds.length === 0) {
      toast.error("Select attendees first");
      return;
    }

    setProcessingBulk(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "approve_and_send",
          event_id: eventId,
          registration_ids: selectedIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to issue tickets");

      toast.success("E-Tickets Dispatched!", {
        description: `${data.processed} e-ticket(s) with QR codes sent via email.`,
      });
      setSelectedIds([]);
      fetchEventData();
    } catch (err: any) {
      toast.error("Ticket generation failed", { description: err.message });
    } finally {
      setProcessingBulk(false);
    }
  };

  // Bulk Send Capacity Rejections
  const handleBulkSendCapacityNotice = async () => {
    if (selectedIds.length === 0) {
      toast.error("Select applicants first");
      return;
    }

    if (!confirm(`Send "Capacity Reached / Waitlist" emails to ${selectedIds.length} applicant(s)?`)) {
      return;
    }

    setProcessingBulk(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "send_capacity_rejections",
          event_id: eventId,
          registration_ids: selectedIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to dispatch emails");

      toast.success("Capacity Notices Sent", {
        description: `${data.count} applicants notified.`,
      });
      setSelectedIds([]);
      fetchEventData();
    } catch (err: any) {
      toast.error("Notice dispatch failed", { description: err.message });
    } finally {
      setProcessingBulk(false);
    }
  };

  // Lock & Balance Queues (Lines 1 to 4)
  const handleLockAndBalanceQueues = async () => {
    if (!confirm("This will balance all approved attendees into equal Queue Lines (1-4) and lock assignments. Proceed?")) {
      return;
    }

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "lock_queues",
          event_id: eventId,
          queue_count: 4,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Queues Locked & Balanced!", {
        description: `Line 1: ${data.distribution[1]}, Line 2: ${data.distribution[2]}, Line 3: ${data.distribution[3]}, Line 4: ${data.distribution[4]} (VIPs: ${data.vipsCount})`,
      });
      fetchEventData();
    } catch (err: any) {
      toast.error("Queue balance failed", { description: err.message });
    }
  };

  // Export Badge Printing CSV
  const handleExportBadgeCSV = () => {
    const approvedAttendees = attendees.filter((a) => a.status === "approved");
    if (approvedAttendees.length === 0) {
      toast.info("No approved attendees to export for badges.");
      return;
    }

    const headers = ["Assigned Line", "First Name", "Last Name", "Role", "Affiliation", "Email", "Ticket Token"];
    const rows = approvedAttendees.map((a) => [
      a.assigned_role === "VIP" ? "VIP LANE" : `LINE ${a.assigned_queue || 1}`,
      `"${a.first_name.replace(/"/g, '""')}"`,
      `"${a.last_name.replace(/"/g, '""')}"`,
      a.assigned_role,
      `"${a.affiliation_detail.replace(/"/g, '""')}"`,
      `"${a.email}"`,
      a.qr_token,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Badge_Printing_${currentEvent?.slug || "event"}_LineSorted.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Badge CSV Downloaded", { description: "Lanyards can now be sorted alphabetically per line." });
  };

  // Role quick switch
  const handleRoleChange = async (registrationId: string, newRole: AttendeeRole) => {
    try {
      const { error } = await supabase
        .from("event_registrations")
        .update({ assigned_role: newRole })
        .eq("id", registrationId);

      if (error) throw error;
      setAttendees((prev) =>
        prev.map((a) => (a.id === registrationId ? { ...a, assigned_role: newRole } : a))
      );
      toast.success(`Role updated to ${newRole}`);
    } catch (e: any) {
      toast.error("Failed to update role", { description: e.message });
    }
  };

  // Invite Staff or Sponsor
  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !showInviteModal) return;

    setInviting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          event_id: eventId,
          email: inviteEmail.trim(),
          name: inviteName.trim() || inviteEmail.split("@")[0],
          role: showInviteModal === "staff" ? "event_staff" : "sponsor",
          sponsor_company_id: showInviteModal === "sponsor" ? selectedSponsorCompanyId : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send invitation");

      toast.success("Invitation Dispatched", {
        description: `Invite sent to ${inviteEmail}.`,
        action: data.inviteLink ? {
          label: "Copy Link",
          onClick: () => {
            navigator.clipboard.writeText(data.inviteLink);
            toast.success("Link copied!");
          },
        } : undefined,
      });

      setShowInviteModal(null);
      setInviteEmail("");
      setInviteName("");
      fetchEventData();
    } catch (err: any) {
      toast.error("Invite failed", { description: err.message });
    } finally {
      setInviting(false);
    }
  };

  // Add Sponsor Company
  const handleAddSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSponsorName.trim()) return;

    try {
      const { error } = await supabase.from("sponsor_companies").insert({
        event_id: eventId,
        name: newSponsorName.trim(),
        tier: newSponsorTier,
      });

      if (error) throw error;
      toast.success("Sponsor Added", { description: `${newSponsorName} registered.` });
      setShowAddSponsorModal(false);
      setNewSponsorName("");
      fetchEventData();
    } catch (e: any) {
      toast.error("Failed to add sponsor", { description: e.message });
    }
  };

  // 30-Day Sponsor Lead Purge
  const handlePurgeSponsorLeads = async () => {
    if (!isSuperAdmin) {
      toast.error("Superadmin required for data purge");
      return;
    }
    if (!confirm("Execute 30-day retention purge? This permanently scrubs attendee personal notes and details from sponsor leads while retaining aggregate numbers. This CANNOT be undone.")) {
      return;
    }

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "purge_sponsor_leads",
          event_id: eventId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("30-Day Retention Purge Complete", {
        description: "Personal lead details scrubbed from database.",
      });
    } catch (err: any) {
      toast.error("Purge failed", { description: err.message });
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F5] pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b-[3px] border-black bg-white px-4 py-3 shadow-[0px_4px_0px_#000000]">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <div className="inline-block border border-black bg-black px-2 py-0.2 font-mono text-[9px] font-black uppercase tracking-wider text-white">
                // AWS_SBG // OPERATIONS_DESK
              </div>
              <h1 className="font-mono text-base font-black uppercase text-black">
                {currentEvent?.title || "Event Platform"}
              </h1>
            </div>

            {/* Event Switcher */}
            {events.length > 1 && (
              <select
                value={eventId}
                onChange={(e) => {
                  const ev = events.find((x) => x.id === e.target.value);
                  if (ev) onSelectEvent(ev);
                }}
                className="border-2 border-black bg-white px-2 py-1 font-mono text-xs font-bold text-black cursor-pointer"
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Quick Actions & Role Switchers */}
          <div className="flex items-center gap-2">
            {onSwitchToStaffView && (
              <button
                onClick={onSwitchToStaffView}
                className="hidden sm:inline-flex border-2 border-black bg-white px-3 py-1.5 font-mono text-xs font-bold text-black shadow-[2px_2px_0px_#000000] hover:bg-zinc-100 cursor-pointer"
              >
                Test Staff Scanner
              </button>
            )}
            {onSwitchToSponsorView && (
              <button
                onClick={onSwitchToSponsorView}
                className="hidden sm:inline-flex border-2 border-black bg-white px-3 py-1.5 font-mono text-xs font-bold text-black shadow-[2px_2px_0px_#000000] hover:bg-zinc-100 cursor-pointer"
              >
                Test Sponsor View
              </button>
            )}
            <button
              onClick={onSignOut}
              className="border-2 border-black bg-black px-3 py-1.5 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_#7C3AED] hover:bg-accent-purple cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4 sm:p-6 space-y-6">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="border-[3px] border-black bg-white p-3 shadow-[4px_4px_0px_#000000]">
            <span className="font-mono text-[10px] font-black uppercase text-zinc-500 block">Total Applied</span>
            <span className="font-mono text-2xl font-black text-black">{stats.total}</span>
          </div>
          <div className="border-[3px] border-black bg-white p-3 shadow-[4px_4px_0px_#000000]">
            <span className="font-mono text-[10px] font-black uppercase text-emerald-600 block">Approved</span>
            <span className="font-mono text-2xl font-black text-black">{stats.approved}</span>
          </div>
          <div className="border-[3px] border-black bg-white p-3 shadow-[4px_4px_0px_#000000]">
            <span className="font-mono text-[10px] font-black uppercase text-amber-600 block">Waitlist</span>
            <span className="font-mono text-2xl font-black text-black">{stats.waitlisted}</span>
          </div>
          <div className="border-[3px] border-black bg-white p-3 shadow-[4px_4px_0px_#000000]">
            <span className="font-mono text-[10px] font-black uppercase text-accent-purple block">Checked In</span>
            <span className="font-mono text-2xl font-black text-black">{stats.checkedIn}</span>
          </div>
          <div className="border-[3px] border-black bg-white p-3 shadow-[4px_4px_0px_#000000] col-span-2 lg:col-span-1">
            <span className="font-mono text-[10px] font-black uppercase text-accent-blue block">Attendance Rate</span>
            <span className="font-mono text-2xl font-black text-black">{stats.checkInPct}%</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-[3px] border-black bg-white p-1 shadow-[4px_4px_0px_#000000] overflow-x-auto">
          <button
            onClick={() => setActiveTab("attendees")}
            className={`flex items-center gap-1.5 px-4 py-2 font-mono text-xs font-black uppercase transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "attendees" ? "bg-black text-white shadow-[2px_2px_0px_#7C3AED]" : "text-zinc-600 hover:text-black"
            }`}
          >
            <HiOutlineUserGroup className="h-4 w-4" />
            <span>Attendees &amp; Tickets ({attendees.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("queues")}
            className={`flex items-center gap-1.5 px-4 py-2 font-mono text-xs font-black uppercase transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "queues" ? "bg-black text-white shadow-[2px_2px_0px_#7C3AED]" : "text-zinc-600 hover:text-black"
            }`}
          >
            <HiOutlineTicket className="h-4 w-4" />
            <span>Queue Balancer &amp; Badges</span>
          </button>
          <button
            onClick={() => setActiveTab("sponsors")}
            className={`flex items-center gap-1.5 px-4 py-2 font-mono text-xs font-black uppercase transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "sponsors" ? "bg-black text-white shadow-[2px_2px_0px_#7C3AED]" : "text-zinc-600 hover:text-black"
            }`}
          >
            <HiOutlineBuildingOffice className="h-4 w-4" />
            <span>Sponsors ({sponsors.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("staff")}
            className={`flex items-center gap-1.5 px-4 py-2 font-mono text-xs font-black uppercase transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "staff" ? "bg-black text-white shadow-[2px_2px_0px_#7C3AED]" : "text-zinc-600 hover:text-black"
            }`}
          >
            <HiOutlineShieldCheck className="h-4 w-4" />
            <span>Staff Volunteers ({staffUsers.length})</span>
          </button>
        </div>

        {/* ════════════════════════════════════════════════════════════ */}
        {/* TAB 1: ATTENDEES & TICKETS */}
        {/* ════════════════════════════════════════════════════════════ */}
        {activeTab === "attendees" && (
          <div className="space-y-4">
            {/* Action Bar */}
            <div className="border-[3px] border-black bg-white p-4 shadow-[4px_4px_0px_#000000] flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <input
                  type="text"
                  placeholder="Search name, email, course..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-2 border-black bg-zinc-50 px-3 py-1.5 font-mono text-xs text-black outline-none focus:bg-white"
                />

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border-2 border-black bg-white px-2 py-1.5 font-mono text-xs font-bold cursor-pointer"
                >
                  <option value="all">ALL STATUSES</option>
                  <option value="pending">PENDING</option>
                  <option value="approved">APPROVED</option>
                  <option value="waitlisted">WAITLISTED</option>
                  <option value="rejected">REJECTED</option>
                  <option value="banned">BANNED</option>
                </select>

                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="border-2 border-black bg-white px-2 py-1.5 font-mono text-xs font-bold cursor-pointer"
                >
                  <option value="all">ALL ROLES</option>
                  <option value="ATTENDEE">ATTENDEE</option>
                  <option value="VIP">VIP</option>
                  <option value="SPONSOR">SPONSOR</option>
                  <option value="STAFF">STAFF</option>
                </select>
              </div>

              {/* Bulk Operation Buttons */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <button
                  onClick={handleBulkApproveAndSend}
                  disabled={selectedIds.length === 0 || processingBulk}
                  className="flex items-center gap-1.5 border-2 border-black bg-black px-3.5 py-1.5 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_#7C3AED] hover:bg-accent-purple disabled:opacity-40 transition-all cursor-pointer active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                >
                  <HiOutlinePaperAirplane className="h-3.5 w-3.5" />
                  <span>Approve &amp; Send E-Tickets ({selectedIds.length})</span>
                </button>
                <button
                  onClick={handleBulkSendCapacityNotice}
                  disabled={selectedIds.length === 0 || processingBulk}
                  className="border-2 border-black bg-amber-400 px-3 py-1.5 font-mono text-xs font-black uppercase text-black shadow-[2px_2px_0px_#000000] hover:bg-amber-300 disabled:opacity-40 transition-all cursor-pointer"
                >
                  Send Capacity Rejection ({selectedIds.length})
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="border-[3px] border-black bg-white shadow-[4px_4px_0px_#000000] overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-black bg-zinc-100 uppercase text-[10px] font-black">
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === filteredAttendees.length && filteredAttendees.length > 0}
                        onChange={toggleSelectAll}
                        className="cursor-pointer"
                      />
                    </th>
                    <th className="p-3">Attendee</th>
                    <th className="p-3">Role Dropdown</th>
                    <th className="p-3">Affiliation / Course</th>
                    <th className="p-3">Queue</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Checked In</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-black/10">
                  {filteredAttendees.map((att) => (
                    <tr key={att.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(att.id)}
                          onChange={() => toggleSelect(att.id)}
                          className="cursor-pointer"
                        />
                      </td>
                      <td className="p-3 font-bold text-black">
                        <div>{att.first_name} {att.last_name}</div>
                        <div className="text-[10px] text-zinc-500 font-normal">{att.email}</div>
                      </td>
                      <td className="p-3">
                        <select
                          value={att.assigned_role}
                          onChange={(e) => handleRoleChange(att.id, e.target.value as AttendeeRole)}
                          className={`border border-black px-1.5 py-0.5 font-mono text-[10px] font-black uppercase cursor-pointer ${
                            att.assigned_role === "VIP" ? "bg-accent-blue text-white" : "bg-white text-black"
                          }`}
                        >
                          <option value="ATTENDEE">ATTENDEE</option>
                          <option value="VIP">VIP</option>
                          <option value="SPONSOR">SPONSOR</option>
                          <option value="STAFF">STAFF</option>
                        </select>
                      </td>
                      <td className="p-3 text-zinc-700">
                        {att.affiliation_detail}
                      </td>
                      <td className="p-3 font-black text-accent-purple">
                        {att.assigned_role === "VIP" ? "VIP" : `Line ${att.assigned_queue || "-"}`}
                      </td>
                      <td className="p-3">
                        <span
                          className={`border border-black px-1.5 py-0.2 font-mono text-[9px] font-black uppercase ${
                            att.status === "approved"
                              ? "bg-emerald-300 text-black"
                              : att.status === "pending"
                              ? "bg-amber-200 text-black"
                              : att.status === "waitlisted"
                              ? "bg-purple-200 text-black"
                              : "bg-red-200 text-black"
                          }`}
                        >
                          {att.status}
                        </span>
                      </td>
                      <td className="p-3">
                        {att.checked_in ? (
                          <span className="text-emerald-700 font-bold">YES</span>
                        ) : (
                          <span className="text-zinc-400">NO</span>
                        )}
                      </td>
                      <td className="p-3 text-right space-x-1">
                        <a
                          href={`https://awssbg.online/ticket/${att.qr_token}`}
                          target="_blank"
                          rel="noreferrer"
                          className="border border-black bg-zinc-100 px-2 py-0.5 font-bold hover:bg-zinc-200"
                        >
                          Ticket Pass
                        </a>
                      </td>
                    </tr>
                  ))}
                  {filteredAttendees.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-zinc-500 font-bold uppercase">
                        No attendees matching filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════ */}
        {/* TAB 2: QUEUE BALANCER & BADGES */}
        {/* ════════════════════════════════════════════════════════════ */}
        {activeTab === "queues" && (
          <div className="space-y-4">
            <div className="border-[3px] border-black bg-white p-5 shadow-[4px_4px_0px_#000000]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black pb-4">
                <div>
                  <h2 className="text-xl font-black uppercase text-black">
                    Balanced Queue Management (Lines 1 to 4)
                  </h2>
                  <p className="font-mono text-xs text-zinc-600 mt-1">
                    Pre-calculate balanced queue lines across approved attendees to prevent surname skew at keycard pickup.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLockAndBalanceQueues}
                    className="flex items-center gap-1.5 border-2 border-black bg-black px-4 py-2 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_#7C3AED] hover:bg-accent-purple transition-all cursor-pointer"
                  >
                    <HiOutlineLockClosed className="h-4 w-4" />
                    <span>Lock &amp; Balance Queues</span>
                  </button>
                  <button
                    onClick={handleExportBadgeCSV}
                    className="flex items-center gap-1.5 border-2 border-black bg-white px-4 py-2 font-mono text-xs font-bold uppercase text-black shadow-[2px_2px_0px_#000000] hover:bg-zinc-100 transition-all cursor-pointer"
                  >
                    <HiOutlineArrowDownTray className="h-4 w-4" />
                    <span>Export Badge Printing CSV</span>
                  </button>
                </div>
              </div>

              {/* 4 Line Balance Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mt-6">
                {[1, 2, 3, 4].map((lineNum) => {
                  const lineAttendees = attendees.filter(
                    (a) => a.status === "approved" && a.assigned_role !== "VIP" && a.assigned_queue === lineNum
                  );
                  return (
                    <div key={lineNum} className="border-2 border-black bg-zinc-50 p-4">
                      <div className="font-mono text-xs font-black text-accent-purple uppercase mb-1">
                        LINE {lineNum}
                      </div>
                      <div className="font-mono text-2xl font-black text-black">
                        {lineAttendees.length}
                      </div>
                      <div className="font-mono text-[10px] text-zinc-500 mt-1">
                        Approved Keycards
                      </div>
                    </div>
                  );
                })}

                <div className="border-2 border-black bg-purple-50 p-4">
                  <div className="font-mono text-xs font-black text-accent-blue uppercase mb-1">
                    VIP LANE
                  </div>
                  <div className="font-mono text-2xl font-black text-black">
                    {stats.vips}
                  </div>
                  <div className="font-mono text-[10px] text-zinc-500 mt-1">
                    Dedicated Fast-Track
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════ */}
        {/* TAB 3: SPONSORS */}
        {/* ════════════════════════════════════════════════════════════ */}
        {activeTab === "sponsors" && (
          <div className="space-y-4">
            <div className="border-[3px] border-black bg-white p-4 shadow-[4px_4px_0px_#000000] flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black uppercase text-black">
                  Official Event Sponsors &amp; Booth Reps
                </h2>
                <p className="font-mono text-xs text-zinc-600 mt-0.5">
                  Sponsors can only access their own captured leads via their dedicated scanner portal.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddSponsorModal(true)}
                  className="flex items-center gap-1 border-2 border-black bg-black px-3 py-1.5 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_#7C3AED] hover:bg-accent-purple cursor-pointer"
                >
                  <HiPlus className="h-4 w-4" />
                  <span>Add Sponsor Company</span>
                </button>
                <button
                  onClick={() => setShowInviteModal("sponsor")}
                  disabled={sponsors.length === 0}
                  className="flex items-center gap-1 border-2 border-black bg-accent-purple px-3 py-1.5 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_#000000] hover:bg-black disabled:opacity-50 cursor-pointer"
                >
                  <HiOutlineUserPlus className="h-4 w-4" />
                  <span>Invite Booth Rep</span>
                </button>
              </div>
            </div>

            {/* Sponsor Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sponsors.map((sp) => {
                const repCount = staffUsers.filter((u) => u.sponsor_company_id === sp.id).length;
                return (
                  <div key={sp.id} className="border-[3px] border-black bg-white p-4 shadow-[4px_4px_0px_#000000]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="border border-black bg-black px-2 py-0.5 font-mono text-[9px] font-black uppercase text-white">
                        {sp.tier} SPONSOR
                      </span>
                    </div>
                    <h3 className="font-mono text-lg font-black uppercase text-black">{sp.name}</h3>
                    <p className="font-mono text-xs text-zinc-600 mt-1">
                      Assigned Booth Reps: <strong>{repCount}</strong>
                    </p>
                  </div>
                );
              })}
            </div>

            {/* POPIA 30-Day Purge Danger Zone */}
            {isSuperAdmin && (
              <div className="mt-8 border-[3px] border-red-600 bg-red-50 p-4 shadow-[4px_4px_0px_#DC2626]">
                <h3 className="font-mono text-sm font-black uppercase text-red-700">
                  POPIA Data Retention &amp; 30-Day Lead Purge
                </h3>
                <p className="font-mono text-xs text-red-800 mt-1">
                  In accordance with the 30-day sponsor lead data retention policy, trigger this after the retention period expires to permanently scrub attendee identifiable notes from sponsor lead records.
                </p>
                <button
                  onClick={handlePurgeSponsorLeads}
                  className="mt-3 border-2 border-black bg-red-600 px-4 py-2 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_#000000] hover:bg-red-700 cursor-pointer"
                >
                  Execute 30-Day Sponsor Lead Purge &rarr;
                </button>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════ */}
        {/* TAB 4: STAFF VOLUNTEERS */}
        {/* ════════════════════════════════════════════════════════════ */}
        {activeTab === "staff" && (
          <div className="space-y-4">
            <div className="border-[3px] border-black bg-white p-4 shadow-[4px_4px_0px_#000000] flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black uppercase text-black">
                  Check-In Staff Volunteers
                </h2>
                <p className="font-mono text-xs text-zinc-600 mt-0.5">
                  Staff members only have access to QR code scanning and banning disruptive participants.
                </p>
              </div>
              <button
                onClick={() => setShowInviteModal("staff")}
                className="flex items-center gap-1 border-2 border-black bg-black px-3.5 py-1.5 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_#7C3AED] hover:bg-accent-purple cursor-pointer"
              >
                <HiOutlineUserPlus className="h-4 w-4" />
                <span>Invite Check-In Staff</span>
              </button>
            </div>

            <div className="space-y-2">
              {staffUsers.filter((u) => u.role === "event_staff").map((staff) => (
                <div key={staff.id} className="border-[3px] border-black bg-white p-3.5 shadow-[3px_3px_0px_#000000] flex items-center justify-between">
                  <div>
                    <h3 className="font-mono text-sm font-black uppercase text-black">{staff.name}</h3>
                    <p className="font-mono text-xs text-zinc-500">{staff.email}</p>
                  </div>
                  <span className="border border-black bg-zinc-100 px-2 py-0.5 font-mono text-[10px] font-black uppercase">
                    STAFF SCANNER
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ── MODAL: INVITE USER (STAFF OR SPONSOR) ── */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <form onSubmit={handleInviteUser} className="w-full max-w-md border-[3px] border-black bg-white p-6 shadow-[8px_8px_0px_#000000]">
            <h3 className="font-mono text-base font-black uppercase text-black mb-1">
              Invite {showInviteModal === "staff" ? "Check-In Staff Volunteer" : "Sponsor Booth Representative"}
            </h3>
            <p className="font-mono text-xs text-zinc-600 mb-4">
              Sends an invitation email directing them to configure their password at events.awssbg.online.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block font-mono text-xs font-bold uppercase text-black mb-1">
                  Full Name:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Doe"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full border-2 border-black bg-zinc-50 p-2 font-mono text-xs text-black outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-mono text-xs font-bold uppercase text-black mb-1">
                  Email Address:
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. rep@aws.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full border-2 border-black bg-zinc-50 p-2 font-mono text-xs text-black outline-none focus:bg-white"
                />
              </div>

              {showInviteModal === "sponsor" && (
                <div>
                  <label className="block font-mono text-xs font-bold uppercase text-black mb-1">
                    Assign to Sponsor Company:
                  </label>
                  <select
                    required
                    value={selectedSponsorCompanyId}
                    onChange={(e) => setSelectedSponsorCompanyId(e.target.value)}
                    className="w-full border-2 border-black bg-white p-2 font-mono text-xs font-bold text-black"
                  >
                    <option value="">-- SELECT COMPANY --</option>
                    {sponsors.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.tier})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setShowInviteModal(null)}
                className="flex-1 border-2 border-black bg-white py-2 font-mono text-xs font-bold uppercase text-black hover:bg-zinc-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={inviting}
                className="flex-1 border-2 border-black bg-black py-2 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_#7C3AED] hover:bg-accent-purple cursor-pointer"
              >
                {inviting ? "Sending..." : "Dispatch Invitation →"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL: ADD SPONSOR COMPANY ── */}
      {showAddSponsorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <form onSubmit={handleAddSponsor} className="w-full max-w-md border-[3px] border-black bg-white p-6 shadow-[8px_8px_0px_#000000]">
            <h3 className="font-mono text-base font-black uppercase text-black mb-3">
              Add Sponsor Company
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block font-mono text-xs font-bold uppercase text-black mb-1">Company Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amazon Web Services, Datadog"
                  value={newSponsorName}
                  onChange={(e) => setNewSponsorName(e.target.value)}
                  className="w-full border-2 border-black bg-zinc-50 p-2 font-mono text-xs text-black outline-none focus:bg-white"
                />
              </div>
              <div>
                <label className="block font-mono text-xs font-bold uppercase text-black mb-1">Tier:</label>
                <select
                  value={newSponsorTier}
                  onChange={(e) => setNewSponsorTier(e.target.value)}
                  className="w-full border-2 border-black bg-white p-2 font-mono text-xs font-bold text-black"
                >
                  <option value="title">Title Sponsor</option>
                  <option value="platinum">Platinum</option>
                  <option value="gold">Gold</option>
                  <option value="community">Community Partner</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setShowAddSponsorModal(false)}
                className="flex-1 border-2 border-black bg-white py-2 font-mono text-xs font-bold uppercase text-black hover:bg-zinc-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 border-2 border-black bg-black py-2 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_#7C3AED] hover:bg-accent-purple cursor-pointer"
              >
                Create Sponsor &rarr;
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
