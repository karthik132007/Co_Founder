"use client";

import { motion } from "framer-motion";
import { Brain, Code, BarChart3, Wallet, LineChart, Search } from "lucide-react";

const agents = [
  {
    icon: Brain,
    name: "CEO Agent",
    primary: true,
    color: "from-pink-400 to-pink-500",
    text: "text-pink-50",
    desc: "Coordinates all agents, creates strategies, and ensures every decision aligns with your business goals.",
  },
  {
    icon: Code,
    name: "Web Developer",
    primary: false,
    color: "from-ice-300 to-ice-400",
    text: "text-ice-50",
    desc: "Builds websites, landing pages, and web applications tailored to your startup.",
  },
  {
    icon: BarChart3,
    name: "Marketing Expert",
    primary: false,
    color: "from-peach-300 to-peach-400",
    text: "text-peach-50",
    desc: "Designs campaigns, content strategies, and growth plans to reach your audience.",
  },
  {
    icon: Wallet,
    name: "Finance Advisor",
    primary: false,
    color: "from-emerald-400 to-teal-500",
    text: "text-emerald-50",
    desc: "Handles budgeting, financial projections, pricing, and funding preparation.",
  },
  {
    icon: LineChart,
    name: "Business Analyst",
    primary: false,
    color: "from-violet-400 to-purple-500",
    text: "text-violet-50",
    desc: "Evaluates business models, market opportunities, and competitive positioning.",
  },
  {
    icon: Search,
    name: "Research Agent",
    primary: false,
    color: "from-amber-400 to-orange-500",
    text: "text-amber-50",
    desc: "Uncovers market insights, competitor data, industry trends, and actionable intelligence.",
  },
];

export default function Agents() {
  return (
    <section id="agents" className="py-24 px-6 relative">
      {/* Background Blob */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-[600px] bg-ice-100 rounded-full blur-3xl opacity-30 pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-ice-50 text-ice-500 text-[11px] font-bold uppercase tracking-wider mb-4">
            AI Agents
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Meet your <span className="gradient-text">AI Team</span>
          </h2>
          <p className="mt-4 text-gray-500 text-lg max-w-2xl mx-auto">
            Six specialized agents working together to build your startup.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -8 }}
              className="glass rounded-3xl p-8 group cursor-pointer transition-shadow hover:shadow-xl"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${agent.color} flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <agent.icon className={`w-6 h-6 ${agent.text}`} />
              </div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-foreground">
                  {agent.name}
                </h3>
                {agent.primary && (
                  <span className="text-[10px] text-pink-500 font-bold px-2 py-0.5 rounded-full bg-pink-50 border border-pink-100">
                    CEO
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm text-gray-500 leading-relaxed">
                {agent.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
