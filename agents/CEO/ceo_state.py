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
import uuid
from typing import Any

from backend.db.redis_client import get_redis_client

_REQUEST_TTL = 300  # 5 minutes — covers the longest possible agent run

# The ONLY contextvar: a small opaque key, unique per request.
_request_key: contextvars.ContextVar[str] = contextvars.ContextVar(
    "ceo_request_key", default=""
)


# ── Public API ──────────────────────────────────────────────────────────────

def init_request_state(session_id: str, effort: str) -> str:
    """Store *session_id* and *effort* in Redis and return the request key.

    Called once at the start of ``talk_to_ceo``.
    """
    key = str(uuid.uuid4())
    payload = {"sid": session_id, "effort": effort}
    redis_client = get_redis_client()
    redis_client.setex(f"ceo_req:{key}", _REQUEST_TTL, json.dumps(payload))
    _request_key.set(key)
    return key


def get_session_id() -> str:
    """Return the session_id for the current request, or empty string."""
    state = _read_state()
    return state.get("sid", "") if state else ""


def get_effort() -> str:
    """Return the effort level for the current request, default 'flash'."""
    state = _read_state()
    return state.get("effort", "flash") if state else "flash"


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
