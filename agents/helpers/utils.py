import os
import base64
def _get_tavily_client():
    try:
        from tavily import TavilyClient
    except ImportError as exc:
        raise RuntimeError("tavily is not installed") from exc

    api_key = os.getenv("TAVILY_API_KEY")
    if not api_key:
        raise RuntimeError("TAVILY_API_KEY is not set")

    return TavilyClient(api_key=api_key)

def img_to_base64(img_file):
    with open(img_file, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")