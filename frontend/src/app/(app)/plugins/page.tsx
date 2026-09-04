"use client";

import { motion } from "framer-motion";
import { Puzzle } from "lucide-react";

export default function PluginsPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <h2 className="text-lg font-semibold text-[#0f2214]">Plugins</h2>
      <div className="card p-12 text-center flex flex-col items-center justify-center min-h-[320px]">
        <div className="w-14 h-14 rounded-2xl bg-[#f6f5ef] flex items-center justify-center mb-4">
          <Puzzle className="w-6 h-6 text-[#8d9d94]" />
        </div>
        <h3 className="text-[15px] font-semibold text-[#0f2214] mb-1">Coming Soon</h3>
        <p className="text-sm text-[#5f6f63]">Extend your AI team with plugins and integrations.</p>
      </div>
    </motion.div>
  );
}
