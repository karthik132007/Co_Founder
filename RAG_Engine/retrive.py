import os
import time

import httpx

from backend.utils import get_supabase_client
supabase = get_supabase_client()


def _get_rpc_retries() -> int:
    raw_retries = os.getenv("RAG_RPC_RETRIES", "2")
    try:
        retries = int(raw_retries)
    except ValueError as exc:
        raise RuntimeError("RAG_RPC_RETRIES must be an integer.") from exc
    return max(retries, 0)


def _execute_search_rpc(function_name: str, params: dict):
    attempts = _get_rpc_retries() + 1
    last_error = None
    for attempt in range(1, attempts + 1):
        try:
            return supabase.rpc(function_name, params).execute().data
        except httpx.TimeoutException as exc:
            last_error = exc
            if attempt == attempts:
                break
            time.sleep(0.5 * attempt)

    raise RuntimeError(
        f"Supabase RPC '{function_name}' timed out after {attempts} attempt(s). "
        "Increase SUPABASE_POSTGREST_TIMEOUT or check the database function/indexes."
    ) from last_error


def semantic_search(embedding, company_id, match_count: int = 10):
    return _execute_search_rpc(
        "semantic_search",
        {
            "query_embedding": embedding,
            "p_company_id": company_id,
            "match_count": match_count
        },
    )


def keywords_search(query, company_id: int, match_count: int = 10):
    return _execute_search_rpc(
        "keyword_search",
        {
            "query_text": query,
            "p_company_id": company_id,
            "match_count": match_count
        },
    )
