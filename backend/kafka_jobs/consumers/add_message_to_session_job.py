"""
Kafka consumer for add_message_to_session topic.

Reads session message payloads (session_id, company_id, role, message)
and inserts them via add_message_to_session.  Each message is processed
in its own try/except so a single bad message never kills the consumer.
"""

import json
import logging
import sys
import os

# Ensure the repo root is on sys.path so that 'from backend.db...' resolves.
_repo_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
if _repo_root not in sys.path:
    sys.path.insert(0, _repo_root)

from logger_config import setup_logging
setup_logging()

from confluent_kafka import Consumer, KafkaError
from backend.db.insert_to_sql import add_message_to_session

logger = logging.getLogger(__name__)

message_consumer = Consumer({
    "bootstrap.servers": "localhost:9092",
    "group.id": "add_message_to_session_job",
    "auto.offset.reset": "earliest",
    "enable.auto.commit": False,
})

message_consumer.subscribe(topics=["add_message_to_session"])

logger.info("add_message_to_session consumer started — subscribed to [add_message_to_session]")

try:
    while True:
        message = message_consumer.poll(1.0)
        if message is None:
            continue

        if message.error():
            err = message.error()
            if err.code() == KafkaError._PARTITION_EOF:
                logger.debug("Reached end of partition (non-fatal): %s", err)
            else:
                logger.error("Kafka consumer error (add_message_to_session): %s", err)
            continue

        try:
            value = message.value().decode("utf-8")
            data = json.loads(value)
        except (json.JSONDecodeError, UnicodeDecodeError) as e:
            logger.error("Malformed message in add_message_to_session topic — skipping: %s", e)
            continue

        session_id = data.get("session_id")
        company_id = data.get("company_id")

        # company_id may be 0, None, or missing — only skip when truly absent
        if company_id is None:
            logger.warning("No company_id found for session_id=%s, message: %s", session_id, value)
            continue

        logger.info("Received message for session_id=%s, company_id=%s", session_id, company_id)
        role = data.get("role")
        content = data.get("message")

        try:
            add_message_to_session(session_id=session_id, role=role, message=content)
            logger.info("Added message to session_id=%s, company_id=%s", session_id, company_id)
        except Exception:
            logger.exception("Failed to add message to session_id=%s", session_id)
            continue

        try:
            message_consumer.commit(message=message, asynchronous=False)
        except Exception as e:
            logger.error("Failed to commit offset for add_message_to_session: %s", e)

except KeyboardInterrupt:
    logger.info("add_message_to_session consumer received KeyboardInterrupt — shutting down")
except Exception:
    logger.exception("Fatal error in add_message_to_session consumer — shutting down")
finally:
    message_consumer.close()
    logger.info("add_message_to_session consumer closed")