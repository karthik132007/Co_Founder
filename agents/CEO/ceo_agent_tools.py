from langchain.tools import tool
import json

@tool('view_all_agents', return_direct=True, description="View all available agents and their descriptions.")
def view_all_agents():
    """
    View all available agents and their descriptions.
    """
    with open('agents/agents.json', 'r') as f:
        agents = json.load(f)
    return agents
