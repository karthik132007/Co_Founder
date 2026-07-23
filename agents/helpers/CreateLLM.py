"""
creates openrouter llm instance and returns it
"""
import logging
import os

from dotenv import load_dotenv
from langchain_openrouter import ChatOpenRouter

logger = logging.getLogger(__name__)

load_dotenv()

def create_llm(model: str,temperature:float = 1):
    logger.info("Creating LLM instance: model=%s, temperature=%s", model, temperature)
    api_key = os.getenv("LLM_API_KEY")
    if not api_key:
        logger.error("LLM_API_KEY not found in environment")
    llm = ChatOpenRouter(
        model=model,
        temperature=temperature,
        api_key=api_key,
    )
    return llm