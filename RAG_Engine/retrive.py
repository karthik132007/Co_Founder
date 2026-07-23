import logging
import os
import time

import httpx

from backend.utils import get_supabase_client

logger = logging.getLogger(__name__)

supabase = get_supabase_client()


def _get_rpc_retries() -> int:
    raw_retries = os.getenv("RAG_RPC_RETRIES", "2")
    try:
        retries = int(raw_retries)
    except ValueError as exc:
        logger.error("Invalid RAG_RPC_RETRIES value '%s'", raw_retries)
        raise RuntimeError("RAG_RPC_RETRIES must be an integer.") from exc
    retries = max(retries, 0)
    return retries


def _execute_search_rpc(function_name: str, params: dict):
    attempts = _get_rpc_retries() + 1
    logger.info("Executing RPC '%s' with %d attempt(s), params keys: %s", function_name, attempts, list(params.keys()))
    last_error = None
    for attempt in range(1, attempts + 1):
        try:
            result = supabase.rpc(function_name, params).execute().data
            logger.info("RPC '%s' succeeded on attempt %d, returned %d rows", function_name, attempt,
                        len(result) if result else 0)
            return result
        except httpx.TimeoutException as exc:
            last_error = exc
            logger.warning("RPC '%s' attempt %d/%d timed out", function_name, attempt, attempts)
            if attempt == attempts:
                break
            sleep_sec = 0.5 * attempt
            time.sleep(sleep_sec)

    logger.error("RPC '%s' failed after %d attempts", function_name, attempts)
    raise RuntimeError(
        f"Supabase RPC '{function_name}' timed out after {attempts} attempt(s). "
        "Increase SUPABASE_POSTGREST_TIMEOUT or check the database function/indexes."
    ) from last_error


def semantic_search(embedding, company_id, match_count: int = 10):
    logger.info("Semantic search: company_id=%d, match_count=%d", company_id, match_count)
    result = _execute_search_rpc(
        "semantic_search",
        {
            "query_embedding": embedding,
            "p_company_id": company_id,
            "match_count": match_count
        },
    )
    logger.info("Semantic search returned %d results", len(result) if result else 0)
    return result


def keywords_search(query, company_id: int, match_count: int = 10):
    logger.info("Keyword search: company_id=%d, query='%s', match_count=%d", company_id, query[:60], match_count)
    result = _execute_search_rpc(
        "keyword_search",
        {
            "query_text": query,
            "p_company_id": company_id,
            "match_count": match_count
        },
    )
    logger.info("Keyword search returned %d results", len(result) if result else 0)
    return result
