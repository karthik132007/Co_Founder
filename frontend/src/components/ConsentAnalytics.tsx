"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";

// Google Analytics 4 measurement ID. Override with NEXT_PUBLIC_GA_ID in env.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-W5TRPHEGJD";

/**
 * Site-wide analytics: Vercel Analytics + Speed Insights + Google
 * Analytics (gtag.js). Loads on every page, no opt-in gate. See the
 * Cookie Policy (/cookies) for what each tool collects.
 */
export function ConsentAnalytics() {
  return (
    <>
      <Analytics />
      <SpeedInsights />
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}
