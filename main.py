"""
The main entry point to start conversation
"""
import logging

from agents.CEO.CEO import talk_to_ceo
from backend.db.chat_memory_helpers import store_chat_memory, store_chat_title

logger = logging.getLogger(__name__)


def chat(company_id: int, user_message: str, history: list[dict] | None = None, effort: str = "flash", session_id: str = ""):
    try:
        result = talk_to_ceo(company_id, user_message, history, effort=effort, session_id=session_id)
        return result
    except Exception:
        logger.exception("chat failed for company_id=%s", company_id)
        raise
