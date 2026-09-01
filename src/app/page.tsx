/**
 * Landing Page — AWS SBG @ TUT
 * Editorial bento-inspired Linktree layout (Inspired by Lovable Inkwell template)
 *
 * Page Structure (top to bottom):
 *   1. Header bar (brand strip + share action)
 *   2. Hero section (editorial typography, chip logo mark, builder pillars)
 *   3. Link list (dynamic active links from Supabase with hover sweep)
 *   4. Newsletter & Workshop Alert Box (Inkwell-inspired subscription component)
 *   5. FAQ Section (smooth accordion answering AWS & SBG questions)
 *   6. Footer bar (motto & admin shortcut)
 */

import Header from "@/components/Header";
import Hero from "@/components/Hero";
import LinkList from "@/components/LinkList";
import NewsletterBox from "@/components/NewsletterBox";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <Hero />
      <main className="flex-1">
        <LinkList />
        <NewsletterBox />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
