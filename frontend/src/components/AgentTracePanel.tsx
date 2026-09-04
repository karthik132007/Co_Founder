"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Loader2,
  Radio,
  RefreshCw,
  Terminal,
  Trash2,
  Wifi,
  WifiOff,
} from "lucide-react";
import type { ToolRun } from "@/lib/observability";
import type { ConnectionStatus } from "@/lib/observability";
import { TraceRow } from "./AgentTimeline";

const ACCENT = "#143620";

export type AgentTracePanelProps = {
  runs: ToolRun[];
  streamingText: string;
  llmActive: boolean;
  /** A query is currently in flight (sending === true). */
  isStreaming: boolean;
  connectionStatus: ConnectionStatus;
  retryCount: number;
  open: boolean;
  onToggle: () => void;
  onClear: () => void;
};

function statusMeta(status: ConnectionStatus, isStreaming: boolean, retryCount: number) {
  if (isStreaming) {
    return { label: "Live", color: ACCENT, Icon: Radio, pulse: true };
  }
  if (status === "connected") {
    return { label: "Connected", color: "#10b981", Icon: Wifi, pulse: false };
  }
  if (status === "connecting") {
    return { label: "Connecting…", color: "#f59e0b", Icon: Loader2, pulse: true };
  }
  return {
    label: retryCount > 0 ? `Reconnecting (${retryCount})…` : "Offline",
    color: "#ef4444",
    Icon: WifiOff,
    pulse: false,
  };
}

/**
 * Agent trace dropdown that lives BESIDE the chat bar (anchored above the
 * input, right-aligned).  Opens as a popover so the trace is visible the
 * moment a request is sent, while the chat itself stays uncluttered.
 */
export default function AgentTracePanel({
  runs,
  streamingText,
  llmActive,
  isStreaming,
  connectionStatus,
  retryCount,
  open,
  onToggle,
  onClear,
}: AgentTracePanelProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const { label, color, Icon, pulse } = statusMeta(connectionStatus, isStreaming, retryCount);
  const showLiveResponse = llmActive && streamingText.length > 0;
  const showWaiting = isStreaming && runs.length === 0 && !showLiveResponse;
  const runningCount = runs.filter((r) => r.status === "running").length;

  // Close on outside click (without blocking interaction with the input).
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (rootRef.current && !rootRef.current.contains(target)) {
        onToggle();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [open, onToggle]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      {/* Toggle button — sits inside the chat bar */}
      <button
        type="button"
        onClick={onToggle}
        aria-label="Toggle agent trace"
        aria-expanded={open}
        className={`group flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-semibold transition-all duration-200 ${
          open || isStreaming
            ? "border-[#143620]/40 bg-[#eaf0e8] text-[#143620]"
            : "border-[#e8e9e3] bg-[#fdfcf8] text-[#5f6f63] hover:border-[#143620]/40 hover:text-[#143620]"
        }`}
      >
        <Terminal className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Trace</span>
        {(isStreaming || llmActive) && (
          <span className="relative flex h-2 w-2">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
              style={{ background: ACCENT }}
            />
            <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: ACCENT }} />
          </span>
        )}
        <ChevronDown
          className={`w-3 h-3 text-current transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Popover — opens UP from the chat bar, right-aligned ("at the side") */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute bottom-full right-0 z-50 mb-2 w-[min(92vw,440px)] overflow-hidden rounded-2xl border border-[#e8e9e3] bg-white shadow-[0_18px_50px_-12px_rgba(0,0,0,0.25)]"
          >
              {/* Dropdown arrow */}
              <div className="absolute -bottom-1 right-6 h-2.5 w-2.5 rotate-45 border-b border-r border-[#e8e9e3] bg-white" />

              {/* Header */}
              <div className="flex items-center gap-2 border-b border-[#f6f5ef] bg-[#fdfcf8] px-3.5 py-2.5">
                <Terminal className="h-3.5 w-3.5 text-[#5f6f63]" />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#2f3e32]">
                  Agent Trace
                </span>
                <span
                  className="ml-auto inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ background: `${color}14`, color }}
                >
                  <Icon className={`h-2.5 w-2.5 ${pulse ? "animate-spin" : ""}`} />
                  {label}
                </span>
                {runs.length > 0 && (
                  <button
                    type="button"
                    onClick={onClear}
                    aria-label="Clear trace"
                    className="rounded-md p-1 text-[#8d9d94] transition-colors hover:bg-[#f6f5ef] hover:text-[#ef4444]"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>

              <div className="max-h-[65vh] overflow-y-auto overscroll-contain">
                {/* Live LLM response stream */}
                <AnimatePresence>
                  {showLiveResponse && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-b border-[#f6f5ef] bg-[#fdfcf8]/60 px-3.5 py-2.5"
                    >
                      <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#143620]">
                        <Loader2 className="h-2.5 w-2.5 animate-spin" />
                        Streaming response
                      </p>
                      <p className="max-h-32 overflow-y-auto whitespace-pre-wrap break-words text-[12px] leading-relaxed text-[#2f3e32]">
                        {streamingText}
                        <span
                          className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse rounded-full align-middle"
                          style={{ background: ACCENT }}
                        />
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Waiting state */}
                {showWaiting && (
                  <div className="flex flex-col items-center justify-center gap-2 px-4 py-6 text-center">
                    <Loader2 className="h-4 w-4 animate-spin" style={{ color: ACCENT }} />
                    <p className="text-[11px] text-[#8d9d94]">
                      {connectionStatus === "connecting"
                        ? "Connecting to agent stream…"
                        : "Waiting for the CEO agent to start…"}
                    </p>
                  </div>
                )}

                {/* Tool runs */}
                {runs.length > 0 && (
                  <div className="py-1">
                    {isStreaming && runningCount > 0 && (
                      <p className="px-3.5 pt-1.5 text-[10px] font-medium text-[#143620]">
                        {runningCount} tool{runningCount !== 1 ? "s" : ""} running…
                      </p>
                    )}
                    {runs.map((run) => (
                      <TraceRow key={run.runId} run={run} />
                    ))}
                  </div>
                )}

                {/* Empty + idle */}
                {!isStreaming && runs.length === 0 && !showLiveResponse && (
                  <div className="px-4 py-6 text-center">
                    <RefreshCw className="mx-auto mb-2 h-4 w-4 text-[#c2c9c0]" />
                    <p className="text-[11px] text-[#8d9d94]">
                      Send a message and the CEO agent&apos;s tool calls will appear here in real time.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
