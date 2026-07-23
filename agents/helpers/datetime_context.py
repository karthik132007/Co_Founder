import logging
from datetime import datetime

logger = logging.getLogger(__name__)


def get_datetime_context() -> str:
    now = datetime.now().astimezone()
    date_str = now.strftime('%Y-%m-%d %H:%M:%S %Z%z')
    logger.debug("Datetime context requested: %s", date_str)
    return f"Current datetime: {date_str}"
