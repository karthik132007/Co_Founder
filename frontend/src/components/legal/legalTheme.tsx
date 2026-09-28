"use client";

import { useCallback, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export type LegalTheme = "dark" | "light";

const STORAGE_KEY = "cofounder-legal-theme";

/** Light/dark theme for the legal pages, persisted per browser. Defaults to dark. */
export function useLegalTheme() {
  const [theme, setTheme] = useState<LegalTheme>("dark");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "light" || saved === "dark") setTheme(saved);
    } catch {
      // Storage may be disabled; the default theme still applies.
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme((t) => {
      const next: LegalTheme = t === "dark" ? "light" : "dark";
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Best-effort persistence only.
      }
      return next;
    });
  }, []);

  return { theme, toggle };
}

export function LegalThemeToggle({ theme, onToggle }: { theme: LegalTheme; onToggle: () => void }) {
  const dark = theme === "dark";
  return (
    <button
      onClick={onToggle}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="inline-flex items-center gap-2 rounded-full border border-[var(--legal-border)] bg-[var(--legal-panel)] px-3.5 py-1.5 text-[12.5px] font-medium text-[var(--legal-muted)] transition-colors hover:text-[var(--legal-fg)]"
    >
      {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
      {dark ? "Light" : "Dark"}
    </button>
  );
}
