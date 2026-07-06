"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Brain, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_BASE_URL, readApiError } from "@/lib/api";
import { parseSessionUser, saveSession } from "@/lib/session";

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
        headers: {
          "Content-Type": "application/json",
        },
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
      setSuccess(isLogin ? "Login successful! Redirecting..." : "Account created successfully! Redirecting...");
      setTimeout(() => {
        router.replace(isLogin ? "/dashboard" : "/onboarding");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8faff] flex text-[#111827]" style={{ fontFamily: "SF Mono, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace" }}>
      
      {/* Left Column — Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col relative px-12 py-10 overflow-hidden">
        
        {/* Ambient orbs */}
        <div className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] bg-[#635BFF]/[0.05] rounded-full blur-[180px] pointer-events-none" />
        <div className="absolute -bottom-[10%] right-[0%] w-[40vw] h-[40vw] bg-[#8B85FF]/[0.04] rounded-full blur-[150px] pointer-events-none" />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 z-10 group shrink-0">
          <div className="w-10 h-10 neu-circle rounded-full flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden">
            <Image src="/logo.png" alt="Logo" width={32} height={32} className="w-8 h-8 object-contain" />
          </div>
          <span className="font-bold text-xl tracking-tight text-[#111827]">
            Cofounder<span style={{ color: "#635BFF" }}>.ai</span>
          </span>
        </Link>

        {/* Hero content */}
        <div className="flex-1 flex flex-col justify-center z-10 w-full">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="neu-label">
              {isLogin ? "Welcome Back" : "Get Started"}
            </span>
          </motion.div>

          <motion.h1
            key={isLogin ? "login-headline" : "signup-headline"}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-5 text-[clamp(2rem,4vw,3.5rem)] font-extrabold leading-[1.1] tracking-tight text-[#111827]"
          >
            {isLogin ? (
              <>AI Agents.<br /><span className="text-gradient">Real Growth.</span><br />Together.</>
            ) : (
              <>Start building.<br /><span className="text-gradient">Your AI team</span><br />is ready.</>
            )}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-4 text-sm text-[#6B7280] font-medium max-w-md leading-relaxed"
          >
            {isLogin
              ? "Pick up where you left off. Your AI founding team is waiting to execute."
              : "Describe your idea and our multi-agent AI team handles strategy, marketing, finance & dev."}
          </motion.p>

          {/* Visual — full-width hero image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-8 flex-1 flex items-center justify-center min-h-0"
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <Image 
                src="/hero_image.png" 
                alt="AI Robots Working Together" 
                width={900}
                height={675}
                className="w-full max-w-[110%] h-auto object-contain"
                priority
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Column — Auth Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 bg-white lg:bg-transparent">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="w-full max-w-[420px]"
        >
          {/* Logo (mobile) */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 neu-circle rounded-full flex items-center justify-center overflow-hidden">
                <Image src="/logo.png" alt="Logo" width={32} height={32} className="w-8 h-8 object-contain" />
              </div>
              <span className="font-bold text-2xl tracking-tight text-[#111827]">
                Cofounder<span style={{ color: "#635BFF" }}>.ai</span>
              </span>
            </div>
            <p className="text-xs text-[#6B7280] font-bold">Your AI Co-Founder</p>
          </div>

          {/* Title */}
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            key={isLogin ? "login-title" : "signup-title"}
            className="text-center mb-6"
          >
            <h1 className="text-2xl font-bold text-[#111827] mb-1.5">
              {isLogin ? "Welcome back 👋" : "Create an account ✨"}
            </h1>
            <p className="text-xs text-[#6B7280] font-medium">
              {isLogin ? "Login to continue building your dream" : "Sign up to start building your dream"}
            </p>
          </motion.div>

          {/* Mode Toggle — neumorphic pill */}
          <div className="flex p-1 mb-8 neu-inset rounded-full relative w-full">
            <motion.div
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] neu-pill-accent rounded-full z-0 pointer-events-none"
              initial={false}
              animate={{
                left: isLogin ? "4px" : "calc(50%)",
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(""); setSuccess(""); }}
              className={`flex-1 py-2.5 text-sm font-bold z-10 transition-colors duration-200 rounded-full ${
                isLogin ? "text-white" : "text-[#6B7280] hover:text-[#374151]"
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(""); setSuccess(""); }}
              className={`flex-1 py-2.5 text-sm font-bold z-10 transition-colors duration-200 rounded-full ${
                !isLogin ? "text-white" : "text-[#6B7280] hover:text-[#374151]"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error / Success messages */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-3.5 neu-inset rounded-xl text-red-500 text-xs font-bold text-center border border-red-200/50"
              >
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-3.5 neu-inset rounded-xl text-emerald-600 text-xs font-bold text-center border border-emerald-200/50"
              >
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-[#374151] mb-2 uppercase tracking-wider" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3.5 neu-inset rounded-xl text-[#111827] placeholder-[#9CA3AF] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#635BFF]/30 transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider" htmlFor="password">
                  Password
                </label>
                {isLogin && (
                  <a href="#" className="text-[11px] font-bold text-[#635BFF] hover:underline">
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
                className="w-full px-4 py-3.5 neu-inset rounded-xl text-[#111827] placeholder-[#9CA3AF] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#635BFF]/30 transition-all"
                placeholder="Enter your password"
                minLength={!isLogin ? 6 : undefined}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 neu-pill-accent text-base font-bold mt-3 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span className="inline-flex items-center gap-2">
                  {isLogin ? "Log in" : "Sign up"}
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>

          {/* Back link */}
          <div className="mt-8 text-center">
            <Link
              href="/"
              className="text-xs font-bold text-[#9CA3AF] hover:text-[#635BFF] transition-colors inline-flex items-center gap-1"
            >
              ← Back to home
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
