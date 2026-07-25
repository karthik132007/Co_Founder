-- RPC function: match_chat_memories
-- Vector similarity search over chat_memories using pgvector cosine distance.
-- Falls back gracefully to the local similarity path in chat_memory.py
-- if this function is not deployed on Supabase.

create or replace function match_chat_memories(
    query_embedding extensions.vector,
    p_company_id bigint,
    match_count integer default 5,
    p_category text default null,
    p_importance text default null
)
returns table (
    id bigint,
    company_id bigint,
    title text,
    category text,
    importance text,
    source text,
    created_by text,
    created_at timestamptz,
    updated_at timestamptz,
    similarity double precision
)
language plpgsql
as $$
begin
    return query
    select
        cm.id,
        cm.company_id,
        cm.title,
        cm.category,
        cm.importance,
        cm.source,
        cm.created_by,
        cm.created_at,
        cm.updated_at,
        (1 - (cm.embedding <=> query_embedding)) as similarity
    from chat_memories cm
    where cm.company_id = p_company_id
      and (p_category is null or cm.category = p_category)
      and (p_importance is null or cm.importance = p_importance)
    order by cm.embedding <=> query_embedding
    limit match_count;
end;
$$;
