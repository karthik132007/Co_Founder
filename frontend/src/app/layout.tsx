import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter, Instrument_Serif, JetBrains_Mono, Caveat } from "next/font/google";
import { MobileGate } from "@/components/landing/MobileGate";
import "./globals.css";
import "./landing.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-display-serif",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Co-Founder AI — Agentify your business",
  description:
    "An autonomous AI operating system for founders that thinks, researches, plans, builds, markets, and scales companies.",
  icons: {
    icon: "/icon.png",
  },
  openGraph: {
    title: "Co-Founder AI — Agentify your business",
    description:
      "An autonomous AI operating system for founders that thinks, researches, plans, builds, markets, and scales companies.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} ${caveat.variable}`}
      data-scroll-behavior="smooth"
    >
      <body className="antialiased">
        {children}
        <MobileGate />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
