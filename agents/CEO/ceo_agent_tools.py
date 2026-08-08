import json
import logging
from pathlib import Path
import sys
import time
from langchain.tools import tool
from backend.api.connection_manager import event_bus
from backend.api.observability_events import (
    make_subagent_end,
    make_subagent_error,
    make_subagent_spawn,
)

from agents.CEO import ceo_state

from agents.researcher.researcher import spawn_researcher
from agents.util_agents.writer.writer import spawn_writer
from agents.data_analyst.data_agent import spawn_data_analyst
from agents.graphic_design.graphic_designer import spawn_graphic_designer
from agents.marketing.cmo import spawn_cmo
from agents.CEO.ceo_resources import consume_resource

AGENTS_FILE = Path(__file__).resolve().parents[1] / "agents.json"
logger = logging.getLogger(__name__)


def _resource_exhausted(session_id: str, resource: str) -> bool:
    """Check a session budget before spawning a specialist that needs it."""
    if not session_id:
        return False
    try:
        from agents.CEO.ceo_resources import get_session_resources

        state = get_session_resources(session_id)
        if not state:
            return False
        return state.get("consumed", {}).get(resource, 0) >= state.get("limits", {}).get(f"max_{resource}", 0)
    except Exception:
        # The tool itself will surface any real backend issue; do not block a
        # delegation merely because this optional pre-flight check failed.
        return False


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



@tool('view_all_agents', description="View all available agents and their descriptions.")
def view_all_agents():
    """
    View all available agents and their descriptions.
    """
    logger.info("view_all_agents called")
    with AGENTS_FILE.open('r', encoding='utf-8') as f:
        agents = json.load(f)
    return agents



def _build_user_message_with_memories(message: str, memories: list[dict]) -> str:
    return f"""
Hey CEO, here are retrieved relevant memories from past conversations with the founder:
{_format_chat_memories(memories)}

Use these memories as context when relevant to the founder's current message below. Do NOT mention that memories were retrieved — just use them naturally.

Founder's message:
{message}
""".strip()


def _build_ceo_tools(company_id: int):
    
    @tool('ask_mcq_for_user', return_direct=True, description="Ask the user a multiple choice question shown as clickable buttons. HARD LIMIT: call this at most 2 times total per task — then you MUST act. Use only for critical decisions (budget, direction, priority, format, channel). Batch related questions into ONE call with multi_select=True. NEVER re-ask something the user already answered. The user can always type a custom answer, so never add an 'other' option.")
    def ask_mcq_for_user(question: str, options: list[str], multi_select: bool = False, allow_custom: bool = True):
        """Ask a multiple choice question to the user and get their answer."""
        logger.info("ask_mcq_for_user called: question='%s', options=%s, multi_select=%s", question, options, multi_select)
        sid = ceo_state._current_session_id
        if sid and not consume_resource(sid, "mcqs"):
            return json.dumps({"error": "mcqs budget exhausted for this session."})
        # return_direct=True means LangChain skips on_tool_end — push it manually
        if sid:
            from agents.helpers.observability import _push_tool_end_manual
            _push_tool_end_manual(sid, "ask_mcq_for_user", 0, "MCQ presented to user")
        return json.dumps(
            {
                "type": "clarification_request",
                "question": question,
                "options": options,
                "allow_custom": allow_custom,
                "multi_select": multi_select,
            }
        )
    @tool(
        "knowledge_request",
        description="Search the company's document knowledge base (files, chunks). Does NOT search chat memories — those are injected automatically.",
    )
    def knowledge_request(query: str, top_k: int = 5):

        sid = ceo_state._current_session_id
        if sid and not consume_resource(sid, "rag_calls"):
            return json.dumps({"error": "rag calls budget exhausted for this session."})

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
        description="Search the WEB for external/public information. Use for: market research, competitor analysis, industry trends, regulations, benchmarks. Does NOT have access to company files — use data_analysis_request for any question about uploaded CSV/Excel/sales data.",
    )
    def research_request(task: str):
        logger.info("research_request called: task='%s', effort=%s", task, ceo_state._current_effort)
        sid = ceo_state._current_session_id

        # The Researcher consumes the session's web-search budget. Once it is
        # empty, spawning another full Researcher would only add LLM latency
        # before returning the same budget error.
        if _resource_exhausted(sid, "web_searches"):
            logger.info("Skipping Researcher: web-search budget exhausted for session_id=%s", sid)
            return json.dumps({"error": "Web-search budget exhausted for this session."})

        if sid:
            event_bus.push(make_subagent_spawn(sid, "Researcher", task, ceo_state._current_effort))
        t0 = time.time()
        try:
            result = spawn_researcher(task, effort=ceo_state._current_effort, session_id=sid)
            if sid:
                event_bus.push(make_subagent_end(sid, "Researcher", (time.time() - t0) * 1000, str(result)))
            logger.info("research_request completed for task: '%s'", task)
            return result
        except Exception as e:
            if sid:
                event_bus.push(make_subagent_error(sid, "Researcher", str(e)))
            raise

    @tool(
        "writing_request",
        description="Delegate drafting and polishing to the Writer agent.",
    )
    def writing_request(task: str):
        logger.info("writing_request called: task='%s', effort=%s", task, ceo_state._current_effort)

        sid = ceo_state._current_session_id
        if sid and not consume_resource(sid, "external_agents"):
            return json.dumps({"error": "external agents budget exhausted for this session."})
        
        if sid:
            event_bus.push(make_subagent_spawn(sid, "Writer", task, ceo_state._current_effort))
        t0 = time.time()
        try:
            result = spawn_writer(task, effort=ceo_state._current_effort)
            if sid:
                event_bus.push(make_subagent_end(sid, "Writer", (time.time() - t0) * 1000, str(result)))
            logger.info("writing_request completed for task: '%s'", task)
            return result
        except Exception as e:
            if sid:
                event_bus.push(make_subagent_error(sid, "Writer", str(e)))
            raise

    @tool(
        "marketing_request",
        description="Delegate market strategy and growth work to the CMO agent.",
    )
    def marketing_request(task: str):
        logger.info("marketing_request called: task='%s', company_id=%d, effort=%s", task, company_id, ceo_state._current_effort)
        sid = ceo_state._current_session_id
        if sid and not consume_resource(sid, "external_agents"):
            return json.dumps({"error": "external agents budget exhausted for this session."})
        
        if sid:
            event_bus.push(make_subagent_spawn(sid, "CMO", task, ceo_state._current_effort))
        t0 = time.time()
        try:
            result = spawn_cmo(company_id, task, effort=ceo_state._current_effort, session_id=sid)
            if sid:
                event_bus.push(make_subagent_end(sid, "CMO", (time.time() - t0) * 1000, str(result)))
            logger.info("marketing_request completed for task: '%s'", task)
            return result
        except Exception as e:
            if sid:
                event_bus.push(make_subagent_error(sid, "CMO", str(e)))
            raise

    @tool(
        "data_analysis_request",
        description="Analyze company data files (CSV, Excel, etc.). Use for: best/top/worst selling products, sales trends, revenue analysis, profit margins, any question about company-uploaded spreadsheets. This agent reads YOUR files and runs Python — use it for ANY question about your own company data.",
    )
    def data_analysis_request(task: str):
        logger.info("data_analysis_request called: task='%s', company_id=%d, effort=%s", task, company_id, ceo_state._current_effort)
        sid = ceo_state._current_session_id

        if sid and not consume_resource(sid, "external_agents"):
            return json.dumps({"error": "external agents budget exhausted for this session."})
        
        if sid:
            event_bus.push(make_subagent_spawn(sid, "DataAnalyst", task, ceo_state._current_effort))
        t0 = time.time()
        try:
            result = spawn_data_analyst(company_id, task, effort=ceo_state._current_effort)
            if sid:
                event_bus.push(make_subagent_end(sid, "DataAnalyst", (time.time() - t0) * 1000, str(result)))
            logger.info("data_analysis_request completed for task: '%s'", task)
            return result
        except Exception as e:
            if sid:
                event_bus.push(make_subagent_error(sid, "DataAnalyst", str(e)))
            raise

    @tool(
        "graphic_design_request",
        return_direct=True,
        description="Delegate branded visual assets and color-palette work to the Graphic Designer agent.",
    )
    def graphic_design_request(task: str):
        logger.info("graphic_design_request called: task='%s', company_id=%d, effort=%s", task, company_id, ceo_state._current_effort)
        sid = ceo_state._current_session_id
      
        if sid and not consume_resource(sid, "external_agents"):
            return json.dumps({"error": "external agents budget exhausted for this session."})
        if sid:
            event_bus.push(make_subagent_spawn(sid, "GraphicDesigner", task, ceo_state._current_effort))
        t0 = time.time()
        try:
            result = spawn_graphic_designer(company_id, task, effort=ceo_state._current_effort)
            if sid:
                event_bus.push(make_subagent_end(sid, "GraphicDesigner", (time.time() - t0) * 1000, str(result)))
            # return_direct=True skips on_tool_end — push it manually
            from agents.helpers.observability import _push_tool_end_manual
            _push_tool_end_manual(sid, "graphic_design_request", (time.time() - t0) * 1000, str(result)[:200])
            logger.info("graphic_design_request completed for task: '%s'", task)
            return result
        except Exception as e:
            if sid:
                event_bus.push(make_subagent_error(sid, "GraphicDesigner", str(e)))
            raise

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
