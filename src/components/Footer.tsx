/**
 * Footer — Hardcore Neo-Brutalist bookend footer with builder quote & admin link.
 * Geometry: 0px sharp corners, 3px solid black border.
 */

import Link from "next/link";
import { HiOutlineLockClosed } from "react-icons/hi2";

export default function Footer() {
  return (
    <footer className="w-full border-t-[3px] border-black bg-white py-6 text-center">
      <div className="mx-auto flex max-w-[500px] flex-col items-center justify-center gap-2.5 px-5">
        <p className="font-mono text-[12px] font-bold tracking-wider text-black">
          <span className="bg-black px-2 py-0.5 text-white">&ldquo;GO BUILD.&rdquo;</span> — AWS STUDENT BUILDER GROUP
        </p>

        <div className="flex items-center gap-3 font-mono text-[11px] font-medium text-zinc-600">
          <span>&copy; {new Date().getFullYear()} AWS SBG</span>
          <span>//</span>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 font-bold text-black underline underline-offset-2 transition-colors hover:text-accent-purple"
            aria-label="Admin Portal"
          >
            <HiOutlineLockClosed className="h-3 w-3" />
            <span>[ADMIN]</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}

