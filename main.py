"""
The main entry point to start conversation
"""
import json
import logging

from agents.CEO.CEO import talk_to_ceo
from RAG_Engine.chat_memory import add_memory
from agents.util_agents.chat_memory_creator import create_chat_memory
from agents.util_agents.title_creator import create_title_for_query
from backend.db.insert_to_sql import update_chat_session_title

logger = logging.getLogger(__name__)


def chat(company_id:int, user_message:str):
    try:
        result = talk_to_ceo(company_id, user_message)
        return result
    except Exception:
        logger.exception("chat failed for company_id=%s", company_id)
        raise


def store_chat_memory(company_id: int, user_message: str, ceo_reply: str) -> None:
    conversation = f"""
    User: {user_message}
    CEO: {ceo_reply}
"""
    try:
        memories = create_chat_memory(conversation)
        if memories:
            parsed = json.loads(memories)
            add_memory(parsed, company_id)
        else:
            logger.warning("create_chat_memory returned no memories for company_id=%s", company_id)
    except Exception:
        logger.exception("Failed to store chat memory for company_id=%s", company_id)


def store_chat_title(session_id: str, user_message: str) -> None:
    try:
        title = create_title_for_query(user_message)
        if title:
            update_chat_session_title(session_id, title)
        else:
            logger.warning("create_title_for_query returned no title for session_id=%s", session_id)
    except Exception:
        logger.exception("Failed to store chat title for session_id=%s", session_id)
