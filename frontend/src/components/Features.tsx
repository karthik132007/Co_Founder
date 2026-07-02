"use client";

import { motion } from "framer-motion";
import { Users, Brain, Zap, ClipboardList, Megaphone, Wallet, Map, Microscope, Globe, Target } from "lucide-react";

const features = [
  { icon: Users, title: "Multi-agent intelligence", desc: "Specialized agents working as a coordinated team." },
  { icon: Brain, title: "Shared memory", desc: "Every agent shares context for informed decisions." },
  { icon: Zap, title: "Task automation", desc: "Automate repetitive work across your business." },
  { icon: ClipboardList, title: "Business planning", desc: "Generate comprehensive business plans instantly." },
  { icon: Megaphone, title: "Marketing assistance", desc: "Campaigns, content, and growth strategies." },
  { icon: Wallet, title: "Financial guidance", desc: "Budgeting, projections, and pricing support." },
  { icon: Map, title: "Startup roadmaps", desc: "Clear roadmaps tailored to your stage." },
  { icon: Microscope, title: "Market research", desc: "Competitor analysis and market intelligence." },
  { icon: Globe, title: "Website development", desc: "Build and deploy professional websites." },
  { icon: Target, title: "Central AI manager", desc: "One CEO agent orchestrating everything." },
];

export default function Features() {
  return (
    <section id="features" className="py-24 px-6 relative">
      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Centered Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full clay-pill text-[12px] font-bold text-bold-primary uppercase tracking-widest mb-4">
            Platform Features
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-bold-primary mt-2">
            Everything you need to <span className="text-bold-accent">scale</span>
          </h2>
          <p className="mt-6 text-gray-600 font-medium text-lg leading-relaxed">
            A comprehensive toolkit that replaces dozens of disconnected apps with one unified AI platform.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-center">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: (i % 4) * 0.1 }}
              className="neu-flat rounded-3xl p-7 hover:-translate-y-2 transition-transform duration-300 group flex flex-col items-center text-center bg-white/40"
            >
              <div className="w-14 h-14 rounded-full neu-pressed flex items-center justify-center mb-5 group-hover:scale-110 transition-transform bg-white/50">
                <feature.icon className={`w-6 h-6 text-[var(--color-accent-${i % 2 === 0 ? 'primary' : 'secondary'})]`} />
              </div>
              <h3 className="text-[16px] font-bold text-bold-primary">
                {feature.title}
              </h3>
              <p className="text-[13px] text-gray-600 font-medium mt-3 leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
