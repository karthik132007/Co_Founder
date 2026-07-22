create table public.document_chunks (
  id bigint generated always as identity not null,
  file_id bigint not null,
  company_id bigint not null,
  chunk_index integer not null,
  chunk_text text not null,
  embedding extensions.vector null,
  page_number integer null,
  section text null,
  metadata jsonb null default '{}'::jsonb,
  created_at timestamp with time zone null default now(),
  search_vector tsvector GENERATED ALWAYS as (to_tsvector('english'::regconfig, chunk_text)) STORED null,
  constraint document_chunks_pkey primary key (id),
  constraint fk_document_chunks_file foreign KEY (file_id) references files (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists document_chunks_embedding_idx on public.document_chunks using hnsw (embedding extensions.vector_cosine_ops) TABLESPACE pg_default;

create index IF not exists idx_document_chunks_company on public.document_chunks using btree (company_id) TABLESPACE pg_default;

create index IF not exists idx_document_chunks_file on public.document_chunks using btree (file_id) TABLESPACE pg_default;

create index IF not exists idx_document_chunks_company_file on public.document_chunks using btree (company_id, file_id) TABLESPACE pg_default;

create index IF not exists idx_document_chunks_search on public.document_chunks using gin (search_vector) TABLESPACE pg_default;