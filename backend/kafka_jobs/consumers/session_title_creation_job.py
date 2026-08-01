"""
Kafka consumer for session_title_creation topic.

Reads session_id + query pairs and calls store_chat_title to generate
and persist a title.  Each message is processed in its own try/except
so a single bad message never kills the consumer.
"""

import json
import logging
import sys
import os

# Ensure the repo root is on sys.path so that imports from backend.* resolve.
_repo_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
if _repo_root not in sys.path:
    sys.path.insert(0, _repo_root)

from logger_config import setup_logging
setup_logging()

from confluent_kafka import Consumer, KafkaError
from backend.db.chat_memory_helpers import store_chat_title

logger = logging.getLogger(__name__)

consumer_config = {
    'bootstrap.servers': 'localhost:9092',
    'group.id': 'session_title_creator',
    'auto.offset.reset': 'earliest',
    'enable.auto.commit': False,
}

session_title_creation_consumer = Consumer(consumer_config)
session_title_creation_consumer.subscribe(["session_title_creation"])

logger.info("session_title_creation consumer started — subscribed to [session_title_creation]")

try:
    while True:
        message = session_title_creation_consumer.poll(1.0)
        if message is None:
            continue

        if message.error():
            err = message.error()
            if err.code() == KafkaError._PARTITION_EOF:
                logger.debug("Reached end of partition (non-fatal): %s", err)
            else:
                logger.error("Kafka consumer error (session_title_creation): %s", err)
            continue

        try:
            val = message.value().decode("utf-8")
            data = json.loads(val)
        except (json.JSONDecodeError, UnicodeDecodeError) as e:
            logger.error("Malformed message in session_title_creation topic — skipping: %s", e)
            continue

        session_id = data.get("session_id")
        if not session_id:
            logger.error("No session_id found in message: %s", val)
            continue

        logger.info("Received message for session_id=%s: %s", session_id, val)

        query = data.get("query")

        try:
            store_chat_title(session_id, query)
            logger.info("Session title created for session_id=%s", session_id)
        except Exception:
            logger.exception("Failed to create title for session_id=%s", session_id)
            continue

        try:
            session_title_creation_consumer.commit(message=message, asynchronous=False)
        except Exception as e:
            logger.error("Failed to commit offset for session_title_creation: %s", e)

except KeyboardInterrupt:
    logger.info("session_title_creation consumer received KeyboardInterrupt — shutting down")
except Exception:
    logger.exception("Fatal error in session_title_creation consumer — shutting down")
finally:
    session_title_creation_consumer.close()
    logger.info("session_title_creation consumer closed")
