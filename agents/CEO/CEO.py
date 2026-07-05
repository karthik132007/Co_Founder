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


def _extract_content(response):
    return response["messages"][-1].content


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
        if isinstance(results, list) and len(results) == 1 and isinstance(results[0], list):
            results = results[0]

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
        ask_mcq_for_user,
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
    result = ceo_agent.invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": message,
                }
            ]
        }
    )
    return _extract_content(result)
