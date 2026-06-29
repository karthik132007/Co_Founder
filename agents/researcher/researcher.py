from agents.researcher.researcher_agent_tools import search_web,get_current_date
from helpers.choose_llm import get_best_llm,Task
from langchain.agents import create_agent
from agents.researcher.researcher_propmts import get_researcher_system_prompt
tools = [search_web,get_current_date]

researcher_agent=create_agent(
    name="researcher",
    description="Do research on given topic using provided tools",
    system_prompt=get_researcher_system_prompt(),
    model=get_best_llm([Task.RESEARCH,Task.WRITING]),
    tools=tools,
    verbose=True
)


def do_research(prompt_from_CEO: str) -> str:
    """
    Execute a research task assigned by the CEO agent.
    Returns the research findings as markdown.
    """
    try:
        response = researcher_agent.invoke(
            {
                "messages": [
                    {
                        "role": "user",
                        "content": prompt_from_CEO,
                    }
                ]
            }
        )
        return response["messages"][-1].content
    except Exception as e:
        return f"Research failed!, cause: {e}"

def _do_research_v1(prompt: str) -> str:
    pass