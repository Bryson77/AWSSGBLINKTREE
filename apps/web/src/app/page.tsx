"use client";

/**
 * Public Root Page — AWS Student Builder Group Directory
 * 
 * URL Architecture:
 * - https://aws-sbg.online/ -> Dedicated Public SBG Directory / Discovery Page
 * - https://aws-sbg.online/{institution-slug} -> Dedicated Individual SBG Page
 * 
 * Database-driven: dynamically queries all active SBGs from Supabase.
 * Aesthetic: Hardcore Neo-Brutalism (0px corners, 3px solid borders, hard shadows).
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase, Organization } from "@awssbg/shared";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OrgHomeClient from "./[org]/OrgHomeClient";
import {
  HiOutlineArrowRight,
  HiOutlineBuildingLibrary,
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
  HiOutlineGlobeAlt,
} from "react-icons/hi2";

const KNOWN_STATIC_ROUTES = new Set([
  "",
  "about",
  "contact",
  "blog",
  "events",
  "ticket",
  "privacy",
  "terms",
  "admin",
]);

export default function Home() {
  const [targetSlug, setTargetSlug] = useState<string | null>(null);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Check if client arrived via Cloudflare Pages SPA fallback at /{institution-slug}
  useEffect(() => {
    if (typeof window !== "undefined") {
      const pathSegment = window.location.pathname.replace(/^\/|\/$/g, "").split("/")[0];
      if (pathSegment && !KNOWN_STATIC_ROUTES.has(pathSegment.toLowerCase())) {
        setTargetSlug(pathSegment);
      }
    }
  }, []);

  // Fetch all publicly visible, active SBGs
  useEffect(() => {
    async function fetchOrgs() {
      try {
        setLoading(true);
        const { data: orgsData, error } = await supabase
          .from("orgs")
          .select("*")
          .eq("is_active", true)
          .is("deleted_at", null)
          .order("name", { ascending: true });

        if (error) {
          console.error("Error fetching SBGs:", error);
        } else if (orgsData) {
          setOrgs(orgsData as Organization[]);
        }
      } catch (err) {
        console.error("Failed loading SBG directory:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrgs();
  }, []);

  // If a slug was passed directly in the URL path, render the individual SBG client
  if (targetSlug) {
    return <OrgHomeClient initialSlug={targetSlug} />;
  }

  // Filter organizations by search query
  const filteredOrgs = orgs.filter((org) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      org.name.toLowerCase().includes(query) ||
      org.slug.toLowerCase().includes(query)
    );
  });

  return (
    <div className="brutal-grid-bg flex min-h-screen flex-col bg-[#F4F4F5]">
      <Header />

      <main className="flex-1 pb-16">
        {/* Hero Header Section */}
        <section className="relative w-full overflow-hidden pt-8 sm:pt-14 pb-8 border-b-[3px] border-black bg-white">
          <div className="mx-auto max-w-[760px] px-4 sm:px-6 text-center">
            {/* Top Eyebrow Badge */}
            <div className="mb-4 inline-flex items-center gap-2 border-2 border-black bg-black px-3 py-1 text-white shadow-[3px_3px_0px_#7C3AED]">
              <HiOutlineGlobeAlt className="h-4 w-4 text-purple-400" />
              <span className="font-mono text-[11px] font-black uppercase tracking-widest text-white">
                // AWS_SBG // PUBLIC_DIRECTORY
              </span>
            </div>

            {/* Main Prompt Headline (Mandatory Requirement §3) */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-black leading-[1.08]">
              Which SBG are you looking for?
            </h1>

            {/* Subtitle */}
            <p className="mx-auto mt-4 max-w-[560px] text-[13px] sm:text-[15px] font-medium leading-relaxed text-zinc-700">
              The <strong className="font-bold text-black">AWS Student Builder Group (AWS SBG)</strong> is an official student-led cloud community supported by Amazon Web Services. Select your campus below to view local Study Jams, certification prep cohorts, and community links.
            </p>

            {/* Real-Time Search Bar */}
            <div className="mx-auto mt-8 max-w-[500px]">
              <div className="relative flex items-center border-[3px] border-black bg-white shadow-[5px_5px_0px_#000000] focus-within:shadow-[6px_6px_0px_#7C3AED] transition-all">
                <div className="pl-3.5 pr-2 text-black">
                  <HiOutlineMagnifyingGlass className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search campus or university name..."
                  className="w-full bg-transparent py-3 pr-10 font-mono text-xs sm:text-sm font-bold text-black placeholder:text-zinc-500 focus:outline-none"
                  aria-label="Search AWS SBG chapters"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 p-1 text-zinc-500 hover:text-black cursor-pointer"
                    aria-label="Clear search"
                  >
                    <HiOutlineXMark className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Active SBG Count Pill */}
            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="border border-black bg-zinc-100 px-2.5 py-0.5 font-mono text-[10px] font-black uppercase text-zinc-600">
                {filteredOrgs.length} {filteredOrgs.length === 1 ? "CAMPUS SBG" : "CAMPUS SBGS"} AVAILABLE
              </span>
            </div>
          </div>
        </section>

        {/* SBG Directory Cards Section */}
        <section className="mx-auto w-full max-w-[800px] px-4 sm:px-6 pt-10">
          {loading ? (
            /* Loading State */
            <div className="border-[3px] border-black bg-white p-12 text-center shadow-[6px_6px_0px_#000000]">
              <div className="inline-block border-2 border-black bg-black px-2.5 py-0.5 font-mono text-[10px] font-black uppercase text-white shadow-[2px_2px_0px_#7C3AED] mb-3">
                // SYNCING_DIRECTORY
              </div>
              <p className="font-mono text-xs font-bold uppercase text-black tracking-wider animate-pulse">
                Loading campus AWS Student Builder Groups...
              </p>
            </div>
          ) : filteredOrgs.length > 0 ? (
            /* Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              {filteredOrgs.map((org) => (
                <div
                  key={org.id}
                  className="border-[3px] border-black bg-white p-5 sm:p-6 shadow-[5px_5px_0px_#000000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0px_#000000] transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Card Header Badge */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="inline-flex items-center gap-1.5 border-2 border-black bg-black px-2.5 py-0.5 font-mono text-[10px] font-black uppercase text-white shadow-[2px_2px_0px_#7C3AED]">
                        <HiOutlineBuildingLibrary className="h-3.5 w-3.5 text-purple-300" />
                        <span>AWS SBG</span>
                      </div>
                      <span className="border border-black bg-zinc-100 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-zinc-600">
                        @{org.slug.toUpperCase()}
                      </span>
                    </div>

                    {/* Institution Name */}
                    <h2 className="text-xl font-black uppercase text-black tracking-tight leading-snug group-hover:text-accent-purple transition-colors">
                      {org.name}
                    </h2>

                    {/* Route URL */}
                    <p className="mt-1 font-mono text-[11px] font-bold text-zinc-500">
                      aws-sbg.online/{org.slug}
                    </p>
                  </div>

                  {/* Card Footer with CTA */}
                  <div className="mt-6 pt-4 border-t-2 border-black flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-emerald-700">
                      <span className="h-2 w-2 rounded-none bg-emerald-500 border border-black inline-block"></span>
                      <span>ACTIVE</span>
                    </div>

                    <Link
                      href={`/${org.slug}`}
                      className="inline-flex items-center gap-1.5 border-2 border-black bg-black px-4 py-2 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_#7C3AED] group-hover:bg-accent-blue transition-colors no-underline active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                    >
                      <span>View SBG</span>
                      <HiOutlineArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="border-[3px] border-dashed border-black bg-white p-10 text-center shadow-[4px_4px_0px_#000000]">
              <div className="inline-block border-2 border-black bg-zinc-100 px-2.5 py-0.5 font-mono text-[10px] font-black uppercase text-black mb-3">
                // NO_MATCHES_FOUND
              </div>
              <h3 className="text-lg font-black uppercase text-black">
                No SBG Found
              </h3>
              <p className="font-mono text-xs text-zinc-600 mt-1 max-w-sm mx-auto">
                No active AWS Student Builder Group matched &ldquo;{searchQuery}&rdquo;. Try another campus name or reset the search filter.
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-4 border-2 border-black bg-black px-4 py-1.5 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_#7C3AED] hover:bg-zinc-800 cursor-pointer"
                >
                  Clear Search
                </button>
              )}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
