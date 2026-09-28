"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie } from "lucide-react";
import { CONSENT_EVENT, getConsent, setConsent, type ConsentChoice } from "@/lib/consent";

/**
 * Cookie consent banner. Appears once per browser (until the user chooses),
 * bottom-left on desktop and full-width on mobile. Accepting enables the
 * analytics described in /cookies; rejecting (or ignoring) loads none of
 * them. Necessary storage always stays on either way.
 */
export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getConsent() !== null) return;
    // Small delay so the banner never competes with first paint.
    const t = window.setTimeout(() => {
      if (getConsent() === null) setVisible(true);
    }, 900);
    const onUpdate = () => setVisible(false);
    window.addEventListener(CONSENT_EVENT, onUpdate);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener(CONSENT_EVENT, onUpdate);
    };
  }, []);

  const choose = (choice: ConsentChoice) => {
    setConsent(choice);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          role="dialog"
          aria-live="polite"
          aria-label="Cookie consent"
          className="fixed bottom-4 left-4 right-4 z-[90] sm:right-auto sm:max-w-md"
        >
          <div className="rounded-2xl border border-[rgba(15,34,20,0.1)] bg-white p-5 shadow-[0_16px_48px_rgba(15,34,20,0.22)]">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eaf0e8]">
                <Cookie className="h-4 w-4 text-[#143620]" />
              </span>
              <p className="text-[14px] font-semibold text-[#0f2214]">Cookies &amp; analytics</p>
            </div>
            <p className="mt-2.5 text-[13px] leading-relaxed text-[#5f6f63]">
              Necessary storage keeps you signed in and is always on. Optional
              analytics (Vercel + Google Analytics) only load if you accept.{" "}
              <Link href="/cookies" className="underline hover:text-[#0f2214]">
                Learn more
              </Link>
            </p>
            <div className="mt-4 flex items-center gap-2.5">
              <button
                onClick={() => choose("rejected")}
                className="flex-1 rounded-xl border border-[rgba(15,34,20,0.12)] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#2f3e32] hover:bg-[#f6f5ef] transition-colors"
              >
                Reject
              </button>
              <button
                onClick={() => choose("accepted")}
                className="btn-primary flex-1 px-4 py-2.5 text-[13px]"
              >
                Accept analytics
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
