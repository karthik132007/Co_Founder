import logging
import os
import hashlib
from dotenv import load_dotenv
from openrouter import OpenRouter
import json
logger = logging.getLogger(__name__)

load_dotenv()

api_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("LLM_API_KEY")
if not api_key:
    raise RuntimeError("Missing OPENROUTER_API_KEY or LLM_API_KEY")

client = OpenRouter(api_key=api_key)
model = "openai/text-embedding-3-small"
_EMBEDDING_CACHE_TTL = 3600
def _get_redis():
    try:
        from backend.db.redis_client import get_redis_client
        return get_redis_client()
    except Exception:
        return None

def generate_embeddings(text: str, cache: bool = True):
    """Generate an embedding for text, optionally caching it in Redis.

    Args:
        text: The input text to embed.
        cache: When True (default), read/write embeddings in Redis. Pass
            ``False`` for throwaway embeddings (e.g. SemanticChunker's internal
            breakpoint-detection embeddings) to avoid polluting the cache —
            one upload can otherwise write ~80 throwaway keys to Redis.
    """
    logger.debug("Generating embedding for text of length %d", len(text) if text else 0)
    if not text or not text.strip():
        logger.error("Empty text provided to generate_embeddings")
        raise ValueError("Input text cannot be empty or whitespace.")
    
    text_hash = hashlib.sha256(text.encode("utf-8")).hexdigest()
    cache_key = f"embedding:{text_hash}"
    redis_client = _get_redis() if cache else None

    if redis_client:
        try:
            cached = redis_client.get(cache_key)
            if cached:
                logger.info("Redis HIT for embedding hash=%s", text_hash[:12])
                return json.loads(cached)
        except Exception:
            logger.info("Redis MISS for embedding hash=%s", text_hash[:12])
    try:
        response = client.embeddings.generate(
            input=text,
            model=model,
        )
        embedding = response.data[0].embedding
        logger.debug("Embedding generated successfully, dimension=%d", len(embedding))
        
    except Exception as exc:
        logger.error("Embedding generation failed: %s", exc)
        raise
    if redis_client:
        try:
            redis_client.setex(cache_key, _EMBEDDING_CACHE_TTL, json.dumps(embedding))
            logger.info("Redis SET for embedding hash=%s", text_hash[:12])
        except Exception:
            logger.info("Redis write failed for embedding hash=%s", text_hash[:12])

    return embedding
