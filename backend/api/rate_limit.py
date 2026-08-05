"""Reusable sliding-window rate limiter for unauthenticated endpoints.

In-memory, per-process, keyed by client IP. When running behind a reverse
proxy, the `X-Forwarded-For` header is used so the real client IP is enforced
instead of the proxy's address.

Limits are enforced in-process only — scale out horizontally and pair with a
distributed limiter (e.g. Redis) if you run multiple app replicas.
"""
import logging
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request

logger = logging.getLogger(__name__)


class SlidingWindowRateLimiter:
    """Sliding-window limiter: at most `max_attempts` per `window_seconds` per IP."""

    def __init__(self, max_attempts: int, window_seconds: int):
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self._hits: defaultdict[str, deque[float]] = defaultdict(deque)

    @staticmethod
    def client_ip(request: Request) -> str:
        """Best-effort real client IP, honouring X-Forwarded-For behind a proxy."""
        fwd = request.headers.get("x-forwarded-for")
        if fwd:
            return fwd.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def is_limited(self, request: Request) -> bool:
        """Return True if the client has exceeded the budget in the window."""
        key = self.client_ip(request)
        now = time.monotonic()
        window = self._hits[key]
        # Drop hits older than the window.
        while window and now - window[0] > self.window_seconds:
            window.popleft()
        if len(window) >= self.max_attempts:
            return True
        window.append(now)
        return False

    def check(self, request: Request, detail: str = "Too many requests. Try again later.") -> None:
        """Raise HTTP 429 when the client is over budget."""
        if self.is_limited(request):
            logger.warning("Rate limit exceeded — ip=%s", self.client_ip(request))
            raise HTTPException(status_code=429, detail=detail)
