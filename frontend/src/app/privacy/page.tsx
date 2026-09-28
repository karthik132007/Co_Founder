import type { Metadata } from "next";
import PrivacyPolicyClient from "./PrivacyPolicyClient";

export const metadata: Metadata = {
  title: "Privacy Policy — Co-Founder AI",
  description:
    "How Co-Founder AI collects, uses, stores, and deletes your account, company, chat, file, and payment data.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return <PrivacyPolicyClient />;
}
