"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  CheckCircle2,
  CircleAlert,
  Coins,
  CreditCard,
  Loader2,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Info,
  History,
  TrendingUp,
} from "lucide-react";
import { getSession } from "@/lib/session";
import {
  createRazorpayOrder,
  fetchCreditBalance,
  fetchPaymentHistory,
  fetchProfile,
  verifyRazorpayPayment,
  type PaymentHistoryEntry,
  type PaymentStatus,
} from "@/lib/api";

const ACCENT = "#143620";

// Public Razorpay key — the KEY_SECRET never leaves the backend.
const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
const RAZORPAY_CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

/* ── Razorpay checkout types (from the checkout.js global) ── */

type RazorpayResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number; // paise
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; email?: string };
  theme?: { color: string };
  handler: (response: RazorpayResponse) => void;
  modal?: { ondismiss?: () => void };
};

type RazorpayInstance = {
  open: () => void;
  close: () => void;
  on: (event: string, handler: (response: unknown) => void) => void;
};

type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;

let checkoutScriptPromise: Promise<void> | null = null;

/** Inject https://checkout.razorpay.com/v1/checkout.js once, then resolve. */
function loadRazorpayCheckoutScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as unknown as { Razorpay?: RazorpayConstructor }).Razorpay) {
    return Promise.resolve();
  }
  if (checkoutScriptPromise) return checkoutScriptPromise;
  checkoutScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = RAZORPAY_CHECKOUT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      checkoutScriptPromise = null;
      reject(new Error("Failed to load Razorpay checkout script"));
    };
    document.head.appendChild(script);
  });
  return checkoutScriptPromise;
}

const formatINR = (credits: number) =>
  credits.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });

const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const STATUS_META: Record<
  PaymentStatus,
  { label: string; type: string; badge: string; dot: string }
> = {
  completed: {
    label: "Completed",
    type: "Credits purchased",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  pending: {
    label: "Pending",
    type: "Pending payment",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  failed: {
    label: "Failed",
    type: "Failed payment",
    badge: "bg-red-50 text-red-600 border-red-200",
    dot: "bg-red-500",
  },
  refunded: {
    label: "Refunded",
    type: "Refund",
    badge: "bg-zinc-100 text-zinc-600 border-zinc-200",
    dot: "bg-zinc-400",
  },
};

const AMOUNT_PRESETS = [100, 250, 500, 1000, 2500];
const MIN_AMOUNT = 100;

export default function BillingPage() {
  const session = getSession();
  const userId = session?.user?.id;
  const [balance, setBalance] = useState<number | null>(null);
  const [history, setHistory] = useState<PaymentHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<{
    type: "error" | "success" | "info";
    text: string;
  } | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");
  const [usdInrRate, setUsdInrRate] = useState<number>(83);
  const [rateLoading, setRateLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const razorpayRef = useRef<RazorpayInstance | null>(null);

  const formatUSD = useCallback(
    (credits: number) =>
      (credits / usdInrRate).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      }),
    [usdInrRate],
  );

  // Close an open Razorpay modal if the user navigates away mid-checkout.
  useEffect(() => {
    return () => razorpayRef.current?.close?.();
  }, []);

  // Fetch realtime USD→INR rate (credits are stored as INR). Falls back to 83 if fetch fails.
  useEffect(() => {
    let cancelled = false;
    const fetchRate = async () => {
      try {
        setRateLoading(true);
        const res = await fetch("https://api.frankfurter.app/latest?from=USD&to=INR");
        if (res.ok) {
          const data = await res.json();
          const rate = data?.rates?.INR;
          if (typeof rate === "number" && rate > 0 && !cancelled) {
            setUsdInrRate(rate);
            setRateLoading(false);
            return;
          }
        }
        throw new Error("frankfurter failed");
      } catch {
        try {
          const res2 = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
          if (res2.ok) {
            const data2 = await res2.json();
            const rate2 = data2?.rates?.INR;
            if (typeof rate2 === "number" && rate2 > 0 && !cancelled) {
              setUsdInrRate(rate2);
              setRateLoading(false);
              return;
            }
          }
          throw new Error("exchangerate-api failed");
        } catch {
          try {
            const res3 = await fetch(
              "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json",
            );
            if (res3.ok) {
              const data3 = await res3.json();
              const rate3 = data3?.usd?.inr;
              if (typeof rate3 === "number" && rate3 > 0 && !cancelled) {
                setUsdInrRate(rate3);
              }
            }
          } catch {
            // keep fallback 83
          }
          if (!cancelled) setRateLoading(false);
        }
      }
    };
    fetchRate();
    const interval = setInterval(fetchRate, 1000 * 60 * 60);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const loadAll = useCallback(async () => {
    if (!userId) return;
    try {
      const profile = await fetchProfile(userId);
      const data = await fetchCreditBalance(profile.company.id);
      setBalance(data.balance);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load credit balance");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadHistory = useCallback(async () => {
    if (!userId) return;
    try {
      const profile = await fetchProfile(userId);
      const res = await fetchPaymentHistory(profile.company.id);
      setHistory(res.payments);
    } catch {
      // Non-critical — the table simply stays empty.
    } finally {
      setHistoryLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadAll();
    loadHistory();
  }, [loadAll, loadHistory]);

  if (!session || !userId) return null;

  const rawAmount = customAmount.trim() ? Number(customAmount) : null;
  const amount =
    rawAmount !== null && Number.isFinite(rawAmount) && rawAmount > 0
      ? currency === "INR"
        ? rawAmount
        : Math.round(rawAmount * usdInrRate)
      : null;
  const isBelowMin = typeof amount === "number" && amount < MIN_AMOUNT;
  const canCheckout =
    typeof amount === "number" && Number.isFinite(amount) && amount >= MIN_AMOUNT;

  const totalPurchased = history
    .filter((p) => p.status === "completed")
    .reduce((acc, p) => acc + Number(p.amount || 0), 0);
  const totalTransactions = history.length;

  const handleCheckout = async () => {
    if (processing || !userId) return;
    if (amount !== null && amount < MIN_AMOUNT) {
      setNotice({
        type: "error",
        text: `Minimum top-up is ${formatINR(MIN_AMOUNT)} (${formatUSD(MIN_AMOUNT)}). Please enter at least ${currency === "INR" ? formatINR(MIN_AMOUNT) : formatUSD(MIN_AMOUNT)}.`,
      });
      return;
    }
    if (!canCheckout) return;
    if (!RAZORPAY_KEY_ID) {
      setNotice({
        type: "error",
        text: "Razorpay isn't configured — add NEXT_PUBLIC_RAZORPAY_KEY_ID to frontend/.env.local.",
      });
      return;
    }

    setNotice(null);
    setProcessing(true);
    try {
      const profile = await fetchProfile(userId);
      const companyId = profile.company.id;

      // 1. Create a Razorpay order on the FastAPI backend.
      const order = await createRazorpayOrder(companyId, userId, amount as number);

      // 2. Load checkout.js and open the Razorpay payment modal.
      await loadRazorpayCheckoutScript();
      const RazorpayCtor = (
        window as unknown as { Razorpay?: RazorpayConstructor }
      ).Razorpay;
      if (!RazorpayCtor) {
        throw new Error("Razorpay checkout script is unavailable");
      }

      const rzp = new RazorpayCtor({
        key: RAZORPAY_KEY_ID,
        amount: order.amount, // paise, exactly as created by the backend
        currency: order.currency,
        name: "Co-Founder",
        description: `Top-up of ${formatINR(order.amount / 100)} credits`,
        order_id: order.order_id,
        prefill: {
          name: session.user.name || undefined,
          email: session.user.email,
        },
        theme: { color: ACCENT },
        handler: async (response) => {
          // 3. Payment succeeded — verify the signature on the backend.
          setProcessing(true);
          try {
            const verified = await verifyRazorpayPayment(
              companyId,
              userId,
              response,
            );
            setNotice({
              type: "success",
              text: verified.duplicate
                ? "This payment was already applied — balance refreshed."
                : `Payment successful! ${formatINR(
                    verified.amount,
                  )} credits added to your balance.`,
            });
            setCustomAmount("");
            await loadAll();
            loadHistory();
            // Keep the sidebar badge in sync with the new balance.
            window.dispatchEvent(new Event("cofounder:credits-updated"));
          } catch (e) {
            setNotice({
              type: "error",
              text:
                e instanceof Error
                  ? e.message
                  : "Payment was received but couldn't be verified — please contact support.",
            });
            await loadAll();
            window.dispatchEvent(new Event("cofounder:credits-updated"));
          } finally {
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            // User closed the modal without completing — nothing charged.
            setProcessing(false);
            setNotice({
              type: "error",
              text: "Checkout cancelled — no credits were added.",
            });
          },
        },
      });

      razorpayRef.current = rzp;
      rzp.on("payment.failed", (resp) => {
        const error = (
          resp as { error?: { description?: string; reason?: string; code?: string } }
        )?.error;
        const reason =
          error?.description || error?.reason || error?.code || "Payment failed";
        setNotice({ type: "error", text: `Payment failed: ${reason}` });
        setProcessing(false);
      });

      rzp.open();
    } catch (e) {
      setNotice({
        type: "error",
        text:
          e instanceof Error
            ? e.message
            : "Failed to start checkout — please try again.",
      });
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page header — left aligned like dashboard ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col lg:flex-row lg:items-end justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[28px] font-semibold tracking-tight text-[#0f2214]">
              Billing
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#eaf0e8] border border-[#cfe0cf] px-2.5 py-0.5 text-[11px] font-semibold text-[#143620]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#143620] animate-pulse" />
              Live
            </span>
          </div>
          <p className="mt-1.5 text-[13.5px] text-[#5f6f63] max-w-[560px] leading-relaxed">
            Manage credits, top up your balance and review every invoice.
            <span className="hidden sm:inline"> Secure payments powered by Razorpay.</span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <div className="inline-flex rounded-full border border-[#e8e9e3] bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setCurrency("INR")}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                currency === "INR"
                  ? "bg-[#0f2214] text-white shadow"
                  : "text-[#5f6f63] hover:text-[#0f2214]"
              }`}
              aria-pressed={currency === "INR"}
            >
              INR ₹
            </button>
            <button
              type="button"
              onClick={() => setCurrency("USD")}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                currency === "USD"
                  ? "bg-[#0f2214] text-white shadow"
                  : "text-[#5f6f63] hover:text-[#0f2214]"
              }`}
              aria-pressed={currency === "USD"}
            >
              USD $
            </button>
          </div>
          <span className="text-[11px] text-[#8d9d94] font-medium flex items-center gap-1">
            {rateLoading ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" /> fetching live rate…
              </>
            ) : (
              <>1 USD ≈ {formatINR(usdInrRate)} • live</>
            )}
          </span>
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-[13px] font-medium text-red-600"
        >
          <span className="flex items-center gap-2.5">
            <CircleAlert className="w-4 h-4 shrink-0" />
            {error}
          </span>
          <button onClick={() => setError("")} className="underline shrink-0 text-xs">
            Dismiss
          </button>
        </motion.div>
      )}

      {notice && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-[13px] ${
            notice.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : notice.type === "info"
                ? "border-[#cfe0cf] bg-[#eaf0e8] text-[#143620]"
                : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          {notice.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          ) : (
            <CircleAlert className="w-4 h-4 mt-0.5 shrink-0" />
          )}
          <span className="flex-1 leading-relaxed">{notice.text}</span>
          <button
            onClick={() => setNotice(null)}
            className="text-xs underline opacity-70 hover:opacity-100 shrink-0 mt-0.5"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: ACCENT }} />
        </div>
      ) : (
        <>
          {/* ── Stats strip ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Balance — hero card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="card p-5 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#eaf0e8]/70 via-transparent to-transparent opacity-60 pointer-events-none" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8d9d94]">
                    Available balance
                  </span>
                  <span className="w-8 h-8 rounded-lg bg-[#eaf0e8] flex items-center justify-center">
                    <Coins className="w-4 h-4" style={{ color: ACCENT }} />
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2 flex-wrap">
                  <span className="text-[30px] font-bold tracking-tight text-[#0f2214]">
                    {balance !== null ? (currency === "INR" ? formatINR(balance) : formatUSD(balance)) : "—"}
                  </span>
                  {balance !== null && balance > 0 && (
                    <span className="text-[12px] font-medium text-[#8d9d94] bg-[#fdfcf8] border border-[#f6f5ef] rounded-full px-2 py-0.5">
                      ≈ {currency === "INR" ? formatUSD(balance) : formatINR(balance)}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-[12px] text-[#5f6f63] flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[#8d9d94]" />
                  Credits never expire • used per AI request
                </p>
              </div>
            </motion.div>

            {/* Total purchased */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 }}
              className="card p-5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8d9d94]">
                  Total purchased
                </span>
                <span className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </span>
              </div>
              <div className="mt-3 text-[22px] font-semibold tracking-tight text-[#0f2214]">
                {currency === "INR" ? formatINR(totalPurchased) : formatUSD(totalPurchased)}
              </div>
              <p className="mt-1 text-[12px] text-[#5f6f63]">
                Lifetime credits bought
                <span className="text-[#8d9d94]"> • ≈ {currency === "INR" ? formatUSD(totalPurchased) : formatINR(totalPurchased)}</span>
              </p>
              <div className="mt-3 h-1.5 w-full rounded-full bg-[#f6f5ef] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (totalPurchased / 5000) * 100)}%`,
                    background: ACCENT,
                  }}
                />
              </div>
            </motion.div>

            {/* Invoices */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 }}
              className="card p-5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8d9d94]">
                  Invoices
                </span>
                <span className="w-8 h-8 rounded-lg bg-[#fdfcf8] border border-[#e8e9e3] flex items-center justify-center">
                  <History className="w-4 h-4 text-[#5f6f63]" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-[22px] font-semibold tracking-tight text-[#0f2214]">
                  {totalTransactions}
                </span>
                <span className="text-xs text-[#8d9d94] font-medium">
                  {totalTransactions === 1 ? "transaction" : "transactions"}
                </span>
              </div>
              <p className="mt-1 text-[12px] text-[#5f6f63]">
                {history.filter((h) => h.status === "completed").length} completed •{" "}
                {history.filter((h) => h.status === "failed").length} failed
              </p>
              <button
                onClick={() => document.getElementById("invoice-history")?.scrollIntoView({ behavior: "smooth" })}
                className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold hover:underline"
                style={{ color: ACCENT }}
              >
                View history <ArrowUpRight className="w-3 h-3" />
              </button>
            </motion.div>
          </div>

          {/* ── Main grid: buy + summary ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.65fr_0.9fr] gap-6 items-start">
            {/* Buy credits */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.12 }}
              className="card overflow-hidden"
            >
              <div className="px-6 sm:px-8 pt-6 sm:pt-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-[15px] font-semibold text-[#0f2214]">Buy credits</h2>
                    <p className="mt-1 text-[13px] text-[#5f6f63]">
                      Choose a preset or enter a custom amount. You’ll be charged in INR{currency === "USD" ? " (USD shown for reference)" : ""}.
                    </p>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[#e8e9e3] bg-[#fdfcf8] px-2.5 py-1 text-[11px] font-medium text-[#5f6f63]">
                    <Info className="w-3 h-3" /> Minimum {formatINR(MIN_AMOUNT)}
                  </span>
                </div>

                {/* Presets */}
                <div className="mt-6 grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {AMOUNT_PRESETS.map((chip) => {
                    const active = amount === chip;
                    const label = currency === "INR" ? `₹${chip.toLocaleString("en-IN")}` : formatUSD(chip);
                    return (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => {
                          setCustomAmount(currency === "INR" ? String(chip) : (chip / usdInrRate).toFixed(2));
                          setNotice(null);
                        }}
                        className={`group relative rounded-xl border px-3 py-3 text-center transition-all ${
                          active
                            ? "border-[#0f2214] bg-[#0f2214] text-white shadow-[0_4px_14px_rgba(0,0,0,0.2)]"
                            : "border-[#e8e9e3] bg-white text-[#0f2214] hover:border-[#cfe0cf] hover:bg-[#eaf0e8]/50"
                        }`}
                      >
                        <div className={`text-[15px] font-bold leading-none ${active ? "text-white" : "text-[#0f2214]"}`}>
                          {label}
                        </div>
                        <div className={`mt-1 text-[10px] font-medium ${active ? "text-white/60" : "text-[#8d9d94]"}`}>
                          {chip} credits
                        </div>
                        {active && (
                          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white border border-[#0f2214] flex items-center justify-center">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#0f2214]" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Custom input */}
                <div className="mt-6">
                  <label
                    htmlFor="buy-custom-credits"
                    className="text-[12px] font-semibold text-[#2f3e32] flex items-center gap-1.5"
                  >
                    Custom amount
                    <span className="font-normal text-[#8d9d94]">({currency})</span>
                  </label>
                  <div
                    className={`relative mt-2 rounded-xl transition-all ${isBelowMin ? "ring-1 ring-red-300" : ""}`}
                  >
                    <span
                      className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] font-semibold ${isBelowMin ? "text-red-500" : "text-[#5f6f63]"}`}
                    >
                      {currency === "INR" ? "₹" : "$"}
                    </span>
                    <input
                      id="buy-custom-credits"
                      type="number"
                      min={currency === "INR" ? MIN_AMOUNT : Number((MIN_AMOUNT / usdInrRate).toFixed(2))}
                      inputMode="decimal"
                      step={currency === "INR" ? "1" : "0.01"}
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setNotice(null);
                      }}
                      placeholder={currency === "INR" ? "Enter amount e.g. 750" : `Enter amount e.g. ${(500 / usdInrRate).toFixed(2)}`}
                      className={`input pl-8 pr-28 py-3 text-[14px] font-medium !rounded-xl transition-colors ${isBelowMin ? "!border-red-400 !bg-red-50/60 !text-red-700 placeholder:text-red-300 !shadow-[0_0_0_3px_rgba(239,68,68,0.15)]" : ""}`}
                      aria-invalid={isBelowMin}
                      aria-describedby="min-amount-hint"
                    />
                    {canCheckout && !isBelowMin && (
                      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-[#eaf0e8] border border-[#cfe0cf] px-2.5 py-1 text-[11px] font-semibold text-[#143620]">
                        ≈ {currency === "INR" ? formatUSD(amount as number) : formatINR(amount as number)}
                      </span>
                    )}
                    {isBelowMin && (
                      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-red-50 border border-red-200 px-2.5 py-1 text-[11px] font-semibold text-red-600">
                        below min
                      </span>
                    )}
                  </div>
                  <p
                    id="min-amount-hint"
                    className={`mt-1.5 text-[11px] flex items-center gap-1 ${isBelowMin ? "font-semibold text-red-600" : "text-[#8d9d94]"}`}
                  >
                    {isBelowMin ? (
                      <>
                        <CircleAlert className="w-3 h-3 shrink-0" /> Minimum top-up is{" "}
                        {currency === "INR" ? formatINR(MIN_AMOUNT) : formatUSD(MIN_AMOUNT)} (≈{" "}
                        {currency === "INR" ? formatUSD(MIN_AMOUNT) : formatINR(MIN_AMOUNT)}) — enter at least{" "}
                        {currency === "INR" ? MIN_AMOUNT : Number((MIN_AMOUNT / usdInrRate).toFixed(2))} {currency}
                      </>
                    ) : (
                      <>Minimum top-up is {formatINR(MIN_AMOUNT)} • {formatUSD(MIN_AMOUNT)} — 1 credit = ₹1</>
                    )}
                  </p>
                </div>
              </div>

              {/* Mobile summary + CTA (visible only on small screens) */}
              <div className="lg:hidden px-6 sm:px-8 pb-6 pt-5">
                <div className="rounded-xl bg-[#0f2214] text-white p-4 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-medium text-white/60 uppercase tracking-wider">Total due today</div>
                    <div className="mt-1 text-xl font-bold">{canCheckout ? (currency === "INR" ? formatINR(amount as number) : formatUSD(amount as number)) : "—"}</div>
                    {canCheckout && <div className="text-[11px] text-white/60">≈ {currency === "INR" ? formatUSD(amount as number) : formatINR(amount as number)} • {amount} credits</div>}
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-white/60">New balance</div>
                    <div className="text-sm font-semibold">
                      {canCheckout && balance !== null ? (currency === "INR" ? formatINR(balance + (amount as number)) : formatUSD(balance + (amount as number))) : "—"}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!canCheckout || processing}
                  onClick={handleCheckout}
                  className="btn-accent w-full mt-4 py-3.5 text-[14px] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing…
                    </>
                  ) : canCheckout ? (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Pay {currency === "INR" ? formatINR(amount as number) : formatUSD(amount as number)}
                    </>
                  ) : isBelowMin ? (
                    `Minimum ${currency === "INR" ? formatINR(MIN_AMOUNT) : formatUSD(MIN_AMOUNT)}`
                  ) : (
                    "Select an amount"
                  )}
                </button>
                <p className="mt-2 text-center text-[11px] text-[#8d9d94]">Secure checkout via Razorpay — UPI, Cards, Netbanking, Wallets</p>
              </div>

              {/* Desktop footer bar inside card */}
              <div className="hidden lg:flex items-center gap-1.5 border-t border-[#f6f5ef] bg-[#fdfcf8]/60 px-8 py-4 text-[11px] text-[#8d9d94]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Payments are encrypted. We never store card details.
              </div>
            </motion.section>

            {/* Right rail: order summary + trust */}
            <div className="space-y-4 lg:sticky lg:top-6">
              {/* Order summary — primary CTA on desktop */}
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.16 }}
                className="card overflow-hidden"
              >
                <div className="p-6">
                  <h3 className="text-[13px] font-semibold text-[#0f2214]">Order summary</h3>
                  <div className="mt-4 space-y-3 text-[13px]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#5f6f63]">Credits</span>
                      <span className="font-semibold text-[#0f2214]">{canCheckout ? `${(amount as number).toLocaleString("en-IN")} credits` : "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#5f6f63]">Amount ({currency})</span>
                      <span className="font-semibold text-[#0f2214]">{canCheckout ? (currency === "INR" ? formatINR(amount as number) : formatUSD(amount as number)) : "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#5f6f63]">Approx. {currency === "INR" ? "USD" : "INR"}</span>
                      <span className="font-medium text-[#5f6f63]">{canCheckout ? (currency === "INR" ? formatUSD(amount as number) : formatINR(amount as number)) : "—"}</span>
                    </div>
                    <div className="h-px bg-[#f6f5ef]" />
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-semibold text-[#0f2214]">Total due today</span>
                      <span className="text-lg font-bold text-[#0f2214]">{canCheckout ? (currency === "INR" ? formatINR(amount as number) : formatUSD(amount as number)) : "—"}</span>
                    </div>
                    {canCheckout && balance !== null && (
                      <div className="rounded-lg bg-[#eaf0e8] border border-[#cfe0cf] px-3 py-2 flex items-center justify-between">
                        <span className="text-[11px] font-medium text-[#143620]">New balance after top-up</span>
                        <span className="text-[13px] font-bold text-[#143620]">{currency === "INR" ? formatINR(balance + (amount as number)) : formatUSD(balance + (amount as number))}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={!canCheckout || processing}
                    onClick={handleCheckout}
                    className="btn-accent w-full mt-5 py-3 text-[14px] disabled:opacity-40 disabled:cursor-not-allowed hidden lg:inline-flex"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing…
                      </>
                    ) : canCheckout ? (
                      <>
                        <CreditCard className="w-4 h-4" />
                        Pay {currency === "INR" ? formatINR(amount as number) : formatUSD(amount as number)}
                      </>
                    ) : isBelowMin ? (
                      `Minimum ${currency === "INR" ? formatINR(MIN_AMOUNT) : formatUSD(MIN_AMOUNT)}`
                    ) : (
                      "Select an amount"
                    )}
                  </button>
                  <p className="hidden lg:block mt-2 text-center text-[11px] text-[#8d9d94]">
                    You’ll be redirected to Razorpay’s secure checkout.
                  </p>
                </div>
                <div className="border-t border-[#f6f5ef] bg-[#fdfcf8] px-6 py-3 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[#5f6f63]">Questions?</span>
                  <a href="mailto:support@cofounder.ai" className="text-[11px] font-semibold hover:underline" style={{ color: ACCENT }}>
                    Contact support →
                  </a>
                </div>
              </motion.section>


            </div>
          </div>

          {/* ── Invoice history — full width ── */}
          <motion.section
            id="invoice-history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.22 }}
            className="card overflow-hidden"
          >
            <div className="px-6 sm:px-7 pt-6 pb-4">
              <h2 className="text-[15px] font-semibold text-[#0f2214] flex items-center gap-2">
                <ReceiptText className="w-4 h-4 text-[#8d9d94]" />
                Invoice history
              </h2>
              <p className="mt-1 text-[13px] text-[#5f6f63]">
                Invoices are issued when credits are purchased. Dates are in your local timezone.
              </p>
            </div>

            {historyLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-5 w-5 animate-spin" style={{ color: ACCENT }} />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-14 px-6 border-t border-[#f6f5ef]">
                <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-[#fdfcf8] border border-[#e8e9e3] flex items-center justify-center">
                  <ReceiptText className="w-5 h-5 text-[#c2c9c0]" />
                </div>
                <p className="text-sm font-medium text-[#0f2214]">No payments yet</p>
                <p className="mt-1 text-[13px] text-[#8d9d94] max-w-sm mx-auto">
                  Your first credit purchase will show up here with its invoice, status and amount.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border-t border-[#f6f5ef]">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#fdfcf8] border-b border-[#f6f5ef]">
                      {["Date", "Invoice type", "Status", "Cost"].map((h, i) => (
                        <th
                          key={h}
                          className={`px-6 sm:px-7 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#8d9d94] whitespace-nowrap ${
                            i >= 3 ? "text-right" : ""
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f6f5ef]">
                    {history.map((p) => {
                      const meta = STATUS_META[p.status] ?? STATUS_META.pending;
                      const cost = Number(p.amount);
                      return (
                        <tr key={p.id} className="hover:bg-[#fdfcf8]/70 transition-colors">
                          <td className="px-6 sm:px-7 py-3.5 text-[13px] font-medium text-[#0f2214] whitespace-nowrap">
                            {formatDate(p.payment_date)}
                          </td>
                          <td className="px-6 sm:px-7 py-3.5 text-[13px] text-[#2f3e32]">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="w-6 h-6 rounded-md bg-[#eaf0e8] border border-[#e8e9e3] hidden sm:inline-flex items-center justify-center">
                                <Coins className="w-3 h-3" style={{ color: ACCENT }} />
                              </span>
                              {meta.type}
                            </span>
                          </td>
                          <td className="px-6 sm:px-7 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium whitespace-nowrap ${meta.badge}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                              {meta.label}
                            </span>
                          </td>
                          <td className="px-6 sm:px-7 py-3.5 text-right text-[13px] font-semibold text-[#0f2214] whitespace-nowrap">
                            {cost > 0 ? (currency === "INR" ? formatINR(cost) : formatUSD(cost)) : "—"}
                            {cost > 0 && (
                              <span className="ml-1.5 hidden sm:inline text-[11px] font-normal text-[#8d9d94]">
                                ≈ {currency === "INR" ? formatUSD(cost) : formatINR(cost)}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Bottom trust strip inside history card */}
            <div className="border-t border-[#f6f5ef] bg-[#fdfcf8]/60 px-6 sm:px-7 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#8d9d94]">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                All payments are processed securely by Razorpay. Invoices are final.
              </span>
              <span className="font-medium text-[#5f6f63]">Need a GST invoice? Contact support.</span>
            </div>
          </motion.section>
        </>
      )}
    </div>
  );
}
