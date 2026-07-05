from langchain.tools import tool
from openai.types.responses import response_input_message_content_list

from agents.helpers.serp_helpers import *
from agents.helpers.utils import _get_tavily_client
@tool('super_search', return_direct=True, description="Super search the google trends,news,shopping for a given query and return a list of results.")
def super_search(query:str):
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

@tool('search_web', return_direct=True, description="Search the web for a given query and return a list of results.")
def search_web(query: str,max_results: int = 5) -> list:
    """
    Search the web for a given query and return a list of results.
    """
    client = _get_tavily_client()
    response = client.search(query=query, max_results=max_results,timeout=20)
    if isinstance(response, dict):
        return response.get("results", [])

    return response.results

@tool('extract_content_from_webpages', return_direct=True, description="Extract content from webpage.")
def extract_content_from_webpage(urls):
    client = _get_tavily_client()
    response = client.extract(urls=[urls],extract_depth="advanced")
    if isinstance(response, dict):
        return response.get("results", [])
    return response.results
