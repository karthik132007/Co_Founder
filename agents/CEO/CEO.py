"""
The main CEO agent that interacts with the user and delegates work to specialist agents.
"""
import json
import sys
from pathlib import Path

from langchain.agents import create_agent
from langchain.tools import tool

from agents.CEO.ceo_agent_tools import ask_mcq_for_user, view_all_agents
from agents.helpers.choose_llm import Task, get_best_llm
from agents.CEO.ceo_prompts import get_ceo_system_prompt
from backend.db.get_from_sql import get_company_data
from agents.marketing.cmo import talk_to_cmo
from agents.researcher.researcher import do_research
from agents.util_agents.writer.writer import write
from RAG_Engine.chat_memory import get_chat_memories_by_query


def _extract_content(response):
    return response["messages"][-1].content


def _get_relevant_chat_memories(company_id: int, query: str, top_k: int = 5):
    try:
        return get_chat_memories_by_query(
            company_id=company_id,
            query=query,
            match_count=top_k,
        )
    except Exception:
        return []


def _format_chat_memories(memories: list[dict]) -> str:
    if not memories:
        return "No relevant chat memories found."

    lines = []
    for index, memory in enumerate(memories, start=1):
        title = memory.get("title") or ""
        category = memory.get("category") or "uncategorized"
        importance = memory.get("importance") or "unknown"
        lines.append(f"{index}. [{importance} | {category}] {title}")
    return "\n".join(lines)


def _build_user_message_with_memories(message: str, memories: list[dict]) -> str:
    return f"""
Private context from relevant previous conversations:
{_format_chat_memories(memories)}

Use this context only when it is relevant to the founder's current message. Do not mention that memories were retrieved.

Current founder message:
{message}
""".strip()


def _build_ceo_tools(company_id: int):
    @tool(
        "knowledge_request",
        description="Search company knowledge across files and memory via the RAG engine.",
    )
    def knowledge_request(query: str, top_k: int = 5):
        repo_root = Path(__file__).resolve().parents[2]
        rag_dir = repo_root / "RAG_Engine"
        for path in (repo_root, rag_dir):
            path_str = str(path)
            if path_str not in sys.path:
                sys.path.insert(0, path_str)

        from RAG_Engine.rag import kg

        results = kg.search(company_id=company_id, query=query, top_k=top_k)

        return json.dumps(
            {
                "query": query,
                "top_k": top_k,
                "results": results,
            },
            default=str,
        )

    @tool(
        "research_request",
        description="Delegate fact-finding and verification to the Researcher agent.",
    )
    def research_request(task: str):
        return do_research(task)

    @tool(
        "writing_request",
        description="Delegate drafting and polishing to the Writer agent.",
    )
    def writing_request(task: str):
        return write(task)

    @tool(
        "marketing_request",
        description="Delegate market strategy and growth work to the CMO agent.",
    )
    def marketing_request(task: str):
        return talk_to_cmo(company_id, task)

    return [
        view_all_agents,
        # ask_mcq_for_user,
        knowledge_request,
        research_request,
        writing_request,
        marketing_request,
    ]

def _get_ceo_agent(company_id: int):
    company_data = get_company_data(company_id)
    if not company_data:
        raise ValueError(f"No company found for company_id={company_id}")

    ceo_agent = create_agent(
        name="CEO Agent",
        system_prompt=get_ceo_system_prompt(company_data),
        model=get_best_llm([Task.PLANNING, Task.WRITING]),
        tools=_build_ceo_tools(company_id),
    )
    return ceo_agent


def talk_to_ceo(company_id: int, message: str):
    ceo_agent = _get_ceo_agent(company_id)
    chat_memories = _get_relevant_chat_memories(company_id, message)
    user_message = _build_user_message_with_memories(message, chat_memories)
    result = ceo_agent.invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": user_message,
                }
            ]
        }
    )
    return _extract_content(result)
