"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { Coins, ShieldCheck } from "lucide-react";
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
        .from(".hero-reassure", { y: 10, opacity: 0, duration: 0.55 }, 0.58)
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
        className="relative z-10 w-full max-w-[1440px] mx-auto px-6 sm:px-10 md:px-14 lg:px-20 pt-[115px] sm:pt-[130px] md:pt-[144px] flex-1 flex flex-col items-center justify-start will-change-transform text-center"
      >
        <div className="w-full max-w-[1120px] flex flex-col items-center">
          {/* Large refined serif headline - wide and prominent */}
          <h1 className="hero-serif text-[#0e2115] text-[clamp(3.5rem,7.8vw,6.2rem)] leading-[0.95] tracking-[-0.035em] [text-wrap:balance]">
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
          <div className="hero-offer mt-7 inline-flex items-center gap-2.5 rounded-full border border-[#162f20]/15 bg-white/85 py-2 pl-2.5 pr-4 shadow-[0_6px_24px_rgba(22,47,32,0.10)] backdrop-blur-md">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#162f20] text-white">
              <Coins className="h-4 w-4" />
            </span>
            <span className="text-[13.5px] font-[600] tracking-[-0.01em] text-[#162f20]">
              Sign up free and get <span className="text-[#1d6b3a]">50 credits</span> on the house
            </span>
            <span className="hidden h-4 w-px bg-[#162f20]/15 sm:block" />
            <span className="hidden text-[12px] font-[500] text-[#4a6350] sm:block">no card needed</span>
          </div>

          {/* Centered CTA buttons */}
          <div className="hero-ctas mt-6 sm:mt-7 flex flex-col sm:flex-row gap-3 sm:gap-3.5 items-center justify-center">
            <Link
              href="/auth"
              className="group relative inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-[#162f20] hover:bg-[#1d3d2a] px-8 sm:px-9 py-[15px] text-[15px] font-[600] tracking-[-0.01em] text-white shadow-[0_8px_26px_rgba(22,47,32,0.26)] hover:shadow-[0_14px_34px_rgba(22,47,32,0.34)] transition-all duration-300 active:scale-[0.98]"
            >
              <span>Get 50 free credits</span>
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
            <Link
              href="/demo"
              className="group relative inline-flex w-full sm:w-auto items-center justify-center gap-3 rounded-full border-2 border-[#162f20]/20 bg-white/95 px-7 sm:px-8 py-[13px] text-[15px] font-[600] tracking-[-0.01em] text-[#162f20] shadow-[0_8px_26px_rgba(22,47,32,0.14)] backdrop-blur-md transition-all duration-300 select-none hover:-translate-y-0.5 hover:border-[#162f20]/40 hover:bg-white hover:shadow-[0_14px_34px_rgba(22,47,32,0.2)] active:scale-[0.98]"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#162f20] text-white shadow-[0_2px_8px_rgba(22,47,32,0.35)] transition-transform duration-300 group-hover:scale-110">
                <svg className="w-3 h-3 fill-current translate-x-[0.5px]" viewBox="0 0 24 24">
                  <polygon points="7 4 19 12 7 20 7 4" />
                </svg>
              </span>
              <span>Watch the demo</span>
            </Link>
          </div>

          {/* Reassurance — removes the last bit of friction (needs its own plate:
              the background photo blows out to white right behind this line) */}
          <p className="hero-reassure mt-5 inline-flex flex-wrap items-center justify-center gap-x-3.5 gap-y-1.5 rounded-full border border-white/60 bg-white/75 px-4 py-2 text-[12.5px] font-[550] text-[#243b2b] shadow-[0_4px_18px_rgba(22,47,32,0.10)] backdrop-blur-md sm:text-[13px]">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 shrink-0 text-[#1d6b3a]" />
              Every agent, tool and integration unlocked on day one
            </span>
            <span className="hidden h-3.5 w-px bg-[#162f20]/20 sm:block" />
            <span>Recharge only when the 50 credits run out</span>
          </p>
        </div>
      </div>

      {/* ── Bottom Bar: Scroll Indicator (Left) & IDEAS — EXECUTION (Right) ── */}
      <div
        ref={bottomBarRef}
        className="relative z-10 w-full max-w-[1440px] mx-auto px-6 sm:px-10 md:px-14 lg:px-20 pb-7 sm:pb-9 pt-4 flex items-end justify-between select-none"
      >
        {/* Left Scroll Indicator */}
        <div className="flex flex-col items-start gap-1.5 select-none">
          <div className="w-px h-6 bg-white/50 ml-0.5" />
          <span className="text-[12px] tracking-wide text-white/85 font-normal">
            Scroll to explore
          </span>
        </div>

        {/* Right Stepper Marker */}
        <div className="flex items-center gap-2.5 text-[11px] font-mono tracking-[0.22em] text-white/85 uppercase select-none">
          <span>IDEAS</span>
          <span className="w-5 h-px bg-white/60" />
          <span>EXECUTION</span>
        </div>
      </div>

      {/* Subtle border into the next section */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-px bg-[var(--color-border)]" />
    </section>
  );
}
