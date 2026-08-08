import json
from backend.db.redis_client import get_redis_client
from redis.exceptions import WatchError

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
    """Atomically consume one unit of a resource.

    LangGraph may execute multiple tool calls in parallel inside one agent turn,
    so a simple read-modify-write can otherwise let a session exceed its limit.
    Returns False when the budget is exhausted or Redis is unavailable.

    resource must be one of: 'external_agents', 'web_searches', 'rag_calls', 'mcqs'
    """
    redis_client = get_redis_client()
    key = _session_resource_key(session_id)
    for _ in range(5):
        pipeline = redis_client.pipeline()
        try:
            pipeline.watch(key)
            raw = pipeline.get(key)
            if raw is None:
                return False
            state = json.loads(raw)
            current = state["consumed"].get(resource, 0)
            limit = state["limits"].get(f"max_{resource}")
            if limit is None:
                return True
            if current >= limit:
                return False

            state["consumed"][resource] = current + 1
            pipeline.multi()
            pipeline.setex(key, _RESOURCE_TTL, json.dumps(state))
            pipeline.execute()
            return True
        except WatchError:
            # Another parallel tool updated this session; read the fresh value.
            continue
        except Exception:
            return False
        finally:
            pipeline.reset()
    return False


def format_resources_for_prompt(session_id: str) -> str:
    """Build a concise system message showing remaining resources."""
    state = get_session_resources(session_id)
    if state is None:
        return ""

    limits = state.get("limits", {})
    consumed = state.get("consumed", {})

    def _rem(key: str) -> int:
        return max(0, limits.get(key, 0) - consumed.get(key, 0))

    remaining = {
        "external_agents": _rem("max_external_agents"),
        "web_searches": _rem("max_web_searches"),
        "rag_calls": _rem("max_rag_calls"),
        "mcqs": _rem("max_mcqs"),
    }

    return (
        f"SESSION RESOURCE BUDGET (effort: {state.get('effort', 'flash')}):\n"
        f"  - External agents remaining: {remaining['external_agents']}/{limits.get('max_external_agents', 0)}\n"
        f"  - Web searches remaining:   {remaining['web_searches']}/{limits.get('max_web_searches', 0)}\n"
        f"  - RAG/knowledge calls remaining: {remaining['rag_calls']}/{limits.get('max_rag_calls', 0)}\n"
        f"  - MCQs remaining:           {remaining['mcqs']}/{limits.get('max_mcqs', 0)}\n\n"
        f"IMPORTANT: Do NOT exceed these limits. Once a resource hits 0, you MUST NOT call that tool again."
    )
