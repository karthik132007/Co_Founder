-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: add `supabase_user_id` to public.users (Google OAuth).
--
-- Google users are linked to their Supabase Auth identity (a UUID) via this
-- column. Email/password users leave it NULL.
--
-- Safe to run on an existing database:
--   * `ADD COLUMN IF NOT EXISTS` — no-op if the column already exists.
--   * The unique constraint is added only if it does not already exist and
--     only after the column exists, so this never fails on a fresh column.
--   * No data is deleted or rewritten; nothing here is destructive.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS supabase_user_id uuid;

-- Enforce "no duplicate app users per Google account" at the DB level.
-- PostgreSQL allows multiple NULLs in a unique constraint, so email/password
-- users (NULL supabase_user_id) are unaffected.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_supabase_user_id_key'
      AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_supabase_user_id_key UNIQUE (supabase_user_id);
  END IF;
END $$;
