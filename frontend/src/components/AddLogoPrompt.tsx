"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { ImagePlus, Loader2, X } from "lucide-react";
import { fetchLogo, uploadLogo } from "@/lib/api";

const ACCENT = "#143620";

// Must match backend/api/logo.py (MAX_LOGO_BYTES default) and the
// LOGO_ACCEPT list there.
const MAX_LOGO_BYTES = 5 * 1024 * 1024;
const LOGO_ACCEPT = "image/png,image/jpeg,image/webp,image/gif";

const DISMISS_EVENT = "cofounder:logo-prompt-dismissed";

const dismissedKey = (userId: number) => `cofounder_logo_prompt_dismissed:${userId}`;

// The logo only changes when someone uploads/deletes it, so one check per
// session is enough — this keeps every dashboard/drive mount from re-asking.
const STATUS_TTL_MS = 30 * 60 * 1000;

const statusKey = (userId: number) => `cofounder_logo_status:${userId}`;

type CachedLogoStatus = { hasLogo: boolean; checkedAt: number };

function readCachedStatus(userId: number): boolean | null {
  try {
    const raw = window.sessionStorage.getItem(statusKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedLogoStatus;
    if (typeof parsed?.hasLogo !== "boolean") return null;
    if (Date.now() - (parsed.checkedAt ?? 0) > STATUS_TTL_MS) return null;
    return parsed.hasLogo;
  } catch {
    return null;
  }
}

function writeCachedStatus(userId: number, hasLogo: boolean) {
  try {
    window.sessionStorage.setItem(
      statusKey(userId),
      JSON.stringify({ hasLogo, checkedAt: Date.now() } satisfies CachedLogoStatus),
    );
  } catch {
    // Private mode / storage disabled — the check just runs again next mount.
  }
}

/** Drop the cached logo status (e.g. after the logo was deleted from the Drive). */
export function invalidateLogoStatus(userId: number) {
  try {
    window.sessionStorage.removeItem(statusKey(userId));
  } catch {
    // ignore
  }
}

function subscribeToDismiss(onChange: () => void) {
  window.addEventListener(DISMISS_EVENT, onChange);
  return () => window.removeEventListener(DISMISS_EVENT, onChange);
}

type AddLogoPromptProps = {
  userId: number;
  /** Called after a logo was uploaded (e.g. to refresh the Drive listing). */
  onLogoAdded?: (fileId: number) => void;
  className?: string;
};

/**
 * Nudges founders who have no `logo.png` in their company files yet — mostly
 * accounts created before the onboarding logo step existed. Renders nothing
 * once a logo exists, and "Not now" silences it for the rest of the session.
 */
export default function AddLogoPrompt({ userId, onLogoAdded, className = "" }: AddLogoPromptProps) {
  const [hasLogo, setHasLogo] = useState<boolean | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const dismissed = useSyncExternalStore(
    subscribeToDismiss,
    () => window.sessionStorage.getItem(dismissedKey(userId)) === "1",
    () => false,
  );

  const dismiss = () => {
    window.sessionStorage.setItem(dismissedKey(userId), "1");
    window.dispatchEvent(new Event(DISMISS_EVENT));
  };

  const loadStatus = useCallback(async () => {
    // Already silenced for this session — don't even ask the backend.
    if (window.sessionStorage.getItem(dismissedKey(userId)) === "1") {
      setHasLogo(true);
      return;
    }

    const cached = readCachedStatus(userId);
    if (cached !== null) {
      setHasLogo(cached);
      return;
    }

    try {
      const status = await fetchLogo(userId);
      writeCachedStatus(userId, status.has_logo);
      setHasLogo(status.has_logo);
    } catch {
      // A failed check must never nag the user — stay silent.
      setHasLogo(true);
    }
  }, [userId]);

  useEffect(() => {
    void (async () => {
      await loadStatus();
    })();
  }, [loadStatus]);

  const handleSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Logo must be an image file (PNG, JPG, WEBP or GIF).");
        return;
      }
      if (file.size > MAX_LOGO_BYTES) {
        setError("Logo must be 5MB or smaller.");
        return;
      }

      setUploading(true);
      setError("");
      try {
        const result = await uploadLogo(userId, file);
        writeCachedStatus(userId, true);
        setHasLogo(true);
        onLogoAdded?.(result.file_id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Logo upload failed.");
      } finally {
        setUploading(false);
      }
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  if (hasLogo !== false || dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative flex flex-col gap-4 rounded-2xl border border-[rgba(20,54,32,0.12)] bg-[#eaf0e8]/60 px-5 py-4 sm:flex-row sm:items-center ${className}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={LOGO_ACCEPT}
        onChange={handleSelect}
        className="hidden"
      />

      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[rgba(20,54,32,0.12)] bg-white">
        <ImagePlus className="h-4 w-4" style={{ color: ACCENT }} />
      </span>

      <div className="min-w-0 flex-1">
        <h3 className="text-[14px] font-semibold text-[#0f2214]">Add your company logo</h3>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-[#5f6f63]">
          We couldn&apos;t find a <span className="font-semibold">logo.png </span> in your company
          files. Upload one and we&apos;ll save it there — your AI team uses it for brand assets.
        </p>
        {error && <p className="mt-1.5 text-[12px] font-medium text-red-600">{error}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="btn-primary flex items-center gap-2 px-3.5 py-2 text-[13px] disabled:opacity-60"
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
          <span>{uploading ? "Uploading…" : "Upload logo"}</span>
        </button>
        <button
          type="button"
          onClick={dismiss}
          title="Not now"
          className="rounded-lg border border-[rgba(20,54,32,0.12)] bg-white p-2 text-[#8d9d94] transition-colors hover:text-[#0f2214]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
