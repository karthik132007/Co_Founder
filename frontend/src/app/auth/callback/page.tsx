"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import { API_BASE_URL, readApiError } from "@/lib/api";
import { parseSessionUser, saveSession } from "@/lib/session";

const ACCENT = "#4f46e5";
const WAIT_TIMEOUT_MS = 15_000;
const SESSION_POLL_MS = 300;

/**
 * Wait for the Supabase session after the OAuth redirect.
 *
 * With the PKCE flow the browser lands on /auth/callback?code=… . Creating the
 * client with detectSessionInUrl:true makes getSession() trigger the code
 * exchange, but that is async — so we poll briefly and fall back to waiting
 * for the SIGNED_IN event before giving up.
 */
async function waitForSupabaseSession(): Promise<Session | null> {
  const startedAt = Date.now();

  const tryGetSession = async () => {
    const { data } = await getSupabase().auth.getSession();
    return data.session;
  };

  const session = await tryGetSession();
  if (session) return session;

  return new Promise<Session | null>((resolve) => {
    const { data: subscription } = getSupabase().auth.onAuthStateChange((event, nextSession) => {
      if (event === "SIGNED_IN" && nextSession) {
        subscription.subscription.unsubscribe();
        resolve(nextSession);
      }
    });

    const poll = async () => {
      if (Date.now() - startedAt > WAIT_TIMEOUT_MS) {
        subscription.subscription.unsubscribe();
        resolve(null);
        return;
      }
      const maybeSession = await tryGetSession();
      if (maybeSession) {
        subscription.subscription.unsubscribe();
        resolve(maybeSession);
        return;
      }
      setTimeout(poll, SESSION_POLL_MS);
    };
    setTimeout(poll, SESSION_POLL_MS);
  });
}

/**
 * If Supabase/Google bounce us back with an error (redirect URL not allowed,
 * user denied access, etc.) they append `error` / `error_description` to the
 * callback URL. Surface the real reason instead of a generic stuck spinner.
 */
function getOAuthErrorFromUrl(): string {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  const description = params.get("error_description");
  const error = params.get("error");

  if (description) return decodeURIComponent(description);
  if (error) {
    if (error === "access_denied") return "Google sign-in was cancelled or denied.";
    if (error === "server_error") {
      return (
        "Google sign-in failed on the server. Make sure the Supabase auth " +
        "callback URL is allowed in Google Cloud Console and that this site " +
        "is listed in Supabase's Redirect URLs."
      );
    }
    return `Google sign-in failed (${error}). Please try again.`;
  }
  return "";
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const urlError = getOAuthErrorFromUrl();
        if (urlError) {
          setError(urlError);
          setResolved(true);
          return;
        }

        const session = await waitForSupabaseSession();
        if (cancelled) return;
        if (!session?.access_token) {
          setError(
            "Could not complete Google sign-in. Please try again. If this " +
              "persists, make sure the backend is running and that this site's " +
              "callback URL is allowed in Supabase (Authentication → Redirect URLs).",
          );
          setResolved(true);
          return;
        }

        // Send ONLY the Supabase access token to the backend. The backend
        // verifies it against Supabase Auth and uses the authenticated
        // identity — it never trusts an email/name sent from the browser.
        let res: Response;
        try {
          res = await fetch(`${API_BASE_URL}/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ access_token: session.access_token }),
          });
        } catch {
          throw new Error(
            `Could not reach the server at ${API_BASE_URL}. Make sure the backend is running, then try again.`,
          );
        }

        if (!res.ok) {
          throw new Error(await readApiError(res, "Google sign-in failed"));
        }

        const data = (await res.json()) as unknown;
        const user = parseSessionUser(data);
        if (!user) {
          throw new Error("Auth response did not include a valid user session");
        }

        if (cancelled) return;
        // The backend tells us whether this account has actually completed
        // onboarding (has a company). `is_new` alone is unreliable — a user
        // who signed up but never onboarded would otherwise skip onboarding
        // on their next login.
        const onboardingComplete =
          (data as { onboarding_complete?: boolean }).onboarding_complete === true;
        saveSession(user, { onboardingComplete });

        router.replace(onboardingComplete ? "/dashboard" : "/onboarding");
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Something went wrong");
          setResolved(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="min-h-screen bg-[#fafafa] flex items-center justify-center text-[#0a0a0a]">
      <div className="w-full max-w-sm mx-4 rounded-2xl border border-[#e5e7eb] bg-white p-8 text-center shadow-sm">
        {error ? (
          <>
            <h1 className="text-lg font-semibold tracking-tight">Sign-in failed</h1>
            <p className="mt-2 text-sm text-[#6b7280]">{error}</p>
            <Link
              href="/auth"
              className="mt-6 inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: ACCENT }}
            >
              Back to login
            </Link>
          </>
        ) : !resolved ? (
          <>
            <Loader2 className="mx-auto h-6 w-6 animate-spin" style={{ color: ACCENT }} />
            <h1 className="mt-4 text-lg font-semibold tracking-tight">Completing sign-in…</h1>
            <p className="mt-1.5 text-sm text-[#6b7280]">Verifying your Google account.</p>
          </>
        ) : null}
      </div>
    </main>
  );
}
