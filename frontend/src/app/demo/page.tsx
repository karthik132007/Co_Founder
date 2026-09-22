"use client";

import { motion } from "framer-motion";
import {
  HardDrive,
  MessageSquare,
  Coins,
  Clock,
  Upload,
  FileText,
  Image as ImageIcon,
  ArrowUpRight,
  Puzzle,
  Star,
} from "lucide-react";
import Link from "next/link";
import {
  DEMO_CHATS,
  DEMO_COMPANY,
  DEMO_FILES,
  DEMO_STATS,
  chatDateLabel,
  type DemoFile,
} from "@/components/demo/demoChats";

const ACCENT = "#143620";

function fileIcon(kind: DemoFile["kind"]) {
  if (kind === "image") return ImageIcon;
  if (kind === "sheet") return HardDrive;
  if (kind === "logo") return Star;
  return FileText;
}

export default function DemoOverviewPage() {
  const stats = [
    {
      eyebrow: "Chats",
      value: String(DEMO_STATS.chats),
      sub: `${DEMO_STATS.chatsThisWeek} this week · lifetime`,
      icon: MessageSquare,
      href: "/demo/chat" as string | null,
      accent: true,
    },
    {
      eyebrow: "Credits",
      value: DEMO_STATS.credits.toLocaleString("en-IN"),
      sub: "available · 1 credit = ₹1",
      icon: Coins,
      href: null as string | null,
      accent: false,
    },
    {
      eyebrow: "Drive",
      value: String(DEMO_STATS.files),
      sub: `${DEMO_STATS.documents} docs · ${DEMO_STATS.images} images`,
      icon: HardDrive,
      href: "/demo/drive" as string | null,
      accent: false,
    },
    {
      eyebrow: "Storage used",
      value: DEMO_STATS.storageLabel,
      sub: `${DEMO_STATS.files} files total`,
      icon: HardDrive,
      href: "/demo/drive" as string | null,
      accent: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Hero header ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[24px] border border-[rgba(15,34,20,0.06)] bg-white/70 backdrop-blur-[6px] px-6 py-7 md:px-8 md:py-8"
      >
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-[0.32]" />
          <div className="glow-orb -right-24 -top-24 h-[420px] w-[420px] bg-[#7cc99a]/[0.07]" />
          <div className="glow-orb -bottom-24 -left-24 h-[360px] w-[360px] bg-[#143620]/[0.05]" />
        </div>

        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#8d9d94]">
              Overview · {DEMO_COMPANY.industry}
            </div>
            <h2 className="hero-serif mt-2 text-[clamp(1.8rem,3.6vw,2.7rem)] leading-[0.92] tracking-[-0.035em] text-[#0f2214]">
              Welcome back,{" "}
              <span className="italic font-[400] text-[#1a4a2b]">{DEMO_COMPANY.name}</span>
            </h2>
            <p className="mt-2 max-w-[560px] text-[13.5px] leading-relaxed text-[#5f6f63]">
              {DEMO_COMPANY.description}
              <span className="ml-2 inline-flex items-center gap-1.5 font-mono text-[10px] tracking-wide text-[#8d9d94]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#143620]" />
                {DEMO_COMPANY.tone} tone
              </span>
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3 self-start rounded-full border border-[rgba(15,34,20,0.07)] bg-white px-3 py-1.5 shadow-sm md:self-center">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(20,54,32,0.07)]">
              <Coins className="h-3.5 w-3.5 text-[#143620]" />
            </span>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[#8d9d94] leading-none">
                Credits
              </div>
              <div className="text-[13px] font-semibold leading-none text-[#0f2214]">
                {DEMO_STATS.credits.toLocaleString("en-IN")}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => {
          const classes = `group relative flex h-full flex-col overflow-hidden rounded-2xl border p-[1px] transition-all ${
            stat.accent
              ? "border-[rgba(20,54,32,0.12)] bg-[rgba(20,54,32,0.06)]"
              : "border-[rgba(15,34,20,0.07)] bg-white"
          } hover:border-[rgba(15,34,20,0.12)] hover:shadow-[0_12px_28px_-16px_rgba(15,34,20,0.14)]`;

          const inner = (
            <>
              <span className="absolute inset-[1px] rounded-[15px] bg-white transition-colors group-hover:bg-[#fdfcf8]" />
              <span className="relative flex h-full flex-col p-5">
                <span className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(15,34,20,0.07)] bg-[rgba(20,54,32,0.07)]">
                    <stat.icon className="h-4 w-4 text-[#143620]" strokeWidth={1.75} />
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-[#aab8b0] transition-colors group-hover:text-[#143620]" />
                </span>
                <span className="mt-4 font-mono text-[10px] tracking-[0.16em] uppercase text-[#8d9d94]">
                  {stat.eyebrow}
                </span>
                <span className="hero-serif mt-1 text-[28px] leading-none tracking-[-0.03em] text-[#0f2214]">
                  {stat.value}
                </span>
                <span className="mt-1 text-[12px] leading-relaxed text-[#5f6f63] truncate">{stat.sub}</span>
              </span>
            </>
          );

          return (
            <motion.div
              key={stat.eyebrow}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 + i * 0.06 }}
            >
              {stat.href ? (
                <Link href={stat.href} className={classes}>
                  {inner}
                </Link>
              ) : (
                <div className={classes}>{inner}</div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* ── Bento lower ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Recent chats */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.22 }}
            className="rounded-2xl border border-[rgba(15,34,20,0.07)] bg-white p-6 shadow-[0_8px_24px_-20px_rgba(15,34,20,0.12)]"
          >
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-[14px] font-semibold tracking-tight text-[#0f2214]">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[rgba(20,54,32,0.07)]">
                  <MessageSquare className="h-3.5 w-3.5 text-[#143620]" />
                </span>
                Recent chats
                <span className="rounded-full bg-[#f6f5ef] px-2 py-0.5 font-mono text-[10px] font-medium text-[#8d9d94]">
                  {DEMO_STATS.chats}
                </span>
              </h3>
              <span className="text-[12px] font-medium text-[#8d9d94]">Read-only replay</span>
            </div>

            <div className="mt-4 divide-y divide-[rgba(15,34,20,0.06)]">
              {DEMO_CHATS.map((chat) => (
                <Link
                  key={chat.id}
                  href={`/demo/chat/${chat.id}`}
                  className="group flex items-center gap-3 py-3 first:pt-2 last:pb-0 hover:opacity-90"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[rgba(15,34,20,0.07)] bg-[#fdfcf8] group-hover:bg-white group-hover:border-[rgba(20,54,32,0.12)] transition-colors">
                    <MessageSquare className="h-4 w-4 text-[#8d9d94] group-hover:text-[#143620]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-[#0f2214] group-hover:text-[#143620]">
                      {chat.title}
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] text-[#8d9d94]">
                      <Clock className="h-3 w-3" /> {chatDateLabel(chat)}
                      <span className="inline-flex items-center gap-1 text-[#143620]">
                        <span className="text-[#c6d0c9]">·</span>
                        <Coins className="h-3 w-3" />
                        {chat.creditsUsed.toFixed(2)} credits
                      </span>
                    </span>
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[#aab8b0] opacity-0 transition-all group-hover:opacity-100 group-hover:text-[#143620]" />
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Recent files */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.28 }}
            className="rounded-2xl border border-[rgba(15,34,20,0.07)] bg-white p-6 shadow-[0_8px_24px_-20px_rgba(15,34,20,0.12)]"
          >
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-[14px] font-semibold tracking-tight text-[#0f2214]">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[rgba(20,54,32,0.07)]">
                  <HardDrive className="h-3.5 w-3.5 text-[#143620]" />
                </span>
                Recent files
              </h3>
              <Link href="/demo/drive" className="text-[13px] font-medium text-[#143620] hover:underline">
                View all
              </Link>
            </div>

            <div className="mt-4 divide-y divide-[rgba(15,34,20,0.06)]">
              {DEMO_FILES.slice(0, 5).map((f) => {
                const Icon = fileIcon(f.kind);
                return (
                  <div key={f.name} className="flex items-center gap-3.5 py-3 first:pt-2 last:pb-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[rgba(15,34,20,0.06)] bg-[#fdfcf8]">
                      <Icon className="h-4 w-4 text-[#143620]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium text-[#0f2214]">{f.name}</div>
                      <div className="truncate text-xs text-[#5f6f63]">{f.meta}</div>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-[#8d9d94]">{f.size}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Right rail */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.32 }}
            className="rounded-2xl border border-[rgba(15,34,20,0.07)] bg-white p-6"
          >
            <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-[#8d9d94]">Company</div>
            <h3 className="hero-serif mt-1 text-[20px] leading-none tracking-tight text-[#0f2214]">
              {DEMO_COMPANY.name}
            </h3>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-[#8d9d94]">
              {DEMO_COMPANY.industry} ·{" "}
              <span className="text-[#143620]">{DEMO_COMPANY.tone}</span>
            </p>
            <p className="mt-4 text-[13px] leading-relaxed text-[#5f6f63]">{DEMO_COMPANY.description}</p>
            <p className="mt-4 text-[12px] text-[#8d9d94]">
              Workspace in use since {DEMO_COMPANY.connectedSince}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.36 }}
            className="rounded-2xl border border-[rgba(15,34,20,0.07)] bg-white p-6"
          >
            <h3 className="text-[14px] font-semibold tracking-tight text-[#0f2214]">Quick actions</h3>
            <div className="mt-4 space-y-2.5">
              {[
                { icon: Upload, label: "Upload File", sub: "Disabled in the demo", href: null as string | null },
                { icon: MessageSquare, label: "Browse chats", sub: `${DEMO_STATS.chats} recorded conversations`, href: "/demo/chat" },
                { icon: HardDrive, label: "Browse Drive", sub: `${DEMO_STATS.files} files`, href: "/demo/drive" },
                { icon: Puzzle, label: "Plugins & integrations", sub: "8 connected apps", href: "/demo/plugins" },
              ].map((a) => {
                const inner = (
                  <span className="flex w-full items-center gap-3 rounded-xl border border-[rgba(15,34,20,0.07)] bg-[#fdfcf8]/60 p-3.5 text-left transition-all group-hover:border-[rgba(20,54,32,0.14)] group-hover:bg-white group-hover:shadow-[0_8px_20px_-16px_rgba(15,34,20,0.14)]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border border-[rgba(15,34,20,0.06)]">
                      <a.icon className={`h-4 w-4 text-[#143620] ${a.href ? "" : "opacity-50"}`} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold text-[#0f2214]">{a.label}</span>
                      <span className="block text-[11px] text-[#5f6f63] truncate">{a.sub}</span>
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[#aab8b0] group-hover:text-[#143620] transition-colors" />
                  </span>
                );
                return a.href ? (
                  <Link key={a.label} href={a.href} className="group block">
                    {inner}
                  </Link>
                ) : (
                  <div key={a.label} className="group block opacity-70">
                    {inner}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
