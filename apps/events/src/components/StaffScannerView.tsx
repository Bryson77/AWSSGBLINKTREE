"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CameraQRScanner, playSoundFeedback, triggerHaptic } from "./CameraQRScanner";
import { toast } from "sonner";
import {
  HiOutlineCheckBadge,
  HiOutlineExclamationTriangle,
  HiOutlineNoSymbol,
  HiOutlineUser,
  HiOutlineArrowPath,
  HiOutlineShieldExclamation,
  HiOutlineArrowRight,
} from "react-icons/hi2";

interface StaffScannerViewProps {
  eventId: string;
  token: string;
  scannerName: string;
  onSignOut: () => void;
}

export function StaffScannerView({
  eventId,
  token,
  scannerName,
  onSignOut,
}: StaffScannerViewProps) {
  const [stats, setStats] = useState<{ checkedIn: number; totalApproved: number }>({
    checkedIn: 0,
    totalApproved: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Scan Result Modal States
  const [successResult, setSuccessResult] = useState<{
    first_name: string;
    last_name: string;
    assigned_role: string;
    assigned_queue: number;
    is_override?: boolean;
    registration_id: string;
  } | null>(null);

  const [duplicateWarning, setDuplicateWarning] = useState<{
    message: string;
    checked_in_at: string;
    checked_in_by_name: string;
    qr_token: string;
    attendee: {
      first_name: string;
      last_name: string;
      assigned_role: string;
      assigned_queue: number;
    };
  } | null>(null);

  const [banAlert, setBanAlert] = useState<{
    message: string;
    ban_reason: string;
    attendee: {
      first_name: string;
      last_name: string;
      assigned_role: string;
    };
  } | null>(null);

  const [banPrompt, setBanPrompt] = useState<{
    registration_id: string;
    name: string;
  } | null>(null);
  const [banReasonInput, setBanReasonInput] = useState("");

  const fetchLiveCounts = useCallback(async () => {
    try {
      const res = await fetch(`/api/checkin/counts?event_id=${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats({
          checkedIn: data.checkedIn || 0,
          totalApproved: data.totalApproved || 0,
        });
      }
    } catch {
      // Ignore background count errors
    }
  }, [eventId, token]);

  useEffect(() => {
    fetchLiveCounts();
    const interval = setInterval(fetchLiveCounts, 15000);
    return () => clearInterval(interval);
  }, [fetchLiveCounts]);

  const handleScan = async (qrToken: string, allowOverride = false) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          event_id: eventId,
          qr_token: qrToken,
          allow_override: allowOverride,
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        // Double Check-In / Pass-back detected!
        playSoundFeedback("duplicate");
        triggerHaptic("warning");
        setDuplicateWarning({
          message: data.message || "Badge already checked in!",
          checked_in_at: data.checked_in_at,
          checked_in_by_name: data.checked_in_by_name || "Another Staff",
          qr_token: qrToken,
          attendee: data.attendee,
        });
        return;
      }

      if (res.status === 403 && data.error === "MEMBER_BANNED") {
        playSoundFeedback("banned");
        triggerHaptic("warning");
        setBanAlert({
          message: data.message,
          ban_reason: data.ban_reason,
          attendee: data.attendee,
        });
        return;
      }

      if (!res.ok) {
        toast.error("Check-in Error", { description: data.error || data.message || "Invalid ticket." });
        playSoundFeedback("duplicate");
        return;
      }

      // Valid Entry!
      playSoundFeedback("success");
      triggerHaptic("success");
      setDuplicateWarning(null);
      setSuccessResult({
        first_name: data.attendee.first_name,
        last_name: data.attendee.last_name,
        assigned_role: data.attendee.assigned_role,
        assigned_queue: data.attendee.assigned_queue ?? 1,
        is_override: data.is_override,
        registration_id: data.attendee.id,
      });

      setStats((prev) => ({
        ...prev,
        checkedIn: prev.checkedIn + (data.is_override ? 0 : 1),
      }));
    } catch (err: any) {
      toast.error("Network check-in failed", { description: err.message || "Please check connection." });
    } finally {
      setIsProcessing(false);
    }
  };

  const executeBan = async () => {
    if (!banPrompt) return;
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          event_id: eventId,
          action: "ban",
          registration_id: banPrompt.registration_id,
          ban_reason: banReasonInput.trim() || "Revoked at check-in desk",
        }),
      });

      if (res.ok) {
        toast.success("Entry Revoked", { description: `${banPrompt.name} has been banned.` });
        setSuccessResult(null);
        setDuplicateWarning(null);
        setBanPrompt(null);
        setBanReasonInput("");
      } else {
        const d = await res.json();
        toast.error("Failed to ban member", { description: d.error });
      }
    } catch (e: any) {
      toast.error("Ban request failed", { description: e.message });
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F5] pb-12">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 border-b-[3px] border-black bg-white px-4 py-3 shadow-[0px_4px_0px_#000000]">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div>
            <div className="inline-block border border-black bg-black px-2 py-0.2 font-mono text-[9px] font-black uppercase tracking-wider text-white">
              // STAFF_SCANNER
            </div>
            <h1 className="font-mono text-sm font-black uppercase text-black">
              Check-In Operations Desk
            </h1>
            <p className="font-mono text-[10px] text-zinc-600">
              Logged in: <strong className="text-black">{scannerName}</strong>
            </p>
          </div>
          <button
            onClick={onSignOut}
            className="border-2 border-black bg-white px-2.5 py-1 font-mono text-[10px] font-bold uppercase text-black shadow-[2px_2px_0px_#000000] hover:bg-zinc-100 cursor-pointer active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-lg p-4 space-y-4">
        {/* Live Attendance Status Bar */}
        <div className="border-[3px] border-black bg-white p-3 shadow-[4px_4px_0px_#000000]">
          <div className="flex items-center justify-between font-mono text-xs font-black uppercase mb-1.5">
            <span>Live Check-In Progress</span>
            <span className="bg-black text-white px-2 py-0.5 text-[11px]">
              {stats.checkedIn} / {stats.totalApproved} ADMITTED
            </span>
          </div>
          <div className="h-3 w-full border-2 border-black bg-zinc-100">
            <div
              className="h-full bg-accent-purple transition-all duration-300"
              style={{
                width: `${stats.totalApproved > 0 ? (stats.checkedIn / stats.totalApproved) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Live Viewport Scanner */}
        <CameraQRScanner
          onScan={(decoded) => handleScan(decoded, false)}
          isProcessing={isProcessing}
          roleLabel="STAFF"
          onManualSearch={(query) => handleScan(query, false)}
        />
      </main>

      {/* ── MODAL 1: SUCCESSFUL CHECK-IN RESULT ── */}
      {successResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm border-[4px] border-black bg-white p-6 shadow-[8px_8px_0px_#000000] animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center">
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center border-2 border-black bg-emerald-400 text-black shadow-[3px_3px_0px_#000000]">
                <HiOutlineCheckBadge className="h-8 w-8" />
              </div>
              <div className="font-mono text-[10px] font-black uppercase text-emerald-700">
                {successResult.is_override ? "// OVERRIDE_ENTRY_LOGGED" : "// CHECK_IN_CONFIRMED"}
              </div>
              <h2 className="text-2xl font-black uppercase text-black mt-1">
                {successResult.first_name} {successResult.last_name}
              </h2>

              <div className="mt-2 inline-block border border-black bg-black px-2.5 py-0.5 font-mono text-xs font-black text-white">
                ROLE: {successResult.assigned_role}
              </div>

              {/* HUGE LANYARD / QUEUE PICKUP DIRECTIVE */}
              <div className="mt-5 border-[3px] border-black bg-[#F4F4F5] p-4 text-center">
                <span className="font-mono text-[10px] font-black uppercase text-zinc-500 block mb-1">
                  DIRECT ATTENDEE TO:
                </span>
                <div className="font-mono text-3xl font-black text-accent-purple tracking-tight">
                  {successResult.assigned_role === "VIP" ? (
                    <span className="text-accent-blue">VIP LANE</span>
                  ) : (
                    `LINE ${successResult.assigned_queue}`
                  )}
                </div>
                <span className="font-mono text-[10px] font-bold text-black uppercase mt-1 block">
                  KEYCARD / BADGE PICKUP
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => setSuccessResult(null)}
                className="w-full border-2 border-black bg-black py-3 font-mono text-xs font-black uppercase text-white shadow-[3px_3px_0px_#7C3AED] hover:bg-accent-purple transition-all cursor-pointer active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
              >
                Ready for Next Attendee &rarr;
              </button>
              <button
                onClick={() => {
                  setBanPrompt({
                    registration_id: successResult.registration_id,
                    name: `${successResult.first_name} ${successResult.last_name}`,
                  });
                }}
                className="w-full border border-black bg-white py-1.5 font-mono text-[10px] font-bold uppercase text-red-600 hover:bg-red-50 cursor-pointer"
              >
                Flag or Ban Attendee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: ANTI-PASSBACK / DOUBLE SCAN WARNING ── */}
      {duplicateWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-600/80 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm border-[4px] border-black bg-white p-6 shadow-[10px_10px_0px_#000000] animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center">
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center border-2 border-black bg-amber-400 text-black shadow-[3px_3px_0px_#000000]">
                <HiOutlineExclamationTriangle className="h-8 w-8" />
              </div>
              <div className="inline-block border border-black bg-red-600 px-2 py-0.5 font-mono text-[10px] font-black uppercase text-white">
                // ANTI_PASSBACK_ALERT
              </div>
              <h2 className="text-xl font-black uppercase text-black mt-2">
                Already Checked In!
              </h2>
              <p className="font-mono text-xs text-zinc-600 mt-1">
                Attendee: <strong>{duplicateWarning.attendee.first_name} {duplicateWarning.attendee.last_name}</strong>
              </p>

              <div className="mt-4 border-2 border-black bg-amber-50 p-3 font-mono text-[11px] text-left text-zinc-800 space-y-1">
                <div>First Checked In: <strong>{new Date(duplicateWarning.checked_in_at).toLocaleTimeString()}</strong></div>
                <div>Scanned By: <strong>{duplicateWarning.checked_in_by_name}</strong></div>
                <div>Role: <strong>{duplicateWarning.attendee.assigned_role}</strong></div>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <button
                onClick={() => setDuplicateWarning(null)}
                className="w-full border-2 border-black bg-black py-2.5 font-mono text-xs font-black uppercase text-white shadow-[3px_3px_0px_#000000] hover:bg-zinc-800 transition-all cursor-pointer"
              >
                Deny Second Entry (Close)
              </button>
              <button
                onClick={() => handleScan(duplicateWarning.qr_token, true)}
                className="w-full border-2 border-black bg-amber-400 py-2 font-mono text-xs font-black uppercase text-black shadow-[2px_2px_0px_#000000] hover:bg-amber-300 transition-all cursor-pointer"
              >
                Authorize Entry Override
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: BANNED MEMBER ALARM ── */}
      {banAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-900/90 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm border-[4px] border-black bg-white p-6 shadow-[10px_10px_0px_#000000] animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center">
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center border-2 border-black bg-red-600 text-white shadow-[3px_3px_0px_#000000]">
                <HiOutlineNoSymbol className="h-8 w-8" />
              </div>
              <div className="inline-block border border-black bg-black px-2 py-0.5 font-mono text-[10px] font-black uppercase text-white">
                // REVOKED_ATTENDEE
              </div>
              <h2 className="text-xl font-black uppercase text-red-600 mt-2">
                ENTRY STRICTLY DENIED
              </h2>
              <p className="font-mono text-sm font-bold text-black mt-1">
                {banAlert.attendee.first_name} {banAlert.attendee.last_name}
              </p>
              <div className="mt-3 border-2 border-black bg-red-50 p-2.5 font-mono text-[11px] text-red-800">
                Reason: {banAlert.ban_reason}
              </div>
            </div>
            <button
              onClick={() => setBanAlert(null)}
              className="mt-5 w-full border-2 border-black bg-black py-2.5 font-mono text-xs font-black uppercase text-white shadow-[3px_3px_0px_#000000] hover:bg-zinc-800 transition-all cursor-pointer"
            >
              Acknowledge &amp; Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL 4: BAN PROMPT FORM ── */}
      {banPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm border-[3px] border-black bg-white p-5 shadow-[6px_6px_0px_#000000]">
            <h3 className="font-mono text-sm font-black uppercase text-black mb-1">
              Revoke Entry / Ban {banPrompt.name}
            </h3>
            <p className="font-mono text-[11px] text-zinc-600 mb-3">
              This will immediately deactivate their QR code across all scanners and log your staff ID to the audit trail.
            </p>
            <input
              type="text"
              placeholder="Reason (e.g. Conduct violation, counterfeit pass)"
              value={banReasonInput}
              onChange={(e) => setBanReasonInput(e.target.value)}
              className="w-full border-2 border-black bg-zinc-50 p-2 font-mono text-xs text-black outline-none focus:bg-white mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setBanPrompt(null)}
                className="flex-1 border-2 border-black bg-white py-2 font-mono text-xs font-bold uppercase text-black hover:bg-zinc-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={executeBan}
                className="flex-1 border-2 border-black bg-red-600 py-2 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_#000000] hover:bg-red-700 cursor-pointer"
              >
                Confirm Ban
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
