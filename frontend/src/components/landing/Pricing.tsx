"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { RevealHeading } from "./RevealHeading";
import { SectionBackground } from "./SectionBackground";
import { Magnetic } from "./Magnetic";
import { Tilt } from "./Tilt";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

/**
 * Pricing — two tiers: Free (3 conversations/day) and Pay-as-you-go
 * (usage-based, like OpenRouter / OpenAI — you pay for the models and
 * tokens each agent actually consumes). Cards tilt on hover and emerge
 * from depth. Placed after testimonials, before the final CTA.
 */

type Plan = {
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
};

const PLANS: Plan[] = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    tagline: "For founders exploring the system.",
    features: [
      "3 CEO conversations / day",
      "Researcher + Writer agents",
      "Shared chat memory",
      "Community support",
    ],
    cta: "Start free",
  },
  {
    name: "Pay-as-you-go",
    price: "Usage-based",
    cadence: "pay for what you use",
    tagline: "The full founding team. Billed per model & token — like OpenRouter.",
    features: [
      "All 7 agents unlocked",
      "Pay per model & token, not per conversation",
      "Effort-based model selection (flash / mid / max)",
      "RAG knowledge base + uploads",
      "e2b sandboxed analysis",
      "Judge reflection loop (max effort)",
      "Credits never expire",
      "Priority support",
    ],
    highlighted: true,
    cta: "Add credits",
  },
];

export function Pricing() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".price-card", {
        opacity: 0,
        y: 60,
        scale: 0.95,
        duration: 1,
        ease: "expo.out",
        stagger: 0.12,
        scrollTrigger: { trigger: root.current, start: "top 75%" },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="pricing" className="relative py-24 md:py-32 overflow-hidden" style={{ isolation: "isolate" }}>
      <div className="pointer-events-none absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-black/[0.04] to-transparent" />
      <div className="pointer-events-none absolute top-0 inset-x-0 h-[36px] md:h-[48px] bg-gradient-to-b from-[var(--color-bg)] to-transparent opacity-30" />
      <SectionBackground variant="cool" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mb-20 max-w-3xl">
          <div className="landing-eyebrow mb-6">06 — Access</div>
          <RevealHeading
            text="Two ways in."
            className="landing-display text-[clamp(2.2rem,6vw,5rem)]"
          />
          <p className="mt-8 max-w-xl text-[var(--color-text-muted)] text-lg leading-relaxed">
            Start free with 3 conversations a day. When you need the full
            team, pay only for the models and tokens each agent actually uses
            — the same transparent pricing as OpenRouter and OpenAI.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 items-stretch max-w-4xl mx-auto">
          {PLANS.map((p) => (
            <Tilt key={p.name} max={5} className="price-card">
              <article
                className={`relative h-full overflow-hidden rounded-3xl p-8 md:p-10 flex flex-col ${
                  p.highlighted ? "glass-strong" : "glass"
                }`}
                data-cursor="hover"
              >
                {/* highlighted glow */}
                {p.highlighted && (
                  <>
                    <div
                      className="pointer-events-none absolute -inset-px rounded-3xl opacity-60"
                      style={{
                        background:
                          "linear-gradient(180deg, var(--color-accent-glow), transparent 60%)",
                      }}
                    />
                    <div
                      className="pointer-events-none absolute inset-0 rounded-3xl"
                      style={{ border: "1px solid var(--color-accent)" }}
                    />
                    <span
                      className="absolute top-6 right-6 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white"
                      style={{ background: "var(--color-accent)" }}
                    >
                      Most popular
                    </span>
                  </>
                )}

                <div className="relative">
                  <h3 className="text-lg font-medium tracking-tight">{p.name}</h3>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    {p.tagline}
                  </p>

                  <div className="mt-8 flex items-baseline gap-1">
                    <span className="landing-display text-5xl md:text-6xl">
                      {p.price}
                    </span>
                    {p.cadence && (
                      <span className="text-sm text-[var(--color-text-dim)]">
                        {p.cadence}
                      </span>
                    )}
                  </div>
                </div>

                <ul className="relative mt-8 space-y-3 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm">
                      <span
                        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                        style={{ background: "var(--color-accent)" }}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </span>
                      <span className="text-[var(--color-text-muted)]">{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="relative mt-10">
                  <Magnetic strength={0.4}>
                    <a
                      href="/auth"
                      className={`btn-magnetic w-full text-sm ${p.highlighted ? "is-solid" : "is-ghost"}`}
                      data-cursor="hover"
                    >
                      <span className="btn-bg" />
                      <span className="btn-glow" />
                      {p.cta}
                    </a>
                  </Magnetic>
                </div>
              </article>
            </Tilt>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 text-center text-sm text-[var(--color-text-dim)]"
        >
          Both tiers include the CEO orchestrator, shared memory, and MCQ
          clarifications. No credit card required to start.
        </motion.p>
      </div>
    </section>
  );
}
