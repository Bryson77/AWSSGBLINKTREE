"use client";

/**
 * LinkList — fetches active links from Supabase in real-time.
 * Ensures the landing page reflects admin CMS updates immediately without redeployment.
 * PRD §4: Centered column, max-width 500px, 14px gap.
 */

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { LinkItem } from "@/data/links";
import LinkButton from "./LinkButton";

export default function LinkList() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLinks() {
      const { data } = await supabase
        .from("links")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (data) {
        setLinks(data as LinkItem[]);
      }
      setLoading(false);
    }

    loadLinks();
  }, []);

  if (!loading && links.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-[500px] px-5 pb-10 pt-7">
      <div className="flex flex-col gap-3.5">
        {loading ? (
          // Lightweight skeleton placeholders while fetching initial links
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[62px] w-full animate-pulse rounded-[14px] border border-black/[0.06] bg-zinc-50"
            />
          ))
        ) : (
          links.map((link) => (
            <LinkButton
              key={link.id}
              title={link.title}
              url={link.url}
              platform={link.platform}
              description={link.description ?? undefined}
            />
          ))
        )}
      </div>
    </section>
  );
}
