"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Bell, LogOut, Menu,
  ChevronRight, MessageSquare, HardDrive,
  Plus, Clock, Trash2, Loader2,
  Puzzle, ChevronUp, Settings, CreditCard, Coins,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession, getSession, parseSessionUser, saveSession } from "@/lib/session";
import { fetchChatSessions, deleteChatSession, fetchMe, logoutUser, fetchProfile, fetchCreditBalance, type ChatSession } from "@/lib/api";
import SettingsModal from "./SettingsModal";

const ACCENT = "#143620";

const subscribeToSession = () => () => {};
const getServerSessionSnapshot = () => null;

type Props = { children: React.ReactNode };

export default function AppLayout({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useSyncExternalStore(subscribeToSession, getSession, getServerSessionSnapshot);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [deletingSession, setDeletingSession] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const userId = session?.user?.id;

  // Only redirect once the page has hydrated. During SSR/hydration the server
  // snapshot is always null, so without this guard a signed-in user could be
  // briefly seen as logged out and bounced to /auth.
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Load the company's available credits for the sidebar badge. Reloads on
  // route change so the badge refreshes after visiting /billing.
  const loadCredits = useCallback(async () => {
    if (!userId) return;
    try {
      const profile = await fetchProfile(userId);
      const data = await fetchCreditBalance(profile.company.id);
      setCredits(data.balance);
    } catch {
      // Non-critical — badge simply stays hidden.
    }
  }, [userId]);

  useEffect(() => {
    if (hydrated && userId) loadCredits();
  }, [hydrated, userId, pathname, loadCredits]);

  // Refresh the badge immediately when a payment adds credits on /billing
  // (the billing page dispatches this after a successful verification).
  useEffect(() => {
    const onCreditsUpdated = () => loadCredits();
    window.addEventListener("cofounder:credits-updated", onCreditsUpdated);
    return () =>
      window.removeEventListener("cofounder:credits-updated", onCreditsUpdated);
  }, [loadCredits]);

  const navItems = [
    { label: "Overview", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Chat", icon: MessageSquare, href: "/chat" },
    { label: "Drive", icon: HardDrive, href: "/drive" },
    { label: "Plugins", icon: Puzzle, href: "/plugins" },
  ];

  const loadSessions = useCallback(async () => {
    if (!userId) return;
    setLoadingSessions(true);
    try {
      const data = await fetchChatSessions(userId);
      setChatSessions(data.sessions);
    } catch { /* non-critical */ }
    finally { setLoadingSessions(false); }
  }, [userId]);

  useEffect(() => {
    if (!hydrated) return;
    if (!session) {
      // No local session — try cookie-based auto-login (backend /auth/me)
      // before bouncing to the login page. Covers refresh/deep-link after a
      // cookie was set at login.
      let cancelled = false;
      (async () => {
        const me = await fetchMe();
        if (cancelled) return;
        if (!me) {
          router.replace("/auth");
          return;
        }
        const user = parseSessionUser(me);
        if (!user) {
          router.replace("/auth");
          return;
        }
        saveSession(user, { onboardingComplete: me.onboarding_complete === true });
        // The session store has no subscription — reload re-mounts the tree
        // with the freshly saved session so all guards behave consistently.
        window.location.reload();
      })();
      return () => {
        cancelled = true;
      };
    }
    // Users who haven't completed onboarding can't use the app yet — send
    // them to the onboarding flow instead of broken company-less pages.
    if (!session.onboardingComplete) {
      router.replace("/onboarding");
      return;
    }
    // Reload on route change too: creating a new chat navigates to
    // /{sessionId} and the sidebar would otherwise never show the new session.
    loadSessions();
  }, [hydrated, session, router, loadSessions, pathname]);

  if (!session) {
    return <main className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" style={{ color: ACCENT }} /></main>;
  }

  const handleLogout = async () => {
    // Clear the backend session cookie too, so the next visit isn't
    // auto-logged-in.
    await logoutUser();
    clearSession();
    router.replace("/auth");
  };
  const handleNewChat = () => router.push("/chat");

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId || deletingSession) return;
    if (!window.confirm("Delete this chat session?")) return;
    setDeletingSession(sessionId);
    try { await deleteChatSession(userId, sessionId); await loadSessions(); }
    catch {}
    finally { setDeletingSession(null); }
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/chat") return pathname === "/chat" || pathname.startsWith("/chat/");
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[#fdfcf8] flex text-[#0f2214]">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-[264px] ${sidebarCollapsed ? "lg:w-[68px]" : "lg:w-[264px]"}
        bg-white/85 backdrop-blur-xl border-r border-[rgba(15,34,20,0.07)] flex flex-col shrink-0 transition-all duration-300 shadow-[4px_0_24px_-8px_rgba(15,34,20,0.06)]
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        {/* Logo */}
        <div className={`h-16 px-4 flex items-center border-b border-[rgba(15,34,20,0.07)] ${sidebarCollapsed ? "lg:px-3" : ""}`}>
          <div className="flex items-center justify-between gap-2 w-full">
            <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#fdfcf8] border border-[rgba(15,34,20,0.08)] flex items-center justify-center overflow-hidden shrink-0">
                <Image src="/icon.png" alt="Co-Founder AI" width={24} height={24} className="w-6 h-6 object-contain" />
              </div>
              <span className={`font-semibold text-[15px] tracking-tight truncate ${sidebarCollapsed ? "lg:hidden" : ""}`}>
                Co-Founder<span style={{ color: ACCENT }}> AI</span>
              </span>
            </Link>
            <button onClick={() => setSidebarCollapsed(v => !v)}
              className="hidden lg:flex w-6 h-6 rounded-md hover:bg-[rgba(16,36,24,0.05)] items-center justify-center shrink-0">
              <ChevronRight className={`w-3.5 h-3.5 text-[#8d9d94] transition-transform ${sidebarCollapsed ? "" : "rotate-180"}`} />
            </button>
          </div>
        </div>

        {/* New Chat */}
        <div className={`p-3 ${sidebarCollapsed ? "lg:px-2.5" : ""}`}>
          <button onClick={handleNewChat} className={`w-full btn-primary py-2 text-[13px] ${sidebarCollapsed ? "lg:px-0" : "px-3.5"}`}>
            <Plus className="w-4 h-4 shrink-0" /><span className={sidebarCollapsed ? "lg:hidden" : ""}>New Chat</span>
          </button>
        </div>

        {/* Nav */}
        <nav className={`px-3 space-y-0.5 ${sidebarCollapsed ? "lg:px-2.5" : ""}`}>
          {navItems.map(item => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                className={`group w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 relative overflow-hidden
                  ${sidebarCollapsed ? "lg:justify-center lg:px-0" : ""}
                  ${active ? "bg-[rgba(20,54,32,0.08)] text-[#143620] shadow-sm font-semibold" : "text-[#5f6f63] hover:text-[#0f2214] hover:bg-[rgba(16,36,24,0.05)]"}`}>
                {active && !sidebarCollapsed && (
                  <motion.div layoutId="activeNavIndicator" className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#143620] rounded-r-full" />
                )}
                <item.icon className={`w-4 h-4 shrink-0 transition-colors ${active ? "text-[#143620]" : "text-[#8d9d94] group-hover:text-[#5f6f63]"}`} />
                <span className={sidebarCollapsed ? "lg:hidden" : ""}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={`mx-4 my-3 border-t border-[rgba(15,34,20,0.06)] ${sidebarCollapsed ? "lg:mx-3" : ""}`} />

        {/* Chat history */}
        <div className={`flex-1 overflow-y-auto px-3 pb-3 ${sidebarCollapsed ? "lg:hidden" : ""}`}>
          <p className="text-[10px] font-semibold text-[#8d9d94] uppercase tracking-wider px-3 py-2">Recent Chats</p>
          {loadingSessions && chatSessions.length === 0 && (
            <div className="flex items-center justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-[#c2c9c0]" /></div>
          )}
          {!loadingSessions && chatSessions.length === 0 && (
            <p className="text-xs text-[#8d9d94] text-center py-6 px-4">No chats yet.</p>
          )}
          <div className="space-y-0.5">
            {chatSessions.map(s => {
              const active = pathname === `/${s.session_id}`;
              const sessionDate = s.created_at ? (() => {
                const d = new Date(s.created_at); const now = new Date();
                const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
                if (diff === 0) return "Today"; if (diff === 1) return "Yesterday";
                return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
              })() : "";
              return (
                <Link key={s.session_id} href={`/${s.session_id}`}
                  className={`w-full text-left rounded-lg px-3 py-2 transition-colors group flex items-center gap-2.5
                    ${active ? "bg-[rgba(20,54,32,0.07)]" : "hover:bg-[rgba(16,36,24,0.05)]"}`}>
                  <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${active ? "text-[#143620]" : "text-[#8d9d94]"}`} />
                  <div className="flex-1 min-w-0">
                    <div className={`text-[13px] font-medium truncate ${active ? "text-[#143620]" : "text-[#2f3e32]"}`}>{s.title || "Untitled"}</div>
                    <div className="text-[10px] text-[#8d9d94] flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{sessionDate}</div>
                  </div>
                  <button onClick={(e) => handleDeleteSession(s.session_id, e)} disabled={deletingSession === s.session_id}
                    className="opacity-0 group-hover:opacity-100 shrink-0 p-1 rounded-md hover:bg-red-50 text-[#8d9d94] hover:text-red-500">
                    {deletingSession === s.session_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </Link>
              );
            })}
          </div>
        </div>

        {/* User — click opens profile dropdown */}
        <div className={`p-3 border-t border-[rgba(15,34,20,0.07)] relative ${sidebarCollapsed ? "lg:px-2.5" : ""}`}>
          {/* Available credits — credits are currency-agnostic, show the count */}
          <div className={`mb-2 flex items-center gap-2 rounded-lg bg-[rgba(20,54,32,0.07)] border border-[rgba(20,54,32,0.12)] px-2.5 py-1.5 ${sidebarCollapsed ? "lg:justify-center" : ""}`}>
            <Coins className="w-3.5 h-3.5 shrink-0" style={{ color: ACCENT }} />
            <div className={`min-w-0 ${sidebarCollapsed ? "lg:hidden" : ""}`}>
              <div className="text-[13px] font-semibold leading-tight" style={{ color: ACCENT }}>
                {credits !== null ? credits.toLocaleString("en-IN") : "—"}
              </div>
              <div className="text-[10px] text-[#5f6f63] leading-tight">credits</div>
            </div>
          </div>
          <button
            onClick={() => setProfileOpen(v => !v)}
            className={`w-full flex items-center gap-2.5 rounded-lg p-2 hover:bg-[rgba(16,36,24,0.05)] transition-colors ${sidebarCollapsed ? "lg:justify-center lg:p-1.5" : ""}`}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-semibold shrink-0" style={{ background: ACCENT }}>
              {session.user.email[0].toUpperCase()}
            </div>
            <div className={`flex-1 min-w-0 text-left ${sidebarCollapsed ? "lg:hidden" : ""}`}>
              <div className="text-[13px] font-medium text-[#0f2214] truncate">{session.user.email}</div>
            </div>
            <ChevronUp className={`w-3 h-3 text-[#8d9d94] transition-transform ${profileOpen ? "" : "rotate-180"} ${sidebarCollapsed ? "lg:hidden" : ""}`} />
          </button>

          {/* Dropdown */}
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className={`absolute bottom-full left-3 right-3 mb-2 bg-white/90 backdrop-blur-xl border border-[rgba(15,34,20,0.07)] rounded-xl shadow-[0_8px_30px_rgba(15,34,20,0.12)] overflow-hidden z-50 ${sidebarCollapsed ? "lg:left-2.5 lg:right-2.5" : ""}`}
              >
                <div className={`px-3 py-2 border-b border-[rgba(15,34,20,0.06)] ${sidebarCollapsed ? "lg:hidden" : ""}`}>
                  <div className="text-[13px] font-medium text-[#0f2214] truncate">{session.user.email}</div>
                </div>
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    setSettingsOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium text-[#2f3e32] hover:bg-[rgba(16,36,24,0.05)] transition-colors"
                >
                  <Settings className="w-4 h-4 text-[#8d9d94]" />
                  Settings
                </button>
                <Link
                  href="/billing"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium text-[#2f3e32] hover:bg-[rgba(16,36,24,0.05)] transition-colors"
                >
                  <CreditCard className="w-4 h-4 text-[#8d9d94]" />
                  Billing &amp; Credits
                </Link>
                <button
                  onClick={() => { setProfileOpen(false); handleLogout(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium text-red-500 hover:bg-red-50 transition-colors border-t border-[rgba(15,34,20,0.06)]"
                >
                  <LogOut className="w-4 h-4" />
                  Log out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-[rgba(253,252,248,0.78)] backdrop-blur-xl border-b border-[rgba(15,34,20,0.07)] h-16 px-4 sm:px-6 flex items-center gap-3 transition-colors">
          <button onClick={() => { setSidebarCollapsed(false); setSidebarOpen(true); }}
            className="lg:hidden w-9 h-9 rounded-lg border border-[rgba(15,34,20,0.08)] bg-white flex items-center justify-center shrink-0">
            <Menu className="w-4 h-4 text-[#2f3e32]" />
          </button>
          <div className="flex-1" />
          <button className="w-9 h-9 rounded-lg border border-[rgba(15,34,20,0.08)] bg-white hover:bg-[#fdfcf8] flex items-center justify-center relative">
            <Bell className="w-4 h-4 text-[#5f6f63]" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />
          </button>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-[#fdfcf8]">{children}</main>
      </div>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
