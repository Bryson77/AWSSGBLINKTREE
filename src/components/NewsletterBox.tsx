"use client";

/**
 * NewsletterBox — Inkwell-inspired email/event invite subscription box.
 * Allows students to subscribe for TUT study jam reminders and AWS voucher drops.
 * Features Sonner toast confirmation.
 */

import { useState } from "react";
import { toast } from "sonner";
import { HiOutlineEnvelope, HiArrowRight } from "react-icons/hi2";

export default function NewsletterBox() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // Trigger feedback
    toast.success("You're on the list!", {
      description: `We'll send AWS Study Jam invites & voucher updates to ${email}`,
    });
    setSubmitted(true);
    setEmail("");
  };

  return (
    <section className="mx-auto w-full max-w-[500px] px-5 py-3">
      <div className="rounded-2xl border border-black/[0.08] bg-white p-5 shadow-sm transition-all hover:border-black/15">
        <div className="mb-3.5 flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent-purple/10 text-accent-purple"
            aria-hidden="true"
          >
            <HiOutlineEnvelope className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-[13.5px] font-bold text-[#0A0A0A]">
              Get Workshop &amp; Voucher Alerts
            </h3>
            <p className="text-[11.5px] text-zinc-500">
              Direct notifications for TUT Study Jams &amp; certification cohorts.
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/60 p-3 text-center text-xs font-semibold text-emerald-700">
            ✓ Subscribed! Keep an eye on your inbox for upcoming cloud sessions.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="email"
              required
              placeholder="Enter your student email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-black/10 bg-zinc-50/80 px-3.5 py-2.5 text-xs text-[#0A0A0A] placeholder:text-zinc-400 outline-none transition-colors focus:border-accent-purple focus:bg-white focus:ring-1 focus:ring-accent-purple"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0A0A0A] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-black/90 active:scale-95"
            >
              <span>Join</span>
              <HiArrowRight className="h-3 w-3" />
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
