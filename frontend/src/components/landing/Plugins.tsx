"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link2, Zap, BarChart3, Mail, Blocks } from "lucide-react";
import { SectionBackground } from "./SectionBackground";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

/**
 * Plugins — integrations as a hub-and-spoke system.
 *
 * Left: the narrative — heading plus the three things that make the
 * integrations worth caring about. Right: the CEO Agent core with every
 * platform tethered to it by a drawn connector. Hover a card and its
 * line ignites; data dots flow continuously into the core.
 *
 * Connector geometry is computed in a 100×100 stage space and the cards
 * are positioned with the same coordinates, so lines always meet their
 * cards at any viewport size. Below `lg` the hub swaps for a compact
 * grid so nothing ever overlaps or clips.
 */

type Platform = {
  name: string;
  sub: string;
  img?: string; // brand SVG from /public
  Icon?: typeof Mail; // lucide fallback
  x: number; // stage coords (0–100)
  y: number;
};

const PLATFORMS: Platform[] = [
  { name: "Instagram", sub: "Content & Insights", img: "/instagram.svg", x: 50, y: 7 },
  { name: "Google Ads", sub: "Campaigns & Performance", img: "/google_ads-icon.svg", x: 19, y: 16 },
  { name: "Meta Ads", sub: "Ads Manager & Analytics", img: "/meta.svg", x: 81, y: 16 },
  { name: "Google Sheets", sub: "Data & Reports", img: "/google-sheets.svg", x: 14, y: 50 },
  { name: "Shopify", sub: "Orders & Sales Data", img: "/shopify.svg", x: 86, y: 50 },
  { name: "Razorpay", sub: "Payments & Checkout", img: "/razorpay-mark.svg", x: 19, y: 84 },
  { name: "More Tools", sub: "Connect Anything via APIs", Icon: Blocks, x: 81, y: 84 },
  { name: "Email", sub: "Alerts & Notifications", Icon: Mail, x: 50, y: 93 },
];

const POINTS = [
  {
    Icon: Link2,
    title: "Seamless integrations",
    desc: "Connect your favorite platforms in minutes.",
  },
  {
    Icon: Zap,
    title: "Automate & act",
    desc: "The CEO Agent takes action — not just notes.",
  },
  {
    Icon: BarChart3,
    title: "Unified intelligence",
    desc: "Every tool's data, working as one.",
  },
];

/** Curved connector from the orbit ring out to a card, in stage coords. */
function connectorPath(
  cx: number,
  cy: number,
  px: number,
  py: number,
  ringR: number,
  pull: number,
  bend: number
) {
  const dx = cx - px;
  const dy = cy - py;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const sx = cx + ux * ringR;
  const sy = cy + uy * ringR;
  const ex = px - ux * pull;
  const ey = py - uy * pull;
  const mx = (sx + ex) / 2 - uy * bend;
  const my = (sy + ey) / 2 + ux * bend;
  return { d: `M ${sx.toFixed(2)} ${sy.toFixed(2)} Q ${mx.toFixed(2)} ${my.toFixed(2)} ${ex.toFixed(2)} ${ey.toFixed(2)}`, ex, ey };
}

export function Plugins() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState<number | null>(null);

  // track prefers-reduced-motion the React-compiler-approved way
  const motionOk = useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".hub-reveal", {
        opacity: 0,
        y: 36,
        duration: 1,
        ease: "expo.out",
        stagger: 0.1,
        scrollTrigger: { trigger: root.current, start: "top 72%" },
      });
      gsap.from(".hub-point", {
        opacity: 0,
        x: -28,
        duration: 0.9,
        ease: "expo.out",
        stagger: 0.12,
        scrollTrigger: { trigger: ".hub-points", start: "top 82%" },
      });
      // connector lines draw themselves outward — ensure dash array is set for offset animation
      gsap.from(".hub-line", {
        strokeDasharray: 1,
        strokeDashoffset: 1,
        duration: 1.2,
        ease: "power2.inOut",
        stagger: 0.08,
        scrollTrigger: { trigger: ".hub-stage", start: "top 75%" },
      });
      gsap.from(".hub-card", {
        opacity: 0,
        y: 22,
        scale: 0.94,
        duration: 0.9,
        ease: "expo.out",
        stagger: 0.07,
        scrollTrigger: { trigger: ".hub-stage", start: "top 75%" },
      });
      gsap.from(".hub-core", {
        opacity: 0,
        scale: 0.7,
        duration: 1.2,
        ease: "expo.out",
        scrollTrigger: { trigger: ".hub-stage", start: "top 75%" },
      });
      // fallback — if ScrollTrigger never fires (e.g. hidden hub-stage on mobile, or fast scroll), ensure cards are visible
      gsap.delayedCall(1.4, () => {
        if (!root.current) return;
        // force reveal any element still at opacity 0 due to from() not completing
        root.current.querySelectorAll<HTMLElement>(".hub-card, .hub-core, .hub-line, .hub-reveal, .hub-point").forEach((el) => {
          const cs = getComputedStyle(el);
          if (cs.opacity === "0") {
            gsap.set(el, { opacity: 1, clearProps: "transform" });
          }
        });
        ScrollTrigger.refresh();
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      id="plugins"
      className="relative py-24 md:py-32 overflow-hidden"
      style={{ isolation: "isolate" }}
    >
      <div className="pointer-events-none absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-black/[0.04] to-transparent" />
      <div className="pointer-events-none absolute top-0 inset-x-0 h-[32px] md:h-[48px] bg-gradient-to-b from-[var(--color-bg)]/40 to-transparent opacity-30" />
      <SectionBackground variant="cool" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid gap-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10 xl:gap-16 items-center">
          {/* ── Left: narrative ── */}
          <div>
            <div className="hub-reveal landing-eyebrow mb-6">05 — Integrations</div>
            <h2 className="hub-reveal landing-display text-[clamp(2.2rem,5vw,4.4rem)]">
              One agent.
              <br />
              <span style={{ color: "var(--color-accent)" }}>Every platform.</span>
            </h2>
            <p className="hub-reveal mt-7 max-w-md text-[var(--color-text-muted)] text-lg leading-relaxed">
              The CEO Agent connects with the tools you already use — so you
              can run, automate, and grow your business from a single command
              center.
            </p>

            <div className="hub-points mt-12 space-y-8">
              {POINTS.map((pt) => (
                <div key={pt.title} className="hub-point flex items-start gap-4">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
                    style={{
                      background: "var(--color-surface)",
                      borderColor: "var(--color-border)",
                    }}
                  >
                    <pt.Icon
                      className="h-5 w-5"
                      style={{ color: "var(--color-accent)" }}
                      strokeWidth={1.75}
                    />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-medium tracking-tight">
                      {pt.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
                      {pt.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: the hub (desktop) ── */}
          <div className="hub-stage relative mx-auto hidden w-full max-w-[620px] aspect-square lg:block">
            {/* connectors + orbit ring */}
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 100 100"
              aria-hidden
            >
              <circle
                className="hub-orbit"
                cx="50"
                cy="50"
                r="22"
                fill="none"
                stroke="var(--color-border-strong)"
                strokeWidth="1"
                strokeDasharray="0.6 2.2"
                vectorEffect="non-scaling-stroke"
              />
              {PLATFORMS.map((p, i) => {
                const { d, ex, ey } = connectorPath(50, 50, p.x, p.y, 22, 8, i % 2 ? -6 : 6);
                const isActive = active === i;
                return (
                  <g key={p.name}>
                    <path
                      className="hub-line"
                      d={d}
                      fill="none"
                      pathLength={1}
                      stroke={isActive ? "var(--color-accent)" : "var(--color-border-strong)"}
                      strokeWidth={isActive ? "1.5" : "1"}
                      strokeOpacity={isActive ? "0.85" : "0.4"}
                      vectorEffect="non-scaling-stroke"
                    />
                    <circle
                      cx={ex}
                      cy={ey}
                      r="1.1"
                      fill={isActive ? "var(--color-accent)" : "var(--color-border-strong)"}
                    />
                    {motionOk && (
                      <circle r="0.9" fill="var(--color-accent)" opacity="0.7">
                        <animateMotion dur={`${6 + (i % 3) * 1.7}s`} begin={`${i * -1.3}s`} repeatCount="indefinite" path={d} />
                      </circle>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* agent core */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div
                className="hub-core flex h-52 w-52 flex-col items-center justify-center rounded-full glass-strong text-center xl:h-60 xl:w-60"
                style={{ boxShadow: "0 0 60px var(--color-accent-glow)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon.png" alt="" className="h-10 w-10 rounded-xl object-contain" />
                <div className="landing-display mt-3 text-2xl xl:text-[1.7rem]">CEO Agent</div>
                <div className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-text-dim)]">
                  Your AI Co-Founder
                </div>
              </div>
            </div>

            {/* platform cards */}
            {PLATFORMS.map((p, i) => {
              const isActive = active === i;
              return (
                <div
                  key={p.name}
                  className="absolute z-10"
                  style={{
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <div className="hub-bob" style={{ animationDelay: `${i * -1.15}s` }}>
                    <div
                      onMouseEnter={() => setActive(i)}
                      onMouseLeave={() => setActive(null)}
                      onFocus={() => setActive(i)}
                      onBlur={() => setActive(null)}
                      data-cursor="hover"
                      tabIndex={0}
                      className={`hub-card flex w-40 items-center gap-3 rounded-2xl glass p-3 transition-all duration-500 xl:w-44 xl:p-3.5 ${
                        isActive ? "-translate-y-1" : "hover:-translate-y-0.5"
                      }`}
                      style={{
                        borderColor: isActive ? "var(--color-accent)" : undefined,
                        boxShadow: isActive ? "0 12px 36px var(--color-accent-glow)" : undefined,
                      }}
                    >
                      {p.img ? (
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border shadow-sm"
                          style={{
                            background: "var(--color-bg-soft)",
                            borderColor: "var(--color-border)",
                            isolation: "isolate",
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.img}
                            alt={`${p.name} logo`}
                            width={20}
                            height={20}
                            className="h-5 w-5 object-contain relative z-10"
                            loading="eager"
                            decoding="async"
                            style={{ display: "block" }}
                            onError={(e) => {
                              const t = e.currentTarget as HTMLImageElement;
                              t.style.display = "none";
                              const fallback = t.nextElementSibling as HTMLElement | null;
                              if (fallback) fallback.style.display = "flex";
                            }}
                          />
                          <span className="hidden h-5 w-5 items-center justify-center">
                            <Blocks className="h-4 w-4" style={{ color: "var(--color-accent)" }} />
                          </span>
                        </span>
                      ) : (
                        p.Icon && (
                          <span
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
                            style={{
                              background: "var(--color-surface)",
                              borderColor: "var(--color-border)",
                            }}
                          >
                            <p.Icon
                              className="h-4 w-4"
                              style={{ color: "var(--color-accent)" }}
                              strokeWidth={1.75}
                            />
                          </span>
                        )
                      )}
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-medium tracking-tight">{p.name}</div>
                        <div className="truncate text-[10.5px] leading-snug text-[var(--color-text-dim)]">
                          {p.sub}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Right: compact stack (mobile / tablet) ── */}
          <div className="lg:hidden">
            <div
              className="mx-auto flex max-w-xs flex-col items-center rounded-3xl glass-strong px-8 py-8 text-center"
              style={{ boxShadow: "0 0 50px var(--color-accent-glow)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon.png" alt="" className="h-11 w-11 rounded-xl object-contain" />
              <div className="landing-display mt-3 text-2xl">CEO Agent</div>
              <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-text-dim)]">
                Your AI Co-Founder
              </div>
            </div>
            <div className="mx-auto mt-6 grid max-w-md grid-cols-2 gap-3">
              {PLATFORMS.map((p) => (
                <div key={p.name} className="flex items-center gap-2.5 rounded-2xl glass p-3" style={{ isolation: "isolate" }}>
                  {p.img ? (
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border shadow-sm"
                      style={{
                        background: "var(--color-bg-soft)",
                        borderColor: "var(--color-border)",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.img}
                        alt={`${p.name} logo`}
                        width={16}
                        height={16}
                        className="h-4 w-4 object-contain relative z-10"
                        loading="eager"
                        decoding="async"
                        style={{ display: "block" }}
                        onError={(e) => {
                          const t = e.currentTarget as HTMLImageElement;
                          t.style.display = "none";
                        }}
                      />
                    </span>
                  ) : (
                    p.Icon && (
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border"
                        style={{
                          background: "var(--color-surface)",
                          borderColor: "var(--color-border)",
                        }}
                      >
                        <p.Icon
                          className="h-4 w-4"
                          style={{ color: "var(--color-accent)" }}
                          strokeWidth={1.75}
                        />
                      </span>
                    )
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium">{p.name}</div>
                    <div className="truncate text-[10px] text-[var(--color-text-dim)]">{p.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
