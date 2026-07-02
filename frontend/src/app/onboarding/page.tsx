"use client";

import { FormEvent, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Loader2 } from "lucide-react";
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
      <main className="min-h-screen bg-white flex items-center justify-center text-gray-900 font-sans">
        <Loader2 className="h-6 w-6 animate-spin text-[#635BFF]" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white flex text-gray-900 font-sans">
      <div className="hidden lg:flex lg:w-1/2 bg-[#f8faff] flex-col relative px-12 py-10 overflow-hidden border-r border-gray-100">
        <div className="flex items-center gap-3 z-10">
          <Image src="/logo.png" alt="Logo" width={32} height={32} className="w-8 h-8 object-contain" />
          <span className="font-bold text-xl tracking-tight">Cofounder.ai</span>
        </div>

        <div className="flex-1 flex flex-col justify-center mt-12 z-10 max-w-[750px] mx-auto w-full">
          <h1 className="text-5xl font-extrabold leading-tight tracking-tight mb-10 text-[#111827]">
            Tell us the basics.<br />
            <span className="text-[#635BFF]">We will tune</span><br />
            your team.
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

        <div className="absolute top-1/4 -right-32 w-96 h-96 bg-[#e0e7ff]/40 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12">
        <div className="w-full max-w-[420px]">
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Image src="/logo.png" alt="Logo" width={40} height={40} className="w-10 h-10 object-contain" />
              <span className="font-bold text-2xl tracking-tight text-gray-900">Cofounder.ai</span>
            </div>
            <p className="text-sm text-gray-500 font-medium">Your AI Co-Founder</p>
          </div>

          <div className="mb-8">
            <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
              <span>Question {stepIndex + 1} of {steps.length}</span>
              <span>{Math.round(((stepIndex + 1) / steps.length) * 100)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
              <motion.div
                className="h-full bg-[#635BFF]"
                initial={false}
                animate={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
                transition={{ type: "spring", stiffness: 260, damping: 30 }}
              />
            </div>
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
                  <p className="text-sm font-bold text-[#635BFF] mb-2">{currentStep.label}</p>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{currentStep.title}</h1>
                  <p className="text-sm text-gray-500 font-medium">{currentStep.helper}</p>
                </div>

                {currentStep.key === "smallDescription" ? (
                  <div>
                    <textarea
                      id={currentStep.key}
                      value={form.smallDescription}
                      onChange={(event) => updateField("smallDescription", event.target.value)}
                      required
                      rows={7}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#635BFF] focus:ring-1 focus:ring-[#635BFF] transition-all resize-none"
                      placeholder="We help early-stage founders..."
                    />
                    <div className={`mt-2 text-right text-xs font-semibold ${descriptionWords > 500 ? "text-red-600" : "text-gray-400"}`}>
                      {descriptionWords}/500 words
                    </div>
                  </div>
                ) : currentStep.key === "tone" ? (
                  <select
                    id={currentStep.key}
                    value={form.tone}
                    onChange={(event) => updateField("tone", event.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-[#635BFF] focus:ring-1 focus:ring-[#635BFF] transition-all"
                  >
                    <option value="friendly">Friendly</option>
                    <option value="professional">Professional</option>
                    <option value="witty">Witty</option>
                  </select>
                ) : (
                  <input
                    id={currentStep.key}
                    type="text"
                    value={form[currentStep.key]}
                    onChange={(event) => updateField(currentStep.key, event.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#635BFF] focus:ring-1 focus:ring-[#635BFF] transition-all"
                    placeholder={currentStep.key === "companyName" ? "Acme AI" : "SaaS"}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#635BFF] hover:bg-[#524be6] text-white rounded-lg text-base font-bold mt-8 transition-colors duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-70"
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
          </form>
        </div>
      </div>
    </main>
  );
}
