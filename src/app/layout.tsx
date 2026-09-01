import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://awssbgtut.co.za"
  ),
  title: "AWS Student Builder Group — TUT",
  description:
    "Official Linktree for the AWS Student Builder Group at Tshwane University of Technology. Join our community, attend cloud workshops, prepare for AWS certifications, and build real-world cloud projects.",
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
    icon: "/logo.png",
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
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-white text-[#0A0A0A] font-[family-name:var(--font-sans)] antialiased selection:bg-accent-purple/20 selection:text-[#0A0A0A]">
        {children}
        {/* Sonner Toast Provider — light mode styling */}
        <Toaster
          theme="light"
          position="bottom-center"
          richColors
          toastOptions={{
            style: {
              background: "#FFFFFF",
              border: "1px solid rgba(0, 0, 0, 0.1)",
              color: "#0A0A0A",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            },
          }}
        />
      </body>
    </html>
  );
}
