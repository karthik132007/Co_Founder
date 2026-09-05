"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BarChart3, Check, Palette, Sparkles } from "lucide-react";
import { SectionBackground } from "./SectionBackground";
import { RevealHeading } from "./RevealHeading";
import { HowDemo } from "./HowDemo";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  { label: "Understand", description: "You ask in plain language", icon: Sparkles },
  { label: "Analyze", description: "The right specialist finds the signal", icon: BarChart3 },
  { label: "Create", description: "Your team turns insight into an asset", icon: Palette },
  { label: "Ship", description: "Review once, then publish", icon: Check },
];

export function HowItThinks() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const active = Math.min(STEPS.length - 1, Math.floor(progress * STEPS.length));

  useEffect(() => {
    const section = sectionRef.current;
    const pin = pinRef.current;
    if (!section || !pin || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section, start: "top top", end: "+=2200", pin, pinSpacing: true, scrub: 0.65, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: (self) => setProgress(self.progress),
      });
      requestAnimationFrame(() => ScrollTrigger.refresh());
    }, section);
    return () => ctx.revert();
  }, []);

  return <section ref={sectionRef} id="how" className="relative w-full">
    <div ref={pinRef} className="relative flex h-[100svh] w-full flex-col overflow-hidden border-y border-[var(--color-border)] bg-[var(--color-bg)]">
      <div className="pointer-events-none absolute inset-0 opacity-60"><SectionBackground variant="cool" /></div>
      <div className="relative z-10 mx-auto w-full max-w-[1440px] shrink-0 px-6 pb-3 pt-10 md:px-10 md:pt-12 lg:px-12">
        <div className="flex items-end justify-between gap-8"><div className="max-w-3xl"><div className="landing-eyebrow">01 — How it works</div><RevealHeading text="From idea to shippable in one chat." className="landing-display mt-2 text-[clamp(1.7rem,3.5vw,3rem)] leading-[0.95]" /></div><p className="hidden max-w-[290px] text-right text-[13px] leading-relaxed text-[var(--color-text-muted)] lg:block">Scroll through a real business request—from a question to work ready to publish.</p></div>
      </div>
      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-[1440px] flex-1 px-4 pb-4 md:px-6 lg:px-8 lg:pb-7">
        <div className="grid min-h-0 w-full grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-h-0 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] shadow-[0_18px_50px_rgba(15,34,20,0.08)]"><HowDemo progress={progress} /></div>
          <aside className="hidden min-h-0 flex-col rounded-2xl border border-[var(--color-border)] bg-white/55 p-5 backdrop-blur-sm lg:flex">
            <div className="flex items-center justify-between"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-dim)]">Workflow</p><span className="font-mono text-[10px] text-[var(--color-text-dim)]">0{active + 1}/04</span></div>
            <div className="relative mt-6 flex-1"><div className="absolute bottom-5 left-[15px] top-5 w-px bg-[var(--color-border)]" /><div className="absolute left-[15px] top-5 w-px bg-[var(--color-accent)] transition-all duration-300" style={{ height: `${(active / (STEPS.length - 1)) * 100}%`, maxHeight: "calc(100% - 2.5rem)" }} /><div className="relative flex h-full flex-col justify-between">{STEPS.map((step, index) => { const Icon = step.icon; const current = index === active; const done = index < active; return <div key={step.label} className="flex items-start gap-3.5"><span className={`relative z-10 flex h-[31px] w-[31px] shrink-0 items-center justify-center rounded-full border transition-colors ${current || done ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white" : "border-[var(--color-border-strong)] bg-[var(--color-bg)] text-[var(--color-text-dim)]"}`}><Icon className="h-3.5 w-3.5" /></span><div className="pt-0.5"><p className={`text-[13px] font-semibold transition-colors ${current ? "text-[var(--color-text)]" : "text-[var(--color-text-muted)]"}`}>{step.label}</p><p className="mt-1 max-w-[185px] text-[11px] leading-snug text-[var(--color-text-dim)]">{step.description}</p></div></div>; })}</div></div>
            <div className="mt-5 border-t border-[var(--color-border)] pt-4"><p className="text-[11px] font-medium text-[var(--color-text)]">{active === 0 ? "Listening to your goal" : active === 1 ? "Finding the business signal" : active === 2 ? "Making it on-brand" : "Ready to go live"}</p><p className="mt-1 font-mono text-[10px] text-[var(--color-text-dim)]">SCROLL TO CONTINUE</p></div>
          </aside>
        </div>
        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[var(--color-border)] bg-white/90 px-3 py-1.5 shadow-sm lg:hidden"><span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" /><span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--color-text-dim)]">Scroll through the workflow</span></div>
      </div>
    </div>
  </section>;
}
