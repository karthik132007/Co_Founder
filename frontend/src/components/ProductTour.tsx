"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, X } from "lucide-react";

const ACCENT = "#143620";
const TOUR_EVENT = "cofounder:start-tour";

type Placement = "auto" | "right" | "left" | "top" | "bottom";

export type TourStep = {
  /** Value of the target element's `data-tour` attribute. */
  target: string;
  title: string;
  body: string;
  /** Page this step lives on — the tour navigates there before highlighting. */
  route?: string;
  placement?: Placement;
};

/**
 * The six things a brand-new founder needs to know. Order matters: it walks
 * down the sidebar, then jumps into a chat for the effort modes.
 */
export const TOUR_STEPS: TourStep[] = [
  {
    target: "new-chat",
    title: "Start with a new chat",
    body: "Everything begins here. Describe what you need in plain language — a strategy, a design, a data question — and your AI co-founder picks the right specialists, does the work, and reports back.",
    placement: "right",
  },
  {
    target: "nav-drive",
    title: "Drive — your company brain",
    body: "Upload PDFs, spreadsheets and documents here. Everything you add becomes searchable knowledge your agents can cite, so their answers are grounded in your real business instead of guesses.",
    placement: "right",
  },
  {
    target: "nav-plugins",
    title: "Plugins — connect your tools",
    body: "Link the apps you already use, like Instagram or Google Ads. Once connected, your agents can read from and act in them — for example publishing a post — and they always ask for your approval first.",
    placement: "right",
  },
  {
    target: "effort",
    route: "/chat",
    title: "Flash, Mid or Max",
    body: "Choose how hard the team should think. Flash answers instantly and is perfect for quick questions. Mid adds a review pass. Max runs the full pipeline with self-reflection for your most important work.",
    placement: "top",
  },
  {
    target: "credits",
    title: "Credits & billing",
    body: "Each task uses a little credit, based on the work done and the models used. Top up whenever you like from Billing & Credits, and keep an eye on your balance right here.",
    placement: "top",
  },
  {
    target: "recent-chats",
    title: "Pick up where you left off",
    body: "Every conversation is saved here with its own context and memory. Click one to continue it, or hover to delete a chat you no longer need.",
    placement: "right",
  },
];

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export default function ProductTour({ storageKey }: { storageKey?: string | number }) {
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const [tipSize, setTipSize] = useState({ w: 344, h: 236 });
  const tipRef = useRef<HTMLDivElement>(null);

  const storageId = `cofounder:tour:v1:${storageKey ?? "guest"}`;
  // Armed by the onboarding flow in sessionStorage, so it only survives the
  // trip from onboarding to the app — logging in later never triggers it.
  const armedId = `cofounder:tour:armed:${storageKey ?? "guest"}`;
  const step = TOUR_STEPS[index];
  const isLast = index === TOUR_STEPS.length - 1;

  const rememberDone = useCallback(() => {
    try {
      window.localStorage.setItem(storageId, "done");
      window.sessionStorage.removeItem(armedId);
    } catch {
      // Private mode / storage disabled — the tour simply reappears next time.
    }
  }, [armedId, storageId]);

  const finish = useCallback(() => {
    setOpen(false);
    rememberDone();
  }, [rememberDone]);

  const next = useCallback(() => {
    if (index >= TOUR_STEPS.length - 1) {
      finish();
      return;
    }
    setIndex(index + 1);
  }, [index, finish]);

  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  // Auto-start ONLY for a founder who just finished onboarding. That flow arms
  // the tour below; a returning user who simply logs in is never armed, so the
  // tour stays available from the profile menu but never interrupts them.
  useEffect(() => {
    if (storageKey === undefined || storageKey === null) return;
    try {
      if (window.sessionStorage.getItem(armedId) !== "1") return;
      if (window.localStorage.getItem(storageId) === "done") return;
    } catch {
      return; // Storage unavailable — never surprise the user with a tour.
    }
    const timer = window.setTimeout(() => {
      setIndex(0);
      setOpen(true);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [armedId, storageId, storageKey]);

  // Allow the profile menu (or anything else) to replay the tour.
  useEffect(() => {
    const replay = () => {
      setIndex(0);
      setOpen(true);
    };
    window.addEventListener(TOUR_EVENT, replay);
    return () => window.removeEventListener(TOUR_EVENT, replay);
  }, []);

  // Some steps live on another page — go there before highlighting.
  useEffect(() => {
    if (!open) return;
    if (step?.route && pathname !== step.route) {
      router.push(step.route);
    }
  }, [open, step, pathname, router]);

  // Locate the target, and keep it in sync while the user scrolls or resizes.
  useEffect(() => {
    if (!open) {
      setRect(null);
      return;
    }
    let cancelled = false;
    let attempts = 0;
    let timer: number | undefined;

    const measure = () => {
      if (cancelled) return;
      const element = document.querySelector<HTMLElement>(
        `[data-tour="${step.target}"]`,
      );
      if (!element) {
        // The page may still be mounting after a route change.
        if (attempts < 40) {
          attempts += 1;
          timer = window.setTimeout(measure, 50);
        } else {
          setRect(null);
        }
        return;
      }
      element.scrollIntoView({ block: "nearest", behavior: "smooth" });
      const box = element.getBoundingClientRect();
      const onScreen =
        box.width > 0 &&
        box.height > 0 &&
        box.right > 0 &&
        box.left < window.innerWidth &&
        box.bottom > 0 &&
        box.top < window.innerHeight;
      // Off-canvas (e.g. the mobile sidebar) → show a centred card instead.
      setRect(onScreen ? box : null);
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    };

    timer = window.setTimeout(measure, 60);
    const onViewportChange = () => measure();
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
    };
  }, [open, index, pathname, step]);

  // Measure the tooltip so it can be placed without covering the target.
  useEffect(() => {
    if (!open) return;
    const element = tipRef.current;
    if (!element) return;
    const box = element.getBoundingClientRect();
    setTipSize((previous) =>
      Math.abs(previous.h - box.height) > 1 || Math.abs(previous.w - box.width) > 1
        ? { w: box.width, h: box.height }
        : previous,
    );
  }, [open, index, rect]);

  // Keyboard: Esc closes, arrows move, Enter advances.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
      else if (event.key === "ArrowRight" || event.key === "Enter") next();
      else if (event.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, finish, next, prev]);

  const gap = 14;
  let tipStyle: React.CSSProperties;
  if (!rect) {
    tipStyle = { top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: tipSize.w };
  } else {
    const vw = viewport.w || 1280;
    const vh = viewport.h || 800;
    const placement = step.placement ?? "auto";
    let left: number;
    let top: number;

    if (placement === "right") {
      left = rect.right + gap;
      top = rect.top;
    } else if (placement === "left") {
      left = rect.left - gap - tipSize.w;
      top = rect.top;
    } else {
      const spaceBelow = vh - rect.bottom;
      const goBelow =
        placement === "bottom" ||
        (placement === "auto" && spaceBelow >= tipSize.h + gap + 24);
      top = goBelow ? rect.bottom + gap : rect.top - gap - tipSize.h;
      left = rect.left;
    }

    tipStyle = {
      top: clamp(top, 16, Math.max(16, vh - tipSize.h - 16)),
      left: clamp(left, 16, Math.max(16, vw - tipSize.w - 16)),
      width: tipSize.w,
    };
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Blocks interaction with the page behind the tour. */}
          <motion.div
            key="tour-blocker"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[rgba(8,16,11,0.55)]"
          />

          {/* Spotlight: a transparent cut-out whose huge shadow dims everything else. */}
          {rect && (
            <div
              key="tour-spotlight"
              className="pointer-events-none fixed z-[101] rounded-2xl ring-2 ring-white/80 transition-all duration-300 ease-out"
              style={{
                top: rect.top - 6,
                left: rect.left - 6,
                width: rect.width + 12,
                height: rect.height + 12,
                boxShadow: "0 0 0 9999px rgba(8,16,11,0.55)",
              }}
            />
          )}

          <motion.div
            key="tour-card"
            ref={tipRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Product tour: ${step.title}`}
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={tipStyle}
            className="fixed z-[102] overflow-hidden rounded-2xl border border-[rgba(15,34,20,0.08)] bg-white shadow-[0_24px_60px_-20px_rgba(15,34,20,0.45)]"
          >
            <div className="flex items-start justify-between gap-3 px-5 pt-4">
              <div className="flex items-center gap-2">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-[12px] font-semibold leading-none text-white"
                  style={{ background: ACCENT }}
                >
                  {index + 1}
                </span>
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8d9d94]">
                  Step {index + 1} of {TOUR_STEPS.length}
                </span>
              </div>
              <button
                type="button"
                onClick={finish}
                aria-label="Close tour"
                className="-mr-1 -mt-1 rounded-lg p-1.5 text-[#8d9d94] transition-colors hover:bg-[rgba(16,36,24,0.05)] hover:text-[#143620]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 pb-4 pt-3">
              <h3 className="text-[15px] font-semibold leading-snug tracking-tight text-[#0f2214]">
                {step.title}
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[#5f6f63]">
                {step.body}
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-[rgba(15,34,20,0.06)] bg-[#fafbf8] px-5 py-3">
              <div className="flex items-center gap-1.5">
                {TOUR_STEPS.map((tourStep, dotIndex) => (
                  <span
                    key={tourStep.target}
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: dotIndex === index ? 18 : 6,
                      background: dotIndex === index ? ACCENT : "#d5dbd3",
                    }}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={prev}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium text-[#5f6f63] transition-colors hover:bg-[rgba(16,36,24,0.05)] hover:text-[#143620]"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back
                  </button>
                )}
                {!isLast && (
                  <button
                    type="button"
                    onClick={finish}
                    className="rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium text-[#8d9d94] transition-colors hover:text-[#5f6f63]"
                  >
                    Skip
                  </button>
                )}
                <button
                  type="button"
                  onClick={next}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12.5px] font-semibold text-white shadow-sm transition-transform active:scale-[0.98]"
                  style={{ background: ACCENT }}
                >
                  {isLast ? "Get started" : "Next"}
                  {!isLast && <ArrowRight className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** Replay the tour from anywhere (used by the profile menu). */
export function startProductTour() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(TOUR_EVENT));
  }
}

/**
 * Called by the onboarding flow once the company is created. Arms the tour so
 * it runs for that founder exactly once — in the current browser session only.
 */
export function armProductTour(userId: string | number) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(`cofounder:tour:armed:${userId}`, "1");
  } catch {
    // Storage disabled — the tour simply won't auto-start.
  }
}
