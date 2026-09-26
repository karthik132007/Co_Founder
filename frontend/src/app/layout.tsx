import type { Metadata } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono, Caveat } from "next/font/google";
import { MobileGate } from "@/components/landing/MobileGate";
import { ConsentAnalytics } from "@/components/ConsentAnalytics";
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
  metadataBase: new URL("https://get-cofounder.tech"),
  title: "Co-Founder AI — AI Agents for Founders",
  description:
    "Co-Founder AI gives founders specialized AI agents for research, planning, marketing, design, data analysis and business execution.",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
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

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Co-Founder AI",
  url: "https://get-cofounder.tech",
  logo: "https://get-cofounder.tech/icon.png",
  sameAs: ["https://github.com/karthik132007/Co_Founder"],
};

const softwareApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Co-Founder AI",
  url: "https://get-cofounder.tech",
  description:
    "Co-Founder AI gives founders specialized AI agents for research, planning, marketing, design, data analysis and business execution.",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  author: {
    "@type": "Organization",
    name: "Co-Founder AI",
    url: "https://get-cofounder.tech",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(softwareApplicationJsonLd).replace(/</g, "\\u003c"),
          }}
        />
        {children}
        <MobileGate />
        <ConsentAnalytics />
      </body>
    </html>
  );
}
