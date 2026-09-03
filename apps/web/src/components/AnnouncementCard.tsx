"use client";

import React from "react";
import { Announcement, getIconForPlatform } from "@awssbg/shared";
import {
  HiOutlineArrowTopRightOnSquare,
  HiOutlineCalendarDays,
  HiOutlineMapPin,
  HiOutlineVideoCamera,
} from "react-icons/hi2";

interface AnnouncementCardProps {
  announcement: Announcement | null;
  orgSlug: string;
}

export default function AnnouncementCard({ announcement, orgSlug }: AnnouncementCardProps) {
  if (!announcement || !announcement.is_active) return null;

  const now = new Date();
  const start = new Date(announcement.start_date);
  const end = announcement.end_date ? new Date(announcement.end_date) : null;

  // Active validation at render time (§17)
  if (now < start || (end && now > end)) return null;

  // Action links resolution (supports multi-platform links with fallback to primary CTA)
  const actionLinks =
    announcement.links && announcement.links.length > 0
      ? announcement.links
      : announcement.cta_url
      ? [
          {
            title: announcement.cta_label || "Learn More",
            url: announcement.cta_url,
            platform: announcement.cta_platform || "website",
          },
        ]
      : [
          {
            title: announcement.cta_label || "Learn More",
            url: "/",
            platform: "website",
          },
        ];

  return (
    <section className="mx-auto w-full max-w-[680px] px-4 sm:px-6 mb-6">
      <div className="border-[3px] border-black bg-white p-5 sm:p-6 shadow-[6px_6px_0px_#000000] relative">
        {/* Header Ribbon: Badges & Dates */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 border-2 border-black bg-black px-2.5 py-0.5 text-white shadow-[2px_2px_0px_#7C3AED]">
              <HiOutlineCalendarDays className="h-3.5 w-3.5 text-purple-400" />
              <span className="font-mono text-[10px] font-black uppercase tracking-widest text-white">
                // UPCOMING_EVENT // {orgSlug.toUpperCase()}
              </span>
            </div>

            {/* Location Indicator Stamp */}
            {announcement.location_type === "online" ? (
              <div className="inline-flex items-center gap-1.5 border-2 border-black bg-zinc-100 px-2.5 py-0.5 text-black shadow-[2px_2px_0px_#000000]">
                <HiOutlineVideoCamera className="h-3.5 w-3.5 text-blue-600" />
                <span className="font-mono text-[10px] font-black uppercase tracking-wider text-black">
                  ONLINE EVENT
                </span>
              </div>
            ) : announcement.location_type === "hybrid" ? (
              <div className="inline-flex items-center gap-1.5 border-2 border-black bg-zinc-100 px-2.5 py-0.5 text-black shadow-[2px_2px_0px_#000000]">
                <HiOutlineMapPin className="h-3.5 w-3.5 text-purple-600" />
                <span className="font-mono text-[10px] font-black uppercase tracking-wider text-black">
                  HYBRID{announcement.location_name ? ` // ${announcement.location_name}` : ""}
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 border-2 border-black bg-zinc-100 px-2.5 py-0.5 text-black shadow-[2px_2px_0px_#000000]">
                <HiOutlineMapPin className="h-3.5 w-3.5 text-red-600" />
                <span className="font-mono text-[10px] font-black uppercase tracking-wider text-black">
                  IN-PERSON{announcement.location_name ? ` // ${announcement.location_name}` : ""}
                </span>
              </div>
            )}
          </div>

          <div className="font-mono text-[10px] font-bold text-zinc-600">
            {new Date(announcement.start_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
            {announcement.end_date
              ? ` – ${new Date(announcement.end_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}`
              : ""}
          </div>
        </div>

        {/* High-Fidelity Poster Image */}
        {announcement.poster_image_url && (
          <div className="mb-4 overflow-hidden border-[3px] border-black bg-black">
            <img
              src={announcement.poster_image_url}
              alt={announcement.title}
              className="max-h-[440px] w-full object-contain mx-auto"
              loading="eager"
            />
          </div>
        )}

        {/* Title & Description */}
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black">
          {announcement.title}
        </h2>

        {announcement.subtitle && (
          <p className="mt-1.5 font-mono text-xs sm:text-sm text-zinc-700 leading-relaxed">
            {announcement.subtitle}
          </p>
        )}

        {/* CTA Actions: Platform-Branded Buttons */}
        <div className="mt-5 pt-3.5 border-t-2 border-black/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="font-mono text-[10px] font-black uppercase tracking-wider text-zinc-500">
            Official Community Gathering
          </span>

          <div className="flex flex-wrap items-center gap-2.5">
            {actionLinks.map((link, idx) => {
              const Icon = getIconForPlatform(link.platform || "website");
              const isExt = link.url.startsWith("http://") || link.url.startsWith("https://");

              return (
                <a
                  key={idx}
                  href={link.url}
                  target={isExt ? "_blank" : undefined}
                  rel={isExt ? "noopener noreferrer" : undefined}
                  className="inline-flex items-center gap-2 border-2 border-black bg-black px-4 py-2 font-mono text-xs font-black uppercase text-white shadow-[3px_3px_0px_#7C3AED] hover:bg-accent-purple active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all no-underline cursor-pointer"
                >
                  <Icon className="h-4 w-4 shrink-0 text-white" aria-hidden="true" />
                  <span>{link.title}</span>
                  <HiOutlineArrowTopRightOnSquare className="h-3.5 w-3.5 shrink-0 opacity-80" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
