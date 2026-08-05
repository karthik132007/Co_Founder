"""
Kafka consumer for chat_memory topic.

Reads user/assistant message pairs and persists them as chat memory
via store_chat_memory.  Each message is processed in its own try/except
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
from backend.db.chat_memory_helpers import store_chat_memory

logger = logging.getLogger(__name__)

consumer_config = {
    'bootstrap.servers': os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092"),
    'group.id': 'chat_memory',
    'auto.offset.reset': 'earliest',
    'enable.auto.commit': False,          # commit synchronously after each success
}

chat_consumer = Consumer(consumer_config)
chat_consumer.subscribe(["chat_memory"])

logger.info("chat_memory consumer started — subscribed to [chat_memory]")

try:
    while True:
        message = chat_consumer.poll(1.0)
        if message is None:
            continue

        # ── non-fatal "errors" (e.g. _PARTITION_EOF) ────────────────
        if message.error():
            err = message.error()
            if err.code() == KafkaError._PARTITION_EOF:
                logger.debug("Reached end of partition (non-fatal): %s", err)
            else:
                logger.error("Kafka consumer error (chat_memory): %s", err)
            continue

        # ── process one message ─────────────────────────────────────
        try:
            val = message.value().decode('utf-8')
            data = json.loads(val)
        except (json.JSONDecodeError, UnicodeDecodeError) as e:
            logger.error("Malformed message in chat_memory topic — skipping: %s", e)
            continue

        company_id = data.get("company_id")
        if not company_id:
            logger.warning("No company_id found in message: %s", val)
            continue

        logger.info("Received message for company_id=%s: %s", company_id, val)

        try:
            user_message = data.get("user_message")
            ceo_reply = data.get("ceo_reply")
            store_chat_memory(company_id, user_message, ceo_reply)
            logger.info("Chat memory stored for company_id=%s", company_id)
        except Exception as e:
            logger.exception("Failed to store chat memory for company_id=%s", company_id)
            continue

        # Commit offset *after* successful processing to avoid duplicates
        # on restart (auto.offset.reset=earliest).
        try:
            chat_consumer.commit(message=message, asynchronous=False)
        except Exception as e:
            logger.error("Failed to commit offset for chat_memory: %s", e)

except KeyboardInterrupt:
    logger.info("chat_memory consumer received KeyboardInterrupt — shutting down")
except Exception:
    logger.exception("Fatal error in chat_memory consumer — shutting down")
finally:
    chat_consumer.close()
    logger.info("chat_memory consumer closed")