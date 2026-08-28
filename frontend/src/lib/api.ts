export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function readApiError(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { detail?: unknown };
    if (!data.detail) return fallback;
    // FastAPI 422 returns detail as an array of {loc, msg, type}
    if (Array.isArray(data.detail)) {
      return (data.detail as { msg: string }[])
        .map((e) => e.msg)
        .join("; ");
    }
    // Structured error detail: { code, message } (e.g. 402 insufficient_credits)
    if (typeof data.detail === "object" && data.detail !== null) {
      const d = data.detail as { message?: unknown; code?: unknown };
      if (typeof d.message === "string" && d.message) return d.message;
      if (typeof d.code === "string" && d.code) return d.code;
      return fallback;
    }
    return String(data.detail);
  } catch {
    return fallback;
  }
}

/* ── Session (backend httpOnly cookie) ── */

export type MeResponse = {
  id: number;
  email: string;
  name?: string;
  onboarding_complete: boolean;
};

/**
 * Restore the current user from the backend session cookie, or null if none.
 * The cookie itself is managed entirely by the backend (httpOnly) — this only
 * asks it who we are.
 */
export async function fetchMe(): Promise<MeResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      credentials: "include",
    });
    if (!res.ok) return null;
    return (await res.json()) as MeResponse;
  } catch {
    return null;
  }
}

/** Best-effort server-side logout (clears the backend session cookie). */
export async function logoutUser(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // The local session is cleared by the caller regardless.
  }
}

/* ── Dashboard ── */

export type CompanyInfo = {
  id: number;
  company_name: string;
  industry: string;
  tone: string;
  small_description: string;
};

export type DashboardStats = {
  total_files: number;
  total_size_bytes: number;
  images: number;
  documents: number;
};

export type DriveFile = {
  id: number;
  company_id: number;
  file_name: string;
  original_file_name: string;
  bucket_name: string;
  storage_path: string;
  description: string | null;
  mime_type: string;
  file_extension: string | null;
  file_size: number | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type DashboardData = {
  company: CompanyInfo;
  stats: DashboardStats;
  recent_files: DriveFile[];
};

export type FilesListResponse = {
  files: DriveFile[];
  total: number;
};

export type ProfileData = {
  user: { id: number; email: string };
  company: {
    id: number;
    company_name: string;
    small_description: string;
    industry: string;
    tone: string;
  };
};

export async function fetchProfile(userId: number): Promise<ProfileData> {
  const res = await fetch(`${API_BASE_URL}/user/profile?user_id=${userId}`);
  if (!res.ok) throw new Error(await readApiError(res, "Failed to load profile"));
  return res.json() as Promise<ProfileData>;
}

export async function updateProfile(
  userId: number,
  fields: Partial<ProfileData["company"]>,
): Promise<{ status: string; company: ProfileData["company"] }> {
  const res = await fetch(`${API_BASE_URL}/user/profile?user_id=${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });
  if (!res.ok) throw new Error(await readApiError(res, "Failed to update profile"));
  return res.json();
}

export async function fetchDashboard(userId: number): Promise<DashboardData> {
  const res = await fetch(`${API_BASE_URL}/user/dashboard?user_id=${userId}`);
  if (!res.ok) {
    throw new Error(await readApiError(res, "Failed to load dashboard"));
  }
  return res.json() as Promise<DashboardData>;
}

export async function fetchFiles(userId: number): Promise<FilesListResponse> {
  const res = await fetch(`${API_BASE_URL}/user/files?user_id=${userId}`);
  if (!res.ok) {
    throw new Error(await readApiError(res, "Failed to load files"));
  }
  return res.json() as Promise<FilesListResponse>;
}

export async function uploadFile(
  userId: number,
  file: File,
): Promise<{ message: string; file_name: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(
    `${API_BASE_URL}/upload?user_id=${userId}`,
    { method: "POST", body: formData },
  );

  if (!res.ok) {
    throw new Error(await readApiError(res, "Upload failed"));
  }
  return res.json() as Promise<{ message: string; file_name: string }>;
}

export function formatFileSize(bytes: number | null): string {
  if (bytes == null || bytes === 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function isImageMime(mime: string): boolean {
  return mime.startsWith("image/");
}

/** Build a download URL for a file. Set view=true to open inline (images/PDFs in browser). */
export function getFileDownloadUrl(fileId: number, userId: number, view = false): string {
  return `${API_BASE_URL}/user/files/${fileId}/download?user_id=${userId}&view=${view}`;
}

export async function deleteFile(
  userId: number,
  fileId: number,
): Promise<{ message: string; file_id: number; warning: string }> {
  const res = await fetch(
    `${API_BASE_URL}/file/${fileId}?user_id=${userId}`,
    { method: "DELETE" },
  );

  if (!res.ok) {
    throw new Error(await readApiError(res, "Failed to delete file"));
  }
  return res.json() as Promise<{ message: string; file_id: number; warning: string }>;
}

/* ── Chat ── */

export type Clarification = {
  question: string;
  options: string[];
  allow_custom: boolean;
  /** When true, the user may select multiple options before confirming. */
  multi_select?: boolean;
  /** Client-side: set once the user picks an answer (locks the card). */
  answered?: string;
};

export type ChatResponse = {
  status: string;
  message?: string;
  type?: "clarification_request" | "image_generated";
  clarification?: Clarification;
  image_data_url?: string;
  session_id: string;
  title?: string;
  is_new_session?: boolean;
};

export type ChatSession = {
  session_id: string;
  title: string;
  created_at: string | null;
};

export type ChatSessionsResponse = {
  sessions: ChatSession[];
};

export type ChatMessage = {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string | null;
};

export type SessionMessagesResponse = {
  session_id: string;
  messages: ChatMessage[];
};

export async function sendChatMessage(
  userId: number,
  message: string,
  sessionId?: string,
  effort: "flash" | "mid" | "max" = "flash",
): Promise<ChatResponse> {
  const formData = new FormData();
  formData.append("user_id", String(userId));
  formData.append("message", message);
  if (sessionId) {
    formData.append("session_id", sessionId);
  }
  formData.append("effort", effort);

  const res = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(await readApiError(res, "Failed to send message"));
  }
  return res.json() as Promise<ChatResponse>;
}

export async function fetchChatSessions(
  userId: number,
): Promise<ChatSessionsResponse> {
  const res = await fetch(
    `${API_BASE_URL}/chat/sessions?user_id=${userId}`,
  );
  if (!res.ok) {
    throw new Error(await readApiError(res, "Failed to load chat sessions"));
  }
  return res.json() as Promise<ChatSessionsResponse>;
}

export async function fetchSessionMessages(
  userId: number,
  sessionId: string,
): Promise<SessionMessagesResponse> {
  const res = await fetch(
    `${API_BASE_URL}/chat/sessions/${sessionId}?user_id=${userId}`,
  );
  if (!res.ok) {
    throw new Error(await readApiError(res, "Failed to load session messages"));
  }
  return res.json() as Promise<SessionMessagesResponse>;
}

export async function deleteChatSession(
  userId: number,
  sessionId: string,
): Promise<{ status: string; message: string }> {
  const res = await fetch(
    `${API_BASE_URL}/chat/sessions/${sessionId}?user_id=${userId}`,
    { method: "DELETE" },
  );
  if (!res.ok) {
    throw new Error(await readApiError(res, "Failed to delete chat session"));
  }
  return res.json() as Promise<{ status: string; message: string }>;
}
