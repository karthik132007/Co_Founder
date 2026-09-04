"use client";

import { useEffect, useRef, useState } from "react";
import { RevealHeading } from "./RevealHeading";
import { SectionBackground } from "./SectionBackground";

/**
 * Terminal simulation — types out a CEO → Research → Engineer handoff with
 * streaming characters and a live "growth" graph drawn on a tiny canvas.
 * Loops while in view via IntersectionObserver.
 */

type Line = { kind: "prompt" | "cmd" | "out" | "accent" | "ok"; text: string };

const SCRIPT: Line[] = [
  { kind: "prompt", text: "cofounder >" },
  { kind: "cmd", text: " build a competitor to linear for non-technical founders" },
  { kind: "out", text: "" },
  { kind: "accent", text: "▸ CEO: clarifying objective…" },
  { kind: "out", text: "  · MCQ: target segment? [solo / agency / enterprise]" },
  { kind: "ok", text: "  ✓ user selected: solo founders" },
  { kind: "out", text: "" },
  { kind: "accent", text: "▸ CEO: planning delegation…" },
  { kind: "out", text: "  · research → market evidence" },
  { kind: "out", text: "  · writer → positioning narrative" },
  { kind: "out", text: "  · cmo → growth angles" },
  { kind: "out", text: "" },
  { kind: "accent", text: "▸ researcher: scanning 142 sources…" },
  { kind: "ok", text: "  ✓ 3 underserved segments identified" },
  { kind: "ok", text: "  ✓ pricing ceiling: $24/mo" },
  { kind: "out", text: "" },
  { kind: "accent", text: "▸ RAG: retrieving company memory…" },
  { kind: "ok", text: "  ✓ 8 relevant chunks fused (0.7 semantic + 0.3 keyword)" },
  { kind: "out", text: "" },
  { kind: "accent", text: "▸ writer: drafting narrative (temp 0.7)…" },
  { kind: "accent", text: "▸ judge: scoring output… 8/10 ✓ above threshold" },
  { kind: "ok", text: "  ✓ positioning + hero copy ready" },
  { kind: "out", text: "" },
  { kind: "accent", text: "▸ cmo: building campaign from trends…" },
  { kind: "ok", text: "  ✓ 3 ad angles, 1 hero narrative, content calendar" },
  { kind: "out", text: "" },
  { kind: "accent", text: "▸ CEO: synthesizing response…" },
  { kind: "ok", text: "  ✓ markdown brief + MCQ next-steps delivered" },
  { kind: "out", text: "" },
  { kind: "prompt", text: "cofounder >" },
  { kind: "cmd", text: " ship it" },
  { kind: "ok", text: "▸ deliverables assembled into company brief" },
];

export function Demo() {
  const root = useRef<HTMLElement>(null);
  const termRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lines, setLines] = useState<{ line: Line; chars: number }[]>([]);
  const [running, setRunning] = useState(false);

  // Typewriter
  useEffect(() => {
    if (!running) return;
    let lineIdx = 0;
    let charIdx = 0;
    let timer: ReturnType<typeof setTimeout>;
    setLines([]);

    const tick = () => {
      if (lineIdx >= SCRIPT.length) {
        // pause then restart
        timer = setTimeout(() => {
          setRunning(false);
          setTimeout(() => setRunning(true), 1200);
        }, 4000);
        return;
      }
      const line = SCRIPT[lineIdx];
      charIdx += 1;
      setLines((prev) => {
        const next = [...prev];
        if (!next[lineIdx]) next[lineIdx] = { line, chars: 0 };
        next[lineIdx] = { line, chars: charIdx };
        return next;
      });
      if (charIdx >= line.text.length) {
        lineIdx += 1;
        charIdx = 0;
        timer = setTimeout(tick, line.kind === "prompt" ? 200 : 280);
      } else {
        timer = setTimeout(tick, 18 + Math.random() * 30);
      }
    };
    timer = setTimeout(tick, 400);
    return () => clearTimeout(timer);
  }, [running]);

  // Auto-scroll terminal to bottom as text types in
  useEffect(() => {
    const el = termRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  // Start when in view
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && setRunning(true),
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Live graph
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const data: number[] = [];
    const max = 60;
    let t = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();

    const draw = () => {
      t += 0.04;
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      data.push(50 + Math.sin(t) * 18 + Math.sin(t * 2.3) * 8 + Math.random() * 4);
      if (data.length > max) data.shift();

      // grid
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const y = (rect.height / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(rect.width, y);
        ctx.stroke();
      }

      // line — forest palette to match hero
      const grad = ctx.createLinearGradient(0, 0, rect.width, 0);
      grad.addColorStop(0, "rgba(20,54,32,0.06)");
      grad.addColorStop(1, "#143620");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      data.forEach((v, i) => {
        const x = (i / (max - 1)) * rect.width;
        const y = rect.height - (v / 100) * rect.height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // fill
      ctx.lineTo(rect.width, rect.height);
      ctx.lineTo(0, rect.height);
      ctx.closePath();
      ctx.fillStyle = "rgba(20,54,32,0.06)";
      ctx.fill();

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <section ref={root} id="demo" className="relative py-24 md:py-32 overflow-hidden" style={{ isolation: "isolate" }}>
      <div className="pointer-events-none absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-black/[0.04] to-transparent" />
      <div className="pointer-events-none absolute top-0 inset-x-0 h-[36px] md:h-[48px] bg-gradient-to-b from-[var(--color-bg)] to-transparent opacity-30" />
      <SectionBackground variant="default" />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mb-16 max-w-3xl">
          <div className="landing-eyebrow mb-6">04 — In motion</div>
          <RevealHeading
            text="Watch it run."
            className="landing-display text-[clamp(2.2rem,6vw,5rem)]"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Terminal */}
          <div className="terminal relative rounded-2xl glass-strong p-6 md:p-8 h-[420px] overflow-y-auto">
            <div className="flex items-center gap-2 mb-6">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              <span className="ml-3 text-xs text-[var(--color-text-dim)]">
                cofounder — live session
              </span>
            </div>
            <div ref={termRef} className="space-y-1.5">
              {lines.map((l, i) => (
                l && l.line ? (
                <div key={i} className="whitespace-pre-wrap">
                  <span className={l.line.kind}>
                    {l.line.text.slice(0, l.chars)}
                    {i === lines.length - 1 && l.chars < l.line.text.length && (
                      <span className="caret" />
                    )}
                  </span>
                </div>
                ) : null
              ))}
            </div>
          </div>

          {/* Live graph */}
          <div className="relative rounded-2xl glass p-6 md:p-8 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm text-[var(--color-text-muted)]">
                Growth signal
              </span>
              <span className="font-mono text-xs text-[var(--color-accent)]">
                ▲ live
              </span>
            </div>
            <div className="flex-1 relative">
              <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
            </div>
            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              {[
                { k: "Agents", v: "7" },
                { k: "Tools", v: "10+" },
                { k: "Deliverables", v: "11" },
              ].map((s) => (
                <div key={s.k}>
                  <div className="text-2xl font-medium">{s.v}</div>
                  <div className="text-xs text-[var(--color-text-dim)] mt-1">
                    {s.k}
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
