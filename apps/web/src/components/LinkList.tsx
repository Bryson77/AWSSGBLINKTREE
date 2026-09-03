"use client";

/**
 * LinkList — fetches active links from Supabase in real-time.
 * Geometry: 0px sharp corners, 3px solid black borders, 4px drop shadow.
 */

import { useState, useEffect } from "react";
import { supabase, LinkItem } from "@awssbg/shared";
import LinkButton from "./LinkButton";

interface LinkListProps {
  orgSlug?: string;
}

export default function LinkList({ orgSlug }: LinkListProps) {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLinks() {
      try {
        let orgId: string | null = null;
        if (orgSlug) {
          const { data: orgData } = await supabase
            .from("orgs")
            .select("id")
            .eq("slug", orgSlug)
            .maybeSingle();
          orgId = orgData?.id || null;
        } else {
          const { data: defaultOrg } = await supabase
            .from("orgs")
            .select("id")
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle();
          orgId = defaultOrg?.id || null;
        }

        let query = supabase
          .from("links")
          .select("*")
          .eq("is_active", true);

        if (orgId) {
          query = query.eq("org_id", orgId);
        }

        const { data } = await query.order("sort_order", { ascending: true });

        if (data) {
          setLinks(data as LinkItem[]);
        }
      } catch (err) {
        console.error("Failed loading links:", err);
      } finally {
        setLoading(false);
      }
    }

    loadLinks();
  }, [orgSlug]);

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
