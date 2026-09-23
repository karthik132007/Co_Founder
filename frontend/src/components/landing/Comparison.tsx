"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { RevealHeading } from "./RevealHeading";
import { SectionBackground } from "./SectionBackground";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

/**
 * "Replace a founding team."
 *
 * A cinematic comparison — not a bland table. Two facing columns: the
 * traditional founding team (dim, crossed-out, expensive) vs Co-Founder AI
 * (bright, accent, instant). Rows animate in with a divider that draws down
 * the middle. Tells the cost/speed/availability story without re-listing
 * agents (that lives in HowItThinks).
 */

const ROWS = [
  {
    label: "Cost",
    traditional: "$50K–200K+ per role, per year",
    ai: "A fraction. One subscription.",
  },
  {
    label: "Speed",
    traditional: "Months to hire & onboard",
    ai: "Ready in seconds",
  },
  {
    label: "Availability",
    traditional: "9-to-5, time zones, PTO",
    ai: "24/7, always online",
  },
  {
    label: "Tools",
    traditional: "Dozens of disconnected SaaS",
    ai: "One unified platform",
  },
  {
    label: "Coordination",
    traditional: "Meetings, docs, overhead",
    ai: "Seamless agent handoffs",
  },
  {
    label: "Memory",
    traditional: "Lost context, re-explaining",
    ai: "Shared RAG memory, forever",
  },
];

export function Comparison() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".cmp-row", {
        opacity: 0,
        y: 30,
        duration: 0.7,
        ease: "expo.out",
        stagger: 0.1,
        scrollTrigger: { trigger: root.current, start: "top 75%" },
      });
      gsap.fromTo(
        ".cmp-divider",
        { scaleY: 0 },
        {
          scaleY: 1,
          duration: 1.2,
          ease: "expo.out",
          transformOrigin: "top",
          scrollTrigger: { trigger: root.current, start: "top 70%" },
        }
      );
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="compare" className="relative py-16 sm:py-24 md:py-32 overflow-hidden" style={{ isolation: "isolate" }}>
      <div className="pointer-events-none absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-black/[0.04] to-transparent" />
      <div className="pointer-events-none absolute top-0 inset-x-0 h-[36px] md:h-[48px] bg-gradient-to-b from-[var(--color-bg)] to-transparent opacity-30" />
      <SectionBackground variant="warm" />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-6">
        <div className="mb-12 sm:mb-16 md:mb-20 max-w-3xl">
          <div className="landing-eyebrow mb-5 sm:mb-6">02 — The shift</div>
          <RevealHeading
            text="Replace a founding team."
            className="landing-display text-[clamp(2.2rem,6vw,5rem)]"
          />
          <p className="mt-6 sm:mt-8 max-w-xl text-[17px] sm:text-lg leading-relaxed text-[var(--color-text-muted)]">
            Not another hire. An entire team — strategy, research, writing,
            analysis, design, and growth — running the moment you describe your
            idea.
          </p>
        </div>

        {/* Column headers */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:mb-10 sm:gap-6 md:gap-12">
          <div className="text-left">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-dim)] sm:text-xs">
              Traditional
            </div>
            <div className="mt-1.5 text-lg font-medium text-[var(--color-text-dim)] line-through decoration-[var(--color-text-dim)]/40 sm:mt-2 sm:text-2xl md:text-3xl">
              A human team
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] sm:text-xs" style={{ color: "var(--color-accent)" }}>
              Co-Founder AI
            </div>
            <div className="mt-1.5 text-lg font-medium sm:mt-2 sm:text-2xl md:text-3xl">
              An AI team
            </div>
          </div>
        </div>

        {/* Rows */}
        <div className="relative">
          {/* center divider — desktop only; meaningless once rows stack */}
          <div
            className="cmp-divider absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 md:block"
            style={{ background: "linear-gradient(to bottom, transparent, var(--color-border-strong), transparent)" }}
          />

          {ROWS.map((r) => (
            <div
              key={r.label}
              className="cmp-row border-b border-[var(--color-border)] py-5 md:grid md:grid-cols-2 md:gap-12 md:py-6"
            >
              {/* row label — mobile only, replaces the two-column header */}
              <div className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-dim)] md:hidden">
                {r.label}
              </div>

              {/* traditional — stacked on mobile, reversed to the outer edge on md+ */}
              <div className="flex items-start gap-2.5 md:flex-row-reverse md:items-center md:justify-end md:gap-4 md:text-right">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-strong)] text-[var(--color-text-dim)] md:mt-0 md:h-6 md:w-6">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </span>
                <span className="text-[14px] leading-snug text-[var(--color-text-dim)] line-through decoration-[var(--color-text-dim)]/30 decoration-1 md:text-base">
                  {r.traditional}
                </span>
              </div>

              {/* ai */}
              <div className="mt-2 flex items-start gap-2.5 md:mt-0 md:items-center md:gap-4">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full md:mt-0 md:h-6 md:w-6" style={{ background: "var(--color-accent)" }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </span>
                <span className="text-[14px] font-medium leading-snug md:text-base">{r.ai}</span>
              </div>
            </div>
          ))}
        </div>

        {/* summary stat */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-12 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 text-center sm:mt-16"
        >
          <div>
            <div className="landing-display text-4xl md:text-5xl" style={{ color: "var(--color-accent)" }}>
              10×
            </div>
            <div className="mt-2 text-xs text-[var(--color-text-dim)] uppercase tracking-wider">
              Faster to launch
            </div>
          </div>
          <div className="hidden md:block h-12 w-px bg-[var(--color-border)]" />
          <div>
            <div className="landing-display text-4xl md:text-5xl" style={{ color: "var(--color-accent)" }}>
              1/100
            </div>
            <div className="mt-2 text-xs text-[var(--color-text-dim)] uppercase tracking-wider">
              The cost
            </div>
          </div>
          <div className="hidden md:block h-12 w-px bg-[var(--color-border)]" />
          <div>
            <div className="landing-display text-4xl md:text-5xl" style={{ color: "var(--color-accent)" }}>
              24/7
            </div>
            <div className="mt-2 text-xs text-[var(--color-text-dim)] uppercase tracking-wider">
              Always on
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
