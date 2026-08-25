import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase browser client — used ONLY for Google OAuth sign-in and reading
 * the resulting session on /auth/callback.
 *
 * These are PUBLIC, build-time inlined values (Supabase URL + anon key).
 * The service-role key and any OAuth secrets NEVER appear here or anywhere
 * in the frontend — they stay in the backend .env.
 *
 * The client is created lazily (first browser use) so `next build` never
 * fails when the env vars aren't set in a given build environment — the
 * error only surfaces when Google sign-in is actually attempted.
 */
let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase client config. Add NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY to the frontend environment.",
    );
  }

  _supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // PKCE flow: the OAuth callback URL carries a short-lived `code` that
      // the client exchanges for a session — no tokens ever appear in the URL.
      flowType: "pkce",
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return _supabase;
}

/**
 * Fully-qualified URL Supabase should redirect the user back to after Google
 * OAuth. Derived from the current origin (works in dev and prod without
 * hardcoding a domain). Override via NEXT_PUBLIC_AUTH_REDIRECT_URL if the
 * OAuth redirect must point at a fixed public URL.
 */
export function getAuthRedirectUrl(): string {
  const configured = process.env.NEXT_PUBLIC_AUTH_REDIRECT_URL;
  const base = (configured || window.location.origin).replace(/\/+$/, "");
  // Always end at the OAuth callback path. This tolerates a base that points
  // at the site root (e.g. https://get-cofounder.tech) as well as one that
  // already includes /auth/callback.
  if (base.endsWith("/auth/callback")) return base;
  return `${base}/auth/callback`;
}

/**
 * Start Google OAuth sign-in. In the browser this redirects the current tab
 * to Google (via supabase-js), which then redirects back to
 * /auth/callback?code=… (PKCE) after the user authenticates.
 */
export async function signInWithGoogle(): Promise<void> {
  const { error } = await getSupabase().auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getAuthRedirectUrl(),
    },
  });
  if (error) {
    throw new Error(error.message);
  }
}
