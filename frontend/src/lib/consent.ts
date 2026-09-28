/**
 * Cookie consent state (analytics only — necessary storage is always on).
 *
 * Persisted in localStorage under `cofounder-consent` as
 * `{ analytics: boolean, decidedAt: string }`. Every reader must tolerate a
 * missing/disabled storage and treat "unknown" as "rejected" (fail closed:
 * analytics never load before an explicit accept).
 */

export type ConsentChoice = "accepted" | "rejected";

const STORAGE_KEY = "cofounder-consent";

/** Broadcast when the user makes or changes a choice (banner + analytics listen). */
export const CONSENT_EVENT = "cofounder:consent-updated";

function readStored(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null && "analytics" in parsed) {
      return (parsed as { analytics: unknown }).analytics === true ? "accepted" : "rejected";
    }
    return null;
  } catch {
    return null;
  }
}

/** Current choice, or null when the user has not decided yet (or storage is unavailable). */
export function getConsent(): ConsentChoice | null {
  return readStored();
}

/** Persist a choice and notify listeners. Never throws (storage may be disabled). */
export function setConsent(choice: ConsentChoice): void {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ analytics: choice === "accepted", decidedAt: new Date().toISOString() }),
    );
  } catch {
    // Choice still applies to this page view via the event below.
  }
  try {
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: choice }));
  } catch {
    // Non-DOM environment; listeners simply never fire.
  }
}
