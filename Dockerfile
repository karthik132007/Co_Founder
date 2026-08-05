# syntax=docker/dockerfile:1
# ─────────────────────────────────────────────────────────────────────────────
# Python runtime image.
#
# One image is shared by two compose services:
#   • backend   → runs `uvicorn backend.app:app` (default CMD)
#   • consumers → runs `python backend/kafka_jobs/run_consumers.py`
#
# Connection endpoints (Kafka, Redis, DB) are supplied at runtime through
# environment variables — nothing service-specific is baked in here.
# ─────────────────────────────────────────────────────────────────────────────
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Runtime libs required by some wheels (PyMuPDF, etc.) — keep minimal.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libgl1 \
        libglib2.0-0 \
        libgomp1 \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first so this layer is cached across rebuilds.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the full application source (build context = repo root).
COPY . .

# Run as an unprivileged user (defense-in-depth). The app writes logs.log to
# /app, so hand ownership of the working dir to the app user.
RUN useradd --create-home --uid 1000 appuser \
    && chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

# Default: FastAPI backend. The compose `consumer-*` services override CMD.
CMD ["uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "8000"]
