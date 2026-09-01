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
    process.env.NEXT_PUBLIC_SITE_URL || "https://awssbgtut.co.za"
  ),
  title: "AWS Student Builder Group — TUT",
  description:
    "Official Linktree & Hub for the AWS Student Builder Group at Tshwane University of Technology. Join our community, attend cloud workshops, prepare for AWS certifications, and build real-world cloud projects.",
  keywords: [
    "AWS",
    "AWS Student Builder Group",
    "AWS SBG",
    "AWS Cloud Club",
    "TUT",
    "Tshwane University of Technology",
    "Cloud Computing",
    "South Africa",
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
    title: "AWS Student Builder Group — TUT",
    description:
      "Official Linktree for the AWS Student Builder Group at Tshwane University of Technology. Cloud workshops, certifications, and resources.",
    type: "website",
    locale: "en_ZA",
    images: ["/logo.png"],
  },
  twitter: {
    card: "summary",
    title: "AWS Student Builder Group — TUT",
    description:
      "TUT's official student cloud community powered by Amazon Web Services.",
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
      <body className="min-h-screen bg-[#F8F9FA] text-[#0A0A0A] font-[family-name:var(--font-sans)] antialiased selection:bg-accent-purple/20 selection:text-[#0A0A0A]">
        {children}
        {/* Sonner Toast Provider */}
        <Toaster
          theme="light"
          position="bottom-center"
          richColors
          toastOptions={{
            style: {
              background: "#FFFFFF",
              border: "1px solid rgba(0, 0, 0, 0.08)",
              color: "#0A0A0A",
              borderRadius: "12px",
              boxShadow:
                "0 10px 30px -5px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)",
            },
          }}
        />
      </body>
    </html>
  );
}
