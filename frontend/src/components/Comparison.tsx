"use client";

import { motion } from "framer-motion";
import { X, Check } from "lucide-react";

const rows = [
  { label: "Cost", traditional: "$50K—200K+ per year", ai: "Fraction of the cost" },
  { label: "Speed", traditional: "Months to hire & onboard", ai: "Ready in seconds" },
  { label: "Tools", traditional: "Dozens of subscriptions", ai: "One unified platform" },
  { label: "Collaboration", traditional: "Communication overhead", ai: "Seamless AI coordination" },
];

export default function Comparison() {
  return (
    <section id="pricing" className="py-24 px-6 relative">
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-md border border-white/40 text-[12px] font-bold text-bold-primary uppercase tracking-widest mb-4">
          Why Co-founder.ai
        </div>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-bold-primary">
          Replace expensive hires with intelligent agents
        </h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="mt-16 bg-white/60 backdrop-blur-md rounded-2xl overflow-hidden text-left border border-white/40 shadow-lg"
        >
          {/* Header Row */}
          <div className="grid grid-cols-3 border-b-2 border-gray-200">
            <div className="p-6 bg-white/30"></div>
            <div className="p-6 bg-white/30 text-[13px] font-bold text-gray-500 uppercase tracking-widest flex items-center">
              Traditional
            </div>
            <div className="p-6 text-[13px] font-bold text-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10 uppercase tracking-widest flex items-center">
              Co-founder.ai
            </div>
          </div>

          {/* Data Rows */}
          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-3 border-b border-gray-200 last:border-0 hover:bg-white/80 transition-colors">
              <div className="py-6 px-8 bg-white/30 text-[16px] font-bold text-bold-primary flex items-center">
                {row.label}
              </div>
              <div className="py-6 px-8 bg-white/30 text-[15px] text-gray-600 font-medium flex items-center">
                <X className="w-5 h-5 text-red-500 mr-4 shrink-0" />
                {row.traditional}
              </div>
              <div className="py-6 px-8 text-[15px] text-bold-primary font-bold flex items-center bg-[var(--color-accent-primary)]/10">
                <Check className="w-5 h-5 text-emerald-500 mr-4 shrink-0" />
                {row.ai}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
