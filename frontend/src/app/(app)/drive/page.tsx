"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HardDrive,
  Sparkles,
  Upload,
  FileText,
  Image as ImageIcon,
  Trash2,
  Loader2,
  Eye,
  Download,
  ExternalLink,
  X,
  Layers,
} from "lucide-react";
import { getSession } from "@/lib/session";
import {
  fetchFiles,
  uploadFile,
  deleteFile,
  isImageMime,
  getFileDownloadUrl,
  formatFileSize,
} from "@/lib/api";
import type { DriveFile } from "@/lib/api";

const ACCENT = "#143620";

function ImageThumbnail({
  src,
  alt,
  mime,
  ext,
}: {
  src: string;
  alt: string;
  mime?: string;
  ext?: string | null;
}) {
  const [failed, setFailed] = useState(false);
  const isImg = isImageMime(mime, ext);

  if (!isImg || failed) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[rgba(20,54,32,0.03)] text-[#8d9d94]">
        {isImg ? (
          <ImageIcon className="w-8 h-8 stroke-[1.4] text-[#143620]/40" />
        ) : (
          <FileText className="w-8 h-8 stroke-[1.4] text-[#143620]/40" />
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
    />
  );
}

export default function DrivePage() {
  const session = getSession();
  const userId = session?.user?.id;
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [tab, setTab] = useState<"all" | "generated" | "uploaded">("all");
  const [previewFile, setPreviewFile] = useState<DriveFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const r = await fetchFiles(userId);
      setFiles(r.files);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load files");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewFile(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setUploading(true);
    try {
      await uploadFile(userId, file);
      await loadFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (fileId: number) => {
    if (!userId || !window.confirm("Are you sure you want to delete this file?")) return;
    setDeleting(fileId);
    try {
      await deleteFile(userId, fileId);
      if (previewFile?.id === fileId) setPreviewFile(null);
      await loadFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  if (!session) return null;

  const generated = files.filter((f) => f.bucket_name === "genrated_buckets");
  const uploaded = files.filter((f) => f.bucket_name !== "genrated_buckets");
  const display = tab === "all" ? files : tab === "generated" ? generated : uploaded;

  return (
    <>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-[13px] font-medium text-red-600 mb-6 flex items-center justify-between"
        >
          <span>{error}</span>
          <button onClick={() => setError("")} className="ml-3 underline hover:no-underline">
            Dismiss
          </button>
        </motion.div>
      )}

      <div className="space-y-6">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#0f2214]">Drive</h2>
            <p className="text-sm text-[#5f6f63] mt-0.5">
              {files.length} total files · {generated.length} AI generated · {uploaded.length} uploaded
            </p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn-primary px-4 py-2.5 text-[13px] self-start sm:self-auto disabled:opacity-60 flex items-center gap-2"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span>{uploading ? "Uploading…" : "Upload File"}</span>
          </button>
        </div>

        {/* Tab filters */}
        <div className="flex gap-1 p-1 bg-[rgba(16,36,24,0.04)] rounded-xl w-fit border border-[rgba(15,34,20,0.06)]">
          {[
            { id: "all" as const, icon: Layers, label: "All Media", count: files.length },
            { id: "generated" as const, icon: Sparkles, label: "AI Generated", count: generated.length },
            { id: "uploaded" as const, icon: Upload, label: "Uploaded", count: uploaded.length },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-[13px] font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                tab === t.id
                  ? "bg-white text-[#0f2214] shadow-sm border border-[rgba(15,34,20,0.07)]"
                  : "text-[#5f6f63] hover:text-[#0f2214]"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  tab === t.id ? "bg-[rgba(20,54,32,0.08)] text-[#143620]" : "text-[#8d9d94]"
                }`}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Content list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <Loader2 className="h-7 w-7 animate-spin mb-3" style={{ color: ACCENT }} />
            <p className="text-sm text-[#8d9d94]">Loading your media library…</p>
          </div>
        ) : display.length === 0 ? (
          <div className="card p-12 text-center flex flex-col items-center justify-center min-h-[320px]">
            <div className="w-14 h-14 rounded-2xl bg-[rgba(16,36,24,0.04)] flex items-center justify-center mb-4 border border-[rgba(15,34,20,0.06)]">
              {tab === "generated" ? (
                <Sparkles className="w-6 h-6 text-[#8d9d94]" />
              ) : (
                <HardDrive className="w-6 h-6 text-[#8d9d94]" />
              )}
            </div>
            <h3 className="text-[15px] font-semibold text-[#0f2214] mb-1">
              {tab === "generated"
                ? "No generated graphics yet"
                : tab === "uploaded"
                ? "No uploaded files yet"
                : "Your Drive is empty"}
            </h3>
            <p className="text-sm text-[#5f6f63] max-w-sm mb-5">
              {tab === "generated"
                ? "Graphics and visuals designed by the Graphic Designer agent will appear here automatically."
                : tab === "uploaded"
                ? "Upload company assets, logos, and reference materials to share with your AI team."
                : "Upload company assets or ask your AI team to generate visuals for you."}
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-primary px-4 py-2.5 text-[13px] flex items-center gap-2"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload File</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {display.map((f, i) => {
              const isImg = isImageMime(f.mime_type, f.file_extension);
              const downloadUrl = getFileDownloadUrl(f.id, userId ?? 0, false);
              const inlineUrl = getFileDownloadUrl(f.id, userId ?? 0, true);

              return (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => {
                    if (isImg) {
                      setPreviewFile(f);
                    } else {
                      window.open(inlineUrl, "_blank", "noreferrer");
                    }
                  }}
                  className="card card-hover p-3 flex flex-col group relative cursor-pointer hover:border-[rgba(20,54,32,0.2)] transition-all"
                >
                  {/* Delete button on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(f.id);
                    }}
                    disabled={deleting === f.id}
                    className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-white/90 backdrop-blur-sm border border-[rgba(15,34,20,0.1)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:border-red-200 hover:bg-red-50 z-20 shadow-sm"
                    title="Delete file"
                  >
                    {deleting === f.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5 text-[#8d9d94] hover:text-red-600" />
                    )}
                  </button>

                  {/* Thumbnail display */}
                  <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-[rgba(16,36,24,0.04)] border border-[rgba(15,34,20,0.06)] relative mb-3 flex items-center justify-center">
                    <ImageThumbnail
                      src={inlineUrl}
                      alt={f.original_file_name}
                      mime={f.mime_type}
                      ext={f.file_extension}
                    />

                    {/* AI Generated tag */}
                    {f.bucket_name === "genrated_buckets" && (
                      <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-[#143620]/90 text-white text-[10px] font-medium px-2 py-0.5 rounded-full shadow-sm backdrop-blur-sm">
                        <Sparkles className="w-2.5 h-2.5 text-emerald-300" />
                        <span>AI Graphic</span>
                      </div>
                    )}

                    {/* Quick View Hover overlay */}
                    {isImg && (
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/95 text-[11px] font-semibold text-[#0f2214] shadow-md">
                          <Eye className="w-3 h-3 text-[#143620]" /> Preview
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Filename & description */}
                  <div
                    className="text-[13px] font-semibold text-[#0f2214] truncate mb-0.5"
                    title={f.original_file_name}
                  >
                    {f.original_file_name}
                  </div>
                  <div
                    className="text-xs text-[#8d9d94] truncate mb-3 flex-1"
                    title={f.description ?? ""}
                  >
                    {f.description || (isImg ? "Image graphic" : "Document")}
                  </div>

                  {/* Footer with meta & actions */}
                  <div
                    className="flex items-center justify-between gap-2 pt-2.5 border-t border-[rgba(15,34,20,0.06)]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="text-[10px] font-semibold bg-[rgba(20,54,32,0.07)] rounded-md px-1.5 py-0.5 truncate border border-[rgba(20,54,32,0.08)]"
                        style={{ color: ACCENT }}
                      >
                        {f.file_extension?.toUpperCase() ||
                          f.mime_type.split("/")[1]?.toUpperCase() ||
                          "FILE"}
                      </span>
                      <span className="text-[10px] text-[#8d9d94] truncate">
                        {formatFileSize(f.file_size)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          if (isImg) {
                            setPreviewFile(f);
                          } else {
                            window.open(inlineUrl, "_blank", "noreferrer");
                          }
                        }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[#8d9d94] hover:bg-[rgba(16,36,24,0.06)] hover:text-[#0f2214] transition-colors"
                        title="View"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <a
                        href={downloadUrl}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[#8d9d94] hover:bg-[rgba(16,36,24,0.06)] hover:text-[#0f2214] transition-colors"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox / Preview Modal */}
      <AnimatePresence>
        {previewFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 md:p-8"
            onClick={() => setPreviewFile(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-4xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl border border-white/20 flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[rgba(15,34,20,0.08)] bg-white">
                <div className="min-w-0 flex items-center gap-2.5 mr-3">
                  {previewFile.bucket_name === "genrated_buckets" ? (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-2 py-0.5 rounded-full shrink-0">
                      <Sparkles className="w-3 h-3 text-emerald-600" /> AI Graphic
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-neutral-100 border border-neutral-200 text-neutral-700 text-xs font-semibold px-2 py-0.5 rounded-full shrink-0">
                      <Upload className="w-3 h-3" /> Uploaded
                    </span>
                  )}
                  <h3
                    className="text-sm font-semibold text-[#0f2214] truncate"
                    title={previewFile.original_file_name}
                  >
                    {previewFile.original_file_name}
                  </h3>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={getFileDownloadUrl(previewFile.id, userId ?? 0, true)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg border border-[rgba(15,34,20,0.12)] text-xs font-medium text-[#2f3e32] hover:bg-[rgba(16,36,24,0.05)] flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Open Full</span>
                  </a>
                  <a
                    href={getFileDownloadUrl(previewFile.id, userId ?? 0, false)}
                    className="btn-primary px-3 py-1.5 text-xs flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Download</span>
                  </a>
                  <button
                    onClick={() => setPreviewFile(null)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5f6f63] hover:bg-neutral-100 transition-colors ml-1"
                    title="Close preview"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal Body: Image display */}
              <div className="flex-1 overflow-auto bg-[#0a0f0c] p-4 sm:p-6 flex items-center justify-center min-h-[300px]">
                <img
                  src={getFileDownloadUrl(previewFile.id, userId ?? 0, true)}
                  alt={previewFile.original_file_name}
                  className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg shadow-lg"
                />
              </div>

              {/* Modal Footer: Metadata */}
              <div className="px-5 py-3 bg-[#fdfcf8] border-t border-[rgba(15,34,20,0.08)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-[#5f6f63]">
                <div className="truncate font-medium text-[#2f3e32]">
                  {previewFile.description || "Generated file from Co-Founder AI"}
                </div>
                <div className="flex items-center gap-3 shrink-0 text-[#8d9d94]">
                  <span>{formatFileSize(previewFile.file_size)}</span>
                  <span>·</span>
                  <span>
                    {new Date(previewFile.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
    </>
  );
}
