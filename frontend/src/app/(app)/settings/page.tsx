"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Settings as SettingsIcon, Bell, Shield, Palette, CreditCard, ChevronRight } from "lucide-react";

const TABS = [
  { id: "general", label: "General", icon: SettingsIcon },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "billing", label: "Billing", icon: CreditCard },
];

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("general");

  const handleTabClick = (tabId: string) => {
    if (tabId === "billing") {
      // Billing is a dedicated page (checkout UI lives there).
      router.push("/billing");
      return;
    }
    setActiveTab(tabId);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-[#0a0a0a]">Settings</h2>
        <p className="text-[14px] text-[#6b7280] mt-1">Manage your account preferences and application settings.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-60 shrink-0">
          <nav className="flex flex-col gap-1.5">
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-200 text-left ${
                    active ? "bg-[#eef2ff] text-[#4f46e5] shadow-sm ring-1 ring-[#4f46e5]/10" : "text-[#6b7280] hover:bg-white hover:shadow-sm hover:text-[#0a0a0a]"
                  }`}
                >
                  <tab.icon className={`w-4 h-4 shrink-0 transition-colors ${active ? "text-[#4f46e5]" : "text-[#9ca3af]"}`} />
                  {tab.label}
                  {active && <ChevronRight className="w-4 h-4 ml-auto text-[#4f46e5] opacity-50" />}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="card bg-white p-8 min-h-[400px] flex flex-col"
            >
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#eef2ff] to-[#e0e7ff] flex items-center justify-center shrink-0 shadow-sm border border-[#4f46e5]/10">
                    {TABS.find(t => t.id === activeTab)?.icon({ className: "w-5 h-5 text-[#4f46e5]" })}
                 </div>
                 <div>
                    <h3 className="text-[17px] font-semibold text-[#0a0a0a] capitalize">{activeTab}</h3>
                    <p className="text-[13px] text-[#6b7280]">Configure your {activeTab} preferences here.</p>
                 </div>
              </div>
              
              <div className="border-t border-[#f3f4f6] pt-10 flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#fafafa] border border-[#e5e7eb] flex items-center justify-center mb-5 shadow-sm">
                  <SettingsIcon className="w-6 h-6 text-[#9ca3af]" />
                </div>
                <h4 className="text-[16px] font-semibold text-[#0a0a0a] mb-1.5">Coming Soon</h4>
                <p className="text-[14px] text-[#6b7280] max-w-sm leading-relaxed">This section is currently under development. Detailed settings will be available in the next release.</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
