/**
 * Footer — Light mode brand footer with builder quote & admin link.
 * Primary colors: Black & White, Accents: Purple & Blue.
 */

import Link from "next/link";
import { HiOutlineLockClosed } from "react-icons/hi2";

export default function Footer() {
  return (
    <footer className="w-full border-t border-black/[0.06] bg-zinc-50/80 py-6 text-center">
      <div className="mx-auto flex max-w-[500px] flex-col items-center justify-center gap-2 px-5">
        <p className="text-[12px] font-medium tracking-wide text-zinc-500">
          <span className="font-semibold text-accent-purple">&ldquo;Go build.&rdquo;</span> — AWS SBG @ TUT
        </p>

        <div className="flex items-center gap-3 text-[11px] text-zinc-400">
          <span>&copy; {new Date().getFullYear()} AWS Student Builder Group TUT</span>
          <span>•</span>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-zinc-400 transition-colors hover:text-accent-purple"
            aria-label="Admin Portal"
          >
            <HiOutlineLockClosed className="h-3 w-3" />
            <span>Admin</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
