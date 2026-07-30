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
  toolRunId: string;        // from the backend (unique per invocation, survives parallel calls)
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
  /** Snapshot current runs (for attaching to a completed message) */
  snapshotRuns: () => ToolRun[];
  /** Reset runs for a new query (does NOT reconnect the WebSocket).
   *  Pass the sessionId if it was just generated and React hasn't re-rendered yet. */
  startQuery: (overrideSessionId?: string) => void;
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
  const retryCountRef = useRef(0);
  const sessionRef = useRef(sessionId);
  sessionRef.current = sessionId;
  // Tracks which session ID the WS was last opened for
  const connectedSessionRef = useRef<string | null>(null);

  retryCountRef.current = retryCount;

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

  // ── snapshotRuns ──
  const snapshotRuns = useCallback((): ToolRun[] => {
    return runsRef.current.map((r) => ({ ...r, subagent: r.subagent ? { ...r.subagent } : null }));
  }, []);

  // ── Internal: create & wire up a WebSocket ──
  const _openSocket = useCallback((overrideSessionId?: string) => {
    const sid = overrideSessionId ?? sessionRef.current;
    if (!sid) return;

    // Close previous socket if any
    cancelledRef.current = true;
    wsRef.current?.close();
    wsRef.current = null;
    cancelledRef.current = false;

    setConnectionStatus("connecting");
    const url = wsUrl(sid);
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

        switch (ev.type) {
          case "tool_start": {
            const backendRunId = String(ev.data.tool_run_id ?? "");
            const run: ToolRun = {
              runId: nextRunId(),
              toolRunId: backendRunId,
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
            const backendRunId = String(ev.data.tool_run_id ?? "");
            updateRun((prev) =>
              prev.map((r) => {
                if (r.toolRunId === backendRunId && r.status === "running") {
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
            const backendRunId = String(ev.data.tool_run_id ?? "");
            updateRun((prev) =>
              prev.map((r) => {
                if (r.toolRunId === backendRunId && r.status === "running") {
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
      // Auto-reconnect on unexpected close (backend keeps WS alive across queries)
      const retries = retryCountRef.current;
      if (!cancelledRef.current && retries < 5) {
        const delay = Math.min(1000 * 2 ** retries, 10000);
        setRetryCount((c) => c + 1);
        setTimeout(() => {
          if (!cancelledRef.current) _openSocket();
        }, delay);
      }
    };

    socket.onerror = () => {
      // onclose fires next
    };

    wsRef.current = socket;
    connectedSessionRef.current = sid;
  }, [addEvent, updateRun]);

  // ── startQuery: reset runs + ensure WS is connected ──
  // Pass an explicit sessionId to override the current state (needed when
  // the session ID was just generated but React hasn't re-rendered yet).
  const startQuery = useCallback((overrideSessionId?: string) => {
    runsRef.current = [];
    eventsRef.current = [];
    setRuns([]);
    setEvents([]);
    setStreamEnded(false);

    const sid = overrideSessionId ?? sessionRef.current;
    if (!sid) return;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      _openSocket(overrideSessionId);
    }
  }, [_openSocket]);

  // ── Close WS when switching to a DIFFERENT session (not null→new, not same) ──
  useEffect(() => {
    if (sessionId && connectedSessionRef.current && connectedSessionRef.current !== sessionId) {
      // User switched to a different existing chat — close old WS
      cancelledRef.current = true;
      wsRef.current?.close();
      wsRef.current = null;
      connectedSessionRef.current = null;
      cancelledRef.current = false;
      runsRef.current = [];
      eventsRef.current = [];
      setRuns([]);
      setEvents([]);
      setStreamEnded(false);
    }
  }, [sessionId]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      wsRef.current?.close();
      wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { events, runs, connectionStatus, streamEnded, retryCount, snapshotRuns, startQuery };
}
