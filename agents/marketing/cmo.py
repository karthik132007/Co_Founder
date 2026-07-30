import logging

from langchain.agents import create_agent
from langchain.tools import tool
import dotenv
from agents.helpers.choose_llm import get_best_llm, Task
from agents.marketing.cmo_prompts import get_cmo_system_prompt
from backend.db.get_from_sql import get_company_data

logger = logging.getLogger(__name__)

dotenv.load_dotenv()

# Keep non-search tools from the shared module
from agents.marketing.cmo_tools import extract_content_from_webpage, get_current_date


def _get_cmo_agent(company_id, effort: str = "flash", session_id: str = ""):
    logger.info("Creating CMO agent for company_id=%d, effort=%s", company_id, effort)

    from agents.CEO.ceo_resources import consume_resource
    from agents.helpers.utils import _get_tavily_client
    from agents.helpers.serp_helpers import search_google_trends, search_google_news, search_google_shopping

    @tool('search_current_market_trends',
          description="Super search the google trends,news,shopping for a given query and return a list of results.")
    def search_current_market_trends(query: str):
        """Search google trends, news, shopping trends, shopping news"""
        if session_id and not consume_resource(session_id, "web_searches"):
            logger.warning("Web search budget exhausted for CMO session_id=%s", session_id)
            return {"error": "Web search budget exhausted — synthesize from what you already have."}
        logger.info("search_current_market_trends called: query='%s'", query)
        trends = search_google_trends(query)
        news = search_google_news(query)
        shopping = search_google_shopping(query)
        logger.info("Market trends search completed: %d trends, %d news, %d shopping items",
                    len(trends), len(news), len(shopping))
        return {
            "trends": trends,
            "news": news,
            "shopping": shopping
        }

    @tool('search_web', description="Search the web for a given query and return a list of results.")
    def search_web(query: str, max_results: int = 5) -> list:
        """Search the web for a given query and return a list of results."""
        if session_id and not consume_resource(session_id, "web_searches"):
            logger.warning("Web search budget exhausted for CMO session_id=%s", session_id)
            return [{"error": "Web search budget exhausted — synthesize from what you already have."}]
        logger.info("search_web called: query='%s', max_results=%d", query, max_results)
        client = _get_tavily_client()
        response = client.search(query=query, max_results=max_results, timeout=20)
        if isinstance(response, dict):
            results = response.get("results", [])
            logger.info("search_web returned %d results (dict format)", len(results))
            return results
        logger.info("search_web returned %d results (object format)", len(response.results))
        return response.results

    company_data = get_company_data(company_id)
    if not company_data:
        logger.error("No company data found for company_id=%d", company_id)
    cmo_agent = create_agent(
        name="CMO",
        system_prompt=get_cmo_system_prompt(company_data),
        model=get_best_llm([Task.RESEARCH, Task.CREATIVE, Task.PLANNING], effort=effort),
        tools=[search_current_market_trends, search_web, extract_content_from_webpage, get_current_date],
    )
    logger.info("CMO agent created for company_id=%d", company_id)
    return cmo_agent


def _extract_content(response):
    content = response["messages"][-1].content
    return content


def spawn_cmo(company_id: int, message: str, effort: str = "flash", session_id: str = ""):
    logger.info("spawn_cmo called: company_id=%d, message='%.100s', effort=%s, session_id=%s",
                company_id, message, effort, session_id[:8] if session_id else "none")
    cmo_agent = _get_cmo_agent(company_id, effort=effort, session_id=session_id)
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
    logger.info("CMO agent completed for company_id=%d", company_id)
    return result