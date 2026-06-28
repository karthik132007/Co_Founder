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
      <div className="absolute left-0 bottom-0 w-[600px] h-[600px] bg-peach-100 rounded-full blur-3xl opacity-40 pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-peach-50 text-peach-400 text-[11px] font-bold uppercase tracking-wider mb-4">
            How it works
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            From idea to <span className="gradient-text">execution</span>
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
                className="grid grid-cols-[auto_1fr] gap-x-8"
              >
                {/* Left column: Number and Line */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-md ${
                      i === 0 ? "bg-gradient-to-br from-pink-500 to-peach-400" : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    0{i + 1}
                  </div>
                  {!isLast && <div className="w-0.5 bg-gray-200 flex-1 my-3 rounded-full" />}
                </div>

                {/* Right column: Content */}
                <div className={`pb-12 ${isLast ? "pb-0" : ""}`}>
                  <div className="glass rounded-2xl p-6 flex gap-5 items-start relative overflow-hidden group">
                    {/* Hover gradient glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-50 to-peach-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="relative z-10">
                      <step.icon className={`w-6 h-6 mt-1 ${i === 0 ? 'text-pink-500' : 'text-gray-400'}`} />
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-lg font-bold text-foreground">
                        {step.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-2 leading-relaxed max-w-md">
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
