"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Magnetic } from "./Magnetic";
import SiteFooter from "./SiteFooter";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

/**
 * Final CTA — massive type, floating particles (CSS), and a background
 * distortion plane driven by scroll progress.
 */
export function CTA() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".cta-line", {
        yPercent: 110,
        opacity: 0,
        duration: 1.2,
        ease: "expo.out",
        stagger: 0.12,
        scrollTrigger: { trigger: root.current, start: "top 70%" },
      });
      gsap.from(".cta-sub", {
        y: 24,
        opacity: 0,
        duration: 1,
        delay: 0.3,
        scrollTrigger: { trigger: root.current, start: "top 70%" },
      });
      gsap.from(".cta-btn", {
        y: 20,
        opacity: 0,
        duration: 0.9,
        delay: 0.5,
        scrollTrigger: { trigger: root.current, start: "top 70%" },
      });

      // parallax particles
      gsap.utils.toArray<HTMLElement>(".cta-particle").forEach((p, i) => {
        gsap.to(p, {
          y: (i % 2 ? 1 : -1) * (40 + i * 10),
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 1.5,
          },
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="cta" className="relative overflow-hidden pt-16 sm:pt-24 md:pt-32 pb-0" style={{ isolation: "isolate" }}>
      <div className="pointer-events-none absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-black/[0.04] to-transparent" />
      <div className="pointer-events-none absolute top-0 inset-x-0 h-[36px] md:h-[48px] bg-gradient-to-b from-[var(--color-bg)] to-transparent opacity-30" />
      {/* distortion gradient */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 50%, rgba(20,54,32,0.07), transparent 70%), radial-gradient(40% 40% at 30% 80%, rgba(34,85,50,0.05), transparent 70%)",
        }}
      />

      {/* floating particles */}
      {Array.from({ length: 24 }).map((_, i) => (
        <span
          key={i}
          className="cta-particle absolute rounded-full"
          style={{
            left: `${(i * 37) % 100}%`,
            top: `${(i * 53) % 100}%`,
            width: `${2 + (i % 3)}px`,
            height: `${2 + (i % 3)}px`,
            background: i % 2 ? "#143620" : "#2a5a3a",
            opacity: 0.24,
            boxShadow: "0 0 8px currentColor",
          }}
        />
      ))}

      <div className="relative mx-auto max-w-5xl px-5 text-center sm:px-6">
        <h2 className="landing-display text-[clamp(2.6rem,10vw,9rem)]">
          <span className="block overflow-hidden">
            <span className="cta-line block">Start the</span>
          </span>
          <span className="block overflow-hidden">
            <span className="cta-line block glow-text">company.</span>
          </span>
        </h2>

        <p className="cta-sub mt-7 sm:mt-10 max-w-xl mx-auto text-[17px] sm:text-lg text-[var(--color-text-muted)] leading-relaxed">
          Your co-founder doesn&apos;t need equity, sleep, or a ping-pong table.
        </p>

        <div className="cta-btn mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Magnetic strength={0.5}>
            <a href="/auth" className="btn-magnetic is-solid" data-cursor="hover">
              <span className="btn-bg" />
              <span className="btn-glow" />
              Meet your co-founder
            </a>
          </Magnetic>
          <Magnetic strength={0.5}>
            <a href="#top" className="btn-magnetic is-ghost" data-cursor="hover">
              <span className="btn-bg" />
              <span className="btn-glow" />
              Back to top
            </a>
          </Magnetic>
        </div>
      </div>

      <SiteFooter />
    </section>
  );
}
