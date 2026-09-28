"use client";

import { useEffect, useState } from "react";
import LegalPageShell, {
  LEGAL_BODY,
  LEGAL_LIST,
  type LegalPanel,
} from "@/components/legal/LegalPageShell";
import {
  CONSENT_EVENT,
  getConsent,
  setConsent,
  type ConsentChoice,
} from "@/lib/consent";

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
    category: "Necessary · authentication",
    essential: true,
    purpose:
      "Keeps you signed in. HMAC-signed, httpOnly session cookie set and read only by the backend; JavaScript cannot read it.",
    duration:
      "Per SESSION_MAX_AGE_DAYS on the backend (default 30 days); cleared on logout.",
    provider: "Co-Founder (backend API)",
  },
  {
    name: "cofounder.session (localStorage)",
    category: "Necessary · authentication",
    essential: true,
    purpose:
      "Caches your signed-in user id, email, display name and onboarding state so the app shell loads without an extra round-trip.",
    duration: "Persists until you sign out or clear site data.",
    provider: "Co-Founder (frontend)",
  },
  {
    name: "Supabase auth session (localStorage)",
    category: "Necessary · authentication",
    essential: true,
    purpose:
      "Stores the Supabase PKCE session used only for Google sign-in and the /auth/callback exchange. The backend verifies it and never trusts profile fields sent from the browser.",
    duration:
      "Managed by Supabase Auth (persist + auto-refresh); cleared on sign-out or when site data is cleared. Exact lifetime is governed by the Supabase project settings.",
    provider: "Supabase Auth",
  },
  {
    name: "cofounder-consent (localStorage)",
    category: "Necessary · preferences",
    essential: true,
    purpose:
      "Remembers your analytics choice (accept or reject) so the cookie banner does not ask again and analytics stay in the state you chose.",
    duration: "Persists until you clear site data; change it anytime in section 7.",
    provider: "Co-Founder (frontend)",
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
    name: "cofounder-legal-theme (localStorage)",
    category: "Functional · preferences",
    essential: true,
    purpose:
      "Remembers your light/dark theme choice on the Privacy, Terms, and Cookie pages.",
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
    category: "Analytics (optional)",
    essential: false,
    purpose:
      "Aggregate page-view and web-performance measurement. Loads only after you accept analytics (cookie banner or section 7 below) — never before.",
    duration:
      "No cookies are set by Co-Founder for this. Measurement requests go to Vercel; retention on Vercel's side is governed by Vercel's policies (not verified in our code).",
    provider: "Vercel",
  },
  {
    name: "_ga · _ga_<container-id> (Google Analytics 4)",
    category: "Analytics (optional)",
    essential: false,
    purpose:
      "Aggregate page-view and usage measurement via gtag.js (measurement ID G-W5TRPHEGJD unless NEXT_PUBLIC_GA_ID is set). Loads only after you accept analytics — never before.",
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
          <tr className="text-[11px] uppercase tracking-[0.12em] text-[var(--legal-faint)]">
            <th className="border-b border-[var(--legal-border)] py-2 pr-4 font-semibold">Name</th>
            <th className="border-b border-[var(--legal-border)] py-2 pr-4 font-semibold">Category</th>
            <th className="border-b border-[var(--legal-border)] py-2 pr-4 font-semibold">Purpose</th>
            <th className="border-b border-[var(--legal-border)] py-2 pr-4 font-semibold">Duration</th>
            <th className="border-b border-[var(--legal-border)] py-2 font-semibold">Provider</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="align-top text-[var(--legal-body)]">
              <td className="border-b border-[var(--legal-border)] py-3 pr-4 font-mono text-[12px] text-[var(--legal-fg)]">
                {r.name}
                <span
                  className={`mt-1 block w-fit rounded-full px-2 py-0.5 font-sans text-[11px] font-semibold ${
                    r.essential
                      ? "bg-[var(--legal-chip)] text-[var(--legal-fg)]"
                      : "bg-amber-500/10 text-[#b45309]"
                  }`}
                >
                  {r.essential ? "Necessary" : "Optional"}
                </span>
              </td>
              <td className="border-b border-[var(--legal-border)] py-3 pr-4">{r.category}</td>
              <td className="border-b border-[var(--legal-border)] py-3 pr-4">{r.purpose}</td>
              <td className="border-b border-[var(--legal-border)] py-3 pr-4">{r.duration}</td>
              <td className="border-b border-[var(--legal-border)] py-3">{r.provider}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Live analytics toggle: shows the stored choice and lets it be changed. */
function ConsentSettings() {
  const [choice, setChoice] = useState<ConsentChoice | null>(() => getConsent());

  useEffect(() => {
    const onUpdate = (e: Event) => setChoice((e as CustomEvent<ConsentChoice>).detail);
    window.addEventListener(CONSENT_EVENT, onUpdate);
    return () => window.removeEventListener(CONSENT_EVENT, onUpdate);
  }, []);

  return (
    <div className="rounded-2xl border border-[var(--legal-border)] bg-[var(--legal-panel)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[14px] font-semibold text-[var(--legal-fg)]">Analytics</p>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
            choice === "accepted"
              ? "bg-emerald-500/15 text-emerald-500"
              : choice === "rejected"
                ? "bg-[var(--legal-chip)] text-[var(--legal-muted)]"
                : "bg-amber-500/10 text-[#b45309]"
          }`}
        >
          {choice === "accepted" ? "On" : choice === "rejected" ? "Off" : "Not decided yet"}
        </span>
      </div>
      <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--legal-body)]">
        Vercel Analytics, Speed Insights, and Google Analytics. Necessary
        functionality — sign-in, dashboard, payments, agents — works the same
        either way.
      </p>
      <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
        <button
          onClick={() => setConsent("rejected")}
          className="flex-1 rounded-xl border border-[var(--legal-border)] bg-transparent px-4 py-2.5 text-[13px] font-semibold text-[var(--legal-fg)] hover:bg-[var(--legal-hover)] transition-colors"
        >
          Reject analytics
        </button>
        <button
          onClick={() => setConsent("accepted")}
          className="flex-1 rounded-xl bg-white px-4 py-2.5 text-[13px] font-bold text-black hover:bg-neutral-200 transition-colors"
        >
          Accept analytics
        </button>
      </div>
    </div>
  );
}

export default function CookiesClient() {
  const panels: LegalPanel[] = [
    {
      id: "analytics-notice",
      num: 1,
      short: "How consent works",
      title: "1. How consent works",
      body: (
        <ul className={LEGAL_LIST}>
          <li><strong className="text-[var(--legal-fg)]">Necessary</strong> storage (sign-in, security, preferences) is always on — the app cannot work without it.</li>
          <li><strong className="text-[var(--legal-fg)]">Analytics</strong> (Vercel Analytics + Speed Insights + Google Analytics) are optional and off by default. A cookie banner asks on your first visit; nothing optional loads until you choose Accept.</li>
          <li>You can change your choice anytime in section 7. Rejecting analytics never breaks sign-in, chat, files, billing, or OAuth.</li>
        </ul>
      ),
    },
    {
      id: "essential-storage",
      num: 2,
      short: "Necessary storage",
      title: "2. Necessary storage (always on)",
      body: (
        <>
          <p className={LEGAL_BODY}>
            These keep you signed in, secure, and remember product settings —
            including your cookie choice itself.
            The frontend never reads the httpOnly session cookie with
            JavaScript — it only asks the backend who is signed in.
          </p>
          <div className="mt-4">
            <Table rows={ESSENTIAL_ROWS} />
          </div>
        </>
      ),
    },
    {
      id: "analytics",
      num: 3,
      short: "Analytics",
      title: "3. Analytics (optional)",
      body: (
        <>
          <div className="mt-1">
            <Table rows={OPTIONAL_ROWS} />
          </div>
          <ul className={LEGAL_LIST}>
            <li>Optional analytics load only after you accept — via the cookie banner or section 7. Until then, no analytics requests, cookies, or beacons from these providers run in your browser.</li>
            <li>Analytics only measure aggregate usage; they do not gate any feature. You can also block them with a browser content blocker or by disabling JavaScript; the product still works.</li>
          </ul>
        </>
      ),
    },
    {
      id: "third-party",
      num: 4,
      short: "Third-party content",
      title: "4. Third-party content that loads with the product",
      body: (
        <ul className={LEGAL_LIST}>
          <li>Razorpay Checkout script (checkout.razorpay.com) loads only on the billing page when you pay. Card details go directly to Razorpay — we never see or store them.</li>
          <li>Currency-rate lookups on the billing page (Frankfurter, ExchangeRate-API, jsDelivr currency API) fetch public FX rates; no account data is sent to them.</li>
          <li>Fonts load via next/font/google (build-optimised). Font delivery involves requests to Google&apos;s font infrastructure.</li>
          <li>Google OAuth (via Supabase) and Instagram/Meta OAuth run only when you choose to sign in or connect an integration.</li>
        </ul>
      ),
    },
    {
      id: "do-not-use",
      num: 5,
      short: "What we don't use",
      title: "5. What we do not use",
      body: (
        <ul className={LEGAL_LIST}>
          <li>No Meta Pixel, and no advertising or cross-site tracking cookies.</li>
          <li>No JavaScript access to the session cookie (no document.cookie reads/writes for auth).</li>
          <li>No sale of personal information (see Privacy Policy).</li>
        </ul>
      ),
    },
    {
      id: "managing",
      num: 6,
      short: "Managing storage",
      title: "6. Managing storage yourself",
      body: (
        <ul className={LEGAL_LIST}>
          <li>Clearing site data / cookies in your browser signs you out and resets theme, tour, and analytics choices.</li>
          <li>Blocking necessary storage will break sign-in and core product features.</li>
        </ul>
      ),
    },
    {
      id: "choices",
      num: 7,
      short: "Your choices",
      title: "7. Your cookie choices",
      body: (
        <>
          <p className={LEGAL_BODY}>
            Your choice is stored on this device only and the banner never asks
            again afterwards. Change it here anytime — the analytics on this page
            load or stop on your next navigation.
          </p>
          <div className="mt-4">
            <ConsentSettings />
          </div>
        </>
      ),
    },
  ];

  return (
    <LegalPageShell
      title="Cookie Policy"
      updated="24 September 2026"
      panels={panels}
    />
  );
}
