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
import { Demo } from "@/components/landing/Demo";
import { Plugins } from "@/components/landing/Plugins";
import { Pricing } from "@/components/landing/Pricing";
import { CTA } from "@/components/landing/CTA";

export default function HomePage() {
  useLenis();

  return (
    <LandingThemeProvider>
      <div data-landing data-theme="light" className="relative">
        <div className="noise" />
        <Cursor />
        <Nav />
        <main>
          <Hero />
          <div className="mx-auto max-w-7xl px-6"><div className="divider-line" /></div>
          <Dashboard />
          <div className="mx-auto max-w-7xl px-6"><div className="divider-line" /></div>
          <HowItThinks />
          <div className="mx-auto max-w-7xl px-6"><div className="divider-line" /></div>
          <Comparison />
          <div className="mx-auto max-w-7xl px-6"><div className="divider-line" /></div>
          <Features />
          <div className="mx-auto max-w-7xl px-6"><div className="divider-line" /></div>
          <Demo />
          <div className="mx-auto max-w-7xl px-6"><div className="divider-line" /></div>
          <Plugins />
          <div className="mx-auto max-w-7xl px-6"><div className="divider-line" /></div>
          <Pricing />
          <CTA />
        </main>
      </div>
    </LandingThemeProvider>
  );
}
