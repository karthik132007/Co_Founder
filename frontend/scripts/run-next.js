// Wrapper that loads the repo-root `.env` into `process.env` and then starts
// Next.js (dev or build) in the SAME process.
//
// Usage:  node scripts/run-next.js [dev|build|…]
//
// This lets the frontend share the global env file — e.g.
// NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY — instead of
// needing a separate `frontend/.env.local`.
//
// Why a wrapper instead of `node -r` or next.config.ts?
//   - `node -r …` puts the require flag into NODE_OPTIONS, which Next's build
//     workers reject.
//   - Values set inside next.config.ts never reach Turbopack, which snapshots
//     `process.env` when its process starts.
//   - Calling `@next/env`'s `loadEnvConfig` ourselves also breaks Next (its
//     env state is a module-level singleton, so the standalone output then
//     tries to copy a non-existent `frontend/.env`), so we parse the file
//     directly instead.
//
// Precedence: variables already present in the environment (e.g. Docker build
// args) are kept — the root `.env` only fills in missing keys.
const fs = require("fs");
const path = require("path");

// frontend/scripts/run-next.js → repo root is two levels up.
const repoRoot = path.resolve(__dirname, "..", "..");
const envFile = path.join(repoRoot, ".env");

function loadRootEnv() {
  let content;
  try {
    content = fs.readFileSync(envFile, "utf8");
  } catch {
    // No root .env (e.g. Docker build with only build args) — nothing to load.
    return;
  }

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) {
      continue;
    }
    const eq = line.indexOf("=");
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();

    // Strip surrounding quotes if present.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    // Existing environment variables always win.
    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadRootEnv();

require("next/dist/bin/next");
