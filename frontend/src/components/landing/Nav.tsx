"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ScrambleText } from "./ScrambleText";
import { Magnetic } from "./Magnetic";
import { ThemeToggle } from "./ThemeToggle";

const LINKS = [
  { label: "How it thinks", href: "#how" },
  { label: "Compare", href: "#compare" },
  { label: "Plugins", href: "#plugins" },
  { label: "Pricing", href: "#pricing" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled ? "py-2" : "py-4"
      }`}
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="nav-shell flex items-center justify-between rounded-full px-5 py-2 transition-all duration-500">
          <a href="#top" className="flex items-center gap-2.5" data-cursor="hover">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-accent)] opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--color-accent)]" />
            </span>
            <span className="text-sm font-medium tracking-tight">
              Co-Founder<span className="text-[var(--color-text-muted)]"> AI</span>
            </span>
            <span className="hidden lg:inline-flex font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-dim)]">
              · Agentify your business
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-8 text-sm text-[var(--color-text-muted)]">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} className="link-underline" data-cursor="hover">
                <ScrambleText text={l.label} hover />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Magnetic strength={0.5}>
              <Link
                href="/auth"
                className="btn-magnetic is-solid text-sm"
                data-cursor="hover"
              >
                <span className="btn-bg" />
                <span className="btn-glow" />
                Get Started
              </Link>
            </Magnetic>
          </div>
        </div>
      </div>
    </header>
  );
}
