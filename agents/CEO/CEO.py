"""
The main CEO agent that intrects with user and asiges tasks to other agents.
"""
from agents.CEO.ceo_agent_tools import view_all_agents
from agents.helpers.choose_llm import Task, get_best_llm
from langchain.agents import create_agent
from agents.CEO.ceo_prompts import get_ceo_system_prompt

ceo_agent = create_agent(
    name="CEO Agent",
    system_prompt=get_ceo_system_prompt(),
    model=get_best_llm([Task.PLANNING, Task.WRITING]),
    tools=[view_all_agents],
)