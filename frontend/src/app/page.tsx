"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Brain, Code, BarChart3, Wallet, LineChart, Search,
  X, Check, Menu, MessageSquare, Target, GitMerge, CheckCircle2,
  UserX, DollarSign, Megaphone, Calculator, HelpCircle, Layers,
  Users, Zap, Lightbulb, Shield, Globe, TrendingUp,
  Cloud, Bot, Workflow, ArrowUpRight, type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const ACCENT = "#4f46e5";

/* ─────────────────────────────────────────────
   Data
   ───────────────────────────────────────────── */

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Agents", href: "#agents" },
  { label: "Compare", href: "#compare" },
];

const problems = [
  { icon: UserX, title: "No technical co-founder", desc: "You have the vision but lack the technical skills to build and ship product." },
  { icon: DollarSign, title: "Expensive to hire", desc: "Full-time experts in marketing, finance, and dev cost $50K–200K+ each." },
  { icon: Megaphone, title: "Marketing is guesswork", desc: "Without experience, creating strategies that actually convert feels impossible." },
  { icon: Calculator, title: "Financial blind spots", desc: "Managing budgets, projections, and funding without a finance background hurts growth." },
  { icon: HelpCircle, title: "Strategy uncertainty", desc: "Making critical decisions without experienced advisors puts everything at risk." },
  { icon: Layers, title: "Tool overload", desc: "Juggling dozens of disconnected SaaS apps creates chaos instead of clarity." },
];

const steps = [
  { icon: MessageSquare, title: "Share your idea", desc: "Describe your business concept, goals, and the challenges you're facing — in plain language." },
  { icon: Target, title: "CEO agent plans", desc: "The central AI agent analyzes your input and builds a comprehensive execution strategy." },
  { icon: GitMerge, title: "Agents collaborate", desc: "Specialized agents work together, sharing context and knowledge through a unified memory." },
  { icon: CheckCircle2, title: "Get deliverables", desc: "Receive strategies, code, content, and financial plans — not just suggestions, but real output." },
];

const agents = [
  { icon: Brain, name: "CEO Agent", desc: "Coordinates all agents, creates strategies, and ensures every decision aligns with your business goals." },
  { icon: Code, name: "Web Developer", desc: "Builds websites, landing pages, and web applications tailored to your startup's needs." },
  { icon: BarChart3, name: "Marketing Expert", desc: "Designs campaigns, content strategies, and growth plans to reach your target audience." },
  { icon: Wallet, name: "Finance Advisor", desc: "Handles budgeting, financial projections, pricing strategy, and funding preparation." },
  { icon: LineChart, name: "Business Analyst", desc: "Evaluates business models, market opportunities, and competitive positioning." },
  { icon: Search, name: "Research Agent", desc: "Uncovers market insights, competitor data, industry trends, and actionable intelligence." },
];

const features = [
  { icon: Users, title: "Multi-agent intelligence", desc: "Six specialized agents working as a coordinated founding team." },
  { icon: Brain, title: "Shared memory", desc: "Every agent shares context and knowledge for truly informed decisions." },
  { icon: Zap, title: "Task automation", desc: "Automate repetitive work across marketing, finance, and development." },
  { icon: Cloud, title: "Business planning", desc: "Generate comprehensive business plans and pitch decks instantly." },
  { icon: TrendingUp, title: "Marketing assistance", desc: "Campaigns, content calendars, and growth strategies built for you." },
  { icon: Shield, title: "Financial guidance", desc: "Budgeting, runway projections, and pricing support, all automated." },
  { icon: Globe, title: "Website development", desc: "Build and deploy professional, responsive websites with AI." },
  { icon: Bot, title: "Market research", desc: "Competitor analysis and deep market intelligence, on demand." },
  { icon: Workflow, title: "Startup roadmaps", desc: "Clear, stage-appropriate roadmaps tailored to your vision." },
  { icon: Lightbulb, title: "Central AI manager", desc: "One CEO agent orchestrates every moving part of your business." },
];

const comparisonRows = [
  { label: "Cost", traditional: "$50K–200K+ per year", ai: "Fraction of the cost" },
  { label: "Speed", traditional: "Months to hire & onboard", ai: "Ready in seconds" },
  { label: "Availability", traditional: "9-to-5, time zones", ai: "24/7, always online" },
  { label: "Tools", traditional: "Dozens of subscriptions", ai: "One unified platform" },
  { label: "Collaboration", traditional: "Communication overhead", ai: "Seamless AI coordination" },
];

const footerCols = [
  { title: "Product", links: ["Features", "How It Works", "Agents", "Pricing"] },
  { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
  { title: "Legal", links: ["Privacy Policy", "Terms", "Cookies"] },
];

/* ─────────────────────────────────────────────
   Shared bits
   ───────────────────────────────────────────── */

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
} as const;

function SectionHeader({
  label,
  title,
  sub,
}: {
  label: string;
  title: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="text-center max-w-2xl mx-auto mb-16">
      <motion.span {...fadeUp} className="section-label">
        {label}
      </motion.span>
      <motion.h2
        {...fadeUp}
        transition={{ delay: 0.08 }}
        className="mt-5 text-3xl md:text-[2.75rem] font-semibold tracking-tight leading-[1.15] text-[#0a0a0a]"
      >
        {title}
      </motion.h2>
      {sub && (
        <motion.p
          {...fadeUp}
          transition={{ delay: 0.16 }}
          className="mt-4 text-[#6b7280] text-base leading-relaxed"
        >
          {sub}
        </motion.p>
      )}
    </div>
  );
}

function IconTile({ icon: Icon, size = "md" }: { icon: LucideIcon; size?: "sm" | "md" | "lg" }) {
  const dims = size === "lg" ? "w-14 h-14 rounded-2xl" : size === "sm" ? "w-9 h-9 rounded-lg" : "w-11 h-11 rounded-xl";
  const iconSize = size === "lg" ? "w-6 h-6" : size === "sm" ? "w-4 h-4" : "w-5 h-5";
  return (
    <div className={`${dims} bg-[#eef2ff] border border-[#e0e7ff] flex items-center justify-center shrink-0`}>
      <Icon className={iconSize} style={{ color: ACCENT }} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Navbar
   ───────────────────────────────────────────── */

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 nav-glass">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-white border border-[#e5e7eb] flex items-center justify-center overflow-hidden">
            <Image src="/logo.png" alt="Cofounder.ai" width={24} height={24} className="w-6 h-6 object-contain" />
          </div>
          <span className="font-semibold text-[15px] tracking-tight text-[#0a0a0a]">
            Cofounder<span style={{ color: ACCENT }}>.ai</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3.5 py-2 text-sm font-medium text-[#6b7280] hover:text-[#0a0a0a] transition-colors rounded-lg hover:bg-black/[0.04]"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/auth" className="hidden sm:inline-flex text-sm font-medium text-[#6b7280] hover:text-[#0a0a0a] px-3 py-2 transition-colors">
            Log in
          </Link>
          <Link href="/auth" className="btn-primary hidden sm:inline-flex px-4 py-2 text-sm">
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            onClick={() => setMobileOpen((p) => !p)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg border border-[#e5e7eb] bg-white"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden md:hidden border-t border-[#e5e7eb] bg-[#fafafa]"
          >
            <div className="px-4 py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2.5 text-sm font-medium text-[#374151] rounded-lg hover:bg-black/[0.04]"
                >
                  {link.label}
                </a>
              ))}
              <Link href="/auth" className="btn-primary mt-2 px-4 py-2.5 text-sm justify-center">
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ─────────────────────────────────────────────
   Hero
   ───────────────────────────────────────────── */

function HeroVisual() {
  const chips = [
    { icon: Code, label: "Developer", pos: "top-[6%] right-[2%]", delay: 0 },
    { icon: BarChart3, label: "Marketing", pos: "bottom-[16%] right-[0%]", delay: 1.2 },
    { icon: Wallet, label: "Finance", pos: "bottom-[16%] left-[0%]", delay: 2.4 },
    { icon: Search, label: "Research", pos: "top-[6%] left-[2%]", delay: 3.6 },
  ];

  return (
    <div className="relative aspect-square max-w-[480px] mx-auto w-full">
      {/* Rings */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="absolute inset-[4%] rounded-full border border-dashed border-[#4f46e5]/20"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="absolute inset-[14%] rounded-full border border-[#4f46e5]/10"
      />

      {/* Connecting lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
        <line x1="50" y1="50" x2="20" y2="20" stroke="#4f46e5" strokeOpacity="0.18" strokeWidth="0.4" strokeDasharray="2.5 2.5" />
        <line x1="50" y1="50" x2="80" y2="20" stroke="#4f46e5" strokeOpacity="0.18" strokeWidth="0.4" strokeDasharray="2.5 2.5" />
        <line x1="50" y1="50" x2="20" y2="80" stroke="#4f46e5" strokeOpacity="0.18" strokeWidth="0.4" strokeDasharray="2.5 2.5" />
        <line x1="50" y1="50" x2="80" y2="80" stroke="#4f46e5" strokeOpacity="0.18" strokeWidth="0.4" strokeDasharray="2.5 2.5" />
      </svg>

      {/* Center card */}
      <div className="absolute inset-[30%] card shadow-[0_8px_30px_-6px_rgba(79,70,229,0.25)] flex flex-col items-center justify-center gap-2.5 z-10">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: ACCENT }}>
          <Brain className="w-6 h-6 text-white" />
        </div>
        <span className="text-xs font-semibold text-[#374151] text-center leading-tight px-2">
          CEO Agent
        </span>
      </div>

      {/* Floating agent chips */}
      {chips.map(({ icon: Icon, label, pos, delay }) => (
        <motion.div
          key={label}
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4.5, delay, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute ${pos} card px-3.5 py-2.5 flex items-center gap-2.5 z-10`}
        >
          <div className="w-7 h-7 rounded-lg bg-[#eef2ff] flex items-center justify-center">
            <Icon className="w-3.5 h-3.5" style={{ color: ACCENT }} />
          </div>
          <span className="text-xs font-semibold text-[#374151]">{label}</span>
        </motion.div>
      ))}
    </div>
  );
}

function Hero() {
  return (
    <section className="relative pt-36 pb-24 px-4 sm:px-6 overflow-hidden">
      {/* Grid backdrop */}
      <div className="absolute inset-0 bg-grid bg-grid-fade pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[720px] h-[420px] bg-[#4f46e5]/[0.07] rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto grid lg:grid-cols-2 gap-14 lg:gap-10 items-center">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="section-label">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4f46e5]" />
              AI-Powered Startup Platform
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="mt-6 text-[clamp(2.5rem,5vw,3.9rem)] font-semibold leading-[1.06] tracking-tight text-[#0a0a0a]"
          >
            Your AI startup team,{" "}
            <span className="text-gradient">ready to build.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16 }}
            className="mt-6 text-lg text-[#6b7280] max-w-lg leading-relaxed"
          >
            Turn ideas into real businesses with specialized AI agents that handle
            strategy, marketing, finance, and development — so you can focus on the
            vision.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.24 }}
            className="mt-9 flex flex-wrap items-center gap-3.5"
          >
            <Link href="/auth" className="btn-primary px-6 py-3 text-[15px] group">
              Get Started Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a href="#how-it-works" className="btn-ghost px-5 py-3 text-[15px] border border-[#e5e7eb] bg-white">
              See how it works
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] font-medium text-[#9ca3af]"
          >
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-500" /> No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-500" /> Setup in 2 minutes
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-500" /> Free to start
            </span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="hidden sm:block"
        >
          <HeroVisual />
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Problem
   ───────────────────────────────────────────── */

function Problem() {
  return (
    <section id="problem" className="py-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          label="The Problem"
          title={<>Building a startup is <span style={{ color: ACCENT }}>harder than it should be</span></>}
          sub="Founders face an overwhelming set of challenges before they can even get to building. You shouldn't have to do it alone."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {problems.map((p, i) => (
            <motion.div
              key={p.title}
              {...fadeUp}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="card card-hover p-6"
            >
              <IconTile icon={p.icon} />
              <h3 className="mt-5 text-[15px] font-semibold text-[#0a0a0a]">{p.title}</h3>
              <p className="mt-2 text-sm text-[#6b7280] leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Solution — dashboard mockup
   ───────────────────────────────────────────── */

function DashboardMockup() {
  return (
    <div className="card overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)]">
      {/* Title bar */}
      <div className="bg-white px-4 py-3 flex items-center gap-2 border-b border-[#e5e7eb]">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#e5e7eb]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#e5e7eb]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#e5e7eb]" />
        </div>
        <span className="flex-1 text-center text-[11px] font-medium text-[#9ca3af]">
          cofounder.ai/dashboard
        </span>
        <div className="w-[42px]" />
      </div>

      <div className="p-5 space-y-4 bg-[#fafafa]">
        {/* Prompt bar */}
        <div className="bg-white border border-[#e5e7eb] rounded-xl px-4 py-3 flex items-center gap-3">
          <Zap className="w-4 h-4 shrink-0" style={{ color: ACCENT }} />
          <span className="text-[13px] text-[#9ca3af] flex-1">Ask your AI team anything…</span>
          <span className="btn-accent px-3.5 py-1.5 text-[11px]">Send</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Revenue", value: "$12.4K", change: "+12%" },
            { label: "Users", value: "2,847", change: "+24%" },
            { label: "Growth", value: "8.3%", change: "+3.1%" },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-[#e5e7eb] rounded-xl p-3.5">
              <div className="text-[10px] font-medium text-[#9ca3af] uppercase tracking-wider">{s.label}</div>
              <div className="mt-1 text-base font-semibold text-[#0a0a0a]">{s.value}</div>
              <div className="text-[10px] font-semibold text-emerald-600 mt-0.5">{s.change}</div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-[#374151]">Agent Activity</span>
            <span className="text-[10px] font-medium" style={{ color: ACCENT }}>Last 7 days</span>
          </div>
          <div className="flex items-end justify-between gap-1.5 h-20">
            {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                whileInView={{ height: `${h}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.05 }}
                className="flex-1 rounded-t-[4px]"
                style={{
                  background: i === 5 ? ACCENT : "#e5e7eb",
                  minHeight: 4,
                }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <span key={i} className="text-[9px] font-medium text-[#9ca3af]">{d}</span>
            ))}
          </div>
        </div>

        {/* Activity feed */}
        <div className="bg-white border border-[#e5e7eb] rounded-xl divide-y divide-[#f3f4f6]">
          {[
            { agent: "CEO Agent", action: "Generated Q3 strategy report", time: "2m" },
            { agent: "Marketing", action: "Launched email campaign · 1.2K sent", time: "12m" },
            { agent: "Developer", action: "Deployed landing page v2.1", time: "38m" },
          ].map((item) => (
            <div key={item.action} className="flex items-center gap-3 px-4 py-3">
              <div className="w-7 h-7 rounded-lg bg-[#eef2ff] flex items-center justify-center text-[11px] font-semibold shrink-0" style={{ color: ACCENT }}>
                {item.agent[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-semibold text-[#0a0a0a] truncate">{item.agent}</div>
                <div className="text-[11px] text-[#6b7280] truncate">{item.action}</div>
              </div>
              <span className="text-[10px] font-medium text-[#9ca3af] shrink-0">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Solution() {
  const points = [
    { icon: Lightbulb, title: "Multi-agent intelligence", desc: "Instead of one generic AI, six specialized agents collaborate to cover every aspect of building a startup." },
    { icon: Users, title: "Works like a real team", desc: "A CEO agent coordinates specialists in marketing, finance, dev, and research — just like a real founding team." },
    { icon: Zap, title: "Instant, actionable results", desc: "Get strategies, financial plans, marketing campaigns, and working code — not just vague advice." },
  ];

  return (
    <section id="solution" className="py-24 px-4 sm:px-6 bg-white border-y border-[#e5e7eb]">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
        <div>
          <motion.span {...fadeUp} className="section-label">The Solution</motion.span>
          <motion.h2
            {...fadeUp}
            transition={{ delay: 0.08 }}
            className="mt-5 text-3xl md:text-[2.75rem] font-semibold tracking-tight leading-[1.15] text-[#0a0a0a]"
          >
            Your AI founding team, ready in{" "}
            <span style={{ color: ACCENT }}>seconds</span>
          </motion.h2>

          <div className="mt-12 space-y-8">
            {points.map((item, i) => (
              <motion.div
                key={item.title}
                {...fadeUp}
                transition={{ duration: 0.4, delay: 0.12 + i * 0.08 }}
                className="flex gap-4 items-start"
              >
                <IconTile icon={item.icon} />
                <div>
                  <h3 className="text-[15px] font-semibold text-[#0a0a0a]">{item.title}</h3>
                  <p className="mt-1.5 text-sm text-[#6b7280] leading-relaxed max-w-md">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <DashboardMockup />
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   How It Works
   ───────────────────────────────────────────── */

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <SectionHeader
          label="How It Works"
          title={<>From idea to <span style={{ color: ACCENT }}>execution</span></>}
        />

        <div className="flex flex-col">
          {steps.map((step, i) => {
            const isLast = i === steps.length - 1;
            return (
              <motion.div
                key={step.title}
                {...fadeUp}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                className="grid grid-cols-[auto_1fr] gap-x-6"
              >
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-semibold shrink-0 border ${
                      i === 0
                        ? "text-white border-transparent"
                        : "bg-white text-[#6b7280] border-[#e5e7eb]"
                    }`}
                    style={i === 0 ? { background: ACCENT } : undefined}
                  >
                    {i + 1}
                  </div>
                  {!isLast && <div className="w-px flex-1 my-2 bg-[#e5e7eb]" />}
                </div>

                <div className={isLast ? "" : "pb-8"}>
                  <div className="card card-hover p-6 flex gap-4 items-start">
                    <IconTile icon={step.icon} size="sm" />
                    <div>
                      <h3 className="text-[15px] font-semibold text-[#0a0a0a]">{step.title}</h3>
                      <p className="mt-1.5 text-sm text-[#6b7280] leading-relaxed max-w-md">{step.desc}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Agents
   ───────────────────────────────────────────── */

function Agents() {
  return (
    <section id="agents" className="py-24 px-4 sm:px-6 bg-white border-y border-[#e5e7eb]">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          label="AI Agents"
          title={<>Meet your <span style={{ color: ACCENT }}>AI team</span></>}
          sub="Six specialized agents collaborating through a shared brain to build your startup."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent, i) => (
            <motion.div
              key={agent.name}
              {...fadeUp}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="card card-hover p-6 group flex flex-col"
            >
              <IconTile icon={agent.icon} size="lg" />
              <h3 className="mt-5 text-[15px] font-semibold text-[#0a0a0a]">{agent.name}</h3>
              <p className="mt-2 text-sm text-[#6b7280] leading-relaxed flex-1">{agent.desc}</p>
              <div className="mt-4 flex items-center gap-1.5 text-[13px] font-medium opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: ACCENT }}>
                Learn more <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Features
   ───────────────────────────────────────────── */

function Features() {
  return (
    <section id="features" className="py-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          label="Platform Features"
          title={<>Everything you need to <span style={{ color: ACCENT }}>scale</span></>}
          sub="A comprehensive toolkit that replaces dozens of disconnected apps with one unified AI platform."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              {...fadeUp}
              transition={{ duration: 0.35, delay: (i % 5) * 0.05 }}
              className="card card-hover p-5"
            >
              <IconTile icon={f.icon} size="sm" />
              <h3 className="mt-4 text-sm font-semibold text-[#0a0a0a]">{f.title}</h3>
              <p className="mt-1.5 text-[13px] text-[#6b7280] leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Comparison
   ───────────────────────────────────────────── */

function Comparison() {
  return (
    <section id="compare" className="py-24 px-4 sm:px-6 bg-white border-y border-[#e5e7eb]">
      <div className="max-w-4xl mx-auto">
        <SectionHeader
          label="Why Cofounder.ai"
          title={<>Replace expensive hires with <span style={{ color: ACCENT }}>intelligent agents</span></>}
        />

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5 }}
          className="card overflow-hidden"
        >
          <div className="grid grid-cols-3 border-b border-[#e5e7eb] bg-[#fafafa]">
            <div className="p-4 sm:p-5" />
            <div className="p-4 sm:p-5 text-[11px] font-semibold text-[#9ca3af] uppercase tracking-widest flex items-center">
              Traditional
            </div>
            <div className="p-4 sm:p-5 text-[11px] font-semibold uppercase tracking-widest flex items-center bg-[#eef2ff]" style={{ color: ACCENT }}>
              Cofounder.ai
            </div>
          </div>

          {comparisonRows.map((row) => (
            <div key={row.label} className="grid grid-cols-3 border-b border-[#e5e7eb] last:border-0">
              <div className="py-4 px-4 sm:px-5 text-sm font-semibold text-[#0a0a0a] flex items-center">
                {row.label}
              </div>
              <div className="py-4 px-4 sm:px-5 text-[13px] text-[#6b7280] flex items-center gap-2.5">
                <X className="w-4 h-4 text-[#d4d4d8] shrink-0" />
                <span className="hidden sm:inline">{row.traditional}</span>
                <span className="sm:hidden text-xs">{row.traditional}</span>
              </div>
              <div className="py-4 px-4 sm:px-5 text-[13px] text-[#0a0a0a] font-medium flex items-center gap-2.5 bg-[#eef2ff]/60">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="hidden sm:inline">{row.ai}</span>
                <span className="sm:hidden text-xs">{row.ai}</span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   CTA
   ───────────────────────────────────────────── */

function CTA() {
  return (
    <section className="py-28 px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto relative overflow-hidden rounded-3xl bg-[#0a0a0a] px-8 py-16 sm:px-16 sm:py-20 text-center"
      >
        {/* Glow accents */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[480px] h-[280px] bg-[#4f46e5]/30 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 bg-grid opacity-[0.15] pointer-events-none" style={{ backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)" }} />

        <div className="relative">
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.1] text-white">
            Ready to build with AI?
          </h2>
          <p className="mt-5 text-base sm:text-lg text-[#a1a1aa] max-w-lg mx-auto leading-relaxed">
            Start building your startup with a team of AI agents. No credit card
            required, free to start.
          </p>
          <Link
            href="/auth"
            className="mt-9 inline-flex items-center gap-2.5 bg-white text-[#0a0a0a] px-7 py-3.5 rounded-xl text-[15px] font-semibold hover:bg-[#e4e4e7] transition-colors group"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <p className="mt-6 text-[13px] text-[#71717a] font-medium">
            Join 2,000+ founders already building with AI
          </p>
        </div>
      </motion.div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Footer
   ───────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="border-t border-[#e5e7eb] bg-white px-4 sm:px-6">
      <div className="max-w-6xl mx-auto py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#fafafa] border border-[#e5e7eb] flex items-center justify-center overflow-hidden">
                <Image src="/logo.png" alt="Cofounder.ai" width={24} height={24} className="w-6 h-6 object-contain" />
              </div>
              <span className="font-semibold text-[15px] tracking-tight text-[#0a0a0a]">
                Cofounder<span style={{ color: ACCENT }}>.ai</span>
              </span>
            </div>
            <p className="mt-4 text-sm text-[#6b7280] max-w-[240px] leading-relaxed">
              AI-powered startup platform for founders who want to move fast.
            </p>
          </div>

          {footerCols.map((col) => (
            <div key={col.title}>
              <h4 className="text-[13px] font-semibold text-[#0a0a0a] mb-4">{col.title}</h4>
              <div className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <a
                    key={link}
                    href="#"
                    className="text-sm text-[#6b7280] hover:text-[#0a0a0a] transition-colors"
                  >
                    {link}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-7 border-t border-[#e5e7eb] flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="text-[13px] text-[#9ca3af]">
            © 2026 Cofounder.ai — All rights reserved.
          </span>
          <div className="flex gap-6">
            {["GitHub", "Twitter", "LinkedIn"].map((s) => (
              <a key={s} href="#" className="text-[13px] text-[#9ca3af] hover:text-[#0a0a0a] transition-colors">
                {s}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────────
   Page
   ───────────────────────────────────────────── */

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      <Navbar />
      <Hero />
      <Problem />
      <Solution />
      <HowItWorks />
      <Agents />
      <Features />
      <Comparison />
      <CTA />
      <Footer />
    </main>
  );
}
