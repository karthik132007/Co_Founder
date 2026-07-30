"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Wifi,
  WifiOff,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Cpu,
  Search,
  PenLine,
  BarChart3,
  Megaphone,
  Palette,
  Terminal,
  Bot,
} from "lucide-react";
import type { ToolRun, ConnectionStatus } from "@/lib/observability";
import { useObservability } from "@/lib/observability";

/* ─────────────────────────────────────────────
   Props
   ───────────────────────────────────────────── */

type AgentTimelineProps = {
  sessionId: string | null;
};

/* ─────────────────────────────────────────────
   Subagent icon map
   ───────────────────────────────────────────── */

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

function subagentIcon(name: string) {
  return SUBAGENT_ICONS[name] ?? Bot;
}

function subagentColor(name: string) {
  return SUBAGENT_COLORS[name] ?? "#6b7280";
}

/* ─────────────────────────────────────────────
   Status badge
   ───────────────────────────────────────────── */

function StatusBadge({ status }: { status: ToolRun["status"] }) {
  if (status === "running") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-600">
        <Loader2 className="w-2.5 h-2.5 animate-spin" />
        Running
      </span>
    );
  }
  if (status === "ok") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
        <CheckCircle2 className="w-2.5 h-2.5" />
        OK
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
      <XCircle className="w-2.5 h-2.5" />
      Error
    </span>
  );
}

/* ─────────────────────────────────────────────
   Duration formatter
   ───────────────────────────────────────────── */

function formatDuration(ms: number | null): string {
  if (ms === null) return "";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60_000).toFixed(1)}m`;
}

/* ─────────────────────────────────────────────
   Connection indicator
   ───────────────────────────────────────────── */

function ConnectionDot({ status }: { status: ConnectionStatus }) {
  if (status === "connected") {
    return <Wifi className="w-3 h-3 text-emerald-500" />;
  }
  if (status === "connecting") {
    return <Loader2 className="w-3 h-3 animate-spin text-amber-500" />;
  }
  return <WifiOff className="w-3 h-3 text-gray-400" />;
}

/* ─────────────────────────────────────────────
   Single tool run row
   ───────────────────────────────────────────── */

function ToolRunRow({ run }: { run: ToolRun }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      {/* Main row */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors group"
      >
        <ChevronRight
          className={`w-3 h-3 text-gray-400 transition-transform shrink-0 ${
            expanded ? "rotate-90" : ""
          }`}
        />
        <Cpu className="w-3.5 h-3.5 text-gray-500 shrink-0" />
        <span className="text-xs font-semibold text-gray-800 truncate flex-1">
          {run.toolName}
        </span>
        <StatusBadge status={run.status} />
        {run.durationMs !== null && (
          <span className="text-[10px] text-gray-400 font-mono tabular-nums">
            {formatDuration(run.durationMs)}
          </span>
        )}
      </button>

      {/* Expanded detail */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-2.5 space-y-2">
              {/* Tool input */}
              {run.toolInput && (
                <div className="pl-6">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Input
                  </p>
                  <code className="block text-[11px] text-gray-600 bg-gray-50 rounded-lg px-2.5 py-1.5 break-all font-mono leading-relaxed">
                    {run.toolInput}
                  </code>
                </div>
              )}

              {/* Tool output */}
              {run.toolOutput && (
                <div className="pl-6">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Output
                  </p>
                  <p className="text-[11px] text-gray-600 bg-gray-50 rounded-lg px-2.5 py-1.5 leading-relaxed max-h-24 overflow-y-auto">
                    {run.toolOutput}
                  </p>
                </div>
              )}

              {/* Error */}
              {run.error && (
                <div className="pl-6">
                  <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wider mb-1">
                    Error
                  </p>
                  <p className="text-[11px] text-red-600 bg-red-50 rounded-lg px-2.5 py-1.5 leading-relaxed">
                    {run.error}
                  </p>
                </div>
              )}

              {/* Subagent (nested) */}
              {run.subagent && (
                <div className="pl-6">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    {(() => {
                      const Icon = subagentIcon(run.subagent.name);
                      const color = subagentColor(run.subagent.name);
                      return (
                        <span style={{ color }}>
                          <Icon className="w-3 h-3" />
                        </span>
                      );
                    })()}
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: subagentColor(run.subagent.name) }}
                    >
                      {run.subagent.name}
                    </span>
                    {run.subagent.durationMs !== null && (
                      <span className="text-[10px] text-gray-400 font-mono ml-auto">
                        {formatDuration(run.subagent.durationMs)}
                      </span>
                    )}
                    {run.subagent.error && (
                      <XCircle className="w-3 h-3 text-red-500 ml-1" />
                    )}
                    {run.subagent.endedAt !== null && !run.subagent.error && (
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 ml-1" />
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 mb-1">{run.subagent.task}</p>
                  {run.subagent.resultPreview && (
                    <p className="text-[11px] text-gray-500 bg-gray-50 rounded-lg px-2.5 py-1.5 leading-relaxed max-h-20 overflow-y-auto italic">
                      {run.subagent.resultPreview}
                    </p>
                  )}
                  {run.subagent.error && (
                    <p className="text-[11px] text-red-600 bg-red-50 rounded-lg px-2.5 py-1.5 leading-relaxed mt-1">
                      {run.subagent.error}
                    </p>
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

/* ─────────────────────────────────────────────
   Main Component
   ───────────────────────────────────────────── */

export default function AgentTimeline({ sessionId }: AgentTimelineProps) {
  const [open, setOpen] = useState(false);
  const { runs, connectionStatus, streamEnded } = useObservability(sessionId);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [runs]);

  if (!sessionId) return null;

  const hasActivity = runs.length > 0;
  const isActive = connectionStatus === "connected" || hasActivity;

  return (
    <>
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`fixed bottom-24 right-4 z-50 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-lg border transition-all duration-300 ${
          isActive
            ? "bg-white border-blue-200 text-blue-600 hover:shadow-blue-100/50"
            : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
        }`}
      >
        {open ? (
          <EyeOff className="w-3 h-3" />
        ) : (
          <Eye className="w-3 h-3" />
        )}
        <ConnectionDot status={connectionStatus} />
        <span className="hidden sm:inline">
          {open ? "Hide" : "Agent"} Trace
        </span>
        {hasActivity && !open && (
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] font-bold">
            {runs.length}
          </span>
        )}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-36 right-4 z-50 w-[340px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-gray-200 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.15)] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-xs font-bold text-gray-700 tracking-tight">
                  Agent Trace
                </span>
                <ConnectionDot status={connectionStatus} />
              </div>
              <div className="flex items-center gap-1.5">
                {streamEnded && (
                  <span className="text-[10px] text-gray-400 font-medium">
                    Done
                  </span>
                )}
                {connectionStatus === "connecting" && (
                  <span className="text-[10px] text-amber-500 font-medium">
                    Connecting…
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1 hover:bg-gray-200 transition-colors"
                >
                  <EyeOff className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div
              ref={scrollRef}
              className="max-h-[420px] overflow-y-auto overscroll-contain"
            >
              {runs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                  <Clock className="w-6 h-6 text-gray-300 mb-2" />
                  <p className="text-xs text-gray-400 font-medium">
                    {connectionStatus === "connected"
                      ? "Waiting for agent activity…"
                      : "Connecting to stream…"}
                  </p>
                  <p className="text-[10px] text-gray-300 mt-1">
                    Tool calls and subagent spawns will appear here in real time.
                  </p>
                </div>
              )}

              {runs.map((run) => (
                <ToolRunRow key={run.runId} run={run} />
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-3 py-1.5 bg-gray-50/50">
              <p className="text-[10px] text-gray-400 text-center">
                {runs.length} tool{runs.length !== 1 ? "s" : ""} traced
                {streamEnded ? " • stream ended" : ""}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
