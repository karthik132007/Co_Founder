
    select
        dc.id,
        dc.file_id,
        dc.chunk_text,
        dc.page_number,
        dc.section,
        ts_rank(
            dc.search_vector,
            plainto_tsquery('english', query_text)
        ) as keyword_score
    from document_chunks dc
    where
        dc.company_id = p_company_id
        and dc.search_vector @@ plainto_tsquery('english', query_text)
    order by keyword_score desc
    limit match_count;
