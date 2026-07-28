"use client";

import { useEffect, useState } from "react";
import { useLandingTheme } from "./ThemeContext";

/**
 * Theme toggle — a pill switch with sun/moon glyphs. Sits in the nav.
 * Defaults to light; flips to dark on click. SSR-safe (renders after mount).
 */
export function ThemeToggle() {
  const { theme, toggle } = useLandingTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted && theme === "dark";

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      data-cursor="hover"
      className="relative flex h-9 w-16 items-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface)] transition-colors duration-500"
    >
      {/* track glow */}
      <span
        className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(60% 100% at 50% 50%, var(--color-accent-glow), transparent 70%)",
          opacity: isDark ? 0.6 : 0,
        }}
      />
      {/* knob */}
      <span
        className="relative flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-bg-soft)] border border-[var(--color-border-strong)] transition-transform duration-500 ease-[cubic-bezier(0.65,0,0.35,1)]"
        style={{ transform: isDark ? "translateX(30px)" : "translateX(2px)" }}
      >
        {isDark ? (
          // moon
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-text)]">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        ) : (
          // sun
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-accent)]">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
        )}
      </span>
    </button>
  );
}
