"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SitewideBanner from "@/components/SitewideBanner";
import { toast } from "sonner";
import { supabase, Announcement } from "@awssbg/shared";
import {
  HiArrowLeft,
  HiOutlineEnvelope,
  HiOutlineChatBubbleLeftRight,
  HiOutlinePaperAirplane,
  HiOutlineSparkles,
} from "react-icons/hi2";
import { SiWhatsapp, SiMeetup } from "react-icons/si";
import { FaLinkedinIn } from "react-icons/fa6";

const DEFAULT_CHANNELS = [
  {
    platform: "whatsapp",
    name: "WhatsApp Community",
    desc: "Instant workshop alerts, session links, and voucher drop notifications.",
    icon: SiWhatsapp,
    href: process.env.NEXT_PUBLIC_WHATSAPP_URL || "https://chat.whatsapp.com/CctGVCDhxhA8qcIZzHXpZg?s=cl&p=i&mlu=4&ilr=4",
  },
  {
    platform: "meetup",
    name: "Meetup Events",
    desc: "RSVP for upcoming in-person Study Jams, certification bootcamps, and hackathons.",
    icon: SiMeetup,
    href: "https://www.meetup.com/aws-sbg-at-tshwane-university-of-technolog-soshanguve-south/",
  },
  {
    platform: "linkedin",
    name: "LinkedIn Community",
    desc: "Connect with student cloud builders, alumni, and AWS SBG leadership.",
    icon: FaLinkedinIn,
    href: "https://www.linkedin.com/company/aws-cloud-clubs-tut",
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

export default function OrgContactClient() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = (params?.org as string) || "";

  const [shouldRender, setShouldRender] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [channels, setChannels] = useState(DEFAULT_CHANNELS);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: CATEGORIES[0],
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadOrgAndChannels() {
      try {
        const { data: allOrgs } = await supabase.from("orgs").select("id");
        if (!allOrgs || allOrgs.length <= 1) {
          router.replace("/contact");
          return;
        }
        setShouldRender(true);

        const { data: orgData } = await supabase
          .from("orgs")
          .select("id")
          .eq("slug", orgSlug)
          .single();

        if (orgData) {
          setOrgId(orgData.id);

          // Query active announcement
          const nowIso = new Date().toISOString();
          const { data: annData } = await supabase
            .from("announcements")
            .select("*")
            .eq("org_id", orgData.id)
            .eq("is_active", true)
            .lte("start_date", nowIso)
            .order("start_date", { ascending: false });

          if (annData && annData.length > 0) {
            const activeItem = annData.find(
              (a) => !a.end_date || new Date(a.end_date) >= new Date()
            );
            setAnnouncement(activeItem ? (activeItem as Announcement) : null);
          } else {
            setAnnouncement(null);
          }

          const { data: linksData } = await supabase
            .from("links")
            .select("platform, url")
            .eq("org_id", orgData.id)
            .eq("is_active", true);

          if (linksData && linksData.length > 0) {
            setChannels((prev) =>
              prev.map((ch) => {
                const match = linksData.find(
                  (d) => d.platform?.toLowerCase() === ch.platform.toLowerCase()
                );
                return match?.url ? { ...ch, href: match.url } : ch;
              })
            );
          }
        }
      } catch (err) {
        console.error("Failed loading org info:", err);
      }
    }

    loadOrgAndChannels();
  }, [orgSlug, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: orgId || undefined,
          name: formData.name.trim(),
          email: formData.email.trim(),
          category: formData.category,
          message: formData.message.trim(),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Submission rejected by server.");
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
      toast.error("Failed to send message: " + (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!shouldRender) return null;

  return (
    <div className="brutal-grid-bg flex min-h-screen flex-col bg-[#F4F4F5]">
      <Header />
      <SitewideBanner announcement={announcement} orgSlug={orgSlug} />

      <main className="flex-1 px-4 sm:px-6 py-8 sm:py-12">
        <div className="mx-auto max-w-[680px]">
          <div className="mb-6">
            <Link
              href={`/${orgSlug}`}
              className="inline-flex items-center gap-1.5 border-2 border-black bg-white px-3 py-1 font-mono text-xs font-bold text-black shadow-[2px_2px_0px_#000000] hover:bg-black hover:text-white transition-all"
            >
              <HiArrowLeft className="h-3.5 w-3.5" />
              <span>Return to AWS SBG Hub</span>
            </Link>
          </div>

          <div className="border-[3px] border-black bg-white p-6 sm:p-9 shadow-[6px_6px_0px_#000000]">
            <div className="mb-6 border-b-2 border-black pb-5">
              <div className="mb-2 inline-flex items-center gap-1.5 border-2 border-black bg-black px-2.5 py-0.5 text-white shadow-[2px_2px_0px_#7C3AED]">
                <HiOutlineEnvelope className="h-3.5 w-3.5 text-accent-purple" />
                <span className="font-mono text-[10px] font-black uppercase tracking-widest text-white">
                  // CONTACT // {orgSlug.toUpperCase()}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
                Contact AWS SBG @{orgSlug.toUpperCase()}
              </h1>
              <p className="mt-1 font-mono text-xs font-semibold text-zinc-600">
                Have questions for our group? Submit an inquiry and our student leaders will follow up directly.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="mb-3 font-mono text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                <HiOutlineChatBubbleLeftRight className="h-4 w-4" />
                <span>Instant Community Channels</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {channels.map((channel) => {
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

            <div className="border-t-2 border-black pt-6">
              <h2 className="mb-4 font-mono text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                <HiOutlinePaperAirplane className="h-4 w-4 text-accent-purple" />
                <span>Send Direct Inquiry to Group Leadership</span>
              </h2>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

                <div>
                  <label className="mb-1 block font-mono text-xs font-black uppercase text-black">
                    Your Message *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tell us what you'd like to collaborate on or ask..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full border-2 border-black bg-white px-3 py-2.5 font-sans text-sm text-black placeholder:text-zinc-400 focus:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-accent-purple resize-y"
                  />
                </div>

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
