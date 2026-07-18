import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cofounder.ai — Your AI Startup Team",
  description:
    "A collaborative multi-agent AI platform that helps founders build, grow, and scale their startups. Strategy, marketing, finance, development, and research — all from one platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} data-scroll-behavior="smooth">
      <body className="bg-[#fafafa] text-[#0a0a0a] antialiased">{children}</body>
    </html>
  );
}
