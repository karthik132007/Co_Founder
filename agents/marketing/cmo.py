from langchain.agents import create_agent
import dotenv
from helpers.choose_llm import get_best_llm,Task
from agents.marketing.cmo_prompts import get_cmo_system_prompt
dotenv.load_dotenv()

from agents.marketing.cmo_tools import super_search, search_web, extract_content_from_webpage
tools=[super_search, search_web, extract_content_from_webpage]

researcher_agent=create_agent(
    name="researcher",
    system_prompt=get_cmo_system_prompt("Your company context here"),
    model=get_best_llm([Task.RESEARCH,Task.WRITING,Task.CREATIVE,Task.PLANNING]),
    tools=tools,
)
