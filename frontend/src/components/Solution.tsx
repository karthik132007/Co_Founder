"use client";

import { motion } from "framer-motion";
import { Lightbulb, Users, Zap, Brain, BarChart3, Wallet, Code } from "lucide-react";

export default function Solution() {
  return (
    <section id="solution" className="py-24 px-6 relative">
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          {/* Left Column */}
          <div className="lg:w-1/2">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full clay-pill text-[12px] font-bold text-bold-primary uppercase tracking-widest mb-4">
              The Solution
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-bold-primary">
              Your AI founding team, ready in <span className="text-bold-accent">seconds</span>
            </h2>

            <div className="mt-12 space-y-10">
              {[
                {
                  icon: Lightbulb,
                  title: "Multi-agent intelligence",
                  desc: "Instead of one generic AI, specialized agents collaborate to cover every aspect of building a startup.",
                },
                {
                  icon: Users,
                  title: "Works like a real team",
                  desc: "A CEO agent coordinates specialists in marketing, finance, development, and research — just like a founding team.",
                },
                {
                  icon: Zap,
                  title: "Instant, actionable results",
                  desc: "Get strategies, financial plans, marketing campaigns, and code — not just advice.",
                },
              ].map((feature, i) => (
                <div key={i} className="flex gap-6 items-start group">
                  <div className="w-14 h-14 neu-circle flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-6 h-6 text-[var(--color-accent-primary)]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-bold-primary">
                      {feature.title}
                    </h3>
                    <p className="text-[15px] text-gray-600 font-medium mt-2 leading-relaxed max-w-sm">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column (Architecture Diagram) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:w-1/2 w-full"
          >
            <div className="clay-card p-10 flex flex-col items-center">
              {/* CEO Node */}
              <div className="neu-button-primary px-8 py-4 text-sm font-bold flex items-center gap-3 z-10">
                <Brain className="w-6 h-6" />
                CEO Agent
              </div>

              {/* Connecting Lines (SVG) */}
              <svg className="w-full h-16 -my-2 relative z-0" viewBox="0 0 100 40" preserveAspectRatio="none">
                <line x1="50" y1="0" x2="15" y2="40" stroke="#a3b1c6" strokeWidth="3" />
                <line x1="50" y1="0" x2="50" y2="40" stroke="#a3b1c6" strokeWidth="3" />
                <line x1="50" y1="0" x2="85" y2="40" stroke="#a3b1c6" strokeWidth="3" />
              </svg>

              {/* Sub-agents Row */}
              <div className="flex justify-between w-full z-10 gap-4">
                {[
                  { label: "Marketing", icon: BarChart3 },
                  { label: "Finance", icon: Wallet },
                  { label: "Developer", icon: Code },
                ].map((agent, i) => (
                  <div key={i} className="flex-1 neu-flat rounded-2xl px-2 py-6 flex flex-col items-center hover:-translate-y-2 transition-transform">
                    <div className="w-10 h-10 neu-pressed flex items-center justify-center mb-4 rounded-xl">
                      <agent.icon className="w-5 h-5 text-[var(--color-accent-primary)]" />
                    </div>
                    <span className="text-[11px] text-gray-700 font-bold uppercase tracking-widest">{agent.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
