import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "Co-Founder AI — AI Agents for Founders",
  description:
    "Co-Founder AI gives founders specialized AI agents for research, planning, marketing, design, data analysis and business execution.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Co-Founder AI — AI Agents for Founders",
    description:
      "Co-Founder AI gives founders specialized AI agents for research, planning, marketing, design, data analysis and business execution.",
    url: "/",
    siteName: "Co-Founder AI",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Co-Founder AI — AI Agents for Founders",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Co-Founder AI — AI Agents for Founders",
    description:
      "Co-Founder AI gives founders specialized AI agents for research, planning, marketing, design, data analysis and business execution.",
    images: ["/og-image.png"],
  },
};

export default function HomePage() {
  return <HomeClient />;
}
