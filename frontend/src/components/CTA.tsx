"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function CTA() {
  return (
    <section className="py-32 px-6 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto text-center relative z-10 clay-card rounded-[3rem] p-16 sm:p-24"
      >
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight text-bold-primary">
          Ready to build with <span className="text-[var(--color-accent-secondary)] drop-shadow-md">AI?</span>
        </h2>
        <p className="mt-6 text-lg text-gray-700 font-medium max-w-xl mx-auto">
          Start building your startup with a team of AI agents. No credit card required.
        </p>
        
        <button className="mt-12 neu-button-secondary px-10 py-5 text-[18px] font-bold shadow-lg inline-flex items-center gap-3 group hover:scale-105">
          Get Started
          <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
        </button>
      </motion.div>
    </section>
  );
}
