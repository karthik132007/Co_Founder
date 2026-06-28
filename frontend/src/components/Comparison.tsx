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
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-ice-100 rounded-full blur-3xl opacity-40 pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-ice-50 text-ice-500 text-[11px] font-bold uppercase tracking-wider mb-4">
          Why AI Co-Founder
        </div>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          Replace expensive hires with intelligent agents
        </h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="mt-14 glass-strong rounded-3xl overflow-hidden text-left shadow-xl border border-white/50"
        >
          {/* Header Row */}
          <div className="grid grid-cols-3 border-b border-gray-100 bg-white/50">
            <div className="p-5"></div>
            <div className="p-5 text-[13px] font-bold text-gray-400 uppercase tracking-wider flex items-center">
              Traditional
            </div>
            <div className="p-5 text-[13px] font-bold text-pink-500 bg-pink-50/50 uppercase tracking-wider flex items-center">
              AI Co-Founder
            </div>
          </div>

          {/* Data Rows */}
          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-3 border-b border-gray-100 last:border-0 hover:bg-white/40 transition-colors">
              <div className="py-5 px-6 text-[15px] font-bold text-foreground flex items-center">
                {row.label}
              </div>
              <div className="py-5 px-6 text-[14px] text-gray-500 flex items-center">
                <X className="w-4 h-4 text-red-400 mr-3 shrink-0" />
                {row.traditional}
              </div>
              <div className="py-5 px-6 text-[14px] text-foreground font-semibold flex items-center bg-pink-50/30">
                <Check className="w-4 h-4 text-emerald-500 mr-3 shrink-0" />
                {row.ai}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
