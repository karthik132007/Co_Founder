"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  BarChart3,
  Palette,
  Check,
  Camera,
  FileSpreadsheet,
  Loader2,
  Sparkles,
  TrendingUp,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";

/**
 * Scroll-coordinated demo — replaces fast autoplay tick.
 * Controlled by `progress` (0→1) from HowItThinks ScrollTrigger.
 * Durations are weighted to wall-time: thinking1 4s, thinking2 3s
 * → mapped to scroll distance so thinking stays visible longer.
 */
export function HowDemo({ progress }: { progress: number }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const s7Ref = useRef<HTMLDivElement>(null);
  const s8Ref = useRef<HTMLDivElement>(null);
  const p = progress; // 0-1 current
  const [maxP, setMaxP] = useState(0);
  useEffect(() => {
    setMaxP((m) => Math.max(m, p));
  }, [p]);
  const q = maxP; // sticky — never goes back, so scroll-back won't hide messages

  // weighted thresholds — thinking1 4s (34% of scroll), thinking2 3s (24%)
  // use q so once a message appears it stays when you scroll back up
  // s8 pushed to 0.985 to keep image visible longer (was 0.96, too close to s7)
  const s0 = q >= 0.06; // user Q2
  const s1 = q >= 0.12; // ceo thinking 1 (4s)
  const s2 = q >= 0.40; // tool data analyst
  const s2done = q >= 0.48; // tool done
  const s3 = q >= 0.52; // answer
  const s4 = q >= 0.62; // user insta
  const s5 = q >= 0.68; // ceo thinking 2 (3s)
  const s6 = q >= 0.86; // tool graphic
  const s6palette = q >= 0.89; // palette done
  const s7 = q >= 0.92; // image — stays centered, not jumped to top
  const s8 = q >= 0.985; // posted — extra gap so image doesn't instantly get pushed

  // keep newest message in view — but for image/post keep them centered and fully visible
  // previously every step scrolled to bottom, so image at 0.92 was at bottom then s8 at 0.96 pushed it to top
  useEffect(() => {
    if (s8 && s8Ref.current) {
      s8Ref.current.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      return;
    }
    if (s7 && s7Ref.current) {
      s7Ref.current.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      return;
    }
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [s0, s1, s2, s2done, s3, s4, s5, s6, s7, s8]);

  // sub-progress for thinking bars (0→1 within thinking window) — sticky
  const thinking1Sub = q < 0.12 ? 0 : q < 0.40 ? Math.min(1, Math.max(0, (q - 0.12) / (0.40 - 0.12))) : 1;
  const thinking2Sub = q < 0.68 ? 0 : q < 0.86 ? Math.min(1, Math.max(0, (q - 0.68) / (0.86 - 0.68))) : 1;

  return (
    <div className="relative flex h-full w-full flex-col">
      <div
        ref={scrollRef}
        data-howdemo-scroll
        className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 pb-24 lg:px-4 lg:py-4 lg:pb-28"
        style={{ scrollbarWidth: "thin", overscrollBehavior: "contain" }}
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-dim)]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="font-mono uppercase tracking-[0.14em]">cofounder — live session</span>
            <span className="ml-auto font-mono text-[10px]">today 09:41</span>
          </div>

          {/* 0 — USER Q2 */}
          <AnimatePresence>
            {s0 && (
              <motion.div
                key="u1"
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="flex justify-end"
              >
                <div className="max-w-[78%] rounded-[16px] rounded-br-[6px] bg-[var(--color-text)] px-3.5 py-2.5 text-[13px] font-medium leading-snug text-white shadow-[0_8px_24px_rgba(0,0,0,0.12)] lg:max-w-[72%] lg:text-[13.5px]">
                  What is Q2 sales value of 2025?
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 1 — CEO thinking 1 — 4s */}
          {s1 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="flex gap-2"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#7c8cff]/15 text-[#7c8cff]">
                <Brain className="h-3.5 w-3.5" />
              </span>
              <div className="glass flex-1 rounded-2xl rounded-tl-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--color-text)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#7c8cff] animate-pulse" />
                  CEO · thinking
                  <span className="ml-auto rounded-full bg-[#7c8cff]/10 px-1.5 py-0.5 text-[10px] font-mono text-[#7c8cff]">4s</span>
                </div>
                <p className="mt-1 text-[12.5px] leading-snug text-[var(--color-text-muted)]">
                  Q2 sales is a <span className="font-medium text-[var(--color-text)]">numbers task</span> — I should call{" "}
                  <span className="rounded-md bg-[#6ee7b7]/15 px-1 py-0.5 font-medium text-[#0f766e]">Data Analyst</span>, not web search.
                </p>
                {/* thinking progress — fills over 4s scroll */}
                <div className="mt-2.5 flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--color-border)]">
                    <motion.div className="h-full bg-[#7c8cff]" style={{ width: `${thinking1Sub * 100}%` }} transition={{ duration: 0.1, ease: "linear" }} />
                  </div>
                  <span className="font-mono text-[10px] text-[var(--color-text-dim)]">{s2 ? "routed ✓" : "thinking…"}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* 2 — Tool Data Analyst */}
          {s2 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="ml-9 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]"
            >
              <div className="flex items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface-strong)] px-3 py-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#6ee7b7]/20 text-[#0f766e]">
                  <BarChart3 className="h-3.5 w-3.5" />
                </span>
                <span className="text-[12px] font-semibold">Data Analyst</span>
                <span className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-medium text-emerald-700">
                  {s2done ? <Check className="h-3 w-3" /> : <Loader2 className="h-3 w-3 animate-spin" />}
                  {s2done ? "done · 1.2s" : "analyzing…"}
                </span>
              </div>
              <div className="px-3 py-2.5">
                <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-dim)]">
                  <FileSpreadsheet className="h-3 w-3" />
                  <span className="font-mono">sales_2025.csv</span>
                  <span>·</span>
                  <span className="rounded bg-[var(--color-surface-strong)] px-1.5 py-0.5 font-mono text-[10px]">run_code</span>
                  <span className="ml-auto hidden items-center gap-1 text-[10px] font-medium text-[#6ee7b7] lg:flex">
                    <TrendingUp className="h-3 w-3" />
                    sandbox
                  </span>
                </div>
                <div className="mt-2 rounded-xl bg-[#0a0a0a] px-3 py-2 font-mono text-[11px] leading-relaxed text-[#a1a1aa]">
                  <div className="text-[#e4e4e7]">df[df.quarter==2].sales.sum()</div>
                  <div className="text-emerald-400">→ $84,240</div>
                </div>
                {s2done && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-2.5 grid grid-cols-3 gap-2">
                    {[
                      { k: "Q1", v: "$71k", w: "68%" },
                      { k: "Q2", v: "$84.2k", w: "100%", active: true },
                      { k: "Q3", v: "—", w: "0%", muted: true },
                    ].map((b) => (
                      <div
                        key={b.k}
                        className="rounded-xl border bg-[var(--color-bg-soft)] px-2.5 py-2"
                        style={{
                          borderColor: b.active ? "#6ee7b7" : "var(--color-border)",
                          background: b.active ? "rgba(110,231,183,0.08)" : undefined,
                        }}
                      >
                        <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-dim)]">{b.k}</div>
                        <div className={`mt-1 text-[13px] font-semibold ${b.muted ? "text-[var(--color-text-dim)]" : ""}`}>{b.v}</div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
                          <div className="h-full rounded-full" style={{ width: b.w, background: b.active ? "#6ee7b7" : "var(--color-border-strong)" }} />
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* 3 — CEO answer — cool color (indigo/violet) not black */}
          {s3 && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-white shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <div className="flex-1 rounded-2xl rounded-tl-[6px] bg-gradient-to-br from-[#6366f1] via-[#7c8cff] to-[#06b6d4] px-3.5 py-3 text-white shadow-[0_12px_32px_rgba(99,102,241,0.28)]">
                <p className="text-[13px] leading-relaxed">
                  Q2 2025 sales: <span className="font-semibold">$84,240</span> <span className="text-white/90">(+18% vs Q1)</span>. Your best quarter yet.
                </p>
                <p className="mt-1 text-[12px] leading-snug text-white/80">Want me to turn this into a post?</p>
              </div>
            </motion.div>
          )}

          {/* 4 — USER insta */}
          {s4 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
              <div className="max-w-[82%] rounded-[16px] rounded-br-[6px] bg-[var(--color-text)] px-3.5 py-2.5 text-[13px] font-medium leading-snug text-white shadow-lg lg:max-w-[76%]">
                Create an Instagram post about our Vitamin C serum — use that win. Post it to Instagram.
              </div>
            </motion.div>
          )}

          {/* 5 — CEO thinking 2 — 3s */}
          {s5 && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#fbbf24]/20 text-[#a16207]">
                <Brain className="h-3.5 w-3.5" />
              </span>
              <div className="glass flex-1 rounded-2xl rounded-tl-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#fbbf24] animate-pulse" />
                  CEO · thinking
                  <span className="ml-auto rounded-full bg-[#fbbf24]/15 px-1.5 py-0.5 text-[10px] font-mono text-[#a16207]">3s</span>
                </div>
                <p className="mt-1 text-[12.5px] leading-snug text-[var(--color-text-muted)]">
                  On-brand visual needed — I’ll call <span className="rounded-md bg-[#fbbf24]/20 px-1 py-0.5 font-medium text-[#a16207]">Graphic Designer</span> with your palette.
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--color-border)]">
                    <motion.div className="h-full bg-[#fbbf24]" style={{ width: `${thinking2Sub * 100}%` }} transition={{ duration: 0.1, ease: "linear" }} />
                  </div>
                  <span className="font-mono text-[10px] text-[var(--color-text-dim)]">{s6 ? "routed ✓" : "thinking…"}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* 6 — Tool Graphic */}
          {s6 && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="ml-9 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
              <div className="flex items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface-strong)] px-3 py-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#fbbf24]/20 text-[#a16207]">
                  <Palette className="h-3.5 w-3.5" />
                </span>
                <span className="text-[12px] font-semibold">Graphic Designer</span>
                <span
                  className="ml-auto flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-medium"
                  style={{ background: s7 ? "rgba(16,185,129,0.10)" : "rgba(251,191,36,0.15)", color: s7 ? "#047857" : "#92400e" }}
                >
                  {s7 ? <Check className="h-3 w-3" /> : <Loader2 className="h-3 w-3 animate-spin" />}
                  {s7 ? "done · 1.1s" : "generating…"}
                </span>
              </div>
              <div className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded-full bg-[#7c8cff] ring-1 ring-black/5" />
                    <span className="h-3 w-3 rounded-full bg-[#b388ff] ring-1 ring-black/5" />
                    <span className="h-3 w-3 rounded-full bg-[#fbbf24] ring-1 ring-black/5" />
                    <span className="h-3 w-3 rounded-full bg-[#6ee7b7] ring-1 ring-black/5" />
                  </div>
                  <span className="text-[11px] text-[var(--color-text-dim)]">{s6palette ? "palette ✓" : "checking palette…"}</span>
                  <span className="ml-auto font-mono text-[10px] text-[var(--color-text-dim)]">gemini-image</span>
                </div>
                <div className="mt-2 flex items-center gap-2 rounded-lg bg-[var(--color-bg-soft)] px-2.5 py-2 text-[11px]">
                  <Loader2 className={`h-3 w-3 ${s7 ? "hidden" : "animate-spin text-[var(--color-accent)]"}`} />
                  <span className="font-mono text-[11px] leading-none text-[var(--color-text-dim)]">
                    {s7 ? "image_generated → vitcdemo.png" : "create_graphic(vitamin serum, Q2 +18%)"}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* 7 — Image — WhatsApp-size agent bubble, Instagram UI */}
          {s7 && (
            <motion.div
              ref={s7Ref as any}
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex gap-2 scroll-mt-4"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#fbbf24]/15 text-[#a16207]">
                <Palette className="h-3.5 w-3.5" />
              </span>
              <div className="max-w-[68%] overflow-hidden rounded-2xl rounded-tl-[6px] border border-black/5 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)] lg:max-w-[320px]">
                {/* Insta header */}
                <div className="flex items-center gap-2 px-3 py-2">
                  <span className="h-6 w-6 overflow-hidden rounded-full bg-gradient-to-br from-[#feda75] via-[#d62976] to-[#4f5bd5] p-[1.5px]">
                    <span className="flex h-full w-full items-center justify-center rounded-full bg-white text-[10px] font-bold">✓</span>
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 text-[11px] font-semibold leading-none">
                      yourbrand <span className="inline-flex h-3 w-3 items-center justify-center rounded-full bg-[#0095f6] text-[8px] text-white">✓</span>
                    </div>
                    <div className="text-[10px] leading-none text-[var(--color-text-dim)]">Original audio</div>
                  </div>
                  <MoreHorizontal className="ml-auto h-4 w-4 text-[var(--color-text-dim)]" />
                </div>
                {/* Insta image — square, mid size */}
                <div className="relative aspect-square w-full overflow-hidden bg-[#fafafa]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/vitcdemo.png" alt="Vitamin C serum" className="h-full w-full object-cover" />
                </div>
                {/* Insta action bar */}
                <div className="px-3 pt-2">
                  <div className="flex items-center gap-3">
                    <Heart className="h-[18px] w-[18px] fill-black text-black" strokeWidth={1.6} />
                    <MessageCircle className="h-[18px] w-[18px]" strokeWidth={1.6} />
                    <Send className="h-[18px] w-[18px]" strokeWidth={1.6} />
                    <Bookmark className="ml-auto h-[18px] w-[18px]" strokeWidth={1.6} />
                  </div>
                  <div className="mt-2 text-[11px] font-semibold leading-none">1,248 likes</div>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-[1.45]">
                    <span className="font-semibold">yourbrand</span> Q2 glow is real ✨ $84k and counting — Powered by our Vitamin C Serum. Shop now.
                  </p>
                  <p className="mt-1 text-[10px] text-[var(--color-text-dim)]">View all 18 comments</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wide text-[var(--color-text-dim)]">2 seconds ago</p>
                </div>
                <div className="mx-3 mb-2 mt-2 flex items-center gap-2 border-t border-black/5 pt-2 text-[11px] text-[var(--color-text-dim)]">
                  <span className="h-5 w-5 rounded-full bg-[var(--color-border)]" />
                  Add a comment…
                  <span className="ml-auto text-[11px] font-semibold text-[#0095f6]">Post</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* 8 — Posted */}
          {s8 && (
            <motion.div ref={s8Ref as any} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 scroll-mt-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
              <div className="flex-1 rounded-2xl rounded-tl-[6px] border border-emerald-500/20 bg-emerald-50 px-3.5 py-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Camera className="h-3 w-3" />
                  </span>
                  <span className="text-[13px] font-semibold text-emerald-900">Successfully posted to Instagram</span>
                  <span className="ml-auto hidden rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white lg:inline">LIVE</span>
                </div>
                <p className="mt-1 text-[12px] leading-snug text-emerald-800">
                  @yourbrand · now · <span className="font-medium">vitcdemo.png</span> is live. Caption + hashtags ready.
                </p>
              </div>
            </motion.div>
          )}

          {/* bottom breathing space so insta card sits a few px above edge and stays fully visible */}
          <div className="h-6 shrink-0 lg:h-8" aria-hidden />
        </div>
      </div>
    </div>
  );
}
