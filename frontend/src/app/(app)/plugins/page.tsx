"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Check,
  CircleAlert,
  CircleCheck,
  Cloud,
  FileText,
  Hash,
  Link2,
  Loader2,
  Mail,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/session";
import {
  disconnectInstagram,
  fetchConnections,
  fetchProfile,
  instagramConnectUrl,
  type ConnectionInfo,
} from "@/lib/api";

type ConnectorDef = {
  id: string;
  name: string;
  description: string;
  img?: string; // public SVG logo
  Icon?: LucideIcon; // lucide fallback when no SVG is available
  tint: string; // brand colour for the logo tile
};

const CONNECTORS: ConnectorDef[] = [
  { id: "instagram", name: "Instagram", description: "Publish content and pull insights from Instagram", img: "/instagram.svg", tint: "#E1306C" },
  { id: "google_sheets", name: "Google Sheets", description: "Sync data and reports from your spreadsheets", img: "/google-sheets.svg", tint: "#34A853" },
  { id: "google_drive", name: "Google Drive", description: "Search, read, and upload files instantly", Icon: Cloud, tint: "#FBBC04" },
  { id: "gmail", name: "Gmail", description: "Draft replies, summarize threads & search your inbox", Icon: Mail, tint: "#EA4335" },
  { id: "google_calendar", name: "Google Calendar", description: "Manage your schedule and coordinate meetings", Icon: CalendarDays, tint: "#4285F4" },
  { id: "notion", name: "Notion", description: "Connect your Notion workspace to power workflows", Icon: FileText, tint: "#1f2937" },
  { id: "slack", name: "Slack", description: "Send messages and fetch Slack data", Icon: Hash, tint: "#4A154B" },
  { id: "shopify", name: "Shopify", description: "Orders & sales data", img: "/shopify.svg", tint: "#96BF48" },
];

type Filter = "all" | "connected" | "available";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "connected", label: "Connected" },
  { id: "available", label: "Available" },
];

type Notice = { type: "success" | "error"; text: string } | null;

export default function PluginsPage() {
  const router = useRouter();
  const session = getSession();
  const userId = session?.user?.id;

  const [connections, setConnections] = useState<ConnectionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Read the OAuth callback outcome (?instagram=connected|error) once during
  // the initial client render. This page only renders after the app layout has
  // hydrated (guarded by the session), so window is always available here.
  const [notice, setNotice] = useState<Notice>(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const status = params.get("instagram");
    if (status === "connected") {
      return { type: "success", text: "Instagram connected successfully." };
    }
    if (status === "error") {
      return {
        type: "error",
        text: params.get("detail") || "Instagram connection failed. Please try again.",
      };
    }
    return null;
  });

  const loadConnections = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await fetchConnections(userId);
      setConnections(data.connections);
    } catch {
      // Non-critical — grid simply shows the static catalog.
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Clean the OAuth query params off the URL once, so a refresh doesn't re-show
  // the banner. This mutates browser history (an external system), not React state.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("instagram")) {
      router.replace("/plugins", { scroll: false });
    }
  }, [router]);

  // Initial load. The fetch resolves asynchronously, so the connection list is
  // updated in a microtask rather than synchronously inside the effect body.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!userId) return;
      try {
        const data = await fetchConnections(userId);
        if (!cancelled) setConnections(data.connections);
      } catch {
        // Non-critical — grid simply shows the static catalog.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const connectionById = useMemo(() => {
    const map = new Map<string, ConnectionInfo>();
    for (const c of connections) map.set(c.id, c);
    return map;
  }, [connections]);

  const visibleConnectors = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CONNECTORS.filter((c) => {
      const info = connectionById.get(c.id);
      const connected = info?.connected ?? false;
      const available = info?.available ?? false;

      if (filter === "connected" && !connected) return false;
      if (filter === "available" && !available) return false;
      if (q && !`${c.name} ${c.description}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [connectionById, query, filter]);

  if (!session || !userId) return null;

  const handleConnect = async (connector: ConnectorDef) => {
    if (connector.id !== "instagram" || connecting) return;
    setConnecting(true);
    setNotice(null);
    try {
      const profile = await fetchProfile(userId);
      // Full-page redirect → Instagram → backend callback → back to /plugins.
      window.location.assign(
        instagramConnectUrl(profile.company.id, `${window.location.origin}/plugins`),
      );
    } catch {
      setNotice({
        type: "error",
        text: "Could not start the Instagram connection. Please try again.",
      });
      setConnecting(false);
    }
  };

  const handleDisconnect = async (connector: ConnectorDef) => {
    if (connector.id !== "instagram") return;
    if (!window.confirm("Disconnect Instagram?")) return;
    setNotice(null);
    try {
      await disconnectInstagram(userId);
      setNotice({ type: "success", text: "Instagram disconnected." });
      await loadConnections();
    } catch (e) {
      setNotice({
        type: "error",
        text: e instanceof Error ? e.message : "Failed to disconnect Instagram.",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-[#0f2214]">Plugins</h2>
        <p className="text-sm text-[#5f6f63]">
          Connect the tools you already use so your AI team can act on them.
        </p>
      </div>

      {/* Notice banner */}
      {notice && (
        <div
          className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm ${
            notice.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-600"
          }`}
        >
          {notice.type === "success" ? (
            <CircleCheck className="h-4 w-4 shrink-0" />
          ) : (
            <CircleAlert className="h-4 w-4 shrink-0" />
          )}
          {notice.text}
          <button
            onClick={() => setNotice(null)}
            className="ml-auto text-xs font-medium opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search + filter */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d9d94]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search connectors"
            className="input pl-9 py-2.5 text-sm"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setFilterOpen((v) => !v)}
            className="inline-flex items-center gap-2 rounded-lg border border-[rgba(15,34,20,0.08)] bg-white px-3.5 py-2.5 text-sm font-medium text-[#2f3e32] hover:bg-[#fdfcf8] transition-colors"
          >
            <SlidersHorizontal className="h-4 w-4 text-[#5f6f63]" />
            Filter: {FILTERS.find((f) => f.id === filter)?.label}
          </button>
          {filterOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-[rgba(15,34,20,0.08)] bg-white p-1 shadow-[0_8px_30px_rgba(15,34,20,0.12)]">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setFilter(f.id);
                      setFilterOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                      filter === f.id
                        ? "bg-[rgba(20,54,32,0.08)] text-[#143620] font-semibold"
                        : "text-[#2f3e32] hover:bg-[rgba(16,36,24,0.05)]"
                    }`}
                  >
                    {f.label}
                    {filter === f.id && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Section heading */}
      <div className="flex items-center justify-between pt-2">
        <h3 className="text-[15px] font-semibold text-[#0f2214]">Top connectors</h3>
        <button
          onClick={() => {
            setQuery("");
            setFilter("all");
          }}
          className="text-[13px] font-medium text-[#143620] hover:underline"
        >
          Show all
        </button>
      </div>

      {/* Grid */}
      {loading && connections.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[#c2c9c0]" />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {visibleConnectors.map((c, i) => {
            const info = connectionById.get(c.id);
            const connected = info?.connected ?? false;
            const available = info?.available ?? false;
            const isConnecting = connecting && c.id === "instagram";
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.3 }}
                className="card card-hover flex items-center gap-3.5 p-4"
              >
                {/* Logo */}
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
                  style={{
                    background: `${c.tint}14`,
                    borderColor: `${c.tint}2e`,
                    color: c.tint,
                  }}
                >
                  {c.img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.img}
                      alt={`${c.name} logo`}
                      className="h-6 w-6 object-contain"
                    />
                  ) : c.Icon ? (
                    <c.Icon className="h-5 w-5" strokeWidth={1.75} />
                  ) : (
                    <Link2 className="h-5 w-5" strokeWidth={1.75} />
                  )}
                </span>

                {/* Name + description */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[14px] font-semibold text-[#0f2214]">
                      {c.name}
                    </span>
                    {connected && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                        <Check className="h-3 w-3" /> Connected
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-[#5f6f63]">
                    {c.description}
                  </p>
                </div>

                {/* Action */}
                <div className="shrink-0">
                  {connected ? (
                    <button
                      onClick={() => handleDisconnect(c)}
                      className="rounded-lg border border-[rgba(15,34,20,0.08)] px-3 py-1.5 text-[12px] font-medium text-[#5f6f63] hover:border-red-200 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      Disconnect
                    </button>
                  ) : available ? (
                    <button
                      onClick={() => handleConnect(c)}
                      disabled={isConnecting}
                      aria-label={`Connect ${c.name}`}
                      className="btn-primary h-9 w-9 rounded-full"
                    >
                      {isConnecting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </button>
                  ) : (
                    <span className="rounded-lg bg-[#f6f5ef] px-3 py-1.5 text-[12px] font-medium text-[#8d9d94]">
                      Soon
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {!loading && visibleConnectors.length === 0 && (
        <div className="card p-10 text-center text-sm text-[#8d9d94]">
          No connectors match your search.
        </div>
      )}
    </div>
  );
}
