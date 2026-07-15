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
    <h1 className="mb-3 mt-1 text-base font-bold leading-snug text-[#111827]">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2.5 mt-4 text-sm font-bold leading-snug text-[#111827] first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-3 text-sm font-bold leading-snug text-[#111827] first:mt-0">
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
      className="font-semibold text-[#4F46E5] underline decoration-[#4F46E5]/30 underline-offset-2 hover:decoration-[#4F46E5]"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-3 border-l-2 border-[#635BFF]/40 pl-3 text-[#4B5563] last:mb-0">
      {children}
    </blockquote>
  ),
  strong: ({ children }) => (
    <strong className="font-bold text-[#111827]">{children}</strong>
  ),
  code: ({ children, className, ...props }) => (
    <code
      className={
        className ??
        "rounded-md bg-white/70 px-1.5 py-0.5 text-[0.8em] font-semibold text-[#374151]"
      }
      {...props}
    >
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="mb-3 overflow-x-auto rounded-xl bg-[#111827] px-3 py-2.5 text-xs leading-relaxed text-white last:mb-0">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <table className="mb-3 min-w-full border-collapse text-left text-xs last:mb-0">
      {children}
    </table>
  ),
  th: ({ children }) => (
    <th className="border border-[#D8DEE9] bg-white/70 px-2 py-1.5 font-bold text-[#111827]">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-[#D8DEE9] px-2 py-1.5 align-top">
      {children}
    </td>
  ),
};

function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="chat-markdown overflow-x-auto text-sm leading-relaxed break-words">
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

  /* ── Auto-scroll to bottom ── */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  /* ── Load session messages when initialSessionId changes ── */
  useEffect(() => {
    setSessionId(initialSessionId);
    setChatTitle(initialTitle);
    setError("");

    if (initialSessionId) {
      setLoadingMessages(true);
      fetchSessionMessages(user.id, initialSessionId)
        .then((data) => {
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
          setError(
            err instanceof Error ? err.message : "Failed to load session",
          );
        })
        .finally(() => setLoadingMessages(false));
    } else {
      setMessages([]);
    }
  }, [initialSessionId, initialTitle, user.id]);

  /* ── Send message ── */
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

      // Capture session_id and title from the first message in a new session
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

  /* ── Handle Enter key ── */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ── Format timestamp ── */
  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Chat header with title */}
      <div className="flex items-center shrink-0 pb-3 mb-1">
        <div className="flex items-center gap-2.5 min-w-0">
          {chatTitle ? (
            <>
              <div className="w-8 h-8 rounded-lg bg-[#635BFF]/10 flex items-center justify-center shrink-0">
                <MessageSquare
                  className="w-4 h-4"
                  style={{ color: "#635BFF" }}
                />
              </div>
              <span className="text-sm font-bold text-[#111827] truncate">
                {chatTitle}
              </span>
            </>
          ) : (
            <span className="text-sm font-medium text-[#B0B7C3]">
              New Chat
            </span>
          )}
        </div>
      </div>

      {/* Loading messages indicator */}
      {loadingMessages && (
        <div className="flex items-center justify-center py-4">
          <Loader2
            className="w-5 h-5 animate-spin"
            style={{ color: "#635BFF" }}
          />
        </div>
      )}

      {/* ── Messages area ── */}
      <div className="flex-1 overflow-y-auto px-1 space-y-4 pb-4">
        <AnimatePresence initial={false}>


          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25 }}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {/* Avatar (assistant only) */}
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-xl bg-[#635BFF] flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              )}

              {/* Bubble */}
              <div
                className={`min-w-0 ${
                  msg.role === "user"
                    ? "max-w-[75%] bg-[#635BFF] text-white rounded-2xl rounded-br-md px-4 py-3"
                    : "max-w-[82%] text-[#111827]"
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
                    msg.role === "user"
                      ? "text-white/60"
                      : "text-[#B0B7C3]"
                  }`}
                >
                  {formatTime(msg.timestamp)}
                </span>
              </div>

              {/* Avatar (user only) */}
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-xl bg-[#8B85FF] flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-white" />
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
              exit={{ opacity: 0, y: -8 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-xl bg-[#635BFF] flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#635BFF] animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-[#635BFF] animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-[#635BFF] animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
            >
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-xs font-bold text-red-600 flex-1">{error}</p>
              <button
                onClick={() => setError("")}
                className="text-[10px] font-bold text-red-500 underline shrink-0"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input area ── */}
      <div className="shrink-0 pt-3 border-t border-white/60">
        <div className="neu-inset rounded-2xl px-4 py-2 flex items-center gap-3 focus-within:ring-2 focus-within:ring-[#635BFF]/30 transition-all">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message your CEO agent..."
            disabled={sending}
            className="flex-1 bg-transparent text-sm font-medium text-[#111827] placeholder-[#B0B7C3] outline-none py-1.5 disabled:opacity-50"
            autoFocus
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: input.trim() && !sending ? "#635BFF" : "#E5E7EB",
              color: input.trim() && !sending ? "#fff" : "#9CA3AF",
            }}
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-[10px] text-[#B0B7C3] font-medium text-center mt-2">
          Your CEO agent coordinates strategy and delegates to specialist agents.
        </p>
      </div>
    </div>
  );
}
