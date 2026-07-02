"use client";

import { motion } from "framer-motion";
import { Brain, BarChart3, Code, Wallet, Search, LineChart, Database, RefreshCw, Target, Sparkles } from "lucide-react";

export default function Collaboration() {
  return (
    <section className="py-24 px-6 relative">
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center px-4 py-1.5 rounded-full clay-pill text-[12px] font-bold text-bold-primary uppercase tracking-widest mb-4">
          Collaboration
        </div>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-bold-primary">
          Intelligent <span className="text-bold-accent">Agent Collaboration</span>
        </h2>
        <p className="mt-4 text-gray-600 font-medium text-lg max-w-2xl mx-auto">
          Our agents don&apos;t work in isolation — they communicate, share context, and collaborate in real-time.
        </p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-16 w-full max-w-xl mx-auto relative aspect-square"
        >
          {/* CEO Center Node */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20 animate-float">
            {/* Outer Ring */}
            <div className="w-32 h-32 rounded-full neu-pressed flex items-center justify-center relative">
              <div className="w-24 h-24 neu-button-primary rounded-full flex items-center justify-center relative z-10">
                <Brain className="w-10 h-10 text-white" />
              </div>
            </div>
            <span className="text-[13px] font-bold mt-4 text-bold-primary clay-pill px-4 py-1.5">CEO</span>
          </div>

          {/* SVG Connecting Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 100">
            {[
              { x: 50, y: 10 }, { x: 85, y: 35 }, { x: 75, y: 80 }, { x: 25, y: 80 }, { x: 15, y: 35 }
            ].map((pos, i) => (
              <line key={i} x1="50" y1="50" x2={pos.x} y2={pos.y} stroke="#a3b1c6" strokeWidth="2" strokeDasharray="4 4" className="opacity-40" />
            ))}
          </svg>

          {/* Satellite Nodes (Pentagon arrangement) */}
          {[
            { icon: BarChart3, label: "Marketing", pos: "top-[2%] left-1/2 -translate-x-1/2", color: "text-[#224458]" },
            { icon: Code, label: "Developer", pos: "top-[25%] right-[2%]", color: "text-[#5fa6d1]" },
            { icon: Wallet, label: "Finance", pos: "bottom-[10%] right-[15%]", color: "text-[#4A87A5]" },
            { icon: LineChart, label: "Analyst", pos: "bottom-[10%] left-[15%]", color: "text-[#7DBDE0]" },
            { icon: Search, label: "Research", pos: "top-[25%] left-[2%]", color: "text-[#1C3B4E]" },
          ].map((sat, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + (i * 0.1) }}
              className={`absolute ${sat.pos} flex flex-col items-center z-10`}
            >
              <div className={`neu-circle w-16 h-16 flex items-center justify-center hover:scale-110 transition-transform animate-float ${i % 2 === 0 ? 'animation-delay-2000' : ''}`}>
                <div className={`w-10 h-10 neu-pressed rounded-full flex items-center justify-center ${sat.color}`}>
                  <sat.icon className="w-5 h-5" />
                </div>
              </div>
              <span className="text-[12px] font-bold mt-3 clay-pill px-3 py-1 text-gray-700">{sat.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Capability labels */}
        <div className="mt-20 flex flex-wrap justify-center gap-5">
          {[
            { icon: Database, label: "Shared Memory", color: "text-[#3B7597]" },
            { icon: RefreshCw, label: "Context Sharing", color: "text-[#5fa6d1]" },
            { icon: Target, label: "Smart Delegation", color: "text-[#7DBDE0]" },
            { icon: Sparkles, label: "Collaborative Reasoning", color: "text-[#224458]" },
          ].map((cap, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8 + (i * 0.1) }}
              className="flex items-center gap-3 text-[14px] font-bold text-gray-700 neu-flat rounded-full px-6 py-3"
            >
              <cap.icon className={`w-5 h-5 ${cap.color}`} />
              {cap.label}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
