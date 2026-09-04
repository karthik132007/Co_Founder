"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  HardDrive,
  MessageSquare,
  Coins,
  Clock,
  Sparkles,
  Upload,
  FileText,
  Image as ImageIcon,
  ArrowUpRight,
  CreditCard,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { getSession } from "@/lib/session";
import {
  fetchDashboard,
  fetchFiles,
  fetchChatSessions,
  fetchProfile,
  fetchCreditBalance,
  uploadFile,
  formatFileSize,
  isImageMime,
} from "@/lib/api";
import type { DashboardData, DriveFile, ChatSession } from "@/lib/api";

const ACCENT = "#143620";

export default function DashboardPage() {
  const session = getSession();
  const userId = session?.user?.id;
  const [data, setData] = useState<DashboardData | null>(null);
  const [allFiles, setAllFiles] = useState<DriveFile[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError("");
    try {
      const [dash, files, chatRes] = await Promise.all([
        fetchDashboard(userId),
        fetchFiles(userId),
        fetchChatSessions(userId).catch(() => ({ sessions: [] as ChatSession[] })),
      ]);
      setData(dash);
      setAllFiles(files.files);
      setSessions(chatRes.sessions);

      // credits — need company id
      try {
        const profile = await fetchProfile(userId);
        const bal = await fetchCreditBalance(profile.company.id);
        setCredits(bal.balance);
      } catch {
        setCredits(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setUploading(true);
    try {
      await uploadFile(userId, file);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!session) return null;

  const company = data?.company;
  const stats = data?.stats;
  const recentFiles = data?.recent_files ?? [];
  const recentChats = sessions.slice(0, 5);

  // derived
  const totalChats = sessions.length;
  const chatsThisWeek = sessions.filter((s) => {
    if (!s.created_at) return false;
    const d = new Date(s.created_at).getTime();
    return Date.now() - d < 7 * 24 * 60 * 60 * 1000;
  }).length;
  const docs = stats?.documents ?? 0;
  const images = stats?.images ?? 0;
  const totalFiles = stats?.total_files ?? 0;

  return (
    <>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-[13px] font-medium text-red-600 mb-6"
        >
          {error} <button onClick={() => setError("")} className="ml-3 underline">Dismiss</button>
        </motion.div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: ACCENT }} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── Hero header — editorial, landing-aligned ── */}
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
                <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#8d9d94]">Overview · {company?.industry ?? "Workspace"}</div>
                <h2 className="hero-serif mt-2 text-[clamp(1.8rem,3.6vw,2.7rem)] leading-[0.92] tracking-[-0.035em] text-[#0f2214]">
                  Welcome back, <span className="italic font-[400] text-[#1a4a2b]">{company?.company_name ?? session.user.name ?? session.user.email.split("@")[0]}</span>
                </h2>
                <p className="mt-2 max-w-[560px] text-[13.5px] leading-relaxed text-[#5f6f63]">
                  {company?.small_description
                    ? `${company.small_description.slice(0, 140)}${company.small_description.length > 140 ? "…" : ""}`
                    : "Your AI team is ready to research, write, design and execute."}
                  <span className="ml-2 inline-flex items-center gap-1.5 font-mono text-[10px] tracking-wide text-[#8d9d94]">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#143620]" />
                    {company?.tone ?? "professional"} tone
                  </span>
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3 self-start rounded-full border border-[rgba(15,34,20,0.07)] bg-white px-3 py-1.5 shadow-sm md:self-center">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(20,54,32,0.07)]">
                  <Coins className="h-3.5 w-3.5 text-[#143620]" />
                </span>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-[#8d9d94] leading-none">Credits</div>
                  <div className="text-[13px] font-semibold leading-none text-[#0f2214]">{credits !== null ? credits.toLocaleString("en-IN") : "—"}</div>
                </div>
                <Link href="/billing" className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#0f2214] text-white hover:bg-[#1a4a2b] transition-colors">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </motion.div>

          {/* ── Stats — 4 useful metrics ── */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                eyebrow: "Chats",
                value: String(totalChats),
                sub: `${chatsThisWeek} this week · ${totalChats === 0 ? "start your first" : "lifetime"}`,
                icon: MessageSquare,
                href: "/chat" as const,
                accent: true,
              },
              {
                eyebrow: "Credits",
                value: credits !== null ? credits.toLocaleString("en-IN") : "—",
                sub: credits !== null ? "available · 1 credit = ₹1" : "billing → top up",
                icon: Coins,
                href: "/billing" as const,
                accent: false,
              },
              {
                eyebrow: "Drive",
                value: String(totalFiles),
                sub: `${docs} docs · ${images} images`,
                icon: HardDrive,
                href: "/drive" as const,
                accent: false,
              },
              {
                eyebrow: "Storage used",
                value: formatFileSize(stats?.total_size_bytes ?? 0),
                sub: totalFiles > 0 ? `${totalFiles} files total` : "no files yet",
                icon: HardDrive,
                href: "/drive" as const,
                accent: false,
              },
            ].map((stat, i) => (
              <motion.div
                key={stat.eyebrow}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 + i * 0.06 }}
              >
                <Link
                  href={stat.href}
                  className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border p-[1px] transition-all
                    ${stat.accent ? "border-[rgba(20,54,32,0.12)] bg-[rgba(20,54,32,0.06)]" : "border-[rgba(15,34,20,0.07)] bg-white"}
                    hover:border-[rgba(15,34,20,0.12)] hover:shadow-[0_12px_28px_-16px_rgba(15,34,20,0.14)]`}
                >
                  <span className={`absolute inset-[1px] rounded-[15px] ${stat.accent ? "bg-white" : "bg-white"} transition-colors group-hover:bg-[#fdfcf8]`} />
                  <span className="relative flex h-full flex-col p-5">
                    <span className="flex items-center justify-between">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(15,34,20,0.07)] bg-[rgba(20,54,32,0.07)]">
                        <stat.icon className="h-4 w-4 text-[#143620]" strokeWidth={1.75} />
                      </span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-[#aab8b0] transition-colors group-hover:text-[#143620]" />
                    </span>
                    <span className="mt-4 font-mono text-[10px] tracking-[0.16em] uppercase text-[#8d9d94]">{stat.eyebrow}</span>
                    <span className="hero-serif mt-1 text-[28px] leading-none tracking-[-0.03em] text-[#0f2214]">{stat.value}</span>
                    <span className="mt-1 text-[12px] leading-relaxed text-[#5f6f63] truncate">{stat.sub}</span>
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* ── Bento lower ── */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left: chats + files */}
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
                    <span className="rounded-full bg-[#f6f5ef] px-2 py-0.5 font-mono text-[10px] font-medium text-[#8d9d94]">{totalChats}</span>
                  </h3>
                  <Link href="/chat" className="inline-flex items-center gap-1 text-[13px] font-medium text-[#143620] hover:underline">
                    New chat <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>

                {recentChats.length === 0 ? (
                  <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-[rgba(15,34,20,0.08)] bg-[#fdfcf8]/70 py-8 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-[rgba(15,34,20,0.06)]">
                      <MessageSquare className="h-4 w-4 text-[#aab8b0]" />
                    </div>
                    <p className="mt-3 text-[13px] font-medium text-[#0f2214]">No chats yet</p>
                    <p className="mt-1 max-w-[280px] text-xs leading-relaxed text-[#8d9d94]">Start a conversation and your CEO agent will orchestrate the team.</p>
                    <Link href="/chat" className="mt-4 btn-primary px-4 py-2 text-[13px]">
                      Start chatting
                    </Link>
                  </div>
                ) : (
                  <div className="mt-4 divide-y divide-[rgba(15,34,20,0.06)]">
                    {recentChats.map((s) => {
                      const d = s.created_at ? new Date(s.created_at) : null;
                      const label = d
                        ? (() => {
                            const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
                            if (diff === 0) return "Today";
                            if (diff === 1) return "Yesterday";
                            return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                          })()
                        : "";
                      return (
                        <Link
                          key={s.session_id}
                          href={`/${s.session_id}`}
                          className="group flex items-center gap-3 py-3 first:pt-2 last:pb-0 hover:opacity-90"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[rgba(15,34,20,0.07)] bg-[#fdfcf8] group-hover:bg-white group-hover:border-[rgba(20,54,32,0.12)] transition-colors">
                            <MessageSquare className="h-4 w-4 text-[#8d9d94] group-hover:text-[#143620]" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-medium text-[#0f2214] group-hover:text-[#143620]">{s.title || "Untitled"}</span>
                            <span className="flex items-center gap-1.5 text-[11px] text-[#8d9d94]">
                              <Clock className="h-3 w-3" /> {label}
                            </span>
                          </span>
                          <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[#aab8b0] opacity-0 transition-all group-hover:opacity-100 group-hover:text-[#143620]" />
                        </Link>
                      );
                    })}
                  </div>
                )}
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
                  <Link href="/drive" className="text-[13px] font-medium text-[#143620] hover:underline">
                    View all
                  </Link>
                </div>

                {recentFiles.length === 0 ? (
                  <p className="py-7 text-center text-sm text-[#8d9d94]">No files yet — upload to your Drive.</p>
                ) : (
                  <div className="mt-4 divide-y divide-[rgba(15,34,20,0.06)]">
                    {recentFiles.slice(0, 5).map((f) => (
                      <div key={f.id} className="flex items-center gap-3.5 py-3 first:pt-2 last:pb-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[rgba(15,34,20,0.06)] bg-[#fdfcf8]">
                          {isImageMime(f.mime_type) ? (
                            <ImageIcon className="h-4 w-4 text-[#143620]" />
                          ) : (
                            <FileText className="h-4 w-4 text-[#143620]" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13px] font-medium text-[#0f2214]">{f.original_file_name}</div>
                          <div className="truncate text-xs text-[#5f6f63]">{f.description ?? f.mime_type}</div>
                        </div>
                        <span className="shrink-0 text-xs font-medium text-[#8d9d94]">{formatFileSize(f.file_size)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Right rail */}
            <div className="space-y-6">
              {/* Company */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.32 }}
                className="rounded-2xl border border-[rgba(15,34,20,0.07)] bg-white p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-[#8d9d94]">Company</div>
                    <h3 className="hero-serif mt-1 text-[20px] leading-none tracking-tight text-[#0f2214]">{company?.company_name ?? "—"}</h3>
                    <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-[#8d9d94]">
                      {company?.industry ?? "—"} · <span className="capitalize text-[#143620]">{company?.tone ?? "professional"}</span>
                    </p>
                  </div>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(20,54,32,0.07)]">
                    <Sparkles className="h-4 w-4 text-[#143620]" />
                  </span>
                </div>
                <p className="mt-4 text-[13px] leading-relaxed text-[#5f6f63]">
                  {company?.small_description ?? "No description provided — add one in profile for better agent results."}
                </p>
                <Link
                  href="/profile"
                  className="mt-4 inline-flex items-center gap-1 text-[12px] font-medium text-[#143620] hover:underline"
                >
                  Edit profile <ArrowUpRight className="h-3 w-3" />
                </Link>
              </motion.div>

              {/* Quick actions */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.36 }}
                className="rounded-2xl border border-[rgba(15,34,20,0.07)] bg-white p-6"
              >
                <h3 className="text-[14px] font-semibold tracking-tight text-[#0f2214]">Quick actions</h3>
                <div className="mt-4 space-y-2.5">
                  {[
                    {
                      icon: Upload,
                      label: uploading ? "Uploading…" : "Upload File",
                      sub: "Add to your Drive",
                      action: () => fileInputRef.current?.click(),
                      disabled: uploading,
                    },
                    { icon: MessageSquare, label: "New Chat", sub: `${totalChats} chats total`, href: "/chat" },
                    { icon: HardDrive, label: "Browse Drive", sub: `${totalFiles} files`, href: "/drive" },
                    { icon: CreditCard, label: "Billing & Credits", sub: credits !== null ? `${credits.toLocaleString("en-IN")} credits` : "Top up", href: "/billing" },
                  ].map((a) => {
                    const Inner = (
                      <span className="flex w-full items-center gap-3 rounded-xl border border-[rgba(15,34,20,0.07)] bg-[#fdfcf8]/60 p-3.5 text-left transition-all group-hover:border-[rgba(20,54,32,0.14)] group-hover:bg-white group-hover:shadow-[0_8px_20px_-16px_rgba(15,34,20,0.14)]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border border-[rgba(15,34,20,0.06)]">
                          <a.icon className={`h-4 w-4 text-[#143620] ${a.disabled ? "opacity-50" : ""}`} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-semibold text-[#0f2214]">{a.label}</span>
                          <span className="block text-[11px] text-[#5f6f63] truncate">{a.sub}</span>
                        </span>
                        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[#aab8b0] group-hover:text-[#143620] transition-colors" />
                      </span>
                    );
                    const isLink = "href" in a;
                    return isLink ? (
                      <Link key={a.label} href={(a as { href: string }).href} className="group block">
                        {Inner}
                      </Link>
                    ) : (
                      <button
                        key={a.label}
                        onClick={(a as { action: () => void }).action}
                        disabled={(a as { disabled?: boolean }).disabled}
                        className="group block w-full disabled:opacity-60"
                      >
                        {Inner}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      )}
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
    </>
  );
}
