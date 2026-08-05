#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# One-command startup for the full Dockerized stack:
#   Kafka, Redis, Backend (FastAPI), Consumers, Frontend (Next.js).
#
# Usage:
#   ./start_docker.sh            # build + start in foreground
#   ./start_docker.sh -d         # build + start in background
# ─────────────────────────────────────────────────────────────────────────────
set -e

if [ ! -f .env ]; then
  echo "❌ Missing .env — create one at the project root with your API keys (see README → Setup)."
  exit 1
fi

echo "🐳 Building & starting all services (kafka, redis, backend, consumers, frontend)..."
docker compose up --build "$@"
