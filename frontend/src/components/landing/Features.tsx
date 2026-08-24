"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Brain, BadgeCheck, BarChart3, MessageSquare, Zap, Rocket } from "lucide-react";
import { RevealHeading } from "./RevealHeading";
import { Tilt } from "./Tilt";
import { SectionBackground } from "./SectionBackground";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  {
    n: "01",
    icon: Brain,
    title: "Remembers everything",
    tag: "Never re-explain your business.",
    color: "#4f46e5",
  },
  {
    n: "02",
    icon: BadgeCheck,
    title: "Checks its own work",
    tag: "Polished before you see it.",
    color: "#10b981",
  },
  {
    n: "03",
    icon: BarChart3,
    title: "Does the real math",
    tag: "Numbers you can trust.",
    color: "#0ea5e9",
  },
  {
    n: "04",
    icon: MessageSquare,
    title: "Asks only when it matters",
    tag: "A quick question, then done.",
    color: "#f59e0b",
  },
  {
    n: "05",
    icon: Zap,
    title: "Fast when you need it",
    tag: "Speed, balanced for you.",
    color: "#8b5cf6",
  },
  {
    n: "06",
    icon: Rocket,
    title: "Ready to launch",
    tag: "Work you can ship today.",
    color: "#f43f5e",
  },
];

export function Features() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".feat-card").forEach((card, i) => {
        gsap.from(card, {
          opacity: 0,
          y: 80,
          scale: 0.96,
          duration: 1,
          ease: "expo.out",
          delay: (i % 3) * 0.08,
          scrollTrigger: { trigger: card, start: "top 88%" },
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="features" className="relative py-32 md:py-48 overflow-hidden">
      <SectionBackground variant="warm" />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mb-20 max-w-3xl">
          <div className="landing-eyebrow mb-6">03 — Capabilities</div>
          <RevealHeading
            text="What you can do."
            className="landing-display text-[clamp(2.2rem,6vw,5rem)]"
          />
          <p className="mt-8 max-w-xl text-[var(--color-text-muted)] text-lg leading-relaxed">
            No tech skills needed. From a single chat, your AI team handles
            strategy, research, writing, marketing, analysis, and design — and
            hands back work you can actually use.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Tilt key={f.n} max={6} className="feat-card">
              <article
                className="group relative h-full overflow-hidden rounded-2xl glass p-8 transition-colors duration-500 hover:border-[var(--color-border-strong)]"
                data-cursor="hover"
              >
                {/* hover glow */}
                <div className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: `radial-gradient(60% 60% at 50% 0%, ${f.color}33, transparent 70%)` }}
                />
                <div className="relative flex h-full flex-col">
                  <div className="flex items-start justify-between">
                    {/* icon visual */}
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-2xl border transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110"
                      style={{
                        background: `linear-gradient(135deg, ${f.color}2e, ${f.color}0f)`,
                        borderColor: `${f.color}45`,
                        boxShadow: `0 10px 34px ${f.color}30`,
                      }}
                    >
                      <f.icon className="h-7 w-7" style={{ color: f.color }} strokeWidth={1.75} />
                    </div>
                    <span className="font-mono text-xs text-[var(--color-text-dim)]">
                      {f.n}
                    </span>
                  </div>
                  <h3 className="mt-8 text-2xl font-medium tracking-tight">
                    {f.title}
                  </h3>
                  <p className="mt-3 text-sm text-[var(--color-text-muted)] leading-relaxed">
                    {f.tag}
                  </p>
                </div>
              </article>
            </Tilt>
          ))}
        </div>
      </div>
    </section>
  );
}
