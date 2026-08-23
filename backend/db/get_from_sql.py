import json
import logging

from backend.models import CompanyData
import supabase
from backend.utils import get_supabase_client
from typing import Optional, List, Dict, Any

logger = logging.getLogger(__name__)

supabase_client = get_supabase_client()

# ── Redis cache for company data ──────────────────────────────────────────
# Cached for 1 hour to avoid hitting Supabase on every CEO agent build.
_COMPANY_CACHE_TTL = 3600  # seconds


def _get_redis():
    """Lazy import to avoid crashing when Redis is unavailable."""
    try:
        from backend.db.redis_client import get_redis_client
        return get_redis_client()
    except Exception:
        return None

def get_company_data(company_id: int) -> Optional[CompanyData]:
    cache_key = f"company:{company_id}"

    # 1. Try Redis cache
    redis_client = _get_redis()
    if redis_client:
        try:
            cached = redis_client.get(cache_key)
            if cached:
                logger.info("Redis HIT for company_id=%d", company_id)
                return json.loads(cached)
        except Exception:
            logger.info("Redis MISS for company_id=%d, falling back to DB", company_id)

    # 2. Fallback: Supabase
    response = supabase_client.table("companies").select("*").eq("id", company_id).execute()
    if response.data:
        data = response.data[0]
        # 3. Populate Redis cache
        if redis_client:
            try:
                redis_client.setex(cache_key, _COMPANY_CACHE_TTL, json.dumps(data, default=str))
                logger.info("Redis SET for company_id=%d", company_id)
            except Exception:
                logger.info("Redis write failed for company_id=%d", company_id)
        return data

    logger.warning("No company data found for company_id=%s", company_id)
    return None

_USER_COMPANY_TTL = 86400  # 24 hours — user→company mapping rarely changes


def get_company_id(user_id: int) -> Optional[int]:
    cache_key = f"user:{user_id}"
    redis_client = _get_redis()

    if redis_client:
        try:
            cached = redis_client.get(cache_key)
            if cached:
                logger.info("Redis HIT Company id for user_id=%d", user_id)
                return json.loads(cached)
        except Exception:
            logger.info("Redis MISS for user_id=%d, getting company id from DB", user_id)

    response = supabase_client.table("companies").select("id").eq("user_id", user_id).execute()
    if response.data:
        cid = response.data[0]["id"]

        if redis_client:
            try:
                redis_client.setex(cache_key, _USER_COMPANY_TTL, cid)
                logger.info("Redis SET company_id for user_id=%d", user_id)
            except Exception:
                logger.info("Redis cache write failed for user_id=%d", user_id)
        return cid

    logger.warning("No company found for user_id=%s", user_id)
    return None

def get_company_by_user(user_id: int) -> Optional[Dict[str, Any]]:
    """Return full company record for a given user_id."""
    response = supabase_client.table("companies").select("*").eq("user_id", user_id).execute()
    if response.data:
        return response.data[0]
    logger.warning("No company record found for user_id=%s", user_id)
    return None

def get_user_files(company_id: int) -> List[Dict[str, Any]]:
    """Return all files for a given company, ordered by newest first."""
    response = (
        supabase_client.table("files")
        .select("*")
        .eq("company_id", company_id)
        .order("created_at", desc=True)
        .execute()
    )
    files = response.data if response.data else []
    return files


def get_file_by_id(file_id: int) -> Optional[Dict[str, Any]]:
    """Return a single file record by its ID."""
    response = (
        supabase_client.table("files")
        .select("*")
        .eq("id", file_id)
        .execute()
    )
    if response.data:
        return response.data[0]
    return None

def get_file_count(company_id: int) -> int:
    """Return the number of files for a company."""
    response = (
        supabase_client.table("files")
        .select("id", count="exact")
        .eq("company_id", company_id)
        .execute()
    )
    count = response.count if response.count is not None else 0
    return count

def get_dashboard_stats(company_id: int) -> Dict[str, Any]:
    """Aggregate dashboard stats for a company."""
    files = get_user_files(company_id)
    total_files = len(files)
    total_size = sum(f.get("file_size") or 0 for f in files)

    images = sum(1 for f in files if (f.get("mime_type") or "").startswith("image/"))
    documents = sum(1 for f in files if (f.get("mime_type") or "").startswith("application/") or (f.get("mime_type") or "").startswith("text/"))

    stats = {
        "total_files": total_files,
        "total_size_bytes": total_size,
        "images": images,
        "documents": documents,
    }
    return stats

_SESSION_MSGS_TTL = 30

def get_chats_in_session(session_id: str) -> List[Dict[str, Any]]:
    cache_key = f"session_msgs:{session_id}"
    redis_client = _get_redis()
    if redis_client:
        try:
            cached = redis_client.get(cache_key)
            if cached:
                logger.info("Redis HIT for session_msgs %s", session_id[:8])
                return json.loads(cached)
        except Exception:
            pass

    response = (
        supabase_client.table("chat_messages")
        .select("*")
        .eq("session_id", session_id)
        .order("created_at", desc=False)
        .execute()
    )
    messages = response.data if response.data else []

    if redis_client and messages:
        try:
            redis_client.setex(cache_key, _SESSION_MSGS_TTL, json.dumps(messages, default=str))
        except Exception:
            pass
    return messages

_SESSIONS_CACHE_TTL = 120

def get_chat_sessions(company_id: int) -> List[Dict[str, Any]]:
    """Return all chat sessions for a company, ordered by newest first."""
    cache_key = f"chat_sessions:{company_id}"

    redis_client = _get_redis()
    if redis_client:
        try:
            cached = redis_client.get(cache_key)
            if cached:
                logger.info("Redis HIT for chat_sessions company_id=%d", company_id)
                return json.loads(cached)
        except Exception:
            logger.info("Redis MISS for chat_sessions company_id=%d", company_id)

    response = (
        supabase_client.table("chat_sessions")
        .select("*")
        .eq("company_id", company_id)
        .order("created_at", desc=True)
        .execute()
    )
    sessions = response.data if response.data else []

    if redis_client:
        try:
            redis_client.setex(cache_key, _SESSIONS_CACHE_TTL, json.dumps(sessions, default=str))
            logger.info("Redis SET for chat_sessions company_id=%d (%d sessions)", company_id, len(sessions))
        except Exception:
            logger.info("Redis write failed for chat_sessions company_id=%d", company_id)

    return sessions


# ── Cache invalidation ─────────────────────────────────────────────────────
# Writes go through backend.db.insert_to_sql / delete_from_sql, which call
# these so the Redis-cached session lists / message lists never go stale
# (previously a freshly created chat session stayed invisible for up to 2 min).

def invalidate_chat_sessions(company_id: int) -> None:
    """Drop the cached chat-session list for a company after a session write."""
    redis_client = _get_redis()
    if not redis_client:
        return
    try:
        redis_client.delete(f"chat_sessions:{company_id}")
        logger.info("Invalidated chat_sessions cache for company_id=%d", company_id)
    except Exception:
        logger.info("Redis invalidation failed for chat_sessions company_id=%d", company_id)


def invalidate_session_msgs(session_id: str) -> None:
    """Drop the cached message list for a session after a message write."""
    redis_client = _get_redis()
    if not redis_client:
        return
    try:
        redis_client.delete(f"session_msgs:{session_id}")
        logger.info("Invalidated session_msgs cache for session_id=%s", session_id[:8])
    except Exception:
        logger.info("Redis invalidation failed for session_msgs session_id=%s", session_id[:8])
