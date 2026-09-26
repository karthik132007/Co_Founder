import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookie Policy — Co-Founder AI",
  description:
    "Which cookies and local storage Co-Founder AI actually uses, and what its analytics tools collect.",
  alternates: {
    canonical: "/cookies",
  },
};

type Row = {
  name: string;
  category: string;
  essential: boolean;
  purpose: string;
  duration: string;
  provider: string;
};

const ESSENTIAL_ROWS: Row[] = [
  {
    name: "cofounder_session",
    category: "Essential · authentication",
    essential: true,
    purpose:
      "Keeps you signed in. HMAC-signed, httpOnly session cookie set and read only by the backend; JavaScript cannot read it.",
    duration:
      "Per SESSION_MAX_AGE_DAYS on the backend (default 30 days); cleared on logout.",
    provider: "Co-Founder (backend API)",
  },
  {
    name: "cofounder.session (localStorage)",
    category: "Essential · authentication",
    essential: true,
    purpose:
      "Caches your signed-in user id, email, display name and onboarding state so the app shell loads without an extra round-trip.",
    duration: "Persists until you sign out or clear site data.",
    provider: "Co-Founder (frontend)",
  },
  {
    name: "Supabase auth session (localStorage)",
    category: "Essential · authentication",
    essential: true,
    purpose:
      "Stores the Supabase PKCE session used only for Google sign-in and the /auth/callback exchange. The backend verifies it and never trusts profile fields sent from the browser.",
    duration:
      "Managed by Supabase Auth (persist + auto-refresh); cleared on sign-out or when site data is cleared. Exact lifetime is governed by the Supabase project settings.",
    provider: "Supabase Auth",
  },
  {
    name: "cofounder-landing-theme (localStorage)",
    category: "Functional · preferences",
    essential: true,
    purpose: "Remembers your landing-page theme choice.",
    duration: "Persists until cleared.",
    provider: "Co-Founder (frontend)",
  },
  {
    name: "cofounder:tour:v1:* · cofounder:tour:armed:*",
    category: "Functional · preferences",
    essential: true,
    purpose:
      "Remembers whether the product tour was completed (localStorage) and whether it is armed for the session (sessionStorage).",
    duration:
      "Completion flag persists until cleared; armed flag lasts for the tab session.",
    provider: "Co-Founder (frontend)",
  },
  {
    name: "cofounder:onboarding-credit-award (sessionStorage)",
    category: "Functional · onboarding",
    essential: true,
    purpose: "One-time flag used to surface the onboarding credit grant.",
    duration: "Tab session only.",
    provider: "Co-Founder (frontend)",
  },
  {
    name: "cofounder_logo_* (sessionStorage)",
    category: "Functional · product state",
    essential: true,
    purpose:
      "Caches logo status and whether the add-logo prompt was dismissed, to avoid repeated checks.",
    duration: "Tab session only.",
    provider: "Co-Founder (frontend)",
  },
  {
    name: "cofounder:mobile-notice-seen (localStorage)",
    category: "Functional · preferences",
    essential: true,
    purpose: "Remembers that the small-screen notice was dismissed.",
    duration: "Persists until cleared.",
    provider: "Co-Founder (frontend)",
  },
];

const OPTIONAL_ROWS: Row[] = [
  {
    name: "Vercel Analytics + Speed Insights",
    category: "Analytics (always on)",
    essential: false,
    purpose:
      "Aggregate page-view and web-performance measurement. Loads on every page.",
    duration:
      "No cookies are set by Co-Founder for this. Measurement requests go to Vercel; retention on Vercel's side is governed by Vercel's policies (not verified in our code).",
    provider: "Vercel",
  },
  {
    name: "_ga · _ga_<container-id> (Google Analytics 4)",
    category: "Analytics (always on)",
    essential: false,
    purpose:
      "Aggregate page-view and usage measurement via gtag.js (measurement ID G-W5TRPHEGJD). Loads on every page.",
    duration:
      "_ga persists up to 2 years, _ga_<container-id> up to 2 years in this browser; governed by Google's policies. Requests go to www.googletagmanager.com / www.google-analytics.com.",
    provider: "Google Analytics",
  },
];

function Table({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left text-[13px] leading-relaxed">
        <thead>
          <tr className="text-[11px] uppercase tracking-[0.12em] text-[#5f6f63]">
            <th className="border-b border-[rgba(15,34,20,0.1)] py-2 pr-4 font-semibold">Name</th>
            <th className="border-b border-[rgba(15,34,20,0.1)] py-2 pr-4 font-semibold">Category</th>
            <th className="border-b border-[rgba(15,34,20,0.1)] py-2 pr-4 font-semibold">Purpose</th>
            <th className="border-b border-[rgba(15,34,20,0.1)] py-2 pr-4 font-semibold">Duration</th>
            <th className="border-b border-[rgba(15,34,20,0.1)] py-2 font-semibold">Provider</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="align-top text-[#2f3e32]">
              <td className="border-b border-[rgba(15,34,20,0.06)] py-3 pr-4 font-mono text-[12px] text-[#0f2214]">
                {r.name}
                <span
                  className={`mt-1 block w-fit rounded-full px-2 py-0.5 font-sans text-[11px] font-semibold ${
                    r.essential
                      ? "bg-[rgba(20,54,32,0.08)] text-[#143620]"
                      : "bg-[rgba(180,120,20,0.12)] text-[#7a4a00]"
                  }`}
                >
                  {r.essential ? "Essential" : "Optional"}
                </span>
              </td>
              <td className="border-b border-[rgba(15,34,20,0.06)] py-3 pr-4">{r.category}</td>
              <td className="border-b border-[rgba(15,34,20,0.06)] py-3 pr-4">{r.purpose}</td>
              <td className="border-b border-[rgba(15,34,20,0.06)] py-3 pr-4">{r.duration}</td>
              <td className="border-b border-[rgba(15,34,20,0.06)] py-3">{r.provider}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CookiePolicyPage() {
  return (
    <main className="min-h-screen bg-[#fdfcf8] text-[#0f2214]">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link href="/" className="text-[13px] font-medium text-[#5f6f63] hover:text-[#0f2214]">
          ← Back to home
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Cookie Policy</h1>
        <p className="mt-2 text-sm text-[#5f6f63]">
          Last updated: 24 September 2026 · Co-Founder AI · lists only storage and
          tracking actually present in the product
        </p>

        <div className="mt-8 space-y-8">
          <section className="card p-6">
            <h2 className="text-lg font-semibold">1. Analytics notice</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-[14px] leading-relaxed text-[#2f3e32]">
              <li>Essential sign-in and product storage always stays on — the app cannot work without it.</li>
              <li>Analytics (Vercel Analytics + Speed Insights + Google Analytics) load on every page for all visitors.</li>
              <li>Our footer links to this policy on every page.</li>
            </ul>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-semibold">2. Essential and functional storage (always on)</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-[#2f3e32]">
              These keep you signed in and remember product settings.
              The frontend never reads the httpOnly session cookie with
              JavaScript — it only asks the backend who is signed in.
            </p>
            <div className="mt-4">
              <Table rows={ESSENTIAL_ROWS} />
            </div>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-semibold">3. Analytics (always on)</h2>
            <div className="mt-4">
              <Table rows={OPTIONAL_ROWS} />
            </div>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-[14px] leading-relaxed text-[#2f3e32]">
              <li>Analytics do not break sign-in, chat, files, billing, or OAuth — they only measure usage.</li>
              <li>You can block analytics with a browser content blocker or by disabling JavaScript; the product still works.</li>
            </ul>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-semibold">4. Third-party content that loads with the product</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-[14px] leading-relaxed text-[#2f3e32]">
              <li>Razorpay Checkout script (checkout.razorpay.com) loads only on the billing page when you pay. Card details go directly to Razorpay — we never see or store them.</li>
              <li>Currency-rate lookups on the billing page (Frankfurter, ExchangeRate-API, jsDelivr currency API) fetch public FX rates; no account data is sent to them.</li>
              <li>Fonts load via next/font/google (build-optimised). Font delivery involves requests to Google&apos;s font infrastructure.</li>
              <li>The landing footer shows a Product Hunt badge image (api.producthunt.com). Loading it sends standard web-request data (such as IP address and referrer) to Product Hunt.</li>
              <li>Google OAuth (via Supabase) and Instagram/Meta OAuth run only when you choose to sign in or connect an integration.</li>
            </ul>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-semibold">5. What we do not use</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-[14px] leading-relaxed text-[#2f3e32]">
              <li>No Meta Pixel, and no advertising or cross-site tracking cookies.</li>
              <li>No JavaScript access to the session cookie (no document.cookie reads/writes for auth).</li>
              <li>No sale of personal information (see Privacy Policy).</li>
            </ul>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-semibold">6. Managing storage yourself</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-[14px] leading-relaxed text-[#2f3e32]">
              <li>Clearing site data / cookies in your browser signs you out and resets theme and tour choices.</li>
              <li>Blocking essential storage will break sign-in and core product features.</li>
            </ul>
          </section>
        </div>

        <p className="mt-8 text-[13px] text-[#5f6f63]">
          Also see our{" "}
          <Link href="/privacy" className="underline hover:text-[#0f2214]">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="/terms" className="underline hover:text-[#0f2214]">
            Terms and Conditions
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
