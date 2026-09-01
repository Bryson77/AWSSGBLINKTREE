import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — AWS SBG Linktree",
  robots: "noindex, nofollow",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
