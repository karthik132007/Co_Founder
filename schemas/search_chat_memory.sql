
    select
        cm.id,
        cm.agent_name,
        cm.role,
        cm.message,
        1 - (cm.embedding <=> query_embedding) as similarity
    from chat_memory cm
    where cm.company_id = p_company_id
    order by cm.embedding <=> query_embedding
    limit match_count;
