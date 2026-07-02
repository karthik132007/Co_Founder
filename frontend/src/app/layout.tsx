import type { Metadata } from "next";
import { Arvo } from "next/font/google";
import "./globals.css";

const arvo = Arvo({
  variable: "--font-arvo",
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Co-founder.ai — Your AI Startup Team",
  description:
    "A collaborative multi-agent AI platform that helps founders build, grow, and scale their startups. Strategy, marketing, finance, development, and research — all from one platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${arvo.variable} antialiased`}>
      <body>
        <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-[#fafcff]">
          {/* Subtle Dynamic Background Circles in Corners */}
          <div className="absolute -top-[10%] -left-[10%] w-[35vw] h-[35vw] bg-[#ffb3c6]/20 rounded-full blur-[140px] animate-blob mix-blend-multiply" />
          <div className="absolute top-[0%] -right-[10%] w-[40vw] h-[40vw] bg-[#a0c4ff]/15 rounded-full blur-[150px] animate-blob animation-delay-2000 mix-blend-multiply" />
          <div className="absolute -bottom-[20%] -right-[10%] w-[45vw] h-[45vw] bg-[#caf0f8]/25 rounded-full blur-[140px] animate-blob animation-delay-4000 mix-blend-multiply" />
          <div className="absolute -bottom-[10%] -left-[10%] w-[30vw] h-[30vw] bg-[#90e0ef]/10 rounded-full blur-[120px] animate-blob animation-delay-6000 mix-blend-multiply" />
        </div>
        {children}
      </body>
    </html>
  );
}
