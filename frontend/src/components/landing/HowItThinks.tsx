"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import {
  MessageCircle,
  Brain,
  Search,
  BarChart3,
  Palette,
  Sparkles,
  ArrowRight,
  ArrowDown,
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
        end: "+=2000",
        pin,
        pinSpacing: true,
        scrub: 0.8,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          progressRef.current.v = self.progress;
          setProgress(self.progress);
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

        {/* pinned header */}
        <div className="relative z-10 shrink-0 px-6 pt-8 md:px-8 md:pt-10 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl">
                <div className="landing-eyebrow">01 — How it works</div>
                <RevealHeading
                  text="From idea to shippable in one chat."
                  className="landing-display mt-3 text-[clamp(1.9rem,4.8vw,3.6rem)] leading-[0.9]"
                />
              </div>
              <p className="max-w-sm shrink-0 text-sm leading-relaxed text-[var(--color-text-muted)] md:text-right md:text-[14px]">
                Not technical. Not a demo. A real workflow — visualised — that shows a business owner{" "}
                <span className="font-medium text-[var(--color-text)]">what they get</span>, not how it’s wired.
              </p>
            </div>
          </div>
        </div>

        {/* pinned content row — left demo + minimal right — centered, left moved right for balance */}
        <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col overflow-hidden px-3 pb-3 pt-4 md:px-4 md:pb-4 lg:flex-row lg:gap-8 lg:px-6 lg:pt-6">
          {/* LEFT — coded SaaS demo — hover here scrolls chat, outside scrolls page */}
          <div
            className="relative order-1 flex h-[52svh] max-h-[560px] w-full shrink-0 flex-col overflow-hidden rounded-[24px] lg:ml-8 lg:h-auto lg:max-h-none lg:w-[46%] lg:rounded-[28px]"
            onWheel={(e) => {
              const el = document.querySelector("[data-howdemo-scroll]") as HTMLElement | null;
              if (!el) return;
              const canScrollUp = el.scrollTop > 0;
              const canScrollDown = el.scrollTop + el.clientHeight < el.scrollHeight - 1;
              const goingUp = (e as unknown as WheelEvent).deltaY < 0;
              const goingDown = (e as unknown as WheelEvent).deltaY > 0;
              const canScroll = (goingUp && canScrollUp) || (goingDown && canScrollDown);
              if (!canScroll) return; // at edge → let page scroll (don't block)
              // chat can scroll → block page scroll, let chat handle
              e.stopPropagation();
              const inside = el.contains(e.target as Node);
              if (!inside) {
                // header/overlay area: manually drive chat scroll
                e.preventDefault();
                el.scrollTop += (e as unknown as WheelEvent).deltaY;
              }
            }}
          >
            <div className="glass-strong relative flex h-full w-full flex-1 flex-col overflow-hidden rounded-[24px] lg:rounded-[28px]">
              {/* demo header */}
              <div className="flex shrink-0 items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 lg:px-4">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                </div>
                <span className="flex-1 text-center font-mono text-[10px] text-[var(--color-text-dim)] lg:text-[11px]">cofounder.ai — live demo</span>
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-medium text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  LIVE
                </span>
              </div>

              {/* demo body — coordinated with scroll */}
              <div className="relative flex min-h-0 flex-1 flex-col bg-[var(--color-bg-soft)]">
                <HowDemo progress={progress} />
              </div>

              {/* scroll progress (kept) */}
              <div className="pointer-events-none absolute bottom-3 left-3 right-3 lg:bottom-4 lg:left-4 lg:right-4">
                <div className="glass rounded-2xl px-3 py-2.5 lg:px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {STEPS.map((s, i) => (
                        <span
                          key={s.id}
                          className="hit-dot h-1.5 w-1.5 rounded-full transition-all duration-500 lg:h-1.5 lg:w-1.5"
                          style={{
                            background: i <= active ? s.accent : "var(--color-border-strong)",
                            boxShadow: i === active ? `0 0 8px ${s.accent}` : "none",
                            opacity: i <= active ? 1 : 0.32,
                          }}
                        />
                      ))}
                      <span className="ml-2 hidden font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-dim)] sm:inline">
                        Scroll — story on right
                      </span>
                    </div>
                    <span className="hit-status-text hidden font-mono text-[10px] text-[var(--color-text-dim)] lg:inline">{STATUS_LABELS[0]}</span>
                  </div>
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
                    <div className="hit-progress-fill h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-2)]" style={{ width: "0%" }} />
                  </div>
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[var(--color-text)] px-3 py-1 text-[10px] font-medium tracking-wide text-white lg:hidden">
              <span>Scroll</span>
              <ArrowRight className="h-3 w-3 animate-pulse" />
            </div>
          </div>

          {/* RIGHT — minimal: only progressive down arrow */}
          <div className="order-2 hidden min-h-0 flex-1 flex-col items-center justify-center px-8 py-10 lg:flex lg:px-12">
            <div className="flex flex-col items-center gap-8">
              <span className="font-mono text-[10px] tracking-[0.32em] text-[var(--color-text-dim)]">SCROLL</span>
              <div className="relative flex h-32 w-px justify-center overflow-hidden bg-[var(--color-border)] lg:h-40">
                <motion.div className="absolute top-0 w-full bg-[var(--color-text)]" style={{ height: `${progress * 100}%` }} transition={{ duration: 0.1, ease: "linear" }} />
              </div>
              <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]">
                <ArrowDown className="h-4 w-4 text-[var(--color-text-dim)]" strokeWidth={1.6} />
              </motion.div>
              <span className="font-mono text-[10px] tracking-wide text-[var(--color-text-dim)]">{Math.round(progress * 100)}%</span>
            </div>
          </div>
          {/* mobile down arrow */}
          <div className="flex order-2 flex-col items-center justify-center gap-3 py-6 lg:hidden">
            <span className="font-mono text-[10px] tracking-[0.32em] text-[var(--color-text-dim)]">SCROLL</span>
            <ArrowDown className="h-4 w-4 text-[var(--color-text-dim)] animate-bounce" strokeWidth={1.6} />
          </div>
        </div>
      </div>
    </section>
  );
}
