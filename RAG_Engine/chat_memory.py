import math
from typing import Any, Dict, List, Optional

from RAG_Engine.embeddings import generate_embeddings
from backend.utils import get_supabase_client

supabase_client = get_supabase_client()


def _parse_vector(value: Any) -> List[float]:
    if isinstance(value, list):
        return [float(item) for item in value]
    if isinstance(value, str):
        stripped = value.strip()
        if stripped.startswith("[") and stripped.endswith("]"):
            stripped = stripped[1:-1]
        if not stripped:
            return []
        return [float(item) for item in stripped.split(",")]
    return []


def _cosine_similarity(left: List[float], right: List[float]) -> float:
    if not left or not right or len(left) != len(right):
        return 0.0

    dot = sum(a * b for a, b in zip(left, right))
    left_norm = math.sqrt(sum(a * a for a in left))
    right_norm = math.sqrt(sum(b * b for b in right))
    if not left_norm or not right_norm:
        return 0.0
    return dot / (left_norm * right_norm)


def _memory_text(memory: dict) -> str:
    title = (memory.get("title") or "").strip()
    content = (memory.get("memory") or "").strip()
    if title and content:
        return f"{title}: {content}"
    return content or title


def add_memory(data, company_id):
    """
    Add new memory entries to the chat_memories table.

    Args:
        data (list[dict]): The memory data to be added.
        company_id (int): The ID of the company associated with the memory.
        """
    if not data:
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
        return None

    response = (
        supabase_client
        .table("chat_memories")
        .insert(rows)
        .execute()
    )
    return response


def get_chat_memories_by_query(
    company_id: int,
    query: str,
    match_count: int = 5,
    category: Optional[str] = None,
    importance: Optional[str] = None,
    query_embedding: Optional[List[float]] = None,
) -> List[Dict[str, Any]]:
    """Return chat memories ranked by semantic similarity to the query."""
    if not query or not query.strip():
        return []

    if query_embedding is None:
        query_embedding = generate_embeddings(query)
    try:
        return supabase_client.rpc(
            "match_chat_memories",
            {
                "query_embedding": query_embedding,
                "p_company_id": company_id,
                "match_count": match_count,
                "p_category": category,
                "p_importance": importance,
            },
        ).execute().data or []
    except Exception:
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

        return sorted(memories, key=lambda row: row["similarity"], reverse=True)[:match_count]
