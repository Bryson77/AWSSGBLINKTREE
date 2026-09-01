/**
 * Hero — tailored specifically for AWS Student Builder Group at Tshwane University of Technology.
 * Light mode poster theme: Black & White primary, Purple & Blue accents, subtle geometric shapes.
 * Featuring the official AWS SBG chip logo mark.
 */

import Image from "next/image";
import {
  HiOutlineBolt,
  HiOutlineAcademicCap,
  HiOutlineCloud,
  HiOutlineCube,
} from "react-icons/hi2";

export default function Hero() {
  return (
    <section className="noise-overlay relative w-full overflow-hidden bg-white pt-9 pb-5">
      {/* Ambient soft purple & blue glow backdrop */}
      <div className="ambient-glow" aria-hidden="true" />

      {/* Subtle Geometric Background Shapes (matching poster aesthetic) */}
      <div className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden" aria-hidden="true">
        {/* Top-left geometric block outline */}
        <svg
          className="absolute -top-6 -left-12 h-44 w-44 text-black/[0.03]"
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <rect x="20" y="20" width="60" height="60" rx="4" />
          <path d="M50 0v20M50 80v20M0 50h20M80 50h20" />
        </svg>

        {/* Top-right floating geometric diamond/cross */}
        <svg
          className="absolute top-12 -right-8 h-36 w-36 text-accent-purple/[0.05]"
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <rect x="35" y="35" width="30" height="30" transform="rotate(45 50 50)" />
          <circle cx="50" cy="50" r="3" fill="currentColor" />
        </svg>

        {/* Bottom-left subtle circuit line */}
        <svg
          className="absolute -bottom-10 left-1/4 h-28 w-48 text-accent-blue/[0.05]"
          viewBox="0 0 200 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeDasharray="4 4"
        >
          <path d="M0 50h80l30 30h90" />
          <circle cx="110" cy="80" r="3" fill="currentColor" />
        </svg>
      </div>

      <div className="relative z-10 mx-auto max-w-[500px] px-5 text-center">
        {/* Featured AWS SBG Chip Logo Mark */}
        <div className="animate-hero animate-hero-delay-1 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-black/[0.08] bg-white p-2.5 shadow-md shadow-black/[0.04]">
          <Image
            src="/logo.png"
            alt="AWS Student Builder Group TUT Logo"
            width={64}
            height={64}
            className="h-full w-full object-contain"
            priority
          />
        </div>

        {/* Chapter Eyebrow Badge */}
        <div className="animate-hero animate-hero-delay-1 mb-3.5 inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-zinc-50 px-3.5 py-1 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent-purple">
            TUT Chapter
          </span>
          <span className="text-zinc-300">•</span>
          <span className="text-[11px] font-medium tracking-wide text-zinc-600">
            AWS Student Builders
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="animate-hero animate-hero-delay-2 mb-3 text-[28px] font-black uppercase leading-[1.15] tracking-tight text-[#0A0A0A] sm:text-[34px]">
          Build, Certify &amp; Connect <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-accent-purple via-[#6366F1] to-accent-blue bg-clip-text text-transparent">
            In The Cloud
          </span>
        </h1>

        {/* Subtext */}
        <p className="animate-hero animate-hero-delay-3 mx-auto max-w-[430px] text-[14px] leading-relaxed text-zinc-600 sm:text-[15px]">
          Tshwane University of Technology&apos;s official student cloud community.
          Hands-on AWS Study Jams, Cloud Practitioner &amp; Solutions Architect certification prep,
          hackathons, and industry mentorship.
        </p>

        {/* Core Pillars Micro-badges (Clean SVG Icons, Zero Emojis) */}
        <div className="animate-hero animate-hero-delay-4 mt-5 flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-medium text-zinc-600">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-2.5 py-1 shadow-xs">
            <HiOutlineBolt className="h-3.5 w-3.5 text-accent-purple" aria-hidden="true" />
            <span>AWS Study Jams</span>
          </span>
          <span className="text-zinc-300" aria-hidden="true">•</span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-2.5 py-1 shadow-xs">
            <HiOutlineAcademicCap className="h-3.5 w-3.5 text-accent-blue" aria-hidden="true" />
            <span>Cert Vouchers</span>
          </span>
          <span className="text-zinc-300" aria-hidden="true">•</span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-2.5 py-1 shadow-xs">
            <HiOutlineCloud className="h-3.5 w-3.5 text-accent-purple" aria-hidden="true" />
            <span>Cloud Quest</span>
          </span>
          <span className="text-zinc-300" aria-hidden="true">•</span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-2.5 py-1 shadow-xs">
            <HiOutlineCube className="h-3.5 w-3.5 text-accent-blue" aria-hidden="true" />
            <span>Cloud Projects</span>
          </span>
        </div>
      </div>
    </section>
  );
}
