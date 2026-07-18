"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send,
  Loader2,
  Sparkles,
  User,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { sendChatMessage, fetchSessionMessages } from "@/lib/api";
import type { SessionUser } from "@/lib/session";

const ACCENT = "#4f46e5";

/* ─────────────────────────────────────────────
   Types
   ───────────────────────────────────────────── */

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

type ChatProps = {
  user: SessionUser;
  initialSessionId: string | null;
  initialTitle: string | null;
  onSessionCreated: (sessionId: string, title: string) => void;
};

const markdownComponents: Components = {
  p: ({ children }) => (
    <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
  ),
  h1: ({ children }) => (
    <h1 className="mb-3 mt-1 text-base font-semibold leading-snug text-[#0a0a0a]">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2.5 mt-4 text-[15px] font-semibold leading-snug text-[#0a0a0a] first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-3 text-sm font-semibold leading-snug text-[#0a0a0a] first:mt-0">
      {children}
    </h3>
  ),
  ul: ({ children }) => (
    <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li className="pl-1 leading-relaxed">{children}</li>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-medium text-[#4f46e5] underline decoration-[#4f46e5]/30 underline-offset-2 hover:decoration-[#4f46e5]"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-3 border-l-2 border-[#4f46e5]/30 pl-3 text-[#4b5563] last:mb-0">
      {children}
    </blockquote>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-[#0a0a0a]">{children}</strong>
  ),
  code: ({ children, className, ...props }) => (
    <code
      className={
        className ??
        "rounded-md bg-[#f3f4f6] px-1.5 py-0.5 text-[0.85em] font-medium text-[#374151]"
      }
      {...props}
    >
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="mb-3 overflow-x-auto rounded-xl bg-[#0a0a0a] px-4 py-3 text-[13px] leading-relaxed text-white last:mb-0">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <table className="mb-3 min-w-full border-collapse text-left text-[13px] last:mb-0">
      {children}
    </table>
  ),
  th: ({ children }) => (
    <th className="border border-[#e5e7eb] bg-[#f9fafb] px-3 py-2 font-semibold text-[#0a0a0a]">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-[#e5e7eb] px-3 py-2 align-top">{children}</td>
  ),
};

function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="overflow-x-auto text-sm leading-relaxed break-words text-[#374151]">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Chat Component
   ───────────────────────────────────────────── */

export default function Chat({
  user,
  initialSessionId,
  initialTitle,
  onSessionCreated,
}: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId);
  const [chatTitle, setChatTitle] = useState<string | null>(initialTitle);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Sync props into state during render (React-recommended pattern)
  const [prevProps, setPrevProps] = useState({ initialSessionId, initialTitle });
  if (
    prevProps.initialSessionId !== initialSessionId ||
    prevProps.initialTitle !== initialTitle
  ) {
    setPrevProps({ initialSessionId, initialTitle });
    setSessionId(initialSessionId);
    setChatTitle(initialTitle);
    setError("");
    if (!initialSessionId) {
      setMessages([]);
    }
  }

  useEffect(() => {
    if (!initialSessionId) return;
    let cancelled = false;

    // Defer synchronous state update out of the effect body
    queueMicrotask(() => {
      if (!cancelled) setLoadingMessages(true);
    });

    fetchSessionMessages(user.id, initialSessionId)
      .then((data) => {
        if (cancelled) return;
        setMessages(
          data.messages.map((m) => ({
            id: String(m.id),
            role: m.role as "user" | "assistant",
            content: m.content,
            timestamp: m.created_at
              ? new Date(m.created_at).getTime()
              : Date.now(),
          })),
        );
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load session");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingMessages(false);
      });

    return () => {
      cancelled = true;
    };
  }, [initialSessionId, user.id]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);
    setError("");

    try {
      const response = await sendChatMessage(
        user.id,
        trimmed,
        sessionId ?? undefined,
      );

      if (response.is_new_session || !sessionId) {
        setSessionId(response.session_id);
        const title = response.title ?? "Untitled Chat";
        setChatTitle(title);
        onSessionCreated(response.session_id, title);
      }

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.message,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get response");
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [input, sending, user.id, sessionId, onSessionCreated]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const isEmpty = messages.length === 0 && !loadingMessages;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center shrink-0 pb-3">
        {chatTitle ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#eef2ff] flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4" style={{ color: ACCENT }} />
            </div>
            <span className="text-sm font-semibold text-[#0a0a0a] truncate">
              {chatTitle}
            </span>
          </div>
        ) : (
          <span className="text-sm font-medium text-[#9ca3af]">New Chat</span>
        )}
      </div>

      {loadingMessages && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: ACCENT }} />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-1 pb-4">
        {/* Empty state */}
        {isEmpty && (
          <div className="h-full flex flex-col items-center justify-center text-center py-16">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: ACCENT }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-base font-semibold text-[#0a0a0a]">
              Ask your AI team anything
            </h3>
            <p className="mt-1.5 text-sm text-[#6b7280] max-w-sm">
              Strategy, marketing plans, financial projections, code — your CEO
              agent delegates to specialists and delivers real output.
            </p>
          </div>
        )}

        <div className="space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: ACCENT }}
                  >
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}

                <div
                  className={`min-w-0 ${
                    msg.role === "user"
                      ? "max-w-[75%] bg-[#0a0a0a] text-white rounded-2xl rounded-tr-md px-4.5 py-3 px-5"
                      : "max-w-[85%] py-1.5"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <MarkdownMessage content={msg.content} />
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>
                  )}
                  <span
                    className={`text-[10px] mt-1.5 block font-medium ${
                      msg.role === "user" ? "text-white/50" : "text-[#9ca3af]"
                    }`}
                  >
                    {formatTime(msg.timestamp)}
                  </span>
                </div>

                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-lg bg-[#e5e7eb] flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-[#6b7280]" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          <AnimatePresence>
            {sending && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-3"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: ACCENT }}
                >
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex items-center gap-1.5">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="w-1.5 h-1.5 rounded-full bg-[#4f46e5] animate-bounce"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
              >
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-[13px] font-medium text-red-600 flex-1">{error}</p>
                <button
                  onClick={() => setError("")}
                  className="text-xs font-medium text-red-500 underline shrink-0"
                >
                  Dismiss
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 pt-3">
        <div className="card rounded-2xl px-4 py-2.5 flex items-center gap-3 focus-within:border-[#4f46e5] focus-within:ring-2 focus-within:ring-[#4f46e5]/10 transition-all">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message your CEO agent…"
            disabled={sending}
            className="flex-1 bg-transparent text-sm text-[#0a0a0a] placeholder-[#9ca3af] outline-none py-1.5 disabled:opacity-50"
            autoFocus
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:cursor-not-allowed"
            style={{
              background: input.trim() && !sending ? ACCENT : "#f3f4f6",
              color: input.trim() && !sending ? "#fff" : "#9ca3af",
            }}
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-[11px] text-[#9ca3af] text-center mt-3">
          Your CEO agent coordinates strategy and delegates to specialist agents.
        </p>
      </div>
    </div>
  );
}
