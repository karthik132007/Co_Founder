"use client";

import { openCookiePreferences } from "@/lib/consent";

/** Re-opens the cookie preferences dialog (footer, cookie/privacy pages). */
export function CookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={openCookiePreferences}
      className="rounded-[0.625rem] border border-[rgba(15,34,20,0.16)] px-4 py-2 text-[13px] font-semibold text-[#0f2214] transition hover:bg-[rgba(16,36,24,0.05)]"
    >
      Cookie settings
    </button>
  );
}
