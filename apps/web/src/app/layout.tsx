import type { Metadata } from "next";
import { Montserrat, Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-heading",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://awssbg.online"
  ),
  title: {
    default: "AWS Student Builder Group — Official Student Cloud Community",
    template: "%s | AWS Student Builder Group",
  },
  description:
    "A student-led cloud computing community, supported by AWS, active in 60+ countries. Connect with student builders, attend hands-on AWS Study Jams, prepare for AWS certifications, and build real cloud projects.",
  keywords: [
    "AWS Student Builder Group",
    "AWS SBG",
    "Amazon Web Services Student Community",
    "AWS Study Jams",
    "AWS Certified Cloud Practitioner",
    "AWS Solutions Architect Associate",
    "Cloud Computing for Students",
    "AWS Builder Center",
    "Student Cloud Club",
    "AWS Certification Vouchers",
  ],
  authors: [{ name: "AWS Student Builder Group" }],
  creator: "AWS Student Builder Group",
  publisher: "AWS Student Builder Group",
  alternates: {
    canonical: "https://awssbg.online",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/logo.png" },
    ],
    apple: "/logo.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://awssbg.online",
    siteName: "AWS Student Builder Group",
    title: "AWS Student Builder Group — Official Student Cloud Community",
    description:
      "Official community hub for AWS Student Builder Group (AWS SBG). Hands-on AWS Study Jams, certification exam prep, and cloud builder resources.",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "AWS Student Builder Group Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AWS Student Builder Group — Official Student Cloud Community",
    description:
      "Official global student cloud community powered by Amazon Web Services (AWS).",
    images: ["/logo.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "EducationalOrganization",
      "@id": "https://awssbg.online/#organization",
      "name": "AWS Student Builder Group",
      "alternateName": [
        "AWS SBG",
        "Amazon Web Services Student Builder Group",
        "AWS Student Builders",
      ],
      "url": "https://awssbg.online",
      "logo": "https://awssbg.online/logo.png",
      "description":
        "Official global student-led cloud computing community powered by Amazon Web Services (AWS). Hosting AWS Study Jams, cloud certification prep, hackathons, and builder workshops across 60+ countries.",
      "parentOrganization": {
        "@type": "Organization",
        "name": "Amazon Web Services",
        "url": "https://aws.amazon.com",
      },
      "sameAs": [
        "https://aws.amazon.com/developer/community/students/",
        "https://builder.aws.com/",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://awssbg.online/#website",
      "url": "https://awssbg.online",
      "name": "AWS Student Builder Group Community Hub",
      "publisher": {
        "@id": "https://awssbg.online/#organization",
      },
    },
    {
      "@type": "FAQPage",
      "@id": "https://awssbg.online/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is the AWS Student Builder Group (AWS SBG)?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The AWS Student Builder Group (AWS SBG) is an official student-led community program powered by and affiliated with Amazon Web Services (AWS). It operates across universities in over 60 countries to help students learn cloud computing, collaborate on real-world projects, and prepare for industry certifications.",
          },
        },
        {
          "@type": "Question",
          "name": "How do students join AWS SBG activities and Study Jams?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Students can join the official community by accessing the workshop links, WhatsApp/LinkedIn community groups, and AWS Builder Center links hosted on the official hub at https://awssbg.online.",
          },
        },
        {
          "@type": "Question",
          "name": "What certifications does AWS SBG help students prepare for?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "AWS SBG hosts structured bootcamps and study groups for AWS Certified Cloud Practitioner, AWS Certified Solutions Architect Associate, and AWS Certified Developer certifications.",
          },
        },
        {
          "@type": "Question",
          "name": "How do students get AWS certification exam vouchers?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Certification vouchers come through AWS Builder Center's Student Rewards program, not through this chapter directly. Verify your student status on AWS Builder Center to unlock up to $579 in resources — including AWS credits, 12 months of premium Skill Builder access, and a certification exam voucher. Attending our Study Jams and labs is the best way to prep for the exam once you're verified.",
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${montserrat.variable}`}>
      <head>
        <link rel="help" href="/llms.txt" title="LLMs Context" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-[#F4F4F5] text-black font-[family-name:var(--font-sans)] antialiased selection:bg-accent-purple selection:text-white">
        {children}
        <Toaster
          theme="light"
          position="bottom-center"
          richColors
          toastOptions={{
            style: {
              background: "#FFFFFF",
              border: "3px solid #000000",
              color: "#000000",
              borderRadius: "0px",
              boxShadow: "4px 4px 0px #000000",
              fontFamily: "ui-monospace, monospace",
              fontWeight: 700,
            },
          }}
        />
      </body>
    </html>
  );
}
