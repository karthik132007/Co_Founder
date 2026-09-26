import type { Metadata } from "next";
import { ContactClient } from "./ContactClient";

export const metadata: Metadata = {
  title: "Contact — Co-Founder AI",
  description:
    "Talk to us — support, billing, feedback or feature requests. Raise a ticket and track its status.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  return <ContactClient />;
}
