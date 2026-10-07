"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase, Announcement } from "@awssbg/shared";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import LinkList from "@/components/LinkList";
import AnnouncementCard from "@/components/AnnouncementCard";
import Footer from "@/components/Footer";

export default function OrgHomeClient({ initialSlug }: { initialSlug?: string } = {}) {
  const params = useParams();
  const router = useRouter();
  const orgSlug = initialSlug || (params?.org as string) || "";
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [currentOrg, setCurrentOrg] = useState<{ id: string; name: string; slug: string } | null>(null);

  const [settings, setSettings] = useState<{
    hero_title?: string;
    hero_subtitle?: string;
    hero_image_url?: string | null;
  } | null>(null);

  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!orgSlug) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Case-insensitive lookup for active org
        const { data: orgData, error: orgErr } = await supabase
          .from("orgs")
          .select("id, name, slug")
          .ilike("slug", orgSlug)
          .eq("is_active", true)
          .is("deleted_at", null)
          .maybeSingle();

        if (orgErr || !orgData?.id) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setCurrentOrg(orgData);

        // Load evergreen hero settings
        const { data: setts } = await supabase
          .from("org_settings")
          .select("hero_title, hero_subtitle, hero_image_url")
          .eq("org_id", orgData.id)
          .maybeSingle();
        if (setts) setSettings(setts);

        // Query for currently active announcement
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
      } catch (err) {
        console.error("Failed loading SBG home data:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [orgSlug]);

  if (loading) {
    return (
      <div className="brutal-grid-bg flex min-h-screen flex-col bg-[#F4F4F5]">
        <Header />
        <main className="flex-1 flex items-center justify-center py-24">
          <div className="border-[3px] border-black bg-white px-8 py-6 shadow-[5px_5px_0px_#000000] text-center">
            <div className="inline-block border-2 border-black bg-black px-2.5 py-0.5 font-mono text-[10px] font-black uppercase text-white shadow-[2px_2px_0px_#7C3AED] mb-3">
              // INITIALIZING_SBG
            </div>
            <p className="font-mono text-xs font-bold uppercase text-black tracking-wider animate-pulse">
              Loading AWS Student Builder Group...
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (notFound || !currentOrg) {
    return (
      <div className="brutal-grid-bg flex min-h-screen flex-col bg-[#F4F4F5]">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="w-full max-w-md border-[3px] border-black bg-white p-6 sm:p-8 text-center shadow-[6px_6px_0px_#000000]">
            <div className="inline-block border-2 border-black bg-red-500 px-3 py-1 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_#000000] mb-4">
              404 // SBG_NOT_FOUND
            </div>
            <h1 className="text-2xl font-black uppercase text-black tracking-tight mb-2">
              SBG Not Found
            </h1>
            <p className="font-mono text-xs text-zinc-600 mb-6 leading-relaxed">
              We couldn&rsquo;t find an active AWS Student Builder Group matching &ldquo;{orgSlug}&rdquo;. It may have moved, been renamed, or is currently inactive.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => router.push("/")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border-[3px] border-black bg-black px-5 py-2.5 font-mono text-xs font-black uppercase text-white shadow-[3px_3px_0px_#7C3AED] hover:bg-accent-purple transition-all cursor-pointer active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                <span>&larr; View SBG Directory</span>
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="brutal-grid-bg flex min-h-screen flex-col bg-[#F4F4F5]">
      <Header />
      <Hero
        orgSlug={currentOrg.slug}
        title={settings?.hero_title}
        subtitle={settings?.hero_subtitle}
        logoUrl={settings?.hero_image_url}
      />
      {announcement && (
        <AnnouncementCard announcement={announcement} orgSlug={currentOrg.slug} />
      )}
      <main className="flex-1 pb-10">
        <LinkList orgSlug={currentOrg.slug} />
      </main>
      <Footer />
    </div>
  );
}
