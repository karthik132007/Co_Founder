"use client";

import { FormEvent, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Loader2, ChevronLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { API_BASE_URL, readApiError } from "@/lib/api";
import { getSession, setOnboardingComplete, type CofounderSession } from "@/lib/session";

const ACCENT = "#4f46e5";

type OnboardingForm = {
  companyName: string;
  smallDescription: string;
  industry: string;
  tone: "friendly" | "professional" | "witty";
};

type Step = {
  key: keyof OnboardingForm;
  label: string;
  title: string;
  helper: string;
};

const steps: Step[] = [
  {
    key: "companyName",
    label: "Company name",
    title: "What is your company called?",
    helper: "Use the name your customers will recognize.",
  },
  {
    key: "smallDescription",
    label: "Description",
    title: "Describe what you are building.",
    helper: "Keep it clear and practical. Maximum 500 words.",
  },
  {
    key: "industry",
    label: "Industry",
    title: "Which industry are you in?",
    helper: "Examples: fintech, health, education, ecommerce, SaaS.",
  },
  {
    key: "tone",
    label: "Tone",
    title: "Pick your brand tone.",
    helper: "This helps the agents match how your company should sound.",
  },
];

const initialForm: OnboardingForm = {
  companyName: "",
  smallDescription: "",
  industry: "",
  tone: "professional",
};

const subscribeToSession = () => () => {};
const getServerSessionSnapshot = () => null;

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

const toneOptions = [
  { value: "friendly", label: "Friendly", desc: "Warm, approachable, conversational" },
  { value: "professional", label: "Professional", desc: "Clear, confident, trustworthy" },
  { value: "witty", label: "Witty", desc: "Sharp, playful, memorable" },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const session = useSyncExternalStore<CofounderSession | null>(
    subscribeToSession,
    getSession,
    getServerSessionSnapshot,
  );
  const [form, setForm] = useState(initialForm);
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentStep = steps[stepIndex];
  const descriptionWords = useMemo(
    () => countWords(form.smallDescription),
    [form.smallDescription],
  );
  const isLastStep = stepIndex === steps.length - 1;

  useEffect(() => {
    if (!session) {
      router.replace("/auth");
      return;
    }
    if (session.onboardingComplete) {
      router.replace("/dashboard");
    }
  }, [router, session]);

  const updateField = (key: keyof OnboardingForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
  };

  const validateCurrentStep = () => {
    const value = form[currentStep.key];
    if (typeof value === "string" && !value.trim()) {
      return `${currentStep.label} is required`;
    }
    if (currentStep.key === "smallDescription" && descriptionWords > 500) {
      return "Description must be 500 words or less";
    }
    return "";
  };

  const submitOnboarding = async () => {
    if (!session) {
      router.replace("/auth");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/user/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: form.companyName.trim(),
          small_description: form.smallDescription.trim(),
          industry: form.industry.trim(),
          tone: form.tone,
          user_id: session.user.id,
        }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, "Onboarding failed"));
      }

      setOnboardingComplete();
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateCurrentStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!isLastStep) {
      setStepIndex((current) => current + 1);
      return;
    }
    await submitOnboarding();
  };

  if (!session || session.onboardingComplete) {
    return (
      <main className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: ACCENT }} />
      </main>
    );
  }

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
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-[clamp(2rem,3.4vw,3.1rem)] font-semibold leading-[1.12] tracking-tight text-white"
          >
            Tell us the basics. <span className="text-[#8b85ff]">We&apos;ll tune your team.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="mt-5 text-[15px] text-[#a1a1aa] leading-relaxed"
          >
            Answer a few quick questions so our AI agents can personalize your
            experience. Takes less than 2 minutes.
          </motion.p>

          {/* Step list */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24 }}
            className="mt-12 space-y-3"
          >
            {steps.map((step, i) => {
              const done = i < stepIndex;
              const active = i === stepIndex;
              return (
                <div key={step.key} className="flex items-center gap-3.5">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold border transition-colors ${
                      done
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : active
                          ? "border-[#8b85ff] bg-[#8b85ff]/15 text-[#8b85ff]"
                          : "border-white/15 text-[#71717a]"
                    }`}
                  >
                    {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span
                    className={`text-sm font-medium transition-colors ${
                      active ? "text-white" : done ? "text-[#a1a1aa]" : "text-[#71717a]"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
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
          className="w-full max-w-[440px]"
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

          {/* Progress */}
          <div className="mb-9">
            <div className="flex justify-between text-xs font-medium text-[#6b7280] mb-2.5">
              <span>Step {stepIndex + 1} of {steps.length}</span>
              <span>{Math.round(((stepIndex + 1) / steps.length) * 100)}%</span>
            </div>
            <div className="h-1.5 w-full bg-[#e5e7eb] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: ACCENT }}
                initial={false}
                animate={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
                transition={{ type: "spring", stiffness: 260, damping: 30 }}
              />
            </div>
          </div>

          {/* Error */}
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
          </AnimatePresence>

          <form onSubmit={handleNext}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep.key}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <div className="mb-6">
                  <p className="text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: ACCENT }}>
                    {currentStep.label}
                  </p>
                  <h1 className="text-2xl font-semibold tracking-tight text-[#0a0a0a]">
                    {currentStep.title}
                  </h1>
                  <p className="mt-1.5 text-sm text-[#6b7280]">{currentStep.helper}</p>
                </div>

                {currentStep.key === "smallDescription" ? (
                  <div>
                    <textarea
                      id={currentStep.key}
                      value={form.smallDescription}
                      onChange={(e) => updateField("smallDescription", e.target.value)}
                      required
                      rows={6}
                      className="input px-3.5 py-3 text-sm resize-none"
                      placeholder="We help early-stage founders..."
                    />
                    <div className={`mt-2 text-right text-xs font-medium ${descriptionWords > 500 ? "text-red-500" : "text-[#9ca3af]"}`}>
                      {descriptionWords}/500 words
                    </div>
                  </div>
                ) : currentStep.key === "tone" ? (
                  <div className="space-y-2.5">
                    {toneOptions.map((opt) => {
                      const active = form.tone === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => updateField("tone", opt.value)}
                          className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all ${
                            active
                              ? "border-[#4f46e5] bg-[#eef2ff] ring-1 ring-[#4f46e5]/30"
                              : "border-[#e5e7eb] bg-white hover:border-[#d4d4d8]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-semibold ${active ? "text-[#0a0a0a]" : "text-[#374151]"}`}>
                              {opt.label}
                            </span>
                            {active && <Check className="w-4 h-4" style={{ color: ACCENT }} />}
                          </div>
                          <p className="mt-0.5 text-xs text-[#6b7280]">{opt.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <input
                    id={currentStep.key}
                    type="text"
                    value={form[currentStep.key]}
                    onChange={(e) => updateField(currentStep.key, e.target.value)}
                    required
                    className="input px-3.5 py-2.5 text-sm"
                    placeholder={currentStep.key === "companyName" ? "Acme AI" : "SaaS"}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Nav buttons */}
            <div className="flex gap-3 mt-8">
              {stepIndex > 0 && (
                <button
                  type="button"
                  onClick={() => { setStepIndex((c) => c - 1); setError(""); }}
                  className="btn-ghost px-4 py-2.5 text-sm border border-[#e5e7eb] bg-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 py-2.5 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isLastStep ? (
                  <>
                    Finish onboarding
                    <Check className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </main>
  );
}
