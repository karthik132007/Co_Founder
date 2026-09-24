"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useSyncExternalStore } from "react";
import {
  CONSENT_CHANGED_EVENT,
  CONSENT_STORAGE_KEY,
  getConsent,
} from "@/lib/consent";

function subscribe(callback: () => void): () => void {
  window.addEventListener(CONSENT_CHANGED_EVENT, callback);
  window.addEventListener(CONSENT_STORAGE_KEY, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CONSENT_CHANGED_EVENT, callback);
    window.removeEventListener(CONSENT_STORAGE_KEY, callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot(): string {
  return getConsent().analytics ? "1" : "0";
}

function getServerSnapshot(): string {
  return "0";
}

/**
 * Renders Vercel Analytics + Speed Insights ONLY after the visitor opts
 * in to analytics. Before a choice (or after Reject Optional), nothing
 * loads — no page-view beacons, no performance pings.
 */
export function ConsentAnalytics() {
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  if (snapshot !== "1") return null;
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
