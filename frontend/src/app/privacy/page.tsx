import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Co-Founder AI",
  description:
    "How Co-Founder AI collects, uses, stores, and deletes your account, company, chat, file, and payment data.",
};

const SECTIONS = [
  {
    id: "data-we-collect",
    title: "1. Data we collect",
    body: [
      "Account: email address, Argon2id password hash (plaintext is never stored), display name, Google OAuth identity (Supabase user ID) when you sign in with Google.",
      "Company profile: company name, description, industry, brand tone, and logo image (stored as {company_id}/logo.png in Supabase Storage).",
      "Content you provide: chat messages, uploaded files (PDF, image, CSV, Excel, JSON, Parquet), file descriptions and embeddings (1536-dim vectors in document_chunks), chat memories and session titles derived from conversations.",
      "Connections (only if you connect them): Instagram long-lived token, Google OAuth grant (access + refresh token, granted scopes, Google account sub/email) shared by Gmail and Google Sheets. Tokens are stored server-side and never sent to the browser.",
      "Billing: company credit balance, Razorpay order/payment IDs, amounts, and payment status history. Card details go directly to Razorpay Checkout — we never see or store them.",
      "Technical: HMAC-signed httpOnly session cookie (cofounder_session), IP-based rate-limit counters, Redis cache keys, Kafka job payloads, and application logs.",
    ],
  },
  {
    id: "how-we-use",
    title: "2. How we use data",
    body: [
      "Operate the product: authenticate you, resolve your company, run the CEO + specialist agent pipeline, retrieve relevant document chunks and chat memories, and stream answers and agent traces.",
      "Billing: price token usage per model (2x markup, $1 = ₹100 selling price), deduct company credits, verify Razorpay HMAC-SHA256 signatures, and record payment history.",
      "Improve reliability: buffered WebSocket trace replay, Redis caching (company, sessions, embeddings, credits), and async Kafka jobs for message persistence, memory extraction, and title generation.",
      "We do not sell your personal data. Prompts and retrieved chunks are sent to the LLM, search, and OCR providers needed to answer (OpenRouter models, Tavily, SerpAPI, Google vision/embedding endpoints) — that is processing on your behalf, not a sale.",
    ],
  },
  {
    id: "sharing",
    title: "3. Third parties",
    body: [
      "Supabase (Auth, Postgres/pgvector, Storage), OpenRouter (chat, embedding, image models), Tavily and SerpAPI (web research), Razorpay (payments), Google (OAuth, Gmail, Sheets APIs), Meta/Instagram (OAuth), and e2b (sandboxed Python execution).",
      "Each provider receives only what it needs for its function and is governed by its own privacy terms.",
      "While Google connectors are in Testing mode: refresh tokens expire after ~7 days and reconnect is required; only Test Users allowlisted on the Google consent screen can connect.",
    ],
  },
  {
    id: "retention",
    title: "4. Retention and deletion",
    body: [
      "Chat sessions, messages, files, logos, and connections persist until you delete them: DELETE /chat/sessions/{id}, DELETE /file/{id}, disconnect via /connections pages.",
      "Deleting a file removes the Storage object; document chunks for that file are removed from retrieval. Chat memories derived from deleted sessions are not used for new answers once removed.",
      "Session cookies expire per SESSION_MAX_AGE_DAYS (default 30 days); logout clears the cookie. There is not yet a self-serve Delete Account / GDPR export button — contact us (see below) and we will delete or export your account data.",
      "Backups, Kafka redelivery (at-least-once), and Redis TTLs (e.g. credits 60s, embeddings 1h, sessions list 2min) may retain copies briefly after deletion.",
    ],
  },
  {
    id: "security",
    title: "5. Security",
    body: [
      "Argon2id password hashing with fail-closed verification and legacy plaintext rehash on login; 10/min login/signup rate limit per IP.",
      "Razorpay key secret never leaves the backend; frontend uses only the public key ID. Payment verification uses constant-time HMAC compare plus authoritative order.fetch and Redis idempotency.",
      "OAuth tokens are kept server-side; connect flows use expiring single-use Redis state and validated redirect targets (no open redirects).",
      "Connector credentials (Google, Instagram) are encrypted at rest with AES-256-GCM before they reach the database, so a leaked database row does not by itself yield a usable token.",
      "No system is perfectly secure — do not upload secrets, credentials, or data you lack rights to process.",
    ],
  },
  {
    id: "rights",
    title: "6. Your rights and contact",
    body: [
      "You can access and correct your company profile from the Profile page, list/download files from Drive, review payment history from Billing, and disconnect Gmail/Sheets/Instagram from Plugins at any time.",
      "For access, correction, export, or deletion requests, open an issue or contact via the GitHub repository: https://github.com/karthik132007/Co_Founder",
      "We will respond to verified requests from the account email address.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#fdfcf8] text-[#0f2214]">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link href="/" className="text-[13px] font-medium text-[#5f6f63] hover:text-[#0f2214]">
          ← Back to home
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-[#5f6f63]">Last updated: 20 September 2026 · Co-Founder AI</p>
        <div className="mt-8 space-y-8">
          {SECTIONS.map((s) => (
            <section key={s.id} id={s.id} className="card p-6">
              <h2 className="text-lg font-semibold">{s.title}</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-[14px] leading-relaxed text-[#2f3e32]">
                {s.body.map((p) => (
                  <li key={p.slice(0, 32)}>{p}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <p className="mt-8 text-[13px] text-[#5f6f63]">
          Also see our <Link href="/terms" className="underline hover:text-[#0f2214]">Terms and Conditions</Link>.
        </p>
      </div>
    </main>
  );
}
