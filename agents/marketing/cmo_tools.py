from datetime import datetime

from langchain.tools import tool
from requests.exceptions import HTTPError

from agents.helpers.serp_helpers import *
from agents.helpers.utils import _get_tavily_client
@tool('search_current_market_trends', description="Super search the google trends,news,shopping for a given query and return a list of results.")
def search_current_market_trends(query:str):
    """
    Search google trends, news, shopping trends, shopping news
    """
    trends = search_google_trends(query)
    news = search_google_news(query)
    shopping = search_google_shopping(query)
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
    client = _get_tavily_client()
    response = client.search(query=query, max_results=max_results,timeout=20)
    if isinstance(response, dict):
        return response.get("results", [])

    return response.results

@tool('extract_content_from_webpages', description="Extract content from webpage.")
def extract_content_from_webpage(urls):
    client = _get_tavily_client()
    normalized_urls = urls if isinstance(urls, list) else [urls]
    normalized_urls = [url for url in normalized_urls if isinstance(url, str) and url.strip()]
    if not normalized_urls:
        return {"error": "No valid URLs provided for extraction."}

    try:
        response = client.extract(urls=normalized_urls, extract_depth="advanced")
    except HTTPError as e:
        return {"error": f"Failed to extract content from URLs: {e}"}

    if isinstance(response, dict):
        return response.get("results", [])
    return response.results

@tool('get_current_date', description="Return current date in YYYY-MM-DD format.")

def get_current_date():
    """
    Return current date  in YYYY-MM-DD format.
    """
    return datetime.now().strftime("%Y-%m-%d")