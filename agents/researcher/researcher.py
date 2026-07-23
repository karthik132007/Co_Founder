import json
import logging

from agents.researcher.researcher_agent_tools import search_web,get_current_date
from agents.helpers.choose_llm import get_best_llm,Task
from langchain.agents import create_agent
from agents.researcher.researcher_propmts import get_researcher_system_prompt,get_researcher_reflection_prompt
from agents.judge.llm_as_judge import judge_output_to_researcher

logger = logging.getLogger(__name__)

tools = [search_web,get_current_date]

logger.info("Creating researcher agent")
researcher_agent=create_agent(
    name="researcher",
    system_prompt=get_researcher_system_prompt(),
    model=get_best_llm([Task.RESEARCH,Task.WRITING]),
    tools=tools,
)
logger.info("Researcher agent created")

def _extract_content(response):
    content = response["messages"][-1].content
    return content

def _run_research_agent(prompt: str):
    logger.info("Running research agent with prompt: %.100s", prompt)
    response= researcher_agent.invoke(
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

def spawn_researcher(prompt_from_CEO:str,max_reflections:int = 1,pass_score:int = 7) :
    """
    Execute a research task assigned by the CEO agent.
    Returns the research findings as markdown.
    """
    logger.info("spawn_researcher called: max_reflections=%d, pass_score=%d", max_reflections, pass_score)
    try:
        draft = _run_research_agent(prompt_from_CEO)
        for i in range(max_reflections):
            logger.info("Reflection iteration %d/%d", i + 1, max_reflections)
            judgement = judge_output_to_researcher(model="openai/gpt-oss-120b", v1=draft, task=prompt_from_CEO)
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
            reflection_prompt = get_researcher_reflection_prompt(prompt_from_CEO,draft,critique,suggestions)
            draft = _run_research_agent(reflection_prompt)
        logger.info("Research task completed successfully")
        return draft
    except Exception as e:
        logger.error("Research task failed: %s", e, exc_info=True)
        return f"Research task failed!, cause: {e}"


# def _do_research_v1(prompt: str) -> str:
#     pass