"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

/**
 * Ambient cinematic backdrop for content sections. Renders a subtle masked
 * grid plus parallaxing glow orbs that drift on scroll. Theme-aware via CSS
 * variables. Keeps sections from feeling flat without competing with content.
 */
export function SectionBackground({
  variant = "default",
}: {
  variant?: "default" | "warm" | "cool";
}) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".sb-orb").forEach((orb, i) => {
        gsap.to(orb, {
          y: (i % 2 ? 1 : -1) * (22 + i * 8),
          x: (i % 2 ? -1 : 1) * 12,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 1.8,
          },
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  const orbs =
    variant === "warm"
      ? [
          { c: "var(--color-accent)", x: "10%", y: "10%", s: "40vw" },
          { c: "var(--color-accent-2)", x: "70%", y: "60%", s: "30vw" },
        ]
      : variant === "cool"
      ? [
          { c: "var(--color-accent-2)", x: "60%", y: "5%", s: "35vw" },
          { c: "var(--color-accent)", x: "5%", y: "70%", s: "45vw" },
        ]
      : [
          { c: "var(--color-accent)", x: "15%", y: "20%", s: "38vw" },
          { c: "var(--color-accent-2)", x: "75%", y: "55%", s: "32vw" },
        ];

  return (
    <div
      ref={root}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)",
        maskImage:
          "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)",
      }}
    >
      {/* no grid here — global grid provides continuity */}
      {orbs.map((o, i) => (
        <span
          key={i}
          className="sb-orb glow-orb"
          style={{
            left: o.x,
            top: o.y,
            width: o.s,
            height: o.s,
            background: `radial-gradient(circle, ${o.c}, transparent 72%)`,
            opacity: 0.055,
          }}
        />
      ))}
    </div>
  );
}
