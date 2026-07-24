
    select
        dc.id,
        dc.file_id,
        dc.chunk_text,
        dc.page_number,
        dc.section,
        1 - (dc.embedding <=> query_embedding) as similarity
    from document_chunks dc
    where dc.company_id = p_company_id
    order by dc.embedding <=> query_embedding
    limit match_count;
