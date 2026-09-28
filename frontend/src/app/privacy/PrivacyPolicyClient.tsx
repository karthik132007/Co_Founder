"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  LEGAL_BODY,
  LEGAL_LINK,
  LEGAL_LIST,
  type LegalPanel,
} from "@/components/legal/LegalPageShell";
import SiteFooter from "@/components/landing/SiteFooter";
import {
  PRIVACY_GITHUB_URL,
  getPrivacyEmail,
} from "@/lib/privacy";
import { LegalThemeToggle, useLegalTheme } from "@/components/legal/legalTheme";

type DocView = "main" | "google" | "meta";

const VIEWS: { id: DocView; label: string }[] = [
  { id: "main", label: "Main" },
  { id: "google", label: "Google" },
  { id: "meta", label: "Meta" },
];

type AccessPoint = {
  id: string;
  name: string;
  scopes: string[];
  accesses: string;
  agents: string;
  control: string;
};

/* Exact scopes requested by the system (connections/google/google_connection_manager.py). */
const GOOGLE_ACCESS: AccessPoint[] = [
  {
    id: "g-identity",
    name: "Account identity",
    scopes: ["openid", "email"],
    accesses: "Confirms which Google account is bound to your workspace and labels the connection with its email address.",
    agents: "Agents never see this as a separate permission — it is the identity behind every Google connector below.",
    control: "Disconnecting any Google connector removes the whole shared grant.",
  },
  {
    id: "g-gmail-read",
    name: "Gmail reading",
    scopes: ["gmail.readonly"],
    accesses: "Searches your inbox and reads matching messages in full: sender, subject, date, body text, and attachment names.",
    agents: "Agents summarize threads and find the message a reply should be drafted for. Bodies are fetched one message at a time, never bulk-exported.",
    control: "Settings → Privacy → Google data → Gmail reading.",
  },
  {
    id: "g-gmail-draft",
    name: "Gmail drafts",
    scopes: ["gmail.compose"],
    accesses: "Creates draft emails inside your mailbox, optionally threaded as a reply.",
    agents: "Draft-only by design — there is no send tool, so nothing ever leaves your outbox without you pressing Send in Gmail yourself.",
    control: "Settings → Privacy → Google data → Gmail drafts.",
  },
  {
    id: "g-sheets",
    name: "Google Sheets",
    scopes: ["spreadsheets"],
    accesses: "Reads cells from spreadsheets you share a link for, and writes ranges, appends rows, or clears ranges on your explicit request.",
    agents: "Reads run freely; every write needs your confirmation of the spreadsheet, range, and values first.",
    control: "Settings → Privacy → Google data → Google Sheets.",
  },
  {
    id: "g-drive",
    name: "Google Drive",
    scopes: ["drive"],
    accesses: "Searches your Drive by name or full text, reads file metadata and text exports, and uploads files you approve.",
    agents: "Searches and reads run freely; uploads and new folders need your explicit confirmation first.",
    control: "Settings → Privacy → Google data → Google Drive.",
  },
  {
    id: "g-calendar",
    name: "Google Calendar",
    scopes: ["calendar.events"],
    accesses: "Reads events on your primary calendar and creates, changes, or deletes events on request.",
    agents: "Schedule reads and free-slot searches run freely; creating or changing events needs your confirmation, and guests are never emailed unless you ask.",
    control: "Settings → Privacy → Google data → Google Calendar.",
  },
];

/* Exact permissions requested by the system (backend/api/auth.py Instagram login). */
const META_ACCESS: AccessPoint[] = [
  {
    id: "m-basic",
    name: "Profile & media",
    scopes: ["instagram_business_basic"],
    accesses: "Reads your Instagram profile (username, account type, media count) and your recent posts (caption, media type, permalink, date).",
    agents: "Agents use the profile to confirm which account is bound and read recent media for engagement insights.",
    control: "Settings → Privacy → Meta data → Instagram profile / Instagram media.",
  },
  {
    id: "m-publish",
    name: "Publishing",
    scopes: ["instagram_business_content_publish"],
    accesses: "Creates a media container from a public image URL you approve and publishes it to your account.",
    agents: "Publishing always needs your explicit approval first — agents can prepare a post but never publish silently.",
    control: "Settings → Privacy → Meta data → Instagram publishing.",
  },
  {
    id: "m-comments",
    name: "Comments",
    scopes: ["instagram_business_manage_comments"],
    accesses: "Requested at connect time so comment features keep working; no agent tool currently reads or writes comments.",
    agents: "Unused today — turning off the profile, media, and publishing switches above covers every Instagram tool the agents have.",
    control: "Reserved; disconnect Instagram from Plugins to revoke it entirely.",
  },
  {
    id: "m-messages",
    name: "Messages",
    scopes: ["instagram_business_manage_messages"],
    accesses: "Requested at connect time so messaging features keep working; no agent tool currently reads or sends messages.",
    agents: "Unused today — turning off the profile, media, and publishing switches above covers every Instagram tool the agents have.",
    control: "Reserved; disconnect Instagram from Plugins to revoke it entirely.",
  },
];

function useScrollSpy(ids: string[]) {
  const key = ids.join("|");
  const [active, setActive] = useState(ids[0] ?? "");
  useEffect(() => {
    const list = key.split("|").filter(Boolean);
    setActive(list[0] ?? "");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-20% 0px -65% 0px" },
    );
    for (const id of list) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return [active, setActive] as const;
}

function AccessBlock({ point }: { point: AccessPoint }) {
  return (
    <section id={point.id} className="scroll-mt-20">
      <h2 className="text-xl font-semibold tracking-tight text-[var(--legal-fg)]">{point.name}</h2>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {point.scopes.map((s) => (
          <code key={s} className="rounded-md bg-[var(--legal-chip)] px-2 py-0.5 font-mono text-[12px] text-[var(--legal-fg)]">
            {s}
          </code>
        ))}
      </div>
      <dl className="mt-4 space-y-3 text-[14px] leading-relaxed">
        <div>
          <dt className="font-semibold text-[var(--legal-fg)]">What it accesses</dt>
          <dd className="mt-0.5 text-[var(--legal-body)]">{point.accesses}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[var(--legal-fg)]">What agents do with it</dt>
          <dd className="mt-0.5 text-[var(--legal-body)]">{point.agents}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[var(--legal-fg)]">Your control</dt>
          <dd className="mt-0.5 text-[var(--legal-body)]">{point.control}</dd>
        </div>
      </dl>
    </section>
  );
}

export default function PrivacyPolicyClient() {
  const privacyEmail = getPrivacyEmail();
  const { theme, toggle } = useLegalTheme();
  const [view, setView] = useState<DocView>(() => {
    if (typeof window === "undefined") return "main";
    const h = window.location.hash.replace("#", "");
    return h === "google" || h === "meta" ? h : "main";
  });

  const panels: LegalPanel[] = useMemo(
    () => [
      {
        id: "data-we-collect",
        num: 1,
        short: "Data we collect",
        title: "1. Data we collect — and why",
        body: (
          <ul className={LEGAL_LIST}>
            <li>
              <strong className="text-[var(--legal-fg)]">Account information:</strong> email address, password hash, and
              display name. Used to create your account, sign you in, and identify
              your workspace. Google sign-in additionally stores the OAuth identity
              needed to recognise a returning Google account.
            </li>
            <li>
              <strong className="text-[var(--legal-fg)]">Company / workspace information:</strong> company name,
              description, industry, brand tone, and logo image. Used to personalise
              the workspace and agent outputs. You provide this during onboarding and
              can edit it on the Profile page.
            </li>
            <li>
              <strong className="text-[var(--legal-fg)]">Content you provide:</strong> chat messages, uploaded files and
              their descriptions. Used to answer your questions, retrieve relevant
              document passages, and generate requested outputs.
            </li>
            <li>
              <strong className="text-[var(--legal-fg)]">AI prompts, outputs and derived data:</strong> conversation
              history, session titles, chat memories, and document embeddings. Used to
              keep context across messages, retrieve relevant knowledge, and operate
              the agent pipeline.
            </li>
            <li>
              <strong className="text-[var(--legal-fg)]">Authentication and session data:</strong> a signed, httpOnly
              session cookie plus cached sign-in state in the browser. Used to keep
              you signed in securely without exposing the session token to JavaScript.
            </li>
            <li>
              <strong className="text-[var(--legal-fg)]">Connected integrations (only if you connect them):</strong>{" "}
              a Google OAuth grant shared by the Gmail, Google Sheets, Google Drive,
              and Google Calendar connectors (exact scopes are listed under the{" "}
              <a href="#google" onClick={(e) => { e.preventDefault(); switchView("google"); }} className={LEGAL_LINK}>
                Google
              </a>{" "}
              section), and the Instagram long-lived token (permissions listed under{" "}
              <a href="#meta" onClick={(e) => { e.preventDefault(); switchView("meta"); }} className={LEGAL_LINK}>
                Meta
              </a>
              ). Tokens are stored server-side (encrypted at rest), kept out
              of the browser, and used only to act on the connected account on your
              behalf. You can turn off an agent&apos;s access to any of these
              categories at any time in Settings → Privacy without disconnecting
              the integration.
            </li>
            <li>
              <strong className="text-[var(--legal-fg)]">Billing information:</strong> credit balance, order and payment
              identifiers, amounts, and payment status. Used to top up credits, verify
              payments server-side, and keep a payment history. Card details go
              directly to Razorpay Checkout — we never see or store them.
            </li>
            <li>
              <strong className="text-[var(--legal-fg)]">Technical and log information:</strong> IP-address-based rate
              limiting, error and application logs (which may include account
              identifiers such as email or company name), and aggregate usage /
              performance measurement on every visit. Used for
              security, abuse prevention, debugging, and reliability.
            </li>
          </ul>
        ),
      },
      {
        id: "how-we-use",
        num: 2,
        short: "How we use data",
        title: "2. How we use data",
        body: (
          <ul className={LEGAL_LIST}>
            <li>Operate the product: authenticate you, resolve your workspace, run the agent pipeline, and stream answers.</li>
            <li>Provide connected features you request, such as reading connected mail or sheets and publishing content you approve.</li>
            <li>Process payments: create and verify Razorpay orders server-side, credit your balance, and record payment history.</li>
            <li>Keep the service safe and reliable: rate limiting, fraud and abuse prevention, debugging, and aggregate performance analytics.</li>
            <li>
              We do not sell your personal information. Prompts and retrieved context
              are sent to the AI, search, and execution providers needed to answer
              (such as OpenRouter-hosted models, Tavily, SerpAPI, and the e2b code
              sandbox) — that is processing on your behalf, not a sale.
            </li>
          </ul>
        ),
      },
      {
        id: "sharing",
        num: 3,
        short: "Third-party processors",
        title: "3. Third-party processors",
        body: (
          <>
            <ul className={LEGAL_LIST}>
              <li>Supabase (authentication, database, file storage).</li>
              <li>OpenRouter-hosted AI models (chat, embeddings, image generation).</li>
              <li>Tavily and SerpAPI (web research when the agents need it).</li>
              <li>e2b (isolated code execution for data analysis).</li>
              <li>Razorpay (payments — receives order details; card details go directly to Razorpay).</li>
              <li>Google (OAuth, Gmail and Sheets APIs — only when you connect them).</li>
              <li>Meta / Instagram (OAuth and publishing — only when you connect it).</li>
              <li>Vercel (hosting, plus analytics and performance measurement).</li>
              <li>Google Analytics (page-view and usage measurement).</li>
            </ul>
            <p className={LEGAL_BODY}>
              Each provider receives only what it needs for its function and is
              governed by its own privacy terms. While Google connectors are in
              Testing mode, reconnect may be required periodically and only allowlisted
              test users can connect.
            </p>
          </>
        ),
      },
      {
        id: "cookies",
        num: 4,
        short: "Cookies and tracking",
        title: "4. Cookies and tracking",
        body: (
          <>
            <ul className={LEGAL_LIST}>
              <li>Essential sign-in and product storage is always on; the app cannot work without it.</li>
              <li>Analytics (Vercel Analytics + Speed Insights + Google Analytics) load on every page for all visitors.</li>
              <li>We use no advertising cookies and no Meta Pixel.</li>
            </ul>
            <p className={LEGAL_BODY}>
              Details are in our{" "}
              <Link href="/cookies" className={LEGAL_LINK}>
                Cookie Policy
              </Link>
              .
            </p>
          </>
        ),
      },
      {
        id: "retention",
        num: 5,
        short: "Retention and deletion",
        title: "5. Retention and deletion",
        body: (
          <ul className={LEGAL_LIST}>
            <li>Chat sessions, messages, files, logos, and connections persist until you delete them.</li>
            <li>You can delete a chat session, delete a file, or disconnect an integration at any time from the product; deleting a file removes it from storage and from retrieval.</li>
            <li>Signing out clears the session cookie; sessions also expire automatically.</li>
            <li>
              There is not yet a self-serve Delete Account button. For account export
              or full deletion, contact us (see below) and we will handle your request.
            </li>
            <li>Backups and queued background work may retain copies briefly after deletion.</li>
          </ul>
        ),
      },
      {
        id: "security",
        num: 6,
        short: "Security",
        title: "6. Security",
        body: (
          <ul className={LEGAL_LIST}>
            <li>Passwords are stored as Argon2 hashes — plaintext passwords are never stored.</li>
            <li>Sign-in uses short-lived, single-use OAuth state, validated redirect targets, and per-IP rate limiting.</li>
            <li>Payment secrets stay on the backend; payment verification runs server-side.</li>
            <li>Connected OAuth tokens are kept server-side and stored encrypted at rest.</li>
            <li>No system is perfectly secure — do not upload secrets, credentials, or data you lack rights to process.</li>
          </ul>
        ),
      },
      {
        id: "transfers",
        num: 7,
        short: "International transfers",
        title: "7. International data transfers",
        body: (
          <p className={LEGAL_BODY}>
            We and our processors may store and process data in countries other than
            your own (for example where our hosting, database, AI, payment, or OAuth
            providers operate). Where required, we rely on appropriate safeguards for
            such transfers — <em>requires legal review to confirm the transfer
            mechanism for each provider</em>.
          </p>
        ),
      },
      {
        id: "rights",
        num: 8,
        short: "Your rights",
        title: "8. Your rights and how to request",
        body: (
          <>
            <ul className={LEGAL_LIST}>
              <li>You can access and correct your company profile from the Profile page, list and download files from Drive, review payment history from Billing, and disconnect integrations from Plugins at any time.</li>
              <li>
                You can limit what the AI team may use without disconnecting
                anything: Settings → Privacy lets you switch off categories such as
                Gmail reading or drafting, Google Sheets, Google Drive, Google
                Calendar, Instagram profile, media, or publishing, uploaded files,
                chat history, and your company profile. Switching a category off
                hides those tools from the agents immediately and can be switched
                back on at any time.
              </li>
              <li>
                For access, correction, export, or deletion requests, contact us
                {privacyEmail ? (
                  <>
                    {" "}at{" "}
                    <a href={`mailto:${privacyEmail}`} className={LEGAL_LINK}>
                      {privacyEmail}
                    </a>
                  </>
                ) : (
                  <>
                    {" "}via the GitHub repository:{" "}
                    <a
                      href={PRIVACY_GITHUB_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={LEGAL_LINK}
                    >
                      {PRIVACY_GITHUB_URL}
                    </a>
                  </>
                )}
                .
              </li>
              <li>We verify requests using your account email address before acting on them.</li>
            </ul>
          </>
        ),
      },
      {
        id: "eu-uk",
        num: 9,
        short: "EU / EEA / UK",
        title: "9. EU / EEA / UK information",
        body: (
          <>
            <p className={LEGAL_BODY}>
              If you are in the EU, EEA, or UK, you have the following rights (subject
              to applicable law and exceptions): right of access, right to
              rectification, right to erasure, right to data portability, right to
              restriction of processing, right to object, right to withdraw consent at
              any time (for processing based on consent, such as
              connected integrations you authorised), and the right to complain to your
              supervisory authority.
            </p>
            <p className={LEGAL_BODY}>
              Our understood legal basis for major processing —{" "}
              <em>requires legal review to confirm</em>:
            </p>
            <ul className={LEGAL_LIST}>
              <li>Account, workspace, content, and billing processing: performance of the service you requested (contract) — requires legal review.</li>
              <li>Connected Google / Instagram integrations: consent you give when you authorise the connection (withdrawable by disconnecting) — requires legal review.</li>
              <li>Analytics (Vercel + Google Analytics page-view and usage measurement): legitimate interests — requires legal review.</li>
              <li>Security, fraud prevention, rate limiting, and debugging: legitimate interests — requires legal review.</li>
              <li>Payment and tax records: legal obligations — requires legal review.</li>
            </ul>
          </>
        ),
      },
      {
        id: "california",
        num: 10,
        short: "California",
        title: "10. California privacy information",
        body: (
          <>
            <ul className={LEGAL_LIST}>
              <li>Depending on applicable law, California residents may have the right to know / access, delete, and correct personal information.</li>
              <li>You may have the right to opt out of any sale or sharing of personal information. We do not sell personal information.</li>
              <li>We will not discriminate against you for exercising your privacy rights.</li>
              <li>
                To exercise these rights, use the contact method in section 8. We verify
                requests via your account email. An authorised agent may submit a
                request on your behalf with appropriate authorisation —{" "}
                <em>requires legal review to confirm the agent-verification procedure</em>.
              </li>
            </ul>
            <p className="mt-3 text-[13px] leading-relaxed text-[var(--legal-faint)]">
              This notice does not claim Co-Founder meets any specific California
              applicability threshold — <em>requires legal/business review</em>.
            </p>
          </>
        ),
      },
      {
        id: "changes",
        num: 11,
        short: "Changes",
        title: "11. Changes to this policy",
        body: (
          <p className={LEGAL_BODY}>
            We may update this policy as the product evolves; material changes will be
            reflected in the Last updated date above. Continued use after changes
            constitutes acceptance.
          </p>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const sectionIds = useMemo(() => {
    if (view === "google") return GOOGLE_ACCESS.map((a) => a.id);
    if (view === "meta") return META_ACCESS.map((a) => a.id);
    return panels.map((p) => p.id);
  }, [view, panels]);

  const [active, setActive] = useScrollSpy(sectionIds);

  function switchView(next: DocView) {
    setView(next);
    window.history.replaceState(null, "", next === "main" ? "/privacy" : `/privacy#${next}`);
    window.scrollTo({ top: 0 });
  }

  const jump = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActive(id);
  };

  const rightNav: { id: string; label: string }[] =
    view === "google"
      ? GOOGLE_ACCESS.map((a) => ({ id: a.id, label: a.name }))
      : view === "meta"
        ? META_ACCESS.map((a) => ({ id: a.id, label: a.name }))
        : panels.map((p) => ({ id: p.id, label: `${p.num}. ${p.short}` }));

  const viewIntro: Record<Exclude<DocView, "main">, { title: string; body: string }> = {
    google: {
      title: "Google access",
      body: "One OAuth grant per workspace covers every Google connector below. Each access point lists the exact scope the system requests, what it touches, what the agents do with it, and the Settings → Privacy switch that turns it off. Tokens are encrypted at rest and never reach the browser.",
    },
    meta: {
      title: "Meta access",
      body: "Connecting Instagram requests the four permissions below and stores one long-lived token. Each access point lists what it touches, what the agents do with it, and the Settings → Privacy switch that turns it off. Comment and message permissions are requested at connect time but no agent tool uses them yet.",
    },
  };

  return (
    <main
      data-legal-theme={theme}
      className="min-h-screen bg-[var(--legal-bg)] text-[var(--legal-fg)] antialiased selection:bg-white selection:text-black"
      style={{ colorScheme: theme }}
    >
      <div className="mx-auto max-w-7xl px-6 pb-24">
        {/* Top bar */}
        <div className="flex items-center justify-between py-6">
          <Link href="/" className="text-[13px] font-medium text-[var(--legal-muted)] hover:text-[var(--legal-fg)]">
            ← Back to home
          </Link>
          <div className="flex items-center gap-3">
            <LegalThemeToggle theme={theme} onToggle={toggle} />
            <span className="hidden text-[13px] text-[var(--legal-faint)] sm:inline">Co-Founder AI</span>
          </div>
        </div>

        {/* Centered header */}
        <header className="mx-auto max-w-3xl pb-12 pt-6 text-center sm:pb-16">
          <p className="text-[13px] font-medium tracking-wide text-[var(--legal-muted)]">
            Updated: 24 September 2026
          </p>
          <h1 className="mt-4 text-5xl font-medium tracking-tight sm:text-6xl">
            Privacy policy
          </h1>
        </header>

        {/* Mobile nav: views + sections */}
        <div className="sticky top-0 z-10 -mx-6 mb-10 border-b border-[var(--legal-border)] bg-[var(--legal-bar)] px-6 py-3 backdrop-blur lg:hidden">
          <div className="flex gap-2">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                onClick={() => switchView(v.id)}
                className={`rounded-full px-4 py-1.5 text-[13px] font-medium ${
                  view === v.id ? "bg-white text-black" : "text-[var(--legal-muted)]"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-5 overflow-x-auto text-[13px]">
            {rightNav.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={(e) => jump(e, s.id)}
                className={`whitespace-nowrap py-1 ${active === s.id ? "font-medium text-[var(--legal-fg)]" : "text-[var(--legal-faint)]"}`}
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)_200px] lg:gap-10">
          {/* Left sidebar: pages */}
          <nav aria-label="Pages" className="hidden lg:block">
            <div className="sticky top-10 self-start">
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--legal-faint)]">
                Privacy
              </p>
              <ul className="space-y-1">
                {VIEWS.map((v) => (
                  <li key={v.id}>
                    <button
                      onClick={() => switchView(v.id)}
                      aria-current={view === v.id ? "page" : undefined}
                      className={`block w-full rounded-xl px-3 py-2.5 text-left text-[14px] font-medium transition-colors ${
                        view === v.id
                          ? "bg-white text-black"
                          : "text-[var(--legal-muted)] hover:bg-[var(--legal-hover)] hover:text-[var(--legal-fg)]"
                      }`}
                    >
                      {v.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          {/* Content */}
          <div className="max-w-2xl space-y-10">
            {view === "main" && (
              <>
                {panels.map((p) => (
                  <section key={p.id} id={p.id} className="scroll-mt-20">
                    <h2 className="text-xl font-semibold tracking-tight text-[var(--legal-fg)]">{p.title}</h2>
                    {p.body}
                  </section>
                ))}
              </>
            )}
            {view !== "main" && (
              <>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-[var(--legal-fg)]">
                    {viewIntro[view].title}
                  </h2>
                  <p className="mt-3 text-[15px] leading-relaxed text-[var(--legal-body)]">
                    {viewIntro[view].body}
                  </p>
                </div>
                {(view === "google" ? GOOGLE_ACCESS : META_ACCESS).map((a) => (
                  <AccessBlock key={a.id} point={a} />
                ))}
              </>
            )}
          </div>

          {/* Right side: section progress */}
          <nav aria-label="On this page" className="hidden lg:block">
            <div className="sticky top-10 self-start">
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--legal-faint)]">
                On this page
              </p>
              <ul className="space-y-0.5 border-l border-[var(--legal-border)]">
                {rightNav.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      onClick={(e) => jump(e, s.id)}
                      aria-current={active === s.id ? "true" : undefined}
                      className={`-ml-px block border-l-2 py-[6px] pl-3 text-[13px] leading-snug transition-colors ${
                        active === s.id
                          ? "border-white font-medium text-[var(--legal-fg)]"
                          : "border-transparent text-[var(--legal-faint)] hover:text-[var(--legal-body)]"
                      }`}
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>

      </div>
      <SiteFooter tone={theme === "light" ? "light" : "dark"} />
    </main>
  );
}
