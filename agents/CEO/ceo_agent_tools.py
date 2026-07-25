import json
import logging
from pathlib import Path

from langchain.tools import tool

logger = logging.getLogger(__name__)

AGENTS_FILE = Path(__file__).resolve().parents[1] / "agents.json"

@tool('view_all_agents', description="View all available agents and their descriptions.")
def view_all_agents():
    """
    View all available agents and their descriptions.
    """
    logger.info("view_all_agents called")
    with AGENTS_FILE.open('r', encoding='utf-8') as f:
        agents = json.load(f)
    return agents

@tool('ask_mcq_for_user', return_direct=True, description="Ask the user a multiple choice question shown as clickable buttons. HARD LIMIT: call this at most 2 times total per task — then you MUST act. Use only for critical decisions (budget, direction, priority, format, channel). Batch related questions into ONE call with multi_select=True. NEVER re-ask something the user already answered. The user can always type a custom answer, so never add an 'other' option.")
def ask_mcq_for_user(question: str, options: list[str], multi_select: bool = False):
    """Ask a multiple choice question to the user and get their answer."""
    logger.info("ask_mcq_for_user called: question='%s', options=%s, multi_select=%s", question, options, multi_select)
    return json.dumps(
        {
            "type": "clarification_request",
            "question": question,
            "options": options,
            "allow_custom": True,
            "multi_select": multi_select,
        }
    )