import type { Metadata } from "next";
import Link from "next/link";
import {
  PRIVACY_GITHUB_URL,
  RECOMMENDED_PRIVACY_EMAIL,
  getPrivacyEmail,
} from "@/lib/privacy";

export const metadata: Metadata = {
  title: "Privacy Policy — Co-Founder AI",
  description:
    "How Co-Founder AI collects, uses, stores, and deletes your account, company, chat, file, and payment data.",
};

export default function PrivacyPage() {
  const privacyEmail = getPrivacyEmail();

  return (
    <main className="min-h-screen bg-[#fdfcf8] text-[#0f2214]">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link href="/" className="text-[13px] font-medium text-[#5f6f63] hover:text-[#0f2214]">
          ← Back to home
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-[#5f6f63]">
          Last updated: 24 September 2026 · Co-Founder AI
        </p>

        <div className="mt-8 space-y-8">
          <section id="data-we-collect" className="card p-6">
            <h2 className="text-lg font-semibold">1. Data we collect — and why</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-[14px] leading-relaxed text-[#2f3e32]">
              <li>
                <strong>Account information:</strong> email address, password hash, and
                display name. Used to create your account, sign you in, and identify
                your workspace. Google sign-in additionally stores the OAuth identity
                needed to recognise a returning Google account.
              </li>
              <li>
                <strong>Company / workspace information:</strong> company name,
                description, industry, brand tone, and logo image. Used to personalise
                the workspace and agent outputs. You provide this during onboarding and
                can edit it on the Profile page.
              </li>
              <li>
                <strong>Content you provide:</strong> chat messages, uploaded files and
                their descriptions. Used to answer your questions, retrieve relevant
                document passages, and generate requested outputs.
              </li>
              <li>
                <strong>AI prompts, outputs and derived data:</strong> conversation
                history, session titles, chat memories, and document embeddings. Used to
                keep context across messages, retrieve relevant knowledge, and operate
                the agent pipeline.
              </li>
              <li>
                <strong>Authentication and session data:</strong> a signed, httpOnly
                session cookie plus cached sign-in state in the browser. Used to keep
                you signed in securely without exposing the session token to JavaScript.
              </li>
              <li>
                <strong>Connected integrations (only if you connect them):</strong>{" "}
                Google OAuth grant (account identifier, email, granted scopes, access
                and refresh tokens) shared by Gmail and Google Sheets connectors, and
                the Instagram long-lived token. Tokens are stored server-side, kept out
                of the browser, and used only to act on the connected account on your
                behalf.
              </li>
              <li>
                <strong>Billing information:</strong> credit balance, order and payment
                identifiers, amounts, and payment status. Used to top up credits, verify
                payments server-side, and keep a payment history. Card details go
                directly to Razorpay Checkout — we never see or store them.
              </li>
              <li>
                <strong>Technical and log information:</strong> IP-address-based rate
                limiting, error and application logs (which may include account
                identifiers such as email or company name), and aggregate usage /
                performance measurement on every visit. Used for
                security, abuse prevention, debugging, and reliability.
              </li>
            </ul>
          </section>

          <section id="how-we-use" className="card p-6">
            <h2 className="text-lg font-semibold">2. How we use data</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-[14px] leading-relaxed text-[#2f3e32]">
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
          </section>

          <section id="sharing" className="card p-6">
            <h2 className="text-lg font-semibold">3. Third-party processors</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-[14px] leading-relaxed text-[#2f3e32]">
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
            <p className="mt-3 text-[14px] leading-relaxed text-[#2f3e32]">
              Each provider receives only what it needs for its function and is
              governed by its own privacy terms. While Google connectors are in
              Testing mode, reconnect may be required periodically and only allowlisted
              test users can connect.
            </p>
          </section>

          <section id="cookies" className="card p-6">
            <h2 className="text-lg font-semibold">4. Cookies and tracking</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-[14px] leading-relaxed text-[#2f3e32]">
              <li>Essential sign-in and product storage is always on; the app cannot work without it.</li>
              <li>Analytics (Vercel Analytics + Speed Insights + Google Analytics) load on every page for all visitors.</li>
              <li>We use no advertising cookies and no Meta Pixel.</li>
            </ul>
            <p className="mt-3 text-[14px] leading-relaxed text-[#2f3e32]">
              Details are in our{" "}
              <Link href="/cookies" className="underline hover:text-[#0f2214]">
                Cookie Policy
              </Link>
              .
            </p>
          </section>

          <section id="retention" className="card p-6">
            <h2 className="text-lg font-semibold">5. Retention and deletion</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-[14px] leading-relaxed text-[#2f3e32]">
              <li>Chat sessions, messages, files, logos, and connections persist until you delete them.</li>
              <li>You can delete a chat session, delete a file, or disconnect an integration at any time from the product; deleting a file removes it from storage and from retrieval.</li>
              <li>Signing out clears the session cookie; sessions also expire automatically.</li>
              <li>
                There is not yet a self-serve Delete Account button. For account export
                or full deletion, contact us (see below) and we will handle your request.
              </li>
              <li>Backups and queued background work may retain copies briefly after deletion.</li>
            </ul>
          </section>

          <section id="security" className="card p-6">
            <h2 className="text-lg font-semibold">6. Security</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-[14px] leading-relaxed text-[#2f3e32]">
              <li>Passwords are stored as Argon2 hashes — plaintext passwords are never stored.</li>
              <li>Sign-in uses short-lived, single-use OAuth state, validated redirect targets, and per-IP rate limiting.</li>
              <li>Payment secrets stay on the backend; payment verification runs server-side.</li>
              <li>Connected OAuth tokens are kept server-side and stored encrypted at rest.</li>
              <li>No system is perfectly secure — do not upload secrets, credentials, or data you lack rights to process.</li>
            </ul>
          </section>

          <section id="transfers" className="card p-6">
            <h2 className="text-lg font-semibold">7. International data transfers</h2>
            <p className="mt-3 text-[14px] leading-relaxed text-[#2f3e32]">
              We and our processors may store and process data in countries other than
              your own (for example where our hosting, database, AI, payment, or OAuth
              providers operate). Where required, we rely on appropriate safeguards for
              such transfers — <em>requires legal review to confirm the transfer
              mechanism for each provider</em>.
            </p>
          </section>

          <section id="rights" className="card p-6">
            <h2 className="text-lg font-semibold">8. Your rights and how to request</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-[14px] leading-relaxed text-[#2f3e32]">
              <li>You can access and correct your company profile from the Profile page, list and download files from Drive, review payment history from Billing, and disconnect integrations from Plugins at any time.</li>
              <li>
                For access, correction, export, or deletion requests, contact us
                {privacyEmail ? (
                  <>
                    {" "}at{" "}
                    <a
                      href={`mailto:${privacyEmail}`}
                      className="underline hover:text-[#0f2214]"
                    >
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
                      className="underline hover:text-[#0f2214]"
                    >
                      {PRIVACY_GITHUB_URL}
                    </a>
                  </>
                )}
                .
              </li>
              <li>We verify requests using your account email address before acting on them.</li>
            </ul>
            {!privacyEmail && (
              <p className="mt-3 rounded-lg bg-[rgba(180,120,20,0.08)] p-3 text-[13px] leading-relaxed text-[#5f6f63]">
                Owner note: no dedicated privacy email is configured yet. Set
                NEXT_PUBLIC_PRIVACY_EMAIL (recommended: {RECOMMENDED_PRIVACY_EMAIL})
                to publish one here.
              </p>
            )}
          </section>

          <section id="eu-uk" className="card p-6">
            <h2 className="text-lg font-semibold">9. EU / EEA / UK information</h2>
            <p className="mt-3 text-[14px] leading-relaxed text-[#2f3e32]">
              If you are in the EU, EEA, or UK, you have the following rights (subject
              to applicable law and exceptions): right of access, right to
              rectification, right to erasure, right to data portability, right to
              restriction of processing, right to object, right to withdraw consent at
              any time (for processing based on consent, such as
              connected integrations you authorised), and the right to complain to your
              supervisory authority.
            </p>
            <p className="mt-3 text-[14px] leading-relaxed text-[#2f3e32]">
              Our understood legal basis for major processing —{" "}
              <em>requires legal review to confirm</em>:
            </p>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-[14px] leading-relaxed text-[#2f3e32]">
              <li>Account, workspace, content, and billing processing: performance of the service you requested (contract) — requires legal review.</li>
              <li>Connected Google / Instagram integrations: consent you give when you authorise the connection (withdrawable by disconnecting) — requires legal review.</li>
              <li>Analytics (Vercel + Google Analytics page-view and usage measurement): legitimate interests — requires legal review.</li>
              <li>Security, fraud prevention, rate limiting, and debugging: legitimate interests — requires legal review.</li>
              <li>Payment and tax records: legal obligations — requires legal review.</li>
            </ul>
          </section>

          <section id="california" className="card p-6">
            <h2 className="text-lg font-semibold">10. California privacy information</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-[14px] leading-relaxed text-[#2f3e32]">
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
            <p className="mt-3 text-[13px] leading-relaxed text-[#5f6f63]">
              This notice does not claim Co-Founder meets any specific California
              applicability threshold — <em>requires legal/business review</em>.
            </p>
          </section>

          <section id="changes" className="card p-6">
            <h2 className="text-lg font-semibold">11. Changes to this policy</h2>
            <p className="mt-3 text-[14px] leading-relaxed text-[#2f3e32]">
              We may update this policy as the product evolves; material changes will be
              reflected in the Last updated date above. Continued use after changes
              constitutes acceptance.
            </p>
          </section>
        </div>

        <p className="mt-8 text-[13px] text-[#5f6f63]">
          Also see our{" "}
          <Link href="/terms" className="underline hover:text-[#0f2214]">
            Terms and Conditions
          </Link>{" "}
          and{" "}
          <Link href="/cookies" className="underline hover:text-[#0f2214]">
            Cookie Policy
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
