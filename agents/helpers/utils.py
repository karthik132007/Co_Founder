import logging
import os
import base64

logger = logging.getLogger(__name__)


def _get_tavily_client():
    try:
        from tavily import TavilyClient
    except ImportError as exc:
        logger.error("tavily package is not installed")
        raise RuntimeError("tavily is not installed") from exc

    api_key = os.getenv("TAVILY_API_KEY")
    if not api_key:
        logger.error("TAVILY_API_KEY is not set")
        raise RuntimeError("TAVILY_API_KEY is not set")

    client = TavilyClient(api_key=api_key)
    return client

def img_to_base64(img_file):
    if isinstance(img_file, bytes):
        result = base64.b64encode(img_file).decode("utf-8")
        return result
    
    with open(img_file, "rb") as image_file:
        result = base64.b64encode(image_file.read()).decode("utf-8")
    return result