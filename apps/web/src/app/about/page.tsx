import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
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
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us — AWS Student Builder Group",
  description:
    "Learn about AWS Student Builder Group (AWS SBG) — the official global student cloud community powered by Amazon Web Services (AWS) across 60+ countries.",
};

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
    a: "Certification vouchers come through AWS Builder Center's Student Rewards program, not through this chapter directly. Verify your student status on AWS Builder Center to unlock up to $579 in resources — including AWS credits, 12 months of premium Skill Builder access, and a certification exam voucher. Attending our Study Jams and labs is the best way to prep for the exam once you're verified.",
  },
];

export default function AboutPage() {
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
                <span className="font-mono text-[10px] font-black uppercase tracking-widest text-white">
                  // ABOUT_US // GLOBAL_STUDENT_COMMUNITY
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
                About AWS Student Builder Group
              </h1>
              <p className="mt-1 font-mono text-xs font-semibold text-zinc-600">
                A student-led cloud computing community, supported by AWS, active in 60+ countries.
              </p>
            </div>

            {/* OFFICIAL AFFILIATION & PURPOSE NOTICE */}
            <div className="mb-8 border-2 border-black bg-[#FEF08A] p-4 text-black shadow-[3px_3px_0px_#000000]">
              <div className="mb-1 flex items-center gap-1.5 font-mono text-xs font-black uppercase tracking-wider text-black">
                <HiOutlineShieldCheck className="h-4 w-4 text-black" />
                <span>AWS Affiliation &amp; Community Charter</span>
              </div>
              <p className="font-mono text-[12px] font-bold leading-relaxed text-black">
                AWS STUDENT BUILDER GROUP (AWS SBG) IS A STUDENT-LED COMMUNITY SUPPORTED BY AMAZON WEB SERVICES (AWS) ACROSS 60+ COUNTRIES. WE ARE RUN BY STUDENT BUILDERS TO DELIVER HANDS-ON WORKSHOPS, STUDY JAMS, AND CERTIFICATION PREPARATION.
              </p>
            </div>

            {/* Our Mission */}
            <div className="mb-8">
              <h2 className="mb-3 font-mono text-sm font-black uppercase tracking-wider text-black border-l-4 border-accent-purple pl-2">
                Our Mission &amp; Purpose
              </h2>
              <p className="text-[14px] leading-relaxed text-zinc-800">
                The cloud is the backbone of modern technology, yet many students graduate without practical hands-on experience in production cloud architecture. The AWS Student Builder Group bridges this gap by providing an open, collaborative environment where students learn directly on AWS cloud infrastructure, build real software, and earn globally recognized certifications.
              </p>
            </div>

            {/* 4 Core Pillars */}
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

            {/* Frequently Asked Questions */}
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

            {/* Action Buttons */}
            <div className="mt-8 border-t-2 border-black pt-6 flex flex-col sm:flex-row items-center gap-3">
              <Link
                href="/"
                className="w-full sm:w-1/2 flex items-center justify-center gap-2 border-2 border-black bg-black px-4 py-3 font-mono text-xs font-black uppercase text-white shadow-[3px_3px_0px_#7C3AED] hover:bg-zinc-800 transition-all text-center no-underline"
              >
                <span>Explore Community Links</span>
                <HiArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
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
