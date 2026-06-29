"""
creates openrouter llm instance and returns it
"""
from dotenv import load_dotenv
from langchain_openrouter import ChatOpenRouter
load_dotenv()

def create_llm(model: str,temperature:float = 1):
    return ChatOpenRouter(
        model=model,
        temperature=temperature,
    )