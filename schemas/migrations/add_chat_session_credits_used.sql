-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: add per-session credit usage to `public.chat_sessions`.
--
-- Lets the dashboard overview show how many credits each chat/session used.
-- The `manage_credits` Kafka consumer increments this column after a
-- successful credit deduction (see backend/db/insert_to_sql.py
-- `add_credits_to_session`).
--
-- Safe to run on an existing database:
--   * `ADD COLUMN IF NOT EXISTS` — no-op if the column already exists.
--   * Existing rows get the default 0; nothing is dropped or rewritten.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.chat_sessions
    ADD COLUMN IF NOT EXISTS credits_used numeric(18, 4) NOT NULL DEFAULT 0;
