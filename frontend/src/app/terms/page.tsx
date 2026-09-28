import type { Metadata } from "next";
import TermsClient from "./TermsClient";

export const metadata: Metadata = {
  title: "Terms and Conditions — Co-Founder AI",
  description:
    "Terms governing Co-Founder AI accounts, agent outputs, credits, payments, connections, and acceptable use.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return <TermsClient />;
}
