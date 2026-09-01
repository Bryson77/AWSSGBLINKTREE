/**
 * Footer — Hardcore Neo-Brutalist bookend footer with builder quote, legal links & admin portal.
 * Geometry: 0px sharp corners, 3px solid black border.
 */

import Link from "next/link";
import { HiOutlineLockClosed } from "react-icons/hi2";

export default function Footer() {
  return (
    <footer className="w-full border-t-[3px] border-black bg-white py-6 text-center">
      <div className="mx-auto flex max-w-[500px] flex-col items-center justify-center gap-3 px-5">
        <p className="font-mono text-[12px] font-bold tracking-wider text-black">
          <span className="bg-black px-2 py-0.5 text-white">&ldquo;GO BUILD.&rdquo;</span> — AWS STUDENT BUILDER GROUP
        </p>

        {/* Legal & Policy Links */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 font-mono text-[11px] font-bold text-zinc-700">
          <Link href="/privacy" className="underline underline-offset-2 hover:text-accent-purple">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link href="/terms" className="underline underline-offset-2 hover:text-accent-purple">
            Terms of Service
          </Link>
        </div>

        <p className="font-mono text-[10px] leading-tight text-zinc-500">
          Independent student builder community. Not created, affiliated with, or endorsed by Amazon Web Services, Inc.
        </p>

        <div className="font-mono text-[10px] text-zinc-400">
          &copy; {new Date().getFullYear()} AWS SBG Community
        </div>
      </div>
    </footer>
  );
}


