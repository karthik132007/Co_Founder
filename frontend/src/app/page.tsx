"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight, Brain, Code, BarChart3, Wallet, LineChart, Search,
  X, Check, Menu, MessageSquare, Target, GitMerge, CheckCircle2,
  UserX, DollarSign, Megaphone, Calculator, HelpCircle, Layers,
  Users, Zap, Lightbulb, Sparkles, Shield, Globe, TrendingUp, Star,
  Rocket, ChevronRight, Clock, Cloud, Bot, Workflow, type LucideIcon
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

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
  { icon: Brain, name: "CEO Agent", color: "#635BFF", desc: "Coordinates all agents, creates strategies, and ensures every decision aligns with your business goals." },
  { icon: Code, name: "Web Developer", color: "#8B85FF", desc: "Builds websites, landing pages, and web applications tailored to your startup's needs." },
  { icon: BarChart3, name: "Marketing Expert", color: "#635BFF", desc: "Designs campaigns, content strategies, and growth plans to reach your target audience." },
  { icon: Wallet, name: "Finance Advisor", color: "#8B85FF", desc: "Handles budgeting, financial projections, pricing strategy, and funding preparation." },
  { icon: LineChart, name: "Business Analyst", color: "#635BFF", desc: "Evaluates business models, market opportunities, and competitive positioning." },
  { icon: Search, name: "Research Agent", color: "#8B85FF", desc: "Uncovers market insights, competitor data, industry trends, and actionable intelligence." },
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
  {
    title: "Product",
    links: ["Features", "How It Works", "Agents", "Pricing"],
  },
  {
    title: "Company",
    links: ["About", "Blog", "Careers", "Contact"],
  },
  {
    title: "Legal",
    links: ["Privacy Policy", "Terms", "Cookies"],
  },
];

/* ─────────────────────────────────────────────
   Sub-components
   ───────────────────────────────────────────── */

function SectionLabel({ children }: { children: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="neu-label"
    >
      {children}
    </motion.div>
  );
}

function SectionHeading({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.h2
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1 }}
      className={`text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.15] text-[#111827] ${className}`}
    >
      {children}
    </motion.h2>
  );
}

function IconBox({ icon: Icon, color, size = "md" }: { icon: LucideIcon; color: string; size?: "sm" | "md" | "lg" }) {
  const dims = size === "lg" ? "w-16 h-16" : size === "sm" ? "w-10 h-10" : "w-12 h-12";
  const iconSize = size === "lg" ? "w-7 h-7" : size === "sm" ? "w-4 h-4" : "w-5 h-5";
  return (
    <div className={`${dims} neu-circle rounded-full group-hover:scale-110 transition-transform duration-300`}>
      <Icon className={iconSize} style={{ color }} />
    </div>
  );
}

function ParallaxY({
  children,
  speed = 0.3,
  className = "",
}: {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [speed * 100, -speed * 100]);
  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Navbar
   ───────────────────────────────────────────── */

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 sm:px-6 sm:pt-6">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`neu-nav max-w-6xl mx-auto px-4 sm:px-6 py-3 transition-shadow duration-300 ${
          scrolled ? "shadow-lg" : ""
        }`}
      >
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 neu-circle rounded-full flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden">
              <Image src="/logo.png" alt="Logo" width={28} height={28} className="w-7 h-7 object-contain" />
            </div>
            <span className="font-bold text-lg tracking-tight text-[#111827]">
              Cofounder<span style={{ color: "#635BFF" }}>.ai</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm font-semibold text-[#4B5563] hover:text-[#635BFF] transition-colors rounded-full hover:bg-white/50"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA + mobile toggle */}
          <div className="flex items-center gap-3">
            <Link
              href="/auth"
              className="hidden sm:inline-flex neu-pill-accent px-5 py-2.5 text-sm font-bold items-center gap-2 group"
            >
              Get Started
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <button
              onClick={() => setMobileOpen((p) => !p)}
              className="md:hidden neu-circle rounded-full w-10 h-10"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-4 h-4 text-[#4B5563]" /> : <Menu className="w-4 h-4 text-[#4B5563]" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden md:hidden"
            >
              <div className="flex flex-col gap-2 pt-5 pb-3">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <a
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="neu-inset rounded-2xl text-sm font-bold text-[#4B5563] py-3 px-5 block text-center hover:text-[#635BFF] transition-colors"
                    >
                      {link.label}
                    </a>
                  </motion.div>
                ))}
                <div className="pt-3 border-t border-gray-200/60">
                  <Link
                    href="/auth"
                    onClick={() => setMobileOpen(false)}
                    className="neu-pill-accent px-6 py-3 text-sm font-bold w-full text-center block"
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </nav>
  );
}

/* ─────────────────────────────────────────────
   Hero
   ───────────────────────────────────────────── */

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-28 pb-20 px-4 sm:px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        {/* Left — text (subtle parallax) */}
        <ParallaxY speed={0.15} className="lg:w-1/2 flex flex-col items-start text-left">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="neu-label">AI-Powered Startup Platform</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="mt-6 text-[clamp(2.5rem,5.5vw,4.5rem)] font-bold leading-[1.08] tracking-tight text-[#111827]"
          >
            Your AI startup
            <br />
            team,{" "}
            <span className="text-gradient">ready to build.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2 }}
            className="mt-6 text-base sm:text-lg text-[#6B7280] font-medium max-w-lg leading-relaxed"
          >
            Turn ideas into real businesses with specialized AI agents that handle
            strategy, marketing, finance, and development — so you can focus on the
            vision.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.3 }}
            className="mt-10 flex flex-wrap items-center gap-5"
          >
            <Link
              href="/auth"
              className="neu-pill-accent px-8 py-4 text-base font-bold inline-flex items-center gap-3 group"
            >
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#how-it-works"
              className="text-sm font-bold text-[#6B7280] hover:text-[#635BFF] transition-colors inline-flex items-center gap-1.5"
            >
              See how it works
              <ChevronRight className="w-4 h-4" />
            </a>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-12 flex items-center gap-6 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider"
          >
            <span className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 fill-[#635BFF] text-[#635BFF]" />
              No credit card
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#635BFF]" />
              Setup in 2 min
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#635BFF]" />
              Secure
            </span>
          </motion.div>
        </ParallaxY>

        {/* Right — visual (opposite parallax) */}
        <ParallaxY speed={-0.3} className="lg:w-1/2 w-full max-w-[520px] mx-auto relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="w-full"
        >
          {/* Central orb */}
          <div className="relative aspect-square">
            {/* Rotating rings */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-2 border-[#635BFF]/15 border-dashed"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute inset-[8%] rounded-full border-2 border-[#8B85FF]/20 border-dotted"
            />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
              className="absolute inset-[16%] rounded-full border border-[#635BFF]/10"
            />

            {/* Glow */}
            <motion.div
              animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-[20%] rounded-full bg-[#635BFF]/10 blur-3xl"
            />

            {/* SVG connection lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="lineGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#635BFF" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#8B85FF" stopOpacity="0.15" />
                </linearGradient>
              </defs>
              {/* Center to Research (top-left) */}
              <line x1="50" y1="50" x2="22" y2="22" stroke="url(#lineGrad1)" strokeWidth="0.5" strokeDasharray="3 3" />
              {/* Center to Dev (top-right) */}
              <line x1="50" y1="50" x2="78" y2="22" stroke="url(#lineGrad1)" strokeWidth="0.5" strokeDasharray="3 3" />
              {/* Center to Finance (bottom-left) */}
              <line x1="50" y1="50" x2="22" y2="78" stroke="url(#lineGrad1)" strokeWidth="0.5" strokeDasharray="3 3" />
              {/* Center to Marketing (bottom-right) */}
              <line x1="50" y1="50" x2="78" y2="78" stroke="url(#lineGrad1)" strokeWidth="0.5" strokeDasharray="3 3" />
            </svg>

            {/* Center card */}
            <div className="absolute inset-[28%] neu-card flex items-center justify-center flex-col gap-3 p-4 animate-pulse-glow z-20">
              <Brain className="w-10 h-10 sm:w-12 sm:h-12" style={{ color: "#635BFF" }} />
              <span className="text-xs sm:text-sm font-bold text-[#374151] text-center leading-tight">
                AI Agent
                <br />
                Network
              </span>
            </div>

            {/* Floating mini cards */}
            {[
              { icon: Code, label: "Dev", pos: "top-2 right-4", delay: 0 },
              { icon: BarChart3, label: "Marketing", pos: "bottom-6 right-2", delay: 1.5 },
              { icon: Wallet, label: "Finance", pos: "bottom-6 left-2", delay: 3 },
              { icon: Search, label: "Research", pos: "top-2 left-4", delay: 4.5 },
            ].map(({ icon: Icon, label, pos, delay }) => (
              <motion.div
                key={label}
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, delay, repeat: Infinity, ease: "easeInOut" }}
                className={`absolute ${pos} neu-card rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 flex items-center gap-2 sm:gap-2.5 shadow-md z-20`}
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 neu-circle rounded-full flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: "#635BFF" }} />
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-[#374151]">{label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
        </ParallaxY>
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
        <div className="text-center max-w-2xl mx-auto mb-16">
          <SectionLabel>The Problem</SectionLabel>
          <SectionHeading className="mt-4">
            Building a startup is{" "}
            <span style={{ color: "#635BFF" }}>harder than it should be</span>
          </SectionHeading>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="mt-4 text-[#6B7280] font-medium text-base leading-relaxed"
          >
            Founders face an overwhelming set of challenges before they can even get
            to building. You shouldn&apos;t have to do it alone.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {problems.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="neu-card rounded-2xl p-6 sm:p-7 group"
            >
              <IconBox icon={p.icon} color="#635BFF" />
              <h3 className="mt-5 text-base font-bold text-[#111827]">{p.title}</h3>
              <p className="mt-2 text-sm text-[#6B7280] font-medium leading-relaxed">
                {p.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Solution
   ───────────────────────────────────────────── */

function Solution() {
  return (
    <section id="solution" className="py-24 px-4 sm:px-6 relative">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
        {/* Left */}
        <div className="lg:w-1/2">
          <SectionLabel>The Solution</SectionLabel>
          <SectionHeading className="mt-4">
            Your AI founding team, ready in{" "}
            <span style={{ color: "#635BFF" }}>seconds</span>
          </SectionHeading>

          <div className="mt-12 space-y-8">
            {[
              { icon: Lightbulb, title: "Multi-agent intelligence", desc: "Instead of one generic AI, six specialized agents collaborate to cover every aspect of building a startup." },
              { icon: Users, title: "Works like a real team", desc: "A CEO agent coordinates specialists in marketing, finance, dev, and research — just like a real founding team." },
              { icon: Zap, title: "Instant, actionable results", desc: "Get strategies, financial plans, marketing campaigns, and working code — not just vague advice." },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="flex gap-5 items-start group"
              >
                <div className="w-12 h-12 neu-circle rounded-full flex-shrink-0 group-hover:scale-110 transition-transform">
                  <item.icon className="w-5 h-5" style={{ color: "#635BFF" }} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#111827]">{item.title}</h3>
                  <p className="mt-1.5 text-sm text-[#6B7280] font-medium leading-relaxed max-w-sm">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right — SaaS Dashboard Mockup (parallax) */}
        <ParallaxY speed={-0.2} className="lg:w-1/2 w-full max-w-[520px] mx-auto">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="w-full"
        >
          <div className="neu-card rounded-2xl overflow-hidden shadow-xl">
            {/* macOS Title Bar */}
            <div className="bg-[#e8ecf2] px-4 py-3 flex items-center gap-2 border-b border-white/40">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <div className="w-3 h-3 rounded-full bg-[#28c840]" />
              </div>
              <div className="flex-1 flex justify-center">
                <span className="text-[11px] font-bold text-[#6B7280] tracking-wide">
                  Cofounder.ai — Dashboard
                </span>
              </div>
              <div className="w-[52px]" />
            </div>

            {/* Dashboard Body */}
            <div className="p-5 sm:p-6 space-y-4 bg-[#f8faff]">
              {/* Prompt Input */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 }}
                className="neu-inset rounded-xl p-3 flex items-center gap-3"
              >
                <Sparkles className="w-4 h-4 text-[#635BFF] shrink-0" />
                <span className="text-xs sm:text-sm text-[#9CA3AF] font-medium flex-1">
                  Ask your AI team anything...
                </span>
                <div className="neu-pill-accent px-4 py-1.5 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer">
                  Send
                  <ArrowRight className="w-3 h-3" />
                </div>
              </motion.div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Revenue", value: "$12.4K", change: "+12%", up: true },
                  { label: "Users", value: "2,847", change: "+24%", up: true },
                  { label: "Growth", value: "8.3%", change: "+3.1%", up: true },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.08 }}
                    className="neu-card rounded-xl p-3 text-center"
                  >
                    <div className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                      {stat.label}
                    </div>
                    <div className="mt-1 text-sm font-bold text-[#111827]">{stat.value}</div>
                    <div className="text-[10px] font-bold text-emerald-500 mt-0.5">
                      {stat.change}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Chart Area */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.35 }}
                className="neu-inset rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                    Agent Activity
                  </span>
                  <span className="text-[10px] font-bold text-[#635BFF]">Last 7 days</span>
                </div>

                {/* Mini bar chart */}
                <div className="flex items-end justify-between gap-1.5 h-20">
                  {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.4 + i * 0.06 }}
                      className="flex-1 rounded-t-md"
                      style={{
                        background:
                          i === 5
                            ? "linear-gradient(180deg, #635BFF 0%, #8B85FF 100%)"
                            : "linear-gradient(180deg, #e0e5f0 0%, #d1d7e4 100%)",
                        minHeight: 4,
                      }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-2">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                    <span key={d} className="text-[9px] font-bold text-[#B0B7C3]">
                      {d}
                    </span>
                  ))}
                </div>
              </motion.div>

              {/* Agent Activity Feed */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="space-y-2"
              >
                {[
                  { agent: "CEO Agent", action: "Generated Q3 strategy report", time: "2m ago", color: "#635BFF" },
                  { agent: "Marketing", action: "Launched email campaign · 1.2K sent", time: "12m ago", color: "#8B85FF" },
                  { agent: "Developer", action: "Deployed landing page v2.1", time: "38m ago", color: "#635BFF" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/60 transition-colors"
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0"
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
              </motion.div>
            </div>
          </div>
        </motion.div>
        </ParallaxY>
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
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <SectionLabel>How It Works</SectionLabel>
          <SectionHeading className="mt-4">
            From idea to <span style={{ color: "#635BFF" }}>execution</span>
          </SectionHeading>
        </div>

        <div className="flex flex-col">
          {steps.map((step, i) => {
            const isLast = i === steps.length - 1;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="grid grid-cols-[auto_1fr] gap-x-8"
              >
                {/* Step indicator */}
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${
                    i === 0
                      ? "neu-pill-accent"
                      : "neu-circle rounded-full text-[#6B7280]"
                  }`}>
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  {!isLast && (
                    <div className="w-1 flex-1 my-3 rounded-full bg-[#E5E7EB]" />
                  )}
                </div>

                {/* Content */}
                <div className={isLast ? "pb-0" : "pb-12"}>
                  <div className="neu-card rounded-2xl p-6 sm:p-8 flex gap-5 items-start group">
                    <div className="w-11 h-11 neu-inset rounded-xl flex items-center justify-center shrink-0">
                      <step.icon className="w-5 h-5" style={{ color: "#635BFF" }} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#111827]">{step.title}</h3>
                      <p className="mt-2 text-sm text-[#6B7280] font-medium leading-relaxed max-w-md">
                        {step.desc}
                      </p>
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
    <section id="agents" className="py-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <SectionLabel>AI Agents</SectionLabel>
          <SectionHeading className="mt-4">
            Meet your <span style={{ color: "#635BFF" }}>AI team</span>
          </SectionHeading>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="mt-4 text-[#6B7280] font-medium text-base"
          >
            Six specialized agents collaborating through a shared brain to build
            your startup.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {agents.map((agent, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="neu-card rounded-2xl p-6 sm:p-7 group flex flex-col"
            >
              <div className="w-14 h-14 neu-circle rounded-full group-hover:scale-110 transition-transform duration-300">
                <agent.icon className="w-6 h-6" style={{ color: agent.color }} />
              </div>
              <h3 className="mt-5 text-base font-bold text-[#111827]">{agent.name}</h3>
              <p className="mt-2 text-sm text-[#6B7280] font-medium leading-relaxed flex-1">
                {agent.desc}
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-bold text-[#635BFF] opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Learn more</span>
                <ChevronRight className="w-3.5 h-3.5" />
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
        <div className="text-center max-w-2xl mx-auto mb-16">
          <SectionLabel>Platform Features</SectionLabel>
          <SectionHeading className="mt-4">
            Everything you need to{" "}
            <span style={{ color: "#635BFF" }}>scale</span>
          </SectionHeading>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="mt-4 text-[#6B7280] font-medium text-base leading-relaxed"
          >
            A comprehensive toolkit that replaces dozens of disconnected apps with
            one unified AI platform.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.35, delay: (i % 4) * 0.06 }}
              className="neu-card rounded-2xl p-5 group flex flex-col items-center text-center"
            >
              <div className="w-12 h-12 neu-circle rounded-full group-hover:scale-110 transition-transform">
                <f.icon className="w-5 h-5" style={{ color: "#635BFF" }} />
              </div>
              <h3 className="mt-4 text-sm font-bold text-[#111827]">{f.title}</h3>
              <p className="mt-2 text-xs text-[#6B7280] font-medium leading-relaxed">
                {f.desc}
              </p>
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
    <section id="compare" className="py-24 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <SectionLabel>Why Cofounder.ai</SectionLabel>
          <SectionHeading className="mt-4">
            Replace expensive hires with{" "}
            <span style={{ color: "#635BFF" }}>intelligent agents</span>
          </SectionHeading>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5 }}
          className="neu-card rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="grid grid-cols-3 border-b border-[#E5E7EB]">
            <div className="p-4 sm:p-6" />
            <div className="p-4 sm:p-6 text-xs font-bold text-[#9CA3AF] uppercase tracking-widest flex items-center">
              Traditional
            </div>
            <div className="p-4 sm:p-6 text-xs font-bold text-[#635BFF] uppercase tracking-widest flex items-center bg-[#635BFF]/[0.04]">
              Cofounder.ai
            </div>
          </div>

          {/* Rows */}
          {comparisonRows.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-3 border-b border-[#E5E7EB] last:border-0 hover:bg-white/60 transition-colors"
            >
              <div className="py-4 sm:py-5 px-4 sm:px-6 text-sm font-bold text-[#111827] flex items-center">
                {row.label}
              </div>
              <div className="py-4 sm:py-5 px-4 sm:px-6 text-sm text-[#6B7280] font-medium flex items-center gap-3">
                <X className="w-4 h-4 text-red-400 shrink-0" />
                {row.traditional}
              </div>
              <div className="py-4 sm:py-5 px-4 sm:px-6 text-sm text-[#111827] font-bold flex items-center gap-3 bg-[#635BFF]/[0.04]">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                {row.ai}
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
      <ParallaxY speed={-0.15}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto neu-cta p-10 sm:p-20 text-center"
      >
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight text-[#111827]">
          Ready to build with{" "}
          <span className="text-gradient">AI?</span>
        </h2>
        <p className="mt-5 text-base sm:text-lg text-[#6B7280] font-medium max-w-lg mx-auto leading-relaxed">
          Start building your startup with a team of AI agents. No credit card
          required, free to start.
        </p>

        <Link
          href="/auth"
          className="mt-10 neu-pill-accent px-10 py-4 text-lg font-bold inline-flex items-center gap-3 group"
        >
          Get Started Free
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>

        <p className="mt-6 text-xs text-[#9CA3AF] font-semibold">
          Join 2,000+ founders already building with AI
        </p>
      </motion.div>
      </ParallaxY>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Footer
   ───────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="px-4 sm:px-6 pb-8">
      <div className="max-w-6xl mx-auto neu-inset rounded-[2.5rem] px-8 sm:px-12 py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 neu-circle rounded-full overflow-hidden">
                <Image src="/logo.png" alt="Logo" width={28} height={28} className="w-7 h-7 object-contain" />
              </div>
              <span className="font-bold text-lg tracking-tight text-[#111827]">
                Cofounder<span style={{ color: "#635BFF" }}>.ai</span>
              </span>
            </div>
            <p className="mt-4 text-sm text-[#6B7280] font-medium max-w-[200px] leading-relaxed">
              AI-powered startup platform for founders who want to move fast.
            </p>
          </div>

          {footerCols.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-bold text-[#111827] mb-4 uppercase tracking-widest">
                {col.title}
              </h4>
              <div className="flex flex-col gap-3">
                {col.links.map((link) => (
                  <a
                    key={link}
                    href="#"
                    className="text-sm text-[#6B7280] font-medium hover:text-[#635BFF] transition-colors"
                  >
                    {link}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-8 border-t border-[#E5E7EB] flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="text-xs text-[#9CA3AF] font-bold">
            © 2026 Cofounder.ai — All rights reserved.
          </span>
          <div className="flex gap-6">
            {["GitHub", "Twitter", "LinkedIn"].map((s) => (
              <a
                key={s}
                href="#"
                className="text-xs text-[#9CA3AF] font-bold hover:text-[#635BFF] transition-colors"
              >
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
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const orb1Y = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const orb2Y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const orb3Y = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const orb1X = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const orb2X = useTransform(scrollYProgress, [0, 1], [0, -60]);

  return (
    <main ref={containerRef} className="min-h-screen overflow-x-hidden relative">
      {/* Parallax background orbs */}
      <motion.div
        style={{ y: orb1Y, x: orb1X }}
        className="fixed top-[15%] -right-[10%] w-[35vw] h-[35vw] rounded-full bg-[#635BFF]/[0.04] blur-[160px] pointer-events-none z-[-1]"
      />
      <motion.div
        style={{ y: orb2Y, x: orb2X }}
        className="fixed top-[55%] -left-[8%] w-[30vw] h-[30vw] rounded-full bg-[#8B85FF]/[0.04] blur-[140px] pointer-events-none z-[-1]"
      />
      <motion.div
        style={{ y: orb3Y }}
        className="fixed bottom-[10%] right-[5%] w-[25vw] h-[25vw] rounded-full bg-[#635BFF]/[0.03] blur-[130px] pointer-events-none z-[-1]"
      />

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
