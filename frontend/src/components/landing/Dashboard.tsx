"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { RevealHeading } from "./RevealHeading";
import { SectionBackground } from "./SectionBackground";
import { Magnetic } from "./Magnetic";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

/**
 * "Your AI founding team, ready in seconds."
 *
 * A premium, theme-aware dashboard mockup that shows the actual product
 * surface — the chat prompt where you brief the CEO, live agent activity,
 * a streaming response, and a deliverables feed. Mirrors the home page's
 * Solution section but elevated to the landing's cinematic language.
 *
 * Placed immediately after the Hero so the narrative flows: product
 * promise → product surface.
 */

const POINTS = [
  {
    n: "01",
    title: "One conversation, full team",
    desc: "Brief the CEO in plain language. It plans, delegates to the right specialists, and synthesizes — no prompt engineering, no tab switching.",
  },
  {
    n: "02",
    title: "Live agent activity",
    desc: "Watch each agent pick up its task in real time. Research, writing, analysis, design — all visible as they happen.",
  },
  {
    n: "03",
    title: "Deliverables, not advice",
    desc: "Get strategies, campaigns, financial analysis, and brand assets you can ship — returned as markdown or interactive MCQ cards.",
  },
];

const FEED = [
  { agent: "CEO", action: "Decomposed objective · delegating to 3 agents", time: "now", color: "#7c8cff" },
  { agent: "Researcher", action: "Scanning 142 sources · market evidence", time: "12s", color: "#b388ff" },
  { agent: "Writer", action: "Drafting positioning narrative", time: "34s", color: "#6ee7b7" },
  { agent: "Judge", action: "Scored output 8/10 · above threshold", time: "48s", color: "#a78bfa" },
];

export function Dashboard() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".dash-point", {
        opacity: 0,
        x: -30,
        duration: 0.9,
        ease: "expo.out",
        stagger: 0.12,
        scrollTrigger: { trigger: root.current, start: "top 75%" },
      });
      gsap.from(".dash-mock", {
        opacity: 0,
        y: 60,
        scale: 0.96,
        duration: 1.2,
        ease: "expo.out",
        scrollTrigger: { trigger: root.current, start: "top 70%" },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="solution" className="relative py-32 md:py-48 overflow-hidden">
      <SectionBackground variant="default" />

      <div className="relative mx-auto max-w-7xl px-6 grid lg:grid-cols-[1fr_1.15fr] gap-16 lg:gap-20 items-center">
        {/* Left: copy + points */}
        <div>
          <div className="landing-eyebrow mb-6">The product</div>
          <RevealHeading
            text="Your AI founding team, ready in seconds."
            className="landing-display text-[clamp(2rem,4.5vw,3.75rem)]"
          />
          <p className="mt-8 max-w-md text-[var(--color-text-muted)] text-lg leading-relaxed">
            Describe your idea in plain language. The CEO orchestrator plans the
            work, delegates to specialists, and hands you back a coherent
            company brief — all from one chat.
          </p>

          <div className="mt-12 space-y-8">
            {POINTS.map((p) => (
              <div key={p.n} className="dash-point flex gap-5 items-start">
                <span className="font-mono text-xs text-[var(--color-text-dim)] mt-1">
                  {p.n}
                </span>
                <div>
                  <h3 className="text-lg font-medium tracking-tight">{p.title}</h3>
                  <p className="mt-2 text-[var(--color-text-muted)] leading-relaxed max-w-md">
                    {p.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12">
            <Magnetic strength={0.4}>
              <a href="/auth" className="btn-magnetic is-solid text-sm" data-cursor="hover">
                <span className="btn-bg" />
                <span className="btn-glow" />
                Try the dashboard
              </a>
            </Magnetic>
          </div>
        </div>

        {/* Right: dashboard mockup */}
        <div className="dash-mock">
          <DashboardMockup />
        </div>
      </div>
    </section>
  );
}

function DashboardMockup() {
  return (
    <div className="relative">
      {/* glow behind */}
      <div
        className="pointer-events-none absolute -inset-8 opacity-40 blur-3xl"
        style={{ background: "radial-gradient(60% 60% at 50% 30%, var(--color-accent-glow), transparent 70%)" }}
      />

      <div className="relative glass-strong rounded-2xl overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.4)]">
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-border-strong)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-border-strong)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-border-strong)]" />
          </div>
          <span className="flex-1 text-center font-mono text-[11px] text-[var(--color-text-dim)]">
            cofounder.ai/dashboard
          </span>
          <span className="w-[42px]" />
        </div>

        <div className="space-y-4 p-5">
          {/* Prompt bar */}
          <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
            <span className="h-4 w-4 shrink-0 rounded-full" style={{ background: "var(--color-accent)", boxShadow: "0 0 10px var(--color-accent-glow)" }} />
            <span className="flex-1 text-[13px] text-[var(--color-text-dim)]">
              Brief the CEO…
            </span>
            <span className="rounded-md px-3 py-1.5 text-[11px] font-medium text-white" style={{ background: "var(--color-accent)" }}>
              Send
            </span>
          </div>

          {/* Streaming response */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--color-accent)" }} />
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-dim)]">
                CEO · synthesizing
              </span>
            </div>
            <p className="text-[13px] leading-relaxed text-[var(--color-text)]">
              I&apos;ve delegated your brief across three agents. Research is
              mapping the market, the Writer is drafting positioning, and the
              Judge will score each output before I assemble the final brief
              <span className="caret ml-0.5" />
            </p>
          </div>

          {/* Stats — compact inline strip */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Agents", value: "7", change: "active" },
              { label: "Tasks", value: "11", change: "in flight" },
              { label: "Sources", value: "142", change: "scanned" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5">
                <div className="text-[9px] font-medium uppercase tracking-wider text-[var(--color-text-dim)]">
                  {s.label}
                </div>
                <div className="mt-0.5 text-sm font-semibold">{s.value}</div>
                <div className="text-[9px] font-medium" style={{ color: "var(--color-accent)" }}>
                  {s.change}
                </div>
              </div>
            ))}
          </div>

          {/* Activity feed */}
          <div className="divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            {FEED.map((item) => (
              <div key={item.action} className="flex items-center gap-3 px-4 py-3">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold"
                  style={{ background: `${item.color}22`, color: item.color }}
                >
                  {item.agent[0]}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12px] font-semibold">{item.agent}</div>
                  <div className="truncate text-[11px] text-[var(--color-text-muted)]">{item.action}</div>
                </div>
                <span className="shrink-0 font-mono text-[10px] text-[var(--color-text-dim)]">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
