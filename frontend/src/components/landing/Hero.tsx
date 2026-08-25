"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import dynamic from "next/dynamic";
import { Magnetic } from "./Magnetic";

// Heavy Three.js scene — lazy loaded, no SSR
const HeroScene = dynamic(
  () => import("./three/HeroScene").then((m) => m.HeroScene),
  { ssr: false }
);

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.from(".hero-eyebrow", { y: 20, opacity: 0, duration: 1 })
        .from(".hero-line", { yPercent: 110, opacity: 0, duration: 1.2, stagger: 0.12 }, "-=0.7")
        .from(".hero-sub", { y: 24, opacity: 0, duration: 1 }, "-=0.6")
        .from(".hero-cta", { y: 20, opacity: 0, duration: 0.9, stagger: 0.1 }, "-=0.5")
        .from(".hero-meta", { opacity: 0, duration: 1 }, "-=0.4")
        .add(() => setLoaded(true), "-=0.2");
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="top" className="relative h-[100svh] w-full overflow-hidden">
      {/* 3D scene */}
      <div className="absolute inset-0 vignette">
        <HeroScene />
      </div>

      {/* gradient floor — fades scene into page bg */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3"
        style={{ background: "linear-gradient(to top, var(--color-bg), transparent)" }}
      />

      {/* content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="hero-eyebrow landing-eyebrow mb-8">
          Agentify your business
        </div>

        <h1 className="landing-display text-[clamp(2.8rem,9vw,8.5rem)]">
          <span className="block overflow-hidden">
            <span className="hero-line block">Build Companies.</span>
          </span>
          <span className="block overflow-hidden">
            <span className="hero-line block text-[var(--color-text-muted)]">
              Not Just Products.
            </span>
          </span>
        </h1>

        <p className="hero-sub mt-8 max-w-xl text-base md:text-lg text-[var(--color-text-muted)] leading-relaxed">
          A multi-agent AI platform that replaces a human founding team — a CEO
          orchestrator and specialized agents that research, write, analyze,
          design, and market your company alongside you.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Magnetic strength={0.5}>
            <a href="/auth" className="hero-cta btn-magnetic is-solid" data-cursor="hover">
              <span className="btn-bg" />
              <span className="btn-glow" />
              Begin the build
            </a>
          </Magnetic>
          <Magnetic strength={0.5}>
            <a href="#how" className="hero-cta btn-magnetic is-ghost" data-cursor="hover">
              <span className="btn-bg" />
              <span className="btn-glow" />
              See how it thinks
            </a>
          </Magnetic>
        </div>

        <div className="hero-meta absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 text-xs text-[var(--color-text-dim)]">
          <span className="h-px w-10 bg-[var(--color-border-strong)]" />
          Scroll to enter
          <span className="h-px w-10 bg-[var(--color-border-strong)]" />
        </div>
      </div>
    </section>
  );
}
