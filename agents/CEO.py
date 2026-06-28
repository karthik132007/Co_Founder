"""
The main CEO agent that intrects with user and asiges tasks to other agents.
"""
from agents.helpers.ceo_agent_tools import view_all_agents
from helpers.choose_llm import Task, get_best_llm
from langchain.agents import create_agent
from prompts.ceo_prompts import get_ceo_system_prompt

ceo_agent = create_agent(
    name="CEO Agent",
    description="The CEO agent is responsible for managing the overall operations of the organization. It interacts with the user, assigns tasks to other agents, and ensures that the organization is running smoothly.",
    system_prompt=get_ceo_system_prompt(),
    model=get_best_llm([Task.PLANNING, Task.RESEARCH, Task.WRITING]),
    tools=[view_all_agents],
    verbose=True,
)