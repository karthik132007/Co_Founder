"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, Brain, Code, BarChart3, Wallet, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_BASE_URL, readApiError } from "@/lib/api";
import { parseSessionUser, saveSession } from "@/lib/session";

const ACCENT = "#4f46e5";

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const endpoint = isLogin ? `${API_BASE_URL}/auth/login` : `${API_BASE_URL}/auth/signup`;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error(await readApiError(res, `${isLogin ? "Login" : "Signup"} failed`));
      }

      const data = (await res.json()) as unknown;
      const user = parseSessionUser(data);

      if (!user) {
        throw new Error("Auth response did not include a valid user session");
      }

      saveSession(user, { onboardingComplete: isLogin });
      setSuccess(isLogin ? "Login successful! Redirecting..." : "Account created! Redirecting...");
      setTimeout(() => {
        router.replace(isLogin ? "/dashboard" : "/onboarding");
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
            <Image src="/logo.png" alt="Cofounder.ai" width={24} height={24} className="w-6 h-6 object-contain" />
          </div>
          <span className="font-semibold text-[15px] tracking-tight text-white">
            Cofounder<span style={{ color: "#8b85ff" }}>.ai</span>
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
          © 2026 Cofounder.ai — All rights reserved.
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
              <Image src="/logo.png" alt="Cofounder.ai" width={26} height={26} className="w-7 h-7 object-contain" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-[#0a0a0a]">
              Cofounder<span style={{ color: ACCENT }}>.ai</span>
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
                  onClick={() => { setIsLogin(i === 0); setError(""); setSuccess(""); }}
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
                minLength={!isLogin ? 6 : undefined}
              />
            </div>

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
