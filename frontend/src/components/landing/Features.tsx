"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { RevealHeading } from "./RevealHeading";
import { Tilt } from "./Tilt";
import { SectionBackground } from "./SectionBackground";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  {
    n: "01",
    title: "Shared RAG memory",
    desc: "Every agent reads from a unified knowledge layer — semantic + keyword fusion over your documents and chat memories. Nothing gets re-explained.",
  },
  {
    n: "02",
    title: "Judge reflection loop",
    desc: "Agent output is scored 1–10 by a dedicated Judge. Below threshold, the agent revises with the critique — effort-based, so flash skips and max iterates twice.",
  },
  {
    n: "03",
    title: "Sandboxed execution",
    desc: "The Data Analyst runs Python, Pandas, and Matplotlib inside a secure e2b sandbox — real analysis, real charts, no hallucinated numbers.",
  },
  {
    n: "04",
    title: "MCQ clarifications",
    desc: "The CEO asks at most two multiple-choice questions per task to nail down ambiguity, then executes. No endless back-and-forth.",
  },
  {
    n: "05",
    title: "Effort-based models",
    desc: "Flash, mid, or max effort picks the right LLM per task — DeepSeek, GLM, GPT-OSS, Gemma, or MIMO — balancing speed, cost, and quality.",
  },
  {
    n: "06",
    title: "Real deliverables",
    desc: "Strategies, marketing campaigns, financial analysis, brand imagery, and written content. Output you can ship, not bullet points to interpret.",
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
            text="What it handles."
            className="landing-display text-[clamp(2.2rem,6vw,5rem)]"
          />
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
                  style={{ background: "radial-gradient(60% 60% at 50% 0%, var(--color-accent-glow), transparent 70%)" }}
                />
                <div className="relative flex h-full flex-col">
                  <span className="font-mono text-xs text-[var(--color-text-dim)]">
                    {f.n}
                  </span>
                  <h3 className="mt-6 text-2xl font-medium tracking-tight">
                    {f.title}
                  </h3>
                  <p className="mt-4 text-[var(--color-text-muted)] leading-relaxed">
                    {f.desc}
                  </p>
                  <div className="mt-auto pt-8">
                    <span className="link-underline text-sm text-[var(--color-text)]">
                      Learn more
                    </span>
                  </div>
                </div>
              </article>
            </Tilt>
          ))}
        </div>
      </div>
    </section>
  );
}
