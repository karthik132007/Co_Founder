"use client";

import { FormEvent, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Loader2, Brain, Sparkles, ChevronLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { API_BASE_URL, readApiError } from "@/lib/api";
import { getSession, setOnboardingComplete, type CofounderSession } from "@/lib/session";

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
    label: "Small description",
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
  const words = value.trim().split(/\s+/).filter(Boolean);
  return words.length;
}

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
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
    setError("");
  };

  const validateCurrentStep = () => {
    const value = form[currentStep.key];

    if (typeof value === "string" && !value.trim()) {
      return `${currentStep.label} is required`;
    }

    if (currentStep.key === "smallDescription" && descriptionWords > 500) {
      return "Small description must be 500 words or less";
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
        headers: {
          "Content-Type": "application/json",
        },
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
      <main className="min-h-screen bg-[#f8faff] flex items-center justify-center" style={{ fontFamily: "SF Mono, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace" }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#635BFF" }} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8faff] flex text-[#111827]" style={{ fontFamily: "SF Mono, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace" }}>
      
      {/* Left Column — Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col relative px-12 py-10 overflow-hidden">
        {/* Ambient orbs */}
        <div className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] bg-[#635BFF]/[0.05] rounded-full blur-[180px] pointer-events-none" />
        <div className="absolute -bottom-[10%] right-[0%] w-[40vw] h-[40vw] bg-[#8B85FF]/[0.04] rounded-full blur-[150px] pointer-events-none" />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 z-10 group">
          <div className="w-10 h-10 neu-circle rounded-full flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden">
            <Image src="/logo.png" alt="Logo" width={32} height={32} className="w-8 h-8 object-contain" />
          </div>
          <span className="font-bold text-xl tracking-tight text-[#111827]">
            Cofounder<span style={{ color: "#635BFF" }}>.ai</span>
          </span>
        </Link>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center z-10 max-w-[520px] mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="neu-label">Onboarding</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 text-5xl font-extrabold leading-tight tracking-tight text-[#111827]"
          >
            Tell us the basics.<br />
            <span className="text-gradient">We will tune</span><br />
            your team.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-base text-[#6B7280] font-medium max-w-md leading-relaxed"
          >
            Answer a few quick questions so our AI agents can personalize your experience. Takes less than 2 minutes.
          </motion.p>

          {/* Step indicators */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mt-10 flex gap-3"
          >
            {steps.map((step, i) => (
              <div
                key={step.key}
                className={`flex items-center gap-2 neu-card rounded-xl px-4 py-2.5 transition-all duration-300 ${
                  i === stepIndex
                    ? "ring-2 ring-[#635BFF]/30 shadow-lg"
                    : i < stepIndex
                    ? "opacity-60"
                    : "opacity-40"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold text-white ${
                    i < stepIndex ? "bg-emerald-500" : i === stepIndex ? "bg-[#635BFF]" : "bg-[#D1D5DB]"
                  }`}
                >
                  {i < stepIndex ? <Check className="w-3 h-3" /> : i + 1}
                </div>
                <span className="text-[10px] font-bold text-[#374151] hidden xl:inline">{step.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right Column — Form */}
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

          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between text-[10px] font-bold text-[#6B7280] mb-2.5 uppercase tracking-wider">
              <span>Question {stepIndex + 1} of {steps.length}</span>
              <span>{Math.round(((stepIndex + 1) / steps.length) * 100)}%</span>
            </div>
            <div className="h-2.5 w-full neu-inset rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #635BFF, #8B85FF)" }}
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
                className="mb-6 p-3.5 neu-inset rounded-xl text-red-500 text-xs font-bold text-center border border-red-200/50"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleNext}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep.key}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <div className="text-center mb-6">
                  <p className="text-[10px] font-bold text-[#635BFF] mb-2 uppercase tracking-widest">
                    {currentStep.label}
                  </p>
                  <h1 className="text-2xl font-bold text-[#111827] mb-2">{currentStep.title}</h1>
                  <p className="text-xs text-[#6B7280] font-medium">{currentStep.helper}</p>
                </div>

                {currentStep.key === "smallDescription" ? (
                  <div>
                    <textarea
                      id={currentStep.key}
                      value={form.smallDescription}
                      onChange={(event) => updateField("smallDescription", event.target.value)}
                      required
                      rows={7}
                      className="w-full px-4 py-3.5 neu-inset rounded-xl text-[#111827] placeholder-[#9CA3AF] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#635BFF]/30 transition-all resize-none"
                      placeholder="We help early-stage founders..."
                    />
                    <div className={`mt-2 text-right text-[10px] font-bold ${descriptionWords > 500 ? "text-red-500" : "text-[#9CA3AF]"}`}>
                      {descriptionWords}/500 words
                    </div>
                  </div>
                ) : currentStep.key === "tone" ? (
                  <select
                    id={currentStep.key}
                    value={form.tone}
                    onChange={(event) => updateField("tone", event.target.value)}
                    className="w-full px-4 py-3.5 neu-inset rounded-xl text-[#111827] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#635BFF]/30 transition-all appearance-none cursor-pointer"
                  >
                    <option value="friendly">😊 Friendly</option>
                    <option value="professional">💼 Professional</option>
                    <option value="witty">⚡ Witty</option>
                  </select>
                ) : (
                  <input
                    id={currentStep.key}
                    type="text"
                    value={form[currentStep.key]}
                    onChange={(event) => updateField(currentStep.key, event.target.value)}
                    required
                    className="w-full px-4 py-3.5 neu-inset rounded-xl text-[#111827] placeholder-[#9CA3AF] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#635BFF]/30 transition-all"
                    placeholder={currentStep.key === "companyName" ? "Acme AI" : "SaaS"}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation buttons */}
            <div className="flex gap-3 mt-8">
              {stepIndex > 0 && (
                <button
                  type="button"
                  onClick={() => { setStepIndex((c) => c - 1); setError(""); }}
                  className="neu-pill px-5 py-3.5 text-sm font-bold text-[#6B7280] hover:text-[#111827] transition-colors inline-flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3.5 neu-pill-accent text-base font-bold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isLastStep ? (
                  <>
                    Finish onboarding
                    <Check className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-5 h-5" />
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
