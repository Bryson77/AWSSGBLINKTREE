"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { supabase, EventItem, Post, Organization, logActivity, sanitizeContent } from "@awssbg/shared";
import { marked } from "marked";
import { EventCreationWizard } from "./EventCreationWizard";
import { ImageUploadModal } from "./ImageUploadModal";
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
  HiOutlinePhoto,
  HiOutlinePencilSquare,
  HiOutlineXMark,
  HiOutlineDocumentText,
  HiOutlineListBullet,
  HiOutlineCodeBracket,
  HiOutlineChatBubbleBottomCenterText,
} from "react-icons/hi2";

interface EventsManagerProps {
  currentOrgId: string;
  actorId: string;
  actorName: string;
  isSuperAdmin: boolean;
  token: string;
  orgs?: Organization[];
}

export function EventsManager({
  currentOrgId,
  actorId,
  actorName,
  isSuperAdmin,
  token,
  orgs = [],
}: EventsManagerProps) {
  const [subTab, setSubTab] = useState<"scheduled" | "recaps">("scheduled");

  // Scheduled events state
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [regCounts, setRegCounts] = useState<Record<string, number>>({});

  // Previous Events / Recaps Feed state
  const [recaps, setRecaps] = useState<Post[]>([]);
  const [loadingRecaps, setLoadingRecaps] = useState(false);
  const [isRecapEditorOpen, setIsRecapEditorOpen] = useState(false);
  const [editingRecap, setEditingRecap] = useState<{
    id?: string;
    org_id: string;
    title: string;
    slug: string;
    venue: string;
    date: string;
    content: string;
    photos: string[];
    links: Array<{ title: string; url: string }>;
    status: "draft" | "published";
  } | null>(null);

  // Modals for recap editor
  const [showCoverUpload, setShowCoverUpload] = useState(false);
  const [showGalleryUpload, setShowGalleryUpload] = useState(false);
  const [showInlineImageModal, setShowInlineImageModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkInput, setLinkInput] = useState({ text: "", url: "" });
  const [newResourceLink, setNewResourceLink] = useState({ title: "", url: "" });
  const [recapPreviewHtml, setRecapPreviewHtml] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const fetchRecaps = useCallback(async () => {
    setLoadingRecaps(true);
    try {
      let query = supabase.from("posts").select("*").order("published_at", { ascending: false });
      if (currentOrgId && currentOrgId !== "all") {
        query = query.eq("org_id", currentOrgId);
      }
      const { data, error } = await query;
      if (error) throw error;
      setRecaps((data as Post[]) || []);
    } catch (err: any) {
      console.error("Failed to load recaps:", err);
      toast.error("Failed to load event recaps.");
    } finally {
      setLoadingRecaps(false);
    }
  }, [currentOrgId]);

  useEffect(() => {
    fetchEvents();
    fetchRecaps();
  }, [fetchEvents, fetchRecaps]);

  // Update markdown preview when editing recap content
  useEffect(() => {
    if (!editingRecap?.content) {
      setRecapPreviewHtml("");
      return;
    }
    Promise.resolve(marked.parse(editingRecap.content)).then((html: string) => {
      setRecapPreviewHtml(sanitizeContent(html));
    });
  }, [editingRecap?.content]);

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

  // ── Recap Helper Methods ──
  const insertAtCursor = (before: string, after: string = "", defaultText: string = "") => {
    if (!textareaRef.current || !editingRecap) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const currentContent = editingRecap.content || "";
    const selectedText = currentContent.substring(start, end) || defaultText;
    const replacement = before + selectedText + after;
    const newContent =
      currentContent.substring(0, start) + replacement + currentContent.substring(end);
    setEditingRecap({ ...editingRecap, content: newContent });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 50);
  };

  const handleCreateNewRecap = () => {
    const defaultOrg =
      currentOrgId && currentOrgId !== "all"
        ? currentOrgId
        : orgs[0]?.id || "";

    setEditingRecap({
      org_id: defaultOrg,
      title: "",
      slug: "",
      venue: "AWS Student Builder Group Hub",
      date: new Date().toISOString().split("T")[0],
      content: "",
      photos: [],
      links: [],
      status: "published",
    });
    setIsRecapEditorOpen(true);
  };

  const handleEditRecap = (post: Post) => {
    // Extract any existing markdown images into photos
    const extractedPhotos: string[] = [];
    if (post.cover_image_url) extractedPhotos.push(post.cover_image_url);

    const regex = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/g;
    let match;
    while ((match = regex.exec(post.content || "")) !== null) {
      if (match[1] && !extractedPhotos.includes(match[1])) {
        extractedPhotos.push(match[1]);
      }
    }

    setEditingRecap({
      id: post.id,
      org_id: post.org_id,
      title: post.title,
      slug: post.slug,
      venue: "AWS Student Builder Group Hub",
      date: post.published_at
        ? new Date(post.published_at).toISOString().split("T")[0]
        : new Date(post.created_at).toISOString().split("T")[0],
      content: post.content,
      photos: extractedPhotos,
      links: [],
      status: post.status,
    });
    setIsRecapEditorOpen(true);
  };

  const handleDeleteRecap = async (post: Post) => {
    if (!confirm(`Are you sure you want to delete recap "${post.title}"?`)) {
      return;
    }

    try {
      const { error } = await supabase.from("posts").delete().eq("id", post.id);
      if (error) throw error;

      await logActivity(supabase, {
        org_id: post.org_id,
        actor_id: actorId,
        actor_name: actorName,
        action: "DELETE_POST",
        entity_type: "post",
        entity_id: post.id,
        summary: `Deleted event recap "${post.title}"`,
      });

      toast.success("Event recap deleted");
      fetchRecaps();
    } catch (err: any) {
      toast.error("Failed to delete recap: " + err.message);
    }
  };

  const handleSaveRecap = async (publish: boolean) => {
    if (!editingRecap) return;
    if (!editingRecap.title.trim()) {
      toast.error("Please enter an event title");
      return;
    }
    if (!editingRecap.org_id) {
      toast.error("Please select a target SBG");
      return;
    }

    try {
      const baseSlug =
        editingRecap.slug.trim() ||
        editingRecap.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

      const slug = baseSlug.startsWith("event-") ? baseSlug : `event-${baseSlug}`;
      const coverImage = editingRecap.photos[0] || null;

      // Construct content preserving narrative and gallery
      let finalContent = editingRecap.content.trim();

      // Append any gallery photos not already in content
      const missingPhotos = editingRecap.photos.filter(
        (url) => !finalContent.includes(url)
      );
      if (missingPhotos.length > 0) {
        finalContent += "\n\n### Event Photo Gallery\n\n";
        for (const pUrl of missingPhotos) {
          finalContent += `![Event highlight](${pUrl})\n\n`;
        }
      }

      const payload = {
        org_id: editingRecap.org_id,
        title: editingRecap.title.trim(),
        slug,
        content: finalContent,
        cover_image_url: coverImage,
        status: publish ? ("published" as const) : ("draft" as const),
        published_at: publish
          ? new Date(editingRecap.date).toISOString()
          : null,
      };

      if (editingRecap.id) {
        const { error } = await supabase
          .from("posts")
          .update(payload)
          .eq("id", editingRecap.id);
        if (error) throw error;
        toast.success("Event recap updated!");
      } else {
        const { error } = await supabase.from("posts").insert([payload]);
        if (error) throw error;
        toast.success("Event recap published to community feed!");
      }

      setIsRecapEditorOpen(false);
      setEditingRecap(null);
      fetchRecaps();
    } catch (err: any) {
      toast.error("Failed saving event recap: " + err.message);
    }
  };

  const handleAddResourceLink = () => {
    if (!newResourceLink.title.trim() || !newResourceLink.url.trim()) {
      toast.error("Please provide both link title and URL");
      return;
    }
    if (editingRecap) {
      setEditingRecap({
        ...editingRecap,
        links: [...editingRecap.links, { ...newResourceLink }],
      });
      setNewResourceLink({ title: "", url: "" });
    }
  };

  return (
    <div className="space-y-5">
      {/* View Header */}
      <div className="border-[3px] border-black bg-white p-4 sm:p-5 shadow-[4px_4px_0px_#000000]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="mb-1 inline-block border border-black bg-black px-2 py-0.2 font-mono text-[9px] font-black uppercase text-white">
              // EVENTS_&amp;_COMMUNITY_FEED_ENGINE
            </div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black">
              Event Logistics &amp; Community Recaps Feed
            </h1>
            <p className="font-mono text-xs text-zinc-600 mt-0.5">
              Manage live attendee passes, registration queues, and post-event multi-photo recap feeds.
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

            {subTab === "scheduled" ? (
              <button
                onClick={() => setShowWizard(true)}
                className="inline-flex items-center gap-1.5 border-2 border-black bg-black px-4 py-2 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_#7C3AED] hover:bg-accent-purple active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
              >
                <HiPlus className="h-4 w-4" />
                <span>Add Scheduled Event</span>
              </button>
            ) : (
              <button
                onClick={handleCreateNewRecap}
                className="inline-flex items-center gap-1.5 border-2 border-black bg-purple-600 px-4 py-2 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_#000000] hover:bg-purple-700 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
              >
                <HiPlus className="h-4 w-4" />
                <span>Post Event Recap to Feed</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex border-[3px] border-black bg-zinc-100 shadow-[3px_3px_0px_#000000]">
        <button
          onClick={() => setSubTab("scheduled")}
          className={`flex-1 flex items-center justify-center gap-2 border-r-[3px] border-black px-4 py-3 font-mono text-xs font-black uppercase transition-all cursor-pointer ${
            subTab === "scheduled"
              ? "bg-black text-white"
              : "bg-white text-zinc-700 hover:bg-zinc-100"
          }`}
        >
          <HiOutlineTicket className="h-4 w-4 text-purple-400" />
          <span>Live Passes &amp; Queues ({events.length})</span>
        </button>

        <button
          onClick={() => setSubTab("recaps")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-mono text-xs font-black uppercase transition-all cursor-pointer ${
            subTab === "recaps"
              ? "bg-black text-white"
              : "bg-white text-zinc-700 hover:bg-zinc-100"
          }`}
        >
          <HiOutlinePhoto className="h-4 w-4 text-purple-400" />
          <span>Previous Events Feed ({recaps.length})</span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SUB-TAB 1: SCHEDULED EVENTS & TICKETS */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {subTab === "scheduled" && (
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
                No scheduled events yet. Click &quot;Add Scheduled Event&quot; above to launch a new pass.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SUB-TAB 2: PREVIOUS EVENTS & COMMUNITY RECAPS FEED */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {subTab === "recaps" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-2 border-black bg-white p-3 shadow-[2px_2px_0px_#000000]">
            <div className="font-mono text-xs font-bold text-zinc-700">
              Community Feed Posts appear publicly on <span className="text-purple-600 font-bold">/{currentOrgId !== "all" ? orgs.find(o => o.id === currentOrgId)?.slug || "campus" : "campus"}/events</span>.
            </div>
            <button
              onClick={handleCreateNewRecap}
              className="inline-flex items-center gap-1 border-2 border-black bg-black px-3 py-1 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_#7C3AED] hover:bg-purple-700 cursor-pointer"
            >
              <HiPlus className="h-3.5 w-3.5" />
              <span>Compose Recap</span>
            </button>
          </div>

          {loadingRecaps ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-28 animate-pulse border-2 border-black bg-zinc-200" />
              ))}
            </div>
          ) : recaps.length === 0 ? (
            <div className="border-[3px] border-dashed border-black bg-white py-14 text-center shadow-[4px_4px_0px_#000000]">
              <HiOutlinePhoto className="h-10 w-10 text-zinc-400 mx-auto mb-2" />
              <p className="font-mono text-xs font-bold uppercase text-zinc-600">
                No event recaps published yet. Click &quot;Compose Recap&quot; to publish your first multi-photo session story!
              </p>
            </div>
          ) : (
            recaps.map((recap) => {
              const recapOrg = orgs.find((o) => o.id === recap.org_id);
              const orgSlug = recapOrg?.slug || "tut";

              return (
                <div
                  key={recap.id}
                  className="border-[3px] border-black bg-white p-4 sm:p-5 shadow-[4px_4px_0px_#000000] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    {recap.cover_image_url ? (
                      <div className="h-16 w-24 shrink-0 overflow-hidden border-2 border-black bg-zinc-100 shadow-[2px_2px_0px_#000000]">
                        <img
                          src={recap.cover_image_url}
                          alt={recap.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-16 w-24 shrink-0 flex items-center justify-center border-2 border-black bg-zinc-100 font-mono text-[10px] text-zinc-400">
                        NO PHOTO
                      </div>
                    )}

                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className={`border border-black px-1.5 py-0.2 font-mono text-[9px] font-black uppercase ${
                            recap.status === "published"
                              ? "bg-emerald-400 text-black"
                              : "bg-amber-300 text-black"
                          }`}
                        >
                          {recap.status}
                        </span>
                        {recapOrg && (
                          <span className="border border-black bg-purple-100 text-purple-900 px-1.5 py-0.2 font-mono text-[9px] font-black uppercase">
                            @{recapOrg.slug.toUpperCase()}
                          </span>
                        )}
                        <span className="font-mono text-[10px] text-zinc-500">
                          /{recap.slug}
                        </span>
                      </div>
                      <h4 className="text-sm font-black uppercase tracking-tight text-black line-clamp-1">
                        {recap.title}
                      </h4>
                      <div className="mt-1 font-mono text-[11px] text-zinc-600">
                        {recap.published_at
                          ? new Date(recap.published_at).toLocaleDateString()
                          : "Draft"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <a
                      href={`https://awssbg.online/${orgSlug}/events`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 border-2 border-black bg-white px-2.5 py-1.5 font-mono text-xs font-bold text-black hover:bg-zinc-100 shadow-[1px_1px_0px_#000000] cursor-pointer"
                      title="View on public SBG events feed"
                    >
                      <HiOutlineArrowTopRightOnSquare className="h-3.5 w-3.5" />
                      <span>Feed</span>
                    </a>

                    <button
                      onClick={() => handleEditRecap(recap)}
                      className="flex items-center gap-1 border-2 border-black bg-zinc-100 px-3 py-1.5 font-mono text-xs font-bold text-black hover:bg-black hover:text-white transition-colors cursor-pointer shadow-[1px_1px_0px_#000000]"
                    >
                      <HiOutlinePencilSquare className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleDeleteRecap(recap)}
                      className="flex items-center gap-1 border-2 border-black bg-zinc-100 px-2.5 py-1.5 font-mono text-xs font-bold text-red-600 hover:bg-red-600 hover:text-white transition-colors cursor-pointer shadow-[1px_1px_0px_#000000]"
                      title="Delete recap"
                    >
                      <HiOutlineTrash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* RECAP COMPOSE / EDIT MODAL */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {isRecapEditorOpen && editingRecap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-2 sm:p-4 backdrop-blur-xs">
          <div className="flex flex-col h-full max-h-[96vh] w-full max-w-5xl border-[3px] border-black bg-white shadow-[10px_10px_0px_#000000]">
            {/* Modal Top Bar */}
            <div className="flex items-center justify-between border-b-[3px] border-black bg-black px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <HiOutlinePhoto className="h-5 w-5 text-purple-400" />
                <h3 className="font-mono text-xs font-black uppercase tracking-wider">
                  {editingRecap.id ? "Edit Community Event Feed Post" : "Compose Previous Event Recap Feed Post"}
                </h3>
              </div>
              <button
                onClick={() => setIsRecapEditorOpen(false)}
                className="text-white hover:text-purple-400 cursor-pointer"
              >
                <HiOutlineXMark className="h-5 w-5" />
              </button>
            </div>

            {/* Meta Inputs Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 border-b-[3px] border-black bg-zinc-50 p-4">
              {orgs.length > 0 && isSuperAdmin && (
                <div>
                  <label className="mb-1 block font-mono text-[10px] font-black uppercase text-black">
                    Target SBG Campus *
                  </label>
                  <select
                    value={editingRecap.org_id}
                    onChange={(e) => setEditingRecap({ ...editingRecap, org_id: e.target.value })}
                    className="w-full border-2 border-black bg-white px-2.5 py-1.5 font-mono text-xs font-bold text-black focus:outline-none focus:ring-1 focus:ring-purple-600 cursor-pointer"
                  >
                    {orgs.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} (@{o.slug})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className={orgs.length > 0 && isSuperAdmin ? "md:col-span-1" : "md:col-span-2"}>
                <label className="mb-1 block font-mono text-[10px] font-black uppercase text-black">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS Cloud Clubs Orientation 2026"
                  value={editingRecap.title}
                  onChange={(e) => {
                    const val = e.target.value;
                    const autoSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                    setEditingRecap({
                      ...editingRecap,
                      title: val,
                      slug: editingRecap.id ? editingRecap.slug : `event-${autoSlug}`,
                    });
                  }}
                  className="w-full border-2 border-black bg-white px-2.5 py-1.5 font-sans text-xs font-bold text-black focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="mb-1 block font-mono text-[10px] font-black uppercase text-black">
                  Event Date *
                </label>
                <input
                  type="date"
                  required
                  value={editingRecap.date}
                  onChange={(e) => setEditingRecap({ ...editingRecap, date: e.target.value })}
                  className="w-full border-2 border-black bg-white px-2.5 py-1.5 font-mono text-xs text-black focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="mb-1 block font-mono text-[10px] font-black uppercase text-black">
                  Venue / Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. TUT Soshanguve South Campus"
                  value={editingRecap.venue}
                  onChange={(e) => setEditingRecap({ ...editingRecap, venue: e.target.value })}
                  className="w-full border-2 border-black bg-white px-2.5 py-1.5 font-mono text-xs text-black focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>
            </div>

            {/* Multiple Photos Gallery Management Bar */}
            <div className="border-b-[3px] border-black bg-purple-50 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 font-mono text-[11px] font-black uppercase text-black">
                  <HiOutlinePhoto className="h-4 w-4 text-purple-600" />
                  <span>Event Photo Gallery ({editingRecap.photos.length} Photos Attached)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGalleryUpload(true)}
                  className="inline-flex items-center gap-1 border-2 border-black bg-white px-2.5 py-1 font-mono text-[10px] font-black uppercase text-black shadow-[2px_2px_0px_#000000] hover:bg-black hover:text-white cursor-pointer"
                >
                  <HiPlus className="h-3 w-3" />
                  <span>+ Attach Photo</span>
                </button>
              </div>

              {/* Photo Thumbnails Strip */}
              {editingRecap.photos.length > 0 ? (
                <div className="flex items-center gap-2.5 overflow-x-auto py-1">
                  {editingRecap.photos.map((pUrl, pIdx) => (
                    <div
                      key={pIdx}
                      className="relative h-16 w-24 shrink-0 overflow-hidden border-2 border-black bg-white shadow-[2px_2px_0px_#000000] group"
                    >
                      <img src={pUrl} alt={`Photo ${pIdx + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() =>
                          setEditingRecap({
                            ...editingRecap,
                            photos: editingRecap.photos.filter((_, i) => i !== pIdx),
                          })
                        }
                        className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center border border-black bg-red-600 text-white hover:bg-black cursor-pointer shadow-[1px_1px_0px_#000000]"
                        title="Remove photo"
                      >
                        <HiOutlineXMark className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="font-mono text-[10px] text-zinc-600 italic">
                  No photos attached yet. Click &quot;+ Attach Photo&quot; to add event highlights, stage photos, and attendee selfies.
                </p>
              )}
            </div>

            {/* Split Editor Body */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left: Markdown Editor with Toolbar */}
              <div className="flex-1 flex flex-col p-4 border-r-[3px] border-black">
                {/* Formatting Toolbar */}
                <div className="mb-2 flex flex-wrap items-center gap-1.5 border-2 border-black bg-zinc-100 p-1.5 shadow-[2px_2px_0px_#000000]">
                  <button
                    type="button"
                    onClick={() => setShowInlineImageModal(true)}
                    className="flex items-center gap-1 border border-black bg-purple-600 px-2 py-1 font-mono text-[10px] font-black uppercase text-white hover:bg-purple-700 cursor-pointer"
                    title="Upload picture in narrative"
                  >
                    <HiOutlinePhoto className="h-3.5 w-3.5" />
                    <span>+ Picture</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowLinkModal(true)}
                    className="flex items-center gap-1 border border-black bg-white px-2 py-1 font-mono text-[10px] font-black uppercase text-black hover:bg-zinc-200 cursor-pointer"
                    title="Insert hyperlink"
                  >
                    <HiOutlineLink className="h-3.5 w-3.5 text-purple-600" />
                    <span>+ Link</span>
                  </button>

                  <div className="h-4 w-[1px] bg-zinc-400 mx-0.5" />

                  <button
                    type="button"
                    onClick={() => insertAtCursor("**", "**", "bold text")}
                    className="border border-black bg-white px-2 py-1 font-mono text-[10px] font-black text-black hover:bg-zinc-200 cursor-pointer"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() => insertAtCursor("*", "*", "italic text")}
                    className="border border-black bg-white px-2 py-1 font-mono text-[10px] font-black italic text-black hover:bg-zinc-200 cursor-pointer"
                  >
                    I
                  </button>
                  <button
                    type="button"
                    onClick={() => insertAtCursor("\n\n## ", "\n", "Recap Section")}
                    className="border border-black bg-white px-2 py-1 font-mono text-[10px] font-black text-black hover:bg-zinc-200 cursor-pointer"
                  >
                    H2
                  </button>
                  <button
                    type="button"
                    onClick={() => insertAtCursor("\n\n- ", "\n", "Key takeaway")}
                    className="flex items-center gap-1 border border-black bg-white px-1.5 py-1 font-mono text-[10px] font-bold text-black hover:bg-zinc-200 cursor-pointer"
                  >
                    <HiOutlineListBullet className="h-3.5 w-3.5" />
                  </button>
                </div>

                <textarea
                  ref={textareaRef}
                  value={editingRecap.content}
                  onChange={(e) => setEditingRecap({ ...editingRecap, content: e.target.value })}
                  placeholder="Write the event story, attendee turnouts, Study Jam highlights, and key takeaways in Markdown..."
                  className="w-full flex-1 resize-none border-2 border-black bg-zinc-50 p-3 font-mono text-xs text-black leading-relaxed focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>

              {/* Right: Live Preview */}
              <div className="flex-1 flex flex-col p-4 overflow-y-auto bg-white">
                <div className="mb-2 font-mono text-[10px] font-bold text-zinc-500 uppercase">
                  Feed Card Live Preview
                </div>
                <div className="border-[3px] border-black bg-white p-4 flex-1 overflow-y-auto shadow-[4px_4px_0px_#000000]">
                  <div className="mb-2 inline-block border border-black bg-black px-2 py-0.5 font-mono text-[9px] font-black uppercase text-white">
                    // EVENT RECAP PREVIEW
                  </div>
                  <h2 className="text-lg font-black uppercase text-black mb-1">
                    {editingRecap.title || "Untitled Event Recap"}
                  </h2>
                  <div className="mb-3 font-mono text-xs text-zinc-600">
                    {editingRecap.date} &bull; {editingRecap.venue}
                  </div>

                  <div
                    className="prose prose-sm max-w-none text-zinc-800 font-sans leading-relaxed
                      [&>p]:text-xs [&>p]:mb-2
                      [&>ul]:list-disc [&>ul]:pl-4 [&>ul]:text-xs [&>ul]:mb-2
                      [&_img]:max-w-full [&_img]:border-2 [&_img]:border-black [&_img]:shadow-[3px_3px_0px_#000000] [&_img]:my-3
                      [&_a]:text-purple-600 [&_a]:underline"
                    dangerouslySetInnerHTML={{
                      __html: recapPreviewHtml || "<p className='text-zinc-400 italic'>Type on the left to see live feed preview...</p>",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between border-t-[3px] border-black bg-zinc-100 px-4 py-3">
              <button
                onClick={() => setIsRecapEditorOpen(false)}
                className="border-2 border-black bg-white px-4 py-2 font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#000000] hover:bg-zinc-50 cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSaveRecap(false)}
                  className="border-2 border-black bg-white px-4 py-2 font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#000000] hover:bg-zinc-100 cursor-pointer"
                >
                  Save Draft
                </button>
                <button
                  onClick={() => handleSaveRecap(true)}
                  className="flex items-center gap-1.5 border-2 border-black bg-purple-600 px-5 py-2 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_#000000] hover:bg-purple-700 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
                >
                  <HiOutlineCheck className="h-4 w-4" />
                  <span>Publish to SBG Feed</span>
                </button>
              </div>
            </div>
          </div>

          {/* Photo Gallery Uploader */}
          <ImageUploadModal
            isOpen={showGalleryUpload}
            onClose={() => setShowGalleryUpload(false)}
            onSuccess={(url) => {
              if (editingRecap) {
                setEditingRecap({
                  ...editingRecap,
                  photos: [...editingRecap.photos, url],
                });
              }
              setShowGalleryUpload(false);
              toast.success("Photo attached to event gallery!");
            }}
            aspectRatio="16:9"
            category="general"
            orgId={editingRecap?.org_id || currentOrgId}
            title="Attach Event Photo"
          />

          {/* Inline Image Uploader */}
          <ImageUploadModal
            isOpen={showInlineImageModal}
            onClose={() => setShowInlineImageModal(false)}
            onSuccess={(url) => {
              insertAtCursor(`\n\n![Event photo](${url})\n\n`);
              setShowInlineImageModal(false);
              toast.success("Photo inserted into narrative!");
            }}
            aspectRatio="16:9"
            category="general"
            orgId={editingRecap?.org_id || currentOrgId}
            title="Upload Photo to Insert in Narrative"
          />

          {/* Link Modal */}
          {showLinkModal && (
            <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
              <div className="w-full max-w-md border-[3px] border-black bg-white p-5 shadow-[8px_8px_0px_#000000]">
                <div className="mb-4 flex items-center justify-between border-b-2 border-black pb-2">
                  <span className="font-mono text-xs font-black uppercase text-black">Insert Link</span>
                  <button onClick={() => setShowLinkModal(false)} className="text-black hover:text-purple-600">
                    <HiOutlineXMark className="h-5 w-5" />
                  </button>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!linkInput.url.trim()) return;
                    const label = linkInput.text.trim() || linkInput.url.trim();
                    insertAtCursor(`[${label}](${linkInput.url.trim()})`);
                    setShowLinkModal(false);
                    setLinkInput({ text: "", url: "" });
                  }}
                  className="space-y-3"
                >
                  <div>
                    <label className="block font-mono text-[10px] font-black uppercase text-black mb-1">
                      Link Text
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. AWS Presentation Slides"
                      value={linkInput.text}
                      onChange={(e) => setLinkInput({ ...linkInput, text: e.target.value })}
                      className="w-full border-2 border-black px-2.5 py-1.5 font-sans text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] font-black uppercase text-black mb-1">
                      URL *
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://..."
                      value={linkInput.url}
                      onChange={(e) => setLinkInput({ ...linkInput, url: e.target.value })}
                      className="w-full border-2 border-black px-2.5 py-1.5 font-mono text-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowLinkModal(false)}
                      className="border-2 border-black bg-white px-3 py-1 font-mono text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="border-2 border-black bg-purple-600 px-4 py-1 font-mono text-xs font-black uppercase text-white"
                    >
                      Insert
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

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
