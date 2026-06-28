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
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] bg-peach-100 rounded-full blur-3xl opacity-30 animate-blob" />
      </div>

      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-16 relative z-10">
        
        {/* Left Side: Sticky Header */}
        <div className="lg:w-1/3 lg:sticky lg:top-32 lg:self-start">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-[11px] font-bold uppercase tracking-wider mb-4">
            Platform Features
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Everything you need to <span className="gradient-text">build & scale</span>
          </h2>
          <p className="mt-4 text-gray-500 text-base leading-relaxed">
            A comprehensive toolkit that replaces dozens of disconnected apps with one unified AI platform.
          </p>
        </div>

        {/* Right Side: Features Grid */}
        <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: (i % 5) * 0.1 }}
              className="glass rounded-2xl p-6 hover:-translate-y-1 transition-transform duration-300 group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-50 to-peach-50 flex items-center justify-center mb-4 border border-pink-100">
                <feature.icon className="w-5 h-5 text-pink-500" />
              </div>
              <h3 className="text-[15px] font-bold text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
