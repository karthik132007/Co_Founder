"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, LayoutDashboard, Settings,
  Bell, LogOut, Menu,
  ChevronRight, Sparkles,
  Zap, MessageSquare, ArrowUpRight, HardDrive,
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

/* ─────────────────────────────────────────────
   Session
   ───────────────────────────────────────────── */

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

  // Data state
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [allFiles, setAllFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  // Chat session state
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeSessionTitle, setActiveSessionTitle] = useState<string | null>(null);
  // Key to force Chat component remount on session switch
  const [chatKey, setChatKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Fetch dashboard data ── */
  const loadDashboard = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchDashboard(session.user.id);
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  /* ── Fetch all files (for Drive tab) ── */
  const loadFiles = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const result = await fetchFiles(session.user.id);
      setAllFiles(result.files);
    } catch {
      // Silently fail — files are non-critical
    }
  }, [session?.user?.id]);

  /* ── Load chat sessions ── */
  const loadSessions = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoadingSessions(true);
    try {
      const data = await fetchChatSessions(session.user.id);
      setChatSessions(data.sessions);
    } catch {
      // Silently fail
    } finally {
      setLoadingSessions(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (!session) {
      router.replace("/auth");
    }
  }, [router, session]);

  useEffect(() => {
    if (session?.user?.id) {
      loadDashboard();
      loadFiles();
      loadSessions();
    }
  }, [session?.user?.id, loadDashboard, loadFiles, loadSessions]);

  /* ── File upload handler ── */
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session?.user?.id) return;

    setUploading(true);
    try {
      await uploadFile(session.user.id, file);
      // Refresh both dashboard and file list
      await Promise.all([loadDashboard(), loadFiles()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  /* ── File delete handler ── */
  const handleDelete = async (fileId: number) => {
    if (!session?.user?.id) return;
    if (!window.confirm("Are you sure you want to delete this file? This action cannot be undone.")) return;

    setDeleting(fileId);
    try {
      await deleteFile(session.user.id, fileId);
      // Refresh both dashboard and file list
      await Promise.all([loadDashboard(), loadFiles()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  /* ── Select a chat session ── */
  const handleSelectSession = useCallback(
    async (s: ChatSession) => {
      if (s.session_id === activeSessionId) return;
      setSidebarOpen(false);
      setActiveNav("chat");
      setActiveSessionId(s.session_id);
      setActiveSessionTitle(s.title);
      setChatKey((k) => k + 1);  // remount Chat to load new session
    },
    [activeSessionId],
  );

  /* ── New chat ── */
  const handleNewChat = useCallback(() => {
    setActiveSessionId(null);
    setActiveSessionTitle(null);
    setChatKey((k) => k + 1);  // remount Chat for fresh session
    setActiveNav("chat");
    setSidebarOpen(false);
  }, []);

  /* ── Called by Chat when a new session is created ── */
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
      <main className="min-h-screen bg-[#f8faff] flex items-center justify-center" style={{ fontFamily: "SF Mono, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace" }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#635BFF" }} />
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
    <div className="min-h-screen bg-[#f8faff] flex" style={{ fontFamily: "SF Mono, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace" }}>
      
      {/* ── Mobile overlay ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen
        w-64 ${sidebarCollapsed ? "lg:w-20" : "lg:w-64"} bg-[#f0f2f8] border-r border-white/60
        flex flex-col shrink-0
        transition-[width,transform] duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        shadow-[8px_0_20px_rgba(163,177,198,0.15)]
      `}>
        {/* Logo */}
        <div className={`px-5 py-5 border-b border-white/50 ${sidebarCollapsed ? "lg:px-2" : ""}`}>
          <div className="flex items-center justify-between gap-2">
            <Link href="/" className="flex min-w-0 items-center gap-2.5 group">
              <div className={`w-9 h-9 neu-circle rounded-full flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden shrink-0 ${sidebarCollapsed ? "lg:w-8 lg:h-8" : ""}`}>
                <Image src="/logo.png" alt="Logo" width={28} height={28} className="w-7 h-7 object-contain" />
              </div>
              <span className={`font-bold text-lg tracking-tight text-[#111827] truncate ${sidebarCollapsed ? "lg:hidden" : ""}`}>
                Cofounder<span style={{ color: "#635BFF" }}>.ai</span>
              </span>
            </Link>
            <button
              onClick={() => setSidebarCollapsed((value) => !value)}
              className="hidden lg:flex w-7 h-7 neu-circle rounded-full items-center justify-center shrink-0"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <ChevronRight
                className={`w-3.5 h-3.5 text-[#6B7280] transition-transform ${
                  sidebarCollapsed ? "" : "rotate-180"
                }`}
              />
            </button>
          </div>
        </div>

        {/* ── New Chat button (always visible) ── */}
        <div className={`px-3 pt-3 pb-2 shrink-0 ${sidebarCollapsed ? "lg:px-2" : ""}`}>
          <button
            onClick={handleNewChat}
            className={`w-full neu-inset rounded-xl px-3 py-2.5 flex items-center gap-2.5 text-xs font-bold text-[#6B7280] hover:text-[#635BFF] hover:ring-2 hover:ring-[#635BFF]/20 transition-all ${
              sidebarCollapsed ? "lg:justify-center lg:px-0" : ""
            }`}
            title="New Chat"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span className={sidebarCollapsed ? "lg:hidden" : ""}>New Chat</span>
          </button>
        </div>

        {/* Nav items */}
        <nav className={`px-3 py-2 space-y-1 shrink-0 ${sidebarCollapsed ? "lg:px-2" : ""}`}>
          {navItems.map((item) => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveNav(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 group ${
                  sidebarCollapsed ? "lg:justify-center lg:px-0" : ""
                } ${
                  isActive
                    ? "neu-pill-accent shadow-lg"
                    : "text-[#6B7280] hover:text-[#111827] hover:bg-white/40"
                }`}
                title={item.label}
              >
                <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-[#9CA3AF] group-hover:text-[#635BFF]"}`} />
                <span className={sidebarCollapsed ? "lg:hidden" : ""}>{item.label}</span>
                {isActive && <ChevronRight className={`w-3.5 h-3.5 ml-auto ${sidebarCollapsed ? "lg:hidden" : ""}`} />}
              </button>
            );
          })}
        </nav>

        {/* Divider */}
        <div className={`px-5 py-2 shrink-0 ${sidebarCollapsed ? "lg:px-3" : ""}`}>
          <div className="border-t border-white/50" />
        </div>

        {/* ── Chat History ── */}
        <div className={`flex-1 overflow-y-auto px-3 pb-3 ${sidebarCollapsed ? "lg:hidden" : ""}`}>
          <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider px-4 py-2">
            Chat History
          </p>

          {loadingSessions && chatSessions.length === 0 && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-4 h-4 animate-spin text-[#B0B7C3]" />
            </div>
          )}

          {!loadingSessions && chatSessions.length === 0 && (
            <p className="text-[10px] text-[#B0B7C3] font-medium text-center py-6 px-4">
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
                  className={`w-full text-left rounded-xl px-3 py-2.5 transition-all duration-200 group ${
                    isActive
                      ? "bg-[#635BFF]/10 ring-1 ring-[#635BFF]/20"
                      : "hover:bg-white/40"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <MessageSquare
                      className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                        isActive ? "text-[#635BFF]" : "text-[#B0B7C3] group-hover:text-[#635BFF]"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-[11px] font-bold truncate ${
                          isActive ? "text-[#635BFF]" : "text-[#111827]"
                        }`}
                      >
                        {s.title || "Untitled Chat"}
                      </div>
                      <div className="text-[9px] font-medium mt-0.5 flex items-center gap-1 text-[#B0B7C3]">
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

        {/* User profile */}
        <div className={`px-5 py-4 border-t border-white/50 shrink-0 ${sidebarCollapsed ? "lg:px-2" : ""}`}>
          <div className={`flex items-center gap-3 ${sidebarCollapsed ? "lg:flex-col lg:gap-2" : ""}`}>
            <div className="w-9 h-9 rounded-xl bg-[#635BFF] flex items-center justify-center text-white text-xs font-bold shrink-0">
              {session.user.email[0].toUpperCase()}
            </div>
            <div className={`flex-1 min-w-0 ${sidebarCollapsed ? "lg:hidden" : ""}`}>
              <div className="text-xs font-bold text-[#111827] truncate">
                {session.user.email}
              </div>
              <div className="text-[10px] text-[#9CA3AF] font-medium">
                {company?.company_name ?? "Founder"}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-8 h-8 neu-circle rounded-full flex items-center justify-center hover:text-red-500 transition-colors"
              title="Log out"
            >
              <LogOut className="w-3.5 h-3.5 text-[#9CA3AF]" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-[#f8faff]/80 backdrop-blur-xl border-b border-white/60 px-4 sm:px-8 py-3.5 flex items-center gap-4">
          {/* Mobile menu trigger */}
          <button
            onClick={() => { setSidebarCollapsed(false); setSidebarOpen(true); }}
            className="lg:hidden neu-circle rounded-full w-9 h-9 flex-shrink-0"
          >
            <Menu className="w-4 h-4 text-[#4B5563]" />
          </button>

          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-[#111827] truncate">
              {activeNavLabel}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button className="neu-circle rounded-full w-9 h-9 relative">
              <Bell className="w-4 h-4 text-[#6B7280]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#635BFF]" />
            </button>
            {/* Upload button (visible on Drive tab too) */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="neu-pill-accent px-4 py-2 text-xs font-bold flex items-center gap-2 disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{uploading ? "Uploading..." : "Upload"}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleUpload}
            />
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 p-4 sm:p-8 space-y-8">
          
          {/* Error banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs font-bold text-red-600"
            >
              {error}
              <button onClick={() => setError("")} className="ml-3 underline">Dismiss</button>
            </motion.div>
          )}

          {/* Loading state */}
          {loading && !dashboardData && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#635BFF" }} />
            </div>
          )}

          {/* ── OVERVIEW TAB ── */}
          {!loading && dashboardData && activeNav === "overview" && (
            <>
              {/* Welcome */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827]">
                  Welcome back{" "}
                  <span className="text-gradient">
                    {company?.company_name ?? session.user.email.split("@")[0]}
                  </span>
                </h1>
                <p className="mt-1.5 text-sm text-[#6B7280] font-medium">
                  {company
                    ? `${company.industry} · ${company.tone} tone`
                    : "Here's what your AI team is up to today."}
                </p>
              </motion.div>

              {/* Stats row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {([
                  { label: "Total Files", value: String(stats?.total_files ?? 0), change: `${stats?.documents ?? 0} docs · ${stats?.images ?? 0} imgs`, icon: HardDrive, color: "#635BFF" },
                  { label: "Storage Used", value: formatFileSize(stats?.total_size_bytes ?? 0), change: "Drive", icon: HardDrive, color: "#8B85FF" },
                  { label: "Company", value: company?.company_name ?? "—", change: company?.industry ?? "", icon: Sparkles, color: "#635BFF" },
                  { label: "Brand Tone", value: (company?.tone ?? "professional").toUpperCase(), change: company?.industry ?? "", icon: Sparkles, color: "#8B85FF" },
                ] as { label: string; value: string; change: string; icon: typeof HardDrive; color: string }[]).map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 + i * 0.06 }}
                    className="neu-card rounded-2xl p-5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 neu-circle rounded-full">
                        <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-[#B0B7C3]" />
                    </div>
                    <div className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1">
                      {stat.label}
                    </div>
                    <div className="text-xl font-bold text-[#111827] truncate">{stat.value}</div>
                    <div className="text-[11px] font-bold text-emerald-500 mt-1">
                      {stat.change}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Two-column layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Company description + Recent files (2 cols) */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Company description card */}
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.35 }}
                    className="neu-card rounded-2xl p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-[#111827]">About {company?.company_name}</h3>
                        <p className="text-[10px] text-[#9CA3AF] font-bold mt-0.5 uppercase tracking-wider">
                          {company?.industry} · {company?.tone} tone
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-[#6B7280] leading-relaxed font-medium">
                      {company?.small_description ?? "No description provided."}
                    </p>
                  </motion.div>

                  {/* Recent Files */}
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.45 }}
                    className="neu-card rounded-2xl p-6"
                  >
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-sm font-bold text-[#111827]">Recent Files</h3>
                      <button
                        onClick={() => setActiveNav("drive")}
                        className="text-[10px] font-bold text-[#635BFF] hover:underline"
                      >
                        View all
                      </button>
                    </div>
                    {recentFiles.length === 0 ? (
                      <p className="text-xs text-[#9CA3AF] font-medium py-4 text-center">
                        No files uploaded yet. Click Upload to get started.
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {recentFiles.map((file, i) => (
                          <div
                            key={file.id}
                            className="flex items-center gap-3.5 p-2.5 rounded-xl hover:bg-white/60 transition-colors"
                          >
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                              style={{ background: isImageMime(file.mime_type) ? "#8B85FF15" : "#635BFF15" }}
                            >
                              {isImageMime(file.mime_type) ? (
                                <ImageIcon className="w-4 h-4" style={{ color: "#8B85FF" }} />
                              ) : (
                                <FileText className="w-4 h-4" style={{ color: "#635BFF" }} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[11px] font-bold text-[#111827] truncate">
                                {file.original_file_name}
                              </div>
                              <div className="text-[10px] text-[#6B7280] font-medium truncate">
                                {file.description ?? file.mime_type}
                              </div>
                            </div>
                            <span className="text-[9px] font-bold text-[#B0B7C3] shrink-0">
                              {formatFileSize(file.file_size)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* Quick actions (1 col) */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  className="neu-card rounded-2xl p-6"
                >
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-bold text-[#111827]">Quick Actions</h3>
                  </div>
                  <div className="space-y-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full neu-inset rounded-xl p-3.5 flex items-center gap-3 hover:ring-2 hover:ring-[#635BFF]/20 transition-all text-left"
                    >
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#635BFF15" }}>
                        <Upload className="w-4 h-4" style={{ color: "#635BFF" }} />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-[#111827]">Upload File</div>
                        <div className="text-[9px] text-[#6B7280] font-medium">Add to your Drive</div>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveNav("drive")}
                      className="w-full neu-inset rounded-xl p-3.5 flex items-center gap-3 hover:ring-2 hover:ring-[#635BFF]/20 transition-all text-left"
                    >
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#8B85FF15" }}>
                        <HardDrive className="w-4 h-4" style={{ color: "#8B85FF" }} />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-[#111827]">Browse Drive</div>
                        <div className="text-[9px] text-[#6B7280] font-medium">{stats?.total_files ?? 0} files</div>
                      </div>
                    </button>
                  </div>

                  {/* Quick prompt */}
                  <div className="mt-5 neu-inset rounded-xl p-3">
                    <div className="flex items-center gap-2.5">
                      <MessageSquare className="w-3.5 h-3.5 text-[#635BFF] shrink-0" />
                      <span className="text-[10px] text-[#B0B7C3] font-medium flex-1">
                        Ask your AI team...
                      </span>
                      <Zap className="w-3 h-3 text-[#635BFF]" />
                    </div>
                  </div>
                </motion.div>
              </div>
            </>
          )}

          {/* ── DRIVE TAB ── */}
          {activeNav === "drive" && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Drive header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-[#111827]">Drive</h2>
                  <p className="text-xs text-[#6B7280] font-medium mt-0.5">
                    {allFiles.length} file{allFiles.length !== 1 ? "s" : ""} ·{" "}
                    {formatFileSize(stats?.total_size_bytes ?? 0)} total
                  </p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="neu-pill-accent px-5 py-2.5 text-xs font-bold flex items-center gap-2 self-start disabled:opacity-60"
                >
                  {uploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  {uploading ? "Uploading..." : "Upload File"}
                </button>
              </div>

              {/* Files grid */}
              {allFiles.length === 0 ? (
                <div className="neu-card rounded-2xl p-12 text-center">
                  <HardDrive className="w-12 h-12 mx-auto mb-4 text-[#D1D5DB]" />
                  <h3 className="text-sm font-bold text-[#111827] mb-1">No files yet</h3>
                  <p className="text-xs text-[#9CA3AF] font-medium mb-4">
                    Upload your first file to get started.
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="neu-pill-accent px-5 py-2.5 text-xs font-bold inline-flex items-center gap-2"
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
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="neu-card rounded-2xl p-4 flex flex-col group relative hover:shadow-lg transition-shadow"
                    >
                      {/* Delete button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }}
                        disabled={deleting === file.id}
                        className="absolute top-2.5 right-2.5 w-7 h-7 neu-circle rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 z-10"
                        title="Delete file"
                      >
                        {deleting === file.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5 text-[#9CA3AF] hover:text-red-500 transition-colors" />
                        )}
                      </button>

                      {/* File icon */}
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                        style={{ background: isImageMime(file.mime_type) ? "#8B85FF15" : "#635BFF15" }}
                      >
                        {isImageMime(file.mime_type) ? (
                          <ImageIcon className="w-6 h-6" style={{ color: "#8B85FF" }} />
                        ) : (
                          <FileText className="w-6 h-6" style={{ color: "#635BFF" }} />
                        )}
                      </div>

                      {/* File name */}
                      <div className="text-[11px] font-bold text-[#111827] truncate mb-1" title={file.original_file_name}>
                        {file.original_file_name}
                      </div>

                      {/* Description */}
                      <div className="text-[10px] text-[#9CA3AF] font-medium truncate mb-3 flex-1">
                        {file.description ?? "No description"}
                      </div>

                      {/* Footer: type + size + date */}
                      <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/40">
                        <span className="text-[9px] font-bold text-[#635BFF] bg-[#635BFF]/10 rounded-md px-2 py-0.5 truncate">
                          {file.mime_type.split("/")[1]?.toUpperCase() ?? file.mime_type}
                        </span>
                        <span className="text-[9px] font-bold text-[#B0B7C3] shrink-0">
                          {formatFileSize(file.file_size)}
                        </span>
                      </div>
                      <div className="text-[9px] text-[#D1D5DB] font-medium mt-1">
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

          {/* ── CHAT TAB ── */}
          {activeNav === "chat" && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Chat
                key={chatKey}
                user={session.user}
                initialSessionId={activeSessionId}
                initialTitle={activeSessionTitle}
                onSessionCreated={handleSessionCreated}
              />
            </motion.div>
          )}

          {/* ── SETTINGS TAB (placeholder) ── */}
          {activeNav === "settings" && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="neu-card rounded-2xl p-8 text-center"
            >
              <Settings className="w-12 h-12 mx-auto mb-4 text-[#D1D5DB]" />
              <h3 className="text-sm font-bold text-[#111827] mb-1">Settings</h3>
              <p className="text-xs text-[#9CA3AF] font-medium">
                Account and company settings coming soon.
              </p>
            </motion.div>
          )}

        </main>
      </div>
    </div>
  );
}
