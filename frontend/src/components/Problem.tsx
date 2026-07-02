"use client";

import { motion } from "framer-motion";
import { UserX, DollarSign, Megaphone, Calculator, HelpCircle, Layers } from "lucide-react";

const problems = [
  {
    icon: UserX,
    title: "No technical co-founder",
    desc: "You have the vision but lack the technical skills to build and ship product.",
  },
  {
    icon: DollarSign,
    title: "Expensive to hire",
    desc: "Full-time experts in marketing, finance, and dev cost $50K-200K+ each.",
  },
  {
    icon: Megaphone,
    title: "Marketing is a guessing game",
    desc: "Without experience, creating strategies that actually convert feels impossible.",
  },
  {
    icon: Calculator,
    title: "Financial blind spots",
    desc: "Managing budgets, projections, and funding without a finance background.",
  },
  {
    icon: HelpCircle,
    title: "Strategy uncertainty",
    desc: "Making critical decisions without experienced advisors puts everything at risk.",
  },
  {
    icon: Layers,
    title: "Tool overload",
    desc: "Juggling dozens of disconnected apps creates chaos instead of clarity.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Problem() {
  return (
    <section id="problem" className="py-24 px-6 relative">
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="max-w-2xl">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full clay-pill text-[12px] font-bold text-bold-primary uppercase tracking-widest mb-4">
            The Problem
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-bold-primary">
            Building a startup alone is <span className="text-bold-accent">overwhelming</span>
          </h2>
          <p className="mt-4 text-gray-600 font-medium text-lg leading-relaxed">
            Founders face critical gaps in expertise that slow progress and increase risk.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {problems.map((problem, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="neu-pressed rounded-3xl p-8 transition-all duration-300 group"
            >
              <div className="w-14 h-14 neu-circle flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <problem.icon className="w-6 h-6 text-[var(--color-accent-primary)]" />
              </div>
              <h3 className="text-xl font-bold text-bold-primary">
                {problem.title}
              </h3>
              <p className="text-[15px] text-gray-600 font-medium mt-3 leading-relaxed">
                {problem.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
