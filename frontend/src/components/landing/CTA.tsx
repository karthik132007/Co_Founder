"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
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

      <footer className="relative mt-16 sm:mt-24 px-4 sm:px-6 pb-8" data-cursor-invert>
        <div className="mx-auto max-w-7xl rounded-[1.75rem] border border-white/10 bg-[#05060a] px-6 py-10 text-white/70 sm:px-10">
          <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-2.5 text-white">
                <Image src="/icon.png" alt="Co-Founder AI" width={22} height={22} className="h-[22px] w-[22px] object-contain" />
                <span className="font-semibold">Co-Founder AI</span>
              </div>
              <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-white/50">
                Agentify your business. Your co-founder doesn&apos;t need equity, sleep, or a ping-pong table.
              </p>
              <a
                href="https://www.producthunt.com/products/co-founder-ai-2?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-co-founder-ai-3"
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="hover"
                className="mt-5 inline-block"
              >
                <img
                  alt="Co-Founder AI - Agentify your business | Product Hunt"
                  width="160"
                  height="35"
                  src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1259828&theme=light&t=1790227355405"
                  style={{ width: "160px", height: "auto" }}
                />
              </a>
            </div>

            <nav aria-label="Product">
              <p className="text-sm font-semibold text-white">Product</p>
              <ul className="mt-4 space-y-3 text-[13px] text-white/55">
                <li><Link href="/auth" className="transition hover:text-white" data-cursor="hover">Meet your co-founder</Link></li>
                <li><Link href="/#pricing" className="transition hover:text-white" data-cursor="hover">Pricing</Link></li>
                <li><Link href="/integrations" className="transition hover:text-white" data-cursor="hover">Integrations</Link></li>
                <li><a href="#top" className="transition hover:text-white" data-cursor="hover">Back to top</a></li>
              </ul>
            </nav>

            <nav aria-label="Legal">
              <p className="text-sm font-semibold text-white">Legal</p>
              <ul className="mt-4 space-y-3 text-[13px] text-white/55">
                <li><Link href="/privacy" className="transition hover:text-white" data-cursor="hover">Privacy Policy</Link></li>
                <li><Link href="/terms" className="transition hover:text-white" data-cursor="hover">Terms of Service</Link></li>
                <li><Link href="/cookies" className="transition hover:text-white" data-cursor="hover">Cookie Policy</Link></li>
              </ul>
            </nav>

            <nav aria-label="Open source">
              <p className="text-sm font-semibold text-white">Open Source</p>
              <ul className="mt-4 space-y-3 text-[13px] text-white/55">
                <li>
                  <a
                    href="https://github.com/karthik132007/Co_Founder"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 transition hover:text-white"
                    data-cursor="hover"
                  >
                    <svg viewBox="0 0 16 16" width="15" height="15" fill="currentColor" aria-hidden="true">
                      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
                    </svg>
                    <span>GitHub</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/karthik132007/Co_Founder/blob/main/LICENSE"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition hover:text-white"
                    data-cursor="hover"
                  >
                    AGPL-3.0 License
                  </a>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="transition hover:text-white"
                    data-cursor="hover"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 text-[13px] text-white/40 sm:flex-row sm:items-center sm:justify-between">
            <span className="whitespace-nowrap">© 2026 Co-Founder AI. All rights reserved.</span>
            <nav className="flex flex-wrap items-center gap-x-6 gap-y-2" aria-label="Legal">
              <Link href="/privacy" className="transition hover:text-white/70" data-cursor="hover">Privacy Policy</Link>
              <Link href="/terms" className="transition hover:text-white/70" data-cursor="hover">Terms of Service</Link>
              <Link href="/cookies" className="transition hover:text-white/70" data-cursor="hover">Cookie Policy</Link>
            </nav>
          </div>
        </div>
        <div aria-hidden="true" className="pointer-events-none mt-8 select-none overflow-hidden">
          <p className="bg-gradient-to-b from-[#0f2214]/[0.12] to-[#0f2214]/[0.01] bg-clip-text text-center text-[clamp(3.5rem,13vw,11rem)] font-extrabold leading-[0.9] tracking-tight text-transparent">
            Co-Founder AI
          </p>
        </div>
      </footer>
    </section>
  );
}
