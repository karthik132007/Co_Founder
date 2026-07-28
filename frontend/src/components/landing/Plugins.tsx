"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Camera,
  ShoppingBag,
  Megaphone,
  Table2,
  Sparkles,
} from "lucide-react";
import { RevealHeading } from "./RevealHeading";
import { SectionBackground } from "./SectionBackground";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

/**
 * Plugins — integrations hub.
 *
 * A central AI Agent orchestrates every platform. Visual story:
 * agent sits at center, each platform is a polished card connected
 * by animated data lines. The agent controls them all.
 */

type Platform = {
  name: string;
  icon: React.ReactNode;
  color: string;
  label: string;
};

const PLATFORMS: Platform[] = [
  {
    name: "Instagram",
    icon: <Camera className="h-6 w-6" />,
    color: "#E4405F",
    label: "Posts & Stories",
  },
  {
    name: "Meta Ads",
    icon: <Megaphone className="h-6 w-6" />,
    color: "#0082FB",
    label: "Ad Campaigns",
  },
  {
    name: "Shopify",
    icon: <ShoppingBag className="h-6 w-6" />,
    color: "#96BF48",
    label: "Store & Products",
  },
  {
    name: "Google Ads",
    icon: <Megaphone className="h-6 w-6" />,
    color: "#FBBC04",
    label: "Search & Display",
  },
  {
    name: "Google Sheets",
    icon: <Table2 className="h-6 w-6" />,
    color: "#34A853",
    label: "Data & Reports",
  },
];

export function Plugins() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".plug-card", {
        opacity: 0,
        y: 40,
        scale: 0.9,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: { trigger: root.current, start: "top 70%" },
      });
      gsap.from(".plug-agent", {
        opacity: 0,
        scale: 0.5,
        duration: 1,
        ease: "elastic.out(1, 0.6)",
        scrollTrigger: { trigger: root.current, start: "top 70%" },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      id="plugins"
      className="relative py-32 md:py-48 overflow-hidden"
    >
      <SectionBackground variant="cool" />

      <div className="relative mx-auto max-w-5xl px-6">
        {/* Header */}
        <div className="mb-16 max-w-3xl text-center mx-auto">
          <div className="landing-eyebrow mb-6">05 — Integrations</div>
          <RevealHeading
            text="One agent. Every platform."
            className="landing-display text-[clamp(2rem,5vw,4rem)]"
          />
          <p className="mt-6 max-w-lg mx-auto text-[var(--color-text-muted)] text-lg leading-relaxed">
            Your AI agent connects to your entire stack — publishing,
            launching campaigns, syncing data — across every tool you use.
          </p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8 inline-flex items-center gap-2.5 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-2"
          >
            <span className="relative flex h-2 w-2">
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                style={{ background: "var(--color-accent)" }}
              />
              <span
                className="relative inline-flex h-2 w-2 rounded-full"
                style={{ background: "var(--color-accent)" }}
              />
            </span>
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
              Coming soon
            </span>
          </motion.div>
        </div>

        {/* ── Integration Hub Visual ── */}
        <div className="relative">
          {/* Connection lines layer */}
          <svg
            className="absolute inset-0 pointer-events-none hidden md:block"
            style={{ zIndex: 0 }}
            preserveAspectRatio="xMidYMid meet"
            viewBox="0 0 800 280"
          >
            {PLATFORMS.map((p, i) => {
              // Platform card centers (approximate x positions)
              const px = 125 + i * 150;
              const py = 140;
              // Agent center
              const ax = 400;
              const ay = 20;
              return (
                <g key={p.name}>
                  <line
                    x1={ax}
                    y1={ay + 24}
                    x2={px}
                    y2={py - 24}
                    stroke={
                      active === p.name
                        ? p.color
                        : "var(--color-border-strong)"
                    }
                    strokeWidth={active === p.name ? "1.5" : "0.8"}
                    strokeOpacity={active === p.name ? "0.7" : "0.2"}
                    strokeDasharray="4 4"
                  />
                  <circle r="3" fill={active === p.name ? p.color : "var(--color-accent)"}>
                    <animateMotion
                      dur={`${2 + i * 0.3}s`}
                      repeatCount="indefinite"
                      path={`M${ax},${ay + 24} L${px},${py - 24}`}
                    />
                  </circle>
                </g>
              );
            })}
          </svg>

          {/* Agent — top center */}
          <div className="flex justify-center mb-8 md:mb-12 relative" style={{ zIndex: 2 }}>
            <div className="plug-agent relative">
              <div className="flex flex-col items-center gap-4">
                {/* Agent badge */}
                <motion.div
                  animate={{ boxShadow: ["0 0 20px var(--color-accent-glow)", "0 0 40px var(--color-accent-glow)", "0 0 20px var(--color-accent-glow)"] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-[var(--color-accent)] bg-[var(--color-bg-soft)]"
                >
                  <div
                    className="absolute inset-0 rounded-2xl opacity-20 blur-md"
                    style={{ background: "var(--color-accent)" }}
                  />
                  <Sparkles
                    className="h-9 w-9"
                    style={{ color: "var(--color-accent)" }}
                  />
                </motion.div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-[var(--color-text)]">
                    AI Agent
                  </div>
                  <div className="text-[11px] text-[var(--color-text-dim)]">
                    Orchestrates everything
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Divider line */}
          <div className="flex items-center justify-center mb-8 md:mb-12 relative" style={{ zIndex: 1 }}>
            <div className="h-px w-full max-w-md bg-[var(--color-border)]" />
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--color-bg-soft)] border border-[var(--color-border)]">
              <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "var(--color-accent)" }} />
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-dim)]">
                connected to
              </span>
            </div>
          </div>

          {/* Platform cards — horizontal row */}
          <div className="relative" style={{ zIndex: 2 }}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {PLATFORMS.map((p) => {
                const isHot = active === p.name;
                return (
                  <motion.div
                    key={p.name}
                    className="plug-card"
                    onMouseEnter={() => setActive(p.name)}
                    onMouseLeave={() => setActive(null)}
                    onFocus={() => setActive(p.name)}
                    onBlur={() => setActive(null)}
                    whileHover={{ y: -6 }}
                    data-cursor="hover"
                  >
                    <div
                      className="relative flex flex-col items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-5 transition-all duration-300"
                      style={
                        isHot
                          ? {
                              borderColor: p.color,
                              boxShadow: `0 0 30px ${p.color}33`,
                            }
                          : undefined
                      }
                    >
                      {/* Connection dot */}
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                        <div
                          className="h-3 w-3 rounded-full border-2 border-[var(--color-bg-soft)] transition-colors duration-300"
                          style={{
                            background: isHot ? p.color : "var(--color-border-strong)",
                          }}
                        />
                      </div>

                      {/* Icon */}
                      <div
                        className="mt-1 transition-colors duration-300"
                        style={{ color: isHot ? p.color : "var(--color-text-muted)" }}
                      >
                        {p.icon}
                      </div>

                      {/* Name */}
                      <span
                        className="text-sm font-semibold transition-colors duration-300"
                        style={{ color: isHot ? p.color : "var(--color-text)" }}
                      >
                        {p.name}
                      </span>

                      {/* Label */}
                      <span className="text-[11px] text-[var(--color-text-dim)]">
                        {p.label}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
