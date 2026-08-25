# syntax=docker/dockerfile:1
# ─────────────────────────────────────────────────────────────────────────────
# Next.js (standalone) image — multi-stage build for a small production image.
#
# Build arg (required for browser-side API calls, inlined at build time):
#   NEXT_PUBLIC_API_URL   e.g. http://localhost:8000
# The browser also reaches the backend WebSocket at /chat/ws derived from the
# same base URL, so no separate WS var is needed.
#
# Google OAuth (Supabase) — public values, inlined at build time:
#   NEXT_PUBLIC_SUPABASE_URL        e.g. https://<project-ref>.supabase.co
#   NEXT_PUBLIC_SUPABASE_ANON_KEY   Supabase "anon public" key
#   NEXT_PUBLIC_AUTH_REDIRECT_URL   optional; if set, use the FULL callback URL,
#                                   e.g. https://get-cofounder.tech/auth/callback
#                                   (NOT the bare domain). If omitted, the app
#                                   derives it from the site origin.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── Builder ──────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Low-memory-friendly build: disable telemetry and let Node grow its heap
# (using swap) instead of being OOM-killed while compiling all routes on
# small VMs (1GB RAM). Tune --max-old-space-size to the machine's RAM+swap.
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS=--max-old-space-size=2048

ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

ARG NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL

ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

ARG NEXT_PUBLIC_AUTH_REDIRECT_URL
ENV NEXT_PUBLIC_AUTH_REDIRECT_URL=$NEXT_PUBLIC_AUTH_REDIRECT_URL

RUN npm run build

# ── Runner ───────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

ENV PORT=3000 \
    HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
