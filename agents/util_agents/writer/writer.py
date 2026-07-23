"""
The writer agent that handles writing tasks, based on given context.
"""
import json
import logging

from langchain.agents import create_agent
from agents.util_agents.writer.writer_prompts import get_writer_system_prompt, get_writer_reflection_prompt
from agents.helpers.choose_llm import get_best_llm,Task
from agents.judge.llm_as_judge import judge_output_to_writer

logger = logging.getLogger(__name__)

logger.info("Creating writer agent")
writer_agent = create_agent(
    name="writer",
    model=get_best_llm([Task.WRITING]),
    system_prompt=get_writer_system_prompt(),
)
logger.info("Writer agent created")

def _extract_content(response):
    content = response["messages"][-1].content
    return content


def _run_writer_agent(prompt:str):
    logger.info("Running writer agent with prompt: %.100s", prompt)
    response=writer_agent.invoke(
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
    logger.info("Writer agent completed successfully")
    return result

def spawn_writer(prompt_from_CEO: str,max_reflections:int =2,pass_score:int=8):
    logger.info("spawn_writer called: max_reflections=%d, pass_score=%d", max_reflections, pass_score)

    try:
        draft = _run_writer_agent(prompt_from_CEO)
        for i in range(max_reflections):
            logger.info("Reflection iteration %d/%d", i + 1, max_reflections)
            judgement = judge_output_to_writer(
                model="openai/gpt-oss-120b",
                v1=draft,
                task=prompt_from_CEO
            )
            try:
                judgement_json = json.loads(judgement)
            except json.decoder.JSONDecodeError as e:
                logger.warning("Failed to parse judge JSON: %s", e)
                break
            score = judgement_json.get("score", 0)
            critique = judgement_json.get("critique", "")
            suggestions = judgement_json.get("suggestions", "")
            logger.info("Writer score: %d/%d", score, pass_score)
            if score >= pass_score:
                logger.info("Score %d meets pass threshold %d, stopping reflections", score, pass_score)
                break
            reflection_prompt = get_writer_reflection_prompt(prompt_from_CEO,draft,critique,suggestions)
            draft = _run_writer_agent(reflection_prompt)
        logger.info("Writer task completed successfully")
        return draft

    except Exception as e:
        logger.error("Writing task failed: %s", e, exc_info=True)
        return f"Writting failed!, cause: {e}"