create table public.chat_messages (
  id bigserial not null,
  session_id text not null,
  role text not null,
  message text not null,
  created_at timestamp with time zone not null default now(),
  constraint chat_messages_pkey primary key (id),
  constraint chat_messages_session_id_fkey foreign KEY (session_id) references chat_sessions (session_id) on delete CASCADE,
  constraint chat_messages_role_check check (
    (
      role = any (
        array['user'::text, 'assistant'::text, 'system'::text]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_chat_messages_session_created on public.chat_messages using btree (session_id, created_at) TABLESPACE pg_default;