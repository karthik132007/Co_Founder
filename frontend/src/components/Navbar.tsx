"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Menu, X } from "lucide-react";
import Link from "next/link";

const navLinks = [
  { label: "Features", href: "/#features" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Agents", href: "/#agents" },
  { label: "Pricing", href: "/#pricing" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 mx-4 mt-6">
      <div className="clay-pill max-w-6xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 neu-pressed flex items-center justify-center">
              <Brain className="w-5 h-5 text-[var(--color-accent-primary)]" />
            </div>
            <span className="font-bold text-xl text-bold-primary tracking-tight">
              Co-founder.ai
            </span>
          </Link>

          {/* Center: Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-gray-600 hover:text-[var(--color-accent-primary)] transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right: CTA */}
          <div className="flex items-center gap-4">
            <Link href="/auth" className="hidden sm:inline-flex neu-button-primary px-6 py-2.5 text-sm font-bold">
              Get Started
            </Link>

            {/* Mobile Toggle */}
            <button
              onClick={() => setMobileOpen((prev) => !prev)}
              className="md:hidden neu-button p-2 text-foreground"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
              <div className="flex flex-col gap-3 pt-6 pb-4">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="neu-flat text-sm font-bold text-gray-700 py-3 px-4 text-center block"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
                
                <div className="flex flex-col gap-3 mt-2 pt-4 border-t border-gray-200/50">
                  <Link
                    href="/auth"
                    onClick={() => setMobileOpen(false)}
                    className="neu-button-primary px-6 py-3 text-sm font-bold w-full text-center block"
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
