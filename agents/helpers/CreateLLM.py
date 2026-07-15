"""
creates openrouter llm instance and returns it
"""
import os

from dotenv import load_dotenv
from langchain_openrouter import ChatOpenRouter
load_dotenv()

def create_llm(model: str,temperature:float = 1):
    api_key = os.getenv("LLM_API_KEY")
    return ChatOpenRouter(
        model=model,
        temperature=temperature,
        api_key=api_key,
    )