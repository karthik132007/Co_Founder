"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

type Variant = "comet" | "aurora" | "orbit";

const STARS = [
  { left: "14%", top: "32%", size: 2, delay: "0s", dur: "3.4s" },
  { left: "27%", top: "62%", size: 1.5, delay: "1.1s", dur: "4.2s" },
  { left: "41%", top: "24%", size: 2, delay: "2.3s", dur: "3.8s" },
  { left: "58%", top: "66%", size: 1.5, delay: "0.6s", dur: "4.6s" },
  { left: "72%", top: "30%", size: 2, delay: "1.8s", dur: "3.2s" },
  { left: "86%", top: "58%", size: 1.5, delay: "2.9s", dur: "4s" },
];

function TwinkleStars({ count = 6 }: { count?: number }) {
  return (
    <>
      {STARS.slice(0, count).map((s, i) => (
        <span
          key={i}
          className="bridge-star pointer-events-none absolute rounded-full"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            background: "var(--color-accent)",
            opacity: 0.3,
            animationDelay: s.delay,
            ["--tw" as string]: s.dur,
          }}
        />
      ))}
    </>
  );
}

function EdgeBlend() {
  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-[var(--color-bg)]/60 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-[var(--color-bg)]/60 to-transparent" />
    </>
  );
}

function BridgeLabel({ children }: { children: string }) {
  return (
    <span className="relative font-mono text-[9px] md:text-[10px] tracking-[0.32em] uppercase text-[var(--color-text-dim)]">
      {children}
    </span>
  );
}

/* ── COMET — a small glowing comet glides across a faint static hairline.
      The hairline never draws itself — no progress-bar behaviour. ── */
function CometBridge({ label }: { label: string }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!root.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const el = root.current!;
      const head = el.querySelector<HTMLElement>(".bridge-comet-head");
      if (!head) return;
      gsap.fromTo(
        head,
        { left: "-4%", opacity: 0 },
        {
          left: "104%",
          opacity: 1,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top 95%", end: "bottom 5%", scrub: 0.9 },
        }
      );
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={root}
      className="relative h-[104px] md:h-[124px] overflow-hidden flex flex-col items-center justify-center gap-4"
      aria-hidden
    >
      <TwinkleStars count={4} />

      {/* faint static hairline — stays still, only the comet moves */}
      <div className="relative w-full max-w-3xl px-10 md:px-14">
        <div className="relative h-px w-full" style={{ background: "var(--color-border)" }}>
          <div className="bridge-comet-head absolute top-1/2 -translate-y-1/2" style={{ left: "-4%" }}>
            <div className="relative flex items-center">
              {/* short tail */}
              <span
                className="block h-px w-16 md:w-24"
                style={{ background: "linear-gradient(90deg, transparent, var(--color-accent))", opacity: 0.7 }}
              />
              {/* glowing head */}
              <span
                className="block h-1.5 w-1.5 -ml-px rounded-full"
                style={{
                  background: "var(--color-accent)",
                  boxShadow: "0 0 8px var(--color-accent-glow), 0 0 18px var(--color-accent-glow)",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <BridgeLabel>{label}</BridgeLabel>
      <EdgeBlend />
    </div>
  );
}

/* ── AURORA — a light glint sweeps along a hairline behind the label,
      flanked by two small soft glow orbs drifting on parallax.
      Crisp 1px elements only — nothing that reads as a progress bar. ── */
function AuroraBridge({ label }: { label: string }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!root.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const el = root.current!;
      gsap.utils.toArray<HTMLElement>(".bridge-orb").forEach((orb, i) => {
        gsap.fromTo(
          orb,
          { yPercent: 14 + i * 10 },
          {
            yPercent: -(14 + i * 10),
            ease: "none",
            scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 1.4 },
          }
        );
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={root}
      className="relative h-[112px] md:h-[132px] overflow-hidden flex items-center justify-center"
      aria-hidden
    >
      {/* small soft orbs — tiny and very faint, far off-center */}
      <div
        className="bridge-orb pointer-events-none absolute left-[6%] top-[18%] h-20 w-20 rounded-full"
        style={{
          background: "radial-gradient(circle, var(--color-accent-glow), transparent 70%)",
          filter: "blur(14px)",
          opacity: 0.35,
        }}
      />
      <div
        className="bridge-orb pointer-events-none absolute right-[8%] bottom-[14%] h-24 w-24 rounded-full"
        style={{
          background: "radial-gradient(circle, var(--color-accent-glow), transparent 70%)",
          filter: "blur(16px)",
          opacity: 0.28,
        }}
      />

      <TwinkleStars count={5} />

      {/* hairline + sweeping glint, label masked over the line */}
      <div className="relative w-full max-w-4xl px-10 md:px-16">
        <div className="relative h-px w-full" style={{ background: "var(--color-border)" }}>
          <span
            className="bridge-glint absolute top-1/2 -translate-y-1/2 h-px w-40 md:w-56"
            style={{
              background: "linear-gradient(90deg, transparent, var(--color-accent), transparent)",
              filter: "blur(0.5px)",
            }}
          />
        </div>
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--color-bg)] px-5">
          <BridgeLabel>{label}</BridgeLabel>
        </span>
      </div>

      <EdgeBlend />
    </div>
  );
}

/* ── ORBIT — delicate counter-rotating rings around a pulsing core,
      assembling gently as the viewport reaches them. ── */
function OrbitBridge({ label }: { label: string }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!root.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".bridge-orbit-core",
        { scale: 0.6, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          ease: "power2.out",
          scrollTrigger: { trigger: root.current!, start: "top 95%", end: "center 60%", scrub: 0.7 },
        }
      );
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={root}
      className="relative h-[128px] md:h-[148px] overflow-hidden flex flex-col items-center justify-center gap-4"
      aria-hidden
    >
      {/* faint crossing hairline */}
      <div className="pointer-events-none absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent" />

      <div className="bridge-orbit-core relative flex items-center justify-center">
        {/* outer ring — counter-rotating, carries a satellite */}
        <span
          className="bridge-ring-rev absolute h-24 w-24 md:h-28 md:w-28 rounded-full border border-dashed"
          style={{ borderColor: "var(--color-border)", ["--dur" as string]: "34s" }}
        >
          <span
            className="absolute -top-[2px] left-1/2 -translate-x-1/2 h-1 w-1 rounded-full"
            style={{ background: "var(--color-accent)", boxShadow: "0 0 8px var(--color-accent-glow)" }}
          />
        </span>
        {/* inner ring */}
        <span
          className="bridge-ring absolute h-14 w-14 md:h-16 md:w-16 rounded-full border border-dashed"
          style={{ borderColor: "var(--color-border)", ["--dur" as string]: "22s" }}
        />
        {/* pulsing core */}
        <span
          className="bridge-core relative h-1.5 w-1.5 rounded-full"
          style={{ background: "var(--color-accent)" }}
        />
      </div>

      <BridgeLabel>{label}</BridgeLabel>
      <EdgeBlend />
    </div>
  );
}

export function SectionBridge({
  variant = "comet",
  label = "onward",
}: {
  variant?: Variant;
  label?: string;
}) {
  if (variant === "aurora") return <AuroraBridge label={label} />;
  if (variant === "orbit") return <OrbitBridge label={label} />;
  return <CometBridge label={label} />;
}
