"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Loader2,
  Sparkles,
  User,
  AlertCircle,
} from "lucide-react";
import { sendChatMessage } from "@/lib/api";
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

/* ─────────────────────────────────────────────
   Chat Component
   ───────────────────────────────────────────── */

export default function Chat({ user }: { user: SessionUser }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ── Auto-scroll to bottom ── */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

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
      const response = await sendChatMessage(user.id, trimmed);

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
  }, [input, sending, user.id]);

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
      {/* ── Messages area ── */}
      <div className="flex-1 overflow-y-auto px-1 space-y-4 pb-4">
        <AnimatePresence initial={false}>
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full text-center py-12"
            >
              <div className="w-16 h-16 neu-circle rounded-full flex items-center justify-center mb-5">
                <Sparkles className="w-7 h-7" style={{ color: "#635BFF" }} />
              </div>
              <h3 className="text-lg font-bold text-[#111827] mb-2">
                Ask your CEO Agent
              </h3>
              <p className="text-sm text-[#6B7280] font-medium max-w-md leading-relaxed">
                Your AI CEO coordinates strategy, delegates tasks to specialist
                agents, and helps you make decisions that align with your
                business goals.
              </p>

              {/* Quick prompts */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg">
                {[
                  "What should my next steps be?",
                  "Analyze my business strategy",
                  "Help me plan a marketing campaign",
                  "What research should I prioritize?",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => {
                      setInput(prompt);
                      inputRef.current?.focus();
                    }}
                    className="neu-inset rounded-xl px-4 py-2.5 text-left text-xs font-medium text-[#6B7280] hover:text-[#111827] hover:ring-2 hover:ring-[#635BFF]/20 transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

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
                className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-[#635BFF] text-white rounded-br-md"
                    : "neu-card text-[#111827] rounded-bl-md"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {msg.content}
                </p>
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
              <div className="neu-card rounded-2xl rounded-bl-md px-5 py-3.5 flex items-center gap-1.5">
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
