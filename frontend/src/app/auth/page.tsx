"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import Image from "next/image";
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

    const endpoint = isLogin ? `${API_BASE_URL}/login` : `${API_BASE_URL}/signup`;

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
    <main className="min-h-screen bg-white flex text-gray-900 font-sans">
      
      {/* Left Column - Marketing & Visuals */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#f8faff] flex-col relative px-12 py-10 overflow-hidden border-r border-gray-100">
        
        {/* Top left logo */}
        <div className="flex items-center gap-3 z-10">
          <Image src="/logo.png" alt="Logo" width={32} height={32} className="w-8 h-8 object-contain" />
          <span className="font-bold text-xl tracking-tight">
            Cofounder.ai
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center mt-12 z-10 max-w-[750px] mx-auto w-full">
          <h1 className="text-5xl font-extrabold leading-tight tracking-tight mb-10 text-[#111827]">
            AI Agents.<br />
            <span className="text-[#635BFF]">Real Growth.</span><br />
            Together.
          </h1>

          <div className="relative w-[115%] -left-[7.5%] mb-8">
            <Image 
              src="/hero_image.png" 
              alt="AI Robots Working Together" 
              width={800}
              height={600}
              className="w-full h-auto object-contain"
              priority
            />
          </div>

        </div>
        
        {/* Decorative background blob */}
        <div className="absolute top-1/4 -right-32 w-96 h-96 bg-[#e0e7ff]/40 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Right Column - Auth Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12">
        <div className="w-full max-w-[420px]">
          
          <div className="flex flex-col items-center mb-8">
             <div className="flex items-center gap-3 mb-2">
                <Image src="/logo.png" alt="Logo" width={40} height={40} className="w-10 h-10 object-contain" />
                <span className="font-bold text-2xl tracking-tight text-gray-900">
                  Cofounder.ai
                </span>
             </div>
             <p className="text-sm text-gray-500 font-medium">Your AI Co-Founder</p>
          </div>

          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            key={isLogin ? "login-title" : "signup-title"}
            className="text-center mb-6"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isLogin ? "Welcome back 👋" : "Create an account ✨"}
            </h1>
            <p className="text-sm text-gray-500 font-medium">
              {isLogin ? "Login to continue building your dream" : "Sign up to start building your dream"}
            </p>
          </motion.div>

          {/* Mode Toggle Switch */}
          <div className="flex p-1 mb-8 bg-gray-100 border border-gray-200 rounded-full relative w-full">
            <motion.div
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white shadow-sm border border-gray-200 rounded-full z-0 pointer-events-none"
              initial={false}
              animate={{
                left: isLogin ? "4px" : "calc(50%)",
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(""); setSuccess(""); }}
              className={`flex-1 py-2 text-sm font-bold z-10 transition-colors duration-200 ${isLogin ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(""); setSuccess(""); }}
              className={`flex-1 py-2 text-sm font-bold z-10 transition-colors duration-200 ${!isLogin ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Sign Up
            </button>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-semibold text-center"
              >
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm font-semibold text-center"
              >
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#635BFF] focus:ring-1 focus:ring-[#635BFF] transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-semibold text-gray-700" htmlFor="password">Password</label>
                {isLogin && (
                  <a href="#" className="text-sm font-medium text-[#635BFF] hover:underline">Forgot password?</a>
                )}
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#635BFF] focus:ring-1 focus:ring-[#635BFF] transition-all"
                placeholder="Enter your password"
                minLength={!isLogin ? 6 : undefined}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#635BFF] hover:bg-[#524be6] text-white rounded-lg text-base font-bold mt-2 transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>{isLogin ? "Log in" : "Sign up"}</>
              )}
            </button>
          </form>

        </div>
      </div>
    </main>
  );
}
