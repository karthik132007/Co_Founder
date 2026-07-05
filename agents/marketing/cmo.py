from langchain.agents import create_agent
import dotenv
from agents.helpers.choose_llm import get_best_llm,Task
from agents.marketing.cmo_prompts import get_cmo_system_prompt
from backend.db.get_from_sql import get_company_data
dotenv.load_dotenv()

from agents.marketing.cmo_tools import super_search, search_web, extract_content_from_webpage
tools=[super_search, search_web, extract_content_from_webpage]

def _get_cmo_agent(company_id):
    company_data = get_company_data(company_id)
    cmo_agent=create_agent(
        name="CMO",
        system_prompt=get_cmo_system_prompt(company_data),
        model=get_best_llm([Task.RESEARCH,Task.WRITING,Task.CREATIVE,Task.PLANNING]),
        tools=tools,
    )
    return cmo_agent
