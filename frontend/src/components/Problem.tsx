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
      {/* Background Blob */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-pink-100 rounded-full blur-3xl opacity-50 -translate-y-1/2 pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="max-w-2xl">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-pink-50 text-pink-500 text-[11px] font-bold uppercase tracking-wider mb-4">
            The Problem
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Building a startup alone is <span className="gradient-text">overwhelming</span>
          </h2>
          <p className="mt-4 text-gray-500 text-lg leading-relaxed">
            Founders face critical gaps in expertise that slow progress and increase risk.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {problems.map((problem, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className="glass rounded-2xl p-6 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <problem.icon className="w-5 h-5 text-pink-500" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {problem.title}
              </h3>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                {problem.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
