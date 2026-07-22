create table public.chat_memories (
  id bigint generated always as identity not null,
  company_id bigint not null,
  title text not null,
  embedding extensions.vector not null,
  category text not null,
  importance text not null,
  source text null default 'conversation'::text,
  created_by text null default 'memory_agent'::text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint chat_memories_pkey primary key (id),
  constraint chat_memories_company_id_fkey foreign KEY (company_id) references companies (id) on delete CASCADE,
  constraint chat_memories_importance_check check (
    (
      importance = any (
        array[
          'critical'::text,
          'high'::text,
          'medium'::text,
          'low'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_chat_memories_company on public.chat_memories using btree (company_id) TABLESPACE pg_default;

create index IF not exists idx_chat_memories_category on public.chat_memories using btree (category) TABLESPACE pg_default;

create index IF not exists idx_chat_memories_importance on public.chat_memories using btree (importance) TABLESPACE pg_default;

create index IF not exists idx_chat_memories_company_category on public.chat_memories using btree (company_id, category) TABLESPACE pg_default;

create index IF not exists idx_chat_memories_embedding on public.chat_memories using hnsw (embedding extensions.vector_cosine_ops) TABLESPACE pg_default;