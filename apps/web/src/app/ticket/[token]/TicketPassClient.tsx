"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@awssbg/shared";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import {
  HiOutlineCheckBadge,
  HiOutlineCalendar,
  HiOutlineMapPin,
  HiOutlineBuildingOffice,
  HiOutlineShieldCheck,
  HiOutlineArrowDownTray,
} from "react-icons/hi2";

export default function TicketPassClient() {
  const params = useParams();
  const token = Array.isArray(params?.token) ? params.token[0] : (params?.token as string) || "";

  const [ticketData, setTicketData] = useState<any | null>(null);
  const [eventData, setEventData] = useState<any | null>(null);
  const [sponsorScans, setSponsorScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTicket = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      // 1. Fetch Registration
      const { data: reg, error: regErr } = await supabase
        .from("event_registrations")
        .select(`
          id,
          first_name,
          last_name,
          email,
          affiliation_detail,
          status,
          assigned_role,
          assigned_queue,
          qr_token,
          checked_in,
          checked_in_at,
          event_id,
          event:events (
            id,
            title,
            subtitle,
            venue_name,
            start_time,
            end_time
          )
        `)
        .eq("qr_token", token)
        .single();

      if (regErr || !reg) {
        setTicketData(null);
        setLoading(false);
        return;
      }

      setTicketData(reg);
      setEventData((reg as any).event);

      // 2. Fetch Sponsor Scan History (Requirement R12)
      const { data: scans } = await supabase
        .from("sponsor_leads")
        .select(`
          id,
          scanned_at,
          sponsor:sponsor_companies (
            name,
            tier
          )
        `)
        .eq("registration_id", reg.id)
        .order("scanned_at", { ascending: false });

      if (scans) setSponsorScans(scans);
    } catch (err) {
      console.error("Ticket fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F4F5] flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin border-3 border-black border-t-[#7C3AED]" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!ticketData) {
    return (
      <div className="min-h-screen bg-[#F4F4F5] flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md border-[3px] border-black bg-white p-8 text-center shadow-[8px_8px_0px_#000000]">
            <div className="mb-2 inline-block border border-black bg-red-600 px-2 py-0.5 font-mono text-[9px] font-black uppercase text-white">
              // INVALID_PASS
            </div>
            <h1 className="text-2xl font-black uppercase text-black">Pass Not Found</h1>
            <p className="mt-2 font-mono text-xs text-zinc-600">
              The ticket code you presented could not be validated. Please check the link in your email.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block border-2 border-black bg-black px-4 py-2 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_#7C3AED]"
            >
              Return to Hub &rarr;
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(ticketData.qr_token)}&bgcolor=FFFFFF&color=000000&margin=10`;
  const isVip = ticketData.assigned_role === "VIP";

  return (
    <div className="min-h-screen bg-[#F4F4F5] flex flex-col">
      <Header />

      <main className="flex-1 p-4 sm:p-6 md:py-10">
        <div className="mx-auto max-w-md space-y-6">
          {/* Main Neo-Brutalist Ticket Badge */}
          <div className="border-[4px] border-black bg-white shadow-[8px_8px_0px_#000000] overflow-hidden">
            {/* Header Stamp */}
            <div className={`p-4 text-white border-b-[3px] border-black ${isVip ? "bg-[#2563EB]" : "bg-black"}`}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-black uppercase tracking-widest text-white/90">
                  // OFFICIAL_ENTRY_PASS
                </span>
                <span className="border border-white/50 px-2 py-0.2 font-mono text-[9px] font-black uppercase">
                  {ticketData.assigned_role}
                </span>
              </div>
              <h1 className="mt-1 text-xl font-black uppercase tracking-tight text-white leading-tight">
                {eventData?.title}
              </h1>
            </div>

            {/* QR Code Container */}
            <div className="p-6 text-center bg-white">
              <div className="mx-auto inline-block border-[3px] border-black p-3 bg-white shadow-[4px_4px_0px_#000000]">
                <img
                  src={qrImageUrl}
                  alt="Official Entry QR"
                  width={220}
                  height={220}
                  className="mx-auto block"
                />
                <div className="mt-2 font-mono text-[10px] font-bold text-zinc-500 uppercase">
                  Scan at Registration Desk
                </div>
              </div>

              {/* Attendee Info */}
              <div className="mt-5">
                <h2 className="text-2xl font-black uppercase text-black">
                  {ticketData.first_name} {ticketData.last_name}
                </h2>
                <p className="font-mono text-xs text-zinc-600 mt-0.5">
                  {ticketData.affiliation_detail}
                </p>
              </div>

              {/* Assigned Line Directive */}
              <div className="mt-5 border-[3px] border-black bg-[#F4F4F5] p-3 text-center">
                <span className="font-mono text-[10px] font-black uppercase text-zinc-500 block">
                  ASSIGNED KEYCARD PICKUP:
                </span>
                <span className={`font-mono text-2xl font-black tracking-tight ${isVip ? "text-[#2563EB]" : "text-[#7C3AED]"}`}>
                  {isVip ? "VIP FAST-TRACK LANE" : `LINE ${ticketData.assigned_queue || 1}`}
                </span>
              </div>

              {/* Check-In Status */}
              <div className="mt-4 pt-3 border-t-2 border-black/10 flex items-center justify-center gap-1.5 font-mono text-xs font-black uppercase">
                {ticketData.checked_in ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <HiOutlineCheckBadge className="h-4 w-4" />
                    ADMITTED AT VENUE
                  </span>
                ) : (
                  <span className="text-zinc-500">
                    STATUS: CONFIRMED &bull; READY FOR CHECK-IN
                  </span>
                )}
              </div>
            </div>

            {/* Event Details Footer */}
            <div className="border-t-[3px] border-black bg-zinc-100 p-4 font-mono text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-zinc-800">
                <HiOutlineMapPin className="h-4 w-4 text-[#7C3AED] shrink-0" />
                <span>{eventData?.venue_name}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-800">
                <HiOutlineCalendar className="h-4 w-4 text-[#2563EB] shrink-0" />
                <span>
                  {eventData?.start_time &&
                    new Date(eventData.start_time).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                </span>
              </div>
            </div>
          </div>

          {/* ── REQUIREMENT R12: PARTICIPANT CONSENT & SCAN HISTORY ── */}
          <div className="border-[3px] border-black bg-white p-5 shadow-[4px_4px_0px_#000000]">
            <div className="flex items-center gap-2 border-b-2 border-black pb-2 mb-3">
              <HiOutlineShieldCheck className="h-5 w-5 text-[#7C3AED]" />
              <div>
                <h3 className="font-mono text-xs font-black uppercase text-black">
                  POPIA Transparency &amp; Booth Scans
                </h3>
                <span className="font-mono text-[10px] text-zinc-500">
                  Live audit log of sponsors who scanned your badge
                </span>
              </div>
            </div>

            {sponsorScans.length > 0 ? (
              <div className="space-y-2">
                {sponsorScans.map((s) => (
                  <div
                    key={s.id}
                    className="border border-black bg-zinc-50 p-2.5 flex items-center justify-between font-mono text-xs"
                  >
                    <div>
                      <strong className="text-black uppercase">{s.sponsor?.name}</strong>
                      <div className="text-[10px] text-zinc-500">
                        Scanned at {new Date(s.scanned_at).toLocaleTimeString()}
                      </div>
                    </div>
                    <span className="border border-black bg-zinc-200 px-1.5 py-0.2 text-[9px] font-black uppercase">
                      {s.sponsor?.tier}
                    </span>
                  </div>
                ))}

                <div className="mt-3 border-t border-dashed border-black/30 pt-2 font-mono text-[10px] text-zinc-500 space-y-1">
                  <p>
                    <strong>30-Day Data Retention Policy:</strong> Sponsor scan logs are automatically purged from the AWS SBG platform 30 days after the event.
                  </p>
                  <p>
                    To request immediate deletion of your shared details from a specific sponsor's database, contact them directly or submit a request to <span className="font-bold text-black">privacy@awssbg.online</span>.
                  </p>
                </div>
              </div>
            ) : (
              <div className="font-mono text-[11px] text-zinc-500 space-y-2">
                <p>
                  No sponsor booths have scanned your badge yet. Visit booths in the expo hall to network and share contact info.
                </p>
                <div className="border-t border-dashed border-black/30 pt-2 text-[10px]">
                  <strong>Notice:</strong> When an official sponsor scans your QR code, their company will appear here in real time. Under POPIA, sponsor scan data is automatically purged after 30 days.
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
