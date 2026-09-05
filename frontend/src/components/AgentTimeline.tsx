"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Cpu,
  Search,
  PenLine,
  BarChart3,
  Megaphone,
  Palette,
  Bot,
} from "lucide-react";
import type { ToolRun } from "@/lib/observability";

export const SUBAGENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Researcher: Search,
  Writer: PenLine,
  CMO: Megaphone,
  DataAnalyst: BarChart3,
  GraphicDesigner: Palette,
};

export const SUBAGENT_COLORS: Record<string, string> = {
  Researcher: "#3b82f6",
  Writer: "#8b5cf6",
  CMO: "#f59e0b",
  DataAnalyst: "#10b981",
  GraphicDesigner: "#ec4899",
};

export function subagentIcon(name: string) { return SUBAGENT_ICONS[name] ?? Bot; }
export function subagentColor(name: string) { return SUBAGENT_COLORS[name] ?? "#5f6f63"; }

export function formatDuration(ms: number | null): string {
  if (ms === null) return "";
  if (ms < 1000) return Math.round(ms) + "ms";
  if (ms < 60000) return (ms / 1000).toFixed(1) + "s";
  return (ms / 60000).toFixed(1) + "m";
}

export function TraceRow({ run }: { run: ToolRun }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-[rgba(15,34,20,0.06)] last:border-b-0">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left hover:bg-[rgba(16,36,24,0.04)] transition-colors group"
      >
        <ChevronRight
          className={"w-3 h-3 text-[#8d9d94] transition-transform shrink-0 " + (expanded ? "rotate-90" : "")}
        />
        <Cpu className="w-3 h-3 text-[#8d9d94] shrink-0" />
        <span className="text-[11px] font-semibold text-[#2f3e32] truncate flex-1">
          {run.toolName}
        </span>
        {run.status === "running" && <Loader2 className="w-3 h-3 animate-spin text-[#143620] shrink-0" />}
        {run.status === "ok" && <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />}
        {run.status === "error" && <XCircle className="w-3 h-3 text-red-500 shrink-0" />}
        {run.durationMs !== null && (
          <span className="text-[10px] text-[#8d9d94] font-mono tabular-nums shrink-0">
            {formatDuration(run.durationMs)}
          </span>
        )}
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-2.5 pb-2 space-y-1.5">
              {run.toolInput && (
                <div className="pl-5">
                  <code className="block text-[10px] text-[#5f6f63] bg-[#fdfcf8] border border-[rgba(15,34,20,0.06)] rounded-md px-2 py-1 break-all font-mono leading-relaxed">
                    {run.toolInput}
                  </code>
                </div>
              )}
              {run.toolOutput && (
                <div className="pl-5">
                  <p className="text-[10px] text-[#5f6f63] bg-[#fdfcf8] border border-[rgba(15,34,20,0.06)] rounded-md px-2 py-1 leading-relaxed max-h-16 overflow-y-auto">
                    {run.toolOutput}
                  </p>
                </div>
              )}
              {run.error && (
                <div className="pl-5">
                  <p className="text-[10px] text-red-600 bg-red-50 rounded-md px-2 py-1 leading-relaxed">
                    {run.error}
                  </p>
                </div>
              )}
              {run.subagent && (
                <div className="pl-5 flex items-center gap-1.5">
                  {(() => {
                    const Icon = subagentIcon(run.subagent!.name);
                    const color = subagentColor(run.subagent!.name);
                    return <span style={{ color }}><Icon className="w-3 h-3" /></span>;
                  })()}
                  <span className="text-[10px] font-semibold uppercase" style={{ color: subagentColor(run.subagent!.name) }}>
                    {run.subagent.name}
                  </span>
                  {run.subagent.durationMs !== null && (
                    <span className="text-[10px] text-[#8d9d94] font-mono ml-auto">
                      {formatDuration(run.subagent.durationMs)}
                    </span>
                  )}
                  {run.subagent.error && <XCircle className="w-2.5 h-2.5 text-red-500" />}
                  {run.subagent.endedAt !== null && !run.subagent.error && (
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
