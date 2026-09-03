"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  supabase,
  Announcement,
  AnnouncementActionLink,
  logActivity,
  announcementSchema,
  getIconForPlatform,
} from "@awssbg/shared";
import { toast } from "sonner";
import { ImageUploadModal } from "./ImageUploadModal";
import {
  HiPlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlinePhoto,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineMegaphone,
  HiOutlineEye,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineMapPin,
  HiOutlineVideoCamera,
} from "react-icons/hi2";

const PLATFORMS = [
  "meetup",
  "whatsapp",
  "website",
  "aws",
  "aws-skill-builder",
  "discord",
  "linkedin",
  "github",
  "youtube",
  "instagram",
  "x",
  "facebook",
  "telegram",
  "medium",
  "devto",
  "hashnode",
  "other",
];

interface AnnouncementManagerProps {
  currentOrgId: string;
  actorId: string;
  actorName: string;
  isSuperAdmin: boolean;
}

const toLocalDatetimeValue = (dateStr?: string | null) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function getAnnouncementStatus(item: Announcement): "ACTIVE" | "UPCOMING" | "ENDED" | "INACTIVE" {
  if (!item.is_active) return "INACTIVE";
  const now = new Date();
  const start = new Date(item.start_date);
  const end = item.end_date ? new Date(item.end_date) : null;
  if (now < start) return "UPCOMING";
  if (end && now > end) return "ENDED";
  return "ACTIVE";
}

export function AnnouncementManager({
  currentOrgId,
  actorId,
  actorName,
  isSuperAdmin: _isSuperAdmin,
}: AnnouncementManagerProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // Editor modal state
  const [editingItem, setEditingItem] = useState<Partial<Announcement> | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<"form" | "preview">("form");

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from("announcements").select("*");
      if (currentOrgId && currentOrgId !== "all") {
        query = query.eq("org_id", currentOrgId);
      }
      const { data, error } = await query.order("start_date", { ascending: false });
      if (error) throw error;
      if (data) setAnnouncements(data as Announcement[]);
    } catch (err) {
      console.error("Failed loading announcements:", err);
      toast.error("Failed to load announcements.");
    } finally {
      setLoading(false);
    }
  }, [currentOrgId]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleCreateNew = () => {
    const nowLocal = toLocalDatetimeValue(new Date().toISOString());
    setEditingItem({
      org_id: currentOrgId === "all" ? undefined : currentOrgId,
      title: "",
      subtitle: "",
      poster_image_url: null,
      banner_text: "We have an event coming up!",
      banner_bg_color: "#7C3AED",
      cta_label: "Learn More",
      cta_url: "",
      cta_platform: "website",
      location_type: "in_person",
      location_name: "",
      links: [],
      start_date: nowLocal,
      end_date: "",
      is_active: true,
    });
    setActiveModalTab("form");
    setIsEditorOpen(true);
  };

  const handleEdit = (ann: Announcement) => {
    let existingLinks: AnnouncementActionLink[] = [];
    if (Array.isArray(ann.links) && ann.links.length > 0) {
      existingLinks = ann.links;
    } else if (ann.cta_url) {
      existingLinks = [
        {
          title: ann.cta_label || "Learn More",
          url: ann.cta_url,
          platform: ann.cta_platform || "website",
        },
      ];
    }

    setEditingItem({
      ...ann,
      location_type: ann.location_type || "in_person",
      location_name: ann.location_name || "",
      cta_platform: ann.cta_platform || "website",
      links: existingLinks,
      start_date: toLocalDatetimeValue(ann.start_date),
      end_date: toLocalDatetimeValue(ann.end_date),
    });
    setActiveModalTab("form");
    setIsEditorOpen(true);
  };

  const handleAddLink = () => {
    if (!editingItem) return;
    const currentLinks = editingItem.links || [];
    setEditingItem({
      ...editingItem,
      links: [
        ...currentLinks,
        {
          title: "RSVP on Meetup",
          url: "",
          platform: "meetup",
        },
      ],
    });
  };

  const handleUpdateLink = (index: number, field: keyof AnnouncementActionLink, value: string) => {
    if (!editingItem || !editingItem.links) return;
    const updated = [...editingItem.links];
    updated[index] = { ...updated[index], [field]: value };
    setEditingItem({
      ...editingItem,
      links: updated,
    });
  };

  const handleRemoveLink = (index: number) => {
    if (!editingItem || !editingItem.links) return;
    const updated = editingItem.links.filter((_, i) => i !== index);
    setEditingItem({
      ...editingItem,
      links: updated,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.title?.trim()) {
      toast.error("Title is required.");
      return;
    }

    try {
      let targetOrgId = editingItem.org_id || currentOrgId;
      if (!targetOrgId || targetOrgId === "all") {
        const { data: defaultOrg, error: orgError } = await supabase
          .from("orgs")
          .select("id")
          .order("created_at", { ascending: true })
          .limit(1)
          .single();
        if (orgError || !defaultOrg) {
          throw new Error("A valid organization must be selected.");
        }
        targetOrgId = defaultOrg.id;
      }

      const validLinks: AnnouncementActionLink[] = (editingItem.links || [])
        .filter((l) => l.title?.trim() && l.url?.trim())
        .map((l) => ({
          title: l.title.trim(),
          url: l.url.trim(),
          platform: l.platform || "website",
        }));

      const primaryLink = validLinks[0];
      const ctaLabel = editingItem.cta_label?.trim() || primaryLink?.title || "Learn More";
      const ctaUrl = editingItem.cta_url?.trim() || primaryLink?.url || null;
      const ctaPlatform = editingItem.cta_platform?.trim() || primaryLink?.platform || "website";

      const rawPayload = {
        org_id: targetOrgId,
        title: editingItem.title?.trim() || "",
        subtitle: editingItem.subtitle?.trim() || null,
        poster_image_url: editingItem.poster_image_url || null,
        banner_text: editingItem.banner_text?.trim() || "We have an event coming up!",
        banner_bg_color: editingItem.banner_bg_color?.trim() || "#7C3AED",
        cta_label: ctaLabel,
        cta_url: ctaUrl,
        cta_platform: ctaPlatform,
        location_type: editingItem.location_type || "in_person",
        location_name: editingItem.location_type === "online" ? null : editingItem.location_name?.trim() || null,
        links: validLinks,
        start_date: editingItem.start_date ? new Date(editingItem.start_date).toISOString() : new Date().toISOString(),
        end_date: editingItem.end_date && editingItem.end_date.trim() ? new Date(editingItem.end_date).toISOString() : null,
        is_active: editingItem.is_active ?? true,
      };

      const validation = announcementSchema.safeParse(rawPayload);
      if (!validation.success) {
        toast.error(validation.error.issues[0]?.message || "Validation failed.");
        return;
      }

      const payload = {
        ...validation.data,
        updated_at: new Date().toISOString(),
      };

      if (editingItem.id) {
        // Update
        const { error } = await supabase
          .from("announcements")
          .update(payload)
          .eq("id", editingItem.id);

        if (error) throw error;

        await logActivity(supabase, {
          org_id: targetOrgId,
          actor_id: actorId,
          actor_name: actorName,
          action: "announcement.updated",
          entity_type: "announcement",
          entity_id: editingItem.id,
          summary: `Updated announcement "${editingItem.title}"`,
        });

        toast.success("Announcement updated!");
      } else {
        // Insert
        const { data, error } = await supabase
          .from("announcements")
          .insert(payload)
          .select("id")
          .single();

        if (error) throw error;

        await logActivity(supabase, {
          org_id: targetOrgId,
          actor_id: actorId,
          actor_name: actorName,
          action: "announcement.created",
          entity_type: "announcement",
          entity_id: data?.id,
          summary: `Created announcement "${editingItem.title}"`,
        });

        toast.success("Announcement published!");
      }

      setIsEditorOpen(false);
      setEditingItem(null);
      fetchAnnouncements();
    } catch (err) {
      console.error("Save announcement error:", err);
      toast.error("Failed to save announcement: " + (err as Error).message);
    }
  };

  const handleDelete = async (ann: Announcement) => {
    if (!confirm(`Permanently delete announcement "${ann.title}"?`)) return;

    try {
      const { error } = await supabase.from("announcements").delete().eq("id", ann.id);
      if (error) throw error;

      await logActivity(supabase, {
        org_id: ann.org_id,
        actor_id: actorId,
        actor_name: actorName,
        action: "announcement.deleted",
        entity_type: "announcement",
        entity_id: ann.id,
        summary: `Deleted announcement "${ann.title}"`,
      });

      toast.success("Announcement deleted.");
      fetchAnnouncements();
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete announcement: " + (err as Error).message);
    }
  };

  const handleToggleActive = async (ann: Announcement) => {
    const nextState = !ann.is_active;
    try {
      const { error } = await supabase
        .from("announcements")
        .update({ is_active: nextState, updated_at: new Date().toISOString() })
        .eq("id", ann.id);
      if (error) throw error;

      await logActivity(supabase, {
        org_id: ann.org_id,
        actor_id: actorId,
        actor_name: actorName,
        action: "announcement.updated",
        entity_type: "announcement",
        entity_id: ann.id,
        summary: `${nextState ? "Enabled" : "Disabled"} announcement kill-switch for "${ann.title}"`,
      });

      toast.success(nextState ? "Announcement activated" : "Announcement disabled");
      fetchAnnouncements();
    } catch (err) {
      toast.error("Failed to toggle status: " + (err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-[3px] border-black bg-white p-5 shadow-[4px_4px_0px_#000000]">
        <div>
          <div className="mb-1 inline-block border-2 border-black bg-black px-2 py-0.5 font-mono text-[9px] font-black uppercase text-white shadow-[2px_2px_0px_#7C3AED]">
            // EVENT_PROMOTIONS
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight text-black">
            Announcements &amp; Events
          </h2>
          <p className="font-mono text-xs text-zinc-600">
            Publish time-bound event posters and sitewide alert banners without modifying evergreen hero settings.
          </p>
        </div>

        <button
          onClick={handleCreateNew}
          className="flex items-center justify-center gap-2 border-2 border-black bg-black px-4 py-2.5 font-mono text-xs font-black uppercase text-white shadow-[3px_3px_0px_#7C3AED] hover:bg-accent-purple active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
        >
          <HiPlus className="h-4 w-4" />
          <span>New Announcement</span>
        </button>
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-24 w-full animate-pulse border-[3px] border-black bg-zinc-200 shadow-[3px_3px_0px_#000000]"
            />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="border-[3px] border-black bg-white p-10 text-center shadow-[4px_4px_0px_#000000]">
          <HiOutlineMegaphone className="h-10 w-10 text-zinc-400 mx-auto mb-2" />
          <h3 className="font-mono text-xs font-black uppercase text-black">No announcements configured</h3>
          <p className="font-mono text-[11px] text-zinc-500 mt-1">
            Click &quot;New Announcement&quot; above to schedule an event or banner.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((ann) => {
            const status = getAnnouncementStatus(ann);
            const statusColor =
              status === "ACTIVE"
                ? "bg-emerald-400 text-black"
                : status === "UPCOMING"
                ? "bg-amber-300 text-black"
                : status === "ENDED"
                ? "bg-zinc-300 text-zinc-800"
                : "bg-red-300 text-black";

            return (
              <div
                key={ann.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-[3px] border-black bg-white p-4 shadow-[3px_3px_0px_#000000] hover:shadow-[5px_5px_0px_#000000] transition-shadow"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {ann.poster_image_url ? (
                    <img
                      src={ann.poster_image_url}
                      alt={ann.title}
                      className="h-14 w-20 object-cover border-2 border-black shrink-0"
                    />
                  ) : (
                    <div className="flex h-14 w-20 items-center justify-center border-2 border-black bg-zinc-100 font-mono text-[10px] font-bold text-zinc-400 shrink-0">
                      NO_POSTER
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={`border border-black px-2 py-0.5 font-mono text-[9px] font-black uppercase shadow-[1px_1px_0px_#000000] ${statusColor}`}
                      >
                        {status}
                      </span>
                      {ann.location_type && (
                        <span className="border border-black bg-zinc-100 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-zinc-700 flex items-center gap-1 shadow-[1px_1px_0px_#000000]">
                          {ann.location_type === "online" ? (
                            <>
                              <HiOutlineVideoCamera className="h-3 w-3 text-accent-purple shrink-0" />
                              <span>ONLINE</span>
                            </>
                          ) : (
                            <>
                              <HiOutlineMapPin className="h-3 w-3 text-accent-blue shrink-0" />
                              <span className="truncate max-w-[140px]">{ann.location_name || "IN-PERSON"}</span>
                            </>
                          )}
                        </span>
                      )}
                      {ann.links && ann.links.length > 0 && (
                        <span className="border border-black bg-zinc-100 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-zinc-700 shadow-[1px_1px_0px_#000000]">
                          {ann.links.length} {ann.links.length === 1 ? "Link" : "Links"}
                        </span>
                      )}
                      <span className="font-mono text-[10px] text-zinc-500">
                        {new Date(ann.start_date).toLocaleDateString()}
                        {ann.end_date ? ` → ${new Date(ann.end_date).toLocaleDateString()}` : " (No end date)"}
                      </span>
                    </div>

                    <h4 className="text-sm font-black uppercase tracking-tight text-black truncate">
                      {ann.title}
                    </h4>
                    {ann.subtitle && (
                      <p className="font-mono text-xs text-zinc-600 truncate">{ann.subtitle}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => handleToggleActive(ann)}
                    className={`border-2 border-black px-2.5 py-1.5 font-mono text-[11px] font-black uppercase shadow-[2px_2px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer ${
                      ann.is_active ? "bg-zinc-100 hover:bg-zinc-200 text-black" : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300"
                    }`}
                    title="Toggle kill-switch"
                  >
                    {ann.is_active ? "ENABLED" : "DISABLED"}
                  </button>
                  <button
                    onClick={() => handleEdit(ann)}
                    aria-label="Edit announcement"
                    className="flex items-center gap-1 border-2 border-black bg-zinc-100 px-3 py-1.5 font-mono text-xs font-bold text-black hover:bg-black hover:text-white active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer shadow-[2px_2px_0px_#000000]"
                  >
                    <HiOutlinePencilSquare className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(ann)}
                    aria-label="Delete announcement"
                    className="flex items-center gap-1 border-2 border-black bg-zinc-100 px-2.5 py-1.5 font-mono text-xs font-bold text-red-600 hover:bg-red-600 hover:text-white active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer shadow-[2px_2px_0px_#000000]"
                    title="Delete announcement"
                  >
                    <HiOutlineTrash className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Editor Modal */}
      {isEditorOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-5 backdrop-blur-xs">
          <form
            onSubmit={handleSave}
            className="flex flex-col h-full max-h-[92vh] w-full max-w-3xl border-[3px] border-black bg-white shadow-[10px_10px_0px_#000000]"
          >
            {/* Modal Top Bar */}
            <div className="flex items-center justify-between border-b-[3px] border-black bg-black px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <HiOutlineMegaphone className="h-5 w-5 text-accent-purple" />
                <h3 className="font-mono text-xs font-black uppercase tracking-wider">
                  {editingItem.id ? "Edit Announcement" : "Configure New Announcement"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                aria-label="Close modal"
                className="text-white hover:text-accent-purple cursor-pointer"
              >
                <HiOutlineXMark className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Subnav: Form / Preview */}
            <div className="flex border-b-[3px] border-black bg-zinc-100">
              <button
                type="button"
                onClick={() => setActiveModalTab("form")}
                className={`flex-1 py-2 font-mono text-xs font-black uppercase border-r-2 border-black ${
                  activeModalTab === "form" ? "bg-white text-black" : "text-zinc-600 hover:text-black"
                }`}
              >
                Configuration Form
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab("preview")}
                className={`flex-1 py-2 font-mono text-xs font-black uppercase flex items-center justify-center gap-1.5 ${
                  activeModalTab === "preview" ? "bg-white text-black" : "text-zinc-600 hover:text-black"
                }`}
              >
                <HiOutlineEye className="h-3.5 w-3.5" />
                <span>Live Rendering Preview</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {activeModalTab === "form" ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block font-mono text-xs font-black uppercase text-black">
                        Event / Announcement Title *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Student Community Day 2026"
                        value={editingItem.title || ""}
                        onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                        className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs font-bold text-black outline-none focus:shadow-[2px_2px_0px_#7C3AED]"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block font-mono text-xs font-black uppercase text-black">
                        Subtitle / Catchphrase (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. South Africa's Premier Student Cloud Gathering"
                        value={editingItem.subtitle || ""}
                        onChange={(e) => setEditingItem({ ...editingItem, subtitle: e.target.value })}
                        className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black outline-none focus:shadow-[2px_2px_0px_#7C3AED]"
                      />
                    </div>
                  </div>

                  {/* Poster Image Selection */}
                  <div className="border-2 border-black bg-zinc-50 p-3.5">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block font-mono text-xs font-black uppercase text-black">
                        Event Poster Image (Crisp Typography / Full Graphic)
                      </label>
                      {editingItem.poster_image_url && (
                        <button
                          type="button"
                          onClick={() => setEditingItem({ ...editingItem, poster_image_url: null })}
                          className="font-mono text-[10px] font-bold text-red-600 underline cursor-pointer"
                        >
                          Remove Poster
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      {editingItem.poster_image_url ? (
                        <img
                          src={editingItem.poster_image_url}
                          alt="Poster"
                          className="h-20 w-32 object-contain border-2 border-black bg-white shrink-0"
                        />
                      ) : (
                        <div className="flex h-20 w-32 items-center justify-center border-2 border-black bg-white font-mono text-[10px] font-bold text-zinc-400 shrink-0">
                          NO_IMAGE
                        </div>
                      )}

                      <div>
                        <button
                          type="button"
                          onClick={() => setShowImageModal(true)}
                          className="flex items-center gap-1.5 border-2 border-black bg-black px-3.5 py-2 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_#7C3AED] hover:bg-accent-purple cursor-pointer"
                        >
                          <HiOutlinePhoto className="h-4 w-4" />
                          <span>{editingItem.poster_image_url ? "Replace Poster" : "Upload Event Poster"}</span>
                        </button>
                        <p className="font-mono text-[10px] text-zinc-500 mt-1">
                          Accepts PNG, JPEG, WebP, HEIC (Max 20MB). Encoded lossless to keep fine text sharp.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Teaser Banner Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-2 border-black bg-zinc-50 p-3.5">
                    <div className="md:col-span-2">
                      <label className="mb-1 block font-mono text-xs font-black uppercase text-black">
                        Sitewide Alert Banner Text
                      </label>
                      <input
                        type="text"
                        placeholder="We have an event coming up!"
                        value={editingItem.banner_text || ""}
                        onChange={(e) => setEditingItem({ ...editingItem, banner_text: e.target.value })}
                        className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs font-bold text-black outline-none focus:shadow-[2px_2px_0px_#7C3AED]"
                      />
                      <p className="font-mono text-[9px] text-zinc-500 mt-1">
                        Displayed at top of /about, /blog, /contact while active.
                      </p>
                    </div>

                    <div>
                      <label className="mb-1 block font-mono text-xs font-black uppercase text-black">
                        Banner Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={editingItem.banner_bg_color || "#7C3AED"}
                          onChange={(e) => setEditingItem({ ...editingItem, banner_bg_color: e.target.value })}
                          className="h-9 w-12 border-2 border-black bg-white cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={editingItem.banner_bg_color || "#7C3AED"}
                          onChange={(e) => setEditingItem({ ...editingItem, banner_bg_color: e.target.value })}
                          className="w-full border-2 border-black bg-white px-2 py-2 font-mono text-xs text-black outline-none focus:shadow-[2px_2px_0px_#7C3AED]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Event Location Indicator */}
                  <div className="border-2 border-black bg-zinc-50 p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block font-mono text-xs font-black uppercase text-black">
                        Location Indicator
                      </label>
                      <span className="font-mono text-[10px] text-zinc-500">
                        Displays badge on announcement card
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="mb-1 block font-mono text-[10px] font-bold uppercase text-zinc-600">
                          Attendance Mode *
                        </label>
                        <select
                          value={editingItem.location_type || "in_person"}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              location_type: e.target.value as "in_person" | "online" | "hybrid",
                            })
                          }
                          className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs font-bold text-black outline-none focus:shadow-[2px_2px_0px_#7C3AED] cursor-pointer"
                        >
                          <option value="in_person">IN-PERSON (Physical Venue / Campus)</option>
                          <option value="online">ONLINE (Virtual / Livestream)</option>
                          <option value="hybrid">HYBRID (Campus &amp; Virtual)</option>
                        </select>
                      </div>

                      {editingItem.location_type !== "online" ? (
                        <div className="md:col-span-2">
                          <label className="mb-1 block font-mono text-[10px] font-bold uppercase text-zinc-600">
                            Campus / Venue Location *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. TUT Soshanguve South Campus, Lab 3"
                            value={editingItem.location_name || ""}
                            onChange={(e) => setEditingItem({ ...editingItem, location_name: e.target.value })}
                            className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black outline-none focus:shadow-[2px_2px_0px_#7C3AED]"
                          />
                        </div>
                      ) : (
                        <div className="md:col-span-2 flex items-center border border-dashed border-black/30 bg-white p-2 text-zinc-600 font-mono text-xs">
                          <HiOutlineVideoCamera className="h-4 w-4 mr-2 text-accent-purple shrink-0" />
                          <span>Event will be badged as &quot;ONLINE EVENT&quot; with virtual indicator.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Links & Platform Buttons */}
                  <div className="border-2 border-black bg-zinc-50 p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block font-mono text-xs font-black uppercase text-black">
                          Action Links &amp; Platform Buttons
                        </label>
                        <p className="font-mono text-[10px] text-zinc-500">
                          Add buttons with brand logos (Meetup, WhatsApp, AWS, Discord, LinkedIn, etc.)
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddLink}
                        className="flex items-center gap-1 border-2 border-black bg-black px-3 py-1.5 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_#7C3AED] hover:bg-accent-purple cursor-pointer active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                      >
                        <HiPlus className="h-3.5 w-3.5" />
                        <span>Add Link</span>
                      </button>
                    </div>

                    {(!editingItem.links || editingItem.links.length === 0) ? (
                      <div className="border-2 border-dashed border-black/30 bg-white p-4 text-center">
                        <p className="font-mono text-xs text-zinc-600 font-medium">
                          No custom platform links added. Click &quot;Add Link&quot; above to add Meetup, WhatsApp, or other registration buttons.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {editingItem.links.map((link, idx) => {
                          const Icon = getIconForPlatform(link.platform || "website");
                          return (
                            <div
                              key={idx}
                              className="flex flex-col sm:flex-row sm:items-center gap-2.5 border-2 border-black bg-white p-3 shadow-[2px_2px_0px_#000000]"
                            >
                              <div className="flex items-center gap-2 shrink-0">
                                <div className="flex h-9 w-9 items-center justify-center border-2 border-black bg-zinc-100 shadow-[1px_1px_0px_#000000]">
                                  <Icon className="h-4 w-4 text-black" />
                                </div>
                                <select
                                  value={link.platform || "website"}
                                  onChange={(e) => handleUpdateLink(idx, "platform", e.target.value)}
                                  className="h-9 border-2 border-black bg-white px-2 font-mono text-xs font-bold text-black outline-none focus:shadow-[2px_2px_0px_#7C3AED] cursor-pointer"
                                >
                                  {PLATFORMS.map((p) => (
                                    <option key={p} value={p}>
                                      {p.toUpperCase()}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="flex-1 min-w-0">
                                <input
                                  type="text"
                                  placeholder="Button Label (e.g. RSVP on Meetup)"
                                  value={link.title || ""}
                                  onChange={(e) => handleUpdateLink(idx, "title", e.target.value)}
                                  className="w-full h-9 border-2 border-black bg-white px-3 font-mono text-xs font-bold text-black outline-none focus:shadow-[2px_2px_0px_#7C3AED]"
                                />
                              </div>

                              <div className="flex-1 min-w-0">
                                <input
                                  type="url"
                                  placeholder="https://..."
                                  value={link.url || ""}
                                  onChange={(e) => handleUpdateLink(idx, "url", e.target.value)}
                                  className="w-full h-9 border-2 border-black bg-white px-3 font-mono text-xs text-black outline-none focus:shadow-[2px_2px_0px_#7C3AED]"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveLink(idx)}
                                className="flex h-9 w-9 items-center justify-center border-2 border-black bg-zinc-100 text-red-600 hover:bg-red-500 hover:text-white active:translate-x-[1px] active:translate-y-[1px] cursor-pointer shrink-0"
                                title="Remove link"
                              >
                                <HiOutlineTrash className="h-4 w-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Sitewide Alert Banner CTA Configuration */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-2 border-black/20 bg-zinc-50 p-3.5">
                    <div>
                      <label className="mb-1 block font-mono text-xs font-black uppercase text-black">
                        Sitewide Banner Button Label
                      </label>
                      <input
                        type="text"
                        placeholder="Learn More"
                        value={editingItem.cta_label || ""}
                        onChange={(e) => setEditingItem({ ...editingItem, cta_label: e.target.value })}
                        className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs font-bold text-black outline-none focus:shadow-[2px_2px_0px_#7C3AED]"
                      />
                      <p className="font-mono text-[9px] text-zinc-500 mt-1">
                        Defaults to first action link title if set.
                      </p>
                    </div>

                    <div>
                      <label className="mb-1 block font-mono text-xs font-black uppercase text-black">
                        Sitewide Banner Destination URL (Optional)
                      </label>
                      <input
                        type="url"
                        placeholder="https://... or leave blank for homepage scroll"
                        value={editingItem.cta_url || ""}
                        onChange={(e) => setEditingItem({ ...editingItem, cta_url: e.target.value })}
                        className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black outline-none focus:shadow-[2px_2px_0px_#7C3AED]"
                      />
                      <p className="font-mono text-[9px] text-zinc-500 mt-1">
                        Defaults to first action link URL if set.
                      </p>
                    </div>
                  </div>

                  {/* Dates & Active State */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t-2 border-black/10 pt-3">
                    <div>
                      <label className="mb-1 block font-mono text-[11px] font-black uppercase text-black">
                        Start Date / Time *
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={editingItem.start_date || ""}
                        onChange={(e) => setEditingItem({ ...editingItem, start_date: e.target.value })}
                        className="w-full border-2 border-black bg-white px-2.5 py-1.5 font-mono text-xs text-black outline-none focus:shadow-[2px_2px_0px_#7C3AED]"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block font-mono text-[11px] font-black uppercase text-black">
                        End Date / Time (Auto-Expire)
                      </label>
                      <input
                        type="datetime-local"
                        value={editingItem.end_date || ""}
                        onChange={(e) => setEditingItem({ ...editingItem, end_date: e.target.value })}
                        className="w-full border-2 border-black bg-white px-2.5 py-1.5 font-mono text-xs text-black outline-none focus:shadow-[2px_2px_0px_#7C3AED]"
                      />
                    </div>

                    <div className="flex flex-col justify-end">
                      <label className="flex items-center gap-2.5 border-2 border-black bg-zinc-100 p-2 cursor-pointer h-[38px]">
                        <input
                          type="checkbox"
                          checked={editingItem.is_active ?? true}
                          onChange={(e) => setEditingItem({ ...editingItem, is_active: e.target.checked })}
                          className="h-4 w-4 rounded-none accent-black"
                        />
                        <span className="font-mono text-xs font-bold uppercase text-black">
                          Active Kill-Switch
                        </span>
                      </label>
                    </div>
                  </div>
                </>
              ) : (
                /* Preview Tab */
                <div className="space-y-6">
                  {/* Sitewide Teaser Banner Preview */}
                  <div>
                    <span className="block font-mono text-[10px] font-black uppercase text-zinc-500 mb-1">
                      // PREVIEW: Sitewide Teaser Banner (Non-homepage pages)
                    </span>
                    <div
                      style={{ backgroundColor: editingItem.banner_bg_color || "#7C3AED" }}
                      className="border-[3px] border-black p-3 text-white shadow-[4px_4px_0px_#000000] flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="border border-black bg-black px-1.5 py-0.5 font-mono text-[9px] font-black text-white shrink-0">
                          ALERT
                        </span>
                        <span className="font-mono text-xs font-black uppercase tracking-wide truncate">
                          {editingItem.banner_text || "We have an event coming up!"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="border-2 border-black bg-black px-3 py-1 font-mono text-[10px] font-black uppercase text-white shadow-[2px_2px_0px_#FFFFFF]">
                          {editingItem.cta_label || "Learn More"} →
                        </span>
                        <span className="h-6 w-6 flex items-center justify-center border border-black bg-black/20 text-xs cursor-pointer">
                          &times;
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Featured Announcement Card Preview */}
                  <div>
                    <span className="block font-mono text-[10px] font-black uppercase text-zinc-500 mb-1">
                      // PREVIEW: Homepage Featured Card (Rendered below Hero section)
                    </span>
                    <div className="border-[3px] border-black bg-white p-5 shadow-[6px_6px_0px_#000000]">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="inline-block border-2 border-black bg-black px-2.5 py-0.5 font-mono text-[10px] font-black uppercase tracking-widest text-white shadow-[2px_2px_0px_#7C3AED]">
                          FEATURED EVENT
                        </div>
                        <span className="font-mono text-[10px] font-bold text-zinc-500">
                          {editingItem.start_date ? new Date(editingItem.start_date).toLocaleDateString() : "Upcoming"}
                        </span>
                      </div>

                      {/* Location Badge Preview */}
                      {editingItem.location_type && (
                        <div className="mb-3 inline-flex items-center gap-1.5 border-2 border-black bg-zinc-100 px-2.5 py-1 font-mono text-[11px] font-black uppercase text-black shadow-[2px_2px_0px_#000000]">
                          {editingItem.location_type === "online" ? (
                            <>
                              <HiOutlineVideoCamera className="h-3.5 w-3.5 text-accent-purple shrink-0" />
                              <span>ONLINE EVENT</span>
                            </>
                          ) : (
                            <>
                              <HiOutlineMapPin className="h-3.5 w-3.5 text-accent-blue shrink-0" />
                              <span>
                                {editingItem.location_type === "hybrid" ? "HYBRID // " : "IN-PERSON // "}
                                {editingItem.location_name || "CAMPUS VENUE"}
                              </span>
                            </>
                          )}
                        </div>
                      )}

                      {editingItem.poster_image_url && (
                        <div className="mb-4 overflow-hidden border-[3px] border-black bg-zinc-950">
                          <img
                            src={editingItem.poster_image_url}
                            alt="Event Poster Preview"
                            className="max-h-[380px] w-full object-contain mx-auto"
                          />
                        </div>
                      )}

                      <h3 className="text-xl font-black uppercase tracking-tight text-black">
                        {editingItem.title || "Event Title"}
                      </h3>
                      {editingItem.subtitle && (
                        <p className="mt-1 font-mono text-xs text-zinc-600">
                          {editingItem.subtitle}
                        </p>
                      )}

                      {/* Preview Action Links */}
                      <div className="mt-4 pt-3 border-t-2 border-black/10 flex flex-wrap items-center justify-end gap-2.5">
                        {editingItem.links && editingItem.links.length > 0 ? (
                          editingItem.links.map((link, idx) => {
                            const Icon = getIconForPlatform(link.platform || "website");
                            return (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-2 border-2 border-black bg-black px-4 py-2 font-mono text-xs font-black uppercase text-white shadow-[3px_3px_0px_#7C3AED]"
                              >
                                <Icon className="h-3.5 w-3.5 text-white" />
                                <span>{link.title || "Action Link"}</span>
                                <HiOutlineArrowTopRightOnSquare className="h-3.5 w-3.5 opacity-80" />
                              </span>
                            );
                          })
                        ) : (
                          <span className="inline-flex items-center gap-1.5 border-2 border-black bg-black px-4 py-2 font-mono text-xs font-black uppercase text-white shadow-[3px_3px_0px_#7C3AED]">
                            <span>{editingItem.cta_label || "Learn More"}</span>
                            <HiOutlineArrowTopRightOnSquare className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between border-t-[3px] border-black bg-zinc-100 px-5 py-3">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="border-2 border-black bg-white px-4 py-2 font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#000000] hover:bg-zinc-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="flex items-center gap-1.5 border-2 border-black bg-black px-5 py-2 font-mono text-xs font-black uppercase text-white shadow-[3px_3px_0px_#7C3AED] hover:bg-accent-purple active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer"
              >
                <HiOutlineCheck className="h-4 w-4" />
                <span>Save Announcement</span>
              </button>
            </div>
          </form>

          {/* Poster Upload Modal */}
          <ImageUploadModal
            isOpen={showImageModal}
            onClose={() => setShowImageModal(false)}
            onSuccess={(url) => {
              setEditingItem((prev) => (prev ? { ...prev, poster_image_url: url } : null));
              setShowImageModal(false);
            }}
            aspectRatio="poster"
            category="announcement"
            orgId={editingItem?.org_id && editingItem.org_id !== "all" ? editingItem.org_id : "default"}
            title="Upload Event Announcement Poster"
          />
        </div>
      )}
    </div>
  );
}
