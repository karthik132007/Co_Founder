"""
Kafka consumer for the manage_credits topic.

Reads per-request LLM usage payloads emitted by ``main.chat``::

    {
        "message_id": "uuid",
        "company_id": 1,
        "usage": [
            {"model": "deepseek/deepseek-v4-flash",
             "input_tokens": 1200, "output_tokens": 340},
            {"model": "google/gemini-2.5-flash-image",
             "input_tokens": 0, "output_tokens": 0, "image_count": 2},
        ],
        "no_of_images": 0,
    }

Prices the request with ``credits_engine.get_total_usage`` and deducts the
total from the company's credit balance via ``backend.db.credits.deduct_credits``.

Reliability notes:
  * ``enable.auto.commit`` is OFF — an offset is committed only after the
    deduction succeeds (or is intentionally skipped), so a crash mid-request
    redelivers the message instead of silently dropping the charge.
  * ``message_id`` is used for idempotency: redeliveries are skipped, so a
    company is never charged twice for the same request.  (The production-grade
    version of this is a DB ledger table with a unique ``message_id`` column.)
  * Insufficient balance is treated as terminal — it is logged and committed
    so the message is not retried forever.
"""

import json
import logging
import os
import sys

# Ensure the repo root is on sys.path so that 'from backend.db...' resolves.
_repo_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
if _repo_root not in sys.path:
    sys.path.insert(0, _repo_root)

from logger_config import setup_logging
setup_logging()

from confluent_kafka import Consumer, KafkaError
from backend.db.credits_charge import process_credit_charge

logger = logging.getLogger(__name__)

credits_manager = Consumer({
    "bootstrap.servers": os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092"),
    "group.id": "credit_management",
    "auto.offset.reset": "earliest",
    "enable.auto.commit": False,  # commit synchronously after each success
})

credits_manager.subscribe(["manage_credits"])

logger.info("manage_credits consumer started — subscribed to [manage_credits]")


def _commit(message) -> None:
    try:
        credits_manager.commit(message=message, asynchronous=False)
    except Exception:
        logger.exception("Failed to commit offset for manage_credits")


def process_message(data: dict) -> None:
    process_credit_charge(data)



try:
    while True:
        message = credits_manager.poll(1.0)
        if message is None:
            continue

        if message.error():
            err = message.error()
            if err is not None and err.code() == KafkaError._PARTITION_EOF:
                logger.debug("Reached end of partition (non-fatal): %s", err)
            elif err is not None:
                logger.error("Kafka consumer error (manage_credits): %s", err)
            continue

        raw_value = message.value()
        if raw_value is None:
            continue
        try:
            data = json.loads(raw_value.decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError) as e:
            logger.error("Malformed message in manage_credits topic — skipping: %s", e)
            _commit(message)
            continue

        try:
            process_message(data)
            _commit(message)
        except Exception:
            logger.exception(
                "Failed to process manage_credits message for company_id=%s — will retry on redelivery",
                data.get("company_id"),
            )
            # Do NOT commit — the message is redelivered for another attempt.

except KeyboardInterrupt:
    logger.info("manage_credits consumer received KeyboardInterrupt — shutting down")
except Exception:
    logger.exception("Fatal error in manage_credits consumer — shutting down")
finally:
    credits_manager.close()
    logger.info("manage_credits consumer closed")