import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { HiArrowLeft, HiOutlineDocumentText } from "react-icons/hi2";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — AWS Student Builder Group",
  description: "Terms and conditions for using the AWS Student Builder Group community link hub.",
};

export default function TermsPage() {
  return (
    <div className="brutal-grid-bg flex min-h-screen flex-col bg-[#F4F4F5]">
      <Header />

      <main className="flex-1 px-5 py-10">
        <div className="mx-auto max-w-[620px]">
          {/* Back button */}
          <div className="mb-5">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 border-2 border-black bg-white px-3 py-1 font-mono text-xs font-bold text-black shadow-[2px_2px_0px_#000000] hover:bg-black hover:text-white"
            >
              <HiArrowLeft className="h-3.5 w-3.5" />
              <span>&larr; Return to Links</span>
            </Link>
          </div>

          {/* Main Card */}
          <div className="border-[3px] border-black bg-white p-7 shadow-[6px_6px_0px_#000000] sm:p-9">
            {/* Header Stamp */}
            <div className="mb-6 border-b-2 border-black pb-5">
              <div className="mb-2 inline-flex items-center gap-1.5 border-2 border-black bg-black px-2.5 py-0.5 text-white shadow-[2px_2px_0px_#2563EB]">
                <HiOutlineDocumentText className="h-3.5 w-3.5 text-accent-blue" />
                <span className="font-mono text-[10px] font-black uppercase tracking-widest text-white">
                  // LEGAL_DOCUMENT // TERMS_OF_SERVICE
                </span>
              </div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-black sm:text-3xl">
                Terms of Service
              </h1>
              <p className="mt-1 font-mono text-xs font-semibold text-zinc-600">
                Last updated: September 2026
              </p>
            </div>

            {/* OFFICIAL AFFILIATION & COMMUNITY NOTICE */}
            <div className="mb-8 border-2 border-black bg-[#FEF08A] p-4 text-black shadow-[3px_3px_0px_#000000]">
              <div className="mb-1 flex items-center gap-1.5 font-mono text-xs font-black uppercase tracking-wider text-black">
                <HiOutlineDocumentText className="h-4 w-4 text-black" />
                <span>AWS Student Builder Group Notice</span>
              </div>
              <p className="font-mono text-[12px] font-bold leading-relaxed text-black">
                AWS STUDENT BUILDER GROUP (SBG) IS AN OFFICIAL STUDENT COMMUNITY AFFILIATED WITH AND SUPPORTED BY AMAZON WEB SERVICES (AWS).
                THIS PORTAL IS MAINTAINED BY SBG LEADERS TO FACILITATE ACCESS TO HANDS-ON STUDY JAMS, CERTIFICATION VOUCHERS, WORKSHOPS, AND CLOUD RESOURCES.
              </p>
            </div>

            {/* Content Sections */}
            <div className="space-y-6 text-[13.5px] leading-relaxed text-zinc-800">
              <section>
                <h2 className="mb-2 border-l-4 border-accent-blue pl-2 font-mono text-sm font-black uppercase tracking-wider text-black">
                  1. Acceptance of Terms
                </h2>
                <p>
                  By accessing or using the AWS SBG website, you agree to comply with and be bound by these Terms
                  of Service. If you do not agree with any part of these terms, please do not use this portal.
                </p>
              </section>

              <section>
                <h2 className="mb-2 border-l-4 border-accent-blue pl-2 font-mono text-sm font-black uppercase tracking-wider text-black">
                  2. Trademarks &amp; Intellectual Property
                </h2>
                <p>
                  &ldquo;Amazon Web Services&rdquo;, &ldquo;AWS&rdquo;, and any associated cloud service names or marks are
                  registered trademarks of Amazon.com, Inc. or its affiliates. All product names, logos, and brands
                  referenced are property of their respective owners and used solely for identification and educational
                  community navigation purposes.
                </p>
              </section>

              <section>
                <h2 className="mb-2 border-l-4 border-accent-blue pl-2 font-mono text-sm font-black uppercase tracking-wider text-black">
                  3. Community &amp; Informational Purpose
                </h2>
                <p>
                  All content, workshop schedules, and certification study resources shared through this link hub are
                  provided on an &ldquo;as is&rdquo; basis for non-commercial student learning and community coordination.
                </p>
              </section>

              <section>
                <h2 className="mb-2 border-l-4 border-accent-blue pl-2 font-mono text-sm font-black uppercase tracking-wider text-black">
                  4. Limitation of Liability
                </h2>
                <p>
                  Under no circumstances shall the student creators, maintainers, or community leaders of this hub be
                  liable for any indirect, incidental, or consequential damages resulting from the use of or inability to
                  use any third-party services linked on this platform.
                </p>
              </section>

              <section>
                <h2 className="mb-2 border-l-4 border-accent-blue pl-2 font-mono text-sm font-black uppercase tracking-wider text-black">
                  5. Contact Information
                </h2>
                <p className="font-mono text-xs">
                  For inquiries regarding terms or community operations, contact{" "}
                  <a href="mailto:admin@awssbg.online" className="font-bold underline hover:text-accent-purple">
                    admin@awssbg.online
                  </a>.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
