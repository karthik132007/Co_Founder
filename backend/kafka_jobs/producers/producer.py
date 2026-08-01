import json
import logging

from confluent_kafka import Producer

logger = logging.getLogger(__name__)

_producer: Producer | None = None


def _get_producer() -> Producer:
    """Lazily create and cache the Kafka producer."""
    global _producer
    if _producer is None:
        _producer = Producer({"bootstrap.servers": "localhost:9092"})
        logger.info("Kafka producer initialized")
    return _producer


# ── internal helper ──────────────────────────────────────────────────────────

def _produce(topic: str, payload: dict) -> None:
    """Serialize *payload* to JSON and produce a Kafka message on *topic*."""
    data = json.dumps(payload).encode("utf-8")
    try:
        _get_producer().produce(topic=topic, value=data)
        _get_producer().flush()
        logger.debug("Kafka message produced — topic=%s", topic)
    except Exception:
        logger.exception("Failed to produce Kafka message — topic=%s", topic)
        raise

# ── public helpers — each matches a consumer job ─────────────────────────────

def queue_session_message(
    session_id: str,
    company_id: int,
    role: str,
    message: str,
) -> None:
    """Queue a message to be persisted into a chat session (add_message_to_session job)."""
    _produce("add_message_to_session", {
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

