from backend.utils import get_supabase_client
supabase = get_supabase_client()

def semantic_search(embedding,company_id,match_count: int=10):
    results=(
        supabase.rpc(
            "semantic_search",
            {
                "query_embedding": embedding,
                "p_company_id": company_id,
                "match_count": match_count
            }
        )
        .execute()
        .data
    )
    return results

def keywords_search(query, company_id: int, match_count: int=10):
    results=(
        supabase.rpc(
            "keyword_search",
            {
                "query_text": query,
                "p_company_id": company_id,
                "match_count": match_count
            }

        )
        .execute()
        .data
    )
    return results