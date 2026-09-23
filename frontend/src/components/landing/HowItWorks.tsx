"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, RefreshCw } from "lucide-react";
import { RevealHeading } from "./RevealHeading";

/**
 * "01 — How it works" — the orchestration stage.
 *
 * A deliberately dark "theatre" panel on the light page (the pattern Linear,
 * Vercel and Stripe use for their product visuals). Inside it: the CEO core at
 * the centre, the six specialists on a ring around it, your brief feeding in
 * from the top and finished work leaving at the bottom. The four steps on the
 * left drive the stage — pulses travel outward on "Route", back inward on
 * "Verify", and the deliverable chips materialise on "Ship".
 *
 * Colours inside the panel are hard-coded on purpose: the panel stays dark in
 * both themes, so the landing's themed `--color-*` tokens do not apply here.
 */

const T = {
  accent: "#7cc99a",
  accentSoft: "rgba(124, 201, 154, 0.14)",
  accentLine: "rgba(124, 201, 154, 0.45)",
  line: "rgba(255, 255, 255, 0.12)",
  lineSoft: "rgba(255, 255, 255, 0.06)",
  text: "rgba(255, 255, 255, 0.92)",
  muted: "rgba(255, 255, 255, 0.55)",
  dim: "rgba(255, 255, 255, 0.34)",
  warm: "#c2a273",
  warmLine: "rgba(194, 162, 115, 0.55)",
};

const CENTRE = { x: 50, y: 50 };
const RING_R = 34;

/** Specialists sit on the ring; the top and bottom stay clear for brief → deliver. */
const AGENTS = [
  { id: "researcher", name: "Researcher", angle: 300, bow: 5 },
  { id: "writer", name: "Writer", angle: 0, bow: -5 },
  { id: "cmo", name: "CMO", angle: 60, bow: 5 },
  { id: "analyst", name: "Analyst", angle: 120, bow: -5 },
  { id: "designer", name: "Designer", angle: 180, bow: 5 },
  { id: "judge", name: "Judge", angle: 240, bow: -5 },
].map((a) => {
  const rad = (a.angle * Math.PI) / 180;
  // rounded: keeps the SSR and client inline styles byte-identical (no hydration diff)
  const x = Number((50 + RING_R * Math.cos(rad)).toFixed(2));
  const y = Number((50 + RING_R * Math.sin(rad)).toFixed(2));
  return { ...a, x, y };
});

/** Curved connector between two points, padded at both ends so it meets the cards. */
function connector(
  from: { x: number; y: number },
  to: { x: number; y: number },
  startPad: number,
  endPad: number,
  bow: number
) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const sx = from.x + ux * startPad;
  const sy = from.y + uy * startPad;
  const ex = to.x - ux * endPad;
  const ey = to.y - uy * endPad;
  const mx = (sx + ex) / 2 - uy * bow;
  const my = (sy + ey) / 2 + ux * bow;
  return `M ${sx.toFixed(2)} ${sy.toFixed(2)} Q ${mx.toFixed(2)} ${my.toFixed(2)} ${ex.toFixed(2)} ${ey.toFixed(2)}`;
}

const BRIEF_PATH = "M 50 11 L 50 37";
const SHIP_PATH = "M 50 63 L 50 87";
const OUT_PATHS = AGENTS.map((a) => connector(CENTRE, a, 12, 10, a.bow));
const BACK_PATHS = AGENTS.map((a) => connector(a, CENTRE, 10, 12, -a.bow));

/** A dot travelling along a connector — the work moving through the system. */
function Pulse({ d, dur, delay = 0, r = 1 }: { d: string; dur: number; delay?: number; r?: number }) {
  return (
    <circle r={r} fill={T.accent}>
      <animateMotion dur={`${dur}s`} begin={`${delay}s`} repeatCount="indefinite" path={d} />
    </circle>
  );
}

type Step = {
  n: string;
  tab: string;
  line: string;
  desc: string;
  readout: string;
};

const STEPS: Step[] = [
  {
    n: "01",
    tab: "Brief",
    line: "You say it once",
    desc: "A sentence, a goal, or a file you already have. No forms, no prompt engineering, no setup — the CEO takes it from there.",
    readout: "1 brief in",
  },
  {
    n: "02",
    tab: "Route",
    line: "The CEO splits it apart",
    desc: "Your goal becomes a task list, and every task goes to the specialist that owns it. Research, numbers and copy run side by side — not one after another.",
    readout: "6 dispatched",
  },
  {
    n: "03",
    tab: "Verify",
    line: "The Judge pushes back",
    desc: "Nothing reaches you unchecked. Outputs are scored against your brief, and whatever misses the bar goes straight back to the agent that wrote it.",
    readout: "1 sent back",
  },
  {
    n: "04",
    tab: "Ship",
    line: "You take delivery",
    desc: "Briefs, price ladders, campaign calendars and brand assets land in your workspace — finished work you can hand to anyone.",
    readout: "signed off",
  },
];

const DELIVERABLES = ["brief.md", "pricing.csv", "campaign.pdf", "hero.png"];
const ADVANCE_MS = 7000;

export function HowItWorks() {
  const [phase, setPhase] = useState(0);
  const [paused, setPaused] = useState(false);
  const [motionOk, setMotionOk] = useState(false);

  useEffect(() => {
    setMotionOk(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (!motionOk || paused) return;
    const t = window.setTimeout(() => setPhase((p) => (p + 1) % STEPS.length), ADVANCE_MS);
    return () => window.clearTimeout(t);
  }, [phase, paused, motionOk]);

  const select = useCallback((i: number) => {
    setPhase(i);
    setPaused(true);
  }, []);

  const step = STEPS[phase];
  const routing = phase === 1;
  const verifying = phase === 2;
  const shipping = phase === 3;

  return (
    <section id="how" className="relative py-16 sm:py-24 md:py-32 overflow-hidden">
      <div className="relative mx-auto max-w-7xl px-5 sm:px-6">
        <div className="mb-10 sm:mb-12 md:mb-14 max-w-3xl">
          <div className="landing-eyebrow mb-5 sm:mb-6">01 — How it works</div>
          <RevealHeading
            text="Watch the whole company run."
            className="landing-display text-[clamp(2.1rem,5.6vw,4.4rem)]"
          />
          <p className="mt-6 sm:mt-7 max-w-xl text-[17px] sm:text-lg leading-relaxed text-[var(--color-text-muted)]">
            One brief goes in. Seven specialists plan, execute and check each
            other until the work is right — then it lands in your workspace,
            finished.
          </p>
        </div>

        {/* ── the theatre ── */}
        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          className="relative overflow-hidden rounded-[28px] border p-4 pb-6 sm:rounded-[36px] sm:p-7 lg:p-9"
          style={{ borderColor: "rgba(255,255,255,0.09)", background: "#08130d" }}
        >
          {/* ambience */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)",
              backgroundSize: "46px 46px",
              WebkitMaskImage:
                "radial-gradient(ellipse 72% 78% at 68% 50%, #000 18%, transparent 76%)",
              maskImage: "radial-gradient(ellipse 72% 78% at 68% 50%, #000 18%, transparent 76%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute h-[560px] w-[560px] rounded-full"
            style={{
              right: "-10%",
              top: "50%",
              transform: "translateY(-50%)",
              background: "radial-gradient(circle, rgba(124,201,154,0.18), transparent 68%)",
              filter: "blur(26px)",
            }}
          />

          <div className="relative grid grid-cols-1 items-center gap-7 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-10">
            {/* ── steps ── */}
            <div className="order-2 min-w-0 lg:order-1">
              <ol className="space-y-1.5">
                {STEPS.map((s, i) => {
                  const on = i === phase;
                  return (
                    <li key={s.n}>
                      <button
                        type="button"
                        onClick={() => select(i)}
                        aria-current={on}
                        className="relative w-full overflow-hidden rounded-2xl border px-4 py-3.5 text-left transition-colors duration-500"
                        style={{
                          borderColor: on ? T.accentLine : "transparent",
                          background: on ? T.accentSoft : "transparent",
                        }}
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className="font-mono text-[10px] transition-colors duration-500"
                            style={{ color: on ? T.accent : T.dim }}
                          >
                            {s.n}
                          </span>
                          <span
                            className="text-[15px] font-medium tracking-[-0.01em] transition-colors duration-500"
                            style={{ color: on ? T.text : T.muted }}
                          >
                            {s.tab}
                          </span>
                          {on && (
                            <span
                              className="ml-auto hidden font-mono text-[9.5px] uppercase tracking-[0.14em] sm:inline"
                              style={{ color: T.dim }}
                            >
                              {s.readout}
                            </span>
                          )}
                        </span>

                        {/* expanding detail */}
                        <span
                          className="grid transition-[grid-template-rows] duration-500 ease-out"
                          style={{ gridTemplateRows: on ? "1fr" : "0fr" }}
                        >
                          <span className="overflow-hidden">
                            <span className="block pt-2.5 pl-[26px]">
                              <span className="block text-[13.5px] font-medium" style={{ color: T.text }}>
                                {s.line}
                              </span>
                              <span
                                className="mt-1.5 block max-w-md text-[13px] leading-relaxed"
                                style={{ color: T.muted }}
                              >
                                {s.desc}
                              </span>
                            </span>
                          </span>
                        </span>

                        {/* auto-advance indicator */}
                        <span className="absolute inset-x-0 bottom-0 h-[2px] overflow-hidden">
                          {on && (
                            <span
                              key={`${phase}-${paused}-${motionOk}`}
                              className="step-advance block h-full origin-left"
                              style={{
                                background: T.accent,
                                animationDuration: `${ADVANCE_MS}ms`,
                                animationPlayState: paused || !motionOk ? "paused" : "running",
                              }}
                            />
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* ── stage ── */}
            <div className="order-1 min-w-0 lg:order-2">
              <div className="relative mx-auto aspect-square w-full max-w-[360px] sm:max-w-[440px]">
                <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
                  {/* orbit rings */}
                  <circle
                    cx={50}
                    cy={50}
                    r={27}
                    fill="none"
                    stroke={T.lineSoft}
                    strokeWidth="0.3"
                    strokeDasharray="1 3"
                    className="stage-ring"
                    style={{ ["--dur" as string]: "60s" }}
                  />
                  <circle
                    cx={50}
                    cy={50}
                    r={41}
                    fill="none"
                    stroke={T.lineSoft}
                    strokeWidth="0.3"
                    strokeDasharray="0.6 4"
                    className="stage-ring-rev"
                    style={{ ["--dur" as string]: "90s" }}
                  />

                  {/* brief → core */}
                  <path
                    d={BRIEF_PATH}
                    fill="none"
                    strokeWidth="0.35"
                    stroke={phase === 0 ? T.accentLine : T.line}
                    strokeLinecap="round"
                  />
                  {/* core → each specialist */}
                  {OUT_PATHS.map((d, i) => (
                    <path
                      key={`out-${AGENTS[i].id}`}
                      d={d}
                      fill="none"
                      strokeWidth={routing || verifying ? "0.4" : "0.3"}
                      stroke={routing || verifying ? T.accentLine : T.line}
                      strokeLinecap="round"
                    />
                  ))}
                  {/* core → deliverables */}
                  <path
                    d={SHIP_PATH}
                    fill="none"
                    strokeWidth="0.35"
                    stroke={shipping ? T.accentLine : T.line}
                    strokeLinecap="round"
                  />

                  {motionOk && (
                    <g key={phase}>
                      {phase === 0 && <Pulse d={BRIEF_PATH} dur={1.9} />}
                      {routing && OUT_PATHS.map((d, i) => <Pulse key={`r-${i}`} d={d} dur={2.4} delay={i * 0.28} />)}
                      {verifying && BACK_PATHS.map((d, i) => <Pulse key={`v-${i}`} d={d} dur={2.2} delay={i * 0.3} r={0.85} />)}
                      {shipping && <Pulse d={SHIP_PATH} dur={1.6} delay={0.15} />}
                    </g>
                  )}
                </svg>

                {/* core — the CEO */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div
                    aria-hidden
                    className="core-glow pointer-events-none absolute -inset-6 rounded-full"
                    style={{ background: "radial-gradient(circle, rgba(124,201,154,0.32), transparent 68%)" }}
                  />
                  <div
                    className="relative flex h-[86px] w-[86px] flex-col items-center justify-center rounded-full border text-center sm:h-[104px] sm:w-[104px]"
                    style={{
                      borderColor: T.accentLine,
                      background:
                        "radial-gradient(circle at 50% 35%, rgba(124,201,154,0.22), rgba(8,19,13,0.94) 72%)",
                    }}
                  >
                    <span className="text-[12px] font-semibold tracking-[-0.01em] text-white sm:text-[14px]">
                      CEO
                    </span>
                    <span
                      className="mt-0.5 font-mono text-[7px] uppercase tracking-[0.16em] sm:text-[8px]"
                      style={{ color: T.muted }}
                    >
                      orchestrator
                    </span>
                  </div>
                </div>

                {/* brief in */}
                <div className="absolute left-1/2 top-[7%] -translate-x-1/2 -translate-y-1/2">
                  <span
                    className="block whitespace-nowrap rounded-full border px-3 py-1 font-mono text-[8.5px] uppercase tracking-[0.18em] transition-colors duration-500 sm:text-[9.5px]"
                    style={{
                      borderColor: phase === 0 ? T.accentLine : T.line,
                      background: "rgba(8,19,13,0.85)",
                      color: phase === 0 ? T.accent : T.dim,
                    }}
                  >
                    Your brief
                  </span>
                </div>

                {/* specialists */}
                {AGENTS.map((a) => {
                  const on = routing || verifying;
                  const isJudge = a.id === "judge";
                  const rerun = verifying && a.id === "analyst";
                  const settled = shipping;
                  return (
                    <div
                      key={a.id}
                      className="absolute -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${a.x}%`, top: `${a.y}%` }}
                    >
                      <div
                        className="flex items-center gap-1.5 rounded-full border px-2 py-1 transition-all duration-500 sm:px-2.5 sm:py-1.5"
                        style={{
                          borderColor: rerun ? T.warmLine : on ? T.accentLine : T.line,
                          background: "rgba(8,19,13,0.85)",
                          opacity: phase === 0 ? 0.45 : 1,
                          boxShadow: isJudge && verifying ? `0 0 20px ${T.accentSoft}` : undefined,
                        }}
                      >
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: rerun ? T.warm : on ? T.accent : T.dim }}
                        />
                        <span
                          className="whitespace-nowrap text-[9px] font-medium tracking-[-0.01em] sm:text-[11px]"
                          style={{ color: on || settled ? T.text : T.muted }}
                        >
                          {a.name}
                        </span>
                        {rerun && <RefreshCw className="h-2.5 w-2.5" style={{ color: T.warm }} />}
                        {settled && <Check className="h-2.5 w-2.5" strokeWidth={3.5} style={{ color: T.accent }} />}
                      </div>
                    </div>
                  );
                })}

                {/* deliverables out */}
                <div className="absolute bottom-0 left-1/2 w-full -translate-x-1/2">
                  <div className="flex flex-col items-center gap-1.5">
                    <span
                      className="font-mono text-[8.5px] uppercase tracking-[0.18em] transition-colors duration-500 sm:text-[9.5px]"
                      style={{ color: shipping ? T.accent : T.dim }}
                    >
                      Deliverables
                    </span>
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {DELIVERABLES.map((f, i) => (
                        <span
                          key={f}
                          className="rounded-md border px-2 py-0.5 font-mono text-[8.5px] transition-all duration-500 sm:text-[9.5px]"
                          style={{
                            borderColor: shipping ? T.accentLine : T.line,
                            background: "rgba(8,19,13,0.85)",
                            color: shipping ? T.text : T.dim,
                            opacity: shipping ? 1 : 0.3,
                            transform: shipping ? "translateY(0)" : "translateY(4px)",
                            transitionDelay: `${i * 90}ms`,
                          }}
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* live status line under the stage */}
              <div className="mt-5 flex items-center justify-center gap-2.5 sm:mt-6">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: T.accent, boxShadow: `0 0 10px ${T.accent}` }}
                />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: T.muted }}>
                  {step.n} · {step.line}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* what the loop buys you */}
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 sm:mt-10">
          {[
            "Brief in, brief + campaign + model + asset out",
            "Every output Judge-checked before you see it",
            "One shared memory across all seven specialists",
          ].map((label) => (
            <span key={label} className="flex items-center gap-2 text-[13.5px] text-[var(--color-text-muted)]">
              <Check className="h-3.5 w-3.5" style={{ color: "var(--color-accent)" }} strokeWidth={3} />
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
