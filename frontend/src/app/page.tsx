"use client";

import { useLenis } from "@/lib/useLenis";
import { LandingThemeProvider } from "@/components/landing/ThemeContext";
import { Cursor } from "@/components/landing/Cursor";
import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { Dashboard } from "@/components/landing/Dashboard";
import { HowItThinks } from "@/components/landing/HowItThinks";
import { Comparison } from "@/components/landing/Comparison";
import { Features } from "@/components/landing/Features";
import { Plugins } from "@/components/landing/Plugins";
import { Pricing } from "@/components/landing/Pricing";
import { CTA } from "@/components/landing/CTA";
import { SectionBridge } from "@/components/landing/SectionBridge";

export default function HomePage() {
  useLenis();

  return (
    <LandingThemeProvider>
      <div data-landing data-theme="light" className="relative">
        <div className="noise" />
        <Cursor />
        <Nav />
        <main className="relative bg-[var(--color-bg)]">
          {/* continuous backdrop — absolute inside main so it sits between main bg and sections */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.42]" aria-hidden>
            <div className="absolute inset-0 bg-grid opacity-[0.32]" />
          </div>
          <Hero />
          <SectionBridge variant="comet" label="meet your team" />
          <Dashboard />
          <SectionBridge variant="aurora" label="under the hood" />
          <HowItThinks />
          <SectionBridge variant="orbit" label="the difference" />
          <Comparison />
          <SectionBridge variant="comet" label="capabilities" />
          <Features />
          <SectionBridge variant="aurora" label="extend it" />
          <Plugins />
          <SectionBridge variant="orbit" label="simple pricing" />
          <Pricing />
          <CTA />
        </main>
      </div>
    </LandingThemeProvider>
  );
}
