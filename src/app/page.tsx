/**
 * Landing Page — AWS SBG @ TUT
 *
 * Page Structure (top to bottom):
 *   1. Header bar (brand strip + share action)
 *   2. Hero section (poster-style, noise texture, builder pillars)
 *   3. Link list (centered column, active links from Supabase)
 *   4. FAQ Section (smooth accordion answering AWS & SBG questions)
 *   5. Footer bar (motto & admin shortcut)
 */

import Header from "@/components/Header";
import Hero from "@/components/Hero";
import LinkList from "@/components/LinkList";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <Hero />
      <main className="flex-1">
        <LinkList />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
