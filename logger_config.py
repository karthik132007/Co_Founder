import logging
import os
from logging.handlers import RotatingFileHandler

LOG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs.log")

_logging_configured = False

# Third-party loggers that produce excessive DEBUG/INFO noise (HTTP wire logs,
# hpack encoding details, etc.). Set them to WARNING so only real problems surface.
_NOISY_LOGGERS = [
    "httpx",
    "httpcore",
    "hpack",
    "openai",
    "openai._base_client",
    "urllib3",
    "requests",
    "asyncio",
    "sentence_transformers",
    "http11",
]


def setup_logging():
    global _logging_configured
    if _logging_configured:
        return

    logger = logging.getLogger()
    logger.setLevel(logging.INFO)

    file_handler = RotatingFileHandler(LOG_FILE, maxBytes=10 * 1024 * 1024, backupCount=3, encoding="utf-8")
    file_handler.setLevel(logging.INFO)
    file_formatter = logging.Formatter(
        "%(asctime)s | %(levelname)-8s | %(name)-30s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    file_handler.setFormatter(file_formatter)
    logger.addHandler(file_handler)

    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_formatter = logging.Formatter(
        "%(asctime)s | %(levelname)-8s | %(name)-30s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)

    # Silence noisy third-party loggers — keep only warnings/errors from them.
    for name in _NOISY_LOGGERS:
        logging.getLogger(name).setLevel(logging.WARNING)

    _logging_configured = True


setup_logging()
