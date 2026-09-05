"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, Heart, ImageIcon, MessageCircle, Palette, Send, Sparkles } from "lucide-react";

function AgentAvatar({ kind }: { kind: "analyst" | "ceo" | "designer" }) {
  const Icon = kind === "analyst" ? BarChart3 : kind === "designer" ? Palette : Sparkles;
  const style = kind === "ceo" ? "bg-[var(--color-accent)] text-white" : "border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-accent)]";
  return <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${style}`}><Icon className="h-3.5 w-3.5" strokeWidth={2} /></span>;
}

function Message({ children, kind = "agent" }: { children: React.ReactNode; kind?: "agent" | "user" | "success" }) {
  if (kind === "user") return <div className="ml-auto max-w-[78%] rounded-2xl rounded-br-md bg-[var(--color-text)] px-3.5 py-2.5 text-[13px] font-medium leading-snug text-white shadow-sm">{children}</div>;
  return <div className={`max-w-[92%] rounded-2xl rounded-tl-md px-3.5 py-2.5 text-[13px] leading-relaxed ${kind === "success" ? "border border-emerald-500/20 bg-emerald-50 text-emerald-950" : "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]"}`}>{children}</div>;
}

function FadeIn({ children }: { children: React.ReactNode }) {
  return <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>;
}

export function HowDemo({ progress }: { progress: number }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const maxProgress = progress;

  const showQuestion = maxProgress >= 0.03;
  const showRouting = maxProgress >= 0.16;
  const showAnalysis = maxProgress >= 0.38;
  const showRequest = maxProgress >= 0.57;
  const showCreative = maxProgress >= 0.72;
  const showPublished = maxProgress >= 0.9;

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
  }, [showQuestion, showRouting, showAnalysis, showRequest, showCreative, showPublished]);

  return <div className="flex h-full min-h-0 flex-col bg-[var(--color-bg-soft)]">
    <div className="flex h-11 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-white/70 px-4 backdrop-blur-sm">
      <div className="flex items-center gap-2.5"><span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--color-accent)] text-[10px] font-semibold text-white">C</span><div><p className="text-[11px] font-semibold leading-none text-[var(--color-text)]">Co-Founder</p><p className="mt-1 text-[9px] leading-none text-[var(--color-text-dim)]">Business workspace</p></div></div>
      <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(34,197,94,0.12)]" />
    </div>

    <div className="flex min-h-0 flex-1 flex-col px-4 py-4 sm:px-6 sm:py-5">
      <div ref={scrollRef} data-howdemo-scroll className="min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-width:thin]">
        <div className="flex min-h-full flex-col gap-3 pb-4">
          <AnimatePresence>{showQuestion && <FadeIn><Message kind="user">What was Q2 sales in 2025?</Message></FadeIn>}</AnimatePresence>
          <AnimatePresence>{showRouting && <FadeIn><div className="flex gap-2.5"><AgentAvatar kind="ceo" /><div><p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-dim)]">Co-Founder</p><Message>I&apos;ll check your sales data and pull the number into context.</Message></div></div></FadeIn>}</AnimatePresence>
          <AnimatePresence>{showRouting && !showAnalysis && <FadeIn><div className="rounded-xl border border-[var(--color-border)] bg-white p-3"><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><BarChart3 className="h-3.5 w-3.5" /></span><div className="flex-1"><p className="text-[11px] font-semibold">Data Analyst</p><p className="text-[10px] text-[var(--color-text-dim)]">Reading sales_2025.csv</p></div><span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" /></div></div></FadeIn>}</AnimatePresence>
          <AnimatePresence>{showAnalysis && <FadeIn><div className="flex gap-2.5"><AgentAvatar kind="analyst" /><div className="min-w-0 flex-1"><p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-dim)]">Data Analyst <span className="ml-1 normal-case tracking-normal text-emerald-600">Complete</span></p><div className="overflow-hidden rounded-2xl rounded-tl-md border border-[var(--color-border)] bg-white"><div className="flex items-center justify-between border-b border-[var(--color-border)] px-3.5 py-2"><span className="font-mono text-[10px] text-[var(--color-text-dim)]">Q2 2025 · sales</span><span className="text-[10px] font-medium text-emerald-700">+18% vs Q1</span></div><div className="px-3.5 py-3"><p className="text-[27px] font-semibold tracking-tight text-[var(--color-text)]">$84,240</p><p className="mt-1 text-[11px] text-[var(--color-text-muted)]">Your strongest quarter so far.</p></div></div></div></div><div className="mt-3 flex gap-2.5"><AgentAvatar kind="ceo" /><Message><span className="font-semibold text-[var(--color-text)]">$84,240.</span> Want to turn that momentum into a social post?</Message></div></FadeIn>}</AnimatePresence>
          <AnimatePresence>{showRequest && <FadeIn><Message kind="user">Make an Instagram post for our Vitamin C serum — and publish it.</Message></FadeIn>}</AnimatePresence>
          <AnimatePresence>{showCreative && <FadeIn><div className="max-w-[620px] rounded-2xl border border-[var(--color-border)] bg-white p-3.5"><div className="flex items-center gap-2.5"><AgentAvatar kind="designer" /><div className="flex-1"><p className="text-[11px] font-semibold">Graphic Designer</p><p className="mt-0.5 text-[10px] text-[var(--color-text-dim)]">{showPublished ? "Visual generated · Instagram 4:5" : "Using your brand palette · Instagram 4:5"}</p></div><span className={`flex h-6 w-6 items-center justify-center rounded-full ${showPublished ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-600"}`}>{showPublished ? "✓" : <ImageIcon className="h-3.5 w-3.5" />}</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--color-border)]">{showPublished ? <div className="h-full w-full rounded-full bg-[var(--color-accent)]" /> : <motion.div initial={{ width: "18%" }} animate={{ width: "76%" }} transition={{ duration: 1.4, repeat: Infinity, repeatType: "reverse" }} className="h-full rounded-full bg-[var(--color-accent)]" />}</div></div></FadeIn>}</AnimatePresence>
          <AnimatePresence>{showPublished && <FadeIn><div className="w-full max-w-[290px] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_10px_28px_rgba(15,34,20,0.12)]"><div className="flex items-center gap-2 px-3 py-2"><span className="h-5 w-5 rounded-full bg-gradient-to-br from-[#feda75] via-[#d62976] to-[#4f5bd5]" /><span className="text-[10px] font-semibold">yourbrand</span><span className="ml-auto text-[9px] text-emerald-600">Published</span></div><Image src="/vitcdemo.png" alt="Vitamin C serum post" width={290} height={290} className="aspect-square w-full bg-[#f7f4ed] object-contain" /><div className="px-3 py-2.5"><div className="flex gap-3"><Heart className="h-3.5 w-3.5" /><MessageCircle className="h-3.5 w-3.5" /><Send className="h-3.5 w-3.5" /></div><p className="mt-2 line-clamp-2 text-[10px] leading-relaxed"><b>yourbrand</b> Q2 glow is real. Your daily Vitamin C ritual is ready ✨</p></div></div><div className="flex gap-2.5"><AgentAvatar kind="ceo" /><Message kind="success"><span className="font-semibold">Published to Instagram.</span> Caption and hashtags are included.</Message></div></FadeIn>}</AnimatePresence>
        </div>
      </div>
      <div className="mt-3 flex h-10 shrink-0 items-center rounded-xl border border-[var(--color-border)] bg-white px-3 text-[11px] text-[var(--color-text-dim)] shadow-sm"><span className="flex-1">Ask anything about your business…</span><span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--color-accent)] text-white">↗</span></div>
    </div>
  </div>;
}
