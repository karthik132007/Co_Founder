"""
The main entry point to start conversation
"""
import logging
from decimal import Decimal

from agents.CEO import ceo_state
from agents.CEO.CEO import talk_to_ceo
from backend.db.credits import get_company_credits
from backend.kafka_jobs.producers.producer import queue_credit_management

logger = logging.getLogger(__name__)


def _get_available_credits(company_id: int) -> Decimal:
    """Return the company's current credit balance (0 if no row exists)."""
    row = get_company_credits(company_id)
    if not row:
        return Decimal("0")
    try:
        return Decimal(str(row.get("credits", 0)))
    except Exception:
        logger.exception("Failed to parse credits for company_id=%s", company_id)
        return Decimal("0")


def _queue_usage_charge(company_id: int, session_id: str) -> None:
    """Push this request's LLM usage to the credit-management Kafka consumer.

    Best-effort: a Kafka failure must never break the chat reply.
    """
    usage = ceo_state.pop_usage(session_id)
    if not usage:
        logger.debug("No usage recorded for session_id=%s — skipping credit charge", session_id)
        return
    try:
        queue_credit_management(
            company_id,
            usage=usage.get("breakdown", []),
            no_of_images=int(usage.get("no_of_images") or 0),
        )
    except Exception:
        logger.exception(
            "Failed to queue credit management for company_id=%s session_id=%s",
            company_id,
            session_id,
        )


def chat(company_id: int, user_message: str, history: list[dict] | None = None, effort: str = "flash", session_id: str = ""):
    if _get_available_credits(company_id) <= 0:
        return {"error": "You're out of credits. Please add credits to start a new chat."}
    try:
        result = talk_to_ceo(company_id, user_message, history, effort=effort, session_id=session_id)
        return result
    except Exception:
        logger.exception("chat failed for company_id=%s", company_id)
        raise
    finally:
        # Charge for the tokens used by this request (even on error paths).
        _queue_usage_charge(company_id, session_id)
