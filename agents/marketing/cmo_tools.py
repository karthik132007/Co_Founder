import logging
from datetime import datetime

from langchain.tools import tool
from requests.exceptions import HTTPError

from agents.helpers.serp_helpers import *
from agents.helpers.utils import _get_tavily_client

logger = logging.getLogger(__name__)


@tool('search_current_market_trends', description="Super search the google trends,news,shopping for a given query and return a list of results.")
def search_current_market_trends(query:str):
    """
    Search google trends, news, shopping trends, shopping news
    """
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

@tool('extract_content_from_webpages', description="Extract content from webpage.")
def extract_content_from_webpage(urls):
    client = _get_tavily_client()
    normalized_urls = urls if isinstance(urls, list) else [urls]
    normalized_urls = [url for url in normalized_urls if isinstance(url, str) and url.strip()]
    if not normalized_urls:
        logger.warning("No valid URLs provided for extraction")
        return {"error": "No valid URLs provided for extraction."}

    logger.info("extract_content_from_webpage called with %d URLs", len(normalized_urls))
    try:
        response = client.extract(urls=normalized_urls, extract_depth="advanced")
        logger.info("Content extraction completed for %d URLs", len(normalized_urls))
    except HTTPError as e:
        logger.error("Failed to extract content from URLs: %s", e)
        return {"error": f"Failed to extract content from URLs: {e}"}

    if isinstance(response, dict):
        results = response.get("results", [])
        logger.info("Extraction returned %d results (dict format)", len(results))
        return results
    logger.info("Extraction returned %d results (object format)", len(response.results))
    return response.results

@tool('get_current_date', description="Return current date in YYYY-MM-DD format.")

def get_current_date():
    """
    Return current date  in YYYY-MM-DD format.
    """
    date_str = datetime.now().strftime("%Y-%m-%d")
    return date_str