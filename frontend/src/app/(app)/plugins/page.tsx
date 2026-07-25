"use client";

import { motion } from "framer-motion";
import { Puzzle } from "lucide-react";

export default function PluginsPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <h2 className="text-lg font-semibold text-[#0a0a0a]">Plugins</h2>
      <div className="card p-12 text-center flex flex-col items-center justify-center min-h-[320px]">
        <div className="w-14 h-14 rounded-2xl bg-[#f3f4f6] flex items-center justify-center mb-4">
          <Puzzle className="w-6 h-6 text-[#9ca3af]" />
        </div>
        <h3 className="text-[15px] font-semibold text-[#0a0a0a] mb-1">Coming Soon</h3>
        <p className="text-sm text-[#6b7280]">Extend your AI team with plugins and integrations.</p>
      </div>
    </motion.div>
  );
}
