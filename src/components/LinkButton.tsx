/**
 * LinkButton — Light mode with bold black fill sweep on hover.
 * Primary colors: Black & White, Accents: Purple & Blue.
 * Micro-interactions:
 *  - Sweep fill to solid dark on hover
 *  - Text & icon invert to pure white
 *  - Directional arrow translation on hover
 *  - Tactile scale(0.98) on active press
 */

import { getIconForPlatform } from "@/lib/icons";
import { HiArrowUpRight } from "react-icons/hi2";

interface LinkButtonProps {
  title: string;
  url: string;
  platform: string;
  description?: string;
}

export default function LinkButton({
  title,
  url,
  platform,
  description,
}: LinkButtonProps) {
  const Icon = getIconForPlatform(platform);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group link-button flex w-full items-center justify-between gap-3.5 rounded-[14px] px-4 py-3.5 text-left no-underline"
    >
      <div className="flex min-w-0 items-center gap-3.5">
        {/* Platform icon badge */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-[#0A0A0A] transition-colors group-hover:bg-white/15 group-hover:text-white"
          aria-hidden="true"
        >
          <Icon className="h-5 w-5" />
        </div>

        {/* Title and optional description */}
        <div className="min-w-0 flex-1">
          <span className="block truncate text-[14.5px] font-bold leading-snug text-[#0A0A0A] transition-colors group-hover:text-white">
            {title}
          </span>
          {description && (
            <span className="mt-0.5 block truncate text-[12.5px] leading-snug text-zinc-500 transition-colors group-hover:text-zinc-300">
              {description}
            </span>
          )}
        </div>
      </div>

      {/* Trailing arrow */}
      <div
        className="flex h-6 w-6 shrink-0 items-center justify-center text-zinc-400 transition-all duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white"
        aria-hidden="true"
      >
        <HiArrowUpRight className="h-4 w-4" />
      </div>
    </a>
  );
}
