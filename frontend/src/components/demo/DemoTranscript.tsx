"use client";

import { motion } from "framer-motion";
import {
  MessageSquare,
  User,
  Coins,
  Lock,
  ChevronDown,
  AtSign,
  Check,
  ExternalLink,
  Camera,
} from "lucide-react";
import AgentTimeline from "@/components/AgentTimeline";
import {
  AssistantMessage,
  GeneratedGraphicCard,
  McqCard,
  MessageCopyButton,
} from "@/components/Chat";
import type { Clarification } from "@/lib/api";
import { formatDemoTime, type DemoChat, type DemoInstagramPost } from "./demoChats";

const ACCENT = "#143620";

/* ── Published-post card ── */

function InstagramPostCard({ post }: { post: DemoInstagramPost }) {
  return (
    <a
      href={post.link}
      target="_blank"
      rel="noreferrer"
      className="mt-3 flex items-center gap-3.5 overflow-hidden rounded-2xl border border-[#e8e9e3] bg-white p-3.5 shadow-sm transition-all hover:border-[#E1306C]/40 hover:shadow-md"
    >
      {post.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.image}
          alt="Published Instagram post"
          className="h-16 w-16 shrink-0 rounded-xl border border-[#e8e9e3] object-cover"
        />
      ) : (
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#FEDA75] via-[#E1306C] to-[#833AB4] text-white">
          <Camera className="h-6 w-6" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[#0f2214]">
          <AtSign className="h-3.5 w-3.5 text-[#E1306C]" />
          Live on Instagram
        </span>
        <span className="mt-0.5 block truncate text-[11.5px] text-[#5f6f63]">{post.permalinkLabel}</span>
        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
          <Check className="h-3 w-3" /> Published
        </span>
      </span>
      <ExternalLink className="h-4 w-4 shrink-0 text-[#8d9d94]" />
    </a>
  );
}

/**
 * Read-only replay of one recorded conversation. It reuses the real
 * `AssistantMessage`, `GeneratedGraphicCard`, `McqCard`, `MessageCopyButton`
 * and `AgentTimeline` components, so the rendering is identical to the live
 * chat — only the transport (WebSocket + POST) is absent.
 */
export default function DemoTranscript({ chat }: { chat: DemoChat }) {
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header — same shape as the real chat header */}
      <div className="flex items-center shrink-0 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#eaf0e8] flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4" style={{ color: ACCENT }} />
          </div>
          <span className="text-sm font-semibold text-[#0f2214] truncate">{chat.title}</span>
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-[rgba(20,54,32,0.12)] bg-[rgba(20,54,32,0.06)] px-2 py-0.5 text-[10.5px] font-semibold text-[#143620]">
            Recorded conversation
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-1 pb-4">
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl border border-[rgba(15,34,20,0.07)] bg-white/70 px-4 py-3.5"
          >
            <p className="text-[12.5px] leading-relaxed text-[#5f6f63]">
              <span className="font-semibold text-[#143620]">{chat.subtitle}.</span>{" "}
              {chat.messages.filter((m) => m.role === "user").length} prompts ·{" "}
              {chat.messages.filter((m) => m.role === "assistant").length} agent turns ·{" "}
              {chat.creditsUsed.toFixed(2)} credits · {chat.effort} effort. Every tool call and
              decision below is real product behaviour, replayed read-only.
            </p>
          </motion.div>

          {chat.messages.map((msg) => (
            <div
              key={msg.id}
              data-demo-msg={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`min-w-0 ${
                  msg.role === "user"
                    ? "max-w-[75%] bg-[#0f2214] text-white rounded-[20px] rounded-tr-[4px] px-5 py-3 shadow-md shadow-black/5"
                    : "w-full max-w-[min(100%,860px)] py-1.5"
                }`}
              >
                {msg.role === "assistant" && msg.clarification ? (
                  <McqCard
                    clarification={{
                      question: msg.clarification.question,
                      options: msg.clarification.options,
                      allow_custom: false,
                      answered: msg.clarification.answered,
                    } as Clarification}
                    imageDataUrl={msg.imageDataUrl}
                    onAnswer={() => {}}
                    disabled
                  />
                ) : msg.role === "assistant" && msg.imageDataUrl ? (
                  <GeneratedGraphicCard
                    imageDataUrl={msg.imageDataUrl}
                    content={msg.content}
                    timestamp={msg.timestamp}
                  />
                ) : msg.role === "assistant" ? (
                  <AssistantMessage content={msg.content} />
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>
                )}

                {msg.role === "assistant" && msg.instagramPost && (
                  <InstagramPostCard post={msg.instagramPost} />
                )}

                {msg.role === "assistant" && msg.traceRuns && msg.traceRuns.length > 0 && (
                  <AgentTimeline runs={msg.traceRuns} />
                )}

                <div
                  className={`mt-2 flex items-center gap-2 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <span
                    className={`text-[10px] font-medium ${
                      msg.role === "user" ? "text-white/50" : "text-[#8d9d94]"
                    }`}
                  >
                    {formatDemoTime(msg.timestamp)}
                  </span>
                  {msg.role === "assistant" && (msg.creditsUsed ?? 0) > 0 && (
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-medium text-[#8d9d94]"
                      title="Credits this reply cost"
                    >
                      <span className="text-[#c6d0c9]">·</span>
                      <Coins className="h-3 w-3" />
                      {(msg.creditsUsed ?? 0).toFixed(2)} credits
                    </span>
                  )}
                  {!(msg.imageDataUrl && !msg.clarification) && (
                    <MessageCopyButton
                      content={msg.clarification?.question ?? msg.content}
                      variant={msg.role}
                    />
                  )}
                </div>
              </div>

              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-lg bg-[#e8e9e3] flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-[#5f6f63]" />
                </div>
              )}
            </div>
          ))}

          {/* End of recording */}
          <div className="rounded-2xl border border-[rgba(15,34,20,0.08)] bg-[#f6f8f5] px-4 py-3.5 text-center">
            <p className="text-[12.5px] text-[#5f6f63]">
              End of recorded conversation. Pick another chat from the sidebar, or{" "}
              <a href="/auth" className="font-semibold text-[#143620] underline decoration-[#143620]/30 underline-offset-2 hover:decoration-[#143620]">
                create an account
              </a>{" "}
              to run this on your own products — new accounts get <strong className="font-semibold text-[#143620]">50 free credits</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Input — visually identical, permanently locked */}
      <div className="shrink-0 pt-4 pb-2 relative z-10 before:absolute before:inset-0 before:bg-gradient-to-t before:from-[#fdfcf8] before:via-[#fdfcf8]/90 before:to-transparent before:-z-10 before:pointer-events-none">
        <div className="bg-white border border-[#e8e9e3] rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)]">
          <div className="relative shrink-0">
            <select
              disabled
              value={chat.effort}
              aria-label="Effort (locked in the demo)"
              className="appearance-none bg-[#fdfcf8] border border-[#e8e9e3] rounded-xl pl-3 pr-8 py-2 text-xs font-semibold text-[#2f3e32] cursor-not-allowed opacity-70 outline-none"
            >
              <option value="Flash">Flash</option>
              <option value="Mid">Mid</option>
              <option value="Max">Max</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#8d9d94] pointer-events-none" />
          </div>
          <span className="flex-1 text-[15px] text-[#8d9d94] py-1.5 truncate">
            Message your CEO agent… (read-only in the demo)
          </span>
          <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[#f6f5ef] text-[#8d9d94]">
            <Lock className="w-4 h-4" />
          </span>
        </div>
        <p className="mt-2 text-center text-[11px] text-[#8d9d94]">
          This workspace is a recording of a real Indian Herbs account — nothing you click here is
          sent anywhere.
        </p>
      </div>
    </div>
  );
}
