"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Mobile notice — a one-time heads-up that the product is built for a desktop
 * screen, plus a pointer to the browser's own "Request desktop site" option.
 *
 * Deliberately NOT a layout switcher: forcing a desktop viewport from script
 * rendered badly on phones, so we only warn and let the user ask their browser
 * for the desktop site themselves.
 *
 * Colours are hard-coded on purpose: this renders on EVERY route, including the
 * app shell where the landing's `--color-*` variables are not defined.
 */

const SEEN_KEY = "cofounder:mobile-notice-seen";
const PHONE_WIDTH = "(max-width: 820px)";
const COARSE_POINTER = "(hover: none), (pointer: coarse)";

function isPhone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia(PHONE_WIDTH).matches &&
    window.matchMedia(COARSE_POINTER).matches
  );
}

export function MobileGate() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isPhone()) return;
    try {
      if (window.localStorage.getItem(SEEN_KEY) === "1") return;
    } catch {
      /* storage disabled — just show it */
    }
    const t = window.setTimeout(() => setOpen(true), 650);
    return () => window.clearTimeout(t);
  }, []);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* private mode — the notice shows again next visit */
    }
    setOpen(false);
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[95] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-notice-title"
      aria-describedby="mobile-notice-body"
    >
      <button
        type="button"
        aria-label="Dismiss"
        onClick={dismiss}
        className="absolute inset-0 cursor-default bg-[#08130d]/55 backdrop-blur-[2px]"
      />

      <div
        className="relative w-full max-w-md rounded-t-[28px] bg-white px-5 pt-5 shadow-[0_-24px_70px_rgba(8,19,13,0.35)] sm:m-4 sm:rounded-[28px] sm:px-7 sm:pt-7"
        style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-black/10 sm:hidden" />

        <div className="flex items-start gap-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#eef2ec] text-[#143620]">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
          </span>

          <div className="min-w-0">
            <h2
              id="mobile-notice-title"
              className="text-[17px] font-semibold tracking-[-0.01em] text-[#0f2214]"
            >
              Best viewed on a desktop screen
            </h2>
            <p
              id="mobile-notice-body"
              className="mt-2 text-[13.5px] leading-relaxed text-[#4d5c52]"
            >
              Co-Founder runs live agent dashboards, chat and integrations side
              by side — the full experience is built for a bigger screen. You can
              keep browsing here, but for the real thing open this site on a
              laptop or desktop.
            </p>
          </div>
        </div>

        <p className="mt-5 rounded-2xl bg-[#f4f6f2] px-4 py-3 text-[12.5px] leading-relaxed text-[#4d5c52]">
          Can&apos;t get to a computer right now? Open your browser menu (⋮) and
          choose{" "}
          <span className="font-semibold text-[#0f2214]">
            &ldquo;Request desktop site&rdquo;
          </span>
          .
        </p>

        <button
          type="button"
          onClick={dismiss}
          className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[#0f2214] px-5 py-3.5 text-[14px] font-semibold text-white transition-colors active:bg-[#1a3624]"
        >
          Continue on mobile
        </button>
      </div>
    </div>
  );
}
