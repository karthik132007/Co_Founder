import datetime
import os

from langchain.tools import tool


def _get_tavily_client():
    try:
        from tavily import TavilyClient
    except ImportError as exc:
        raise RuntimeError("tavily is not installed") from exc

    api_key = os.getenv("TAVILY_API_KEY")
    if not api_key:
        raise RuntimeError("TAVILY_API_KEY is not set")

    return TavilyClient(api_key=api_key)


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

@tool('get_current_date', return_direct=True, description="Get the current date in YYYY-MM-DD format.")
def get_current_date() -> str:
    """
    Get the current date in YYYY-MM-DD format.
    """
    return datetime.datetime.now().strftime("%Y-%m-%d")
