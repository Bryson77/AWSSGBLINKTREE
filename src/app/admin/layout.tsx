import { Metadata } from "next";

export const metadata: Metadata = {
  title: "awssbg Admin — Management Console",
  description: "Dedicated link and content manager for AWS Student Builder Group.",
  robots: "noindex, nofollow",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

