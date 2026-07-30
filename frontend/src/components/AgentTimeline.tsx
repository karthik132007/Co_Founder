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
  Terminal,
} from "lucide-react";
import type { ToolRun } from "@/lib/observability";

export type AgentTraceInlineProps = {
  runs: ToolRun[];
  isStreaming?: boolean;
};

const SUBAGENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Researcher: Search,
  Writer: PenLine,
  CMO: Megaphone,
  DataAnalyst: BarChart3,
  GraphicDesigner: Palette,
};

const SUBAGENT_COLORS: Record<string, string> = {
  Researcher: "#3b82f6",
  Writer: "#8b5cf6",
  CMO: "#f59e0b",
  DataAnalyst: "#10b981",
  GraphicDesigner: "#ec4899",
};

function subagentIcon(name: string) { return SUBAGENT_ICONS[name] ?? Bot; }
function subagentColor(name: string) { return SUBAGENT_COLORS[name] ?? "#6b7280"; }

function formatDuration(ms: number | null): string {
  if (ms === null) return "";
  if (ms < 1000) return Math.round(ms) + "ms";
  if (ms < 60000) return (ms / 1000).toFixed(1) + "s";
  return (ms / 60000).toFixed(1) + "m";
}

function TraceRow({ run }: { run: ToolRun }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left hover:bg-gray-50/80 transition-colors group"
      >
        <ChevronRight
          className={"w-3 h-3 text-gray-400 transition-transform shrink-0 " + (expanded ? "rotate-90" : "")}
        />
        <Cpu className="w-3 h-3 text-gray-400 shrink-0" />
        <span className="text-[11px] font-semibold text-gray-700 truncate flex-1">
          {run.toolName}
        </span>
        {run.status === "running" && <Loader2 className="w-3 h-3 animate-spin text-blue-500 shrink-0" />}
        {run.status === "ok" && <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />}
        {run.status === "error" && <XCircle className="w-3 h-3 text-red-500 shrink-0" />}
        {run.durationMs !== null && (
          <span className="text-[10px] text-gray-400 font-mono tabular-nums shrink-0">
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
                  <code className="block text-[10px] text-gray-500 bg-gray-50 rounded-md px-2 py-1 break-all font-mono leading-relaxed">
                    {run.toolInput}
                  </code>
                </div>
              )}
              {run.toolOutput && (
                <div className="pl-5">
                  <p className="text-[10px] text-gray-500 bg-gray-50 rounded-md px-2 py-1 leading-relaxed max-h-16 overflow-y-auto">
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
                    <span className="text-[10px] text-gray-400 font-mono ml-auto">
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

export default function AgentTraceInline({ runs, isStreaming }: AgentTraceInlineProps) {
  const [collapsed, setCollapsed] = useState(false);

  // Show nothing only when not streaming and no runs at all
  if (runs.length === 0 && !isStreaming) return null;

  return (
    <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50/60 overflow-hidden">
      {/* Header — click to collapse */}
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 border-b border-gray-100 hover:bg-gray-100/50 transition-colors"
      >
        <ChevronRight
          className={`w-3 h-3 text-gray-400 transition-transform shrink-0 ${collapsed ? "" : "rotate-90"}`}
        />
        <Terminal className="w-3 h-3 text-gray-500" />
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
          Agent Trace
        </span>
        {isStreaming && runs.length === 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] text-blue-500 font-medium ml-auto">
            <Loader2 className="w-2.5 h-2.5 animate-spin" />
            Waiting for agent…
          </span>
        )}
        {isStreaming && runs.length > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] text-blue-500 font-medium ml-auto">
            <Loader2 className="w-2.5 h-2.5 animate-spin" />
            {runs.length} tool{runs.length !== 1 ? "s" : ""}
          </span>
        )}
        {!isStreaming && runs.length > 0 && (
          <span className="text-[10px] text-gray-400 font-medium ml-auto">
            {runs.length} tool{runs.length !== 1 ? "s" : ""}
          </span>
        )}
      </button>

      {/* Collapsible body */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            {runs.length === 0 && isStreaming ? (
              <div className="flex items-center justify-center py-4 text-center px-4">
                <p className="text-[11px] text-gray-400">
                  Listening for tool calls from the CEO agent…
                </p>
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto overscroll-contain">
                {runs.map((run) => (
                  <TraceRow key={run.runId} run={run} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
