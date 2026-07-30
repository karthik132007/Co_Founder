import json
from backend.db.redis_client import get_redis_client

_RESOURCE_TTL = 3600  # 1 hour TTL for session resource state

def _session_resource_key(session_id: str) -> str:
    return f"session_resources:{session_id}"


def _get_resources(effort:str)-> dict:

    if effort=="flash":
            
        return {
            "max_external_agents" : 1,
            "max_web_searches" : 2,
            "max_rag_calls" : 1,
            "max_mcqs" : 1
        }
    elif effort=="mid":
        return {
            "max_external_agents" : 2,
            "max_web_searches" : 3,
            "max_rag_calls" : 3,
            "max_mcqs" : 2
        }
    return {
            "max_external_agents" : 5,
            "max_web_searches" : 4,
            "max_rag_calls" : 5,
            "max_mcqs" : 3
        }


def init_session_resources(session_id: str, effort: str) -> dict:
    """Initialize resource counters for a session. Called once at session start."""
    redis_client = get_redis_client()
    limits = _get_resources(effort)

    state = {
        "effort": effort,
        "limits": limits,
        "consumed": {
            "external_agents": 0,
            "web_searches": 0,
            "rag_calls": 0,
            "mcqs": 0,
        },
    }
    redis_client.setex(_session_resource_key(session_id), _RESOURCE_TTL, json.dumps(state))
    return state


def get_session_resources(session_id: str) -> dict | None:
    """Get current resource state for a session."""
    redis_client = get_redis_client()
    raw = redis_client.get(_session_resource_key(session_id))
    if raw is None:
        return None
    return json.loads(raw)


def consume_resource(session_id: str, resource: str) -> bool:
    """Try to consume one unit of a resource. Returns True if successful, False if exhausted.

    resource must be one of: 'external_agents', 'web_searches', 'rag_calls', 'mcqs'
    """
    redis_client = get_redis_client()
    state = get_session_resources(session_id)
    if state is None:
        return False  # No session state — shouldn't happen

    current = state["consumed"].get(resource, 0)
    limit = state["limits"].get(f"max_{resource}")
    if limit is None:
        return True  # No limit for this resource

    if current >= limit:
        return False  # Exhausted

    state["consumed"][resource] = current + 1
    redis_client.setex(_session_resource_key(session_id), _RESOURCE_TTL, json.dumps(state))
    return True


def format_resources_for_prompt(session_id: str) -> str:
    """Build a concise system message showing remaining resources."""
    state = get_session_resources(session_id)
    if state is None:
        return ""

    limits = state["limits"]
    consumed = state["consumed"]

    remaining = {
        "external_agents": limits["max_external_agents"] - consumed["external_agents"],
        "web_searches": limits["max_web_searches"] - consumed["web_searches"],
        "rag_calls": limits["max_rag_calls"] - consumed["rag_calls"],
        "mcqs": limits["max_mcqs"] - consumed["mcqs"],
    }

    return (
        f"SESSION RESOURCE BUDGET (effort: {state['effort']}):\n"
        f"  - External agents remaining: {remaining['external_agents']}/{limits['max_external_agents']}\n"
        f"  - Web searches remaining:   {remaining['web_searches']}/{limits['max_web_searches']}\n"
        f"  - RAG/knowledge calls remaining: {remaining['rag_calls']}/{limits['max_rag_calls']}\n"
        f"  - MCQs remaining:           {remaining['mcqs']}/{limits['max_mcqs']}\n\n"
        f"IMPORTANT: Do NOT exceed these limits. Once a resource hits 0, you MUST NOT call that tool again."
    )