import type { Metadata } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";
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
      className={`${inter.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}
      data-scroll-behavior="smooth"
    >
      <body className="antialiased">{children}</body>
    </html>
  );
}
