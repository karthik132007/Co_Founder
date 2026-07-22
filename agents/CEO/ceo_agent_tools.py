import json
from pathlib import Path

from langchain.tools import tool

AGENTS_FILE = Path(__file__).resolve().parents[1] / "agents.json"

@tool('view_all_agents', description="View all available agents and their descriptions.")
def view_all_agents():
    """
    View all available agents and their descriptions.
    """
    with AGENTS_FILE.open('r', encoding='utf-8') as f:
        agents = json.load(f)
    return agents

@tool('ask_mcq_for_user', return_direct=True, description="Ask the user a multiple choice question shown as clickable buttons in the chat. ALWAYS use this when the user must choose between clear options (budget, direction, priority, format, channel, etc.). Provide a question and 2-4 options. Set multi_select=True when the user may reasonably pick several options (channels, goals, priorities). Ask at most 1-2 high-impact questions. The user can also type a custom answer, so never add an 'other' option yourself.")
def ask_mcq_for_user(question: str, options: list[str], multi_select: bool = False):
    """Ask a multiple choice question to the user and get their answer."""
    return json.dumps(
        {
            "type": "clarification_request",
            "question": question,
            "options": options,
            "allow_custom": True,
            "multi_select": multi_select,
        }
    )