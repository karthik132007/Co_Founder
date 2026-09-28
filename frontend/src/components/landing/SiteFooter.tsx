"use client";

import Image from "next/image";
import Link from "next/link";

/**
 * Site footer — the same block used on the landing page (link columns +
 * giant gradient wordmark). `tone="dark"` swaps the wordmark to a white
 * gradient so it stays visible on the black legal pages.
 */
export default function SiteFooter({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <footer className="relative mt-16 sm:mt-24 px-4 sm:px-6 pb-8" data-cursor-invert>
      <div className="mx-auto max-w-7xl rounded-[1.75rem] border border-white/10 bg-[#05060a] px-6 py-10 text-white/70 sm:px-10">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5 text-white">
              <Image src="/icon.png" alt="Co-Founder AI" width={22} height={22} className="h-[22px] w-[22px] object-contain" />
              <span className="font-semibold">Co-Founder AI</span>
            </div>
            <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-white/50">
              Agentify your business. Your co-founder doesn&apos;t need equity, sleep, or a ping-pong table.
            </p>
          </div>

          <nav aria-label="Product">
            <p className="text-sm font-semibold text-white">Product</p>
            <ul className="mt-4 space-y-3 text-[13px] text-white/55">
              <li><Link href="/auth" className="transition hover:text-white" data-cursor="hover">Meet your co-founder</Link></li>
              <li><Link href="/#pricing" className="transition hover:text-white" data-cursor="hover">Pricing</Link></li>
              <li><Link href="/integrations" className="transition hover:text-white" data-cursor="hover">Integrations</Link></li>
              <li><a href="#top" className="transition hover:text-white" data-cursor="hover">Back to top</a></li>
            </ul>
          </nav>

          <nav aria-label="Legal">
            <p className="text-sm font-semibold text-white">Legal</p>
            <ul className="mt-4 space-y-3 text-[13px] text-white/55">
              <li><Link href="/privacy" className="transition hover:text-white" data-cursor="hover">Privacy Policy</Link></li>
              <li><Link href="/terms" className="transition hover:text-white" data-cursor="hover">Terms of Service</Link></li>
              <li><Link href="/cookies" className="transition hover:text-white" data-cursor="hover">Cookie Policy</Link></li>
            </ul>
          </nav>

          <nav aria-label="Open source">
            <p className="text-sm font-semibold text-white">Open Source</p>
            <ul className="mt-4 space-y-3 text-[13px] text-white/55">
              <li>
                <a
                  href="https://github.com/karthik132007/Co_Founder"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 transition hover:text-white"
                  data-cursor="hover"
                >
                  <svg viewBox="0 0 16 16" width="15" height="15" fill="currentColor" aria-hidden="true">
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
                  </svg>
                  <span>GitHub</span>
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/karthik132007/Co_Founder/blob/main/LICENSE"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-white"
                  data-cursor="hover"
                >
                  AGPL-3.0 License
                </a>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="transition hover:text-white"
                  data-cursor="hover"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 text-[13px] text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <span className="whitespace-nowrap">© 2026 Co-Founder AI. All rights reserved.</span>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2" aria-label="Legal">
            <Link href="/privacy" className="transition hover:text-white/70" data-cursor="hover">Privacy Policy</Link>
            <Link href="/terms" className="transition hover:text-white/70" data-cursor="hover">Terms of Service</Link>
            <Link href="/cookies" className="transition hover:text-white/70" data-cursor="hover">Cookie Policy</Link>
          </nav>
        </div>
      </div>
      <div aria-hidden="true" className="pointer-events-none mt-8 select-none overflow-hidden">
        <p
          className={
            tone === "dark"
              ? "bg-gradient-to-b from-white/25 to-white/[0.02] bg-clip-text text-center text-[clamp(3.5rem,13vw,11rem)] font-extrabold leading-[0.9] tracking-tight text-transparent"
              : "bg-gradient-to-b from-[#0f2214]/[0.22] to-[#0f2214]/[0.04] bg-clip-text text-center text-[clamp(3.5rem,13vw,11rem)] font-extrabold leading-[0.9] tracking-tight text-transparent"
          }
        >
          Co-Founder AI
        </p>
      </div>
    </footer>
  );
}
