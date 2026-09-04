"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { HardDrive, Sparkles, Upload, FileText, Image as ImageIcon, Trash2, Loader2, Eye, Download } from "lucide-react";
import { getSession } from "@/lib/session";
import { fetchFiles, uploadFile, deleteFile, formatFileSize, isImageMime, getFileDownloadUrl } from "@/lib/api";
import type { DriveFile } from "@/lib/api";

const ACCENT = "#143620";

export default function DrivePage() {
  const session = getSession();
  const userId = session?.user?.id;
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [tab, setTab] = useState<"uploaded" | "generated">("uploaded");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try { const r = await fetchFiles(userId); setFiles(r.files); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to load"); }
    finally { setLoading(false); }
  }, [userId]);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setUploading(true);
    try { await uploadFile(userId, file); await loadFiles(); }
    catch (err) { setError(err instanceof Error ? err.message : "Upload failed"); }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  const handleDelete = async (fileId: number) => {
    if (!userId || !window.confirm("Delete this file?")) return;
    setDeleting(fileId);
    try { await deleteFile(userId, fileId); await loadFiles(); }
    catch (err) { setError(err instanceof Error ? err.message : "Delete failed"); }
    finally { setDeleting(null); }
  };

  if (!session) return null;

  const generated = files.filter(f => f.bucket_name === "genrated_buckets");
  const uploaded = files.filter(f => f.bucket_name !== "genrated_buckets");
  const display = tab === "generated" ? generated : uploaded;

  return (
    <>
      {error && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-[13px] font-medium text-red-600 mb-6">
          {error} <button onClick={() => setError("")} className="ml-3 underline">Dismiss</button>
        </motion.div>
      )}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#0f2214]">Drive</h2>
            <p className="text-sm text-[#5f6f63] mt-0.5">{uploaded.length} uploaded · {generated.length} generated</p>
          </div>
          {tab === "uploaded" && (
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="btn-primary px-4 py-2.5 text-[13px] self-start disabled:opacity-60">
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {uploading ? "Uploading…" : "Upload File"}
            </button>
          )}
        </div>

        <div className="flex gap-1 p-1 bg-[rgba(16,36,24,0.04)] rounded-xl w-fit border border-[rgba(15,34,20,0.06)]">
          {[
            { id: "uploaded" as const, icon: Upload, label: "Uploaded", count: uploaded.length },
            { id: "generated" as const, icon: Sparkles, label: "Generated", count: generated.length },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-[13px] font-medium rounded-lg transition-all ${tab === t.id ? "bg-white text-[#0f2214] shadow-sm border border-[rgba(15,34,20,0.07)]" : "text-[#5f6f63] hover:text-[#0f2214]"}`}>
              <t.icon className="w-3.5 h-3.5 inline mr-1.5" />{t.label}<span className="ml-1.5 text-[10px] text-[#8d9d94]">({t.count})</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin" style={{ color: ACCENT }} /></div>
        ) : display.length === 0 ? (
          <div className="card p-12 text-center flex flex-col items-center justify-center min-h-[320px]">
            <div className="w-14 h-14 rounded-2xl bg-[rgba(16,36,24,0.04)] flex items-center justify-center mb-4 border border-[rgba(15,34,20,0.06)]">
              {tab === "generated" ? <Sparkles className="w-6 h-6 text-[#8d9d94]" /> : <HardDrive className="w-6 h-6 text-[#8d9d94]" />}
            </div>
            <h3 className="text-[15px] font-semibold text-[#0f2214] mb-1">{tab === "generated" ? "No generated graphics yet" : "No files yet"}</h3>
            <p className="text-sm text-[#5f6f63] mb-5">{tab === "generated" ? "Graphics from the AI Designer appear here." : "Upload your first file."}</p>
            {tab === "uploaded" && <button onClick={() => fileInputRef.current?.click()} className="btn-primary px-4 py-2.5 text-[13px]"><Upload className="w-3.5 h-3.5" />Upload File</button>}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {display.map((f, i) => (
              <motion.div key={f.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="card card-hover p-4 flex flex-col group relative">
                <button onClick={(e) => { e.stopPropagation(); handleDelete(f.id); }} disabled={deleting === f.id}
                  className="absolute top-2.5 right-2.5 w-7 h-7 rounded-lg bg-white border border-[rgba(15,34,20,0.08)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:border-red-200 hover:bg-red-50 z-10">
                  {deleting === f.id ? <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" /> : <Trash2 className="w-3.5 h-3.5 text-[#8d9d94]" />}
                </button>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ background: "rgba(20,54,32,0.07)" }}>
                  {isImageMime(f.mime_type) ? <ImageIcon className="w-5 h-5" style={{ color: ACCENT }} /> : <FileText className="w-5 h-5" style={{ color: ACCENT }} />}
                </div>
                <div className="text-[13px] font-semibold text-[#0f2214] truncate mb-0.5" title={f.original_file_name}>{f.original_file_name}</div>
                <div className="text-xs text-[#8d9d94] truncate mb-3 flex-1">{f.description ?? "No description"}</div>
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-[rgba(15,34,20,0.06)]">
                  <span className="text-[10px] font-semibold bg-[rgba(20,54,32,0.07)] rounded-md px-2 py-0.5 truncate border border-[rgba(20,54,32,0.08)]" style={{ color: ACCENT }}>
                    {f.mime_type.split("/")[1]?.toUpperCase() ?? f.mime_type}
                  </span>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <a href={getFileDownloadUrl(f.id, userId ?? 0, true)} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                      className="w-6 h-6 rounded-md flex items-center justify-center text-[#8d9d94] hover:bg-[rgba(16,36,24,0.05)] hover:text-[#2f3e32]" title="View"><Eye className="w-3 h-3" /></a>
                    <a href={getFileDownloadUrl(f.id, userId ?? 0, false)} onClick={e => e.stopPropagation()}
                      className="w-6 h-6 rounded-md flex items-center justify-center text-[#8d9d94] hover:bg-[rgba(16,36,24,0.05)] hover:text-[#2f3e32]" title="Download"><Download className="w-3 h-3" /></a>
                  </div>
                </div>
                <div className="text-[10px] text-[#aab8b0] mt-1.5">{new Date(f.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
    </>
  );
}
