-- Per-message credit attribution: how many credits the assistant reply
-- that produced this row cost. User rows stay 0.
-- Apply in the Supabase SQL editor (idempotent).
alter table public.chat_messages
    add column if not exists credits_used numeric(18, 4) not null default 0;
