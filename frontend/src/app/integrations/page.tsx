"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Nav } from "@/components/landing/Nav";
import { Cursor } from "@/components/landing/Cursor";
import { LandingThemeProvider } from "@/components/landing/ThemeContext";
import {
  Search,
  CheckCircle2,
  FileText,
  Blocks,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type IntegrationCategory = "all" | "google" | "social" | "commerce" | "developer";

type Integration = {
  id: string;
  name: string;
  category: "google" | "social" | "commerce" | "developer";
  categoryLabel: string;
  description: string;
  img?: string;
  Icon?: LucideIcon;
  tint: string;
  capabilities: string[];
  active: boolean;
  status: string;
};

const INTEGRATIONS: Integration[] = [
  {
    id: "gmail",
    name: "Gmail",
    category: "google",
    categoryLabel: "Google Workspace",
    description:
      "Draft replies, summarize long client threads, search inbox history, and automate founder correspondence.",
    img: "/gmail.png",
    tint: "#EA4335",
    capabilities: ["Draft & send emails", "Thread summarization", "Autonomous client follow-ups", "Inbox search"],
    active: true,
    status: "Active",
  },
  {
    id: "google_sheets",
    name: "Google Sheets",
    category: "google",
    categoryLabel: "Google Workspace",
    description:
      "Read, write, and append rows in real time. Maintain financial projections, sync leads, and generate live KPI dashboards.",
    img: "/google-sheets.svg",
    tint: "#34A853",
    capabilities: ["Read & write spreadsheet rows", "Automated KPI tracking", "Financial model sync", "Data exports"],
    active: true,
    status: "Active",
  },
  {
    id: "google_drive",
    name: "Google Drive",
    category: "google",
    categoryLabel: "Google Workspace",
    description:
      "Search, parse, and upload documents, decks, and spreadsheets directly into your company's secure Google Drive.",
    img: "/google-drive.png",
    tint: "#FBBC04",
    capabilities: ["PDF & doc parsing", "Automatic file upload", "Document semantic search", "Drive folder organization"],
    active: true,
    status: "Active",
  },
  {
    id: "google_calendar",
    name: "Google Calendar",
    category: "google",
    categoryLabel: "Google Workspace",
    description:
      "Inspect your schedule, discover open meeting slots, resolve scheduling conflicts, and book calls effortlessly.",
    img: "/google-calendar.png",
    tint: "#4285F4",
    capabilities: ["Schedule inspection", "Slot discovery", "Meeting creation", "Conflict prevention"],
    active: true,
    status: "Active",
  },
  {
    id: "instagram",
    name: "Instagram",
    category: "social",
    categoryLabel: "Social & Marketing",
    description:
      "Publish marketing content, retrieve post engagement metrics, evaluate reel performance, and analyze audience growth.",
    img: "/instagram.svg",
    tint: "#E1306C",
    capabilities: ["Autonomous post publishing", "Engagement analytics", "Reach & impressions", "Content performance"],
    active: true,
    status: "Active",
  },
  {
    id: "google_ads",
    name: "Google Ads",
    category: "google",
    categoryLabel: "Google Workspace",
    description:
      "Monitor advertising campaigns, evaluate search keyword ROAS, audit ad spend, and track customer conversion funnels.",
    img: "/google-ads.png",
    tint: "#FBBC04",
    capabilities: ["Campaign ROAS audit", "Ad performance metrics", "Keyword ROI analysis", "Spend alerts"],
    active: false,
    status: "Coming Soon",
  },
  {
    id: "meta_ads",
    name: "Meta Ads",
    category: "social",
    categoryLabel: "Social & Marketing",
    description:
      "Deep integration with Meta Ads Manager to evaluate creative variations, audience targeting, and blended acquisition cost.",
    img: "/meta.svg",
    tint: "#0081FB",
    capabilities: ["Ad set performance", "Creative evaluation", "CAC optimization", "Spend pacing"],
    active: false,
    status: "Coming Soon",
  },
  {
    id: "shopify",
    name: "Shopify",
    category: "commerce",
    categoryLabel: "Commerce & Finance",
    description:
      "Real-time order streaming, inventory tracking, customer lifetime value analysis, and sales trend monitoring.",
    img: "/shopify.svg",
    tint: "#96BF48",
    capabilities: ["Live order streaming", "Inventory alerts", "AOV & LTV calculations", "Product catalog sync"],
    active: false,
    status: "Coming Soon",
  },
  {
    id: "razorpay",
    name: "Razorpay",
    category: "commerce",
    categoryLabel: "Commerce & Finance",
    description:
      "Verify checkout transactions, track payment success rates, reconcile customer invoices, and audit revenue health.",
    img: "/razorpay.svg",
    tint: "#0C2340",
    capabilities: ["Payment verification", "Invoice reconciliation", "Failure rate audit", "Transaction search"],
    active: false,
    status: "Coming Soon",
  },
  {
    id: "notion",
    name: "Notion",
    category: "developer",
    categoryLabel: "Knowledge & Dev",
    description:
      "Connect your company Notion workspace to feed SOPs, product roadmaps, and company docs into your AI agents.",
    Icon: FileText,
    tint: "#1F2937",
    capabilities: ["Database syncing", "Knowledge base indexing", "Roadmap documentation", "Task management"],
    active: false,
    status: "Coming Soon",
  },
  {
    id: "custom_apis",
    name: "REST APIs & Webhooks",
    category: "developer",
    categoryLabel: "Knowledge & Dev",
    description:
      "Universal connector allowing your CEO agent and specialists to interact with any custom internal database or external API.",
    Icon: Blocks,
    tint: "#163A24",
    capabilities: ["Custom API calls", "Inbound webhooks", "Secure bearer authentication", "JSON data payloads"],
    active: false,
    status: "Coming Soon",
  },
];

const CATEGORIES: { id: IntegrationCategory; label: string }[] = [
  { id: "all", label: "All Integrations" },
  { id: "google", label: "Google Workspace" },
  { id: "social", label: "Social & Growth" },
  { id: "commerce", label: "Commerce & Payments" },
  { id: "developer", label: "Knowledge & Dev" },
];

export default function IntegrationsPage() {
  const [activeCategory, setActiveCategory] = useState<IntegrationCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = INTEGRATIONS.filter((item) => {
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.capabilities.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <LandingThemeProvider>
      <div data-landing data-theme="light" className="relative min-h-screen bg-[#fdfcf8] text-[#0f2214]">
        <Cursor />
        <Nav />

        <main className="pt-28 sm:pt-36 pb-24 max-w-[1360px] mx-auto px-6 sm:px-10 lg:px-12">
          {/* ── Hero Header ── */}
          <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-18">
            <h1 className="hero-serif text-[clamp(2.5rem,5.5vw,4.4rem)] leading-[0.98] tracking-[-0.035em] text-[#0f2214]">
              Connect your tools.
              <br />
              <span className="italic text-[#385945]">Supercharge your team.</span>
            </h1>

            <p className="mt-5 text-[16px] sm:text-[18px] text-[#425247] leading-[1.58] font-[450] text-balance">
              Every integration is natively connected to your entire agent workforce. Read real data, automate workflows, and execute cross-platform tasks from one central CEO agent.
            </p>

            {/* Free-credit callout badge */}
            <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#132c1c]/[0.05] border border-[#132c1c]/10 px-4 py-2 text-[13.5px] font-medium text-[#132c1c]">
              <Sparkles className="w-4 h-4 text-[#1b4329]" />
              <span>All integrations included with every account — start with <strong>50 free credits</strong></span>
            </div>
          </div>

          {/* ── Filter & Search Bar ── */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-black/[0.07]">
            {/* Category tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-full bg-[#f3f1ea] border border-black/[0.04]">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`rounded-full px-4 py-1.5 text-[13px] font-[550] transition-all duration-200 ${
                    activeCategory === cat.id
                      ? "bg-white text-[#0f2214] shadow-sm font-semibold"
                      : "text-[#55675c] hover:text-[#0f2214]"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[240px] sm:min-w-[280px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7d8f84]" />
              <input
                type="text"
                placeholder="Search integrations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-full border border-black/10 bg-white text-[13.5px] text-[#0f2214] placeholder-[#7d8f84] focus:outline-none focus:ring-2 focus:ring-[#163a24]/20 focus:border-[#163a24]"
              />
            </div>
          </div>

          {/* ── Integrations Grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item) => {
              const Icon = item.Icon;
              return (
                <div
                  key={item.id}
                  className="group relative rounded-2xl border border-black/[0.08] bg-white p-6 shadow-[0_2px_12px_rgba(15,34,20,0.03)] hover:shadow-[0_12px_32px_rgba(15,34,20,0.08)] hover:border-black/15 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Top row: Icon + Category Badge */}
                    <div className="flex items-center justify-between gap-3 mb-5">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center p-2.5 bg-[#f6f5f0] border border-black/[0.06] group-hover:scale-105 transition-transform duration-300">
                        {item.img ? (
                          <Image
                            src={item.img}
                            alt={item.name}
                            width={32}
                            height={32}
                            className="w-7 h-7 object-contain"
                          />
                        ) : Icon ? (
                          <Icon className="w-6 h-6 text-[#163a24]" />
                        ) : null}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {!item.active && (
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[#687c71] bg-[#ece9e1] px-2 py-0.5 rounded font-semibold">
                            Soon
                          </span>
                        )}
                        <span className="text-[11px] font-mono uppercase tracking-wider text-[#55675c] bg-[#f2efe9] px-2.5 py-1 rounded-md font-medium">
                          {item.categoryLabel}
                        </span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-[19px] font-bold tracking-tight text-[#0f2214] mb-2 flex items-center gap-2">
                      {item.name}
                    </h3>
                    <p className="text-[14px] text-[#4d5e53] leading-[1.5] mb-5">
                      {item.description}
                    </p>

                    {/* Capability Tags */}
                    <div className="space-y-1.5 mb-6">
                      {item.capabilities.map((cap) => (
                        <div key={cap} className="flex items-center gap-2 text-[12.5px] text-[#2d3d34]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#1b4329] shrink-0" />
                          <span>{cap}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom: Status & Action */}
                  <div className="pt-4 border-t border-black/[0.06] flex items-center justify-between text-[12px]">
                    {item.active ? (
                      <>
                        <span className="inline-flex items-center gap-1.5 text-[#1e4a30] font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1e4a30] animate-pulse" />
                          Active
                        </span>
                        <Link
                          href="/auth"
                          className="text-[#0f2214] font-semibold hover:text-[#1b4329] inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-all"
                        >
                          Connect in app <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </>
                    ) : (
                      <>
                        <span className="inline-flex items-center gap-1.5 text-[#73847a] font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#94a69c]" />
                          Soon
                        </span>
                        <span className="text-[#88988f] text-[12px]">
                          Coming soon
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Banner: free-credit starter CTA ── */}
          <div className="mt-16 rounded-3xl bg-[#0f2214] text-[#fdfcf8] p-8 sm:p-12 relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
            <div
              className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-20 pointer-events-none"
              style={{ background: "radial-gradient(circle, #7cc99a 0%, transparent 70%)" }}
            />

            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-mono tracking-widest text-[#a8d9b8] uppercase mb-4">
                <ShieldCheck className="w-3.5 h-3.5" />
                Zero setup cost
              </div>
              <h2 className="hero-serif text-[clamp(1.8rem,4vw,2.8rem)] leading-tight text-white mb-3">
                All integrations are ready.
                <br />
                Start with 50 free credits.
              </h2>
              <p className="text-[#c1d0c7] text-[15px] sm:text-[16px] leading-relaxed">
                Create an account and receive 50 complimentary credits immediately. Every agent, tool, and integration is fully unlocked — recharge only when your credits are used up.
              </p>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Link
                href="/auth"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-[#0f2214] px-8 py-4 text-[14.5px] font-bold hover:bg-[#f2efe9] transition-all shadow-lg text-center"
              >
                <span>Get Started with 50 free credits</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </main>
      </div>
    </LandingThemeProvider>
  );
}
