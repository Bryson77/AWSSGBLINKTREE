"use client";

import React, { useState, useEffect } from "react";
import { Announcement } from "@awssbg/shared";
import { HiOutlineArrowTopRightOnSquare, HiOutlineXMark, HiOutlineCalendarDays } from "react-icons/hi2";

interface SitewideBannerProps {
  announcement: Announcement | null;
  orgSlug: string;
}

export default function SitewideBanner({ announcement, orgSlug }: SitewideBannerProps) {
  const [dismissed, setDismissed] = useState<boolean>(true); // start true to avoid flash before hydration

  useEffect(() => {
    if (!announcement) {
      setDismissed(true);
      return;
    }

    // Check if dismissed in localStorage for this specific announcement ID
    try {
      const dismissedKey = `sbg_banner_dismissed_${announcement.id}`;
      const isDismissed = localStorage.getItem(dismissedKey) === "true";
      setDismissed(isDismissed);
    } catch {
      setDismissed(false);
    }
  }, [announcement]);

  if (!announcement || !announcement.is_active || dismissed) return null;

  const now = new Date();
  const start = new Date(announcement.start_date);
  const end = announcement.end_date ? new Date(announcement.end_date) : null;

  // Render-time state calculation (§17)
  if (now < start || (end && now > end)) return null;

  const handleDismiss = () => {
    try {
      localStorage.setItem(`sbg_banner_dismissed_${announcement.id}`, "true");
    } catch {
      // Ignore storage write failure in restricted browsing contexts
    }
    setDismissed(true);
  };

  const destinationUrl = announcement.cta_url || `/${orgSlug}`;
  const isExternal = destinationUrl.startsWith("http://") || destinationUrl.startsWith("https://");

  return (
    <aside
      style={{ backgroundColor: announcement.banner_bg_color || "#7C3AED" }}
      className="border-b-[3px] border-black text-white relative z-40 transition-all"
      aria-label="Community Announcement"
    >
      <div className="mx-auto flex max-w-[960px] items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        {/* Left: Icon & Text */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="hidden sm:flex h-6 w-6 shrink-0 items-center justify-center border-2 border-black bg-black text-white shadow-[1px_1px_0px_#FFFFFF]">
            <HiOutlineCalendarDays className="h-3.5 w-3.5" />
          </div>
          <span className="font-mono text-xs sm:text-sm font-black uppercase tracking-tight truncate text-white drop-shadow-[1px_1px_0px_#000000]">
            {announcement.banner_text || "We have an event coming up!"}
          </span>
        </div>

        {/* Right: CTA & Dismiss Button */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={destinationUrl}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className="inline-flex items-center gap-1.5 border-2 border-black bg-white px-3 py-1 font-mono text-[11px] font-black uppercase text-black shadow-[2px_2px_0px_#000000] hover:bg-black hover:text-white active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all no-underline"
          >
            <span>{announcement.cta_label || "Learn More"}</span>
            <HiOutlineArrowTopRightOnSquare className="h-3 w-3" />
          </a>

          <button
            type="button"
            onClick={handleDismiss}
            className="flex h-7 w-7 items-center justify-center border-2 border-black bg-black/30 hover:bg-black text-white transition-colors cursor-pointer"
            title="Dismiss announcement"
            aria-label="Dismiss banner"
          >
            <HiOutlineXMark className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
