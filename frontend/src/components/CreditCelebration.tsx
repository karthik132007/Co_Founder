"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";

const COLORS = ["#f6c85f", "#ef8354", "#7cc99a", "#5b8def", "#e07a9a"];

export default function CreditCelebration({ onDone }: { onDone: () => void }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 5200);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!visible) {
      const timer = window.setTimeout(onDone, 350);
      return () => window.clearTimeout(timer);
    }
  }, [onDone, visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none fixed inset-0 z-[90] overflow-hidden"
          aria-live="polite"
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 240, damping: 18, delay: 0.15 }}
            className="pointer-events-auto absolute left-1/2 top-20 -translate-x-1/2 rounded-2xl border border-[#f6c85f]/50 bg-[#fffdf4] px-6 py-4 text-center shadow-[0_14px_50px_rgba(20,54,32,0.18)]"
          >
            <div className="text-2xl" aria-hidden="true">🎉</div>
            <p className="mt-1 whitespace-nowrap text-lg font-semibold text-[#143620]">Yay, you got 50 free credits!</p>
            <p className="mt-1 text-sm text-[#5f6f63]">
              Your company is ready — put them to work on your first task.
            </p>
            <Link
              href="/chat"
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#143620] px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#1a4a2b]"
            >
              Start your first task
              <span aria-hidden="true">→</span>
            </Link>
          </motion.div>

          {Array.from({ length: 28 }, (_, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, y: -40, x: 0, rotate: 0 }}
              animate={{ opacity: [0, 1, 1, 0], y: [0, 180 + (index % 6) * 55, 420 + (index % 5) * 48], x: (index % 2 ? 1 : -1) * (80 + (index * 37) % 260), rotate: 360 + index * 25 }}
              transition={{ duration: 3.4 + (index % 5) * 0.22, delay: (index % 7) * 0.06, ease: "easeOut" }}
              className="absolute left-1/2 top-0 h-3 w-2 rounded-sm"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
          ))}

          {["left-[9%]", "right-[9%]", "left-[18%]", "right-[18%]"].map((position, index) => (
            <motion.div
              key={position}
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: [80, -8, 8, -4], opacity: 1 }}
              transition={{ duration: 1.1, delay: index * 0.1, ease: "easeOut" }}
              className={`absolute top-1/2 ${position} h-16 w-12 rounded-[50%] shadow-md`}
              style={{ backgroundColor: COLORS[(index + 2) % COLORS.length] }}
            >
              <span className="absolute -bottom-7 left-1/2 h-8 w-px -translate-x-1/2 rotate-3 bg-[#8d9d94]" />
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}