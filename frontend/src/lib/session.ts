const SESSION_KEY = "cofounder.session";

let cachedRawSession: string | null | undefined;
let cachedSession: CofounderSession | null = null;

export type SessionUser = {
  id: number;
  email: string;
};

export type CofounderSession = {
  user: SessionUser;
  onboardingComplete: boolean;
  createdAt: string;
};

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function isSessionUser(value: unknown): value is SessionUser {
  if (!value || typeof value !== "object") {
    return false;
  }

  const user = value as Partial<SessionUser>;
  return (
    typeof user.id === "number" &&
    Number.isFinite(user.id) &&
    user.id > 0 &&
    typeof user.email === "string" &&
    user.email.includes("@")
  );
}

function isSession(value: unknown): value is CofounderSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const session = value as Partial<CofounderSession>;
  return (
    isSessionUser(session.user) &&
    typeof session.onboardingComplete === "boolean" &&
    typeof session.createdAt === "string"
  );
}

export function parseSessionUser(value: unknown): SessionUser | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const user = value as { id?: unknown; email?: unknown };
  const id = typeof user.id === "number" ? user.id : Number(user.id);

  if (
    Number.isFinite(id) &&
    id > 0 &&
    typeof user.email === "string" &&
    user.email.includes("@")
  ) {
    return {
      id,
      email: user.email,
    };
  }

  return null;
}

export function getSession() {
  if (!canUseStorage()) {
    return null;
  }

  const rawSession = window.localStorage.getItem(SESSION_KEY);
  if (rawSession === cachedRawSession) {
    return cachedSession;
  }

  cachedRawSession = rawSession;

  if (!rawSession) {
    cachedSession = null;
    return null;
  }

  try {
    const parsed = JSON.parse(rawSession) as unknown;
    if (isSession(parsed)) {
      cachedSession = parsed;
      return parsed;
    }
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    cachedRawSession = null;
    cachedSession = null;
    return null;
  }

  window.localStorage.removeItem(SESSION_KEY);
  cachedRawSession = null;
  cachedSession = null;
  return null;
}

export function saveSession(
  user: SessionUser,
  options: { onboardingComplete?: boolean } = {},
) {
  if (!canUseStorage()) {
    return;
  }

  const existing = getSession();
  const session: CofounderSession = {
    user,
    onboardingComplete: options.onboardingComplete ?? existing?.onboardingComplete ?? false,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };

  const rawSession = JSON.stringify(session);
  window.localStorage.setItem(SESSION_KEY, rawSession);
  cachedRawSession = rawSession;
  cachedSession = session;
}

export function setOnboardingComplete() {
  const session = getSession();
  if (!session || !canUseStorage()) {
    return;
  }

  const nextSession = {
    ...session,
    onboardingComplete: true,
  };
  const rawSession = JSON.stringify(nextSession);

  window.localStorage.setItem(SESSION_KEY, rawSession);
  cachedRawSession = rawSession;
  cachedSession = nextSession;
}

export function clearSession() {
  if (canUseStorage()) {
    window.localStorage.removeItem(SESSION_KEY);
    cachedRawSession = null;
    cachedSession = null;
  }
}
