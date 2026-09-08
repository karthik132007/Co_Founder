# agents/CEO/ceo_state.py
"""Redis-backed per-request CEO state.  Fully thread-safe.

Every ``talk_to_ceo`` call generates a unique *request_key*, stores
``{sid, effort}`` in Redis under that key (5-min TTL), and sets the
key in a contextvar.  Tool functions read the contextvar to fetch
their request's state from Redis — no shared globals, no race condition.
"""

from __future__ import annotations

import contextvars
import json
import logging
import uuid
from typing import Any

from backend.db.redis_client import get_redis_client

logger = logging.getLogger(__name__)

_REQUEST_TTL = 300  # 5 minutes — covers the longest possible agent run

# The ONLY contextvar: a small opaque key, unique per request.
_request_key: contextvars.ContextVar[str] = contextvars.ContextVar(
    "ceo_request_key", default=""
)


_in_memory_usage: dict[str, dict] = {}


# ── Public API ──────────────────────────────────────────────────────────────

def init_request_state(session_id: str, effort: str) -> str:
    """Store *session_id* and *effort* in memory and Redis and return the request key.

    Called once at the start of ``talk_to_ceo``.
    """
    key = str(uuid.uuid4())
    payload = {"sid": session_id, "effort": effort}
    _request_key.set(key)
    _cached_request_state.set((key, payload))
    try:
        redis_client = get_redis_client()
        redis_client.setex(f"ceo_req:{key}", _REQUEST_TTL, json.dumps(payload))
    except Exception:
        logger.debug("Redis unavailable for init_request_state, using in-memory state")
    return key


def get_session_id() -> str:
    """Return the session_id for the current request, or empty string."""
    state = _read_state()
    return state.get("sid", "") if state else ""


def get_effort() -> str:
    """Return the effort level for the current request, default 'flash'."""
    state = _read_state()
    return state.get("effort", "flash") if state else "flash"


# ── Usage accounting ─────────────────────────────────────────────────────────
# talk_to_ceo records the per-model token usage for a session here, and
# main.chat pops it afterwards to queue the credit-management Kafka job.
_USAGE_TTL = 600  # 10 minutes


def record_usage(session_id: str, usage: dict) -> None:
    """Store the LLM usage breakdown for a session (best-effort)."""
    if not session_id:
        return
    _in_memory_usage[session_id] = usage
    try:
        get_redis_client().setex(
            f"ceo_usage:{session_id}", _USAGE_TTL, json.dumps(usage, default=str)
        )
    except Exception:
        logger.debug("Redis unavailable for record_usage, stored in memory for session_id=%s", session_id)


def pop_usage(session_id: str) -> dict | None:
    """Fetch and delete the recorded usage for a session (or None)."""
    if not session_id:
        return None
    key = f"ceo_usage:{session_id}"
    try:
        raw = get_redis_client().get(key)
        if raw:
            get_redis_client().delete(key)
            _in_memory_usage.pop(session_id, None)
            return json.loads(raw)
    except Exception:
        pass
    return _in_memory_usage.pop(session_id, None)


# ── Internal ────────────────────────────────────────────────────────────────

# The request key already lives in a ContextVar.  Its cache must as well:
# module globals would allow concurrent CEO requests to read one another's
# session state.
_cached_request_state: contextvars.ContextVar[tuple[str, dict[str, Any]] | None] = (
    contextvars.ContextVar("ceo_cached_request_state", default=None)
)


def _read_state() -> dict[str, Any] | None:
    """Read the current request's state from Redis (cached per-request)."""
    key = _request_key.get()
    if not key:
        return None
    cached = _cached_request_state.get()
    if cached and cached[0] == key:
        return cached[1]
    try:
        raw = get_redis_client().get(f"ceo_req:{key}")
        if raw:
            state = json.loads(raw)
            _cached_request_state.set((key, state))
            return state
    except Exception:
        pass
    return None


# ── Backwards-compatible aliases ────────────────────────────────────────────
# Tools use ``ceo_state._current_session_id`` / ``ceo_state._current_effort``.
# ``__getattr__`` on the module delegates these to the Redis-backed functions.

def __getattr__(name: str) -> object:
    if name == "_current_effort":
        return get_effort()
    if name == "_current_session_id":
        return get_session_id()
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
