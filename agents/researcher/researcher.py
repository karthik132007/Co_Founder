import json
import logging

from agents.researcher.researcher_agent_tools import get_current_date
from agents.helpers.choose_llm import get_best_llm, Task
from langchain.agents import create_agent
from langchain.tools import tool
from agents.helpers.utils import _get_tavily_client
from agents.researcher.researcher_propmts import get_researcher_system_prompt, get_researcher_reflection_prompt
from agents.judge.llm_as_judge import judge_output_to_researcher

logger = logging.getLogger(__name__)


class WebSearchBudgetExhausted(Exception):
    """Raised to end a research run once its CEO session budget is spent."""


def _extract_content(response):
    content = response["messages"][-1].content
    return content


def _run_research_agent(agent, prompt: str):
    logger.info("Running research agent with prompt: %.100s", prompt)
    response = agent.invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": prompt,
                }
            ]
        }
    )
    result = _extract_content(response)
    logger.info("Research agent completed successfully")
    return result


def _build_researcher_agent(effort: str = "flash", session_id: str = ""):
    """Build a researcher agent with budget-aware web search."""
    from agents.CEO.ceo_resources import consume_resource

    @tool('search_web', return_direct=True,
          description="Search the web for a given query and return a list of results.")
    def search_web(query: str, max_results: int = 5) -> list:
        """Search the web for a given query and return a list of results."""
        if session_id and not consume_resource(session_id, "web_searches"):
            logger.warning("Web search budget exhausted for session_id=%s", session_id)
            # Returning an error ToolMessage makes some models repeatedly try
            # search_web.  End this research pass instead of wasting model
            # turns after the shared CEO budget is exhausted.
            raise WebSearchBudgetExhausted("Web search budget exhausted")
        logger.info("search_web called: query='%s', max_results=%d", query, max_results)
        client = _get_tavily_client()
        response = client.search(query=query, max_results=max_results, timeout=20)
        if isinstance(response, dict):
            results = response.get("results", [])
            logger.info("search_web returned %d results (dict format)", len(results))
            return results
        logger.info("search_web returned %d results (object format)", len(response.results))
        return response.results

    return create_agent(
        name="researcher",
        system_prompt=get_researcher_system_prompt(),
        model=get_best_llm([Task.RESEARCH, Task.WRITING], effort=effort),
        tools=[search_web, get_current_date],
    )


def spawn_researcher(prompt_from_CEO: str, max_reflections: int = 1, pass_score: int = 7,
                     effort: str = "flash", session_id: str = ""):
    """
    Execute a research task assigned by the CEO agent.
    Returns the research findings as markdown.
    
    effort: "flash" → 0 reflections, "mid" → 1 reflection, "max" → 2 reflections
    session_id: if provided, web_search calls share the Redis budget with the CEO
    """
    if effort == "flash":
        max_reflections = 0
    elif effort == "mid":
        max_reflections = 1
    else:  # max
        max_reflections = 2
    logger.info("spawn_researcher called: max_reflections=%d, pass_score=%d, effort=%s, session_id=%s",
                max_reflections, pass_score, effort, session_id[:8] if session_id else "none")

    agent = _build_researcher_agent(effort=effort, session_id=session_id)

    try:
        draft = _run_research_agent(agent, prompt_from_CEO)
        for i in range(max_reflections):
            logger.info("Reflection iteration %d/%d", i + 1, max_reflections)
            judgement = judge_output_to_researcher(model="openai/gpt-oss-120b", v1=draft, task=prompt_from_CEO)
            if not judgement:
                logger.warning("Judge returned no output, stopping reflections")
                break
            try:
                judgement_json = json.loads(judgement)
            except json.decoder.JSONDecodeError as e:
                logger.warning("Failed to parse judge JSON: %s", e)
                break
            score = judgement_json.get("score", 0)
            critique = judgement_json.get("critique", "")
            suggestions = judgement_json.get("suggestions", "")
            logger.info("Research score: %d/%d", score, pass_score)
            if score >= pass_score:
                logger.info("Score %d meets pass threshold %d, stopping reflections", score, pass_score)
                break
            reflection_prompt = get_researcher_reflection_prompt(prompt_from_CEO, draft, critique, suggestions)
            # Rebuild agent for reflection — budget may have changed
            agent = _build_researcher_agent(effort=effort, session_id=session_id)
            draft = _run_research_agent(agent, reflection_prompt)
        logger.info("Research task completed successfully")
        return draft
    except WebSearchBudgetExhausted:
        logger.info("Research task stopped because the CEO web-search budget is exhausted")
        return "Research stopped: the session web-search budget was exhausted."
    except Exception as e:
        logger.error("Research task failed: %s", e, exc_info=True)
        return f"Research task failed!, cause: {e}"


# def _do_research_v1(prompt: str) -> str:
#     pass
