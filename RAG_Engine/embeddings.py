import logging
import os

from dotenv import load_dotenv
from openrouter import OpenRouter

logger = logging.getLogger(__name__)

load_dotenv()

api_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("LLM_API_KEY")
if not api_key:
    raise RuntimeError("Missing OPENROUTER_API_KEY or LLM_API_KEY")

client = OpenRouter(api_key=api_key)
model = "openai/text-embedding-3-small"


def generate_embeddings(text: str):
    logger.debug("Generating embedding for text of length %d", len(text) if text else 0)
    if not text or not text.strip():
        logger.error("Empty text provided to generate_embeddings")
        raise ValueError("Input text cannot be empty or whitespace.")
    try:
        response = client.embeddings.generate(
            input=text,
            model=model,
        )
        embedding = response.data[0].embedding
        logger.debug("Embedding generated successfully, dimension=%d", len(embedding))
        return embedding
    except Exception as exc:
        logger.error("Embedding generation failed: %s", exc)
        raise
