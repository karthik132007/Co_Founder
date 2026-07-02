"use client";

import { motion } from "framer-motion";
import { ArrowRight, Brain, Code, BarChart3, Wallet, LineChart, Search } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center pt-32 pb-16 overflow-hidden">
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-16">
        
        {/* Left Side: Text Content */}
        <div className="lg:w-1/2 flex flex-col items-start text-left">
          {/* Label */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="neu-pressed rounded-full px-5 py-2 text-sm inline-flex items-center text-bold-accent font-bold tracking-widest uppercase"
          >
            AI-Powered Startup Platform
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-8 text-[clamp(2.5rem,5vw,4.5rem)] font-bold leading-[1.1] tracking-tight text-bold-primary"
          >
            Your AI startup team,
            <br />
            <span className="text-[var(--color-accent-primary)]">ready to build.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-lg md:text-xl text-gray-600 font-medium max-w-xl leading-relaxed"
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
            <button className="neu-button-primary px-8 py-4 text-[16px] font-bold inline-flex items-center gap-3 group">
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <a
              href="#how-it-works"
              className="text-[16px] text-gray-600 hover:text-[var(--color-accent-secondary)] transition-colors font-bold inline-flex items-center"
            >
              See how it works
            </a>
          </motion.div>
        </div>

        {/* Right Side: Network Graph Visualization */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="lg:w-1/2 w-full max-w-[550px] mx-auto relative aspect-square mt-10 lg:mt-0"
        >
          {/* Animated Background Rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
              className="absolute w-[85%] h-[85%] rounded-full border-2 border-[var(--color-accent-primary)] opacity-20 border-dashed"
            />
            <motion.div 
              animate={{ rotate: -360 }} 
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute w-[65%] h-[65%] rounded-full border-2 border-[var(--color-accent-secondary)] opacity-30 border-dotted"
            />
            <motion.div 
              animate={{ scale: [1, 1.1, 1] }} 
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute w-[45%] h-[45%] rounded-full bg-[var(--color-accent-primary)] opacity-10 blur-3xl"
            />
          </div>

          {/* SVG Connection Paths */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--color-accent-primary)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="var(--color-accent-secondary)" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            {[
              { x: 15, y: 25 },
              { x: 85, y: 25 },
              { x: 10, y: 70 },
              { x: 90, y: 70 },
              { x: 50, y: 95 },
            ].map((pos, i) => (
              <g key={i}>
                <motion.path 
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, delay: 0.5 + i * 0.1 }}
                  d={`M 50 50 Q ${50} ${pos.y > 50 ? pos.y - 10 : pos.y + 10} ${pos.x} ${pos.y}`}
                  fill="none"
                  stroke="url(#lineGrad)" 
                  strokeWidth="0.75" 
                />
                <circle r="1.5" fill="var(--color-accent-secondary)" className="opacity-90">
                  <animateMotion 
                    dur={`${2 + i * 0.4}s`} 
                    repeatCount="indefinite" 
                    path={`M 50 50 Q ${50} ${pos.y > 50 ? pos.y - 10 : pos.y + 10} ${pos.x} ${pos.y}`} 
                  />
                </circle>
              </g>
            ))}
          </svg>

          {/* Center Node (CEO) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
            <div className="relative">
              {/* Pulsing glow behind CEO */}
              <div className="absolute inset-0 bg-[var(--color-accent-secondary)] rounded-full blur-xl opacity-50 animate-pulse" />
              <div className="neu-circle w-32 h-32 flex items-center justify-center relative overflow-hidden backdrop-blur-xl border border-white/60 bg-white/40 shadow-[0_0_40px_rgba(255,179,198,0.4)]">
                <Brain className="w-14 h-14 text-[var(--color-accent-secondary)] relative z-10 drop-shadow-lg" />
                <div className="absolute inset-0 rounded-full border-[5px] border-transparent border-t-[var(--color-accent-primary)] animate-spin opacity-60" style={{ animationDuration: '3s' }} />
              </div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="mt-6 clay-pill px-6 py-2.5 flex items-center gap-3 bg-white/80 backdrop-blur-md shadow-xl border border-white/70"
            >
              <div className="relative flex items-center justify-center w-3 h-3">
                <div className="w-full h-full rounded-full bg-[var(--color-accent-secondary)] animate-ping absolute opacity-75" />
                <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-accent-secondary)] relative" />
              </div>
              <span className="text-[13px] font-black text-gray-800 tracking-wider uppercase">Orchestrating</span>
            </motion.div>
          </div>

          {/* Satellite Nodes */}
          {[
            { icon: Code, label: "Dev", action: "Deploying...", pos: "top-[15%] left-[5%]", delay: 0 },
            { icon: BarChart3, label: "Mktg", action: "A/B Testing...", pos: "top-[15%] right-[5%]", delay: 0.2 },
            { icon: LineChart, label: "Data", action: "Analyzing...", pos: "bottom-[20%] left-[0%]", delay: 0.4 },
            { icon: Wallet, label: "Fin", action: "Runway...", pos: "bottom-[20%] right-[0%]", delay: 0.6 },
            { icon: Search, label: "Rsch", action: "Scraping...", pos: "bottom-[-5%] left-1/2 -translate-x-1/2", delay: 0.8 },
          ].map((sat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.8 + sat.delay, type: "spring" }}
              className={`absolute ${sat.pos} z-10 flex flex-col items-center`}
            >
              <motion.div 
                animate={{ y: [0, -10, 0] }} 
                transition={{ duration: 4 + i * 0.5, repeat: Infinity, ease: "easeInOut" }}
                className="relative group cursor-pointer"
              >
                {/* Node Glow */}
                <div className="absolute inset-0 bg-[var(--color-accent-primary)] rounded-full blur-lg opacity-0 group-hover:opacity-60 transition-opacity duration-300" />
                
                {/* Node Glass */}
                <div className="neu-circle w-20 h-20 flex items-center justify-center relative bg-white/50 backdrop-blur-md border border-white/70 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <sat.icon className={`w-8 h-8 text-[var(--color-accent-primary)]`} />
                </div>
                
                {/* Activity Tooltip */}
                <div className={`absolute top-1/2 -translate-y-1/2 ${i % 2 === 0 ? 'left-full ml-4' : 'right-full mr-4'} whitespace-nowrap clay-pill px-4 py-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 ${i % 2 === 0 ? 'translate-x-[-10px]' : 'translate-x-[10px]'} group-hover:translate-x-0 pointer-events-none bg-white/90 backdrop-blur-md border border-white/70 shadow-xl`}>
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-accent-primary)] animate-pulse" />
                  <span className="text-[12px] font-black text-gray-700 tracking-wide">{sat.action}</span>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
