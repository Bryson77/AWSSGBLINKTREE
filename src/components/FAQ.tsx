"use client";

/**
 * FAQ Component — Light mode accordion.
 * Primary colors: Black & White, Accents: Purple & Blue.
 * Emil Kowalski motion: CSS Grid 0fr -> 1fr smooth transition.
 */

import { useState } from "react";
import { HiChevronDown, HiOutlineQuestionMarkCircle } from "react-icons/hi2";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    id: "what-is-aws",
    question: "What is AWS?",
    answer:
      "Amazon Web Services (AWS) is the world's leading cloud platform, providing over 200 full-featured services from data centers globally. It powers everything from scalable compute (EC2, Lambda) and databases to cutting-edge AI/ML, storage, and security infrastructure used by millions of startups and global enterprises.",
  },
  {
    id: "what-is-sbg",
    question: "What is an AWS Student Builder Group (SBG)?",
    answer:
      "AWS Student Builder Groups (formerly AWS Cloud Clubs) are official student-led university communities supported by Amazon Web Services. They bridge academic theory with real cloud engineering through hands-on labs, hackathons, study cohorts, and industry mentorship.",
  },
  {
    id: "is-this-tut-only",
    question: "Is this hub strictly for TUT?",
    answer:
      "Currently, this page is strictly dedicated to the AWS Student Builder Group at Tshwane University of Technology (TUT), rooted at the Soshanguve South Campus. More South African university SBGs will be integrated as the regional builder network continues to expand.",
  },
  {
    id: "other-south-africa-sbgs",
    question: "Which other SBGs exist in South Africa?",
    answer:
      "South Africa has a growing ecosystem of AWS student communities across universities, including chapters at the University of Pretoria (UP), University of Johannesburg (UJ), University of the Witwatersrand (Wits), University of Cape Town (UCT), Durban University of Technology (DUT), and more.",
  },
  {
    id: "certifications-and-rewards",
    question: "How do I get free AWS Skill Builder access & cert vouchers?",
    answer:
      "Through the AWS Builder Center and the AWS Student Rewards program, verified students can unlock 12 months of free AWS Skill Builder access, gamified learning with AWS Cloud Quest, and opportunities to earn exam vouchers for certifications such as the AWS Certified Cloud Practitioner.",
  },
  {
    id: "how-to-join-tut",
    question: "How do I join the TUT Chapter?",
    answer:
      "Joining is completely free. Join our WhatsApp community from the links above, RSVP on our Meetup group for upcoming Study Jams, and attend our in-person and hybrid workshops at TUT Soshanguve South.",
  },
];

export default function FAQ() {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggleItem = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="mx-auto w-full max-w-[500px] px-5 pb-12 pt-4">
      {/* Section Header */}
      <div className="mb-4 flex items-center gap-2 border-t border-black/[0.06] pt-7">
        <HiOutlineQuestionMarkCircle
          className="h-4 w-4 text-accent-purple"
          aria-hidden="true"
        />
        <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-800">
          Frequently Asked Questions
        </h2>
      </div>

      {/* Accordion Container */}
      <div className="space-y-2">
        {faqs.map((faq) => {
          const isOpen = openId === faq.id;
          return (
            <div
              key={faq.id}
              className="overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-xs transition-colors hover:border-black/20"
            >
              <button
                type="button"
                onClick={() => toggleItem(faq.id)}
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${faq.id}`}
                className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-[13.5px] font-semibold text-[#0A0A0A] transition-all active:scale-[0.99]"
              >
                <span className="leading-snug">{faq.question}</span>
                <HiChevronDown
                  className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-accent-purple" : ""
                  }`}
                  aria-hidden="true"
                />
              </button>

              {/* Grid-based height transition */}
              <div
                id={`faq-answer-${faq.id}`}
                className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
                  isOpen
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="border-t border-black/[0.04] bg-zinc-50/50 px-4 pb-3.5 pt-2.5 text-[12.5px] leading-relaxed text-zinc-600">
                    {faq.answer}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
