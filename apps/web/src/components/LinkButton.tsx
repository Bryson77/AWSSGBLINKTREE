"use client";

/**
 * LinkButton — Hardcore Neo-Brutalist Link Card.
 * Features:
 *  - Slide-fill sweep to Electric Purple on hover
 *  - High contrast text/icon inversion to pure white
 *  - Directional arrow translation & rotation on hover
 *  - Tactile scale(0.98) & translate(2px, 2px) on active click
 *  - Asynchronous link click telemetry recording
 */

import { supabase, getIconForPlatform } from "@awssbg/shared";
import { HiArrowUpRight } from "react-icons/hi2";

interface LinkButtonProps {
  id: string;
  title: string;
  url: string;
  platform: string;
  description?: string;
}

export default function LinkButton({
  id,
  title,
  url,
  platform,
  description,
}: LinkButtonProps) {
  const Icon = getIconForPlatform(platform);

  const handleClick = () => {
    try {
      // Fire-and-forget telemetry increment
      supabase.rpc("increment_link_clicks", { target_link_id: id }).then(({ error }) => {
        if (error) {
          // Fallback direct increment if RPC is not deployed yet
          supabase
            .from("links")
            .select("click_count")
            .eq("id", id)
            .single()
            .then(({ data }) => {
              const current = data?.click_count ?? 0;
              supabase.from("links").update({ click_count: current + 1 }).eq("id", id);
            });
        }
      });
    } catch {
      // Non-blocking telemetry
    }
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="group link-button flex w-full items-center justify-between gap-3 px-3.5 sm:px-4 py-3 sm:py-3.5 text-left no-underline cursor-pointer"
    >
      <div className="flex min-w-0 items-center gap-3 sm:gap-3.5">
        {/* Platform icon stamp */}
        <div
          className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center border-2 border-black bg-zinc-100 text-black transition-all duration-150 group-hover:border-white group-hover:bg-white group-hover:text-black"
          aria-hidden="true"
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>

        {/* Title and monospace description */}
        <div className="min-w-0 flex-1">
          <span className="block truncate text-[14px] sm:text-[15px] font-black uppercase leading-snug tracking-tight text-black transition-colors group-hover:text-white">
            {title}
          </span>
          {description && (
            <span className="mt-0.5 block truncate font-mono text-[11px] sm:text-[12px] font-medium leading-snug text-zinc-600 transition-colors group-hover:text-purple-100">
              {description}
            </span>
          )}
        </div>
      </div>

      {/* Trailing arrow with translation on hover */}
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center border-2 border-black bg-white text-black transition-all duration-150 group-hover:border-white group-hover:bg-transparent group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        aria-hidden="true"
      >
        <HiArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </div>
    </a>
  );
}
