"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { supabase, EventItem, logActivity } from "@awssbg/shared";
import { EventCreationWizard } from "./EventCreationWizard";
import {
  HiPlus,
  HiOutlineTicket,
  HiOutlineCalendar,
  HiOutlineMapPin,
  HiOutlineUsers,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineTrash,
  HiOutlineLink,
  HiOutlineCheck,
} from "react-icons/hi2";

interface EventsManagerProps {
  currentOrgId: string;
  actorId: string;
  actorName: string;
  isSuperAdmin: boolean;
  token: string;
}

export function EventsManager({
  currentOrgId,
  actorId,
  actorName,
  isSuperAdmin,
  token,
}: EventsManagerProps) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [regCounts, setRegCounts] = useState<Record<string, number>>({});

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from("events").select("*").order("start_time", { ascending: false });
      if (currentOrgId && currentOrgId !== "all") {
        query = query.eq("org_id", currentOrgId);
      }

      const { data, error } = await query;
      if (error) throw error;
      const loaded = (data as EventItem[]) || [];
      setEvents(loaded);

      // Fetch registration counts for each event
      const counts: Record<string, number> = {};
      for (const ev of loaded) {
        const { count } = await supabase
          .from("event_registrations")
          .select("id", { count: "exact", head: true })
          .eq("event_id", ev.id);
        counts[ev.id] = count || 0;
      }
      setRegCounts(counts);
    } catch (err: any) {
      toast.error("Failed to load events", { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [currentOrgId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleStatusChange = async (eventId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("events")
        .update({ status: newStatus })
        .eq("id", eventId);

      if (error) throw error;
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, status: newStatus as any } : e))
      );
      toast.success("Event status updated");
    } catch (e: any) {
      toast.error("Failed to update status", { description: e.message });
    }
  };

  const handleDeleteEvent = async (eventId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete event "${title}" and all its attendees/tickets?`)) {
      return;
    }

    try {
      const { error } = await supabase.from("events").delete().eq("id", eventId);
      if (error) throw error;

      await logActivity(supabase, {
        org_id: currentOrgId,
        actor_id: actorId,
        actor_name: actorName,
        action: "DELETE_EVENT",
        entity_type: "announcement",
        entity_id: eventId,
        summary: `Deleted event "${title}"`,
      });

      toast.success("Event deleted");
      fetchEvents();
    } catch (err: any) {
      toast.error("Failed to delete event", { description: err.message });
    }
  };

  const handleCopyLink = (slug: string) => {
    const url = `https://awssbg.online/events/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Registration Link Copied!", { description: url });
  };

  return (
    <div className="space-y-5">
      {/* View Header */}
      <div className="border-[3px] border-black bg-white p-4 sm:p-5 shadow-[4px_4px_0px_#000000]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="mb-1 inline-block border border-black bg-black px-2 py-0.2 font-mono text-[9px] font-black uppercase text-white">
              // EVENTS_&amp;_TICKETING_ENGINE
            </div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black">
              Event Management &amp; Pass Logistics
            </h1>
            <p className="font-mono text-xs text-zinc-600 mt-0.5">
              Build custom registration forms, balance keycard queues, and manage e-ticket operations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://events.awssbg.online"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 border-2 border-black bg-white px-3.5 py-2 font-mono text-xs font-bold uppercase text-black shadow-[2px_2px_0px_#000000] hover:bg-zinc-100 transition-all cursor-pointer"
            >
              <HiOutlineArrowTopRightOnSquare className="h-4 w-4" />
              <span>Open Scanner Desk</span>
            </a>

            <button
              onClick={() => setShowWizard(true)}
              className="inline-flex items-center gap-1.5 border-2 border-black bg-black px-4 py-2 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_#7C3AED] hover:bg-accent-purple active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
            >
              <HiPlus className="h-4 w-4" />
              <span>Add Event</span>
            </button>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="space-y-4">
        {events.map((ev) => {
          const registered = regCounts[ev.id] || 0;
          const isAtCapacity = registered >= ev.capacity_limit;

          return (
            <div
              key={ev.id}
              className="border-[3px] border-black bg-white p-5 shadow-[5px_5px_0px_#000000] flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="border border-black bg-black px-2 py-0.5 font-mono text-[9px] font-black uppercase text-white">
                    {ev.status.toUpperCase()}
                  </span>
                  {isAtCapacity && (
                    <span className="border border-black bg-amber-400 px-2 py-0.5 font-mono text-[9px] font-black uppercase text-black">
                      CAPACITY REACHED
                    </span>
                  )}
                  <span className="font-mono text-[11px] font-bold text-zinc-500">
                    /events/{ev.slug}
                  </span>
                </div>

                <h3 className="font-mono text-lg font-black uppercase text-black">
                  {ev.title}
                </h3>
                {ev.subtitle && (
                  <p className="font-mono text-xs text-zinc-600 line-clamp-1">{ev.subtitle}</p>
                )}

                <div className="flex flex-wrap items-center gap-4 font-mono text-xs text-zinc-700 pt-1">
                  <div className="flex items-center gap-1.5">
                    <HiOutlineMapPin className="h-4 w-4 text-accent-purple" />
                    <span>{ev.venue_name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <HiOutlineCalendar className="h-4 w-4 text-accent-blue" />
                    <span>{new Date(ev.start_time).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold">
                    <HiOutlineUsers className="h-4 w-4 text-black" />
                    <span>{registered} / {ev.capacity_limit} Registered</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap md:flex-col gap-2 shrink-0 justify-end">
                <button
                  onClick={() => handleCopyLink(ev.slug)}
                  className="inline-flex items-center gap-1 border-2 border-black bg-zinc-50 px-3 py-1.5 font-mono text-xs font-bold uppercase text-black hover:bg-zinc-100 cursor-pointer shadow-[1px_1px_0px_#000000]"
                >
                  <HiOutlineLink className="h-3.5 w-3.5" />
                  <span>Copy Form Link</span>
                </button>

                <a
                  href={`https://awssbg.online/events/${ev.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 border-2 border-black bg-white px-3 py-1.5 font-mono text-xs font-bold uppercase text-black hover:bg-zinc-100 cursor-pointer shadow-[1px_1px_0px_#000000]"
                >
                  <HiOutlineArrowTopRightOnSquare className="h-3.5 w-3.5" />
                  <span>View Public Form</span>
                </a>

                <div className="flex items-center gap-2">
                  <select
                    value={ev.status}
                    onChange={(e) => handleStatusChange(ev.id, e.target.value)}
                    className="border-2 border-black bg-white px-2 py-1 font-mono text-xs font-bold text-black cursor-pointer"
                  >
                    <option value="draft">Draft</option>
                    <option value="published_open">Published (Open)</option>
                    <option value="waitlist_only">Waitlist Only</option>
                    <option value="registration_closed">Closed</option>
                  </select>

                  <button
                    onClick={() => handleDeleteEvent(ev.id, ev.title)}
                    className="border-2 border-black bg-red-50 text-red-600 p-1.5 hover:bg-red-100 cursor-pointer shadow-[1px_1px_0px_#000000]"
                    title="Delete event"
                  >
                    <HiOutlineTrash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {events.length === 0 && !loading && (
          <div className="border-[3px] border-dashed border-black bg-white py-16 text-center shadow-[4px_4px_0px_#000000]">
            <p className="font-mono text-xs font-bold uppercase text-zinc-600">
              No events created yet. Click &quot;Add Event&quot; above to launch a new community summit or Study Jam.
            </p>
          </div>
        )}
      </div>

      {/* 5-Step Event Creation Wizard Modal */}
      <EventCreationWizard
        currentOrgId={currentOrgId}
        actorId={actorId}
        actorName={actorName}
        token={token}
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onEventCreated={fetchEvents}
      />
    </div>
  );
}
