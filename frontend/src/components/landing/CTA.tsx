"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Magnetic } from "./Magnetic";

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
    <section ref={root} id="cta" className="relative py-40 md:py-56 overflow-hidden">
      {/* distortion gradient */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 50%, rgba(124,140,255,0.18), transparent 70%), radial-gradient(40% 40% at 30% 80%, rgba(179,136,255,0.12), transparent 70%)",
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
            background: i % 2 ? "#7c8cff" : "#b388ff",
            opacity: 0.4,
            boxShadow: "0 0 8px currentColor",
          }}
        />
      ))}

      <div className="relative mx-auto max-w-5xl px-6 text-center">
        <h2 className="landing-display text-[clamp(2.6rem,10vw,9rem)]">
          <span className="block overflow-hidden">
            <span className="cta-line block">Start the</span>
          </span>
          <span className="block overflow-hidden">
            <span className="cta-line block glow-text">company.</span>
          </span>
        </h2>

        <p className="cta-sub mt-10 max-w-xl mx-auto text-lg text-[var(--color-text-muted)] leading-relaxed">
          Your co-founder doesn&apos;t need equity, sleep, or a ping-pong table.
        </p>

        <div className="cta-btn mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
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

      <footer className="relative mt-32 border-t border-[var(--color-border)] pt-10">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-[var(--color-text-dim)]">
          <div className="flex items-center gap-2.5">
            <span className="node-dot" />
            <span>Co-Founder.ai</span>
          </div>
          <div className="flex items-center gap-8">
            <a href="#" className="link-underline" data-cursor="hover">Privacy</a>
            <a href="#" className="link-underline" data-cursor="hover">Terms</a>
            <a href="#" className="link-underline" data-cursor="hover">Contact</a>
          </div>
          <div>© 2026 Co-Founder AI</div>
        </div>
      </footer>
    </section>
  );
}
