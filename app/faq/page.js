"use client";
import { useState } from "react";
import Navbar from "@/app/components/Navbar";

const FAQS = [
  {
    q: "Where is OKMADE located?",
    a: "We are based in Aba, Abia State, Nigeria. We work locally, nationally, and internationally — we've completed projects across multiple states and ship furniture worldwide.",
  },
  {
    q: "What services do you offer?",
    a: "Custom furniture design and build, full interior fit-outs, woodwork and joinery, commercial space renovation (hotels, churches, offices, restaurants), and furniture repair and restoration.",
  },
  {
    q: "How do I request a quote?",
    a: "Contact us via WhatsApp (09161919164), call 09166300206 or 07049264672, or email okeywoodwork@gmail.com. Send photos and measurements for a faster estimate.",
  },
  {
    q: "How long does a custom project take?",
    a: "It depends on the size and complexity. A single furniture piece typically takes 2–4 weeks. Full interior fit-outs can take 6–12 weeks. We confirm the timeline in writing before starting.",
  },
  {
    q: "Do you ship internationally?",
    a: "Yes. We arrange shipping and crating for international orders. Shipping costs and timelines are quoted per order.",
  },
  {
    q: "What payment methods do you accept?",
    a: "Bank transfer, cash, and mobile payments. Custom projects usually require a 50% deposit before work begins and the balance on delivery.",
  },
  {
    q: "Can I see past projects?",
    a: "Yes — visit our Portfolio page to see completed work with photos, project details, and client info where shared.",
  },
  {
    q: "Do you repair old furniture?",
    a: "Absolutely. We restore antique pieces, fix broken frames, replace upholstery, and refinish wood. Send photos for an assessment.",
  },
  {
    q: "Do you offer warranty on your work?",
    a: "Yes. All new furniture comes with a 1-year workmanship warranty. Repairs are guaranteed for 90 days. Warranty does not cover damage from misuse or normal wear.",
  },
  {
    q: "How do I track my project?",
    a: "When you place a custom order, we send you a private token. Enter it on our homepage to see progress photos, milestones, and updates in real time.",
  },
  {
    q: "Can I visit your workshop?",
    a: "Yes, by appointment. Contact us first so we can arrange a time that works.",
  },
  {
    q: "How do I delete my account?",
    a: "Log in, go to Settings → Danger Zone → Request Account Deletion. Your account is scheduled for deletion in 7 days. You can cancel anytime by clicking the link we email you.",
  },
];

export default function FAQPage() {
  const [open, setOpen] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white dark:from-gray-950 dark:to-gray-900 pt-16">
      <Navbar />
      <div className="container mx-auto px-4 md:px-6 py-12 max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-bold text-amber-800 dark:text-amber-400 mb-3 font-['Dancing_Script',_cursive] text-center">
          Frequently Asked Questions
        </h1>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-10">
          Answers to the questions we hear most often.
        </p>

        <div className="space-y-3">
          {FAQS.map((item, idx) => {
            const isOpen = open === idx;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
              >
                <button
                  onClick={() => setOpen(isOpen ? null : idx)}
                  className="w-full text-left px-5 py-4 flex justify-between items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                >
                  <span className="font-semibold text-gray-800 dark:text-gray-100">
                    {item.q}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-gray-600 dark:text-gray-400 text-sm leading-relaxed border-t border-gray-100 dark:border-gray-800 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12 p-6 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl text-center">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Still have a question?
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            We're always happy to hear from you.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a
              href="https://wa.me/2349161919164"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-full font-semibold text-sm transition"
            >
              WhatsApp Us
            </a>
            <a
              href="/#contact"
              className="bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 px-5 py-2.5 rounded-full font-semibold text-sm border border-gray-200 dark:border-gray-700 transition"
            >
              Contact Form
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
