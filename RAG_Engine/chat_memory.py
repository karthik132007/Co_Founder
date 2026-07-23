import logging
import math
from typing import Any, Dict, List, Optional

from RAG_Engine.embeddings import generate_embeddings
from backend.utils import get_supabase_client

logger = logging.getLogger(__name__)

supabase_client = get_supabase_client()


def _parse_vector(value: Any) -> List[float]:
    if isinstance(value, list):
        result = [float(item) for item in value]
        return result
    if isinstance(value, str):
        stripped = value.strip()
        if stripped.startswith("[") and stripped.endswith("]"):
            stripped = stripped[1:-1]
        if not stripped:
            return []
        result = [float(item) for item in stripped.split(",")]
        return result
    logger.warning("Unexpected vector type %s, returning []", type(value).__name__)
    return []


def _cosine_similarity(left: List[float], right: List[float]) -> float:
    if not left or not right or len(left) != len(right):
        logger.warning("Cosine similarity: mismatched or empty vectors (left=%d, right=%d)", len(left) if left else 0, len(right) if right else 0)
        return 0.0

    dot = sum(a * b for a, b in zip(left, right))
    left_norm = math.sqrt(sum(a * a for a in left))
    right_norm = math.sqrt(sum(b * b for b in right))
    if not left_norm or not right_norm:
        logger.warning("Cosine similarity: zero norm (left_norm=%f, right_norm=%f)", left_norm, right_norm)
        return 0.0
    similarity = dot / (left_norm * right_norm)
    return similarity


def _memory_text(memory: dict) -> str:
    title = (memory.get("title") or "").strip()
    content = (memory.get("memory") or "").strip()
    if title and content:
        text = f"{title}: {content}"
        return text
    result = content or title
    return result


def add_memory(data, company_id):
    logger.info("Adding %d memories for company_id=%d", len(data) if data else 0, company_id)
    if not data:
        logger.warning("No memory data provided")
        return None

    rows = []
    for memory in data:
        text = _memory_text(memory)
        if not text:
            continue

        rows.append({
            "company_id": company_id,
            "title": text,
            "embedding": generate_embeddings(text),
            "category": memory.get("category"),
            "importance": memory.get("importance"),
        })

    if not rows:
        logger.warning("No valid rows after processing memory data")
        return None

    logger.info("Inserting %d memory rows into chat_memories", len(rows))
    response = (
        supabase_client
        .table("chat_memories")
        .insert(rows)
        .execute()
    )
    logger.info("Memory insertion successful")
    return response


def get_chat_memories_by_query(
    company_id: int,
    query: str,
    match_count: int = 5,
    category: Optional[str] = None,
    importance: Optional[str] = None,
    query_embedding: Optional[List[float]] = None,
) -> List[Dict[str, Any]]:
    logger.info("Getting chat memories for company_id=%d, query='%s', match_count=%d, category=%s, importance=%s",
                company_id, query[:60], match_count, category, importance)
    if not query or not query.strip():
        logger.warning("Empty query provided")
        return []

    if query_embedding is None:
        query_embedding = generate_embeddings(query)
    try:
        result = supabase_client.rpc(
            "match_chat_memories",
            {
                "query_embedding": query_embedding,
                "p_company_id": company_id,
                "match_count": match_count,
                "p_category": category,
                "p_importance": importance,
            },
        ).execute().data or []
        logger.info("RPC returned %d chat memories", len(result))
        return result
    except Exception as exc:
        logger.warning("RPC match_chat_memories failed, falling back to local similarity: %s", exc)
        request = (
            supabase_client.table("chat_memories")
            .select("id,company_id,title,category,importance,source,created_by,created_at,updated_at,embedding")
            .eq("company_id", company_id)
        )
        if category:
            request = request.eq("category", category)
        if importance:
            request = request.eq("importance", importance)

        response = request.execute()
        memories = []
        for row in response.data or []:
            similarity = _cosine_similarity(query_embedding, _parse_vector(row.get("embedding")))
            row.pop("embedding", None)
            row["similarity"] = similarity
            memories.append(row)

        sorted_memories = sorted(memories, key=lambda row: row["similarity"], reverse=True)[:match_count]
        logger.info("Fallback returned %d chat memories", len(sorted_memories))
        return sorted_memories
