"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { RevealHeading } from "./RevealHeading";
import { SectionBackground } from "./SectionBackground";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

/**
 * How Co-Founder thinks — a horizontal pinned scroll.
 *
 * The section pins for the duration of the track width, and a row of agent
 * cards slides left as the user scrolls. A progress line draws beneath the
 * cards and each card scales/fades in sequence. This avoids the previous
 * pin+sticky conflict that caused janky scrolling.
 *
 * Agents reflect the real system: CEO orchestrator delegates to specialized
 * sub-agents, each with a Judge reflection loop, then synthesizes output.
 */

type Agent = {
  id: string;
  index: string;
  label: string;
  role: string;
  desc: string;
  tool: string;
  accent: string;
};

const AGENTS: Agent[] = [
  {
    id: "ceo",
    index: "01",
    label: "CEO Orchestrator",
    role: "Strategic brain",
    desc: "Receives your idea, plans the next actions, and delegates to sub-agents via tool calls. Synthesizes every result into a coherent response.",
    tool: "10+ tools · effort-based LLM selection",
    accent: "#7c8cff",
  },
  {
    id: "researcher",
    index: "02",
    label: "Researcher",
    role: "Market intelligence",
    desc: "Runs live web search to map competitors, surface industry trends, and ground every decision in evidence — not vibes.",
    tool: "Tavily web search · Judge-refined",
    accent: "#b388ff",
  },
  {
    id: "writer",
    index: "03",
    label: "Writer",
    role: "Narrative & copy",
    desc: "Generates positioning, content, and pitch narrative. Temperature 0.7 for creative work, revised through the Judge loop.",
    tool: "Direct LLM · Judge-refined",
    accent: "#6ee7b7",
  },
  {
    id: "cmo",
    index: "04",
    label: "CMO Marketing",
    role: "Growth engine",
    desc: "Builds campaigns, content calendars, and growth strategies from real search trends, news, and shopping signals.",
    tool: "SerpAPI trends + news + shopping",
    accent: "#fbbf24",
  },
  {
    id: "data",
    index: "05",
    label: "Data Analyst",
    role: "Evidence & numbers",
    desc: "Executes Python, Pandas, and Matplotlib inside a secure e2b sandbox to analyze your data and produce charts.",
    tool: "e2b code sandbox · direct execution",
    accent: "#60a5fa",
  },
  {
    id: "design",
    index: "06",
    label: "Graphic Designer",
    role: "Brand & visuals",
    desc: "Generates brand imagery and color palettes from a dedicated image model, tuned to your company tone.",
    tool: "Gemini image model · palette tools",
    accent: "#f472b6",
  },
  {
    id: "judge",
    index: "07",
    label: "Judge",
    role: "Quality reflection",
    desc: "Scores agent output 1–10. Below threshold, the agent revises with the critique — effort-based: flash 0, mid 1, max 2 reflections.",
    tool: "LLM-as-Judge · GPT-OSS-120B",
    accent: "#a78bfa",
  },
];

export function HowItThinks() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const el = track.current;
      const section = root.current;
      if (!el || !section) return;

      const cards = gsap.utils.toArray<HTMLElement>(".wf-card");
      const progressLine = section.querySelector<HTMLElement>(".wf-progress-fill");

      const getDistance = () => Math.max(0, el.scrollWidth - window.innerWidth);

      const tween = gsap.to(el, {
        x: () => -getDistance(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${getDistance()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (progressLine) progressLine.style.width = `${self.progress * 100}%`;
          },
        },
      });

      cards.forEach((card) => {
        gsap.fromTo(
          card,
          { scale: 0.85, opacity: 0.2, filter: "blur(8px)" },
          {
            scale: 1,
            opacity: 1,
            filter: "blur(0px)",
            ease: "power2.out",
            duration: 0.6,
            scrollTrigger: {
              trigger: card,
              containerAnimation: tween,
              start: "left 80%",
              end: "left 40%",
              scrub: 1,
            },
          }
        );
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="how" className="relative h-[100svh] w-full overflow-hidden">
      <SectionBackground variant="cool" />

      {/* Heading pinned top-left */}
      <div className="pointer-events-none absolute top-24 left-0 right-0 z-10 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="landing-eyebrow mb-5">01 — Cognition</div>
          <RevealHeading
            text="How Co-Founder thinks."
            className="landing-display text-[clamp(2rem,5vw,4rem)]"
          />
        </div>
      </div>

      {/* Horizontal track */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full">
        <div ref={track} className="flex gap-8 px-[10vw] will-change-transform">
          {AGENTS.map((a) => (
            <article
              key={a.id}
              className="wf-card relative flex h-[58vh] max-h-[520px] w-[78vw] sm:w-[440px] shrink-0 flex-col justify-between overflow-hidden rounded-3xl glass p-8 md:p-10"
              data-cursor="hover"
            >
              <div
                className="pointer-events-none absolute -top-1/4 -right-1/4 h-2/3 w-2/3 rounded-full opacity-20 blur-3xl"
                style={{ background: a.accent }}
              />

              <div className="relative">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-[var(--color-text-dim)]">
                    {a.index}
                  </span>
                  <span
                    className="flex h-2 w-2 rounded-full"
                    style={{ background: a.accent, boxShadow: `0 0 12px ${a.accent}` }}
                  />
                </div>

                <div className="mt-10">
                  <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-dim)]">
                    {a.role}
                  </div>
                  <h3 className="mt-3 landing-display text-3xl md:text-4xl">
                    {a.label}
                  </h3>
                </div>

                <p className="mt-6 max-w-sm text-[var(--color-text-muted)] leading-relaxed">
                  {a.desc}
                </p>
              </div>

              <div className="relative mt-8 flex items-center gap-3 border-t border-[var(--color-border)] pt-6">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: a.accent }}
                />
                <span className="font-mono text-xs text-[var(--color-text-dim)]">
                  {a.tool}
                </span>
              </div>
            </article>
          ))}

          {/* End card */}
          <article className="wf-card relative flex h-[58vh] max-h-[520px] w-[78vw] sm:w-[440px] shrink-0 flex-col items-center justify-center overflow-hidden rounded-3xl glass-strong p-10 text-center">
            <div className="pointer-events-none absolute inset-0 opacity-40"
              style={{ background: "radial-gradient(60% 60% at 50% 50%, var(--color-accent-glow), transparent 70%)" }}
            />
            <div className="relative">
              <div className="landing-eyebrow mb-6">Synthesis</div>
              <h3 className="landing-display text-3xl md:text-4xl">
                One coherent response.
              </h3>
              <p className="mt-6 text-[var(--color-text-muted)] leading-relaxed max-w-xs mx-auto">
                The CEO assembles every agent's output into markdown or MCQ
                cards — strategies, code, content, and plans you can ship.
              </p>
            </div>
          </article>
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-[60vw] max-w-md">
        <div className="h-px w-full bg-[var(--color-border)]">
          <div className="wf-progress-fill h-px bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-2)]" style={{ width: "0%" }} />
        </div>
        <div className="mt-3 flex justify-between font-mono text-[10px] text-[var(--color-text-dim)]">
          <span>CEO</span>
          <span>Scroll to trace the workflow →</span>
          <span>Output</span>
        </div>
      </div>
    </section>
  );
}
