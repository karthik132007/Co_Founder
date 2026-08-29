"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  Loader2,
  CircleAlert,
  CheckCircle2,
} from "lucide-react";
import { getSession } from "@/lib/session";
import {
  fetchProfile,
  fetchCreditBalance,
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "@/lib/api";

const ACCENT = "#4f46e5";

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

const CREDIT_PACKS = [
  { amount: 500, label: "Starter" },
  { amount: 1000, label: "Growth" },
  { amount: 2500, label: "Scale" },
  { amount: 5000, label: "Business" },
];

// Display-only conversion rate used to show credit prices in USD
// (credits are stored in INR — 1 credit = ₹1).
const USD_INR_RATE = 83;

const formatMoney = (credits: number, currency: "INR" | "USD") =>
  currency === "INR"
    ? credits.toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      })
    : (credits / USD_INR_RATE).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      });

export default function BillingPage() {
  const session = getSession();
  const userId = session?.user?.id;
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPack, setSelectedPack] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");
  const [processing, setProcessing] = useState(false);
  const [notice, setNotice] = useState<
    { type: "error" | "success"; text: string } | null
  >(null);
  const razorpayRef = useRef<RazorpayInstance | null>(null);

  // Close an open Razorpay modal if the user navigates away mid-checkout.
  useEffect(() => {
    return () => razorpayRef.current?.close?.();
  }, []);

  const loadBalance = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError("");
    try {
      const profile = await fetchProfile(userId);
      const data = await fetchCreditBalance(profile.company.id);
      setBalance(data.balance);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load credit balance");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  if (!session || !userId) return null;

  // Credits are stored in INR (1 credit = ₹1). When USD is selected, the
  // custom amount entered is converted to credits at the display rate.
  const amount = customAmount.trim()
    ? currency === "INR"
      ? Number(customAmount)
      : Number(customAmount) * USD_INR_RATE
    : selectedPack;
  const canCheckout =
    typeof amount === "number" && Number.isFinite(amount) && amount > 0;

  const handlePackClick = (packAmount: number) => {
    setSelectedPack(packAmount);
    setCustomAmount("");
    setNotice(null);
  };

  const handleCheckout = async () => {
    if (!canCheckout || processing || !userId) return;
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
      const order = await createRazorpayOrder(
        companyId,
        userId,
        amount as number,
      );

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
        description: `Top-up of ${formatMoney(order.amount / 100, "INR")} credits`,
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
                : `Payment successful! ${formatMoney(
                    verified.amount,
                    "INR",
                  )} credits added to your balance.`,
            });
            setSelectedPack(null);
            setCustomAmount("");
            await loadBalance();
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
            await loadBalance();            // Payment may have been credited server-side — refresh the badge too.
            window.dispatchEvent(new Event("cofounder:credits-updated"));          } finally {
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-3xl"
    >
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-[13px] font-medium text-red-600">
          {error}{" "}
          <button onClick={() => setError("")} className="ml-3 underline">
            Dismiss
          </button>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-[#0a0a0a]">
          Billing &amp; Credits
        </h2>
        <p className="text-sm text-[#6b7280] mt-0.5">
          Top up credits to keep your AI team running.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: ACCENT }} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Balance */}
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#eef2ff] flex items-center justify-center">
                  <Wallet className="w-4 h-4" style={{ color: ACCENT }} />
                </div>
                <div>
                  <div className="text-[11px] font-medium text-[#9ca3af] uppercase tracking-wider">
                    Current balance
                  </div>
                  <div className="mt-0.5 text-2xl font-semibold text-[#0a0a0a]">
                    {balance !== null ? formatMoney(balance, currency) : "—"}
                  </div>
                </div>
              </div>

              {/* Currency toggle */}
              <div className="inline-flex items-center rounded-lg border border-[#e5e7eb] bg-white p-0.5">
                {(["INR", "USD"] as const).map((cur) => (
                  <button
                    key={cur}
                    type="button"
                    onClick={() => setCurrency(cur)}
                    className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all ${
                      currency === cur
                        ? "bg-[#0a0a0a] text-white"
                        : "text-[#6b7280] hover:text-[#0a0a0a]"
                    }`}
                  >
                    {cur === "INR" ? "₹ INR" : "$ USD"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Packs */}
          <div className="card p-6">
            <h3 className="text-[15px] font-semibold text-[#0a0a0a] mb-4">
              Choose a pack
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CREDIT_PACKS.map((pack) => {
                const active = selectedPack === pack.amount;
                return (
                  <button
                    key={pack.amount}
                    type="button"
                    onClick={() => handlePackClick(pack.amount)}
                    className={`rounded-xl border p-4 text-left transition-all ${
                      active
                        ? "border-[#4f46e5] bg-[#eef2ff] shadow-sm"
                        : "border-[#e5e7eb] bg-white hover:border-[#c7d2fe] hover:shadow-sm"
                    }`}
                  >
                    <div
                      className={`text-[13px] font-semibold ${
                        active ? "text-[#4f46e5]" : "text-[#0a0a0a]"
                      }`}
                    >
                      {pack.label}
                    </div>
                    <div className="text-[13px] text-[#6b7280] mt-0.5">
                      {formatMoney(pack.amount, currency)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom + checkout */}
          <div className="card p-6">
            <h3 className="text-[15px] font-semibold text-[#0a0a0a] mb-4">
              Add credits
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div className="space-y-1.5">
                <label
                  htmlFor="custom-credits"
                  className="text-[13px] font-semibold text-[#374151]"
                >
                  Custom amount
                </label>
                <input
                  id="custom-credits"
                  type="number"
                  min="1"
                  inputMode="numeric"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setSelectedPack(null);
                    setNotice(null);
                  }}
                  placeholder={currency === "INR" ? "Enter amount in ₹" : "Enter amount in $"}
                  className="input px-3.5 py-2.5 text-[14px]"
                />
              </div>
              <button
                type="button"
                disabled={!canCheckout || processing}
                onClick={handleCheckout}
                className="btn-primary w-full py-3 text-[14px] disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing…
                  </>
                ) : canCheckout ? (
                  `Add ${formatMoney(amount as number, currency)} credits`
                ) : (
                  "Add credits"
                )}
              </button>
            </div>
            {notice && (
              <div
                className={`mt-4 flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-[13px] ${
                  notice.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-amber-200 bg-amber-50 text-amber-800"
                }`}
              >
                {notice.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                ) : (
                  <CircleAlert className="w-4 h-4 mt-0.5 shrink-0" />
                )}
                {notice.text}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
