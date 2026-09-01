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
    process.env.NEXT_PUBLIC_SITE_URL || "https://awssbg.cloud"
  ),
  title: "AWS Student Builder Group",
  description:
    "Official Linktree & Hub for the AWS Student Builder Group. Join our student cloud community, attend hands-on workshops, prepare for AWS certifications, and build real-world projects.",
  keywords: [
    "AWS",
    "AWS Student Builder Group",
    "AWS SBG",
    "AWS Cloud Club",
    "Cloud Computing",
    "Cloud Builders",
    "AWS Certification",
  ],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/logo.png" },
    ],
    apple: "/logo.png",
  },
  openGraph: {
    title: "AWS Student Builder Group",
    description:
      "Official Linktree for the AWS Student Builder Group. Cloud workshops, certifications, and resources.",
    type: "website",
    images: ["/logo.png"],
  },
  twitter: {
    card: "summary",
    title: "AWS Student Builder Group",
    description:
      "Official student cloud community powered by Amazon Web Services.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${montserrat.variable}`}>
      <body className="min-h-screen bg-[#F4F4F5] text-black font-[family-name:var(--font-sans)] antialiased selection:bg-accent-purple selection:text-white">
        {children}
        {/* Neo-Brutalist Toaster */}
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

