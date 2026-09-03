"use client";

/**
 * Landing Page — AWS Student Builder Group
 * Public AWS SBG site layout (Zero admin code).
 * Dynamically serves:
 * 1. Single-SBG mode: If only 1 SBG exists in Supabase, load its hero, announcement, and links directly.
 * 2. Multi-SBG mode: If 2+ SBGs exist (e.g. TUT, Wits), render the "Choose Your Campus SBG" selector cards.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase, Announcement, Organization } from "@awssbg/shared";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import LinkList from "@/components/LinkList";
import AnnouncementCard from "@/components/AnnouncementCard";
import Footer from "@/components/Footer";
import { HiOutlineArrowRight, HiOutlineBuildingLibrary } from "react-icons/hi2";

export default function Home() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [primaryOrg, setPrimaryOrg] = useState<Organization | null>(null);
  const [settings, setSettings] = useState<{
    hero_title?: string;
    hero_subtitle?: string;
    hero_image_url?: string | null;
  } | null>(null);

  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        // Query all active organizations dynamically
        const { data: orgsData } = await supabase
          .from("orgs")
          .select("*")
          .order("created_at", { ascending: true });

        if (orgsData && orgsData.length > 0) {
          setOrgs(orgsData as Organization[]);
          const current = orgsData[0] as Organization;
          setPrimaryOrg(current);

          // Load evergreen hero settings for primary org
          const { data: setts } = await supabase
            .from("org_settings")
            .select("hero_title, hero_subtitle, hero_image_url")
            .eq("org_id", current.id)
            .maybeSingle();
          if (setts) setSettings(setts);

          // Query for currently active announcement
          const nowIso = new Date().toISOString();
          const { data: annData } = await supabase
            .from("announcements")
            .select("*")
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
  }, []);

  const isMultiOrg = orgs.length > 1;

  return (
    <div className="brutal-grid-bg flex min-h-screen flex-col bg-[#F4F4F5]">
      <Header />
      
      {/* Hero section dynamically rendered with primary or general SBG identity */}
      <Hero
        orgSlug={isMultiOrg ? undefined : primaryOrg?.slug}
        title={settings?.hero_title}
        subtitle={settings?.hero_subtitle}
        logoUrl={settings?.hero_image_url}
      />

      {announcement && (
        <AnnouncementCard
          announcement={announcement}
          orgSlug={primaryOrg?.slug || "community"}
        />
      )}

      <main className="flex-1 pb-10">
        {isMultiOrg ? (
          /* Multi-SBG Mode: "Choose Your SBG" Selector */
          <section className="mx-auto w-full max-w-[600px] px-5 pt-4 pb-8">
            <div className="border-[3px] border-black bg-white p-6 shadow-[6px_6px_0px_#000000] text-center mb-6">
              <div className="mx-auto mb-2 inline-block border border-black bg-black px-2 py-0.5 font-mono text-[10px] font-black uppercase text-white shadow-[2px_2px_0px_#7C3AED]">
                CAMPUS_DIRECTORY
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight text-black">
                Choose Your Campus SBG
              </h2>
              <p className="mt-1 font-mono text-xs text-zinc-600">
                Select your university below to view local Study Jams, certification prep, and community links.
              </p>
            </div>

            <div className="space-y-3">
              {orgs.map((org) => (
                <Link
                  key={org.id}
                  href={`/${org.slug}`}
                  className="flex items-center justify-between border-[3px] border-black bg-white p-4 shadow-[4px_4px_0px_#000000] hover:bg-yellow-50 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000000] transition-all no-underline text-black group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center border-2 border-black bg-zinc-100 shadow-[2px_2px_0px_#000000] group-hover:bg-accent-purple group-hover:text-white transition-colors">
                      <HiOutlineBuildingLibrary className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <span className="block font-black text-sm uppercase text-black">
                        {org.name}
                      </span>
                      <span className="block font-mono text-[10px] uppercase text-zinc-500">
                        awssbg.online/{org.slug}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 border-2 border-black bg-black px-3 py-1.5 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_#7C3AED] group-hover:bg-accent-blue transition-colors">
                    <span>Enter</span>
                    <HiOutlineArrowRight className="h-3.5 w-3.5" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : (
          /* Single-SBG Mode: Directly load links of the single registered SBG */
          primaryOrg && <LinkList orgSlug={primaryOrg.slug} />
        )}
      </main>
      <Footer />
    </div>
  );
}
