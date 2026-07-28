"""
Redis client singleton for caching. Reads REDIS_URL from environment.
"""
import logging
import os

import redis

logger = logging.getLogger(__name__)

_client: redis.Redis | None = None


def get_redis_client() -> redis.Redis:
    global _client
    if _client is not None:
        return _client

    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    logger.info("Connecting to Redis at %s", redis_url)
    _client = redis.Redis.from_url(redis_url, decode_responses=True)
    # Quick health check
    _client.ping()
    logger.info("Redis connection established")
    return _client
