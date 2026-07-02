"use client";

import { motion } from "framer-motion";
import { Brain, Code, BarChart3, Wallet, LineChart, Search } from "lucide-react";

const agents = [
  {
    icon: Brain,
    name: "CEO Agent",
    primary: true,
    color: "text-[var(--color-accent-primary)]",
    desc: "Coordinates all agents, creates strategies, and ensures every decision aligns with your business goals.",
  },
  {
    icon: Code,
    name: "Web Developer",
    primary: false,
    color: "text-[var(--color-accent-secondary)]",
    desc: "Builds websites, landing pages, and web applications tailored to your startup.",
  },
  {
    icon: BarChart3,
    name: "Marketing Expert",
    primary: false,
    color: "text-[var(--color-accent-primary)]",
    desc: "Designs campaigns, content strategies, and growth plans to reach your audience.",
  },
  {
    icon: Wallet,
    name: "Finance Advisor",
    primary: false,
    color: "text-[var(--color-accent-secondary)]",
    desc: "Handles budgeting, financial projections, pricing, and funding preparation.",
  },
  {
    icon: LineChart,
    name: "Business Analyst",
    primary: false,
    color: "text-[var(--color-accent-primary)]",
    desc: "Evaluates business models, market opportunities, and competitive positioning.",
  },
  {
    icon: Search,
    name: "Research Agent",
    primary: false,
    color: "text-[var(--color-accent-secondary)]",
    desc: "Uncovers market insights, competitor data, industry trends, and actionable intelligence.",
  },
];

export default function Agents() {
  return (
    <section id="agents" className="py-24 px-6 relative">
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full clay-pill text-[12px] font-bold text-bold-primary uppercase tracking-widest mb-4">
            AI Agents
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-bold-primary">
            Meet your <span className="text-bold-accent">AI Team</span>
          </h2>
          <p className="mt-4 text-gray-600 font-medium text-lg max-w-2xl mx-auto">
            Six specialized agents working together to build your startup.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {agents.map((agent, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="clay-card rounded-3xl p-8 group cursor-pointer"
            >
              <div className="w-14 h-14 neu-circle flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <agent.icon className={`w-6 h-6 ${agent.color}`} />
              </div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-bold-primary">
                  {agent.name}
                </h3>
                {agent.primary && (
                  <span className="text-[10px] text-white font-bold px-2 py-0.5 rounded-full neu-button-primary">
                    CEO
                  </span>
                )}
              </div>
              <p className="mt-4 text-[15px] text-gray-700 font-medium leading-relaxed">
                {agent.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
