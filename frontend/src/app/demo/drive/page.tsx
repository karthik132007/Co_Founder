"use client";

import { motion } from "framer-motion";
import {
  FileText,
  Image as ImageIcon,
  HardDrive,
  Upload,
  Search,
  Star,
  FolderOpen,
  Table2,
} from "lucide-react";
import { DEMO_FILES, DEMO_STATS, type DemoFile } from "@/components/demo/demoChats";

function fileTypeIcon(kind: DemoFile["kind"]) {
  if (kind === "image") return ImageIcon;
  if (kind === "sheet") return Table2;
  if (kind === "logo") return Star;
  return FileText;
}

const TABS = ["All files", "Documents", "AI Generated", "Images"];

export default function DemoDrivePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-[#0f2214]">Drive</h2>
          <p className="text-sm text-[#5f6f63]">
            Everything your AI team produced — briefs, spreadsheets, creatives and your logo.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="relative hidden sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d9d94]" />
            <input
              disabled
              placeholder="Search files"
              title="Search is disabled in the demo"
              className="input w-56 pl-9 py-2.5 text-sm cursor-not-allowed opacity-70"
            />
          </div>
          <button
            disabled
            title="Uploads are disabled in the demo"
            className="btn-primary px-3.5 py-2.5 text-[13px] opacity-70 cursor-not-allowed"
          >
            <Upload className="h-4 w-4" />
            Upload
          </button>
        </div>
      </div>

      {/* Tabs — read-only */}
      <div className="flex items-center gap-1.5 overflow-x-auto">
        {TABS.map((tab, i) => (
          <span
            key={tab}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-medium ${
              i === 0
                ? "bg-[rgba(20,54,32,0.08)] text-[#143620] shadow-sm"
                : "text-[#5f6f63] border border-[rgba(15,34,20,0.07)] bg-white"
            }`}
          >
            {tab}
          </span>
        ))}
        <span className="ml-auto shrink-0 text-[12px] text-[#8d9d94]">
          {DEMO_STATS.files} files · {DEMO_STATS.storageLabel}
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {DEMO_FILES.map((f, i) => {
          const Icon = fileTypeIcon(f.kind);
          const isCreative = f.name === "VitaminC_Serum_Launch_Creative.png";
          return (
            <motion.div
              key={f.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.28), duration: 0.3 }}
              className="card card-hover overflow-hidden"
            >
              {/* Thumb */}
              <div className="relative flex h-32 items-center justify-center border-b border-[rgba(15,34,20,0.06)] bg-gradient-to-b from-[#fafbf9] via-[#f5f7f3] to-[#eef1ec]">
                {isCreative ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src="/demo_img.png"
                    alt="Vitamin C serum launch creative"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-[rgba(15,34,20,0.07)] bg-white">
                    <Icon className="h-5 w-5 text-[#143620]" strokeWidth={1.75} />
                  </span>
                )}
                {f.badge === "Company Logo" && (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10.5px] font-semibold text-amber-700 shadow-sm">
                    <Star className="h-3 w-3" />
                    Company Logo
                  </span>
                )}
                {f.badge === "AI Graphic" && (
                  <span className="absolute left-2 top-2 rounded-full bg-[#143620]/90 px-2 py-0.5 text-[10.5px] font-semibold text-white shadow-sm">
                    AI Graphic
                  </span>
                )}
              </div>

              {/* Meta */}
              <div className="p-3.5">
                <div className="truncate text-[13px] font-medium text-[#0f2214]">{f.name}</div>
                <div className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-[#5f6f63]">{f.meta}</div>
                <div className="mt-2 flex items-center gap-2 text-[10.5px] text-[#8d9d94]">
                  <span className="inline-flex items-center gap-1">
                    <HardDrive className="h-3 w-3" />
                    {f.size}
                  </span>
                  <span className="text-[#c6d0c9]">·</span>
                  <span>{f.when}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-[rgba(15,34,20,0.08)] bg-[#f6f8f5] px-5 py-4">
        <p className="inline-flex items-start gap-2 text-[12.5px] leading-relaxed text-[#5f6f63]">
          <FolderOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#143620]" />
          <span>
            Previews, downloads and uploads are disabled in the demo — this tour is read-only. The
            same Drive is fully editable once you connect your own workspace.
          </span>
        </p>
      </div>
    </div>
  );
}
