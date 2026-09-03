"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase, Announcement } from "@awssbg/shared";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MeetTheTeam from "@/components/MeetTheTeam";
import SitewideBanner from "@/components/SitewideBanner";
import {
  HiArrowLeft,
  HiOutlineBolt,
  HiOutlineAcademicCap,
  HiOutlineCloud,
  HiOutlineCube,
  HiOutlineShieldCheck,
  HiOutlineQuestionMarkCircle,
  HiArrowUpRight,
} from "react-icons/hi2";

const PILLARS = [
  {
    icon: HiOutlineBolt,
    title: "AWS Study Jams",
    accent: "text-accent-purple",
    desc: "Hands-on interactive workshops covering AWS Lambda, EC2, S3, Containers, and Generative AI on Amazon Bedrock.",
  },
  {
    icon: HiOutlineAcademicCap,
    title: "Certification Prep & Vouchers",
    accent: "text-accent-blue",
    desc: "Structured study cohorts and exam prep resources for AWS Certified Cloud Practitioner and Solutions Architect Associate.",
  },
  {
    icon: HiOutlineCloud,
    title: "Cloud Quest & Gamified Labs",
    accent: "text-accent-purple",
    desc: "Role-based cloud challenges on AWS Skill Builder to gain practical troubleshooting and architecture experience.",
  },
  {
    icon: HiOutlineCube,
    title: "Real-World Projects & Hackathons",
    accent: "text-accent-blue",
    desc: "Collaborative builder sprints and open-source cloud projects that give students portfolio-ready cloud software.",
  },
];

const FAQS = [
  {
    q: "What is the AWS Student Builder Group (AWS SBG)?",
    a: "AWS SBG is a global student community program supported by Amazon Web Services (AWS) across 60+ countries. It empowers students to learn cloud architecture, build real projects, and launch cloud computing careers.",
  },
  {
    q: "Who is eligible to join AWS SBG activities?",
    a: "Any student aged 18+ who is actively enrolled at a university or college, regardless of academic major or experience level. All sessions are beginner-friendly with advanced tracks for experienced developers.",
  },
  {
    q: "Are the workshops and Study Jams free?",
    a: "Yes! All AWS SBG Study Jams, workshops, and community WhatsApp/Meetup sessions are 100% free of charge.",
  },
  {
    q: "How do students get AWS certification exam vouchers?",
    a: "Certification vouchers come through AWS Builder Center's Student Rewards program, not through our student group directly. Verify your student status on AWS Builder Center to unlock up to $579 in resources — including AWS credits, 12 months of premium Skill Builder access, and a certification exam voucher. Attending our Study Jams and labs is the best way to prep for the exam once you're verified.",
  },
];

export default function OrgAboutClient() {
  const params = useParams();
  const orgSlug = (params?.org as string) || "";
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    async function loadAnnouncement() {
      try {
        const { data: orgData } = await supabase
          .from("orgs")
          .select("id")
          .eq("slug", orgSlug)
          .single();

        if (orgData?.id) {
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
        }
      } catch (err) {
        console.error("Failed loading announcement in about:", err);
      }
    }
    loadAnnouncement();
  }, [orgSlug]);

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
                <span className="font-mono text-[10px] font-black uppercase tracking-widest text-white">
                  // ABOUT_US // {orgSlug.toUpperCase()}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
                About AWS SBG @{orgSlug.toUpperCase()}
              </h1>
              <p className="mt-1 font-mono text-xs font-semibold text-zinc-600">
                A student-led cloud computing community, supported by AWS, active in 60+ countries.
              </p>
            </div>

            <div className="mb-8 border-2 border-black bg-[#FEF08A] p-4 text-black shadow-[3px_3px_0px_#000000]">
              <div className="mb-1 flex items-center gap-1.5 font-mono text-xs font-black uppercase tracking-wider text-black">
                <HiOutlineShieldCheck className="h-4 w-4 text-black" />
                <span>AWS Affiliation &amp; Community Charter</span>
              </div>
              <p className="font-mono text-[12px] font-bold leading-relaxed text-black">
                AWS STUDENT BUILDER GROUP (AWS SBG) IS A STUDENT-LED COMMUNITY SUPPORTED BY AMAZON WEB SERVICES (AWS) ACROSS 60+ COUNTRIES. WE ARE RUN BY STUDENT BUILDERS TO DELIVER HANDS-ON WORKSHOPS, STUDY JAMS, AND CERTIFICATION PREPARATION.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="mb-3 font-mono text-sm font-black uppercase tracking-wider text-black border-l-4 border-accent-purple pl-2">
                Our Mission &amp; Purpose
              </h2>
              <p className="text-[14px] leading-relaxed text-zinc-800">
                The cloud is the backbone of modern technology, yet many students graduate without practical hands-on experience in production cloud architecture. The AWS Student Builder Group bridges this gap by providing an open, collaborative environment where students learn directly on AWS cloud infrastructure, build real software, and earn globally recognized certifications.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="mb-3 font-mono text-sm font-black uppercase tracking-wider text-black border-l-4 border-accent-blue pl-2">
                The 4 Core Pillars
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {PILLARS.map((pillar) => {
                  const Icon = pillar.icon;
                  return (
                    <div
                      key={pillar.title}
                      className="border-2 border-black bg-zinc-50 p-4 shadow-[3px_3px_0px_#000000] flex flex-col justify-between"
                    >
                      <div>
                        <div className="mb-2 flex h-8 w-8 items-center justify-center border-2 border-black bg-white">
                          <Icon className={`h-4 w-4 ${pillar.accent}`} />
                        </div>
                        <h3 className="font-mono text-xs font-black uppercase text-black">
                          {pillar.title}
                        </h3>
                        <p className="mt-1 text-[12px] text-zinc-700 leading-snug">
                          {pillar.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mb-8">
              <h2 className="mb-3 font-mono text-sm font-black uppercase tracking-wider text-black border-l-4 border-black pl-2 flex items-center gap-1.5">
                <HiOutlineQuestionMarkCircle className="h-4 w-4" />
                Frequently Asked Questions
              </h2>
              <div className="flex flex-col gap-3">
                {FAQS.map((faq) => (
                  <div
                    key={faq.q}
                    className="border-2 border-black bg-white p-4 shadow-[2px_2px_0px_#000000]"
                  >
                    <h3 className="font-mono text-xs font-black uppercase text-black">
                      {faq.q}
                    </h3>
                    <p className="mt-1.5 text-[12px] text-zinc-700 leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <MeetTheTeam orgSlug={orgSlug} />

            <div className="mt-8 border-t-2 border-black pt-6 flex flex-col sm:flex-row items-center gap-3">
              <Link
                href={`/${orgSlug}`}
                className="w-full sm:w-1/2 flex items-center justify-center gap-2 border-2 border-black bg-black px-4 py-3 font-mono text-xs font-black uppercase text-white shadow-[3px_3px_0px_#7C3AED] hover:bg-zinc-800 transition-all text-center no-underline"
              >
                <span>Explore Community Links</span>
                <HiArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href={`/${orgSlug}/contact`}
                className="w-full sm:w-1/2 flex items-center justify-center gap-2 border-2 border-black bg-white px-4 py-3 font-mono text-xs font-black uppercase text-black shadow-[3px_3px_0px_#000000] hover:bg-zinc-100 transition-all text-center no-underline"
              >
                <span>Contact the Team</span>
                <HiArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
