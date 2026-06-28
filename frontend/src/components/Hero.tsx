"use client";

import { motion } from "framer-motion";
import { ArrowRight, Brain, Code, BarChart3, Wallet, LineChart, Search } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center pt-32 pb-16 overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-20 -left-20 w-80 h-80 bg-pink-200 rounded-full blur-3xl opacity-40 animate-blob" />
        <div className="absolute top-40 -right-20 w-96 h-96 bg-peach-200 rounded-full blur-3xl opacity-40 animate-blob-reverse" />
        <div className="absolute bottom-10 left-1/3 w-72 h-72 bg-ice-200 rounded-full blur-3xl opacity-40 animate-blob" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-16">
        
        {/* Left Side: Text Content */}
        <div className="lg:w-1/2 flex flex-col items-start text-left">
          {/* Label */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass rounded-full px-4 py-1.5 text-sm inline-flex items-center text-pink-500 shadow-sm font-bold tracking-wider uppercase"
          >
            AI-Powered Startup Platform
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 text-[clamp(2.5rem,5vw,4.5rem)] font-bold leading-[1.1] tracking-tight text-foreground"
          >
            Your AI startup team,
            <br />
            <span className="gradient-text">ready to build.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-lg md:text-xl text-gray-500 max-w-xl leading-relaxed"
          >
            Turn ideas into real businesses with specialized AI agents that handle strategy, marketing, finance, and development — so you can focus on the vision.
          </motion.p>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-wrap items-center gap-6"
          >
            <button className="bg-gradient-to-r from-pink-500 to-peach-400 text-white rounded-full px-8 py-3.5 text-[15px] font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all inline-flex items-center gap-2 group">
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <a
              href="#how-it-works"
              className="text-[15px] text-gray-500 hover:text-pink-500 transition-colors font-bold inline-flex items-center"
            >
              See how it works
            </a>
          </motion.div>
        </div>

        {/* Right Side: Network Graph Visualization */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="lg:w-1/2 w-full max-w-lg mx-auto relative aspect-square"
        >
          {/* SVG Connecting Edges */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 100">
            {[
              { x: 20, y: 20 }, // Dev (Top Left)
              { x: 80, y: 20 }, // Marketing (Top Right)
              { x: 15, y: 70 }, // Analyst (Bottom Left)
              { x: 85, y: 70 }, // Finance (Bottom Right)
              { x: 50, y: 90 }, // Research (Bottom Center)
            ].map((pos, i) => (
              <g key={i}>
                <line x1="50" y1="50" x2={pos.x} y2={pos.y} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" className="opacity-50" />
                {/* Animated data packet traveling along the line */}
                <circle r="1.5" fill="#F43F5E">
                  <animateMotion 
                    dur={`${2 + i * 0.5}s`} 
                    repeatCount="indefinite" 
                    path={`M 50 50 L ${pos.x} ${pos.y}`} 
                  />
                </circle>
              </g>
            ))}
          </svg>

          {/* Center Node (CEO) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-500 to-peach-400 p-1 shadow-2xl animate-pulse-glow">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                <Brain className="w-10 h-10 text-pink-500" />
              </div>
            </div>
            <div className="mt-3 glass px-4 py-1.5 rounded-full shadow-sm flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
              <span className="text-xs font-bold text-gray-700">Orchestrating...</span>
            </div>
          </div>

          {/* Satellite Nodes */}
          {[
            { icon: Code, label: "Dev", action: "Deploying Vercel...", pos: "top-[10%] left-[5%]", color: "text-ice-500" },
            { icon: BarChart3, label: "Mktg", action: "A/B Testing...", pos: "top-[10%] right-[5%]", color: "text-peach-500" },
            { icon: LineChart, label: "Data", action: "Analyzing...", pos: "bottom-[25%] left-[0%]", color: "text-violet-500" },
            { icon: Wallet, label: "Fin", action: "Updating runway...", pos: "bottom-[25%] right-[0%]", color: "text-emerald-500" },
            { icon: Search, label: "Rsch", action: "Scraping trends...", pos: "bottom-[0%] left-1/2 -translate-x-1/2", color: "text-amber-500" },
          ].map((sat, i) => (
            <div key={i} className={`absolute ${sat.pos} z-10 flex flex-col items-center`}>
              <motion.div 
                animate={{ y: [0, -5, 0] }} 
                transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut" }}
                className="glass w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg border border-white/50 relative group"
              >
                <sat.icon className={`w-6 h-6 ${sat.color}`} />
                
                {/* Activity Tooltip */}
                <div className="absolute -bottom-8 whitespace-nowrap glass px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className={`w-1.5 h-1.5 rounded-full bg-current ${sat.color} animate-pulse`} />
                  <span className="text-[10px] font-bold text-gray-600">{sat.action}</span>
                </div>
              </motion.div>
            </div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
