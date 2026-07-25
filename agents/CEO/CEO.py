"""
The main CEO agent that interacts with the user and delegates work to specialist agents.
"""
import json
import logging
import sys
from pathlib import Path

from langchain.agents import create_agent
from langchain.tools import tool

logger = logging.getLogger(__name__)

from agents.CEO.ceo_agent_tools import ask_mcq_for_user, view_all_agents
from agents.helpers.choose_llm import Task, get_best_llm
from agents.CEO.ceo_prompts import get_ceo_system_prompt
from backend.db.get_from_sql import get_company_data
from agents.marketing.cmo import spawn_cmo
from agents.researcher.researcher import spawn_researcher
from agents.util_agents.writer.writer import spawn_writer
from agents.data_analyst.data_agent import spawn_data_analyst
from agents.graphic_design.graphic_designer import spawn_graphic_designer
from RAG_Engine.chat_memory import get_chat_memories_by_query


def _extract_content(response):
    content = response["messages"][-1].content
    return content


def _get_relevant_chat_memories(company_id: int, query: str, top_k: int = 5):
    logger.info("Fetching relevant chat memories for company_id=%d, top_k=%d", company_id, top_k)
    try:
        memories = get_chat_memories_by_query(
            company_id=company_id,
            query=query,
            match_count=top_k,
        )
        logger.info("Retrieved %d chat memories for company_id=%d", len(memories), company_id)
        return memories
    except Exception as e:
        logger.warning("Failed to fetch chat memories for company_id=%d: %s", company_id, e)
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
    result = "\n".join(lines)
    return result


def _build_user_message_with_memories(message: str, memories: list[dict]) -> str:
    return f"""
Hey CEO, here are retrieved relevant memories from past conversations with the founder:
{_format_chat_memories(memories)}

Use these memories as context when relevant to the founder's current message below. Do NOT mention that memories were retrieved — just use them naturally.

Founder's message:
{message}
""".strip()


def _build_ceo_tools(company_id: int):
    @tool(
        "knowledge_request",
        description="Search the company's document knowledge base (files, chunks). Does NOT search chat memories — those are injected automatically.",
    )
    def knowledge_request(query: str, top_k: int = 5):
        logger.info("knowledge_request called: query='%s', top_k=%d, company_id=%d", query, top_k, company_id)
        repo_root = Path(__file__).resolve().parents[2]
        rag_dir = repo_root / "RAG_Engine"
        for path in (repo_root, rag_dir):
            path_str = str(path)
            if path_str not in sys.path:
                sys.path.insert(0, path_str)

        from RAG_Engine.rag import kg

        # Chat memories are already injected into the user prompt by talk_to_ceo.
        # Only search documents here to avoid duplicate/conflicting memory results.
        results = kg.search(company_id=company_id, query=query, top_k=top_k, include_chat_memory=False)
        logger.info("RAG search returned %d results for query: %s", len(results), query)

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
        logger.info("research_request called: task='%s'", task)
        result = spawn_researcher(task)
        logger.info("research_request completed for task: '%s'", task)
        return result

    @tool(
        "writing_request",
        description="Delegate drafting and polishing to the Writer agent.",
    )
    def writing_request(task: str):
        logger.info("writing_request called: task='%s'", task)
        result = spawn_writer(task)
        logger.info("writing_request completed for task: '%s'", task)
        return result

    @tool(
        "marketing_request",
        description="Delegate market strategy and growth work to the CMO agent.",
    )
    def marketing_request(task: str):
        logger.info("marketing_request called: task='%s', company_id=%d", task, company_id)
        result = spawn_cmo(company_id, task)
        logger.info("marketing_request completed for task: '%s'", task)
        return result

    @tool(
        "data_analysis_request",
        description="Delegate data analysis, EDA, and file-based insights to the Data Analyst agent.",
    )
    def data_analysis_request(task: str):
        logger.info("data_analysis_request called: task='%s', company_id=%d", task, company_id)
        result = spawn_data_analyst(company_id, task)
        logger.info("data_analysis_request completed for task: '%s'", task)
        return result

    @tool(
        "graphic_design_request",
        return_direct=True,
        description="Delegate branded visual assets and color-palette work to the Graphic Designer agent.",
    )
    def graphic_design_request(task: str):
        logger.info("graphic_design_request called: task='%s', company_id=%d", task, company_id)
        result = spawn_graphic_designer(company_id, task)
        logger.info("graphic_design_request completed for task: '%s'", task)
        return result

    return [
        view_all_agents,
        ask_mcq_for_user,
        knowledge_request,
        research_request,
        writing_request,
        marketing_request,
        data_analysis_request,
        graphic_design_request,
    ]

def _get_ceo_agent(company_id: int):
    logger.info("Creating CEO agent for company_id=%d", company_id)
    company_data = get_company_data(company_id)
    if not company_data:
        logger.error("No company found for company_id=%d", company_id)
        raise ValueError(f"No company found for company_id={company_id}")


    ceo_agent = create_agent(
        name="CEO Agent",
        system_prompt=get_ceo_system_prompt(company_data),
        model=get_best_llm([Task.PLANNING, Task.WRITING]),
        tools=_build_ceo_tools(company_id),
    )
    logger.info("CEO agent created successfully for company_id=%d", company_id)
    return ceo_agent


def talk_to_ceo(company_id: int, message: str, history: list[dict] | None = None):
    """Talk to the CEO agent.

    Returns either a plain string reply, or a dict payload
    {"type": "clarification_request", "question": ..., "options": [...]}
    when the agent asks the user a multiple choice question.
    """
    logger.info("talk_to_ceo called: company_id=%d, message='%s', history_len=%d", company_id, message[:100], len(history or []))
    ceo_agent = _get_ceo_agent(company_id)
    chat_memories = _get_relevant_chat_memories(company_id, message)
    user_message = _build_user_message_with_memories(message, chat_memories)

    # Build the message list: prior conversation turns + current message.
    # Cap at the last 20 turns to keep context manageable.
    messages = []
    if history:
        recent = history[-20:]
        for turn in recent:
            role = turn.get("role")
            # DB stores the text in "message"; some callers may use "content".
            content = turn.get("content") or turn.get("message") or ""
            if role in ("user", "assistant") and content.strip():
                messages.append({"role": role, "content": content.strip()})
    messages.append({"role": "user", "content": user_message})

    result = ceo_agent.invoke(
        {
            "messages": messages
        }
    )
    # Check tool outputs for image_generated payload (from graphic_design_request)
    image_payload = _find_image_generated_payload(result)
    if image_payload:
        # Resolve the image token back to the real data URL (kept out of LLM context).
        token = image_payload.pop("image_token", None)
        if token:
            from agents.graphic_design.graphic_desiger_tools import get_generated_image
            image_data_url = get_generated_image(token)
            if image_data_url:
                image_payload["image_data_url"] = image_data_url
                image_payload["message"] = "Here is the generated graphic."
                logger.info("CEO agent returned image_generated")
                return image_payload
            logger.warning("Image token %s not found in cache", token)
        elif "image_data_url" in image_payload:
            logger.info("CEO agent returned image_generated")
            return image_payload
    content = _extract_content(result)
    if isinstance(content, str):
        try:
            parsed = json.loads(content)
            if isinstance(parsed, dict) and parsed.get("type") in {"clarification_request", "image_generated"}:
                logger.info("CEO agent returned %s", parsed.get("type"))
                return parsed
        except (json.JSONDecodeError, TypeError):
            pass
    logger.info("talk_to_ceo completed for company_id=%d", company_id)
    return content


def _find_image_generated_payload(response) -> dict | None:
    """Scan tool messages for an image_generated JSON payload from graphic_design_request."""
    for message in reversed(response.get("messages", [])):
        if getattr(message, "name", None) != "graphic_design_request":
            continue
        content = getattr(message, "content", None)
        if isinstance(content, str):
            try:
                parsed = json.loads(content)
                if isinstance(parsed, dict) and parsed.get("type") == "image_generated":
                    return parsed
            except (json.JSONDecodeError, TypeError):
                continue
    return None
