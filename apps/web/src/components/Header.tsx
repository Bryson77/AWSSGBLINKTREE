"use client";

/**
 * Header — Hardcore Neo-Brutalist brand strip with AWS SBG chip logo.
 * Geometry: 0px sharp corners, 3px solid black border, 2px hard shadow.
 */

import Image from "next/image";
import { toast } from "sonner";
import { HiOutlineShare } from "react-icons/hi2";

export default function Header() {
  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.origin : "https://awssbg.online";
    const shareData = {
      title: "AWS Student Builder Group",
      text: "Connect with the AWS Student Builder Group community!",
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
        description: "Share the AWS SBG Linktree with fellow builders.",
      });
    } catch {
      toast.error("Couldn't copy link. Please copy the URL from your browser.");
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b-[3px] border-black bg-white pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-[54px] sm:h-[58px] max-w-[500px] items-center justify-between px-4 sm:px-5">
        {/* Brand logo + Wordmark */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center border-2 border-black bg-white p-1 shadow-[2px_2px_0px_#000000]">
            <Image
              src="/logo.png"
              alt="AWS SBG Logo"
              width={28}
              height={28}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <span className="font-mono text-[12px] sm:text-[13px] font-black uppercase tracking-wider text-black">
            AWS SBG <span className="text-accent-purple">//</span> BUILDERS
          </span>
        </div>

        {/* Share Button (Mobile 44px min tap target touch area) */}
        <button
          onClick={handleShare}
          className="group flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center border-2 border-black bg-white text-black shadow-[2px_2px_0px_#000000] transition-all hover:bg-black hover:text-white active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          aria-label="Share Linktree"
          title="Share Linktree"
        >
          <HiOutlineShare className="h-4 w-4 transition-transform group-hover:scale-110" />
        </button>
      </div>
    </header>
  );
}
