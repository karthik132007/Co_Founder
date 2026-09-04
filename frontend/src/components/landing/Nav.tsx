"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const LINKS = [
  { label: "Platform", href: "#top" },
  { label: "Agents", href: "#agents" },
  { label: "Use Cases", href: "#how" },
  { label: "Pricing", href: "#pricing" },
  { label: "Resources", href: "#cta" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled ? "py-2.5" : "py-4"
      }`}
    >
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10 lg:px-12">
        <div
          className="flex items-center justify-between gap-4 rounded-full bg-white px-2.5 py-2 md:px-4 md:py-2.5 border border-black/[0.06] transition-all duration-500"
          style={{
            boxShadow: scrolled
              ? "0 8px 32px rgba(15,34,20,0.10), 0 1px 3px rgba(15,34,20,0.06)"
              : "0 4px 24px rgba(15,34,20,0.06)",
          }}
        >
          {/* left: wordmark */}
          <a href="#top" className="flex items-center gap-2.5 pl-1 shrink-0" data-cursor="hover">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0f2214] text-white">
              <Image
                src="/icon.png"
                alt="Co-Founder"
                width={18}
                height={18}
                className="h-4 w-4 object-contain brightness-0 invert"
              />
            </span>
            <span className="text-[15px] font-[700] tracking-[-0.02em] text-[#0f2214]">
              Co-Founder
            </span>
          </a>

          {/* center: links - desktop */}
          <nav className="hidden lg:flex items-center gap-1 rounded-full bg-[#f3f1ea] p-1 border border-black/[0.04]">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-full px-4 py-1.5 text-[13.5px] font-[550] tracking-[-0.01em] text-[#2e3d33] hover:text-[#0f2214] hover:bg-white transition-colors"
                data-cursor="hover"
              >
                {l.label}
              </a>
            ))}
          </nav>

          {/* right */}
          <div className="flex items-center gap-1 md:gap-2 shrink-0">

            <Link
              href="/auth"
              className="hidden md:inline-flex items-center gap-1 rounded-full px-4 py-2 text-[13.5px] font-[600] tracking-[-0.01em] text-[#0f2214] hover:bg-black/[0.06] transition-colors"
              data-cursor="hover"
            >
              Login
            </Link>

            <Link
              href="/auth"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#0f2214] px-5 py-2.5 text-[13.5px] font-[600] tracking-[-0.01em] text-white hover:bg-[#1a3624] transition-colors shadow-[0_2px_10px_rgba(15,34,20,0.14)]"
              data-cursor="hover"
            >
              Get Started
              <span className="translate-y-px">→</span>
            </Link>

            {/* mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden ml-1 flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white"
              aria-label="Menu"
              data-cursor="hover"
            >
              <span className="flex flex-col gap-1">
                <span
                  className={`block h-px w-4 bg-[#0f2214] transition-all ${mobileOpen ? "rotate-45 translate-y-[4px]" : ""}`}
                />
                <span
                  className={`block h-px w-4 bg-[#0f2214] transition-opacity ${mobileOpen ? "opacity-0" : "opacity-100"}`}
                />
                <span
                  className={`block h-px w-4 bg-[#0f2214] transition-all ${mobileOpen ? "-rotate-45 -translate-y-[4px]" : ""}`}
                />
              </span>
            </button>
          </div>
        </div>

        {/* mobile menu */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ${
            mobileOpen ? "max-h-[320px] mt-3 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="rounded-2xl bg-white border border-black/[0.07] shadow-xl p-2">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between rounded-xl px-4 py-3 text-[14px] font-medium text-[#0f2214] hover:bg-black/[0.04]"
              >
                {l.label}
                <span className="text-black/20">→</span>
              </a>
            ))}
            <div className="mt-1 flex items-center gap-2 border-t border-black/5 pt-2 px-1">
              <Link href="/auth" className="flex-1 rounded-full bg-[#f3f1ea] py-3 text-center text-sm font-[600] text-[#0f2214]">
                Login
              </Link>
              <Link href="/auth" className="flex-1 rounded-full bg-[#0f2214] py-3 text-center text-sm font-semibold text-white">
                Get Started →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
