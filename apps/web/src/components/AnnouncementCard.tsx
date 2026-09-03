"use client";

import React from "react";
import { Announcement } from "@awssbg/shared";
import { HiOutlineArrowTopRightOnSquare, HiOutlineCalendarDays } from "react-icons/hi2";

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

  const destinationUrl = announcement.cta_url || `/${orgSlug}`;
  const isExternal = destinationUrl.startsWith("http://") || destinationUrl.startsWith("https://");

  return (
    <section className="mx-auto w-full max-w-[680px] px-4 sm:px-6 mb-6">
      <div className="border-[3px] border-black bg-white p-5 sm:p-6 shadow-[6px_6px_0px_#000000] relative">
        {/* Header Ribbon */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-3">
          <div className="inline-flex items-center gap-1.5 border-2 border-black bg-black px-2.5 py-0.5 text-white shadow-[2px_2px_0px_#7C3AED]">
            <HiOutlineCalendarDays className="h-3.5 w-3.5 text-purple-400" />
            <span className="font-mono text-[10px] font-black uppercase tracking-widest text-white">
              // UPCOMING_EVENT // {orgSlug.toUpperCase()}
            </span>
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

        {/* CTA Action */}
        <div className="mt-5 pt-3 border-t-2 border-black/10 flex items-center justify-between">
          <span className="font-mono text-[10px] font-black uppercase tracking-wider text-zinc-500">
            Official Community Gathering
          </span>

          <a
            href={destinationUrl}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className="inline-flex items-center gap-2 border-2 border-black bg-black px-5 py-2.5 font-mono text-xs font-black uppercase text-white shadow-[3px_3px_0px_#7C3AED] hover:bg-accent-purple active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all no-underline"
          >
            <span>{announcement.cta_label || "Learn More"}</span>
            <HiOutlineArrowTopRightOnSquare className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
