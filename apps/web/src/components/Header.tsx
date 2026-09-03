"use client";

/**
 * Header — Hardcore Neo-Brutalist Top Navbar.
 * Navigation: Home (/), About (/about), Contact (/contact), Native Share & Mobile Drawer.
 * Geometry: 0px sharp corners, 3px solid black border, 2px/4px hard shadow.
 */

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  HiOutlineShare,
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineHome,
  HiOutlineInformationCircle,
  HiOutlineEnvelope,
  HiOutlineDocumentText,
} from "react-icons/hi2";



export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Single-SBG mode: all primary navigation points to unified root routes
  const navLinks = [
    { href: "/", label: "Home", icon: HiOutlineHome },
    { href: "/about", label: "About", icon: HiOutlineInformationCircle },
    { href: "/blog", label: "Blog", icon: HiOutlineDocumentText },
    { href: "/contact", label: "Contact", icon: HiOutlineEnvelope },
  ];

  const checkIsActive = (linkHref: string) => {
    if (linkHref === "/") {
      return pathname === "/" || pathname === "/tut";
    }
    return pathname.startsWith(linkHref);
  };

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "https://awssbg.online";
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
        description: "Share the AWS SBG site with fellow builders.",
      });
    } catch {
      toast.error("Couldn't copy link. Please copy the URL from your browser.");
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b-[3px] border-black bg-white pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-[58px] sm:h-[62px] max-w-[720px] items-center justify-between px-4 sm:px-6">
        {/* Brand logo + Wordmark */}
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group no-underline">
          <div className="relative flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center border-2 border-black bg-white p-1 shadow-[2px_2px_0px_#000000] transition-transform group-hover:scale-105">
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
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 font-mono text-[12px] font-black uppercase">
          {navLinks.map((link) => {
            const isActive = checkIsActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 border-2 transition-all ${
                  isActive
                    ? "border-black bg-black text-white shadow-[2px_2px_0px_#7C3AED]"
                    : "border-transparent text-black hover:border-black hover:bg-zinc-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions (Share + Mobile Menu Button) */}
        <div className="flex items-center gap-2">
          {/* Share Button */}
          <button
            onClick={handleShare}
            className="group flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center border-2 border-black bg-white text-black shadow-[2px_2px_0px_#000000] transition-all hover:bg-black hover:text-white active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer"
            aria-label="Share AWS SBG site"
            title="Share AWS SBG site"
          >
            <HiOutlineShare className="h-4 w-4 transition-transform group-hover:scale-110" />
          </button>

          {/* Mobile Menu Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex h-9 w-9 items-center justify-center border-2 border-black bg-white text-black shadow-[2px_2px_0px_#000000] transition-all hover:bg-black hover:text-white active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer"
            aria-label={mobileMenuOpen ? "Close menu" : "Open navigation menu"}
          >
            {mobileMenuOpen ? (
              <HiOutlineXMark className="h-5 w-5" />
            ) : (
              <HiOutlineBars3 className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-[3px] border-black bg-white px-4 py-4 shadow-[0px_6px_0px_#000000]">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = checkIsActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 border-2 font-mono text-[13px] font-black uppercase transition-all ${
                    isActive
                      ? "border-black bg-black text-white shadow-[3px_3px_0px_#7C3AED]"
                      : "border-black bg-white text-black shadow-[2px_2px_0px_#000000] hover:bg-zinc-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
