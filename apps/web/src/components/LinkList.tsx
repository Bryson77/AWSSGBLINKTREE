"use client";

/**
 * LinkList — fetches active links from Supabase in real-time.
 * Geometry: 0px sharp corners, 3px solid black borders, 4px drop shadow.
 */

import { useState, useEffect } from "react";
import { supabase, LinkItem } from "@awssbg/shared";
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
    <section className="mx-auto w-full max-w-[500px] px-5 pb-8 pt-6">
      <div className="flex flex-col gap-3.5">
        {loading ? (
          // Neo-Brutalist skeleton placeholders
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[64px] w-full animate-pulse border-[3px] border-black bg-zinc-200 shadow-[4px_4px_0px_#000000]"
            />
          ))
        ) : (
          links.map((link) => (
            <LinkButton
              key={link.id}
              id={link.id}
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
