"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { RevealHeading } from "./RevealHeading";
import { SectionBackground } from "./SectionBackground";
import { Magnetic } from "./Magnetic";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

/**
 * "The product" — the workspace itself.
 *
 * Deliberately NOT a fake chat with a blinking cursor and invented metrics that
 * kind of thing reads as a generic AI demo. This shows the real surface of the
 * product: the roster of specialists on the left, the brief → CEO plan → signed
 * off deliverable in the middle, and a status bar of what every account gets.
 * Copy and agent names come from the product description — do not invent agents.
 */

const TEAM = [
  { name: "CEO Orchestrator", role: "Plans, routes, reconciles", active: true },
  { name: "Researcher", role: "Market & evidence" },
  { name: "Writer", role: "Narrative & copy" },
  { name: "CMO Marketing", role: "Campaigns & growth" },
  { name: "Data Analyst", role: "Sandboxed maths" },
  { name: "Graphic Designer", role: "Brand assets" },
  { name: "Judge", role: "Scores every output" },
];

const PLAN = [
  { agent: "Researcher", task: "Map the category and the three closest competitors" },
  { agent: "Data Analyst", task: "Size the prize from your pricing and margin sheet" },
  { agent: "Writer", task: "Draft the positioning and the launch narrative" },
];

const DELIVERABLE = [
  "Positioning & price ladder",
  "Launch campaign + 14-day calendar",
  "Packaging direction & palette",
];

const POINTS = [
  {
    title: "Seven specialists, one orchestrator",
    desc: "The CEO plans the work and hands each task to the agent that owns it — research, writing, growth, numbers, design — then reconciles it into one answer.",
  },
  {
    title: "One memory across the whole team",
    desc: "Files, decks, past sessions and your brand tone sit in a single retrieval layer, so nothing you have already explained is ever asked again.",
  },
  {
    title: "Output you can act on",
    desc: "Briefs, campaign plans, financial analysis and brand assets — export-ready work, not a wall of chat.",
  },
];

export function ProductSection() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".prod-copy > *", {
        opacity: 0,
        y: 24,
        duration: 0.8,
        ease: "expo.out",
        stagger: 0.08,
        scrollTrigger: { trigger: root.current, start: "top 72%" },
      });
      gsap.from(".prod-frame", {
        opacity: 0,
        y: 48,
        duration: 1.1,
        ease: "expo.out",
        scrollTrigger: { trigger: root.current, start: "top 68%" },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      id="solution"
      className="relative py-16 sm:py-24 md:py-32 overflow-hidden"
      style={{ isolation: "isolate" }}
    >
      <div className="pointer-events-none absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-black/[0.04] to-transparent" />
      <SectionBackground variant="default" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6">
        <div className="grid grid-cols-1 items-center gap-12 sm:gap-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          {/* ── copy ── */}
          <div className="prod-copy min-w-0">
            <div className="landing-eyebrow mb-5 sm:mb-6">The product</div>

            <RevealHeading
              text="One workspace. The entire company."
              className="landing-display text-[clamp(2rem,5vw,3.6rem)]"
            />

            <p className="mt-6 max-w-lg text-[17px] sm:text-lg leading-relaxed text-[var(--color-text-muted)]">
              You brief once. Seven specialists go to work. The CEO orchestrator
              plans every task, routes it to the right agent, and nothing reaches
              you until the Judge has signed it off.
            </p>

            <ul className="mt-9 space-y-6">
              {POINTS.map((p) => (
                <li key={p.title} className="flex gap-3.5">
                  <span
                    className="mt-1 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full p-0.5"
                    style={{ background: "var(--color-accent)" }}
                  >
                    <Check className="h-2.5 w-2.5 text-white" strokeWidth={3.5} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-semibold tracking-[-0.01em]">{p.title}</h3>
                    <p className="mt-1.5 text-[14.5px] leading-relaxed text-[var(--color-text-muted)]">
                      {p.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Magnetic strength={0.35}>
                <Link href="/auth" className="btn-magnetic is-solid text-sm" data-cursor="hover">
                  <span className="btn-bg" />
                  <span className="btn-glow" />
                  Open the workspace
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Magnetic>
              <Link
                href="/demo"
                className="link-underline text-[14px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                data-cursor="hover"
              >
                See a live session
              </Link>
            </div>
          </div>

          {/* ── the workspace ── */}
          <div className="prod-frame min-w-0">
            <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] shadow-[0_40px_90px_-40px_rgba(15,34,20,0.45)]">
              {/* window chrome */}
              <div className="flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5">
                <div className="flex shrink-0 gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-border-strong)]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-border-strong)]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-border-strong)]" />
                </div>
                <span className="mx-auto truncate font-mono text-[10.5px] text-[var(--color-text-dim)]">
                  cofounder.ai / workspace
                </span>
                <span className="hidden shrink-0 rounded-full px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] sm:inline" style={{ background: "var(--color-accent-soft)", color: "var(--color-accent)" }}>
                  Live
                </span>
              </div>

              <div className="flex min-h-[350px] sm:min-h-[420px]">
                {/* roster */}
                <aside className="hidden w-[172px] shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] p-3 md:block">
                  <div className="mb-3 font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--color-text-dim)]">
                    Your team
                  </div>
                  <ul className="space-y-0.5">
                    {TEAM.map((a) => (
                      <li
                        key={a.name}
                        className="flex items-center gap-2 rounded-lg px-2 py-1.5"
                        style={a.active ? { background: "var(--color-surface-strong)" } : undefined}
                      >
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: a.active ? "var(--color-accent)" : "var(--color-border-strong)" }}
                        />
                        <div className="min-w-0">
                          <div className="truncate text-[11.5px] font-medium tracking-[-0.01em]">{a.name}</div>
                          <div className="truncate text-[9.5px] text-[var(--color-text-dim)]">{a.role}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </aside>

                {/* thread */}
                <div className="min-w-0 flex-1 p-3.5 sm:p-4">
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5">
                    <div className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-[var(--color-text-dim)]">
                      Brief
                    </div>
                    <p className="mt-1.5 text-[13.5px] font-medium leading-snug">
                      Launch a D2C skincare line for men 28–35 in India.
                    </p>
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 flex items-center gap-2.5">
                      <span className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-[var(--color-text-dim)]">
                        CEO plan
                      </span>
                      <span className="h-px flex-1 bg-[var(--color-border)]" />
                      <span className="font-mono text-[9.5px]" style={{ color: "var(--color-accent)" }}>
                        3 routed
                      </span>
                    </div>
                    <ul className="space-y-1.5">
                      {PLAN.map((t) => (
                        <li
                          key={t.task}
                          className="flex items-start gap-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-3 py-2"
                        >
                          <span
                            className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                            style={{ background: "var(--color-accent)" }}
                          >
                            <Check className="h-2.5 w-2.5 text-white" strokeWidth={3.5} />
                          </span>
                          <div className="min-w-0">
                            <div className="text-[11px] font-semibold tracking-[-0.01em]">{t.agent}</div>
                            <div className="text-[11px] leading-snug text-[var(--color-text-muted)]">{t.task}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* deliverable */}
                  <div
                    className="mt-4 rounded-xl border p-3.5"
                    style={{
                      borderColor: "var(--color-border-strong)",
                      background: "var(--color-surface-strong)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-[var(--color-text-dim)]">
                        Deliverable
                      </span>
                      <span
                        className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-semibold"
                        style={{ background: "var(--color-accent-soft)", color: "var(--color-accent)" }}
                      >
                        <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                        Judge-checked
                      </span>
                    </div>

                    <div className="mt-2 text-[13px] font-semibold tracking-[-0.01em]">
                      India men&apos;s skincare — go-to-market brief
                    </div>

                    <ul className="mt-2.5 space-y-1.5">
                      {DELIVERABLE.map((d) => (
                        <li key={d} className="flex items-center gap-2 text-[11.5px] text-[var(--color-text-muted)]">
                          <span className="h-1 w-1 shrink-0 rounded-full" style={{ background: "var(--color-accent)" }} />
                          {d}
                        </li>
                      ))}
                    </ul>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {["brief.md", "pricing.csv", "hero.png"].map((f) => (
                        <span
                          key={f}
                          className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-2 py-0.5 font-mono text-[10px] text-[var(--color-text-muted)]"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* status bar */}
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-[var(--color-text-dim)]">
                <span>7 specialist agents</span>
                <span aria-hidden className="opacity-40">/</span>
                <span>1 shared memory</span>
                <span aria-hidden className="opacity-40">/</span>
                <span>every output Judge-checked</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
