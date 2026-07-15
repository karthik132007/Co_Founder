import os

from dotenv import load_dotenv
from openrouter import OpenRouter

load_dotenv()

api_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("LLM_API_KEY")
if not api_key:
    raise RuntimeError("Missing OPENROUTER_API_KEY or LLM_API_KEY")

client = OpenRouter(api_key=api_key)
model = "openai/text-embedding-3-small"


def generate_embeddings(text: str):
    if not text or not text.strip():
        raise ValueError("Input text cannot be empty or whitespace.")
    response = client.embeddings.generate(
        input=text,
        model=model,
    )
    return response.data[0].embedding
