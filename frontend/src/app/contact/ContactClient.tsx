"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Nav } from "@/components/landing/Nav";
import { Cursor } from "@/components/landing/Cursor";
import { LandingThemeProvider } from "@/components/landing/ThemeContext";
import {
  fetchMe,
  fetchMyTickets,
  submitContactTicket,
  type ContactTicket,
} from "@/lib/api";
import { getSession } from "@/lib/session";
import {
  Building2,
  CheckCircle2,
  Clock,
  Inbox,
  Loader2,
  MessageSquare,
  Send,
  Ticket,
  UserRound,
} from "lucide-react";

function StatusPill({ status }: { status: ContactTicket["status"] }) {
  const open = status === "raised";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        open
          ? "bg-amber-100 text-amber-800 border border-amber-200"
          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${open ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
      {open ? "Open" : "Closed"}
    </span>
  );
}

export function ContactClient() {
  // Session is read once at mount (lazy init) — no effect needed.
  const [initialSession] = useState(() =>
    typeof window !== "undefined" ? getSession() : null,
  );
  // Form fields mirror the `tickets` table write columns: email, title, message.
  const [email, setEmail] = useState(initialSession?.user.email ?? "");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const userId = initialSession?.user.id ?? null;
  // Greet by person name (users.name), never by email. The local session may
  // predate the name, so fall back to a fresh /auth/me lookup below.
  const [displayName, setDisplayName] = useState<string | null>(
    initialSession?.user.name?.trim() || null,
  );
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<number | null>(null);

  const [tickets, setTickets] = useState<ContactTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(initialSession != null);
  const [ticketsError, setTicketsError] = useState<string | null>(null);
  const [lookupEmail, setLookupEmail] = useState(initialSession?.user.email ?? "");

  // Auto-load the founder's tickets. All state updates happen in the async
  // continuation (never synchronously in the effect body).
  useEffect(() => {
    if (!userId) return;
    let alive = true;
    // Backfill the person name from the users table when the local session
    // doesn't carry one (e.g. sessions saved before onboarding set the name).
    if (!displayName) {
      (async () => {
        const me = await fetchMe();
        const fresh = me?.name?.trim();
        if (alive && fresh) setDisplayName(fresh);
      })();
    }
    (async () => {
      try {
        const res = await fetchMyTickets({ userId });
        if (alive) {
          setTickets(res.tickets);
          setTicketsError(null);
        }
      } catch (e) {
        if (alive) setTicketsError(e instanceof Error ? e.message : "Failed to load tickets");
      } finally {
        if (alive) setTicketsLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [userId, ticketId, displayName]);

  // Manual triggers (refresh button, guest email lookup) — event handlers.
  async function loadTickets(uid: number | null, guestEmail: string) {
    setTicketsLoading(true);
    setTicketsError(null);
    try {
      const res = uid
        ? await fetchMyTickets({ userId: uid })
        : guestEmail.trim()
          ? await fetchMyTickets({ email: guestEmail.trim() })
          : { tickets: [], total: 0 };
      setTickets(res.tickets);
    } catch (e) {
      setTicketsError(e instanceof Error ? e.message : "Failed to load tickets");
    } finally {
      setTicketsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!email.trim() || !title.trim() || message.trim().length < 10) {
      setFormError("Add a valid email, a title and a message (min 10 characters).");
      return;
    }
    setSending(true);
    try {
      const res = await submitContactTicket({
        email: email.trim(),
        title: title.trim(),
        message: message.trim(),
        ...(userId ? { user_id: userId } : {}),
      });
      setTicketId(res.ticket_id);
      setTitle("");
      setMessage("");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not send your message");
    } finally {
      setSending(false);
    }
  }

  return (
    <LandingThemeProvider>
      <div data-landing data-theme="light" className="relative min-h-screen bg-[#fdfcf8] text-[#0f2214]">
        <Cursor />
        {userId ? (
          <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10 pt-6">
            <Link href="/dashboard" className="text-[13px] font-medium text-[#5f6f63] hover:text-[#0f2214]">
              ← Back to dashboard
            </Link>
          </div>
        ) : (
          <Nav />
        )}

        <main className={`mx-auto max-w-6xl px-5 sm:px-8 lg:px-10 pb-20 ${userId ? "pt-4 sm:pt-6" : "pt-28 sm:pt-36"}`}>
          {/* header — different for members vs guests */}
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.28em] text-[#5f6f63]">
              {userId ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0f2214] px-3 py-1 text-[10px] font-sans font-semibold tracking-normal text-white normal-case">
                  <Building2 className="h-3 w-3" /> Workspace member
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ece9e1] px-3 py-1 text-[10px] font-sans font-semibold tracking-normal text-[#55675c] normal-case">
                  <UserRound className="h-3 w-3" /> Guest
                </span>
              )}
              Contact
            </p>
            <h1 className="hero-serif mt-3 text-[clamp(2.4rem,5vw,4rem)] leading-[1.02]">
              {userId ? (
                displayName ? (
                  <>
                    How can we help
                    <br />
                    <span className="italic text-[#385945]">{displayName}?</span>
                  </>
                ) : (
                  <>
                    How can we help?
                    <br />
                    <span className="italic text-[#385945]">We reply fast.</span>
                  </>
                )
              ) : (
                <>
                  Talk to a human.
                  <br />
                  <span className="italic text-[#385945]">We reply fast.</span>
                </>
              )}
            </h1>
            <p className="mt-4 text-[15px] sm:text-base leading-relaxed text-[#425247]">
              {userId ? (
                <>Your ticket is linked to your workspace automatically, and you can track it below. We usually reply within one business day.</>
              ) : (
                <>Support, billing, feedback or ideas — drop a message and it becomes a ticket you can track below. We usually reply within one business day.</>
              )}
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            {/* left: info card — different for members vs guests */}
            <div className="flex flex-col gap-4">
              {userId ? (
                <div className="rounded-2xl bg-[#0f2214] p-6 text-[#fdfcf8]">
                  <p className="flex items-center gap-2 text-[15px] font-bold">
                    <Building2 className="h-4 w-4 text-[#a8d9b8]" /> Signed in
                  </p>
                  <p className="mt-2 break-all text-[13.5px] text-white/75">{email}</p>
                  <p className="mt-2 text-[13px] leading-relaxed text-white/60">
                    Tickets attach to your company workspace — no need to repeat who you are.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl bg-[#0f2214] p-6 text-[#fdfcf8]">
                  <p className="text-[15px] font-bold">Have an account?</p>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-white/75">
                    Sign in so tickets link to your workspace and appear here automatically.
                  </p>
                  <Link href="/auth" className="mt-4 inline-block rounded-full bg-white px-5 py-2.5 text-[13px] font-bold text-[#0f2214] hover:bg-[#f2efe9]">
                    Sign in →
                  </Link>
                </div>
              )}

              <div className="rounded-2xl border border-black/[0.08] bg-white p-6 shadow-[0_2px_12px_rgba(15,34,20,0.04)]">
                <p className="text-[15px] font-bold">What happens next</p>
                <div className="mt-3 space-y-3 text-[13.5px] text-[#4d5e53]">
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4 shrink-0 text-[#1b4329]" /> Median first reply: under 24h on weekdays
                  </p>
                  <p className="flex items-center gap-2">
                    <Ticket className="h-4 w-4 shrink-0 text-[#1b4329]" /> Every message gets a ticket number
                  </p>
                  <p className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 shrink-0 text-[#1b4329]" /> Include steps + screenshots for bugs
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-black/[0.08] bg-white p-6 shadow-[0_2px_12px_rgba(15,34,20,0.04)]">
                <p className="text-[15px] font-bold">Before you write</p>
                <ul className="mt-3 space-y-2 text-[13.5px] leading-relaxed text-[#4d5e53]">
                  <li>· Billing issue? Add your company name + payment date.</li>
                  <li>· Bug? Tell us the page, what you clicked, what you saw.</li>
                  {userId ? (
                    <li>· You&apos;re signed in — this ticket links to your workspace.</li>
                  ) : (
                    <li>· Sending as guest — sign in to link tickets to your workspace.</li>
                  )}
                </ul>
                <Link href="/#pricing" className="mt-4 inline-block text-[13px] font-semibold text-[#0f2214] underline underline-offset-4">
                  View pricing →
                </Link>
              </div>
            </div>

            {/* right: form card — fields match the `tickets` table: email, title, message */}
            <div className="rounded-2xl border border-black/[0.08] bg-white p-6 sm:p-8 shadow-[0_2px_12px_rgba(15,34,20,0.04)]">
              {ticketId ? (
                <div className="py-6 text-center">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
                  <h2 className="mt-4 text-xl font-bold">Message received</h2>
                  <p className="mt-2 text-[14px] text-[#4d5e53]">
                    Ticket <span className="font-mono font-bold text-[#0f2214]">#{ticketId}</span> is open.
                    We&apos;ll reply to <strong>{email}</strong> within one business day.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    <button
                      onClick={() => setTicketId(null)}
                      className="rounded-full bg-[#0f2214] px-5 py-2.5 text-[13.5px] font-semibold text-white hover:bg-[#1a3624]"
                    >
                      Send another message
                    </button>
                    {userId && (
                      <button
                        onClick={() => loadTickets(userId, "")}
                        className="rounded-full border border-black/10 px-5 py-2.5 text-[13.5px] font-semibold hover:bg-black/[0.04]"
                      >
                        Refresh my tickets
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <label className="block">
                    <span className="mb-1.5 block text-[13px] font-semibold">Email</span>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      type="email"
                      disabled={userId != null}
                      className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-[14px] placeholder-[#7d8f84] focus:outline-none focus:ring-2 focus:ring-[#163a24]/20 focus:border-[#163a24] disabled:bg-[#f3f1ea] disabled:text-[#55675c]"
                    />
                    {userId && (
                      <span className="mt-1 block text-[12px] text-[#7d8f84]">Signed in — ticket links to your workspace.</span>
                    )}
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-[13px] font-semibold">Title</span>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Credit top-up didn't reflect"
                      maxLength={200}
                      className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-[14px] placeholder-[#7d8f84] focus:outline-none focus:ring-2 focus:ring-[#163a24]/20 focus:border-[#163a24]"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 flex items-center justify-between text-[13px] font-semibold">
                      Message
                      <span className="font-normal text-[#7d8f84]">{message.length}/5000</span>
                    </span>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value.slice(0, 5000))}
                      placeholder="Tell us what happened, what you expected, and anything you already tried…"
                      rows={6}
                      className="w-full resize-y rounded-xl border border-black/10 bg-white px-4 py-3 text-[14px] leading-relaxed placeholder-[#7d8f84] focus:outline-none focus:ring-2 focus:ring-[#163a24]/20 focus:border-[#163a24]"
                    />
                  </label>

                  {formError && (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] text-red-700">
                      {formError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={sending}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0f2214] px-6 py-3.5 text-[14px] font-bold text-white transition-all hover:bg-[#1a3624] disabled:opacity-60 sm:w-auto"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {sending ? "Sending…" : "Send message"}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* ticketing view */}
          <section className="mt-12">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="hero-serif text-[clamp(1.5rem,3vw,2.2rem)]">
                  {userId ? "Workspace tickets" : "Your tickets"}
                </h2>
                <p className="mt-1 text-[13.5px] text-[#5f6f63]">
                  {userId ? "Linked to your workspace — newest first." : "Signed out — look up tickets by email."}
                </p>
              </div>
              {!userId && (
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    loadTickets(null, lookupEmail);
                  }}
                >
                  <input
                    value={lookupEmail}
                    onChange={(e) => setLookupEmail(e.target.value)}
                    placeholder="you@company.com"
                    type="email"
                    className="w-56 rounded-full border border-black/10 bg-white px-4 py-2 text-[13px] placeholder-[#7d8f84] focus:outline-none focus:ring-2 focus:ring-[#163a24]/20 focus:border-[#163a24]"
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-[#0f2214] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#1a3624]"
                  >
                    Look up
                  </button>
                </form>
              )}
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-black/[0.08] bg-white">
              {ticketsLoading ? (
                <p className="flex items-center gap-2 p-6 text-[13.5px] text-[#5f6f63]">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading tickets…
                </p>
              ) : ticketsError ? (
                <p className="p-6 text-[13.5px] text-red-700">{ticketsError}</p>
              ) : tickets.length === 0 ? (
                <p className="flex items-center gap-2 p-6 text-[13.5px] text-[#5f6f63]">
                  <Inbox className="h-4 w-4" />
                  {userId || lookupEmail ? "No tickets yet — send your first message above." : "Enter your email to look up past tickets."}
                </p>
              ) : (
                <ul className="divide-y divide-black/[0.06]">
                  {tickets.map((t) => (
                    <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-6">
                      <div className="min-w-0">
                        <p className="text-[14px] font-semibold text-[#0f2214]">
                          <span className="mr-2 font-mono text-[12px] text-[#7d8f84]">#{t.id}</span>
                          {t.title}
                        </p>
                        <p className="mt-0.5 text-[12.5px] text-[#7d8f84]">
                          {new Date(t.created_at).toLocaleString()} · {t.email}
                        </p>
                      </div>
                      <StatusPill status={t.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </main>
      </div>
    </LandingThemeProvider>
  );
}
