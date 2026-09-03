"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase, Announcement } from "@awssbg/shared";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import LinkList from "@/components/LinkList";
import AnnouncementCard from "@/components/AnnouncementCard";
import Footer from "@/components/Footer";

export default function OrgHomeClient() {
  const params = useParams();
  const orgSlug = (params?.org as string) || "tut";

  const [settings, setSettings] = useState<{
    hero_title?: string;
    hero_subtitle?: string;
    hero_image_url?: string | null;
  } | null>(null);

  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: orgData } = await supabase
          .from("orgs")
          .select("id")
          .eq("slug", orgSlug)
          .single();

        if (orgData?.id) {
          // Load evergreen hero settings
          const { data: setts } = await supabase
            .from("org_settings")
            .select("hero_title, hero_subtitle, hero_image_url")
            .eq("org_id", orgData.id)
            .single();
          if (setts) setSettings(setts);

          // Query for currently active announcement (§17)
          const nowIso = new Date().toISOString();
          const { data: annData } = await supabase
            .from("announcements")
            .select("*")
            .eq("org_id", orgData.id)
            .eq("is_active", true)
            .lte("start_date", nowIso)
            .order("start_date", { ascending: false });

          if (annData && annData.length > 0) {
            const activeItem = annData.find(
              (a) => !a.end_date || new Date(a.end_date) >= new Date()
            );
            setAnnouncement(activeItem ? (activeItem as Announcement) : null);
          } else {
            setAnnouncement(null);
          }
        }
      } catch (err) {
        console.error("Failed loading home data:", err);
      }
    }
    loadData();
  }, [orgSlug]);

  return (
    <div className="brutal-grid-bg flex min-h-screen flex-col bg-[#F4F4F5]">
      <Header />
      <Hero
        orgSlug={orgSlug}
        title={settings?.hero_title}
        subtitle={settings?.hero_subtitle}
        logoUrl={settings?.hero_image_url}
      />
      {announcement && (
        <AnnouncementCard announcement={announcement} orgSlug={orgSlug} />
      )}
      <main className="flex-1 pb-10">
        <LinkList orgSlug={orgSlug} />
      </main>
      <Footer />
    </div>
  );
}
