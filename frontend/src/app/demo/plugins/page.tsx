"use client";

import { motion } from "framer-motion";
import { Check, FileText, Link2, Search, SlidersHorizontal } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DEMO_COMPANY } from "@/components/demo/demoChats";

type ConnectorDef = {
  id: string;
  name: string;
  description: string;
  img?: string;
  Icon?: LucideIcon;
  tint: string;
  /** What the workspace actually used it for — shown instead of a Disconnect button. */
  usedFor: string;
};

const CONNECTORS: ConnectorDef[] = [
  { id: "instagram", name: "Instagram", description: "Publish content and pull insights from Instagram", img: "/instagram.svg", tint: "#E1306C", usedFor: "Used in 2 chats" },
  { id: "google_sheets", name: "Google Sheets", description: "Read, write and append rows in your spreadsheets", img: "/google-sheets.svg", tint: "#34A853", usedFor: "Used in 4 chats" },
  { id: "google_drive", name: "Google Drive", description: "Search, read, and upload files in your Google Drive", img: "/google-drive.png", tint: "#FBBC04", usedFor: "Used in 5 chats" },
  { id: "gmail", name: "Gmail", description: "Draft replies, summarize threads & search your inbox", img: "/gmail.png", tint: "#EA4335", usedFor: "Used in 3 chats" },
  { id: "google_calendar", name: "Google Calendar", description: "Read your schedule, find free slots & book meetings", img: "/google-calendar.png", tint: "#4285F4", usedFor: "Used in 2 chats" },
  { id: "google_ads", name: "Google Ads", description: "Monitor campaigns and pull ad performance data", img: "/google-ads.png", tint: "#FBBC04", usedFor: "Read-only access" },
  { id: "notion", name: "Notion", description: "Connect your Notion workspace to power workflows", Icon: FileText, tint: "#1f2937", usedFor: "Workspace pages synced" },
  { id: "shopify", name: "Shopify", description: "Orders & sales data", img: "/shopify.svg", tint: "#96BF48", usedFor: "Read-only access" },
];

export default function DemoPluginsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-[#0f2214]">Plugins</h2>
        <p className="text-sm text-[#5f6f63]">
          Connect the tools you already use so your AI team can act on them.
        </p>
      </div>

      {/* Search + filter — visually identical, disabled in the demo */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d9d94]" />
          <input
            disabled
            placeholder="Search connectors"
            title="Search is disabled in the demo"
            className="input pl-9 py-2.5 text-sm cursor-not-allowed opacity-70"
          />
        </div>
        <button
          disabled
          title="Filters are disabled in the demo"
          className="inline-flex items-center gap-2 rounded-lg border border-[rgba(15,34,20,0.08)] bg-white px-3.5 py-2.5 text-sm font-medium text-[#2f3e32] opacity-70 cursor-not-allowed"
        >
          <SlidersHorizontal className="h-4 w-4 text-[#5f6f63]" />
          Filter: All
        </button>
      </div>

      {/* Section heading */}
      <div className="flex items-center justify-between pt-2">
        <h3 className="text-[15px] font-semibold text-[#0f2214]">Top connectors</h3>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11.5px] font-medium text-emerald-700">
          <Check className="h-3 w-3" />
          {CONNECTORS.length} of {CONNECTORS.length} connected
        </span>
      </div>

      {/* Grid — every connector is connected in the demo workspace */}
      <div className="grid gap-3 sm:grid-cols-2">
        {CONNECTORS.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.3 }}
            className="card card-hover flex items-center gap-3.5 p-4"
          >
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
              style={{ background: `${c.tint}14`, borderColor: `${c.tint}2e`, color: c.tint }}
            >
              {c.img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.img} alt={`${c.name} logo`} className="h-6 w-6 object-contain" />
              ) : c.Icon ? (
                <c.Icon className="h-5 w-5" strokeWidth={1.75} />
              ) : (
                <Link2 className="h-5 w-5" strokeWidth={1.75} />
              )}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-[14px] font-semibold text-[#0f2214]">{c.name}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                  <Check className="h-3 w-3" /> Connected
                </span>
              </div>
              <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-[#5f6f63]">{c.description}</p>
              <p className="mt-1 text-[11px] text-[#8d9d94]">{c.usedFor}</p>
            </div>

            <span
              title="Connections are read-only in the demo"
              className="shrink-0 rounded-lg border border-[rgba(15,34,20,0.08)] px-3 py-1.5 text-[12px] font-medium text-[#8d9d94]"
            >
              Manage
            </span>
          </motion.div>
        ))}
      </div>

      <div className="rounded-2xl border border-[rgba(15,34,20,0.08)] bg-[#f6f8f5] px-5 py-4">
        <p className="text-[12.5px] leading-relaxed text-[#5f6f63]">
          <span className="font-semibold text-[#143620]">
            {DEMO_COMPANY.name} has all eight connectors live.
          </span>{" "}
          Google (Gmail, Sheets, Drive, Calendar) shares one OAuth grant; Instagram uses its own
          token and is the only connector that can publish on your behalf — always behind an
          approval question. Nothing on this page is editable in the demo.
        </p>
      </div>
    </div>
  );
}
