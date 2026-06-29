import dotenv
from tavily import TavilyClient
import datetime
from langchain.tools import tool

dotenv.load_dotenv()

client = TavilyClient(api_key=dotenv.get("TAVILY_API_KEY"))


@tool('search_web', return_direct=True, description="Search the web for a given query and return a list of results.")
def search_web(query: str,max_results: int = 5) -> list:
    """
    Search the web for a given query and return a list of results.
    """
    response = client.search(query=query, max_results=max_results,timeout=20)
    return response.results

@tool('get_current_date', return_direct=True, description="Get the current date in YYYY-MM-DD format.")
def get_current_date() -> str:
    """
    Get the current date in YYYY-MM-DD format.
    """
    return datetime.datetime.now().strftime("%Y-%m-%d")
