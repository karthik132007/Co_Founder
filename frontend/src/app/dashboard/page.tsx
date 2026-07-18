"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, LayoutDashboard, Settings,
  Bell, LogOut, Menu,
  ChevronRight, Sparkles,
  MessageSquare, ArrowUpRight, HardDrive,
  Upload, FileText, Image as ImageIcon, Trash2,
  Plus, Clock,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/session";
import {
  fetchDashboard, fetchFiles, uploadFile, deleteFile, formatFileSize, isImageMime,
  fetchChatSessions,
  type DashboardData, type DriveFile, type ChatSession,
} from "@/lib/api";
import Chat from "@/components/Chat";

const ACCENT = "#4f46e5";

/* ─────────────────────────────────────────────
   Types
   ───────────────────────────────────────────── */

type NavItem = {
  label: string;
  icon: typeof LayoutDashboard;
  id: string;
};

const navItems: NavItem[] = [
  { label: "Overview", icon: LayoutDashboard, id: "overview" },
  { label: "Drive", icon: HardDrive, id: "drive" },
  { label: "Chat", icon: MessageSquare, id: "chat" },
  { label: "Settings", icon: Settings, id: "settings" },
];

const subscribeToSession = () => () => {};
const getServerSessionSnapshot = () => null;

/* ─────────────────────────────────────────────
   Dashboard Page
   ───────────────────────────────────────────── */

export default function DashboardPage() {
  const router = useRouter();
  const session = useSyncExternalStore(
    subscribeToSession,
    getSession,
    getServerSessionSnapshot,
  );
  const [activeNav, setActiveNav] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [allFiles, setAllFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeSessionTitle, setActiveSessionTitle] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userId = session?.user?.id;

  const loadDashboard = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchDashboard(userId);
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadFiles = useCallback(async () => {
    if (!userId) return;
    try {
      const result = await fetchFiles(userId);
      setAllFiles(result.files);
    } catch {
      // Non-critical
    }
  }, [userId]);

  const loadSessions = useCallback(async () => {
    if (!userId) return;
    setLoadingSessions(true);
    try {
      const data = await fetchChatSessions(userId);
      setChatSessions(data.sessions);
    } catch {
      // Non-critical
    } finally {
      setLoadingSessions(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!session) {
      router.replace("/auth");
    }
  }, [router, session]);

  const userKey = userId ?? null;

  useEffect(() => {
    if (!userKey) return;
    let cancelled = false;

    // Defer synchronous state updates out of the effect body
    queueMicrotask(() => {
      if (cancelled) return;
      setLoading(true);
      setError("");
      setLoadingSessions(true);
    });

    fetchDashboard(userKey)
      .then((data) => {
        if (!cancelled) setDashboardData(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load dashboard");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    fetchFiles(userKey)
      .then((result) => {
        if (!cancelled) setAllFiles(result.files);
      })
      .catch(() => {
        // Non-critical
      });

    fetchChatSessions(userKey)
      .then((data) => {
        if (!cancelled) setChatSessions(data.sessions);
      })
      .catch(() => {
        // Non-critical
      })
      .finally(() => {
        if (!cancelled) setLoadingSessions(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userKey]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setUploading(true);
    try {
      await uploadFile(userId, file);
      await Promise.all([loadDashboard(), loadFiles()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (fileId: number) => {
    if (!userId) return;
    if (!window.confirm("Are you sure you want to delete this file? This action cannot be undone.")) return;

    setDeleting(fileId);
    try {
      await deleteFile(userId, fileId);
      await Promise.all([loadDashboard(), loadFiles()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  const handleSelectSession = useCallback(
    (s: ChatSession) => {
      if (s.session_id === activeSessionId) return;
      setSidebarOpen(false);
      setActiveNav("chat");
      setActiveSessionId(s.session_id);
      setActiveSessionTitle(s.title);
      setChatKey((k) => k + 1);
    },
    [activeSessionId],
  );

  const handleNewChat = useCallback(() => {
    setActiveSessionId(null);
    setActiveSessionTitle(null);
    setChatKey((k) => k + 1);
    setActiveNav("chat");
    setSidebarOpen(false);
  }, []);

  const handleSessionCreated = useCallback(
    (sessionId: string, title: string) => {
      setActiveSessionId(sessionId);
      setActiveSessionTitle(title);
      loadSessions();
    },
    [loadSessions],
  );

  if (!session) {
    return (
      <main className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: ACCENT }} />
      </main>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem("cofounder.session");
    router.replace("/auth");
  };

  const company = dashboardData?.company;
  const stats = dashboardData?.stats;
  const recentFiles = dashboardData?.recent_files ?? [];
  const activeNavLabel = navItems.find((item) => item.id === activeNav)?.label ?? "Dashboard";

  return (
    <div className="min-h-screen bg-[#fafafa] flex text-[#0a0a0a]">
      {/* ── Mobile overlay ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50 h-screen
          w-[264px] ${sidebarCollapsed ? "lg:w-[68px]" : "lg:w-[264px]"}
          bg-white border-r border-[#e5e7eb]
          flex flex-col shrink-0
          transition-[width,transform] duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className={`h-16 px-4 flex items-center border-b border-[#e5e7eb] ${sidebarCollapsed ? "lg:px-3" : ""}`}>
          <div className="flex items-center justify-between gap-2 w-full">
            <Link href="/" className="flex min-w-0 items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#fafafa] border border-[#e5e7eb] flex items-center justify-center overflow-hidden shrink-0">
                <Image src="/logo.png" alt="Cofounder.ai" width={24} height={24} className="w-6 h-6 object-contain" />
              </div>
              <span className={`font-semibold text-[15px] tracking-tight truncate ${sidebarCollapsed ? "lg:hidden" : ""}`}>
                Cofounder<span style={{ color: ACCENT }}>.ai</span>
              </span>
            </Link>
            <button
              onClick={() => setSidebarCollapsed((v) => !v)}
              className="hidden lg:flex w-6 h-6 rounded-md hover:bg-[#f3f4f6] items-center justify-center shrink-0 transition-colors"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <ChevronRight
                className={`w-3.5 h-3.5 text-[#9ca3af] transition-transform ${sidebarCollapsed ? "" : "rotate-180"}`}
              />
            </button>
          </div>
        </div>

        {/* New chat */}
        <div className={`p-3 ${sidebarCollapsed ? "lg:px-2.5" : ""}`}>
          <button
            onClick={handleNewChat}
            className={`w-full btn-primary py-2 text-[13px] ${sidebarCollapsed ? "lg:px-0" : "px-3.5"}`}
            title="New Chat"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className={sidebarCollapsed ? "lg:hidden" : ""}>New Chat</span>
          </button>
        </div>

        {/* Nav */}
        <nav className={`px-3 space-y-0.5 ${sidebarCollapsed ? "lg:px-2.5" : ""}`}>
          {navItems.map((item) => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveNav(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                  sidebarCollapsed ? "lg:justify-center lg:px-0" : ""
                } ${
                  isActive
                    ? "bg-[#eef2ff] text-[#4f46e5]"
                    : "text-[#6b7280] hover:text-[#0a0a0a] hover:bg-[#f3f4f6]"
                }`}
                title={item.label}
              >
                <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#4f46e5]" : "text-[#9ca3af]"}`} />
                <span className={sidebarCollapsed ? "lg:hidden" : ""}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className={`mx-4 my-3 border-t border-[#f3f4f6] ${sidebarCollapsed ? "lg:mx-3" : ""}`} />

        {/* Chat history */}
        <div className={`flex-1 overflow-y-auto px-3 pb-3 ${sidebarCollapsed ? "lg:hidden" : ""}`}>
          <p className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider px-3 py-2">
            Recent Chats
          </p>

          {loadingSessions && chatSessions.length === 0 && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-4 h-4 animate-spin text-[#d4d4d8]" />
            </div>
          )}

          {!loadingSessions && chatSessions.length === 0 && (
            <p className="text-xs text-[#9ca3af] text-center py-6 px-4">
              No chats yet. Start a new one!
            </p>
          )}

          <div className="space-y-0.5">
            {chatSessions.map((s) => {
              const isActive = s.session_id === activeSessionId && activeNav === "chat";
              const sessionDate = s.created_at
                ? (() => {
                    const d = new Date(s.created_at);
                    const now = new Date();
                    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
                    if (diffDays === 0) return "Today";
                    if (diffDays === 1) return "Yesterday";
                    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  })()
                : "";
              return (
                <button
                  key={s.session_id}
                  onClick={() => handleSelectSession(s)}
                  className={`w-full text-left rounded-lg px-3 py-2 transition-colors group ${
                    isActive ? "bg-[#eef2ff]" : "hover:bg-[#f3f4f6]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <MessageSquare
                      className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-[#4f46e5]" : "text-[#9ca3af]"}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className={`text-[13px] font-medium truncate ${isActive ? "text-[#4f46e5]" : "text-[#374151]"}`}>
                        {s.title || "Untitled Chat"}
                      </div>
                      <div className="text-[10px] text-[#9ca3af] flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {sessionDate}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div className={sidebarCollapsed ? "hidden lg:block flex-1" : "hidden"} />

        {/* User */}
        <div className={`p-3 border-t border-[#e5e7eb] ${sidebarCollapsed ? "lg:px-2.5" : ""}`}>
          <div className={`flex items-center gap-2.5 ${sidebarCollapsed ? "lg:flex-col" : ""}`}>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-semibold shrink-0"
              style={{ background: ACCENT }}
            >
              {session.user.email[0].toUpperCase()}
            </div>
            <div className={`flex-1 min-w-0 ${sidebarCollapsed ? "lg:hidden" : ""}`}>
              <div className="text-[13px] font-medium text-[#0a0a0a] truncate">
                {session.user.email}
              </div>
              <div className="text-[11px] text-[#9ca3af]">
                {company?.company_name ?? "Founder"}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors group"
              title="Log out"
            >
              <LogOut className="w-3.5 h-3.5 text-[#9ca3af] group-hover:text-red-500" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 nav-glass h-16 px-4 sm:px-6 flex items-center gap-3">
          <button
            onClick={() => { setSidebarCollapsed(false); setSidebarOpen(true); }}
            className="lg:hidden w-9 h-9 rounded-lg border border-[#e5e7eb] bg-white flex items-center justify-center shrink-0"
          >
            <Menu className="w-4 h-4 text-[#374151]" />
          </button>

          <h1 className="flex-1 min-w-0 text-[15px] font-semibold text-[#0a0a0a] truncate">
            {activeNavLabel}
          </h1>

          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-lg border border-[#e5e7eb] bg-white hover:bg-[#f9fafb] flex items-center justify-center relative transition-colors">
              <Bell className="w-4 h-4 text-[#6b7280]" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn-primary px-3.5 py-2 text-[13px] disabled:opacity-60"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{uploading ? "Uploading…" : "Upload"}</span>
            </button>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
          </div>
        </header>

        {/* Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Error banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-[13px] font-medium text-red-600"
            >
              {error}
              <button onClick={() => setError("")} className="ml-3 underline">Dismiss</button>
            </motion.div>
          )}

          {/* Loading */}
          {loading && !dashboardData && (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: ACCENT }} />
            </div>
          )}

          {/* ── OVERVIEW ── */}
          {!loading && dashboardData && activeNav === "overview" && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
              >
                <h2 className="text-2xl font-semibold tracking-tight text-[#0a0a0a]">
                  Welcome back,{" "}
                  <span className="text-gradient">
                    {company?.company_name ?? session.user.email.split("@")[0]}
                  </span>
                </h2>
                <p className="mt-1 text-sm text-[#6b7280]">
                  {company
                    ? `${company.industry} · ${company.tone} tone`
                    : "Here's what your AI team is up to today."}
                </p>
              </motion.div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {([
                  { label: "Total Files", value: String(stats?.total_files ?? 0), sub: `${stats?.documents ?? 0} docs · ${stats?.images ?? 0} images`, icon: HardDrive },
                  { label: "Storage Used", value: formatFileSize(stats?.total_size_bytes ?? 0), sub: "Drive", icon: HardDrive },
                  { label: "Company", value: company?.company_name ?? "—", sub: company?.industry ?? "", icon: Sparkles },
                  { label: "Brand Tone", value: (company?.tone ?? "professional").toUpperCase(), sub: company?.industry ?? "", icon: Sparkles },
                ] as { label: string; value: string; sub: string; icon: typeof HardDrive }[]).map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.05 + i * 0.05 }}
                    className="card p-5"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-8 h-8 rounded-lg bg-[#eef2ff] flex items-center justify-center">
                        <stat.icon className="w-4 h-4" style={{ color: ACCENT }} />
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-[#d4d4d8]" />
                    </div>
                    <div className="text-[11px] font-medium text-[#9ca3af] uppercase tracking-wider">
                      {stat.label}
                    </div>
                    <div className="mt-1 text-lg font-semibold text-[#0a0a0a] truncate">{stat.value}</div>
                    <div className="text-[11px] text-[#6b7280] mt-0.5 truncate">{stat.sub}</div>
                  </motion.div>
                ))}
              </div>

              {/* Two-column */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* About */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.25 }}
                    className="card p-6"
                  >
                    <div className="mb-3">
                      <h3 className="text-[15px] font-semibold text-[#0a0a0a]">
                        About {company?.company_name}
                      </h3>
                      <p className="text-[11px] text-[#9ca3af] mt-0.5 uppercase tracking-wider font-medium">
                        {company?.industry} · {company?.tone} tone
                      </p>
                    </div>
                    <p className="text-sm text-[#6b7280] leading-relaxed">
                      {company?.small_description ?? "No description provided."}
                    </p>
                  </motion.div>

                  {/* Recent files */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.35 }}
                    className="card p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[15px] font-semibold text-[#0a0a0a]">Recent Files</h3>
                      <button
                        onClick={() => setActiveNav("drive")}
                        className="text-[13px] font-medium hover:underline"
                        style={{ color: ACCENT }}
                      >
                        View all
                      </button>
                    </div>
                    {recentFiles.length === 0 ? (
                      <p className="text-sm text-[#9ca3af] py-6 text-center">
                        No files uploaded yet. Click Upload to get started.
                      </p>
                    ) : (
                      <div className="divide-y divide-[#f3f4f6]">
                        {recentFiles.map((file) => (
                          <div key={file.id} className="flex items-center gap-3.5 py-3 first:pt-0 last:pb-0">
                            <div
                              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                              style={{ background: isImageMime(file.mime_type) ? "#f5f3ff" : "#eef2ff" }}
                            >
                              {isImageMime(file.mime_type) ? (
                                <ImageIcon className="w-4 h-4 text-[#7c3aed]" />
                              ) : (
                                <FileText className="w-4 h-4" style={{ color: ACCENT }} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[13px] font-medium text-[#0a0a0a] truncate">
                                {file.original_file_name}
                              </div>
                              <div className="text-xs text-[#6b7280] truncate">
                                {file.description ?? file.mime_type}
                              </div>
                            </div>
                            <span className="text-xs font-medium text-[#9ca3af] shrink-0">
                              {formatFileSize(file.file_size)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* Quick actions */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.3 }}
                  className="card p-6 h-fit"
                >
                  <h3 className="text-[15px] font-semibold text-[#0a0a0a] mb-4">Quick Actions</h3>
                  <div className="space-y-2.5">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border border-[#e5e7eb] rounded-xl p-3.5 flex items-center gap-3 hover:border-[#4f46e5]/40 hover:bg-[#fafafa] transition-all text-left"
                    >
                      <div className="w-9 h-9 rounded-lg bg-[#eef2ff] flex items-center justify-center shrink-0">
                        <Upload className="w-4 h-4" style={{ color: ACCENT }} />
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold text-[#0a0a0a]">Upload File</div>
                        <div className="text-[11px] text-[#6b7280]">Add to your Drive</div>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveNav("drive")}
                      className="w-full border border-[#e5e7eb] rounded-xl p-3.5 flex items-center gap-3 hover:border-[#4f46e5]/40 hover:bg-[#fafafa] transition-all text-left"
                    >
                      <div className="w-9 h-9 rounded-lg bg-[#eef2ff] flex items-center justify-center shrink-0">
                        <HardDrive className="w-4 h-4" style={{ color: ACCENT }} />
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold text-[#0a0a0a]">Browse Drive</div>
                        <div className="text-[11px] text-[#6b7280]">{stats?.total_files ?? 0} files</div>
                      </div>
                    </button>

                    <button
                      onClick={handleNewChat}
                      className="w-full border border-[#e5e7eb] rounded-xl p-3.5 flex items-center gap-3 hover:border-[#4f46e5]/40 hover:bg-[#fafafa] transition-all text-left"
                    >
                      <div className="w-9 h-9 rounded-lg bg-[#eef2ff] flex items-center justify-center shrink-0">
                        <MessageSquare className="w-4 h-4" style={{ color: ACCENT }} />
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold text-[#0a0a0a]">New Chat</div>
                        <div className="text-[11px] text-[#6b7280]">Talk to your AI team</div>
                      </div>
                    </button>
                  </div>
                </motion.div>
              </div>
            </>
          )}

          {/* ── DRIVE ── */}
          {activeNav === "drive" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-[#0a0a0a]">Drive</h2>
                  <p className="text-sm text-[#6b7280] mt-0.5">
                    {allFiles.length} file{allFiles.length !== 1 ? "s" : ""} · {formatFileSize(stats?.total_size_bytes ?? 0)} total
                  </p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="btn-primary px-4 py-2.5 text-[13px] self-start disabled:opacity-60"
                >
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {uploading ? "Uploading…" : "Upload File"}
                </button>
              </div>

              {allFiles.length === 0 ? (
                <div className="card p-12 text-center flex flex-col items-center justify-center min-h-[320px]">
                  <div className="w-14 h-14 rounded-2xl bg-[#f3f4f6] flex items-center justify-center mb-4">
                    <HardDrive className="w-6 h-6 text-[#9ca3af]" />
                  </div>
                  <h3 className="text-[15px] font-semibold text-[#0a0a0a] mb-1">No files yet</h3>
                  <p className="text-sm text-[#6b7280] mb-5">Upload your first file to get started.</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-primary px-4 py-2.5 text-[13px]"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload File
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {allFiles.map((file, i) => (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="card card-hover p-4 flex flex-col group relative"
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }}
                        disabled={deleting === file.id}
                        className="absolute top-2.5 right-2.5 w-7 h-7 rounded-lg bg-white border border-[#e5e7eb] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:border-red-200 hover:bg-red-50 z-10"
                        title="Delete file"
                      >
                        {deleting === file.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5 text-[#9ca3af]" />
                        )}
                      </button>

                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                        style={{ background: isImageMime(file.mime_type) ? "#f5f3ff" : "#eef2ff" }}
                      >
                        {isImageMime(file.mime_type) ? (
                          <ImageIcon className="w-5 h-5 text-[#7c3aed]" />
                        ) : (
                          <FileText className="w-5 h-5" style={{ color: ACCENT }} />
                        )}
                      </div>

                      <div className="text-[13px] font-semibold text-[#0a0a0a] truncate mb-0.5" title={file.original_file_name}>
                        {file.original_file_name}
                      </div>
                      <div className="text-xs text-[#9ca3af] truncate mb-3 flex-1">
                        {file.description ?? "No description"}
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#f3f4f6]">
                        <span className="text-[10px] font-semibold bg-[#eef2ff] rounded-md px-2 py-0.5 truncate" style={{ color: ACCENT }}>
                          {file.mime_type.split("/")[1]?.toUpperCase() ?? file.mime_type}
                        </span>
                        <span className="text-[11px] font-medium text-[#9ca3af] shrink-0">
                          {formatFileSize(file.file_size)}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#d4d4d8] mt-1.5">
                        {new Date(file.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── CHAT ── */}
          {activeNav === "chat" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Chat
                key={chatKey}
                user={session.user}
                initialSessionId={activeSessionId}
                initialTitle={activeSessionTitle}
                onSessionCreated={handleSessionCreated}
              />
            </motion.div>
          )}

          {/* ── SETTINGS ── */}
          {activeNav === "settings" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-12 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#f3f4f6] flex items-center justify-center mx-auto mb-4">
                <Settings className="w-6 h-6 text-[#9ca3af]" />
              </div>
              <h3 className="text-[15px] font-semibold text-[#0a0a0a] mb-1">Settings</h3>
              <p className="text-sm text-[#6b7280]">
                Account and company settings coming soon.
              </p>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
