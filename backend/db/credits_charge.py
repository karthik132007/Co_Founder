"""Centralized credit deduction service.

Can be called either synchronously (in-process fallback or direct execution)
or asynchronously by the ``manage_credits`` Kafka consumer.
"""

import logging
import time
from typing import Any, Dict, Optional

from credits_engine.usage import get_total_usage
from backend.db.credits import deduct_credits, InsufficientCreditsError
from backend.db.insert_to_sql import add_credits_to_session

logger = logging.getLogger(__name__)

_DEDUP_TTL = 86400  # 24 hours
_in_memory_processed: dict[str, float] = {}


def _cleanup_in_memory_dedup() -> None:
    now = time.time()
    expired = [k for k, ts in _in_memory_processed.items() if now - ts > _DEDUP_TTL]
    for k in expired:
        _in_memory_processed.pop(k, None)


def _already_processed(message_id: Optional[str]) -> bool:
    """Claim a message_id; return True if it was already processed.

    Uses an atomic Redis SETNX when available, with in-memory fallback.
    """
    if not message_id:
        return False

    _cleanup_in_memory_dedup()
    if message_id in _in_memory_processed:
        return True

    try:
        from backend.db.redis_client import get_redis_client
        client = get_redis_client()
        key = f"credit_processed:{message_id}"
        is_new = bool(client.set(key, "1", nx=True, ex=_DEDUP_TTL))
        if not is_new:
            _in_memory_processed[message_id] = time.time()
            return True
    except Exception:
        pass

    # If Redis is not available or succeeded in claiming, record in memory
    _in_memory_processed[message_id] = time.time()
    return False


def process_credit_charge(data: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate and deduct credits for an LLM usage payload.

    Expected payload shape::
        {
            "message_id": "uuid",
            "company_id": 1,
            "usage": [{"model": "...", "input_tokens": 100, "output_tokens": 50}],
            "no_of_images": 0,
            "session_id": "session_uuid"
        }
    """
    company_id = data.get("company_id")
    if company_id is None:
        logger.warning("No company_id in credit charge payload: %s", data)
        return {"status": "error", "error": "missing_company_id"}

    message_id = data.get("message_id")
    if _already_processed(message_id):
        logger.info("Message %s already processed — skipping company_id=%s", message_id, company_id)
        return {"status": "skipped", "reason": "already_processed"}

    usage = data.get("usage") or []
    no_of_images = int(data.get("no_of_images") or 0)
    if not usage and not no_of_images:
        logger.debug("Empty usage for company_id=%s — nothing to deduct", company_id)
        return {"status": "skipped", "reason": "empty_usage", "total_credits": 0.0}

    priced = get_total_usage(usage, no_of_images=no_of_images)
    credits_to_deduct = priced["total_credits"]
    if credits_to_deduct <= 0:
        logger.info("Zero-cost request for company_id=%s — nothing to deduct", company_id)
        return {"status": "skipped", "reason": "zero_cost", "total_credits": 0.0}

    try:
        deduct_credits(company_id, credits_to_deduct)
    except InsufficientCreditsError as e:
        logger.warning("Insufficient credits for company_id=%s: %s", company_id, e)
        return {"status": "insufficient_credits", "error": str(e), "total_credits": credits_to_deduct}
    except Exception as e:
        logger.exception("Failed to deduct credits for company_id=%s", company_id)
        raise

    logger.info(
        "Successfully deducted %s credits for company_id=%s (%s)",
        credits_to_deduct,
        company_id,
        priced.get("per_model"),
    )

    session_id = data.get("session_id")
    if session_id:
        try:
            add_credits_to_session(session_id, credits_to_deduct)
        except Exception:
            logger.exception(
                "Failed to record session credits session_id=%s — balance already deducted",
                session_id,
            )

    return {
        "status": "success",
        "deducted": credits_to_deduct,
        "per_model": priced.get("per_model", []),
    }
