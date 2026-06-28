"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function CTA() {
  return (
    <section className="py-32 px-6 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-gradient-to-r from-pink-100 via-peach-100 to-ice-100 rounded-full blur-3xl opacity-50" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto text-center relative z-10 glass-strong rounded-3xl p-16 shadow-2xl border border-white/60"
      >
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight text-foreground">
          Ready to build with <span className="gradient-text">AI?</span>
        </h2>
        <p className="mt-6 text-lg text-gray-500 max-w-xl mx-auto">
          Start building your startup with a team of AI agents. No credit card required.
        </p>
        
        <button className="mt-10 bg-gradient-to-r from-pink-500 to-peach-400 text-white rounded-full px-10 py-4 text-[16px] font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all inline-flex items-center gap-2 group">
          Get Started
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </motion.div>
    </section>
  );
}
