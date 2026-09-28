"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SiteFooter from "@/components/landing/SiteFooter";
import { LegalThemeToggle, useLegalTheme } from "./legalTheme";

export type LegalPanel = {
  id: string;
  num: number;
  /** Short label for the side nav. */
  short: string;
  /** Full section heading. */
  title: string;
  body: React.ReactNode;
};

export const LEGAL_PANEL = "scroll-mt-20";
export const LEGAL_H2 = "text-xl font-semibold tracking-tight text-[var(--legal-fg)]";
export const LEGAL_BODY = "mt-3 text-[15px] leading-relaxed text-[var(--legal-body)]";
export const LEGAL_LIST = "mt-3 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-[var(--legal-body)]";
export const LEGAL_LINK = "underline decoration-[var(--legal-link-dec)] underline-offset-2 hover:text-[var(--legal-fg)]";

export default function LegalPageShell({
  title,
  updated,
  panels,
}: {
  title: string;
  updated: string;
  panels: LegalPanel[];
}) {
  const { theme, toggle } = useLegalTheme();
  const [active, setActive] = useState(panels[0]?.id ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-20% 0px -65% 0px" },
    );
    for (const { id } of panels) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [panels]);

  const jump = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActive(id);
    window.history.replaceState(null, "", `#${id}`);
  };

  return (
    <main
      data-legal-theme={theme}
      className="min-h-screen bg-[var(--legal-bg)] text-[var(--legal-fg)] antialiased selection:bg-white selection:text-black"
      style={{ colorScheme: theme }}
    >
      <div className="mx-auto max-w-6xl px-6 pb-24">
        {/* Top bar */}
        <div className="flex items-center justify-between py-6">
          <Link href="/" className="text-[13px] font-medium text-[var(--legal-muted)] hover:text-[var(--legal-fg)]">
            ← Back to home
          </Link>
          <div className="flex items-center gap-3">
            <LegalThemeToggle theme={theme} onToggle={toggle} />
            <span className="hidden text-[13px] text-[var(--legal-faint)] sm:inline">Co-Founder AI</span>
          </div>
        </div>

        {/* Centered header */}
        <header className="mx-auto max-w-3xl pb-12 pt-6 text-center sm:pb-16">
          <p className="text-[13px] font-medium tracking-wide text-[var(--legal-muted)]">
            Updated: {updated}
          </p>
          <h1 className="mt-4 text-5xl font-medium tracking-tight sm:text-6xl">
            {title}
          </h1>
        </header>

        {/* Mobile nav */}
        <nav aria-label="Sections" className="sticky top-0 z-10 -mx-6 mb-10 border-b border-[var(--legal-border)] bg-[var(--legal-bar)] px-6 py-3 backdrop-blur lg:hidden">
          <div className="flex gap-5 overflow-x-auto text-[13px]">
            {panels.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={(e) => jump(e, s.id)}
                className={`whitespace-nowrap py-1 ${active === s.id ? "font-medium text-[var(--legal-fg)]" : "text-[var(--legal-faint)]"}`}
              >
                {s.num}. {s.short}
              </a>
            ))}
          </div>
        </nav>

        <div className="lg:grid lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-14">
          {/* Side nav */}
          <nav aria-label="Sections" className="hidden lg:block">
            <div className="sticky top-10 self-start">
              <ul className="space-y-0.5">
                {panels.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      onClick={(e) => jump(e, s.id)}
                      aria-current={active === s.id ? "true" : undefined}
                      className={`block py-[7px] text-[13px] leading-snug transition-colors ${
                        active === s.id ? "font-medium text-[var(--legal-fg)]" : "text-[var(--legal-faint)] hover:text-[var(--legal-body)]"
                      }`}
                    >
                      <span className={active === s.id ? "text-[var(--legal-fg)]" : "text-[var(--legal-faint)]"}>{s.num}.</span> {s.short}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          {/* Content */}
          <div className="max-w-2xl space-y-10">
            {panels.map((s) => (
              <section key={s.id} id={s.id} className={LEGAL_PANEL}>
                <h2 className={LEGAL_H2}>{s.title}</h2>
                {s.body}
              </section>
            ))}
          </div>
        </div>
      </div>
      <SiteFooter tone={theme === "light" ? "light" : "dark"} />
    </main>
  );
}
