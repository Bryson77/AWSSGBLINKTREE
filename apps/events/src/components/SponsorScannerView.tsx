"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { CameraQRScanner, playSoundFeedback, triggerHaptic } from "./CameraQRScanner";
import { toast } from "sonner";
import {
  HiOutlineQrCode,
  HiOutlineUsers,
  HiOutlineArrowDownTray,
  HiOutlineStar,
  HiOutlinePencilSquare,
  HiOutlineCheck,
  HiOutlineMagnifyingGlass,
  HiStar,
} from "react-icons/hi2";

interface SponsorLeadItem {
  id: string;
  event_id: string;
  sponsor_company_id: string;
  scanned_at: string;
  rating?: number | null;
  notes?: string | null;
  registration: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    affiliation_type: string;
    affiliation_detail: string;
    assigned_role: string;
  };
}

interface SponsorScannerViewProps {
  eventId: string;
  token: string;
  companyName: string;
  repName: string;
  onSignOut: () => void;
}

export function SponsorScannerView({
  eventId,
  token,
  companyName,
  repName,
  onSignOut,
}: SponsorScannerViewProps) {
  const [activeTab, setActiveTab] = useState<"scanner" | "leads">("scanner");
  const [leads, setLeads] = useState<SponsorLeadItem[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Scanned Lead Rating/Notes Modal
  const [activeLeadModal, setActiveLeadModal] = useState<{
    qr_token: string;
    first_name: string;
    last_name: string;
    email: string;
    affiliation_detail: string;
    rating: number;
    notes: string;
  } | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoadingLeads(true);
    try {
      const res = await fetch(`/api/leads?event_id=${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      }
    } catch {
      // Ignore background lead load errors
    } finally {
      setLoadingLeads(false);
    }
  }, [eventId, token]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleScan = async (qrToken: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          event_id: eventId,
          qr_token: qrToken,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        playSoundFeedback("duplicate");
        triggerHaptic("warning");
        toast.error("Scan Error", { description: data.error || data.message || "Invalid ticket." });
        return;
      }

      playSoundFeedback("success");
      triggerHaptic("success");

      // Open Rating & Notes Modal
      setActiveLeadModal({
        qr_token: qrToken,
        first_name: data.lead.first_name,
        last_name: data.lead.last_name,
        email: data.lead.email,
        affiliation_detail: data.lead.affiliation_detail,
        rating: data.lead.rating || 3,
        notes: data.lead.notes || "",
      });

      fetchLeads();
    } catch (err: any) {
      toast.error("Lead scan failed", { description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const saveLeadNotesAndRating = async () => {
    if (!activeLeadModal) return;
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          event_id: eventId,
          qr_token: activeLeadModal.qr_token,
          rating: activeLeadModal.rating,
          notes: activeLeadModal.notes.trim() || null,
        }),
      });

      if (res.ok) {
        toast.success("Lead Saved", {
          description: `${activeLeadModal.first_name} ${activeLeadModal.last_name} captured for ${companyName}.`,
        });
        setActiveLeadModal(null);
        fetchLeads();
      }
    } catch (e: any) {
      toast.error("Failed to update notes", { description: e.message });
    }
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    if (!searchQuery.trim()) return leads;
    const q = searchQuery.toLowerCase();
    return leads.filter((l) => {
      const name = `${l.registration?.first_name} ${l.registration?.last_name}`.toLowerCase();
      const email = l.registration?.email?.toLowerCase() || "";
      const aff = l.registration?.affiliation_detail?.toLowerCase() || "";
      return name.includes(q) || email.includes(q) || aff.includes(q);
    });
  }, [leads, searchQuery]);

  // Export CSV
  const handleExportCSV = () => {
    if (leads.length === 0) {
      toast.info("No leads to export yet.");
      return;
    }

    const headers = ["First Name", "Last Name", "Email", "Affiliation / Course", "Rating (1-5)", "Notes", "Scanned Timestamp"];
    const rows = leads.map((l) => [
      `"${(l.registration?.first_name || "").replace(/"/g, '""')}"`,
      `"${(l.registration?.last_name || "").replace(/"/g, '""')}"`,
      `"${(l.registration?.email || "").replace(/"/g, '""')}"`,
      `"${(l.registration?.affiliation_detail || "").replace(/"/g, '""')}"`,
      l.rating || "",
      `"${(l.notes || "").replace(/"/g, '""')}"`,
      `"${new Date(l.scanned_at).toLocaleString()}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${companyName.replace(/\s+/g, "_")}_Leads_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Downloaded", { description: `${leads.length} leads exported.` });
  };

  return (
    <div className="min-h-screen bg-[#F4F4F5] pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b-[3px] border-black bg-white px-4 py-3 shadow-[0px_4px_0px_#000000]">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div>
            <div className="inline-block border border-black bg-[#7C3AED] px-2 py-0.2 font-mono text-[9px] font-black uppercase tracking-wider text-white">
              // SPONSOR_LEAD_PORTAL
            </div>
            <h1 className="font-mono text-sm font-black uppercase text-black">
              {companyName} Booth Leads
            </h1>
            <p className="font-mono text-[10px] text-zinc-600">
              Representative: <strong className="text-black">{repName}</strong>
            </p>
          </div>
          <button
            onClick={onSignOut}
            className="border-2 border-black bg-white px-2.5 py-1 font-mono text-[10px] font-bold uppercase text-black shadow-[2px_2px_0px_#000000] hover:bg-zinc-100 cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-lg p-4 space-y-4">
        {/* Tab Switcher */}
        <div className="flex border-[3px] border-black bg-white p-1 shadow-[4px_4px_0px_#000000]">
          <button
            onClick={() => setActiveTab("scanner")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 font-mono text-xs font-black uppercase transition-all cursor-pointer ${
              activeTab === "scanner"
                ? "bg-black text-white shadow-[2px_2px_0px_#7C3AED]"
                : "text-zinc-600 hover:text-black"
            }`}
          >
            <HiOutlineQrCode className="h-4 w-4" />
            <span>Badge Scanner</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("leads");
              fetchLeads();
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 font-mono text-xs font-black uppercase transition-all cursor-pointer ${
              activeTab === "leads"
                ? "bg-black text-white shadow-[2px_2px_0px_#7C3AED]"
                : "text-zinc-600 hover:text-black"
            }`}
          >
            <HiOutlineUsers className="h-4 w-4" />
            <span>Captured Leads ({leads.length})</span>
          </button>
        </div>

        {/* ── TAB 1: SCANNER ── */}
        {activeTab === "scanner" && (
          <div className="space-y-4">
            <CameraQRScanner
              onScan={handleScan}
              isProcessing={isProcessing}
              roleLabel="SPONSOR"
              onManualSearch={handleScan}
            />

            <div className="border-[3px] border-black bg-white p-4 shadow-[4px_4px_0px_#000000] text-center">
              <span className="font-mono text-xs font-bold text-zinc-600 block">
                Total Leads Captured for {companyName}:
              </span>
              <span className="font-mono text-3xl font-black text-black mt-1 block">
                {leads.length}
              </span>
            </div>
          </div>
        )}

        {/* ── TAB 2: LEADS LIST ── */}
        {activeTab === "leads" && (
          <div className="space-y-3">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search leads by name or course..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black outline-none focus:shadow-[2px_2px_0px_#7C3AED]"
                />
              </div>
              <button
                onClick={handleExportCSV}
                className="flex items-center justify-center gap-1.5 border-2 border-black bg-black px-4 py-2 font-mono text-xs font-black uppercase text-white shadow-[3px_3px_0px_#7C3AED] hover:bg-accent-purple transition-all cursor-pointer"
              >
                <HiOutlineArrowDownTray className="h-4 w-4" />
                <span>Export CSV</span>
              </button>
            </div>

            {/* Leads List */}
            <div className="space-y-2">
              {filteredLeads.map((item) => (
                <div
                  key={item.id}
                  className="border-[3px] border-black bg-white p-3.5 shadow-[4px_4px_0px_#000000]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-mono text-sm font-black uppercase text-black">
                        {item.registration?.first_name} {item.registration?.last_name}
                      </h3>
                      <p className="font-mono text-xs text-zinc-600">
                        {item.registration?.email}
                      </p>
                      <p className="font-mono text-xs font-bold text-accent-purple mt-0.5">
                        {item.registration?.affiliation_detail}
                      </p>
                    </div>

                    {/* Star Rating Badge */}
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <HiStar
                          key={s}
                          className={`h-3.5 w-3.5 ${
                            (item.rating || 0) >= s ? "text-amber-400" : "text-zinc-200"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {item.notes && (
                    <div className="mt-2 border-t border-black/10 pt-2 font-mono text-xs text-zinc-700 bg-zinc-50 p-2">
                      &ldquo;{item.notes}&rdquo;
                    </div>
                  )}

                  <div className="mt-2 text-right font-mono text-[9px] text-zinc-400">
                    Scanned: {new Date(item.scanned_at).toLocaleTimeString()}
                  </div>
                </div>
              ))}

              {filteredLeads.length === 0 && !loadingLeads && (
                <div className="border-[3px] border-dashed border-black bg-white py-12 text-center shadow-[4px_4px_0px_#000000]">
                  <p className="font-mono text-xs font-bold uppercase text-zinc-500">
                    No leads captured yet. Switch to the Scanner tab to scan attendee badges.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── MODAL: RATE & ANNOTATE NEW LEAD ── */}
      {activeLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm border-[4px] border-black bg-white p-5 shadow-[8px_8px_0px_#000000] animate-in fade-in zoom-in-95 duration-150">
            <div className="mb-3 border-b-2 border-black pb-2">
              <div className="font-mono text-[9px] font-black uppercase text-emerald-600">
                // LEAD_CAPTURED_SUCCESSFULLY
              </div>
              <h2 className="text-xl font-black uppercase text-black mt-1">
                {activeLeadModal.first_name} {activeLeadModal.last_name}
              </h2>
              <p className="font-mono text-xs text-zinc-600">
                {activeLeadModal.email}
              </p>
              <p className="font-mono text-xs font-bold text-accent-purple mt-0.5">
                {activeLeadModal.affiliation_detail}
              </p>
            </div>

            {/* 1-5 Star Candidate Rating */}
            <div className="mb-4">
              <label className="mb-1 block font-mono text-xs font-black uppercase text-black">
                Candidate Rating:
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setActiveLeadModal((prev) => prev ? { ...prev, rating: star } : null)}
                    className="p-1 cursor-pointer"
                  >
                    <HiStar
                      className={`h-7 w-7 transition-transform active:scale-90 ${
                        activeLeadModal.rating >= star ? "text-amber-400" : "text-zinc-200"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Rep Notes */}
            <div className="mb-4">
              <label className="mb-1 block font-mono text-xs font-black uppercase text-black">
                Booth Notes / Interests:
              </label>
              <textarea
                rows={3}
                placeholder="e.g. AWS Solutions Architect certified, looking for cloud internship..."
                value={activeLeadModal.notes}
                onChange={(e) => setActiveLeadModal((prev) => prev ? { ...prev, notes: e.target.value } : null)}
                className="w-full border-2 border-black bg-zinc-50 p-2 font-mono text-xs text-black outline-none focus:bg-white focus:shadow-[2px_2px_0px_#7C3AED]"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setActiveLeadModal(null)}
                className="flex-1 border-2 border-black bg-white py-2 font-mono text-xs font-bold uppercase text-black hover:bg-zinc-100 cursor-pointer"
              >
                Skip Notes
              </button>
              <button
                onClick={saveLeadNotesAndRating}
                className="flex-1 border-2 border-black bg-black py-2 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_#7C3AED] hover:bg-accent-purple transition-all cursor-pointer"
              >
                Save Lead &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
