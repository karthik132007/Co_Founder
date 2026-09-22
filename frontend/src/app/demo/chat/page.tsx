"use client";

import { motion } from "framer-motion";
import {
  Search,
  PenLine,
  Palette,
  BarChart3,
  ArrowUpRight,
  MessageSquare,
  Coins,
  Clock,
  Camera,
  Mail,
  TrendingUp,
  ShoppingBag,
  CalendarDays,
} from "lucide-react";
import Link from "next/link";
import { DEMO_CHATS, chatDateLabel, type DemoChat } from "@/components/demo/demoChats";

const ACCENT = "#143620";

const CHAT_ICONS: Record<DemoChat["iconKey"], typeof Search> = {
  instagram: Camera,
  inbox: Mail,
  sales: BarChart3,
  research: Search,
  returns: TrendingUp,
  campaign: CalendarDays,
};

export default function DemoChatIndexPage() {
  return (
    <div className="space-y-6">
      {/* ── Real /chat empty state, frozen (typing is disabled in the demo) ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex flex-col items-center justify-center overflow-hidden rounded-[28px] border border-[rgba(15,34,20,0.06)] bg-white/60 px-6 py-10 text-center backdrop-blur-[1px] md:px-8"
      >
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit]">
          <div className="absolute inset-0 bg-grid opacity-[0.38]" />
          <div className="glow-orb -right-32 -top-28 h-[520px] w-[520px] bg-[#7cc99a]/[0.08]" />
          <div className="glow-orb -bottom-28 -left-32 h-[440px] w-[440px] bg-[#143620]/[0.06]" />
        </div>

        <h3 className="hero-serif text-[clamp(2.2rem,5.2vw,3.5rem)] leading-[0.9] tracking-[-0.04em] text-[#0f2214] [text-wrap:balance]">
          What should we
          <span className="block italic font-[400] tracking-[-0.03em] text-[#1a4a2b]">build today?</span>
        </h3>

        <div className="mt-8 grid w-full max-w-[640px] grid-cols-1 gap-3.5 sm:grid-cols-2">
          {[
            { n: "01", icon: Search, label: "Research competitors", desc: "Landscape, positioning & gaps" },
            { n: "02", icon: PenLine, label: "Draft a strategy memo", desc: "Clear, investor-ready narrative" },
            { n: "03", icon: Palette, label: "Design Instagram post", desc: "On-brand visual + caption" },
            { n: "04", icon: BarChart3, label: "Analyze sales data", desc: "Charts, EDA & executive summary" },
          ].map((chip, idx) => (
            <motion.div
              key={chip.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.07 + 0.18, duration: 0.45, ease: "easeOut" }}
              className="group relative flex items-start gap-3.5 overflow-hidden rounded-2xl border border-[rgba(15,34,20,0.07)] bg-white p-[1px] text-left"
            >
              <span className="absolute inset-[1px] rounded-[15px] bg-white" />
              <span className="relative flex w-full items-start gap-3.5 rounded-[15px] px-4 py-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[rgba(15,34,20,0.07)] bg-[rgba(20,54,32,0.06)]">
                  <chip.icon className="h-[18px] w-[18px] text-[#143620]" strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-[13px] font-semibold tracking-tight text-[#0f2214]">{chip.label}</span>
                  <span className="mt-1 block text-[12px] leading-relaxed text-[#5f6f63]">{chip.desc}</span>
                </span>
                <span className="shrink-0 font-mono text-[10px] tracking-wide text-[#aab8b0]">{chip.n}</span>
              </span>
            </motion.div>
          ))}
        </div>

        <p className="mt-7 font-mono text-[10px] tracking-[0.16em] uppercase text-[#8d9d94]">
          Demo mode · the composer is read-only
        </p>
      </motion.div>

      {/* ── Recorded conversations ── */}
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-[#0f2214]">Recorded conversations</h2>
        <p className="text-sm text-[#5f6f63]">
          Six real workflows from the Indian Herbs workspace, replayed exactly as they happened —
          multi-agent reasoning, tool calls, approvals and publishing.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {DEMO_CHATS.map((chat, i) => {
          const Icon = CHAT_ICONS[chat.iconKey];
          return (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.3), duration: 0.3 }}
            >
              <Link href={`/demo/chat/${chat.id}`} className="card card-hover block h-full p-4">
                <div className="flex items-start gap-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[rgba(20,54,32,0.12)] bg-[rgba(20,54,32,0.06)] text-[#143620]">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[14px] font-semibold text-[#0f2214]">{chat.title}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[#aab8b0]" />
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-[#5f6f63]">{chat.subtitle}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#8d9d94]">
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {chat.messages.length} messages
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Coins className="h-3 w-3" />
                        {chat.creditsUsed.toFixed(2)} credits
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {chatDateLabel(chat)}
                      </span>
                      <span className="rounded-full bg-[#f6f5ef] px-2 py-0.5 font-medium text-[#5f6f63]">
                        {chat.effort} effort
                      </span>
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {chat.plugins.map((p) => (
                        <span
                          key={p}
                          className="rounded-full border border-[rgba(20,54,32,0.12)] bg-[#edf4ed] px-2 py-0.5 text-[10.5px] font-medium text-[#143620]"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-[rgba(15,34,20,0.08)] bg-[#f6f8f5] px-5 py-4 text-center">
        <p className="text-[12.5px] text-[#5f6f63]">
          <ShoppingBag className="mr-1.5 inline h-3.5 w-3.5 text-[#143620]" />
          Want this running on your own catalogue, inbox and ad accounts?{" "}
          <Link
            href="/auth"
            className="font-semibold text-[#143620] underline decoration-[#143620]/30 underline-offset-2 hover:decoration-[#143620]"
          >
            Create a free account
          </Link>
          {" "}
          — it comes with <strong className="font-semibold text-[#143620]">50 free credits</strong>.
        </p>
      </div>
    </div>
  );
}
