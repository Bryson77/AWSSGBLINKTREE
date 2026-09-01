/**
 * Hero — Hardcore Neo-Brutalist layout for AWS Student Builder Group.
 * Geometry: 0px sharp corners, 3px solid black borders, hard drop shadows.
 * Typography: Montserrat 900 bold headline + Monospace tags. Zero emojis.
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
    <section className="relative w-full overflow-hidden pt-6 sm:pt-9 pb-3">
      <div className="relative z-10 mx-auto max-w-[500px] px-4 sm:px-5 text-center">
        {/* Featured AWS SBG Chip Logo Mark (0px Boxed Stamp) */}
        <div className="animate-hero animate-hero-delay-1 mx-auto mb-3 sm:mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center border-[3px] border-black bg-white p-1.5 sm:p-2 shadow-[3px_3px_0px_#000000] sm:shadow-[4px_4px_0px_#000000]">
          <Image
            src="/logo.png"
            alt="AWS Student Builder Group Logo"
            width={64}
            height={64}
            className="h-full w-full object-contain"
            priority
          />
        </div>

        {/* Monospace Eyebrow Stamp */}
        <div className="animate-hero animate-hero-delay-1 mb-3 inline-flex items-center gap-1.5 sm:gap-2 border-2 border-black bg-black px-2.5 py-0.5 sm:px-3 sm:py-1 text-white shadow-[2px_2px_0px_#7C3AED]">
          <span className="font-mono text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-white">
            // AWS_STUDENT_BUILDER_GROUP
          </span>
        </div>

        {/* Main Headline (Brutalist Punch) */}
        <h1 className="animate-hero animate-hero-delay-2 mb-3 text-[26px] sm:text-[34px] font-black uppercase leading-[1.1] tracking-tight text-black">
          Build, Certify &amp; Connect <br className="hidden sm:inline" />
          <span className="mt-1 inline-block border-2 border-black bg-accent-purple px-2 py-0.5 sm:px-2.5 text-white shadow-[3px_3px_0px_#000000]">
            In The Cloud
          </span>
        </h1>

        {/* Subtext */}
        <p className="animate-hero animate-hero-delay-3 mx-auto max-w-[440px] text-[13px] sm:text-[14px] font-medium leading-relaxed text-zinc-800">
          Student cloud builder community. Hands-on AWS Study Jams, Cloud Practitioner &amp; Solutions Architect certification prep, hackathons, and industry mentorship.
        </p>

        {/* Core Pillars (0px Sharp Brutalist Chips) */}
        <div className="animate-hero animate-hero-delay-4 mt-4 sm:mt-5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
          <div className="group inline-flex items-center gap-1 sm:gap-1.5 border-2 border-black bg-white px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-bold text-black shadow-[2px_2px_0px_#000000] transition-all hover:bg-black hover:text-white">
            <HiOutlineBolt className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-accent-purple group-hover:text-white" aria-hidden="true" />
            <span className="font-mono uppercase">AWS Study Jams</span>
          </div>

          <div className="group inline-flex items-center gap-1 sm:gap-1.5 border-2 border-black bg-white px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-bold text-black shadow-[2px_2px_0px_#000000] transition-all hover:bg-black hover:text-white">
            <HiOutlineAcademicCap className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-accent-blue group-hover:text-white" aria-hidden="true" />
            <span className="font-mono uppercase">Cert Vouchers</span>
          </div>

          <div className="group inline-flex items-center gap-1 sm:gap-1.5 border-2 border-black bg-white px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-bold text-black shadow-[2px_2px_0px_#000000] transition-all hover:bg-black hover:text-white">
            <HiOutlineCloud className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-accent-purple group-hover:text-white" aria-hidden="true" />
            <span className="font-mono uppercase">Cloud Quest</span>
          </div>

          <div className="group inline-flex items-center gap-1 sm:gap-1.5 border-2 border-black bg-white px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-bold text-black shadow-[2px_2px_0px_#000000] transition-all hover:bg-black hover:text-white">
            <HiOutlineCube className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-accent-blue group-hover:text-white" aria-hidden="true" />
            <span className="font-mono uppercase">Cloud Projects</span>
          </div>
        </div>
      </div>
    </section>
  );
}
