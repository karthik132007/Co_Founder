"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, Brain, Code, BarChart3, Wallet, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_BASE_URL, readApiError, fetchMe } from "@/lib/api";
import { parseSessionUser, saveSession, getSession } from "@/lib/session";
import { signInWithGoogle } from "@/lib/supabase";

const ACCENT = "#4f46e5";

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState("");

  // If the user is already signed in (e.g. they were bounced back here after
  // Google OAuth, or restored the page from the back/forward cache), send them
  // to the right place instead of showing the login form again. Resetting
  // googleLoading here also unfreezes the Google button if a previous redirect
  // attempt left it stuck on "Redirecting to Google…".
  useEffect(() => {
    setGoogleLoading(false);

    const existing = getSession();
    if (existing) {
      router.replace(existing.onboardingComplete ? "/dashboard" : "/onboarding");
      return;
    }

    // No local session — check whether the backend set a session cookie at
    // login. If so, restore the session and go straight to the dashboard.
    let cancelled = false;
    (async () => {
      const me = await fetchMe();
      if (cancelled || !me) return;
      const user = parseSessionUser(me);
      if (!user) return;
      saveSession(user, { onboardingComplete: me.onboarding_complete === true });
      router.replace(me.onboarding_complete ? "/dashboard" : "/onboarding");
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setGoogleError("");
    setError("");
    setSuccess("");
    try {
      // Redirects the browser to Google; the user lands back on
      // /auth/callback, which exchanges the code and logs into the app.
      await signInWithGoogle();
      // signInWithGoogle resolves once the redirect is initiated. If the page
      // is still here shortly after, the browser didn't navigate (e.g. the
      // redirect was blocked) — reset the button so the user can retry.
      window.setTimeout(() => setGoogleLoading(false), 3000);
    } catch (err) {
      setGoogleError(err instanceof Error ? err.message : "Google sign-in failed");
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const normalizedEmail = email.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const endpoint = isLogin ? `${API_BASE_URL}/auth/login` : `${API_BASE_URL}/auth/signup`;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      if (!res.ok) {
        throw new Error(await readApiError(res, `${isLogin ? "Login" : "Signup"} failed`));
      }

      const data = (await res.json()) as unknown;
      const user = parseSessionUser(data);

      if (!user) {
        throw new Error("Auth response did not include a valid user session");
      }

      // A returning user may have signed up but never completed onboarding —
      // only the backend knows for sure (based on whether a company exists).
      const onboardingComplete = isLogin
        ? (data as { onboarding_complete?: boolean }).onboarding_complete === true
        : false;
      saveSession(user, { onboardingComplete });
      setSuccess(isLogin ? "Login successful! Redirecting..." : "Account created! Redirecting...");
      setTimeout(() => {
        router.replace(onboardingComplete ? "/dashboard" : "/onboarding");
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fafafa] flex text-[#0a0a0a]">
      {/* ── Left: brand panel ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col relative px-14 py-12 overflow-hidden bg-[#0a0a0a]">
        <div
          className="absolute inset-0 opacity-[0.12] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div className="absolute -bottom-32 -left-24 w-[480px] h-[480px] bg-[#4f46e5]/25 rounded-full blur-[140px] pointer-events-none" />

        <Link href="/" className="flex items-center gap-2.5 relative z-10">
          <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center overflow-hidden">
            <Image src="/icon.png" alt="Co-Founder AI" width={24} height={24} className="w-6 h-6 object-contain" />
          </div>
          <span className="font-semibold text-[15px] tracking-tight text-white">
            Co-Founder<span style={{ color: "#8b85ff" }}> AI</span>
          </span>
          <span className="hidden sm:block font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
            · Agentify your business
          </span>
        </Link>

        <div className="flex-1 flex flex-col justify-center relative z-10 max-w-lg">
          <motion.h1
            key={isLogin ? "login" : "signup"}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-[clamp(2rem,3.4vw,3.1rem)] font-semibold leading-[1.12] tracking-tight text-white"
          >
            {isLogin ? (
              <>Welcome back to your <span className="text-[#8b85ff]">AI founding team.</span></>
            ) : (
              <>Start building. Your <span className="text-[#8b85ff]">AI team</span> is ready.</>
            )}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="mt-5 text-[15px] text-[#a1a1aa] leading-relaxed"
          >
            {isLogin
              ? "Pick up where you left off. Your agents are waiting to execute."
              : "Describe your idea and our multi-agent AI team handles strategy, marketing, finance & dev."}
          </motion.p>

          {/* Agent chips */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24 }}
            className="mt-10 flex flex-wrap gap-2.5"
          >
            {[
              { icon: Brain, label: "CEO Agent" },
              { icon: Code, label: "Developer (soon)" },
              { icon: BarChart3, label: "Marketing" },
              { icon: Wallet, label: "Finance (soon)" },
              { icon: Search, label: "Research" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-3.5 py-2 backdrop-blur-sm"
              >
                <Icon className="w-3.5 h-3.5 text-[#8b85ff]" />
                <span className="text-xs font-medium text-[#d4d4d8]">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        <p className="relative z-10 text-xs text-[#71717a]">
          © 2026 Co-Founder AI — All rights reserved.
        </p>
      </div>

      {/* ── Right: form ── */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-[400px]"
        >
          {/* Mobile logo */}
          <Link href="/" className="flex items-center justify-center gap-2.5 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-lg bg-white border border-[#e5e7eb] flex items-center justify-center overflow-hidden">
              <Image src="/icon.png" alt="Co-Founder AI" width={26} height={26} className="w-7 h-7 object-contain" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-[#0a0a0a]">
              Co-Founder<span style={{ color: ACCENT }}> AI</span>
            </span>
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-[#0a0a0a]">
              {isLogin ? "Welcome back" : "Create your account"}
            </h1>
            <p className="mt-1.5 text-sm text-[#6b7280]">
              {isLogin ? "Log in to continue building." : "Sign up to start building."}
            </p>
          </div>

          {/* Mode toggle */}
          <div className="grid grid-cols-2 gap-1 p-1 mb-7 bg-[#f3f4f6] rounded-xl">
            {(["Log In", "Sign Up"] as const).map((label, i) => {
              const active = isLogin === (i === 0);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => { setIsLogin(i === 0); setError(""); setSuccess(""); setConfirmPassword(""); }}
                  className={`py-2 text-sm font-medium rounded-lg transition-all ${
                    active
                      ? "bg-white text-[#0a0a0a] shadow-sm border border-[#e5e7eb]"
                      : "text-[#6b7280] hover:text-[#0a0a0a]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Messages */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-[13px] font-medium"
              >
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-[13px] font-medium"
              >
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Google sign-in */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-[#374151] bg-white border border-[#e5e7eb] rounded-xl hover:bg-[#fafafa] transition-colors disabled:opacity-60 disabled:cursor-not-allowed mb-5"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/>
                <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/>
              </svg>
            )}
            {googleLoading ? "Redirecting to Google…" : "Continue with Google"}
          </button>

          {googleError && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-[13px] font-medium">
              {googleError}
            </div>
          )}

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-[#e5e7eb]" />
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#9ca3af]">
              or with email
            </span>
            <div className="flex-1 h-px bg-[#e5e7eb]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-[13px] font-medium text-[#374151] mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input px-3.5 py-2.5 text-sm"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="password" className="block text-[13px] font-medium text-[#374151]">
                  Password
                </label>
                {isLogin && (
                  <a href="#" className="text-xs font-medium hover:underline" style={{ color: ACCENT }}>
                    Forgot password?
                  </a>
                )}
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input px-3.5 py-2.5 text-sm"
                placeholder="••••••••"
                minLength={!isLogin ? 8 : undefined}
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
            </div>

            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-[13px] font-medium text-[#374151] mb-1.5">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="input px-3.5 py-2.5 text-sm"
                  placeholder="••••••••"
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-sm mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {isLogin ? "Log in" : "Create account"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-[13px] text-[#9ca3af]">
            <Link href="/" className="hover:text-[#0a0a0a] transition-colors">
              ← Back to home
            </Link>
          </p>
        </motion.div>
      </div>
    </main>
  );
}
