"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Menu, X } from "lucide-react";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Agents", href: "#agents" },
  { label: "Pricing", href: "#pricing" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 mx-4 mt-4">
      <div className="glass-strong rounded-2xl max-w-6xl mx-auto px-6 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          {/* Left: Logo */}
          <a href="#" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-400 to-peach-400 flex items-center justify-center shadow-sm">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-foreground">
              AI Co-Founder
            </span>
          </a>

          {/* Center: Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-600 hover:text-pink-500 transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right: CTA */}
          <div className="flex items-center gap-3">
            <button className="hidden sm:inline-flex bg-gradient-to-r from-pink-500 to-peach-400 text-white rounded-full px-6 py-2.5 text-sm font-medium hover:shadow-lg hover:scale-105 transition-all duration-200">
              Get Started
            </button>

            {/* Mobile Toggle */}
            <button
              onClick={() => setMobileOpen((prev) => !prev)}
              className="md:hidden p-2 text-foreground"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden md:hidden"
            >
              <div className="flex flex-col gap-1 pt-4 pb-2 border-t border-gray-200/50 mt-3">
                {navLinks.map((link, i) => (
                  <motion.a
                    key={link.href}
                    href={link.href}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                    onClick={() => setMobileOpen(false)}
                    className="text-sm font-medium text-gray-600 hover:text-pink-500 transition-colors py-2.5 px-3 rounded-xl hover:bg-pink-50"
                  >
                    {link.label}
                  </motion.a>
                ))}
                <button className="mt-2 bg-gradient-to-r from-pink-500 to-peach-400 text-white rounded-full px-6 py-2.5 text-sm font-medium hover:shadow-lg transition-all duration-200 w-full text-center">
                  Get Started
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
