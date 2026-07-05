from langchain.agents import create_agent
import dotenv
from agents.helpers.choose_llm import get_best_llm,Task
from agents.marketing.cmo_prompts import get_cmo_system_prompt
from backend.db.get_from_sql import get_company_data
dotenv.load_dotenv()

from agents.marketing.cmo_tools import *
tools=[search_current_market_trends, search_web, extract_content_from_webpage, get_current_date]

def _get_cmo_agent(company_id):
    company_data = get_company_data(company_id)
    cmo_agent=create_agent(
        name="CMO",
        system_prompt=get_cmo_system_prompt(company_data),
        model=get_best_llm([Task.RESEARCH,Task.CREATIVE,Task.PLANNING]),
        tools=tools,
    )
    return cmo_agent

def _extract_content(response):
    return response["messages"][-1].content

def talk_to_cmo(company_id: int, message: str):
    cmo_agent=_get_cmo_agent(company_id)
    result = cmo_agent.invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": message,
                }
            ]
        }
    )
    return result