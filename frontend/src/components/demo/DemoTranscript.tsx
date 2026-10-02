"use client";

import Link from "next/link";
import {
  MessageSquare,
  Lock,
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
 * and `AgentTimeline` components, with activity tucked away for a calmer replay.
 */
export default function DemoTranscript({ chat }: { chat: DemoChat }) {
  return (
    <div className="mx-auto flex h-[calc(100dvh-7rem)] min-h-[420px] max-w-4xl flex-col sm:h-[calc(100dvh-8rem)] lg:h-[calc(100dvh-9rem)]">
      <div className="shrink-0 border-b border-[#e5e9e2] pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eff3eb]"><MessageSquare className="h-4 w-4" style={{ color: ACCENT }} /></div>
          <div className="min-w-0">
            <h1 className="text-base font-semibold leading-6 text-[#0f2214] sm:text-lg">{chat.title}</h1>
            <p className="mt-1 text-xs leading-5 text-[#718076]">{chat.subtitle}</p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-6 sm:py-8">
        <div className="space-y-8 px-1 sm:space-y-10 sm:px-4">
          {chat.messages.map((msg) => (
            <div
              key={msg.id}
              data-demo-msg={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`min-w-0 ${
                  msg.role === "user"
                    ? "max-w-[90%] rounded-2xl rounded-tr-md bg-[#edf2e8] px-4 py-3 text-[#203926] sm:max-w-[80%] sm:px-5"
                    : "w-full min-w-0 py-1.5"
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
                  <details className="group mt-4 rounded-xl border border-[#e5e9e2] bg-white/60">
                    <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-xs font-medium text-[#718076] hover:text-[#143620] focus-visible:outline-2 focus-visible:outline-[#143620]">
                      <Check className="h-3.5 w-3.5 text-[#53774d]" />
                      {msg.traceRuns.length} completed steps
                      <span className="ml-auto text-[#718076] group-open:hidden">View activity +</span>
                      <span className="ml-auto hidden text-[#718076] group-open:inline">Hide activity −</span>
                    </summary>
                    <div className="px-3 pb-3"><AgentTimeline runs={msg.traceRuns} /></div>
                  </details>
                )}

                <div
                  className={`mt-2 flex items-center gap-2 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <span
                    className={`text-[10px] font-medium ${
                      msg.role === "user" ? "text-[#718076]" : "text-[#8d9d94]"
                    }`}
                  >
                    {formatDemoTime(msg.timestamp)}
                  </span>
                  {!(msg.imageDataUrl && !msg.clarification) && (
                    <MessageCopyButton
                      content={msg.clarification?.question ?? msg.content}
                      variant="assistant"
                    />
                  )}
                </div>
              </div>


            </div>
          ))}

          <div className="border-t border-[#e5e9e2] py-6 text-center">
            <p className="text-xs text-[#718076]">You’re all caught up.</p>
            <Link href="/demo/chat" className="mt-2 inline-block text-xs font-medium text-[#143620] underline underline-offset-4">Explore another conversation</Link>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[#e5e9e2] py-4">
        <span className="flex items-center gap-2 text-xs text-[#718076]"><Lock className="h-3.5 w-3.5 shrink-0" /> Recorded conversation</span>
        <Link href="/auth" className="rounded-lg bg-[#143620] px-4 py-2.5 text-xs font-medium text-white transition-colors hover:bg-[#244d30]">Try it yourself</Link>
      </div>
    </div>
  );
}
