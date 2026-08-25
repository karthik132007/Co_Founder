"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
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
    <section ref={root} id="cta" className="relative overflow-hidden pt-40 pb-0 md:pt-56 md:pb-0">
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

      <footer className="relative mt-24 bg-[#05060a] text-white/70" data-cursor-invert>
        <div className="mx-auto max-w-7xl px-6 py-8 flex flex-col items-center justify-between gap-6 text-sm md:flex-row md:gap-6">
          <div className="flex flex-col items-center gap-1 md:items-start">
            <div className="flex items-center gap-2.5 text-white">
              <Image src="/icon.png" alt="Co-Founder AI" width={20} height={20} className="w-5 h-5 object-contain" />
              <span>Co-Founder AI</span>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
              Agentify your business
            </span>
          </div>

          <nav className="flex items-center gap-6 text-white/60">
            <a href="#" className="link-underline" data-cursor="hover">Privacy</a>
            <a href="#" className="link-underline" data-cursor="hover">Terms</a>
            <a href="#" className="link-underline" data-cursor="hover">Contact</a>
          </nav>

          <div className="flex items-center gap-5 text-white/60">
            <a
              href="https://github.com/karthik132007/Co_Founder"
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline"
              data-cursor="hover"
            >
              <span className="inline-flex items-center gap-2">
                <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
                </svg>
                <span>Proudly open source</span>
              </span>
            </a>
            <span className="hidden h-4 w-px bg-white/15 sm:block" />
            <span className="text-white/40">© 2026 Co-Founder AI</span>
          </div>
        </div>
      </footer>
    </section>
  );
}
