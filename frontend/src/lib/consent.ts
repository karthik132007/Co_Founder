/**
 * Cookie-consent state for Co-Founder AI.
 *
 * Only `analytics` is optional. Everything else the frontend stores
 * (backend httpOnly session cookie, `cofounder.session`, Supabase PKCE
 * session, theme / tour / onboarding flags) is strictly necessary to
 * operate the product and is NOT gated by this consent.
 *
 * The choice itself is stored in localStorage (no cookie footprint) so
 * asking for consent does not create a new tracking cookie.
 */

export const CONSENT_STORAGE_KEY = "cofounder.consent.v1";
export const CONSENT_VERSION = 1;

export const CONSENT_CHANGED_EVENT = "cofounder:consent-change";
export const OPEN_PREFERENCES_EVENT = "cofounder:open-cookie-preferences";

export type ConsentState = {
  version: number;
  /** User has made a choice (Accept All / Reject Optional / Save). */
  decided: boolean;
  /** Optional analytics: Vercel Analytics + Speed Insights. Default off. */
  analytics: boolean;
  decidedAt: string | null;
};

export const DEFAULT_CONSENT: ConsentState = {
  version: CONSENT_VERSION,
  decided: false,
  analytics: false,
  decidedAt: null,
};

function isConsentState(value: unknown): value is ConsentState {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<ConsentState>;
  return (
    v.version === CONSENT_VERSION &&
    typeof v.decided === "boolean" &&
    typeof v.analytics === "boolean"
  );
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function getConsent(): ConsentState {
  if (!canUseStorage()) return DEFAULT_CONSENT;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return DEFAULT_CONSENT;
    const parsed = JSON.parse(raw) as unknown;
    if (isConsentState(parsed)) return parsed;
    return DEFAULT_CONSENT;
  } catch {
    return DEFAULT_CONSENT;
  }
}

export function setConsent(analytics: boolean): ConsentState {
  const next: ConsentState = {
    version: CONSENT_VERSION,
    decided: true,
    analytics,
    decidedAt: new Date().toISOString(),
  };
  if (canUseStorage()) {
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage full/blocked — consent simply won't persist.
    }
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<ConsentState>(CONSENT_CHANGED_EVENT, { detail: next }),
    );
  }
  return next;
}

export function acceptAll(): ConsentState {
  return setConsent(true);
}

export function rejectOptional(): ConsentState {
  return setConsent(false);
}

/** Open the preferences dialog from anywhere (footer, privacy page). */
export function openCookiePreferences(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(OPEN_PREFERENCES_EVENT));
}
