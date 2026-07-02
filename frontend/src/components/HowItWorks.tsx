"use client";

import { motion } from "framer-motion";
import { MessageSquare, Target, GitMerge, CheckCircle2 } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    title: "Share your idea",
    desc: "Describe your business concept, goals, and the challenges you're facing.",
  },
  {
    icon: Target,
    title: "CEO agent creates a plan",
    desc: "The central AI agent analyzes your input and builds a comprehensive strategy.",
  },
  {
    icon: GitMerge,
    title: "Agents collaborate",
    desc: "Specialized agents work together, sharing context and knowledge to execute.",
  },
  {
    icon: CheckCircle2,
    title: "Get actionable results",
    desc: "Receive deliverables — strategies, code, content, financial plans — not just suggestions.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6 relative">
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full clay-pill text-[12px] font-bold text-bold-primary uppercase tracking-widest mb-4">
            How it works
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-bold-primary">
            From idea to <span className="text-bold-accent">execution</span>
          </h2>
        </div>

        <div className="mt-16 max-w-3xl mx-auto flex flex-col">
          {steps.map((step, i) => {
            const isLast = i === steps.length - 1;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="grid grid-cols-[auto_1fr] gap-x-10"
              >
                {/* Left column: Number and Line */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-[15px] font-black shrink-0 ${
                      i === 0 ? "neu-button-primary text-white" : "neu-circle text-gray-500"
                    }`}
                  >
                    0{i + 1}
                  </div>
                  {!isLast && <div className="w-1.5 bg-[#a3b1c6] opacity-30 flex-1 my-4 rounded-full" />}
                </div>

                {/* Right column: Content */}
                <div className={`pb-14 ${isLast ? "pb-0" : ""}`}>
                  <div className="neu-flat rounded-3xl p-8 flex gap-6 items-start group hover:-translate-y-1 transition-transform">
                    <div className="w-12 h-12 neu-pressed rounded-full flex items-center justify-center shrink-0">
                      <step.icon className={`w-5 h-5 ${i === 0 ? 'text-[var(--color-accent-primary)]' : 'text-gray-500 group-hover:text-[var(--color-accent-primary)] transition-colors'}`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-bold-primary">
                        {step.title}
                      </h3>
                      <p className="text-[15px] text-gray-600 font-medium mt-3 leading-relaxed max-w-md">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
