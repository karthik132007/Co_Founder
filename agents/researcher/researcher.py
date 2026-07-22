import json
from agents.researcher.researcher_agent_tools import search_web,get_current_date
from agents.helpers.choose_llm import get_best_llm,Task
from langchain.agents import create_agent
from agents.researcher.researcher_propmts import get_researcher_system_prompt,get_researcher_reflection_prompt
from agents.judge.llm_as_judge import judge_output_to_researcher
tools = [search_web,get_current_date]

researcher_agent=create_agent(
    name="researcher",
    system_prompt=get_researcher_system_prompt(),
    model=get_best_llm([Task.RESEARCH,Task.WRITING]),
    tools=tools,
)

def _extract_content(response):
    return response["messages"][-1].content

def _run_research_agent(prompt: str):
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
    return _extract_content(response)

def spawn_researcher(prompt_from_CEO:str,max_reflections:int = 1,pass_score:int = 7) :
    """
    Execute a research task assigned by the CEO agent.
    Returns the research findings as markdown.
    """
    try:
        draft = _run_research_agent(prompt_from_CEO)
        for _ in range(max_reflections):
            judgement = judge_output_to_researcher(model="openai/gpt-oss-120b", v1=draft, task=prompt_from_CEO)
            try:
                judgement_json = json.loads(judgement)
            except json.decoder.JSONDecodeError:
                break
            score = judgement_json.get("score", 0)
            critique = judgement_json.get("critique", "")
            suggestions = judgement_json.get("suggestions", "")
            if score >= pass_score:
                break
            reflection_prompt = get_researcher_reflection_prompt(prompt_from_CEO,draft,critique,suggestions)
            draft = _run_research_agent(reflection_prompt)
        return draft
    except Exception as e:
        return f"Research task failed!, cause: {e}"


# def _do_research_v1(prompt: str) -> str:
#     pass