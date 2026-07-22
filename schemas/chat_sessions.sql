create table public.chat_sessions (
  session_id text not null,
  company_id integer not null,
  title text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint chat_sessions_pkey primary key (session_id)
) TABLESPACE pg_default;