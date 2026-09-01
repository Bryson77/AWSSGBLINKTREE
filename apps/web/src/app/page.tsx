/**
 * Landing Page — AWS Student Builder Group
 * Public Linktree layout (Zero admin code).
 */

import Header from "@/components/Header";
import Hero from "@/components/Hero";
import LinkList from "@/components/LinkList";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="brutal-grid-bg flex min-h-screen flex-col bg-[#F4F4F5]">
      <Header />
      <Hero />
      <main className="flex-1 pb-10">
        <LinkList />
      </main>
      <Footer />
    </div>
  );
}
