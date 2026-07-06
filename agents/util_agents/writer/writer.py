"""
The writer agent that handles writing tasks, based on given context.
"""
import json
from langchain.agents import create_agent
from agents.util_agents.writer.writer_prompts import get_writer_system_prompt, get_writer_reflection_prompt
from agents.helpers.choose_llm import get_best_llm,Task
from agents.judge.llm_as_judge import judge_output_to_writer
writer_agent = create_agent(
    name="writer",
    model=get_best_llm([Task.WRITING]),
    system_prompt=get_writer_system_prompt(),
)

def _extract_content(response):
    return response["messages"][-1].content


def _run_writer_agent(prompt:str):
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
    return _extract_content(response)
def write(prompt_from_CEO: str,max_reflections:int =2,pass_score:int=8):

    try:
        draft = _run_writer_agent(prompt_from_CEO)
        for _ in range(max_reflections):
            judgement = judge_output_to_writer(
                model="openai/gpt-oss-120b",
                v1=draft,
                task=prompt_from_CEO
            )
            try:
                judgement_json = json.loads(judgement)
            except json.decoder.JSONDecodeError:
                break
            score = judgement_json.get("score", 0)
            critique = judgement_json.get("critique", "")
            suggestions = judgement_json.get("suggestions", "")
            if score >= pass_score:
                break
            reflection_prompt = get_writer_reflection_prompt(prompt_from_CEO,draft,critique,suggestions)
            draft = _run_writer_agent(reflection_prompt)
        return draft

    except Exception as e:
        return f"Writting failed!, cause: {e}"