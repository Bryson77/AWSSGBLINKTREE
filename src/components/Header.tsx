"use client";

/**
 * Header — Light mode brand strip with official AWS SBG chip logo.
 * Primary colors: Black and White, Accents: Purple & Blue.
 */

import Image from "next/image";
import { toast } from "sonner";
import { HiOutlineShare } from "react-icons/hi2";

export default function Header() {
  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.origin : "https://awssbgtut.co.za";
    const shareData = {
      title: "AWS Student Builder Group — TUT",
      text: "Connect with the AWS Student Builder Group at Tshwane University of Technology!",
      url,
    };

    if (navigator.share && typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          // Fallback to clipboard
        }
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!", {
        description: "Share the AWS SBG Linktree with fellow students.",
      });
    } catch {
      toast.error("Couldn't copy link. Please copy the URL from your browser.");
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-black/[0.06] bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-[60px] max-w-[500px] items-center justify-between px-5">
        {/* Brand logo + Wordmark */}
        <div className="flex items-center gap-2.5">
          <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-md border border-black/10 bg-white p-0.5 shadow-sm">
            <Image
              src="/logo.png"
              alt="AWS SBG Logo"
              width={28}
              height={28}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <span className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#0A0A0A]">
            AWS SBG <span className="text-accent-purple font-extrabold">TUT</span>
          </span>
        </div>

        {/* Share Button with Sonner feedback */}
        <button
          onClick={handleShare}
          className="group flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 bg-black/[0.02] text-zinc-600 transition-all hover:border-black/25 hover:bg-black/[0.05] hover:text-[#0A0A0A] active:scale-95"
          aria-label="Share Linktree"
          title="Share Linktree"
        >
          <HiOutlineShare className="h-4 w-4 transition-transform group-hover:scale-110" />
        </button>
      </div>
    </header>
  );
}
