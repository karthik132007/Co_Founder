"""Tweak: tight_budget — reduce the CEO's resource budgets (Redis-backed).

This tweak does two things:
1. TWEAK — injects a frugality prompt so the CEO conserves tool calls.
2. TIGHT_BUDGETS + apply_tight_budget() — lowers the ACTUAL session limits in
   Redis, so consume_resource() enforces the tighter numbers at runtime.

Tight limits per effort (reduced vs. agents/CEO/ceo_resources.py defaults):
  flash: 1 external agent, 1 web search, 1 RAG call, 0 MCQs
  mid:   2 / 2 / 2 / 2
  max:   3 / 3 / 3 / 3
"""
import json

from backend.db.redis_client import get_redis_client

_RESOURCE_TTL = 3600  # matches agents/CEO/ceo_resources.py


def _key(session_id: str) -> str:
    return f"session_resources:{session_id}"


TIGHT_BUDGETS = {
    "flash": {
        "max_external_agents": 1,
        "max_web_searches": 1,
        "max_rag_calls": 1,
        "max_mcqs": 0,
    },
    "mid": {
        "max_external_agents": 2,
        "max_web_searches": 2,
        "max_rag_calls": 2,
        "max_mcqs": 2,
    },
    "max": {
        "max_external_agents": 3,
        "max_web_searches": 3,
        "max_rag_calls": 3,
        "max_mcqs": 3,
    },
}

TWEAK = """
You are operating under a TIGHT resource budget.
Conserve every tool call:
- Use the cheapest/simplest tool that answers the question.
- Never call a tool you don't strictly need.
- Prefer knowledge_request over expensive specialist agents when it suffices.
- If a resource hits 0, STOP using that tool entirely — do not retry.
- Answer directly whenever you safely can.
"""


def apply_tight_budget(session_id: str, effort: str = "flash") -> dict | None:
    """Overwrite a session's resource limits in Redis with the tight budget.

    Call AFTER init_session_resources(session_id, effort) so the tightened
    limits take effect. Returns the updated state, or None if the session
    does not exist yet.
    """
    if effort not in TIGHT_BUDGETS:
        effort = "flash"
    redis = get_redis_client()
    raw = redis.get(_key(session_id))
    if raw is None:
        return None
    state = json.loads(raw)
    state["limits"] = dict(TIGHT_BUDGETS[effort])
    redis.setex(_key(session_id), _RESOURCE_TTL, json.dumps(state))
    return state
