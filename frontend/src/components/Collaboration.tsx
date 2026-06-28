"use client";

import { motion } from "framer-motion";
import { Brain, BarChart3, Code, Wallet, Search, LineChart, Database, RefreshCw, Target, Sparkles } from "lucide-react";

export default function Collaboration() {
  return (
    <section className="py-24 px-6 relative">
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-pink-50 text-pink-500 text-[11px] font-bold uppercase tracking-wider mb-4">
          Collaboration
        </div>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          Intelligent <span className="gradient-text">Agent Collaboration</span>
        </h2>
        <p className="mt-4 text-gray-500 text-lg max-w-2xl mx-auto">
          Our agents don't work in isolation — they communicate, share context, and collaborate in real-time.
        </p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-16 w-full max-w-xl mx-auto relative aspect-square"
        >
          {/* CEO Center Node */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20">
            {/* Outer Glow Ring */}
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-pink-400 to-peach-400 p-[3px] shadow-2xl animate-pulse-glow absolute -inset-2 opacity-50 blur-md" />
            
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-pink-500 to-peach-400 flex items-center justify-center shadow-xl relative z-10 border-4 border-white">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <span className="text-sm font-bold mt-4 text-foreground bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">CEO</span>
          </div>

          {/* SVG Connecting Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 100">
            {[
              { x: 50, y: 10 }, { x: 85, y: 35 }, { x: 75, y: 80 }, { x: 25, y: 80 }, { x: 15, y: 35 }
            ].map((pos, i) => (
              <line key={i} x1="50" y1="50" x2={pos.x} y2={pos.y} stroke="url(#grad)" strokeWidth="1.5" strokeDasharray="4 4" className="animate-dash opacity-40" />
            ))}
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F43F5E" />
                <stop offset="100%" stopColor="#38BDF8" />
              </linearGradient>
            </defs>
          </svg>

          {/* Satellite Nodes (Pentagon arrangement) */}
          {[
            { icon: BarChart3, label: "Marketing", pos: "top-[2%] left-1/2 -translate-x-1/2", color: "text-peach-500 bg-peach-50" },
            { icon: Code, label: "Developer", pos: "top-[25%] right-[2%]", color: "text-ice-500 bg-ice-50" },
            { icon: Wallet, label: "Finance", pos: "bottom-[10%] right-[15%]", color: "text-emerald-500 bg-emerald-50" },
            { icon: LineChart, label: "Analyst", pos: "bottom-[10%] left-[15%]", color: "text-violet-500 bg-violet-50" },
            { icon: Search, label: "Research", pos: "top-[25%] left-[2%]", color: "text-amber-500 bg-amber-50" },
          ].map((sat, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + (i * 0.1) }}
              className={`absolute ${sat.pos} flex flex-col items-center z-10`}
            >
              <div className="glass w-16 h-16 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${sat.color}`}>
                  <sat.icon className="w-5 h-5" />
                </div>
              </div>
              <span className="text-[12px] font-bold mt-2 whitespace-nowrap bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm text-gray-600">{sat.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Capability labels */}
        <div className="mt-16 flex flex-wrap justify-center gap-4">
          {[
            { icon: Database, label: "Shared Memory", color: "text-pink-500" },
            { icon: RefreshCw, label: "Context Sharing", color: "text-peach-500" },
            { icon: Target, label: "Smart Delegation", color: "text-ice-500" },
            { icon: Sparkles, label: "Collaborative Reasoning", color: "text-emerald-500" },
          ].map((cap, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8 + (i * 0.1) }}
              className="flex items-center gap-2 text-[13px] font-medium text-gray-600 glass rounded-full px-5 py-2.5 shadow-sm"
            >
              <cap.icon className={`w-4 h-4 ${cap.color}`} />
              {cap.label}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
