import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { HiArrowLeft, HiOutlineShieldCheck } from "react-icons/hi2";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — AWS Student Builder Group",
  description: "Privacy policy and data protection terms for the AWS Student Builder Group community hub.",
};

export default function PrivacyPage() {
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
              <div className="mb-2 inline-flex items-center gap-1.5 border-2 border-black bg-black px-2.5 py-0.5 text-white shadow-[2px_2px_0px_#7C3AED]">
                <HiOutlineShieldCheck className="h-3.5 w-3.5 text-accent-purple" />
                <span className="font-mono text-[10px] font-black uppercase tracking-widest text-white">
                  // LEGAL_DOCUMENT // PRIVACY_POLICY
                </span>
              </div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-black sm:text-3xl">
                Privacy Policy
              </h1>
              <p className="mt-1 font-mono text-xs font-semibold text-zinc-600">
                Last updated: September 2026
              </p>
            </div>

            {/* OFFICIAL AFFILIATION & PURPOSE NOTICE */}
            <div className="mb-8 border-2 border-black bg-[#FEF08A] p-4 text-black shadow-[3px_3px_0px_#000000]">
              <div className="mb-1 flex items-center gap-1.5 font-mono text-xs font-black uppercase tracking-wider text-black">
                <HiOutlineShieldCheck className="h-4 w-4 text-black" />
                <span>AWS Student Builder Group Notice</span>
              </div>
              <p className="font-mono text-[12px] font-bold leading-relaxed text-black">
                AWS STUDENT BUILDER GROUP (SBG) IS AN OFFICIAL STUDENT-LED COMMUNITY POWERED BY AND AFFILIATED WITH AMAZON WEB SERVICES (AWS).
                THIS PORTAL WAS CREATED AND MAINTAINED BY SBG STUDENT LEADERS TO MAKE IT EASIER FOR STUDENTS AND COMMUNITY MEMBERS TO ACCESS WORKSHOP LINKS, CERTIFICATION VOUCHERS, STUDY JAMS, AND CLOUD RESOURCES. WE STRICTLY DO NOT SELL PERSONAL DATA.
              </p>
            </div>

            {/* Content Sections */}
            <div className="space-y-6 text-[13.5px] leading-relaxed text-zinc-800">
              <section>
                <h2 className="mb-2 border-l-4 border-accent-purple pl-2 font-mono text-sm font-black uppercase tracking-wider text-black">
                  1. Zero Data Sale Policy
                </h2>
                <p>
                  <strong>WE DO NOT SELL, RENT, OR MONETIZE YOUR INFORMATION.</strong> We are a student-led educational
                  initiative. We have zero commercial data-sharing agreements, data brokering relationships, or tracking
                  partnerships.
                </p>
              </section>

              <section>
                <h2 className="mb-2 border-l-4 border-accent-purple pl-2 font-mono text-sm font-black uppercase tracking-wider text-black">
                  2. Information We Collect
                </h2>
                <ul className="list-disc space-y-1.5 pl-5 font-mono text-xs">
                  <li>
                    <strong>Public Visitors:</strong> Zero tracking cookies, zero marketing pixels, and zero personal analytics.
                    Visiting this site is completely anonymous.
                  </li>
                  <li>
                    <strong>Admin Users:</strong> Email address and encrypted session credentials strictly to authenticate
                    authorized community leaders who update public link cards.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="mb-2 border-l-4 border-accent-purple pl-2 font-mono text-sm font-black uppercase tracking-wider text-black">
                  3. External Third-Party Links
                </h2>
                <p>
                  This portal contains external links to third-party platforms (e.g., WhatsApp groups, Meetup events,
                  LinkedIn, AWS training portals, GitHub repositories, and YouTube). Once you leave this page, your activity
                  is governed solely by the respective privacy policies of those external services.
                </p>
              </section>

              <section>
                <h2 className="mb-2 border-l-4 border-accent-purple pl-2 font-mono text-sm font-black uppercase tracking-wider text-black">
                  4. Security &amp; Infrastructure
                </h2>
                <p>
                  Authentication and live link data are secured via Supabase using PostgreSQL Row Level Security (RLS) and
                  deployed on Cloudflare edge hosting with HTTPS encryption.
                </p>
              </section>

              <section>
                <h2 className="mb-2 border-l-4 border-accent-purple pl-2 font-mono text-sm font-black uppercase tracking-wider text-black">
                  5. Contact &amp; Inquiries
                </h2>
                <p className="font-mono text-xs">
                  For privacy questions or data inquiries, reach out to the AWS SBG leadership team at{" "}
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
