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
} from "react-icons/hi2";

interface OrgSettingsViewProps {
  currentOrgId: string;
  actorId: string;
  actorName: string;
  isSuperAdmin: boolean;
  userRole: string;
}

export function OrgSettingsView({
  currentOrgId,
  actorId,
  actorName,
  isSuperAdmin,
  userRole,
}: OrgSettingsViewProps) {
  const [settings, setSettings] = useState<Partial<OrgSettings>>({
    hero_title: "",
    hero_subtitle: "",
    contact_recipient_email: "",
    hero_image_url: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showHeroModal, setShowHeroModal] = useState(false);

  // RBAC scope: Only Superadmin and Group Leader can edit org settings
  const canEdit = isSuperAdmin || userRole === "leader";

  const fetchSettings = useCallback(async () => {
    if (!currentOrgId || currentOrgId === "all") return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("org_settings")
        .select("*")
        .eq("org_id", currentOrgId)
        .single();

      if (data && !error) {
        setSettings(data as OrgSettings);
      }
    } catch (err) {
      console.error("Failed loading settings:", err);
    } finally {
      setLoading(false);
    }
  }, [currentOrgId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      toast.error("Permission denied: Group Leader or Superadmin privileges required.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("org_settings").upsert({
        org_id: currentOrgId,
        hero_title: settings.hero_title || "AWS STUDENT BUILDER GROUP",
        hero_subtitle: settings.hero_subtitle || "BUILD, CERTIFY & CONNECT IN THE CLOUD",
        contact_recipient_email: settings.contact_recipient_email || "enquiries@awssbg.online",
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
          // GROUP_CONFIGURATION
        </div>
        <h2 className="text-xl font-black uppercase tracking-tight text-black">
          Group Settings &amp; Hero
        </h2>
        <p className="font-mono text-xs text-zinc-600">
          Configure branding, hero messaging, and direct contact inquiry routing for this group.
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
              Group Hero Title
            </label>
            <input
              type="text"
              disabled={!canEdit}
              placeholder="AWS STUDENT BUILDER GROUP"
              value={settings.hero_title || ""}
              onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
              className="w-full border-2 border-black bg-white px-3.5 py-2.5 font-mono text-sm text-black uppercase focus:outline-none focus:ring-1 focus:ring-purple-600 disabled:bg-zinc-100"
            />
          </div>

          {/* Hero Subtitle */}
          <div>
            <label className="mb-1 block font-mono text-xs font-black uppercase text-black">
              Group Hero Subtitle
            </label>
            <input
              type="text"
              disabled={!canEdit}
              placeholder="BUILD, CERTIFY & CONNECT IN THE CLOUD"
              value={settings.hero_subtitle || ""}
              onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })}
              className="w-full border-2 border-black bg-white px-3.5 py-2.5 font-mono text-sm text-black uppercase focus:outline-none focus:ring-1 focus:ring-purple-600 disabled:bg-zinc-100"
            />
          </div>

          {/* Contact Inquiry Recipient */}
          <div>
            <label className="mb-1 block font-mono text-xs font-black uppercase text-black">
              Group Contact Recipient Email *
            </label>
            <input
              type="email"
              required
              disabled={!canEdit}
              placeholder="leader@awssbg.online"
              value={settings.contact_recipient_email || ""}
              onChange={(e) => setSettings({ ...settings, contact_recipient_email: e.target.value })}
              className="w-full border-2 border-black bg-white px-3.5 py-2.5 font-mono text-sm text-black focus:outline-none focus:ring-1 focus:ring-purple-600 disabled:bg-zinc-100"
            />
            <p className="mt-1 font-mono text-[10px] text-zinc-500">
              When students submit inquiries on this group's page, notifications will be routed directly to this address.
            </p>
          </div>

          {/* Hero Badge / Logo Image */}
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

          {canEdit && (
            <div className="pt-4 border-t-2 border-black flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 border-2 border-black bg-purple-600 px-6 py-2.5 font-mono text-xs font-black uppercase text-white shadow-[3px_3px_0px_#000000] hover:bg-purple-700 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer disabled:opacity-50"
              >
                <HiOutlineCheck className="h-4 w-4" />
                <span>{saving ? "Saving Changes..." : "Save Group Settings"}</span>
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
    </div>
  );
}
