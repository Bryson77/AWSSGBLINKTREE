"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@awssbg/shared";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import LinkList from "@/components/LinkList";
import Footer from "@/components/Footer";

export default function OrgHomeClient() {
  const params = useParams();
  const orgSlug = (params?.org as string) || "tut";

  const [settings, setSettings] = useState<{
    hero_title?: string;
    hero_subtitle?: string;
    hero_image_url?: string | null;
  } | null>(null);

  useEffect(() => {
    async function loadSettings() {
      const { data: orgData } = await supabase
        .from("orgs")
        .select("id")
        .eq("slug", orgSlug)
        .single();

      if (orgData?.id) {
        const { data: setts } = await supabase
          .from("org_settings")
          .select("hero_title, hero_subtitle, hero_image_url")
          .eq("org_id", orgData.id)
          .single();
        if (setts) setSettings(setts);
      }
    }
    loadSettings();
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
      <main className="flex-1 pb-10">
        <LinkList orgSlug={orgSlug} />
      </main>
      <Footer />
    </div>
  );
}
