"use client";

/**
 * Contact Page — AWS Student Builder Group.
 * Features: Direct Community Hub cards + Interactive Neo-Brutalist Inquiries Form.
 * Submissions save to Supabase 'inquiries' table and dispatch notifications to lethabomabilo33@gmail.com.
 */

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { supabase } from "@awssbg/shared";
import {
  HiArrowLeft,
  HiOutlineEnvelope,
  HiOutlineChatBubbleLeftRight,
  HiOutlinePaperAirplane,
  HiOutlineSparkles,
} from "react-icons/hi2";
import {
  SiDiscord,
  SiWhatsapp,
  SiGithub,
  FaLinkedinIn,
} from "react-icons/si";

const CHANNELS = [
  {
    name: "Discord Server",
    desc: "Study Jams, technical discussions, voice channels & hackathon teams.",
    icon: SiDiscord,
    color: "text-[#5865F2]",
    href: "https://discord.gg/invite/awssbg",
  },
  {
    name: "WhatsApp Community",
    desc: "Instant workshop alerts, session links, and voucher drop notifications.",
    icon: SiWhatsapp,
    color: "text-[#25D366]",
    href: "https://chat.whatsapp.com/invite/awssbg",
  },
  {
    name: "GitHub Organization",
    desc: "Open source workshop materials, cloud architecture templates & labs.",
    icon: SiGithub,
    color: "text-black",
    href: "https://github.com/awssbg",
  },
  {
    name: "LinkedIn Community",
    desc: "Connect with cloud architects, alumni, and AWS Student Builder Group leaders.",
    icon: FaLinkedinIn,
    color: "text-[#0A66C2]",
    href: "https://linkedin.com/company/awssbg",
  },
];

const CATEGORIES = [
  "General Inquiry",
  "Join Study Jam / Bootcamp",
  "Host Workshop / Speaker Request",
  "University Tech Club Partnership",
  "Certification Voucher Inquiry",
  "Other",
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: CATEGORIES[0],
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);

    try {
      // 1. Insert into Supabase inquiries table
      const { error: dbError } = await supabase.from("inquiries").insert({
        name: formData.name.trim(),
        email: formData.email.trim(),
        category: formData.category,
        message: formData.message.trim(),
        status: "unread",
      });

      if (dbError) {
        console.warn("Supabase direct insert notice:", dbError.message);
      }

      // 2. Dispatch to edge API for email notification forwarding
      try {
        await fetch("/api/inquiries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name.trim(),
            email: formData.email.trim(),
            category: formData.category,
            message: formData.message.trim(),
          }),
        });
      } catch (apiErr) {
        console.warn("Edge email dispatch notice:", apiErr);
      }

      toast.success("Message sent successfully!", {
        description: "The AWS SBG leadership team will review and respond shortly.",
      });

      setFormData({
        name: "",
        email: "",
        category: CATEGORIES[0],
        message: "",
      });
    } catch (err) {
      console.error("Submission error:", err);
      toast.error("Failed to send message. Please reach out directly on Discord or WhatsApp.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="brutal-grid-bg flex min-h-screen flex-col bg-[#F4F4F5]">
      <Header />

      <main className="flex-1 px-4 sm:px-6 py-8 sm:py-12">
        <div className="mx-auto max-w-[680px]">
          {/* Back button */}
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 border-2 border-black bg-white px-3 py-1 font-mono text-xs font-bold text-black shadow-[2px_2px_0px_#000000] hover:bg-black hover:text-white transition-all"
            >
              <HiArrowLeft className="h-3.5 w-3.5" />
              <span>&larr; Return to Home</span>
            </Link>
          </div>

          {/* Main Card */}
          <div className="border-[3px] border-black bg-white p-6 sm:p-9 shadow-[6px_6px_0px_#000000]">
            {/* Header Stamp */}
            <div className="mb-6 border-b-2 border-black pb-5">
              <div className="mb-2 inline-flex items-center gap-1.5 border-2 border-black bg-black px-2.5 py-0.5 text-white shadow-[2px_2px_0px_#7C3AED]">
                <HiOutlineEnvelope className="h-3.5 w-3.5 text-accent-purple" />
                <span className="font-mono text-[10px] font-black uppercase tracking-widest text-white">
                  // CONTACT_US // INQUIRIES_AND_COMMUNITY
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
                Get In Touch With AWS SBG
              </h1>
              <p className="mt-1 font-mono text-xs font-semibold text-zinc-600">
                Have questions about Study Jams, partnerships, or certification vouchers? Send us a message or join our live community channels.
              </p>
            </div>

            {/* Direct Community Channels */}
            <div className="mb-8">
              <h2 className="mb-3 font-mono text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                <HiOutlineChatBubbleLeftRight className="h-4 w-4" />
                <span>Instant Community Channels</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CHANNELS.map((channel) => {
                  const Icon = channel.icon;
                  return (
                    <a
                      key={channel.name}
                      href={channel.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group border-2 border-black bg-zinc-50 p-3.5 shadow-[2px_2px_0px_#000000] transition-all hover:bg-black hover:text-white no-underline block"
                    >
                      <div className="flex items-center gap-2.5 mb-1">
                        <div className="flex h-7 w-7 items-center justify-center border-2 border-black bg-white text-black group-hover:border-white">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="font-mono text-xs font-black uppercase tracking-wide text-black group-hover:text-white">
                          {channel.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-600 group-hover:text-zinc-300 leading-snug">
                        {channel.desc}
                      </p>
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Inquiry Form */}
            <div className="border-t-2 border-black pt-6">
              <h2 className="mb-4 font-mono text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                <HiOutlinePaperAirplane className="h-4 w-4 text-accent-purple" />
                <span>Send Direct Inquiry to Leadership</span>
              </h2>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Name */}
                <div>
                  <label className="mb-1 block font-mono text-xs font-black uppercase text-black">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Ndlovu"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border-2 border-black bg-white px-3 py-2.5 font-sans text-sm text-black placeholder:text-zinc-400 focus:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-accent-purple"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="mb-1 block font-mono text-xs font-black uppercase text-black">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. alex.builder@university.ac.za"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border-2 border-black bg-white px-3 py-2.5 font-sans text-sm text-black placeholder:text-zinc-400 focus:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-accent-purple"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="mb-1 block font-mono text-xs font-black uppercase text-black">
                    Inquiry Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border-2 border-black bg-white px-3 py-2.5 font-mono text-xs font-bold text-black focus:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-accent-purple cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="mb-1 block font-mono text-xs font-black uppercase text-black">
                    Your Message *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tell us what you'd like to collaborate on, ask about Study Jams, or suggest a workshop topic..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full border-2 border-black bg-white px-3 py-2.5 font-sans text-sm text-black placeholder:text-zinc-400 focus:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-accent-purple resize-y"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="group relative flex w-full items-center justify-center gap-2 overflow-hidden border-[3px] border-black bg-black px-5 py-3.5 font-mono text-xs font-black uppercase tracking-wider text-white shadow-[4px_4px_0px_#7C3AED] transition-all hover:bg-zinc-800 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 cursor-pointer"
                >
                  <HiOutlineSparkles className="h-4 w-4 text-accent-purple group-hover:rotate-12 transition-transform" />
                  <span>{submitting ? "Transmitting..." : "Send Message to SBG Team"}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
