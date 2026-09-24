"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  OPEN_PREFERENCES_EVENT,
  acceptAll,
  getConsent,
  rejectOptional,
  setConsent,
} from "@/lib/consent";

/**
 * Cookie consent banner + preferences dialog.
 * - Banner appears only when the visitor has not made a choice yet.
 * - Essential storage/cookies always stay on; only analytics is optional.
 * - Vercel Analytics / Speed Insights render only after opt-in (see
 *   ConsentAnalytics); this component never loads tracking itself.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  // Deferred read: state updates happen inside the timeout callback so the
  // first paint (SSR + hydration) is always the no-banner state.
  useEffect(() => {
    const t = window.setTimeout(() => {
      const consent = getConsent();
      setAnalytics(consent.analytics);
      if (!consent.decided) setVisible(true);
    }, 600);
    return () => window.clearTimeout(t);
  }, []);

  const openPrefs = useCallback(() => {
    lastFocused.current = document.activeElement as HTMLElement | null;
    setAnalytics(getConsent().analytics);
    setPrefsOpen(true);
    setVisible(true);
  }, []);

  useEffect(() => {
    window.addEventListener(OPEN_PREFERENCES_EVENT, openPrefs);
    return () => window.removeEventListener(OPEN_PREFERENCES_EVENT, openPrefs);
  }, [openPrefs]);

  useEffect(() => {
    if (prefsOpen) {
      dialogRef.current
        ?.querySelector<HTMLButtonElement>("button[data-autofocus]")
        ?.focus();
    } else if (lastFocused.current) {
      lastFocused.current.focus?.();
    }
  }, [prefsOpen]);

  if (!visible) return null;

  const handleAccept = () => {
    acceptAll();
    setPrefsOpen(false);
    setVisible(false);
  };

  const handleReject = () => {
    rejectOptional();
    setPrefsOpen(false);
    setVisible(false);
  };

  const handleSave = () => {
    setConsent(analytics);
    setPrefsOpen(false);
    setVisible(false);
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[90] px-4 pb-4 sm:px-6 sm:pb-6"
      role="region"
      aria-label="Cookie consent"
    >
      {!prefsOpen ? (
        <div className="card mx-auto flex max-w-2xl flex-col gap-4 p-5 shadow-[0_16px_48px_-12px_rgba(15,34,20,0.28)] sm:p-6">
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#143620] text-lg text-white"
            >
              🍪
            </span>
            <div>
              <p className="text-[15px] font-semibold text-[#0f2214]">
                We use only what Co-Founder needs
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-[#5f6f63]">
                Essential sign-in and product storage is always on. Optional
                analytics (Vercel Analytics + Speed Insights) load only if you
                accept. See our{" "}
                <Link
                  href="/cookies"
                  className="underline underline-offset-2 hover:text-[#0f2214]"
                >
                  Cookie Policy
                </Link>
                .
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={handleAccept}
              className="btn-primary flex-1 px-4 py-2.5 text-sm"
            >
              Accept all
            </button>
            <button
              type="button"
              onClick={handleReject}
              className="flex-1 rounded-[0.625rem] border border-[rgba(15,34,20,0.16)] px-4 py-2.5 text-sm font-semibold text-[#0f2214] transition hover:bg-[rgba(16,36,24,0.05)]"
            >
              Reject optional
            </button>
            <button
              type="button"
              onClick={() => setPrefsOpen(true)}
              className="btn-ghost flex-1 px-4 py-2.5 text-sm"
              aria-haspopup="dialog"
            >
              Manage preferences
            </button>
          </div>
        </div>
      ) : (
        <div
          className="fixed inset-0 z-[95] flex items-end justify-center bg-[rgba(5,10,7,0.45)] p-4 sm:items-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPrefsOpen(false);
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-prefs-title"
            className="card w-full max-w-lg p-6"
              onKeyDown={(e) => {
                if (e.key === "Escape") setPrefsOpen(false);
              }}
          >
            <h2
              id="cookie-prefs-title"
              className="text-lg font-semibold text-[#0f2214]"
            >
              Cookie preferences
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-[#5f6f63]">
              Essential cookies and storage keep you signed in and remember
              product settings. Optional analytics help us understand aggregate
              usage and are off until you allow them.
            </p>

            <div className="mt-4 space-y-3">
              <div className="flex items-start justify-between gap-4 rounded-xl border border-[rgba(15,34,20,0.08)] p-4">
                <div>
                  <p className="text-sm font-semibold text-[#0f2214]">
                    Essential
                  </p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-[#5f6f63]">
                    Sign-in session cookie, account/workspace data, theme and
                    tour settings. Always on — the app cannot work without
                    these.
                  </p>
                </div>
                <span
                  className="shrink-0 rounded-full bg-[rgba(20,54,32,0.08)] px-3 py-1 text-xs font-semibold text-[#143620]"
                  aria-label="Essential cookies always on"
                >
                  Always on
                </span>
              </div>

              <div className="flex items-start justify-between gap-4 rounded-xl border border-[rgba(15,34,20,0.08)] p-4">
                <div>
                  <p className="text-sm font-semibold text-[#0f2214]">
                    Analytics
                  </p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-[#5f6f63]">
                    Vercel Analytics + Speed Insights (aggregate page views and
                    performance). No advertising cookies. Loads only with your
                    consent.
                  </p>
                </div>
                <button
                  type="button"
                  data-autofocus
                  role="switch"
                  aria-checked={analytics}
                  aria-label="Optional analytics"
                  onClick={() => setAnalytics((v) => !v)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                    analytics ? "bg-[#143620]" : "bg-[#c2c9c0]"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                      analytics ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleSave}
                className="btn-primary flex-1 px-4 py-2.5 text-sm"
              >
                Save choices
              </button>
              <button
                type="button"
                onClick={handleAccept}
                className="flex-1 rounded-[0.625rem] border border-[rgba(15,34,20,0.16)] px-4 py-2.5 text-sm font-semibold text-[#0f2214] transition hover:bg-[rgba(16,36,24,0.05)]"
              >
                Accept all
              </button>
              <button
                type="button"
                onClick={handleReject}
                className="btn-ghost flex-1 px-4 py-2.5 text-sm"
              >
                Reject optional
              </button>
            </div>
            <p className="mt-3 text-center text-[12px] text-[#5f6f63]">
              Read the{" "}
              <Link
                href="/cookies"
                className="underline underline-offset-2 hover:text-[#0f2214]"
              >
                Cookie Policy
              </Link>{" "}
              · change your mind anytime via “Cookie settings”.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
