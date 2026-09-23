"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { RevealHeading } from "./RevealHeading";
import { SectionBackground } from "./SectionBackground";
import { Magnetic } from "./Magnetic";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

/**
 * Pricing — one product, no tiers, presented as a single table.
 *
 * Every account gets the whole product from the first second: all 7 agents,
 * every integration, the full memory stack. The only thing that changes is how
 * you pay, so the table splits into two STAGES rather than two plans:
 *
 *   1. you sign up and get 50 free credits;
 *   2. once they run out you top up and pay per model & token.
 *
 * Feature rows therefore span both stage columns — there are no feature gates.
 */

type Row =
  | { label: string; kind: "check" } // included for everyone, at both stages
  | { label: string; kind: "note"; note: string } // same answer at both stages
  | { label: string; kind: "split"; start: string; payg: string }; // stage-specific

const ROWS: Row[] = [
  { label: "All 7 specialised AI agents", kind: "check" },
  {
    label: "Every active integration (Instagram, Google, Ads, Sheets, Shopify…)",
    kind: "check",
  },
  { label: "Sandboxed analysis (e2b) + RAG knowledge base", kind: "check" },
  { label: "Shared company memory & reflection loops", kind: "check" },
  { label: "Effort-based model selection (flash / mid / max)", kind: "check" },
  {
    label: "Feature gates",
    kind: "note",
    note: "None — free-credit and recharged accounts run the identical product",
  },
  {
    label: "What you pay",
    kind: "split",
    start: "Nothing — the first 50 credits are free",
    payg: "Only the models & tokens your agents consume",
  },
  {
    label: "Recharging",
    kind: "split",
    start: "Not needed yet",
    payg: "Top up any time via Razorpay & cards",
  },
  { label: "Credits expire", kind: "split", start: "Never", payg: "Never" },
  {
    label: "Credit card to get started",
    kind: "split",
    start: "Not required",
    payg: "Not required",
  },
];

function Tick() {
  return (
    <span
      className="inline-flex h-5 w-5 items-center justify-center rounded-full"
      style={{ background: "var(--color-accent)" }}
      title="Included"
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M20 6L9 17l-5-5" />
      </svg>
      <span className="sr-only">Included</span>
    </span>
  );
}

export function Pricing() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".price-head", {
        opacity: 0,
        y: 40,
        duration: 1,
        ease: "expo.out",
        scrollTrigger: { trigger: root.current, start: "top 78%" },
      });
      // rows animate on opacity only — transform on <tr> is unreliable across engines
      gsap.from(".price-row", {
        opacity: 0,
        duration: 0.5,
        ease: "power2.out",
        stagger: 0.05,
        scrollTrigger: { trigger: ".price-table", start: "top 80%" },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="pricing" className="relative py-16 sm:py-24 md:py-32 overflow-hidden" style={{ isolation: "isolate" }}>
      <div className="pointer-events-none absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-black/[0.04] to-transparent" />
      <div className="pointer-events-none absolute top-0 inset-x-0 h-[36px] md:h-[48px] bg-gradient-to-b from-[var(--color-bg)] to-transparent opacity-30" />
      <SectionBackground variant="cool" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6">
        <div className="mb-12 sm:mb-16 md:mb-20 max-w-3xl">
          <div className="landing-eyebrow mb-5 sm:mb-6">06 — Pricing & Access</div>
          <RevealHeading
            text="All benefits unlocked. Zero barrier."
            className="landing-display text-[clamp(2.2rem,6vw,5rem)]"
          />
          <p className="mt-6 sm:mt-8 max-w-2xl text-[17px] sm:text-lg leading-relaxed text-[var(--color-text-muted)]">
            There is no paid tier to upgrade to. Every account runs the exact same product — all 7 agents, every integration, the full memory stack. You start with <strong className="text-[var(--color-text)]">50 free credits</strong> on the house, and once they run out you top up and pay only for the models and tokens your agents actually use.
          </p>
        </div>

        <p className="mx-auto mb-4 max-w-5xl text-center font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-dim)] sm:mb-5 sm:text-[11px]">
          One product · no tiers · same features either way
        </p>

        {/* One table, no cards */}
        <div className="price-table price-head relative mx-auto max-w-5xl overflow-hidden rounded-3xl glass-strong">
          {/* the pay-as-you-go column reads as the highlighted one */}
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-[32%]"
            style={{ background: "var(--color-col-highlight)" }}
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-[32%] border-l"
            style={{ borderColor: "var(--color-border-strong)" }}
          />

          <table className="relative w-full table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-[36%] sm:w-[34%]" />
              <col className="w-[32%]" />
              <col className="w-[32%]" />
            </colgroup>

            <thead>
              <tr>
                <th scope="col" className="p-3 align-bottom sm:p-6 md:p-8">
                  <span className="sr-only">Plan comparison</span>
                </th>

                {/* Stage 1 — what you get on signup */}
                <th scope="col" className="p-3 align-bottom sm:p-6 md:p-8">
                  <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-text-dim)] sm:text-[10px]">
                    On signup
                  </div>
                  <div className="landing-display mt-1.5 text-[1.7rem] leading-none sm:mt-2 sm:text-4xl">
                    Free
                  </div>
                  <div className="mt-1.5 text-[10.5px] leading-snug text-[var(--color-text-dim)] sm:text-xs">
                    50 credits on the house, no card needed
                  </div>
                </th>

                {/* Stage 2 — once those run out */}
                <th scope="col" className="p-3 align-bottom sm:p-6 md:p-8">
                  <div
                    className="font-mono text-[9px] uppercase tracking-[0.18em] sm:text-[10px]"
                    style={{ color: "var(--color-accent)" }}
                  >
                    After that
                  </div>
                  <div className="landing-display mt-1.5 text-[1.7rem] leading-none sm:mt-2 sm:text-4xl">
                    Usage-based
                  </div>
                  <div className="mt-1.5 text-[10.5px] leading-snug text-[var(--color-text-dim)] sm:text-xs">
                    top up, then pay per model &amp; token
                  </div>
                </th>
              </tr>
            </thead>

            <tbody>
              {ROWS.map((r) => (
                <tr key={r.label} className="price-row border-t border-[var(--color-border)]">
                  <th
                    scope="row"
                    className="p-3 text-left align-top text-[11.5px] font-normal leading-snug text-[var(--color-text-muted)] sm:p-4 sm:text-sm md:px-8"
                  >
                    {r.label}
                  </th>

                  {/* included for everyone, whichever stage you're at */}
                  {r.kind === "check" && (
                    <td colSpan={2} className="p-3 align-top sm:p-4">
                      <Tick />
                    </td>
                  )}

                  {r.kind === "note" && (
                    <td
                      colSpan={2}
                      className="p-3 align-top text-[11.5px] leading-snug text-[var(--color-text-muted)] sm:p-4 sm:text-sm"
                    >
                      {r.note}
                    </td>
                  )}

                  {/* the only rows where the two stages differ */}
                  {r.kind === "split" && (
                    <>
                      <td className="p-3 align-top text-[11.5px] leading-snug text-[var(--color-text-muted)] sm:p-4 sm:text-sm">
                        {r.start}
                      </td>
                      <td className="p-3 align-top text-[11.5px] font-medium leading-snug text-[var(--color-text)] sm:p-4 sm:text-sm">
                        {r.payg}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>

            <tfoot>
              <tr className="border-t border-[var(--color-border)]">
                <td className="p-3 sm:p-6 md:px-8" />
                <td colSpan={2} className="p-3 sm:p-6">
                  <Magnetic strength={0.3}>
                    <a
                      href="/auth"
                      className="btn-magnetic is-solid w-full text-[13px] sm:text-sm"
                      data-cursor="hover"
                    >
                      <span className="btn-bg" />
                      <span className="btn-glow" />
                      Get 50 free credits
                    </a>
                  </Magnetic>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 text-center text-[13px] text-[var(--color-text-dim)] sm:mt-12 sm:text-sm"
        >
          All accounts get full access to the CEO orchestrator, all specialized agents, integrations, and shared memory. Start building immediately with 50 free credits — no credit card required.
        </motion.p>
      </div>
    </section>
  );
}
