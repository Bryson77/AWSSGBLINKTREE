/**
 * Landing Page — AWS Student Builder Group
 * Hardcore Neo-Brutalist Linktree layout.
 *
 * Page Structure (top to bottom):
 *   1. Header bar (0px brutalist brand strip + share action)
 *   2. Hero section (0px boxed chip logo, bold uppercase typography, builder pillars)
 *   3. Link list (0px sharp brutalist link cards with fill-slide hover sweep)
 *   4. Footer bar (0px brutalist bookend strip + admin shortcut)
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

