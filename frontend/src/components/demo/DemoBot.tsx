"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Pause, Play, X, Bot, Volume2, VolumeX, Coins } from "lucide-react";
import { getDemoChat, type DemoChat } from "./demoChats";
import { sproutClip, type SproutVoiceKey } from "./sproutVoice";

const ACCENT = "#143620";

/** Clips that aren't uploaded yet — probed once, then skipped (no retries, no noise). */
const MISSING_CLIPS = new Set<string>();
/** After a few misses we assume the voice-over pack isn't installed for this session. */
let VOICE_PROBE_FAILURES = 0;
/** Once any clip has played, a half-recorded pack must keep working. */
let VOICE_EVER_PLAYED = false;
let VOICE_UNAVAILABLE = false;

type BotStep = {
  title: string;
  text: string;
  scrollTo?: string;
  dwell?: number;
  cta?: { label: string; href: string; note?: string };
  /** Which voice-over line Sprout speaks on this step. */
  voice?: SproutVoiceKey;
};

/** Roaming slots inside the content column — the bot hops between them. */
const ROAM = [
  { left: "17%", top: "54%" },
  { left: "22%", top: "28%" },
  { left: "30%", top: "20%" },
  { left: "19%", top: "40%" },
  { left: "26%", top: "62%" },
  { left: "24%", top: "32%" },
  { left: "32%", top: "46%" },
  { left: "20%", top: "22%" },
];

const HOME_STEPS: BotStep[] = [
  {
    title: "Hi, I'm Sprout 👋",
    text: "I'll show you around in about a minute. This is a real Indian Herbs workspace — six recorded conversations, replayed exactly as they happened. Nothing here is editable.",
    voice: "home-1",
  },
  {
    title: "One prompt, a whole team",
    text: "Co-Founder AI is a single CEO agent that plans the work and delegates to five specialists: Researcher, Writer, CMO, Data Analyst and Graphic Designer. You only ever talk to the CEO.",
    voice: "home-2",
  },
  {
    title: "This is your workspace",
    text: "Overview, Chat, Drive and Plugins on the left. Every conversation lands in Recent Chats with the credits it cost — 1 credit = ₹1, so you always know what a task is worth.",
    voice: "home-3",
  },
  {
    title: "Your tools are already connected",
    text: "Instagram, Gmail, Sheets, Drive and Calendar are connected to the company once. That's how a chat can end with a published post, a drafted email or a booked meeting.",
    voice: "home-4",
  },
  {
    title: "Six real use cases",
    text: "1. Instagram launch → live post. 2. Inbox triage → threaded reply. 3. Q3 sales → executive brief. 4. Competitor research → pricing memo. 5. Returns spike → packaging fix. 6. Diwali campaign → calendar, sheet and drafts. Open any of them from the sidebar.",
    dwell: 10_000,
    voice: "home-5",
  },
  {
    title: "How to read a chat",
    text: "'Thought process' is the agent reasoning. 'Agent activity' is every tool call with its real input and output. The bordered cards are decisions it stopped to ask the founder for — it never publishes, uploads or books anything without approval.",
    voice: "home-6",
  },
  {
    title: "That's the tour",
    text: "Open one of the six conversations to see the team at work, or hit Plugins to see how much of your stack is already wired in.",
    cta: {
      label: "Create your own workspace",
      href: "/auth",
      note: "Free to start — 50 credits land in your workspace right after signup.",
    },
    voice: "home-7",
  },
];

const CHAT_INDEX_STEPS: BotStep[] = [
  {
    title: "Pick a use case",
    text: "These six are real workflows from the Indian Herbs account. Each one opens as a full read-only replay — reasoning, tool calls, approvals and the end result.",
    voice: "chats-1",
  },
  {
    title: "The composer is locked",
    text: "You can't type here — the value is in watching what the agent actually does with a messy, real request. Start with the vitamin C launch — it's the most visual.",
    voice: "chats-2",
  },
  {
    title: "Start here",
    text: "Idea → on-brand creative → your approval → a live Instagram post, in one conversation.",
    cta: { label: "Open the Instagram launch", href: "/demo/chat/vitamin-c-instagram-launch" },
    voice: "chats-3",
  },
];

const PLUGINS_STEPS: BotStep[] = [
  {
    title: "Everything is connected",
    text: "All eight connectors are live in this workspace. Instagram, Gmail, Sheets, Drive and Calendar do the heavy lifting in the six use cases — Ads, Notion and Shopify are hooked up too.",
    voice: "plugins-1",
  },
  {
    title: "Connect once, then just ask",
    text: "You authorise a tool one time with OAuth. After that the agents call it directly — and every irreversible action (publishing, uploading, booking) stops for your approval first.",
    voice: "plugins-2",
  },
  {
    title: "See it in the open",
    text: "Open any chat and expand 'Agent activity' — each row is a real tool call with its arguments, result and duration. That's the receipts.",
    cta: { label: "Back to the conversations", href: "/demo/chat" },
    voice: "plugins-3",
  },
];

const DRIVE_STEPS: BotStep[] = [
  {
    title: "Everything the team makes lands here",
    text: "Briefs, spreadsheets, creatives and your logo. Files the agents produced are badged 'AI Graphic'; your logo is marked as the company logo.",
    voice: "drive-1",
  },
  {
    title: "Your own data drives the answers",
    text: "The Q3 order export, the returns sheet and the brand guide are what the agents read. Every claim in a chat is traceable back to a file here.",
    voice: "drive-2",
  },
  {
    title: "Read-only in the demo",
    text: "Previewing and uploading are switched off for the tour. In your own workspace the Drive is fully yours — the same folder the agents write into.",
    cta: {
      label: "Create an account",
      href: "/auth",
      note: "Free to start — 50 credits land in your workspace right after signup.",
    },
    voice: "drive-3",
  },
];

/** Chat id → voice-clip slug (see `sproutVoice.ts`). */
const VOICE_SLUG: Record<string, string> = {
  "vitamin-c-instagram-launch": "instagram",
  "inbox-briefing-reply": "inbox",
  "q3-sales-teardown": "sales",
  "competitor-pricing-research": "pricing",
  "returns-spike-root-cause": "returns",
  "diwali-campaign-plan": "diwali",
};

function buildChatSteps(chat: DemoChat): BotStep[] {
  const firstAssistant = chat.messages.find((m) => m.role === "assistant");
  const busiestAssistant =
    chat.messages
      .filter((m) => m.role === "assistant" && m.traceRuns?.length)
      .sort((a, b) => (b.traceRuns?.length ?? 0) - (a.traceRuns?.length ?? 0))[0] ??
    firstAssistant;
  const decision = chat.messages.find((m) => m.clarification) ?? busiestAssistant;
  const last = chat.messages[chat.messages.length - 1];
  const slug = VOICE_SLUG[chat.id];
  const voice = (n: 1 | 2 | 3 | 4): SproutVoiceKey | undefined =>
    slug ? (`chat-${slug}-${n}` as SproutVoiceKey) : undefined;

  return [
    {
      title: "What the user asked",
      text: chat.guide.brief,
      scrollTo: chat.messages[0]?.id,
      dwell: 8000,
      voice: voice(1),
    },
    {
      title: "Who worked on it",
      text: chat.guide.team,
      scrollTo: firstAssistant?.id,
      dwell: 8000,
      voice: voice(2),
    },
    {
      title: "Watch this moment",
      text: chat.guide.watch,
      scrollTo: decision?.id,
      dwell: 8000,
      voice: voice(3),
    },
    {
      title: "The payoff",
      text: chat.guide.payoff,
      scrollTo: last?.id,
      dwell: 8000,
      voice: voice(4),
    },
    {
      title: "One of six use cases",
      text: "Use the sidebar to open the next one, or create an account to point this team at your own files, inbox, calendar and Instagram.",
      cta: {
        label: "Run it on my business",
        href: "/auth",
        note: "Free to start — 50 credits land in your workspace right after signup.",
      },
      voice: "chat-outro",
    },
  ];
}

function stepsFor(pathname: string): BotStep[] {
  if (pathname === "/demo") return HOME_STEPS;
  if (pathname === "/demo/chat") return CHAT_INDEX_STEPS;
  if (pathname === "/demo/plugins") return PLUGINS_STEPS;
  if (pathname === "/demo/drive") return DRIVE_STEPS;
  if (pathname.startsWith("/demo/chat/")) {
    const chat = getDemoChat(pathname.slice("/demo/chat/".length));
    if (chat) return buildChatSteps(chat);
  }
  return [];
}

/**
 * "Sprout" — the roaming guide bot.
 *
 * The artwork points up-and-right, so the speech bubble is always rendered to
 * the bot's upper right: the extended index finger lands on the bubble.
 * It walks every /demo page, explains the platform and each use case, stays
 * out of the way of interactions (the layer ignores pointer events) and can be
 * dismissed at any time.
 */
export default function DemoBot() {
  const pathname = usePathname();
  const steps = useMemo(() => stepsFor(pathname), [pathname]);

  const [route, setRoute] = useState(pathname);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [hovered, setHovered] = useState(false);

  // Restart the tour when the visitor moves to another demo page. Adjusting
  // state during render (instead of in an effect) is the React-recommended way
  // to reset derived state on a prop/route change. `dismissed` is reset too, so
  // Sprout introduces himself again on every page instead of waiting to be
  // re-invited (hiding him only silences the current page).
  if (route !== pathname) {
    setRoute(pathname);
    setIndex(0);
    setPlaying(true);
    setDismissed(false);
  }

  const step = steps[index] ?? steps[0];
  const isLast = index >= steps.length - 1;
  const pos = ROAM[index % ROAM.length];

  /* ── Sprout's voice ─────────────────────────────────────────────────────
     One <audio> element, re-pointed at the clip for the current step. Clips
     live in `/voice/sprout`; a clip that isn't uploaded yet is probed once and
     then skipped silently, so the tour works with or without the audio. */
  const [voiceOn, setVoiceOn] = useState(true);
  const [voiceBlocked, setVoiceBlocked] = useState(false);
  const [voiceAvailable, setVoiceAvailable] = useState(!VOICE_UNAVAILABLE);
  const [clipSeconds, setClipSeconds] = useState<number | null>(null);
  const [unlockNonce, setUnlockNonce] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const voiceKey = step?.voice;

  /** Remember that the clip pack isn't installed, so nothing else is probed. */
  const markClipMissing = (src: string) => {
    MISSING_CLIPS.add(src);
    VOICE_PROBE_FAILURES += 1;
    if (VOICE_PROBE_FAILURES >= 3 && !VOICE_EVER_PLAYED) {
      VOICE_UNAVAILABLE = true;
      setVoiceAvailable(false);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !voiceOn || !voiceKey || VOICE_UNAVAILABLE) return;
    const src = sproutClip(voiceKey);
    if (MISSING_CLIPS.has(src)) return;

    let cancelled = false;
    void (async () => {
      await audio.pause();
      if (cancelled) return;
      setClipSeconds(null);
      try {
        const res = await fetch(src, { method: "GET", cache: "no-store" });
        if (cancelled) return;
        if (!res.ok) {
          markClipMissing(src);
          return;
        }
      } catch {
        markClipMissing(src);
        return;
      }
      if (cancelled) return;
      audio.src = src;
      audio.currentTime = 0;
      const attempt = audio.play();
      if (!attempt) return;
      attempt
        .then(() => {
          VOICE_EVER_PLAYED = true;
          setVoiceBlocked(false);
        })
        .catch((error: unknown) => {
          // Browser autoplay policy needs one gesture; a broken file stays silent.
          if (error instanceof DOMException && error.name === "NotAllowedError") {
            setVoiceBlocked(true);
          }
        });
    })();

    return () => {
      cancelled = true;
      audio.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceOn, voiceKey, unlockNonce, dismissed, voiceAvailable]);

  // One tap or keypress anywhere unblocks autoplay, then Sprout carries on.
  useEffect(() => {
    if (!voiceBlocked) return;
    const unlock = () => setUnlockNonce((n) => n + 1);
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [voiceBlocked]);

  // Never leave a line talking once the guide is gone.
  useEffect(
    () => () => {
      audioRef.current?.pause();
    },
    [],
  );

  // A spoken line gets time to finish before the bubble moves on.
  const baseDwell = step?.dwell ?? 7_000;
  const dwell =
    voiceOn && clipSeconds ? Math.max(baseDwell, clipSeconds * 1000 + 1_600) : baseDwell;

  // Auto-advance, pausing while the visitor reads or hovers.
  useEffect(() => {
    if (!playing || dismissed || hovered || !steps.length) return;
    const timer = window.setTimeout(() => {
      setIndex((current) => {
        if (current + 1 < steps.length) return current + 1;
        setPlaying(false);
        return current;
      });
    }, dwell);
    return () => window.clearTimeout(timer);
  }, [playing, dismissed, hovered, index, steps, dwell]);

  // Walk the transcript to the message the step is talking about.
  useEffect(() => {
    const target = steps[index]?.scrollTo;
    if (!target) return;
    const el = document.querySelector(`[data-demo-msg="${target}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [index, steps]);

  if (!steps.length) return null;

  if (dismissed) {
    return (
      <button
        type="button"
        onClick={() => {
          setDismissed(false);
          setIndex(0);
          setPlaying(true);
        }}
        className="fixed bottom-5 left-4 z-40 inline-flex items-center gap-2 rounded-full border border-[rgba(15,34,20,0.1)] bg-white/95 py-1.5 pl-1.5 pr-3.5 text-[12.5px] font-semibold text-[#143620] shadow-[0_10px_28px_-12px_rgba(15,34,20,0.35)] backdrop-blur transition-transform hover:-translate-y-0.5 lg:left-[280px]"
      >
        <Image
          src="/bot_pointing_right.png"
          alt=""
          width={246}
          height={255}
          className="h-7 w-auto rounded-full bg-[#f4f7f2] object-contain"
        />
        Show guide
      </button>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 left-0 top-0 z-40 lg:left-[264px]">
      <audio
        ref={audioRef}
        preload="auto"
        onLoadedMetadata={(e) => {
          if (!voiceKey) return;
          if (!e.currentTarget.src.endsWith(sproutClip(voiceKey))) return;
          const seconds = e.currentTarget.duration;
          setClipSeconds(Number.isFinite(seconds) ? seconds : null);
        }}
        className="hidden"
      />
      {/* Remounted per route: the CSS `.sprout-pop` animation replays, so Sprout
          introduces himself on every page without being invited. */}
      <motion.div
        key={pathname}
        animate={{ left: pos.left, top: pos.top }}
        transition={{ type: "spring", stiffness: 42, damping: 16, mass: 0.9 }}
        className="sprout-pop absolute"
      >
        <motion.div
          animate={{ y: [0, -7, 0] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
          className="flex items-start"
        >
          {/* The bot — its finger points up-right, at the bubble */}
          <span className="relative shrink-0">
            <span
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 h-[74px] w-[74px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl sm:h-[132px] sm:w-[132px]"
              style={{ background: "radial-gradient(circle, rgba(124,201,154,0.42) 0%, rgba(124,201,154,0) 70%)" }}
            />
            <Image
              src="/bot_pointing_right.png"
              alt="Demo guide"
              width={246}
              height={255}
              priority
              className="relative h-[72px] w-auto select-none drop-shadow-[0_12px_18px_rgba(15,34,20,0.18)] sm:h-[124px]"
            />
          </span>

          {/* Speech bubble, anchored at the fingertip height */}
          <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="pointer-events-auto relative mt-[20px] -ml-2 w-[min(268px,58vw)] sm:mt-[32px] sm:w-[330px]"
          >
            {/* tail — points back at the fingertip */}
            <span className="absolute -left-1 top-3 h-2.5 w-2.5 rotate-45 bg-white/95 shadow-[-2px_2px_6px_rgba(15,34,20,0.06)] sm:top-4" />

            <div className="relative overflow-hidden rounded-2xl border border-[rgba(15,34,20,0.09)] bg-white/95 p-3.5 shadow-[0_18px_40px_-18px_rgba(15,34,20,0.35)] backdrop-blur-md sm:p-4">
              <motion.div
                key={`${pathname}-${index}`}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(20,54,32,0.07)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#143620]">
                    <Bot className="h-3 w-3" />
                    Sprout
                  </span>
                  <span className="text-[10.5px] font-medium text-[#8d9d94]">
                    {index + 1} / {steps.length}
                  </span>
                  {hovered && playing && (
                    <span className="text-[10.5px] font-medium text-[#8d9d94]">paused</span>
                  )}
                  {voiceAvailable && (
                    <button
                      type="button"
                      onClick={() => setVoiceOn((v) => !v)}
                      aria-label={voiceOn ? "Mute the guide's voice" : "Unmute the guide's voice"}
                      title={voiceOn ? "Mute the guide's voice" : "Unmute the guide's voice"}
                      className="ml-auto -mr-1 -mt-1 flex h-6 w-6 items-center justify-center rounded-md text-[#8d9d94] transition-colors hover:bg-[rgba(16,36,24,0.05)] hover:text-[#143620]"
                    >
                      {voiceOn ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDismissed(true)}
                    aria-label="Hide the guide"
                    title="Hide the guide"
                    className={`${voiceAvailable ? "" : "ml-auto"} -mr-1 -mt-1 flex h-6 w-6 items-center justify-center rounded-md text-[#8d9d94] transition-colors hover:bg-[rgba(16,36,24,0.05)] hover:text-[#143620]`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <p className="mt-2 text-[13px] font-semibold leading-snug text-[#0f2214]">
                  {step?.title}
                </p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-[#4b5b4f]">{step?.text}</p>

                {step?.cta && (
                  <div className="mt-2.5">
                    <Link
                      href={step.cta.href}
                      className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#143620] underline decoration-[#143620]/30 underline-offset-2 hover:decoration-[#143620]"
                    >
                      {step.cta.label}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                    {step.cta.note && (
                      <p className="mt-1.5 inline-flex items-start gap-1.5 rounded-lg bg-[rgba(20,54,32,0.06)] px-2.5 py-1.5 text-[11.5px] font-medium leading-snug text-[#143620]">
                        <Coins className="mt-px h-3.5 w-3.5 shrink-0" />
                        {step.cta.note}
                      </p>
                    )}
                  </div>
                )}

                {voiceOn && voiceAvailable && voiceBlocked && (
                  <p className="mt-2 text-[11px] font-medium text-[#8f6a1f]">
                    Tap anywhere once so I can speak.
                  </p>
                )}
              </motion.div>

              {/* Controls */}
              <div className="mt-3 flex items-center gap-1 border-t border-[rgba(15,34,20,0.06)] pt-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIndex((i) => Math.max(0, i - 1));
                    setPlaying(false);
                  }}
                  disabled={index === 0}
                  aria-label="Previous tip"
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-[rgba(15,34,20,0.08)] bg-white text-[#5f6f63] transition-colors hover:text-[#143620] disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setPlaying((p) => !p)}
                  aria-label={playing ? "Pause the tour" : "Play the tour"}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-[rgba(15,34,20,0.08)] bg-white text-[#5f6f63] transition-colors hover:text-[#143620]"
                >
                  {playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                </button>

                <div className="mx-1 flex flex-1 items-center gap-1">
                  {steps.map((s, i) => (
                    <button
                      key={s.title}
                      type="button"
                      onClick={() => {
                        setIndex(i);
                        setPlaying(false);
                      }}
                      aria-label={`Tip ${i + 1}`}
                      className="h-1.5 flex-1 rounded-full transition-colors"
                      style={{
                        background: i === index ? ACCENT : "rgba(15,34,20,0.12)",
                      }}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (isLast) {
                      setDismissed(true);
                      setPlaying(false);
                      return;
                    }
                    setIndex((i) => i + 1);
                    setPlaying(false);
                  }}
                  className="inline-flex h-7 items-center gap-1 rounded-lg bg-[#143620] px-2.5 text-[11.5px] font-semibold text-white transition-colors hover:bg-[#1a4a2b]"
                >
                  {isLast ? "Done" : "Next"}
                  {!isLast && <ChevronRight className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
