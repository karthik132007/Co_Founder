"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  MessageSquare,
  HardDrive,
  Puzzle,
  Plus,
  Clock,
  Coins,
  ChevronRight,
  ChevronUp,
  Bell,
  Menu,
  ArrowLeft,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DEMO_CHATS, DEMO_COMPANY, chatDateLabel, getDemoChat } from "./demoChats";
import DemoBot from "./DemoBot";

const ACCENT = "#143620";

const NAV = [
  { label: "Overview", icon: LayoutDashboard, href: "/demo" },
  { label: "Chat", icon: MessageSquare, href: "/demo/chat" },
  { label: "Drive", icon: HardDrive, href: "/demo/drive" },
  { label: "Plugins", icon: Puzzle, href: "/demo/plugins" },
];

/**
 * Read-only replica of the real `AppLayout` (sidebar + header). It keeps the
 * exact markup, spacing and states of the product so a visitor exploring the
 * demo sees the same workspace they'd get after signing up — minus anything
 * that would write to the account.
 */
export default function DemoShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isActive = (href: string) => {
    if (href === "/demo") return pathname === "/demo";
    if (href === "/demo/chat") return pathname.startsWith("/demo/chat");
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const activeChatId = pathname.startsWith("/demo/chat/")
    ? pathname.slice("/demo/chat/".length)
    : null;
  const activeChat = activeChatId ? getDemoChat(activeChatId) : undefined;

  return (
    <div className="min-h-screen bg-[#fdfcf8] flex text-[#0f2214]">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-[264px] ${
          sidebarCollapsed ? "lg:w-[68px]" : "lg:w-[264px]"
        } bg-white/85 backdrop-blur-xl border-r border-[rgba(15,34,20,0.07)] flex flex-col shrink-0 transition-all duration-300 shadow-[4px_0_24px_-8px_rgba(15,34,20,0.06)] ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className={`h-16 px-4 flex items-center border-b border-[rgba(15,34,20,0.07)] ${sidebarCollapsed ? "lg:px-3" : ""}`}>
          <div className="flex items-center justify-between gap-2 w-full">
            <Link href="/demo" className="flex min-w-0 items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#fdfcf8] border border-[rgba(15,34,20,0.08)] flex items-center justify-center overflow-hidden shrink-0">
                <Image src="/icon.png" alt="Co-Founder AI" width={24} height={24} className="w-6 h-6 object-contain" />
              </div>
              <span className={`font-semibold text-[15px] tracking-tight truncate ${sidebarCollapsed ? "lg:hidden" : ""}`}>
                Co-Founder<span style={{ color: ACCENT }}> AI</span>
              </span>
            </Link>
            <button
              onClick={() => setSidebarCollapsed((v) => !v)}
              aria-label="Collapse sidebar"
              className="hidden lg:flex w-6 h-6 rounded-md hover:bg-[rgba(16,36,24,0.05)] items-center justify-center shrink-0"
            >
              <ChevronRight className={`w-3.5 h-3.5 text-[#8d9d94] transition-transform ${sidebarCollapsed ? "" : "rotate-180"}`} />
            </button>
          </div>
        </div>

        {/* New Chat — in the demo it opens the read-only "new chat" state */}
        <div className={`p-3 ${sidebarCollapsed ? "lg:px-2.5" : ""}`}>
          <Link
            href="/demo/chat"
            onClick={() => setSidebarOpen(false)}
            className={`w-full btn-primary py-2 text-[13px] ${sidebarCollapsed ? "lg:px-0" : "px-3.5"}`}
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className={sidebarCollapsed ? "lg:hidden" : ""}>New Chat</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className={`px-3 space-y-0.5 ${sidebarCollapsed ? "lg:px-2.5" : ""}`}>
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`group w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 relative overflow-hidden ${
                  sidebarCollapsed ? "lg:justify-center lg:px-0" : ""
                } ${
                  active
                    ? "bg-[rgba(20,54,32,0.08)] text-[#143620] shadow-sm font-semibold"
                    : "text-[#5f6f63] hover:text-[#0f2214] hover:bg-[rgba(16,36,24,0.05)]"
                }`}
              >
                {active && !sidebarCollapsed && (
                  <motion.div
                    layoutId="demoActiveNavIndicator"
                    className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#143620] rounded-r-full"
                  />
                )}
                <item.icon className={`w-4 h-4 shrink-0 transition-colors ${active ? "text-[#143620]" : "text-[#8d9d94] group-hover:text-[#5f6f63]"}`} />
                <span className={sidebarCollapsed ? "lg:hidden" : ""}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={`mx-4 my-3 border-t border-[rgba(15,34,20,0.06)] ${sidebarCollapsed ? "lg:mx-3" : ""}`} />

        {/* Recent chats — the six recorded conversations */}
        <div className={`flex-1 overflow-y-auto px-3 pb-3 ${sidebarCollapsed ? "lg:hidden" : ""}`}>
          <p className="text-[10px] font-semibold text-[#8d9d94] uppercase tracking-wider px-3 py-2">Recent Chats</p>
          <div className="space-y-0.5">
            {DEMO_CHATS.map((chat) => {
              const active = activeChatId === chat.id;
              return (
                <Link
                  key={chat.id}
                  href={`/demo/chat/${chat.id}`}
                  onClick={() => setSidebarOpen(false)}
                  className={`w-full text-left rounded-lg px-3 py-2 transition-colors flex items-center gap-2.5 ${
                    active ? "bg-[rgba(20,54,32,0.07)]" : "hover:bg-[rgba(16,36,24,0.05)]"
                  }`}
                >
                  <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${active ? "text-[#143620]" : "text-[#8d9d94]"}`} />
                  <div className="flex-1 min-w-0">
                    <div className={`text-[13px] font-medium truncate ${active ? "text-[#143620]" : "text-[#2f3e32]"}`}>
                      {chat.title}
                    </div>
                    <div className="text-[10px] text-[#8d9d94] flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {chatDateLabel(chat)}
                      <span className="text-[#c6d0c9]">·</span>
                      <Coins className="w-2.5 h-2.5" />
                      {chat.creditsUsed.toFixed(2)}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* User — static footer (no account actions in the demo) */}
        <div className={`p-3 border-t border-[rgba(15,34,20,0.07)] ${sidebarCollapsed ? "lg:px-2.5" : ""}`}>
          <div className={`mb-2 flex items-center gap-2 rounded-lg bg-[rgba(20,54,32,0.07)] border border-[rgba(20,54,32,0.12)] px-2.5 py-1.5 ${sidebarCollapsed ? "lg:justify-center" : ""}`}>
            <Coins className="w-3.5 h-3.5 shrink-0" style={{ color: ACCENT }} />
            <div className={`min-w-0 ${sidebarCollapsed ? "lg:hidden" : ""}`}>
              <div className="text-[13px] font-semibold leading-tight" style={{ color: ACCENT }}>
                {DEMO_COMPANY.credits.toLocaleString("en-IN")}
              </div>
              <div className="text-[10px] text-[#5f6f63] leading-tight">credits</div>
            </div>
          </div>
          <div className={`w-full flex items-center gap-2.5 rounded-lg p-2 ${sidebarCollapsed ? "lg:justify-center lg:p-1.5" : ""}`}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-semibold shrink-0" style={{ background: ACCENT }}>
              {DEMO_COMPANY.ownerEmail[0].toUpperCase()}
            </div>
            <div className={`flex-1 min-w-0 text-left ${sidebarCollapsed ? "lg:hidden" : ""}`}>
              <div className="text-[13px] font-medium text-[#0f2214] truncate">{DEMO_COMPANY.ownerEmail}</div>
            </div>
            <ChevronUp className={`w-3 h-3 text-[#8d9d94] rotate-180 ${sidebarCollapsed ? "lg:hidden" : ""}`} />
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-[rgba(253,252,248,0.78)] backdrop-blur-xl border-b border-[rgba(15,34,20,0.07)] h-16 px-4 sm:px-6 flex items-center gap-3 transition-colors">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
            className="lg:hidden w-9 h-9 rounded-lg border border-[rgba(15,34,20,0.08)] bg-white flex items-center justify-center shrink-0"
          >
            <Menu className="w-4 h-4 text-[#2f3e32]" />
          </button>
          <div className="flex-1" />

          {activeChat && (
            <span
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-[rgba(15,34,20,0.08)] bg-white px-2.5 py-1 text-[12px] font-medium text-[#2f3e32]"
              title="Total credits used in this chat"
            >
              <Coins className="h-3.5 w-3.5" style={{ color: ACCENT }} />
              {activeChat.creditsUsed.toFixed(2)} credits
            </span>
          )}

          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-[rgba(20,54,32,0.14)] bg-[rgba(20,54,32,0.06)] px-2.5 py-1 text-[12px] font-semibold text-[#143620]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#143620] animate-pulse" />
            Demo · read-only
          </span>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(15,34,20,0.08)] bg-white px-2.5 py-1.5 text-[12px] font-medium text-[#2f3e32] hover:bg-[#fdfcf8] hover:text-[#143620] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Exit demo</span>
          </Link>

          <button
            aria-label="Notifications"
            className="w-9 h-9 rounded-lg border border-[rgba(15,34,20,0.08)] bg-white flex items-center justify-center relative"
          >
            <Bell className="w-4 h-4 text-[#5f6f63]" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-[#fdfcf8]">{children}</main>
      </div>

      {/* Roaming guide bot — points at its own speech bubble on every page */}
      <DemoBot />
    </div>
  );
}
