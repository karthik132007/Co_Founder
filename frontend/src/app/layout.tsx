import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./landing.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
    <html lang="en" className={inter.variable} data-scroll-behavior="smooth">
      <body className="antialiased">{children}</body>
    </html>
  );
}
