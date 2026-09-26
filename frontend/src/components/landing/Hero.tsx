"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { Coins } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const bottomBarRef = useRef<HTMLDivElement>(null);

  const reduced = useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );

  // Entrance reveal animation
  useEffect(() => {
    if (!root.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

      tl.from(bgRef.current, {
        opacity: 0.85,
        duration: 1.6,
        ease: "power2.out",
      }, 0)
        .from(".hero-line-a", { yPercent: 110, opacity: 0, duration: 0.85, ease: "power3.out" }, 0.18)
        .from(".hero-line-b", { yPercent: 110, opacity: 0, duration: 0.85, ease: "power3.out" }, 0.28)
        .from(".hero-sub", { y: 14, opacity: 0, duration: 0.7 }, 0.4)
        .from(".hero-offer", { y: 12, opacity: 0, scale: 0.96, duration: 0.6 }, 0.46)
        .from(".hero-ctas", { y: 14, opacity: 0, duration: 0.65 }, 0.5)
        .from(bottomBarRef.current, { opacity: 0, y: 12, duration: 0.7 }, 0.62);
    }, root);
    return () => ctx.revert();
  }, [reduced]);

  // Subtle parallax & scroll zoom
  useEffect(() => {
    if (!root.current || reduced) return;

    const ctx = gsap.context(() => {
      if (bgRef.current) {
        gsap.to(bgRef.current, {
          y: 20,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "bottom top",
            scrub: 1.1,
          },
        });
      }

      if (contentRef.current) {
        gsap.to(contentRef.current, {
          y: -35,
          opacity: 0,
          ease: "power1.in",
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "50% top",
            scrub: 0.9,
          },
        });
      }

      if (bottomBarRef.current) {
        gsap.to(bottomBarRef.current, {
          opacity: 0,
          y: -15,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "30% top",
            scrub: 0.8,
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
      className="relative w-full min-h-[100svh] bg-[#fdfcf8] overflow-hidden flex flex-col justify-between"
      style={{ isolation: "isolate" }}
    >
      {/* ── Background from bg.png (Clear, zero overlays) ── */}
      <div
        ref={bgRef}
        className="absolute inset-0 will-change-transform pointer-events-none select-none"
      >
        <Image
          src="/bg.png"
          alt="Lush green valley with winding path"
          fill
          priority
          sizes="100vw"
          className="object-cover object-bottom select-none"
        />
      </div>

      {/* ── Centered Hero Content ── */}
      <div
        ref={contentRef}
        className="relative z-10 w-full max-w-[1440px] mx-auto px-5 sm:px-10 md:px-14 lg:px-20 pt-[104px] sm:pt-[130px] md:pt-[144px] pb-1 flex-1 flex flex-col items-center justify-start will-change-transform text-center"
      >
        <div className="w-full max-w-[1120px] flex flex-col items-center">
          {/* Large refined serif headline - wide and prominent */}
          <h1 className="hero-serif text-[#0e2115] text-[clamp(3.5rem,7.8vw,6.2rem)] leading-[0.95] tracking-[-0.035em] [text-wrap:balance]">
            <span className="sr-only">Co-Founder AI — AI team for founders: </span>
            <span className="block overflow-hidden py-0.5">
              <span className="hero-line-a block font-[400]">One idea.</span>
            </span>
            <span className="block overflow-hidden py-0.5 mt-0.5">
              <span className="hero-line-b block font-[400]">
                An entire <span className="italic text-[#4a6350]">AI team.</span>
              </span>
            </span>
          </h1>

          {/* Centered supporting copy */}
          <p className="hero-sub mt-5 sm:mt-6 max-w-[720px] sm:max-w-[760px] text-[16.5px] sm:text-[18px] md:text-[19px] leading-[1.58] text-[#2c3d32] font-[450] text-balance">
            Plan, research, build and grow — with AI agents that work with you, not just for you.
          </p>

          {/* Free-credit hook — the strongest reason to sign up today */}
          <div className="hero-offer mt-6 flex w-full max-w-[22rem] items-center justify-center gap-2.5 rounded-2xl border border-[#162f20]/15 bg-white/85 py-2 pl-3 pr-3.5 text-left shadow-[0_6px_24px_rgba(22,47,32,0.10)] backdrop-blur-md sm:mt-7 sm:w-auto sm:max-w-none sm:rounded-full sm:pl-2.5 sm:pr-4">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#162f20] text-white">
              <Coins className="h-4 w-4" />
            </span>
            <span className="text-[13px] font-[600] leading-snug tracking-[-0.01em] text-[#162f20] sm:text-[13.5px]">
              Sign up free and get <span className="whitespace-nowrap text-[#1d6b3a]">50 credits</span> on the house
            </span>
            <span className="hidden h-4 w-px bg-[#162f20]/15 sm:block" />
            <span className="hidden text-[12px] font-[500] text-[#4a6350] sm:block">no card needed</span>
          </div>

          {/* Centered CTA buttons — always side by side, on phones too */}
          <div className="hero-ctas mt-5 flex w-full flex-row items-center justify-center gap-2 sm:mt-7 sm:w-auto sm:gap-3.5">
            <Link
              href="/auth"
              className="group relative inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-[#162f20] px-3 py-[13px] text-[12.5px] font-[600] tracking-[-0.01em] text-white shadow-[0_8px_26px_rgba(22,47,32,0.26)] transition-all duration-300 hover:bg-[#1d3d2a] hover:shadow-[0_14px_34px_rgba(22,47,32,0.34)] active:scale-[0.98] min-[380px]:px-4 min-[380px]:text-[13px] sm:flex-none sm:gap-2 sm:px-9 sm:py-[15px] sm:text-[15px]"
            >
              <span>Get 50 free credits</span>
              <span className="hidden transition-transform duration-300 group-hover:translate-x-1 min-[380px]:inline">→</span>
            </Link>
            <Link
              href="/demo"
              className="group relative inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 border-[#162f20]/20 bg-white/95 px-3 py-[11px] text-[12.5px] font-[600] tracking-[-0.01em] text-[#162f20] shadow-[0_8px_26px_rgba(22,47,32,0.14)] backdrop-blur-md transition-all duration-300 select-none hover:-translate-y-0.5 hover:border-[#162f20]/40 hover:bg-white hover:shadow-[0_14px_34px_rgba(22,47,32,0.2)] active:scale-[0.98] min-[380px]:px-4 min-[380px]:text-[13px] sm:flex-none sm:gap-3 sm:px-8 sm:py-[13px] sm:text-[15px]"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#162f20] text-white shadow-[0_2px_8px_rgba(22,47,32,0.35)] transition-transform duration-300 group-hover:scale-110 min-[380px]:h-7 min-[380px]:w-7">
                <svg className="w-3 h-3 fill-current translate-x-[0.5px]" viewBox="0 0 24 24">
                  <polygon points="7 4 19 12 7 20 7 4" />
                </svg>
              </span>
              <span>Try demo</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Bottom Bar: Scroll Indicator (Left) & IDEAS — EXECUTION (Right) ──
          On phones this sits over the bright valley floor, so the indicators
          switch to dark ink and only become white from sm up. */}
      <div
        ref={bottomBarRef}
        className="relative z-10 mt-auto w-full max-w-[1440px] mx-auto px-5 sm:px-10 md:px-14 lg:px-20 pb-4 sm:pb-9 pt-3 sm:pt-4 flex items-end justify-between select-none"
      >
        {/* Left Scroll Indicator */}
        <div className="flex flex-col items-start gap-1.5 select-none">
          <div className="ml-0.5 h-5 w-px bg-[#0e2115]/30 sm:h-6 sm:bg-white/50" />
          <span className="text-[11px] tracking-wide text-[#0e2115]/70 sm:text-[12px] sm:text-white/85">
            Scroll to explore
          </span>
        </div>

        {/* Right Stepper Marker */}
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-[#0e2115]/70 select-none sm:gap-2.5 sm:text-[11px] sm:text-white/85">
          <span>IDEAS</span>
          <span className="h-px w-4 bg-[#0e2115]/30 sm:w-5 sm:bg-white/60" />
          <span>EXECUTION</span>
        </div>
      </div>

      {/* Subtle border into the next section */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-px bg-[var(--color-border)]" />
    </section>
  );
}
