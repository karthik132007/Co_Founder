"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";

const ThemeContext = createContext<{
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
} | null>(null);

const STORAGE_KEY = "cofounder-landing-theme";

/**
 * Landing theme provider. Default is light. Persists choice to localStorage
 * and reflects it onto the [data-landing] root via the data-theme attribute.
 * Applies the attribute before paint to avoid a flash.
 */
export function LandingThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  // hydrate from storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (stored === "light" || stored === "dark") {
        setThemeState(stored);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // reflect onto the root
  useEffect(() => {
    const root = document.querySelector("[data-landing]");
    if (root) root.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const toggle = useCallback(
    () => setThemeState((p) => (p === "light" ? "dark" : "light")),
    []
  );

  const value = useMemo(
    () => ({ theme, toggle, setTheme }),
    [theme, toggle, setTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useLandingTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // safe fallback so components don't crash if used outside provider
    return { theme: "light" as Theme, toggle: () => {}, setTheme: () => {} };
  }
  return ctx;
}
