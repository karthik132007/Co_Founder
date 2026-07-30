/**
 * WebSocket observability client.
 *
 * Connects to /chat/ws?session_id=... and streams agent events
 * (tool calls, subagent spawns, LLM tokens, errors) into React state.
 *
 * Usage:
 *   const { events, connected } = useObservability(sessionId);
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "./api";

/* ─────────────────────────────────────────────
   Types — match backend ObservabilityEvent
   ───────────────────────────────────────────── */

export type EventType =
  | "tool_start"
  | "tool_end"
  | "tool_error"
  | "subagent_spawn"
  | "subagent_start"
  | "subagent_end"
  | "subagent_error"
  | "llm_token"
  | "llm_start"
  | "llm_end"
  | "session_start"
  | "session_end"
  | "heartbeat"
  | "error";

export interface ObservabilityEvent {
  type: EventType;
  session_id: string;
  timestamp: number;
  agent: string;
  data: Record<string, unknown>;
}

/* ─────────────────────────────────────────────
   Derived / grouped types
   ───────────────────────────────────────────── */

/** A tool-call "run" that groups start, subagent events, and end together. */
export interface ToolRun {
  runId: string;
  toolName: string;
  agent: string;
  toolInput: string;
  startedAt: number;
  endedAt: number | null;
  durationMs: number | null;
  toolOutput: string | null;
  error: string | null;
  /** Subagent events nested under this tool call */
  subagent: {
    name: string;
    task: string;
    effort: string;
    startedAt: number | null;
    endedAt: number | null;
    durationMs: number | null;
    resultPreview: string | null;
    error: string | null;
  } | null;
  status: "running" | "ok" | "error";
}

/* ─────────────────────────────────────────────
   Hook state
   ───────────────────────────────────────────── */

export type ConnectionStatus = "disconnected" | "connecting" | "connected";

export interface ObservabilityState {
  /** Raw events in order received */
  events: ObservabilityEvent[];
  /** Grouped tool runs (derived from raw events) */
  runs: ToolRun[];
  /** Current WebSocket connection status */
  connectionStatus: ConnectionStatus;
  /** True when the stream has ended (session_end received or sentinel) */
  streamEnded: boolean;
  /** Number of connection retries */
  retryCount: number;
}

/* ─────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────── */

function wsUrl(sessionId: string): string {
  const http = API_BASE_URL.replace(/\/+$/, "");
  return http.replace(/^http/, "ws") + `/chat/ws?session_id=${encodeURIComponent(sessionId)}`;
}

let _runCounter = 0;
function nextRunId(): string {
  _runCounter += 1;
  return `run-${_runCounter}`;
}

/* ─────────────────────────────────────────────
   Hook
   ───────────────────────────────────────────── */

export function useObservability(
  sessionId: string | null,
): ObservabilityState {
  const [events, setEvents] = useState<ObservabilityEvent[]>([]);
  const [runs, setRuns] = useState<ToolRun[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [streamEnded, setStreamEnded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const runsRef = useRef<ToolRun[]>([]);
  const eventsRef = useRef<ObservabilityEvent[]>([]);
  const cancelledRef = useRef(false);

  const addEvent = useCallback((ev: ObservabilityEvent) => {
    eventsRef.current = [...eventsRef.current, ev];
    setEvents(eventsRef.current);
  }, []);

  const updateRun = useCallback(
    (updater: (prev: ToolRun[]) => ToolRun[]) => {
      runsRef.current = updater(runsRef.current);
      setRuns(runsRef.current);
    },
    [],
  );

  // Connect / reconnect when sessionId changes
  useEffect(() => {
    if (!sessionId) {
      wsRef.current?.close();
      wsRef.current = null;
      // Defer state reset so it isn't synchronous in the effect body
      queueMicrotask(() => {
        eventsRef.current = [];
        runsRef.current = [];
        setEvents([]);
        setRuns([]);
        setStreamEnded(false);
        setConnectionStatus("disconnected");
      });
      return;
    }

    cancelledRef.current = false;

    // Reset refs immediately (no render) and defer React state reset
    eventsRef.current = [];
    runsRef.current = [];
    queueMicrotask(() => {
      setEvents([]);
      setRuns([]);
      setStreamEnded(false);
    });

    function connect() {
      if (cancelledRef.current) return;

      setConnectionStatus("connecting");
      const url = wsUrl(sessionId!);
      const socket = new WebSocket(url);

      socket.onopen = () => {
        if (cancelledRef.current) return;
        setConnectionStatus("connected");
        setRetryCount(0);
      };

      socket.onmessage = (msg) => {
        if (cancelledRef.current) return;
        try {
          const ev: ObservabilityEvent = JSON.parse(msg.data as string);
          addEvent(ev);

          // ── Build grouped tool runs ──
          switch (ev.type) {
            case "tool_start": {
              const run: ToolRun = {
                runId: nextRunId(),
                toolName: String(ev.data.tool_name ?? "unknown"),
                agent: ev.agent,
                toolInput: String(ev.data.tool_input ?? ""),
                startedAt: ev.timestamp,
                endedAt: null,
                durationMs: null,
                toolOutput: null,
                error: null,
                subagent: null,
                status: "running",
              };
              updateRun((prev) => [...prev, run]);
              break;
            }

            case "tool_end": {
              const toolName = String(ev.data.tool_name ?? "");
              updateRun((prev) =>
                prev.map((r) => {
                  // Match the most recent running run with the same tool name
                  if (r.toolName === toolName && r.status === "running") {
                    return {
                      ...r,
                      endedAt: ev.timestamp,
                      durationMs: (ev.data.duration_ms as number) ?? null,
                      toolOutput: String(ev.data.tool_output ?? ""),
                      status: "ok" as const,
                    };
                  }
                  return r;
                }),
              );
              break;
            }

            case "tool_error": {
              const toolName = String(ev.data.tool_name ?? "");
              updateRun((prev) =>
                prev.map((r) => {
                  if (r.toolName === toolName && r.status === "running") {
                    return {
                      ...r,
                      endedAt: ev.timestamp,
                      error: String(ev.data.error ?? "Unknown error"),
                      status: "error" as const,
                    };
                  }
                  return r;
                }),
              );
              break;
            }

            case "subagent_spawn": {
              const subagentName = String(ev.data.subagent_name ?? "");
              updateRun((prev) => {
                // Find the most recent running tool run
                const idx = [...prev].reverse().findIndex((r) => r.status === "running");
                if (idx === -1) return prev;
                const mapped = [...prev];
                const realIdx = mapped.length - 1 - idx;
                mapped[realIdx] = {
                  ...mapped[realIdx],
                  subagent: {
                    name: subagentName,
                    task: String(ev.data.task ?? ""),
                    effort: String(ev.data.effort ?? "flash"),
                    startedAt: ev.timestamp,
                    endedAt: null,
                    durationMs: null,
                    resultPreview: null,
                    error: null,
                  },
                };
                return mapped;
              });
              break;
            }

            case "subagent_end": {
              const subagentName = String(ev.data.subagent_name ?? "");
              updateRun((prev) =>
                prev.map((r) => {
                  if (r.subagent?.name === subagentName && r.subagent.startedAt !== null && r.subagent.endedAt === null) {
                    return {
                      ...r,
                      subagent: {
                        ...r.subagent,
                        endedAt: ev.timestamp,
                        durationMs: (ev.data.duration_ms as number) ?? null,
                        resultPreview: String(ev.data.result_preview ?? ""),
                      },
                    };
                  }
                  return r;
                }),
              );
              break;
            }

            case "subagent_error": {
              const subagentName = String(ev.data.subagent_name ?? "");
              updateRun((prev) =>
                prev.map((r) => {
                  if (r.subagent?.name === subagentName && r.subagent.endedAt === null) {
                    return {
                      ...r,
                      subagent: {
                        ...r.subagent,
                        endedAt: ev.timestamp,
                        error: String(ev.data.error ?? "Unknown error"),
                      },
                    };
                  }
                  return r;
                }),
              );
              break;
            }

            case "session_end":
              setStreamEnded(true);
              break;
          }
        } catch {
          // Malformed event — ignore
        }
      };

      socket.onclose = () => {
        if (cancelledRef.current) return;
        setConnectionStatus("disconnected");
        // Auto-reconnect if stream hasn't ended (max 3 retries)
        if (!streamEnded && !cancelledRef.current) {
          const delay = Math.min(1000 * 2 ** retryCount, 8000);
          setRetryCount((c) => c + 1);
          setTimeout(() => {
            if (!cancelledRef.current && retryCount < 3) connect();
          }, delay);
        }
      };

      socket.onerror = () => {
        // onclose will fire next — no need to handle here
      };

      wsRef.current = socket;
    }

    connect();

    return () => {
      cancelledRef.current = true;
      wsRef.current?.close();
      wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  return { events, runs, connectionStatus, streamEnded, retryCount };
}
