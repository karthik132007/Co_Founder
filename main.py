"""
The main entry point to start conversation
"""
import logging
from decimal import Decimal

from agents.CEO import ceo_state
from agents.CEO.CEO import talk_to_ceo
from backend.db.credits import get_company_credits
from uuid import uuid4
from backend.db.credits_charge import process_credit_charge
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


def _queue_usage_charge(
    company_id: int, session_id: str, assistant_message_id: int | None = None
) -> None:
    """Push this request's LLM usage to the credit-management Kafka consumer,
    or deduct directly if Kafka is offline/undelivered.

    ``assistant_message_id`` is the ``chat_messages`` row for this reply, so
    the consumer can attribute the cost to the exact message. It must be
    passed by the API layer *after* the reply is stored — charging inside
    ``chat()`` would run before the row exists.

    Best-effort: a failure here must never break the chat reply.
    """
    usage = ceo_state.pop_usage(session_id)
    if not usage:
        logger.debug("No usage recorded for session_id=%s — skipping credit charge", session_id)
        return

    message_id = str(uuid4())
    payload = {
        "message_id": message_id,
        "company_id": company_id,
        "usage": usage.get("breakdown", []),
        "no_of_images": int(usage.get("no_of_images") or 0),
        "session_id": session_id,
    }
    if assistant_message_id:
        payload["assistant_message_id"] = assistant_message_id

    try:
        # Charge before returning the HTTP response so the frontend's next
        # balance request observes the deduction immediately. Kafka remains a
        # fallback for transient DB/provider failures, not the normal path.
        result = process_credit_charge(payload)
        if result.get("status") in {"success", "skipped", "insufficient_credits"}:
            return
    except Exception:
        logger.exception(
            "Direct credit deduction failed; queueing Kafka retry for company_id=%s session_id=%s",
            company_id,
            session_id,
        )

    try:
        res = queue_credit_management(
            company_id,
            usage=payload["usage"],
            no_of_images=payload["no_of_images"],
            session_id=session_id,
            message_id=message_id,
            assistant_message_id=assistant_message_id,
        )
        if res.get("status") != "success":
            logger.warning(
                "Kafka credit retry was not delivered for company_id=%s: status=%s",
                company_id,
                res.get("status"),
            )
    except Exception:
        logger.exception(
            "Failed to queue Kafka credit retry for company_id=%s session_id=%s",
            company_id,
            session_id,
        )



def chat(company_id: int, user_message: str, history: list[dict] | None = None, effort: str = "flash", session_id: str = ""):
    """Run one CEO turn and return the reply.

    Token charging is the caller's job: the API layer stores the assistant
    reply first and then calls ``_queue_usage_charge`` with that row's id so
    the cost is attributed to the exact message. Charging here (in a
    ``finally``) would run before the reply row exists.
    """
    if _get_available_credits(company_id) <= 0:
        return {"error": "You're out of credits. Please add credits to start a new chat."}
    try:
        result = talk_to_ceo(company_id, user_message, history, effort=effort, session_id=session_id)
        return result
    except Exception:
        logger.exception("chat failed for company_id=%s", company_id)
        raise
