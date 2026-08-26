create table public.company_credits (
  company_id bigint not null,
  credits numeric(18, 4) not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint company_credits_pkey primary key (company_id),
  constraint company_credits_company_id_fkey foreign KEY (company_id) references companies (id) on delete CASCADE,
  constraint credits_non_negative check ((credits >= (0)::numeric))
) TABLESPACE pg_default;