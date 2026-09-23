"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  MessageCircle,
  Brain,
  Search,
  BarChart3,
  Palette,
  Sparkles,
  Copy,
} from "lucide-react";
import { SectionBackground } from "./SectionBackground";
import { RevealHeading } from "./RevealHeading";
import { HowDemo } from "./HowDemo";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

type Step = {
  id: string;
  n: string;
  eyebrow: string;
  title: string;
  titleAccent: string;
  desc: string;
  proof: string;
  accent: string;
  Icon: React.ComponentType<any>;
  chips: string[];
  workers?: { label: string; sub: string; Icon: React.ComponentType<any>; color: string }[];
};

const STEPS: Step[] = [
  {
    id: "talk",
    n: "01",
    eyebrow: "You talk",
    title: "Just say it like",
    titleAccent: "you’d to a cofounder.",
    desc: "No forms. No prompt tricks. One sentence or a dropped file is enough — it listens.",
    proof: "“Launch a D2C skincare line for men 28–35 in India”",
    accent: "#143620",
    Icon: MessageCircle,
    chips: ["Chat", "Drop files", "No setup"],
  },
  {
    id: "knows",
    n: "02",
    eyebrow: "It remembers",
    title: "It already knows",
    titleAccent: "your business.",
    desc: "Decks, sheets, past chats, your tone — kept forever. You never start from zero.",
    proof: "Never re-explain your brand again.",
    accent: "#1e4d30",
    Icon: Brain,
    chips: ["Brand tone", "Past chats", "Your files"],
  },
  {
    id: "builds",
    n: "03",
    eyebrow: "Team builds",
    title: "A whole team",
    titleAccent: "moves at once.",
    desc: "One brain plans. Three specialists build in parallel — what’s real, what your numbers say, what to ship.",
    proof: "Seconds, not weeks.",
    accent: "#2a5a3a",
    Icon: Sparkles,
    chips: [],
    workers: [
      { label: "Market", sub: "What’s really selling", Icon: Search, color: "#143620" },
      { label: "Numbers", sub: "What your data says", Icon: BarChart3, color: "#2a5a3a" },
      { label: "Create", sub: "Copy + visuals", Icon: Palette, color: "#5a7247" },
    ],
  },
  {
    id: "ship",
    n: "04",
    eyebrow: "You ship",
    title: "Get work you can",
    titleAccent: "actually ship.",
    desc: "Not advice. Ready-to-copy text, real charts, on-brand images — hit publish.",
    proof: "From idea → shippable in seconds.",
    accent: "#5a7247",
    Icon: Copy,
    chips: ["Copy-ready", "Charts", "Brand images"],
  },
];

const STATUS_LABELS = ["Listening…", "Remembering…", "Building…", "Ready to ship"];

export function HowItThinks() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<{ v: number }>({ v: 0 });
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const section = sectionRef.current;
    const pin = pinRef.current;
    if (!section || !pin) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "+=1500",
        pin,
        pinSpacing: true,
        scrub: 0.6,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          progressRef.current.v = self.progress;
          // Quantise before handing progress to React: 1/200 steps still reads as
          // smooth for the thinking bars but cuts hundreds of full re-renders.
          const step = Math.round(self.progress * 200) / 200;
          setProgress((prev) => (prev !== step ? step : prev));
          const idx = Math.min(STEPS.length - 1, Math.floor(self.progress * STEPS.length * 0.999 + 0.0001));
          setActive((prev) => (prev !== idx ? idx : prev));
          const fill = pin.querySelector<HTMLElement>(".hit-progress-fill");
          if (fill) fill.style.width = `${self.progress * 100}%`;
          const dots = pin.querySelectorAll<HTMLElement>(".hit-dot");
          dots.forEach((d, i) => {
            d.style.opacity = i <= idx ? "1" : "0.32";
            d.style.transform = i === idx ? "scale(1.35)" : "scale(1)";
          });
          const status = pin.querySelector<HTMLElement>(".hit-status-text");
          if (status) status.textContent = STATUS_LABELS[idx];
        },
      });
      // keep ScrollTrigger in sync if images/fonts shift layout
      requestAnimationFrame(() => ScrollTrigger.refresh());
    }, section);

    return () => ctx.revert();
  }, []);



  return (
    <section ref={sectionRef} id="how" className="relative w-full">
      <div className="pointer-events-none absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-black/[0.06] to-transparent z-20" />
      {/* PINNED VIEWPORT — everything that should stay in view while you scroll is INSIDE pinRef. */}
      <div
        ref={pinRef}
        className="relative flex h-[100svh] w-full flex-col overflow-hidden bg-[var(--color-bg)] will-change-transform"
        style={{ borderTop: "1px solid rgba(15,34,20,0.04)" }}
      >
        {/* pinned background — stays fixed with the content */}
        <div className="pointer-events-none absolute inset-0">
          <SectionBackground variant="cool" />
          <span
            className="glow-orb absolute"
            style={{
              left: "8%",
              top: "12%",
              width: "38vw",
              height: "38vw",
              background: "radial-gradient(circle, var(--color-accent), transparent 68%)",
              opacity: 0.07,
            }}
          />
          <span
            className="glow-orb absolute"
            style={{
              left: "62%",
              top: "48%",
              width: "34vw",
              height: "34vw",
              background: "radial-gradient(circle, var(--color-accent-2), transparent 70%)",
              opacity: 0.06,
            }}
          />
        </div>

        {/* pinned header — needs explicit top padding: the block is pinned to
            the viewport top, so the fixed nav would otherwise sit on top of it */}
        <div className="relative z-10 shrink-0 px-5 pt-[84px] sm:px-6 sm:pt-[88px] md:px-8 md:pt-[92px] lg:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-4">
              <div className="max-w-3xl">
                <div className="landing-eyebrow">01 — How it works</div>
                <RevealHeading
                  text="From idea to shippable in one chat."
                  className="landing-display mt-2.5 text-[clamp(1.75rem,7vw,3.6rem)] leading-[0.9] sm:mt-3 sm:text-[clamp(1.9rem,4.8vw,3.6rem)]"
                />
              </div>
              <p className="max-w-sm shrink-0 text-[13.5px] leading-relaxed text-[var(--color-text-muted)] md:text-right md:text-[14px]">
                Not technical. Not a demo. A real workflow — visualised — that shows a business owner{" "}
                <span className="font-medium text-[var(--color-text)]">what they get</span>, not how it’s wired.
              </p>
            </div>
          </div>
        </div>

        {/* pinned content row — the demo on the left, the four steps on the right */}
        <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-3 px-3 pb-3 pt-3 md:px-4 md:pb-4 lg:flex-row lg:items-center lg:gap-12 lg:px-6 lg:pt-6">
          {/* LEFT — the live demo. The page scroll IS the story, so this pane never
              scrolls itself: no scroll trap on touch, no wheel stealing on desktop. */}
          <div className="relative order-1 flex h-[46svh] max-h-[520px] w-full shrink-0 flex-col overflow-hidden rounded-[20px] sm:h-[50svh] sm:max-h-[560px] sm:rounded-[24px] lg:h-[64svh] lg:max-h-[580px] lg:w-[52%] lg:rounded-[28px]">
            <div className="glass-strong relative flex h-full w-full flex-1 flex-col overflow-hidden rounded-[20px] sm:rounded-[24px] lg:rounded-[28px]">
              {/* demo header */}
              <div className="flex shrink-0 items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 lg:px-4">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                </div>
                <span className="flex-1 text-center font-mono text-[10px] text-[var(--color-text-dim)] lg:text-[11px]">cofounder.ai — live demo</span>
                <span
                  className="flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-medium"
                  style={{ background: "var(--color-accent-soft)", color: "var(--color-accent)" }}
                >
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: "var(--color-accent)" }} />
                  LIVE
                </span>
              </div>

              {/* demo body — driven entirely by the page scroll progress */}
              <div className="relative flex min-h-0 flex-1 flex-col bg-[var(--color-bg-soft)]">
                <HowDemo progress={progress} />
              </div>
            </div>
          </div>

          {/* RIGHT — the four steps, lit one by one as the story advances */}
          <div className="order-2 hidden min-h-0 flex-1 flex-col justify-center lg:flex">
            <div className="mb-7 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--color-text-dim)]">
              <span className="h-px w-8 bg-[var(--color-border-strong)]" />
              Scroll to advance
            </div>

            <ol className="space-y-7 xl:space-y-9">
              {STEPS.map((s, i) => {
                const on = i === active;
                const seg = 1 / STEPS.length;
                const fill = Math.max(0, Math.min(1, (progress - i * seg) / seg)) * 100;
                return (
                  <li
                    key={s.id}
                    className="flex gap-4 transition-opacity duration-500"
                    style={{ opacity: i <= active ? 1 : 0.32 }}
                  >
                    <span
                      className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] transition-colors duration-500"
                      style={{
                        borderColor: on ? s.accent : "var(--color-border-strong)",
                        background: on ? s.accent : "transparent",
                        color: on ? "#fff" : "var(--color-text-dim)",
                      }}
                    >
                      {s.n}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-dim)]">
                        {s.eyebrow}
                      </div>
                      <h3 className="landing-display mt-1.5 text-[1.35rem] leading-tight xl:text-[1.5rem]">
                        {s.title}{" "}
                        <span style={{ color: s.accent }}>{s.titleAccent}</span>
                      </h3>
                      <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-[var(--color-text-muted)]">
                        {s.desc}
                      </p>
                      <div className="mt-3.5 h-0.5 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${fill}%`, background: s.accent }}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* MOBILE — the same story as a compact rail under the panel */}
          <div className="order-3 shrink-0 lg:hidden">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-3">
              <div className="flex items-center gap-2">
                {STEPS.map((s, i) => (
                  <span
                    key={s.id}
                    className="hit-dot h-1.5 w-1.5 rounded-full"
                    style={{
                      background: i <= active ? s.accent : "var(--color-border-strong)",
                      boxShadow: i === active ? `0 0 8px ${s.accent}` : "none",
                      opacity: i <= active ? 1 : 0.32,
                    }}
                  />
                ))}
                <span className="ml-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-dim)]">
                  Step {active + 1} — {STEPS[active].eyebrow}
                </span>
                <span className="hit-status-text ml-auto font-mono text-[10px] text-[var(--color-text-dim)]">
                  {STATUS_LABELS[0]}
                </span>
              </div>

              <p className="mt-2 text-[13px] font-medium leading-snug text-[var(--color-text)]">
                {STEPS[active].title}{" "}
                <span style={{ color: STEPS[active].accent }}>{STEPS[active].titleAccent}</span>
              </p>

              <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
                <div
                  className="hit-progress-fill h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-2)]"
                  style={{ width: "0%" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
