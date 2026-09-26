import type { Metadata } from "next";
import IntegrationsClient from "./IntegrationsClient";

export const metadata: Metadata = {
  title: "Integrations — Co-Founder AI",
  description:
    "Connect Gmail, Google Sheets, Google Drive, Google Calendar, Instagram, Shopify and more to your Co-Founder AI agent team.",
  alternates: {
    canonical: "/integrations",
  },
  openGraph: {
    title: "Integrations — Co-Founder AI",
    description:
      "Connect Gmail, Google Sheets, Google Drive, Google Calendar, Instagram, Shopify and more to your Co-Founder AI agent team.",
    url: "/integrations",
    siteName: "Co-Founder AI",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Co-Founder AI integrations",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Integrations — Co-Founder AI",
    description:
      "Connect Gmail, Google Sheets, Google Drive, Google Calendar, Instagram, Shopify and more to your Co-Founder AI agent team.",
    images: ["/og-image.png"],
  },
};

export default function IntegrationsPage() {
  return <IntegrationsClient />;
}
