import json
import logging
import os
from uuid import uuid4

from confluent_kafka import Producer

logger = logging.getLogger(__name__)

_producer: Producer | None = None


def _get_producer() -> Producer:
    """Lazily create and cache the Kafka producer."""
    global _producer
    if _producer is None:
        _producer = Producer({
            "bootstrap.servers": os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092"),
        })
        logger.info("Kafka producer initialized")
    return _producer


# ── internal helper ──────────────────────────────────────────────────────────

def _produce(topic: str, payload: dict) -> dict:
    """Serialize *payload* to JSON and produce a Kafka message on *topic*."""
    data = json.dumps(payload).encode("utf-8")
    try:
        producer = _get_producer()
        producer.produce(topic=topic, value=data)
        remaining = producer.flush(timeout=1.0)
        if remaining > 0:
            logger.warning("Kafka message not delivered (timeout/broker unreachable) — topic=%s", topic)
            return {
                "status": "error",
                "error": "broker_unreachable",
                "topic": topic,
                "payload": payload,
            }
        logger.debug("Kafka message produced — topic=%s", topic)
        return {
            "status": "success",
            "topic": topic,
            "payload": payload,
        }
    except Exception:
        logger.warning("Failed to produce Kafka message (best-effort) — topic=%s", topic, exc_info=True)
        return {
            "status": "error",
            "topic": topic,
            "payload": payload,
        }

# ── public helpers — each matches a consumer job ─────────────────────────────

def queue_session_message(
    session_id: str,
    company_id: int,
    role: str,
    message: str,
) -> None:
    """Queue a message to be persisted into a chat session (add_message_to_session job)."""
    result = _produce("add_message_to_session", {
        "session_id": session_id,
        "company_id": company_id,
        "role": role,
        "message": message,
    })
    
    

def queue_chat_memory(
    company_id: int,
    user_message: str,
    ceo_reply: str,
) -> None:
    """Queue a user/assistant pair to be stored as chat memory (chat_memory job)."""
    _produce("chat_memory", {
        "company_id": company_id,
        "user_message": user_message,
        "ceo_reply": ceo_reply,
    })

def queue_title_creation(session_id: str, query: str) -> None:
    """Queue a title-generation request for a chat session (session_title_creation job)."""
    _produce("session_title_creation", {
        "session_id": session_id,
        "query": query,
    })

def queue_credit_management(
    company_id: int,
    usage: list[dict],
    no_of_images: int = 0,
    session_id: str | None = None,
    message_id: str | None = None,
) -> dict:
    """Queue a credit management request (manage_credits job).

    ``usage`` is the per-model token breakdown collected from the CEO run::

        [
            {"model": "deepseek/deepseek-v4-flash",
             "input_tokens": 1200, "output_tokens": 340},
            {"model": "google/gemini-2.5-flash-image",
             "input_tokens": 0, "output_tokens": 0, "image_count": 2},
        ]

    A ``message_id`` is included so the consumer can deduplicate redeliveries
    and never charge a company twice for the same request. ``session_id``
    (when present) lets the consumer record per-session credit usage.
    """
    payload = {
        "message_id": message_id or str(uuid4()),
        "company_id": company_id,
        "usage": usage,
        "no_of_images": no_of_images,
    }
    if session_id:
        payload["session_id"] = session_id
    return _produce("manage_credits", payload)