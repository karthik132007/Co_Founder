import datetime
import logging

from langchain.tools import tool
from agents.helpers.utils import _get_tavily_client

logger = logging.getLogger(__name__)


@tool('search_web', return_direct=True, description="Search the web for a given query and return a list of results.")
def search_web(query: str,max_results: int = 5) -> list:
    """
    Search the web for a given query and return a list of results.
    """
    logger.info("search_web called: query='%s', max_results=%d", query, max_results)
    client = _get_tavily_client()
    response = client.search(query=query, max_results=max_results,timeout=20)
    if isinstance(response, dict):
        results = response.get("results", [])
        logger.info("search_web returned %d results (dict format)", len(results))
        return results

    logger.info("search_web returned %d results (object format)", len(response.results))
    return response.results

@tool('get_current_date', return_direct=True, description="Get the current date in YYYY-MM-DD format.")
def get_current_date() -> str:
    """
    Get the current date in YYYY-MM-DD format.
    """
    date_str = datetime.datetime.now().strftime("%Y-%m-%d")
    return date_str
