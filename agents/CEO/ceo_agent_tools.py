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

@tool('ask_mcq_for_user', return_direct=True, description="Ask a multiple choice question to the user and get their answer.")
def ask_mcq_for_user(questions_json):
    """
    Ask a multiple choice question to the user and get their answer.
    format:
    [
    {
    "question": "What is the question?",
    "option1":"option1",
    "option2":"option2",
    "option3":"option3",
    "none_of_above":"users custom answer",
    }
    ]
    """
    try:
        questions = json.loads(questions_json)
    except json.JSONDecodeError as exc:
        return json.dumps({"error": f"Invalid questions payload: {exc}"})

    return json.dumps(
        {
            "type": "clarification_request",
            "questions": questions,
        }
    )