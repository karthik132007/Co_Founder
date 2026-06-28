"use client";

import { motion } from "framer-motion";
import { Lightbulb, Users, Zap, Brain, BarChart3, Wallet, Code } from "lucide-react";

export default function Solution() {
  return (
    <section id="solution" className="py-24 px-6 relative">
      <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-ice-100 rounded-full blur-3xl opacity-50 pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          {/* Left Column */}
          <div className="lg:w-1/2">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-ice-50 text-ice-400 text-[11px] font-bold uppercase tracking-wider mb-4">
              The Solution
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Your AI founding team, ready in <span className="gradient-text">seconds</span>
            </h2>

            <div className="mt-12 space-y-8">
              {[
                {
                  icon: Lightbulb,
                  title: "Multi-agent intelligence",
                  desc: "Instead of one generic AI, specialized agents collaborate to cover every aspect of building a startup.",
                  color: "bg-pink-50 text-pink-500"
                },
                {
                  icon: Users,
                  title: "Works like a real team",
                  desc: "A CEO agent coordinates specialists in marketing, finance, development, and research — just like a founding team.",
                  color: "bg-peach-50 text-peach-400"
                },
                {
                  icon: Zap,
                  title: "Instant, actionable results",
                  desc: "Get strategies, financial plans, marketing campaigns, and code — not just advice.",
                  color: "bg-ice-50 text-ice-400"
                },
              ].map((feature, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${feature.color}`}>
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed max-w-sm">
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
            <div className="glass-strong rounded-3xl p-10 flex flex-col items-center shadow-xl">
              {/* CEO Node */}
              <div className="rounded-xl bg-gradient-to-r from-pink-500 to-peach-400 px-6 py-4 text-white text-sm font-bold flex items-center gap-2 z-10 shadow-lg">
                <Brain className="w-5 h-5" />
                CEO Agent
              </div>

              {/* Connecting Lines (SVG) */}
              <svg className="w-full h-16 -my-2 relative z-0" viewBox="0 0 100 40" preserveAspectRatio="none">
                <line x1="50" y1="0" x2="15" y2="40" stroke="#E5E7EB" strokeWidth="2" />
                <line x1="50" y1="0" x2="50" y2="40" stroke="#E5E7EB" strokeWidth="2" />
                <line x1="50" y1="0" x2="85" y2="40" stroke="#E5E7EB" strokeWidth="2" />
              </svg>

              {/* Sub-agents Row */}
              <div className="flex justify-between w-full z-10 gap-3">
                {[
                  { label: "Marketing", icon: BarChart3, color: "text-pink-500 bg-pink-50" },
                  { label: "Finance", icon: Wallet, color: "text-ice-400 bg-ice-50" },
                  { label: "Developer", icon: Code, color: "text-peach-400 bg-peach-50" },
                ].map((agent, i) => (
                  <div key={i} className="flex-1 bg-white border border-gray-100 shadow-sm rounded-xl px-2 py-4 flex flex-col items-center hover:-translate-y-1 transition-transform">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${agent.color}`}>
                      <agent.icon className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] text-gray-600 font-bold uppercase tracking-wider">{agent.label}</span>
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
