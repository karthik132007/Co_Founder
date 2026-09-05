"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const reduced = useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );

  useEffect(() => {
    if (!root.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.from(".hero-bg", { scale: 1.06, duration: 1.5, ease: "expo.out" }, 0)
        .from(".hero-eyebrow", { y: 10, opacity: 0, duration: 0.6 }, 0.12)
        .from(".hero-line-a", { yPercent: 102, opacity: 0, duration: 0.8 }, 0.18)
        .from(".hero-line-b", { yPercent: 102, opacity: 0, duration: 0.8 }, 0.24)
        .from(".hero-line-c", { yPercent: 102, opacity: 0, duration: 0.75 }, 0.3)
        .from(".hero-sub", { y: 10, opacity: 0, duration: 0.6 }, 0.46)
        .from(".hero-ctas", { y: 10, opacity: 0, duration: 0.55 }, 0.54);
    }, root);
    return () => ctx.revert();
  }, [reduced]);

  useEffect(() => {
    if (!root.current || !bgRef.current) return;
    if (reduced) return;
    const ctx = gsap.context(() => {
      gsap.to(bgRef.current, {
        y: 24,
        scale: 1.04,
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "bottom top",
          scrub: 1.1,
        },
      });
      if (contentRef.current) {
        gsap.to(contentRef.current, {
          y: -16,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "45% top",
            scrub: 0.9,
          },
        });
      }
    }, root);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section
      ref={root}
      id="top"
      className="relative w-full min-h-[100svh] bg-[#fdfcf8] overflow-hidden flex flex-col"
      style={{ isolation: "isolate" }}
    >
      {/* image */}
      <div ref={bgRef} className="absolute inset-0 will-change-transform">
        <Image
          src="/bg.png"
          alt="Mountain valley with winding trail"
          fill
          priority
          sizes="100vw"
          className="hero-bg object-cover select-none"
          style={{ objectPosition: "center 42%" }}
        />
        {/* wash — extended just enough so subcopy never hits green hills */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, #fdfcf8 0%, #fdfcf8 40%, rgba(253,252,248,0.94) 52%, rgba(253,252,248,0.72) 64%, rgba(253,252,248,0.34) 76%, rgba(253,252,248,0.08) 84%, transparent 90%)",
          }}
        />
        {/* bottom fade to page bg */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[28px] md:h-[40px] bg-gradient-to-t from-[var(--color-bg)]/35 to-transparent" />
        {/* very soft vignette */}
        <div
          className="absolute inset-0 hidden lg:block pointer-events-none"
          style={{
            background: "radial-gradient(85% 75% at 50% 60%, transparent 58%, rgba(253,252,248,0.14) 88%)",
          }}
        />
      </div>

      {/* content — lifted */}
      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-6 md:px-10 lg:px-12 flex flex-1 flex-col">
        <div
          ref={contentRef}
          className="flex flex-1 flex-col justify-center items-center md:items-start text-center md:text-left pt-[88px] pb-10 md:pt-[124px] md:pb-10 lg:pt-[132px] lg:pb-14 will-change-transform"
        >
          <div className="w-full max-w-[660px]">
            <p className="hero-eyebrow font-mono text-[10px] md:text-[11px] tracking-[0.26em] text-[#6b7a71] font-medium">
              THE AI OPERATING SYSTEM FOR FOUNDERS
            </p>

            <h1 className="mt-5 hero-serif text-[#0f2214] text-[clamp(2.8rem,6.8vw,5.55rem)] leading-[0.88] tracking-[-0.045em] [text-wrap:balance]">
              <span className="block overflow-hidden">
                <span className="hero-line-a block font-[400]">Agentify</span>
              </span>
              <span className="block overflow-hidden">
                <span className="hero-line-b block font-[400]">Your Business.</span>
              </span>
              <span className="block overflow-hidden mt-1">
                <span className="hero-line-c block font-[400] italic tracking-[-0.03em] text-[#1f4d30]">
                  Touch Grass.
                </span>
              </span>
            </h1>

            <p className="hero-sub mt-6 max-w-[520px] mx-auto md:mx-0 text-[15px] md:text-[17px] leading-[1.58] text-[#3d4a43] text-balance">
              Your AI team handles the research, planning, creation and execution.
              <br className="hidden md:block" /> You get your time back.
            </p>

            <div className="hero-ctas mt-8 flex w-full flex-col sm:flex-row gap-3 sm:gap-3.5 justify-center md:justify-start">
              <Link
                href="/auth"
                className="group inline-flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-full bg-[#0f2214] px-7 py-[14px] text-[14.5px] font-[600] tracking-[-0.01em] text-white shadow-[0_6px_22px_rgba(15,34,20,0.16)] hover:bg-[#1a3424] transition-colors"
              >
                Start Building <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
              <Link
                href="#how"
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-full bg-white px-7 py-[14px] text-[14.5px] font-[500] tracking-[-0.01em] text-[#0f2214] border border-black/10 shadow-[0_2px_12px_rgba(15,34,20,0.06)] hover:bg-[#f6f5ef] hover:border-black/14 transition-colors"
              >
                Explore Agents
              </Link>
            </div>
          </div>
        </div>

        <div className="h-[12px] md:h-[20px] shrink-0" />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-px bg-gradient-to-r from-transparent via-black/[0.06] to-transparent" />
    </section>
  );
}
