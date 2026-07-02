import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" className="antialiased">
      <body className="bg-[#f8faff] text-[#111827]">
        {/* Ambient background orbs */}
        <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
          <div className="absolute -top-[15%] -right-[10%] w-[40vw] h-[40vw] bg-[#635BFF]/[0.06] rounded-full blur-[180px]" />
          <div className="absolute top-[40%] -left-[5%] w-[35vw] h-[35vw] bg-[#8B85FF]/[0.04] rounded-full blur-[160px]" />
          <div className="absolute -bottom-[10%] right-[5%] w-[30vw] h-[30vw] bg-[#635BFF]/[0.05] rounded-full blur-[150px]" />
        </div>
        {children}
      </body>
    </html>
  );
}
