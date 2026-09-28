"use client";

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";
import { CONSENT_EVENT, getConsent, type ConsentChoice } from "@/lib/consent";

// Google Analytics 4 measurement ID. Override with NEXT_PUBLIC_GA_ID in env.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-W5TRPHEGJD";

/**
 * Site-wide analytics: Vercel Analytics + Speed Insights + Google
 * Analytics (gtag.js). Rendered ONLY after the user accepts analytics
 * (see CookieBanner + /cookies "Your cookie choices"). Rejecting — or never
 * deciding — loads none of these, and the rest of the app is unaffected.
 */
export function ConsentAnalytics() {
  const [choice, setChoice] = useState<ConsentChoice | null>(() => getConsent());

  useEffect(() => {
    const onUpdate = (e: Event) => setChoice((e as CustomEvent<ConsentChoice>).detail);
    window.addEventListener(CONSENT_EVENT, onUpdate);
    return () => window.removeEventListener(CONSENT_EVENT, onUpdate);
  }, []);

  if (choice !== "accepted") return null;

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
