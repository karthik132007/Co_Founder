import type { Metadata } from "next";
import CookiesClient from "./CookiesClient";

export const metadata: Metadata = {
  title: "Cookie Policy — Co-Founder AI",
  description:
    "Which cookies and local storage Co-Founder AI actually uses, and what its analytics tools collect.",
  alternates: {
    canonical: "/cookies",
  },
};

export default function CookiePolicyPage() {
  return <CookiesClient />;
}
