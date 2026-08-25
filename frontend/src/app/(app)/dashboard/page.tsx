"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { HardDrive, Sparkles, ArrowUpRight, Upload, FileText, Image as ImageIcon, MessageSquare, Loader2 } from "lucide-react";
import { getSession } from "@/lib/session";
import { fetchDashboard, fetchFiles, uploadFile, formatFileSize, isImageMime } from "@/lib/api";
import type { DashboardData, DriveFile } from "@/lib/api";

const ACCENT = "#4f46e5";

export default function DashboardPage() {
  const session = getSession();
  const userId = session?.user?.id;
  const [data, setData] = useState<DashboardData | null>(null);
  const [allFiles, setAllFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [dash, files] = await Promise.all([fetchDashboard(userId), fetchFiles(userId)]);
      setData(dash);
      setAllFiles(files.files);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally { setLoading(false); }
  }, [userId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setUploading(true);
    try { await uploadFile(userId, file); await loadAll(); }
    catch (err) { setError(err instanceof Error ? err.message : "Upload failed"); }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  if (!session) return null;

  const company = data?.company;
  const stats = data?.stats;
  const recentFiles = data?.recent_files ?? [];

  return (
    <>
      {error && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-[13px] font-medium text-red-600 mb-6">
          {error} <button onClick={() => setError("")} className="ml-3 underline">Dismiss</button>
        </motion.div>
      )}
      {loading ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin" style={{ color: ACCENT }} /></div>
      ) : (
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <h2 className="text-2xl font-semibold tracking-tight text-[#0a0a0a]">Welcome back, <span className="text-gradient">{company?.company_name ?? session.user.name ?? session.user.email.split("@")[0]}</span></h2>
            <p className="mt-1 text-sm text-[#6b7280]">{company ? `${company.industry} · ${company.tone} tone` : "Here's what your AI team is up to."}</p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {([
              { label: "Total Files", value: String(stats?.total_files ?? 0), sub: `${stats?.documents ?? 0} docs · ${stats?.images ?? 0} images`, icon: HardDrive },
              { label: "Storage Used", value: formatFileSize(stats?.total_size_bytes ?? 0), sub: "Drive", icon: HardDrive },
              { label: "Company", value: company?.company_name ?? "—", sub: company?.industry ?? "", icon: Sparkles },
              { label: "Brand Tone", value: (company?.tone ?? "professional").toUpperCase(), sub: company?.industry ?? "", icon: Sparkles },
            ]).map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 + i * 0.05 }} className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[#eef2ff] flex items-center justify-center"><stat.icon className="w-4 h-4" style={{ color: ACCENT }} /></div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#d4d4d8]" />
                </div>
                <div className="text-[11px] font-medium text-[#9ca3af] uppercase tracking-wider">{stat.label}</div>
                <div className="mt-1 text-lg font-semibold text-[#0a0a0a] truncate">{stat.value}</div>
                <div className="text-[11px] text-[#6b7280] mt-0.5 truncate">{stat.sub}</div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.25 }} className="card p-6">
                <h3 className="text-[15px] font-semibold text-[#0a0a0a] mb-1">About {company?.company_name}</h3>
                <p className="text-[11px] text-[#9ca3af] mb-3 uppercase tracking-wider font-medium">{company?.industry} · {company?.tone} tone</p>
                <p className="text-sm text-[#6b7280] leading-relaxed">{company?.small_description ?? "No description provided."}</p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.35 }} className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[15px] font-semibold text-[#0a0a0a]">Recent Files</h3>
                  <a href="/drive" className="text-[13px] font-medium hover:underline" style={{ color: ACCENT }}>View all</a>
                </div>
                {recentFiles.length === 0 ? (
                  <p className="text-sm text-[#9ca3af] py-6 text-center">No files yet.</p>
                ) : (
                  <div className="divide-y divide-[#f3f4f6]">
                    {recentFiles.map(f => (
                      <div key={f.id} className="flex items-center gap-3.5 py-3 first:pt-0 last:pb-0">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: isImageMime(f.mime_type) ? "#f5f3ff" : "#eef2ff" }}>
                          {isImageMime(f.mime_type) ? <ImageIcon className="w-4 h-4 text-[#7c3aed]" /> : <FileText className="w-4 h-4" style={{ color: ACCENT }} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-medium text-[#0a0a0a] truncate">{f.original_file_name}</div>
                          <div className="text-xs text-[#6b7280] truncate">{f.description ?? f.mime_type}</div>
                        </div>
                        <span className="text-xs font-medium text-[#9ca3af] shrink-0">{formatFileSize(f.file_size)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.3 }} className="card p-6 h-fit">
              <h3 className="text-[15px] font-semibold text-[#0a0a0a] mb-4">Quick Actions</h3>
              <div className="space-y-2.5">
                {[
                  { icon: Upload, label: "Upload File", sub: "Add to your Drive", onClick: () => fileInputRef.current?.click() },
                  { icon: HardDrive, label: "Browse Drive", sub: `${stats?.total_files ?? 0} files`, href: "/drive" },
                  { icon: MessageSquare, label: "New Chat", sub: "Talk to your AI team", href: "/chat" },
                ].map(a => {
                  const inner = (
                    <div className="w-full border border-[#e5e7eb] rounded-xl p-3.5 flex items-center gap-3 hover:border-[#4f46e5]/40 hover:bg-[#fafafa] transition-all text-left">
                      <div className="w-9 h-9 rounded-lg bg-[#eef2ff] flex items-center justify-center shrink-0"><a.icon className="w-4 h-4" style={{ color: ACCENT }} /></div>
                      <div><div className="text-[13px] font-semibold text-[#0a0a0a]">{a.label}</div><div className="text-[11px] text-[#6b7280]">{a.sub}</div></div>
                    </div>
                  );
                  return a.href ? <a key={a.label} href={a.href}>{inner}</a> : <button key={a.label} onClick={a.onClick}>{inner}</button>;
                })}
              </div>
            </motion.div>
          </div>
        </div>
      )}
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
    </>
  );
}
