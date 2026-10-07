"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase, OrgSettings, logActivity } from "@awssbg/shared";
import { toast } from "sonner";
import { ImageUploadModal } from "./ImageUploadModal";
import {
  HiOutlineBuildingOffice2,
  HiOutlineCheck,
  HiOutlinePhoto,
  HiOutlineLockClosed,
  HiOutlineTrash,
} from "react-icons/hi2";

interface OrgSettingsViewProps {
  currentOrgId: string;
  actorId: string;
  actorName: string;
  isSuperAdmin: boolean;
  userRole: string;
  orgName?: string;
  onDeleteClick?: () => void;
}

export function OrgSettingsView({
  currentOrgId,
  actorId,
  actorName,
  isSuperAdmin,
  userRole,
  orgName,
  onDeleteClick,
}: OrgSettingsViewProps) {
  const isGlobal = !currentOrgId || currentOrgId === "all" || currentOrgId === "global";

  const [settings, setSettings] = useState<Partial<OrgSettings>>({
    hero_title: "",
    hero_subtitle: "",
    contact_recipient_email: "",
    about_bio: "",
    hero_image_url: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showHeroModal, setShowHeroModal] = useState(false);

  // RBAC scope: Only Superadmin and Group Leader can edit org settings. Root global is strictly Superadmin.
  const canEdit = isGlobal ? isSuperAdmin : (isSuperAdmin || userRole === "leader");

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      if (isGlobal) {
        const { data, error } = await supabase
          .from("site_settings")
          .select("*")
          .eq("id", "global")
          .maybeSingle();

        if (data && !error) {
          setSettings({
            hero_title: data.hero_title,
            hero_subtitle: data.hero_subtitle,
            contact_recipient_email: data.contact_recipient_email,
            about_bio: data.about_bio || "",
            hero_image_url: null,
          });
        }
      } else {
        const { data, error } = await supabase
          .from("org_settings")
          .select("*")
          .eq("org_id", currentOrgId)
          .maybeSingle();

        if (data && !error) {
          setSettings(data as OrgSettings);
        }
      }
    } catch (err) {
      console.error("Failed loading settings:", err);
    } finally {
      setLoading(false);
    }
  }, [currentOrgId, isGlobal]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      toast.error(
        isGlobal
          ? "Permission denied: Superadmin privileges required to modify root site settings."
          : "Permission denied: Group Leader or Superadmin privileges required."
      );
      return;
    }

    setSaving(true);
    try {
      if (isGlobal) {
        const { error } = await supabase.from("site_settings").upsert({
          id: "global",
          hero_title: settings.hero_title || "WHICH SBG ARE YOU LOOKING FOR?",
          hero_subtitle:
            settings.hero_subtitle ||
            "The AWS Student Builder Group is an official student-led cloud community supported by Amazon Web Services.",
          contact_recipient_email: settings.contact_recipient_email || "lethabomabilo33@gmail.com",
          about_bio: settings.about_bio?.trim() || null,
          updated_at: new Date().toISOString(),
        });

        if (error) throw error;

        await logActivity(supabase, {
          org_id: null,
          actor_id: actorId,
          actor_name: actorName,
          action: "site_settings.updated",
          entity_type: "org_settings",
          entity_id: "global",
          summary: `Updated root platform settings (recipient: ${settings.contact_recipient_email})`,
        });

        toast.success("Root platform global settings updated!");
      } else {
        const { error } = await supabase.from("org_settings").upsert({
          org_id: currentOrgId,
          hero_title: settings.hero_title || "AWS STUDENT BUILDER GROUP",
          hero_subtitle: settings.hero_subtitle || "BUILD, CERTIFY & CONNECT IN THE CLOUD",
          contact_recipient_email: settings.contact_recipient_email || "enquiries@awssbg.online",
          about_bio: settings.about_bio?.trim() || null,
          hero_image_url: settings.hero_image_url || null,
          updated_at: new Date().toISOString(),
        });

        if (error) throw error;

        await logActivity(supabase, {
          org_id: currentOrgId,
          actor_id: actorId,
          actor_name: actorName,
          action: "org_settings.updated",
          entity_type: "org_settings",
          entity_id: currentOrgId,
          summary: `Updated group settings (contact recipient: ${settings.contact_recipient_email})`,
        });

        toast.success("Group settings updated!");
      }
    } catch (err) {
      console.error("Failed saving settings:", err);
      toast.error("Failed to save settings: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-[3px] border-black bg-white p-5 shadow-[4px_4px_0px_#000000]">
        <div className="mb-1 inline-block border-2 border-black bg-black px-2 py-0.5 font-mono text-[9px] font-black uppercase text-white shadow-[2px_2px_0px_#7C3AED]">
          {isGlobal ? "// ROOT_PLATFORM_CONFIGURATION" : "// GROUP_CONFIGURATION"}
        </div>
        <h2 className="text-xl font-black uppercase tracking-tight text-black">
          {isGlobal ? "Root Platform Global Settings" : `Group Settings & Hero — ${orgName || "Campus SBG"}`}
        </h2>
        <p className="font-mono text-xs text-zinc-600">
          {isGlobal
            ? "Configure root platform hero headline, overarching mission story, and global contact routing."
            : "Configure branding, hero messaging, campus bio, and direct contact inquiry routing for this group."}
        </p>
      </div>

      {!canEdit && (
        <div className="flex items-center gap-3 border-[3px] border-black bg-amber-100 p-4 text-black shadow-[3px_3px_0px_#000000]">
          <HiOutlineLockClosed className="h-5 w-5 shrink-0" />
          <p className="font-mono text-xs font-bold">
            Notice: Only designated Group Leaders and Superadmins can modify group settings. You have view-only access.
          </p>
        </div>
      )}

      {loading ? (
        <div className="h-64 w-full animate-pulse border-[3px] border-black bg-zinc-200 shadow-[4px_4px_0px_#000000]" />
      ) : (
        <form
          onSubmit={handleSave}
          className="border-[3px] border-black bg-white p-6 shadow-[6px_6px_0px_#000000] space-y-5"
        >
          {/* Hero Title */}
          <div>
            <label className="mb-1 block font-mono text-xs font-black uppercase text-black">
              {isGlobal ? "Root Directory Hero Prompt / Title" : "Group Hero Title"}
            </label>
            <input
              type="text"
              disabled={!canEdit}
              placeholder={isGlobal ? "WHICH SBG ARE YOU LOOKING FOR?" : "AWS STUDENT BUILDER GROUP"}
              value={settings.hero_title || ""}
              onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
              className="w-full border-2 border-black bg-white px-3.5 py-2.5 font-mono text-sm text-black uppercase focus:outline-none focus:ring-1 focus:ring-purple-600 disabled:bg-zinc-100"
            />
          </div>

          {/* Hero Subtitle */}
          <div>
            <label className="mb-1 block font-mono text-xs font-black uppercase text-black">
              {isGlobal ? "Root Directory Subtitle" : "Group Hero Subtitle"}
            </label>
            <input
              type="text"
              disabled={!canEdit}
              placeholder={
                isGlobal
                  ? "The AWS Student Builder Group is an official student-led cloud community..."
                  : "BUILD, CERTIFY & CONNECT IN THE CLOUD"
              }
              value={settings.hero_subtitle || ""}
              onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })}
              className="w-full border-2 border-black bg-white px-3.5 py-2.5 font-mono text-sm text-black uppercase focus:outline-none focus:ring-1 focus:ring-purple-600 disabled:bg-zinc-100"
            />
          </div>

          {/* Contact Inquiry Recipient */}
          <div>
            <label className="mb-1 block font-mono text-xs font-black uppercase text-black">
              {isGlobal ? "Global Inquiries Recipient Email *" : "Group Contact Recipient Email *"}
            </label>
            <input
              type="email"
              required
              disabled={!canEdit}
              placeholder={isGlobal ? "lethabomabilo33@gmail.com" : "leader@awssbg.online"}
              value={settings.contact_recipient_email || ""}
              onChange={(e) => setSettings({ ...settings, contact_recipient_email: e.target.value })}
              className="w-full border-2 border-black bg-white px-3.5 py-2.5 font-mono text-sm text-black focus:outline-none focus:ring-1 focus:ring-purple-600 disabled:bg-zinc-100"
            />
            <p className="mt-1 font-mono text-[10px] text-zinc-500">
              {isGlobal
                ? "Submissions sent via the root /contact page will be routed to this recipient address."
                : "When students submit inquiries on this group's page, notifications will be routed directly to this address."}
            </p>
          </div>

          {/* Campus Bio / Story */}
          <div>
            <label className="mb-1 block font-mono text-xs font-black uppercase text-black">
              {isGlobal ? "Global Platform Mission Story" : "About Our AWS SBG / Campus Bio"}
            </label>
            <textarea
              rows={4}
              disabled={!canEdit}
              placeholder={
                isGlobal
                  ? "Overview of the AWS SBG community across all university campuses..."
                  : "Share your campus AWS SBG story, achievements, local focus areas, and community goals..."
              }
              value={settings.about_bio || ""}
              onChange={(e) => setSettings({ ...settings, about_bio: e.target.value })}
              className="w-full border-2 border-black bg-white px-3.5 py-2.5 font-sans text-sm text-black focus:outline-none focus:ring-1 focus:ring-purple-600 disabled:bg-zinc-100 resize-y"
            />
            <p className="mt-1 font-mono text-[10px] text-zinc-500">
              {isGlobal
                ? "Displayed on the global /about page as the platform mission story."
                : "Displayed under 'About Our AWS SBG' on your campus /{slug}/about page."}
            </p>
          </div>

          {/* Hero Badge / Logo Image (Campus Only) */}
          {!isGlobal && (
            <div className="border-t-2 border-black pt-4">
              <label className="mb-2 block font-mono text-xs font-black uppercase text-black">
                Custom Group Badge / Logo
              </label>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 overflow-hidden border-2 border-black bg-zinc-100 shrink-0">
                  {settings.hero_image_url ? (
                    <img src={settings.hero_image_url} alt="Hero badge" className="h-full w-full object-contain" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-mono text-[9px] text-zinc-400">
                      DEFAULT
                    </div>
                  )}
                </div>

                {canEdit && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowHeroModal(true)}
                      className="flex items-center gap-1.5 border-2 border-black bg-white px-3 py-1.5 font-mono text-xs font-black uppercase text-black shadow-[2px_2px_0px_#000000] hover:bg-zinc-100 cursor-pointer"
                    >
                      <HiOutlinePhoto className="h-4 w-4 text-purple-600" />
                      <span>{settings.hero_image_url ? "Change Logo" : "Upload Custom Logo"}</span>
                    </button>
                    <p className="font-mono text-[10px] text-zinc-500 mt-1">
                      Square 1:1 image. Defaults to official AWS SBG chip if empty.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {canEdit && (
            <div className="pt-4 border-t-2 border-black flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 border-2 border-black bg-purple-600 px-6 py-2.5 font-mono text-xs font-black uppercase text-white shadow-[3px_3px_0px_#000000] hover:bg-purple-700 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer disabled:opacity-50"
              >
                <HiOutlineCheck className="h-4 w-4" />
                <span>{saving ? "Saving Changes..." : isGlobal ? "Save Global Settings" : "Save Group Settings"}</span>
              </button>
            </div>
          )}

          <ImageUploadModal
            isOpen={showHeroModal}
            onClose={() => setShowHeroModal(false)}
            onSuccess={(url) => {
              setSettings((prev) => ({ ...prev, hero_image_url: url }));
              setShowHeroModal(false);
            }}
            aspectRatio="1:1"
            category="hero"
            orgId={currentOrgId}
            title="Upload Group Logo / Hero Image"
          />
        </form>
      )}

      {isSuperAdmin && !isGlobal && onDeleteClick && (
        <div className="border-[3px] border-black bg-red-50 p-5 shadow-[4px_4px_0px_#000000]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="mb-1 inline-block border-2 border-black bg-red-600 px-2 py-0.5 font-mono text-[9px] font-black uppercase text-white shadow-[2px_2px_0px_#000000]">
                // DANGER_ZONE
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight text-red-700">
                Delete {orgName || "This AWS SBG"}
              </h3>
              <p className="font-mono text-xs text-red-900 mt-0.5">
                Permanently archive this chapter, detach all assigned members, and deactivate its public hub.
              </p>
            </div>
            <button
              type="button"
              onClick={onDeleteClick}
              className="inline-flex items-center justify-center gap-2 border-2 border-black bg-red-600 px-4 py-2.5 font-mono text-xs font-black uppercase text-white shadow-[3px_3px_0px_#000000] hover:bg-black active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer shrink-0"
            >
              <HiOutlineTrash className="h-4 w-4" />
              <span>Delete AWS SBG</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
