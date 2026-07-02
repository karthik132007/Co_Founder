"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, LayoutDashboard, Bot, CheckSquare, BarChart3, Settings,
  Search, Bell, LogOut, Menu, X, Brain, Code, Wallet, LineChart,
  TrendingUp, Users, ChevronRight, Sparkles, Star, Clock, Shield,
  Zap, MessageSquare, Plus, ArrowUpRight, ChevronDown
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/session";

/* ─────────────────────────────────────────────
   Types & Data
   ───────────────────────────────────────────── */

type NavItem = {
  label: string;
  icon: typeof LayoutDashboard;
  id: string;
};

const navItems: NavItem[] = [
  { label: "Overview", icon: LayoutDashboard, id: "overview" },
  { label: "Agents", icon: Bot, id: "agents" },
  { label: "Tasks", icon: CheckSquare, id: "tasks" },
  { label: "Analytics", icon: BarChart3, id: "analytics" },
  { label: "Settings", icon: Settings, id: "settings" },
];

const agentCards = [
  { name: "CEO Agent", icon: Brain, color: "#635BFF", status: "Active", task: "Generating Q3 strategy" },
  { name: "Marketing", icon: TrendingUp, color: "#8B85FF", status: "Running campaign", task: "Email sequence · 1.2K sent" },
  { name: "Developer", icon: Code, color: "#635BFF", status: "Idle", task: "Last deploy 12m ago" },
  { name: "Finance", icon: Wallet, color: "#8B85FF", status: "Active", task: "Updating projections" },
  { name: "Business Analyst", icon: LineChart, color: "#635BFF", status: "Idle", task: "Market report ready" },
  { name: "Research", icon: Sparkles, color: "#8B85FF", status: "Active", task: "Competitor analysis" },
];

const recentActivity = [
  { agent: "CEO Agent", action: "Generated Q3 strategy report", time: "2 min ago", color: "#635BFF" },
  { agent: "Marketing", action: "Campaign CTR improved 23% vs last week", time: "18 min ago", color: "#8B85FF" },
  { agent: "Developer", action: "Deployed landing page v2.1 to production", time: "1 hour ago", color: "#635BFF" },
  { agent: "Finance", action: "Updated runway projection: 14 months", time: "3 hours ago", color: "#8B85FF" },
  { agent: "Research", action: "Completed competitor deep-dive for 5 companies", time: "5 hours ago", color: "#8B85FF" },
];

/* ─────────────────────────────────────────────
   Session
   ───────────────────────────────────────────── */

const subscribeToSession = () => () => {};
const getServerSessionSnapshot = () => null;

/* ─────────────────────────────────────────────
   Dashboard
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

  useEffect(() => {
    if (!session) {
      router.replace("/auth");
    }
  }, [router, session]);

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
        w-64 bg-[#f0f2f8] border-r border-white/60
        flex flex-col shrink-0
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        shadow-[8px_0_20px_rgba(163,177,198,0.15)]
      `}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/50">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 neu-circle rounded-full flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden">
              <Image src="/logo.png" alt="Logo" width={28} height={28} className="w-7 h-7 object-contain" />
            </div>
            <span className="font-bold text-lg tracking-tight text-[#111827]">
              Cofounder<span style={{ color: "#635BFF" }}>.ai</span>
            </span>
          </Link>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveNav(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 group ${
                  isActive
                    ? "neu-pill-accent shadow-lg"
                    : "text-[#6B7280] hover:text-[#111827] hover:bg-white/40"
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? "text-white" : "text-[#9CA3AF] group-hover:text-[#635BFF]"}`} />
                <span>{item.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
              </button>
            );
          })}
        </nav>

        {/* User profile */}
        <div className="px-5 py-4 border-t border-white/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#635BFF] flex items-center justify-center text-white text-xs font-bold shrink-0">
              {session.user.email[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-[#111827] truncate">
                {session.user.email}
              </div>
              <div className="text-[10px] text-[#9CA3AF] font-medium">Founder</div>
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
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden neu-circle rounded-full w-9 h-9 flex-shrink-0"
          >
            <Menu className="w-4 h-4 text-[#4B5563]" />
          </button>

          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="neu-inset rounded-xl px-4 py-2 flex items-center gap-3">
              <Search className="w-4 h-4 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search anything..."
                className="bg-transparent text-sm font-medium text-[#111827] placeholder-[#B0B7C3] outline-none w-full"
              />
              <kbd className="hidden sm:inline-flex text-[10px] font-bold text-[#B0B7C3] bg-white/50 rounded-md px-1.5 py-0.5">
                ⌘K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button className="neu-circle rounded-full w-9 h-9 relative">
              <Bell className="w-4 h-4 text-[#6B7280]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#635BFF]" />
            </button>
            <button className="neu-pill-accent px-4 py-2 text-xs font-bold flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Task</span>
            </button>
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 p-4 sm:p-8 space-y-8">
          
          {/* Welcome */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827]">
              Welcome back <span className="text-gradient">{session.user.email.split("@")[0]}</span>
            </h1>
            <p className="mt-1.5 text-sm text-[#6B7280] font-medium">
              Here&apos;s what your AI team is up to today.
            </p>
          </motion.div>

          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Active Agents", value: "4 / 6", change: "2 idle", icon: Bot, color: "#635BFF" },
              { label: "Tasks Completed", value: "247", change: "+12 this week", icon: CheckSquare, color: "#8B85FF" },
              { label: "Revenue (MRR)", value: "$12.4K", change: "+8.3%", icon: TrendingUp, color: "#635BFF" },
              { label: "Active Users", value: "2,847", change: "+24% MoM", icon: Users, color: "#8B85FF" },
            ].map((stat, i) => (
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
                <div className="text-xl font-bold text-[#111827]">{stat.value}</div>
                <div className="text-[11px] font-bold text-emerald-500 mt-1">
                  {stat.change}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart + Activity (2 cols) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Chart */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.35 }}
                className="neu-card rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-[#111827]">Agent Activity</h3>
                    <p className="text-[10px] text-[#9CA3AF] font-bold mt-0.5 uppercase tracking-wider">
                      Tasks per day · Last 7 days
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {["#635BFF", "#E5E7EB"].map((c, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                        <span className="text-[9px] font-bold text-[#9CA3AF]">
                          {i === 0 ? "Completed" : "Pending"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bar chart */}
                <div className="flex items-end justify-between gap-2 h-44">
                  {[
                    { done: 38, pending: 12 },
                    { done: 55, pending: 8 },
                    { done: 42, pending: 18 },
                    { done: 70, pending: 10 },
                    { done: 50, pending: 15 },
                    { done: 85, pending: 5 },
                    { done: 62, pending: 14 },
                  ].map((bar, i) => (
                    <div key={i} className="flex-1 flex flex-col justify-end gap-1">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${bar.done}%` }}
                        transition={{ duration: 0.7, delay: 0.4 + i * 0.05 }}
                        className="w-full rounded-t-lg"
                        style={{
                          background: "linear-gradient(180deg, #635BFF 0%, #8B85FF 100%)",
                          minHeight: 4,
                        }}
                      />
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${bar.pending}%` }}
                        transition={{ duration: 0.7, delay: 0.45 + i * 0.05 }}
                        className="w-full rounded-t-md bg-[#E5E7EB]"
                        style={{ minHeight: 4 }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-3">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                    <span key={d} className="text-[9px] font-bold text-[#B0B7C3]">{d}</span>
                  ))}
                </div>
              </motion.div>

              {/* Recent Activity */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.45 }}
                className="neu-card rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-bold text-[#111827]">Recent Activity</h3>
                  <button className="text-[10px] font-bold text-[#635BFF] hover:underline">
                    View all
                  </button>
                </div>
                <div className="space-y-1">
                  {recentActivity.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3.5 p-2.5 rounded-xl hover:bg-white/60 transition-colors"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                        style={{ background: item.color }}
                      >
                        {item.agent[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-bold text-[#111827] truncate">
                          {item.agent}
                        </div>
                        <div className="text-[10px] text-[#6B7280] font-medium truncate">
                          {item.action}
                        </div>
                      </div>
                      <span className="text-[9px] font-bold text-[#B0B7C3] shrink-0">
                        {item.time}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Agent Status (1 col) */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="neu-card rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-bold text-[#111827]">Your Agents</h3>
                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">
                  4 active
                </span>
              </div>
              <div className="space-y-3">
                {agentCards.map((agent, i) => (
                  <div
                    key={agent.name}
                    className="neu-inset rounded-xl p-3.5 flex items-center gap-3 group hover:ring-2 hover:ring-[#635BFF]/20 transition-all cursor-pointer"
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: agent.color + "15" }}
                    >
                      <agent.icon className="w-4 h-4" style={{ color: agent.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-[#111827] truncate">
                          {agent.name}
                        </span>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          agent.status === "Active" || agent.status === "Running campaign"
                            ? "bg-emerald-400"
                            : "bg-[#D1D5DB]"
                        }`} />
                      </div>
                      <div className="text-[9px] text-[#6B7280] font-medium mt-0.5 truncate">
                        {agent.task}
                      </div>
                    </div>
                  </div>
                ))}
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
        </main>
      </div>
    </div>
  );
}
