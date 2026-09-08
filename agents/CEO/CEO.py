"""
The main CEO agent that interacts with the user and delegates work to specialist agents.
"""
from collections.abc import Mapping
import json
import logging
import time
from agents.CEO import ceo_state
from pathlib import Path

from langchain.agents import create_agent

from agents.CEO.ceo_resources import get_session_resources,init_session_resources,format_resources_for_prompt,consume_resource
logger = logging.getLogger(__name__)

from agents.CEO.ceo_agent_tools import _build_ceo_tools
from agents.helpers.choose_llm import Task, get_best_llm
from agents.CEO.ceo_prompts import get_ceo_system_prompt,get_ceo_system_prompt_flash
from backend.db.get_from_sql import get_company_data

from RAG_Engine.chat_memory import get_chat_memories_by_query

from agents.CEO.ceo_agent_tools import _build_user_message_with_memories,_build_ceo_tools
def _extract_content(response):
    if not response or not isinstance(response, Mapping):
        return ""
    messages = response.get("messages", [])
    if not messages:
        return ""
    last_msg = messages[-1]
    content = getattr(last_msg, "content", "")
    if not isinstance(content, str):
        content = str(content or "")

    reasoning = ""
    if hasattr(last_msg, "additional_kwargs") and isinstance(last_msg.additional_kwargs, dict):
        reasoning = last_msg.additional_kwargs.get("reasoning_content") or last_msg.additional_kwargs.get("reasoning") or ""
    if not reasoning and hasattr(last_msg, "response_metadata") and isinstance(last_msg.response_metadata, dict):
        reasoning = last_msg.response_metadata.get("reasoning_content") or ""

    if reasoning and "<think>" not in content:
        content = f"<think>\n{reasoning}\n</think>\n\n{content}"

    return content


def _get_relevant_chat_memories(company_id: int, query: str, top_k: int = 5):
    logger.info("Fetching relevant chat memories for company_id=%d, top_k=%d", company_id, top_k)
    try:
        memories = get_chat_memories_by_query(
            company_id=company_id,
            query=query,
            match_count=top_k,
        )
        logger.info("Retrieved %d chat memories for company_id=%d", len(memories), company_id)
        return memories
    except Exception as e:
        logger.warning("Failed to fetch chat memories for company_id=%d: %s", company_id, e)
        return []



# ── In-memory agent cache ─────────────────────────────────────────────────
# LangChain agents can't be pickled (closure tools, live connections), so we
# keep them in a process-local dict.  company_data is cached in Redis separately.
_ceo_agent_cache: dict[tuple, object] = {}  # keyed by (company_id, effort)


def invalidate_ceo_agent_cache(company_id: int | None = None) -> int:
    """Remove cached CEO agent(s).  Pass a company_id to evict one; pass None to
    evict all.  Returns the number of entries removed."""
    if company_id is None:
        count = len(_ceo_agent_cache)
        _ceo_agent_cache.clear()
        logger.info("Cleared entire CEO agent cache (%d entries)", count)
        return count
    removed = 0
    for key in list(_ceo_agent_cache.keys()):
        if key[0] == company_id:
            del _ceo_agent_cache[key]
            removed += 1
    if removed:
        logger.info("Evicted %d CEO agent cache entries for company_id=%d", removed, company_id)
    return removed


def _get_ceo_agent(company_id: int, effort: str = "flash"):
    cache_key = (company_id, effort)
    cached = _ceo_agent_cache.get(cache_key)
    if cached is not None:
        logger.info("Using cached CEO agent for company_id=%d, effort=%s", company_id, effort)
        return cached

    logger.info("Building new CEO agent for company_id=%d, effort=%s", company_id, effort)
    company_data = get_company_data(company_id)
    if not company_data:
        logger.error("No company found for company_id=%d", company_id)
        raise ValueError(f"No company found for company_id={company_id}")
    system_prompt = get_ceo_system_prompt(company_data)
    if effort=="flash":
        system_prompt = get_ceo_system_prompt_flash(company_data)

    ceo_agent = create_agent(
        name="CEO Agent",
        system_prompt=system_prompt,
        model=get_best_llm([Task.PLANNING, Task.RESEARCH, Task.WRITING], effort=effort),
        tools=_build_ceo_tools(company_id),
    )
    _ceo_agent_cache[cache_key] = ceo_agent
    logger.info("CEO agent built + cached for company_id=%d, effort=%s", company_id, effort)
    return ceo_agent


# ── Streaming invocation ──────────────────────────────────────────────────
# We use LangChain's ``agent.stream()`` (LangGraph) instead of ``invoke()`` so
# the CEO's LLM output is streamed to the WebSocket in real time.  With
# ``stream_mode=["messages", "updates"]``:
#   * "messages"  → (message_chunk, metadata) — token-level deltas we batch
#                   into ``llm_token`` events for the frontend.
#   * "updates"   → {node: {messages: [...]}} — per-node new messages, which
#                   we accumulate to reconstruct the full final result
#                   (tool messages included, needed for image payloads).
# Tool lifecycle events (tool_start/tool_end/subagent_*) still fire through
# the ObservabilityCallback, so the trace panel gets them live.

_TOKEN_BATCH_SIZE = 2        # push a WS event every N streamed tokens (low-latency streaming)
_TOKEN_FLUSH_SECONDS = 0.03   # or at least every ~30ms


def _invoke_agent(agent, messages: list[dict], session_id: str = "", invoke_config: dict | None = None):
    """Run the CEO agent, streaming tool events + LLM tokens to the WS.

    Returns the full result dict (``{"messages": [...]}``) like ``invoke``,
    reconstructed from the stream so the rest of ``talk_to_ceo`` is unchanged.
    """
    from langchain_core.messages import AIMessageChunk
    from backend.api.connection_manager import event_bus
    from backend.api.observability_events import make_llm_token

    # No observability target (evals / CLI) — plain invoke keeps behavior
    # identical and avoids the overhead of reconstructing state from a stream.
    if not session_id:
        return agent.invoke(
            {"messages": messages},
            config=invoke_config if invoke_config else None,
        )

    final_messages: list = []
    token_buffer: list[str] = []
    last_flush = time.time()

    def flush_tokens() -> None:
        nonlocal token_buffer, last_flush
        if not token_buffer:
            return
        text = "".join(token_buffer)
        token_buffer = []
        last_flush = time.time()
        try:
            event_bus.push(make_llm_token(session_id, text, agent="CEO"))
        except Exception:
            logger.exception("Failed to push llm_token event for session_id=%s", session_id)

    config = dict(invoke_config or {})
    in_think_block = False
    try:
        for mode, data in agent.stream(
            {"messages": messages},
            config=config,
            stream_mode=["messages", "updates"],
        ):
            if mode == "messages":
                chunk, _meta = data
                if isinstance(chunk, AIMessageChunk):
                    text_delta = ""
                    if isinstance(chunk.content, str):
                        text_delta = chunk.content
                    elif isinstance(chunk.content, list):
                        parts = []
                        for p in chunk.content:
                            if isinstance(p, dict) and p.get("type") == "text":
                                parts.append(p.get("text", ""))
                            elif isinstance(p, str):
                                parts.append(p)
                        text_delta = "".join(parts)

                    # Extract reasoning tokens (e.g. DeepSeek or reasoning models on OpenRouter)
                    is_reasoning_chunk = False
                    if not text_delta and hasattr(chunk, "additional_kwargs") and isinstance(chunk.additional_kwargs, dict):
                        text_delta = chunk.additional_kwargs.get("reasoning_content") or chunk.additional_kwargs.get("reasoning") or ""
                        if text_delta:
                            is_reasoning_chunk = True
                    if not text_delta and hasattr(chunk, "response_metadata") and isinstance(chunk.response_metadata, dict):
                        text_delta = chunk.response_metadata.get("reasoning_content") or ""
                        if text_delta:
                            is_reasoning_chunk = True

                    if text_delta:
                        if is_reasoning_chunk:
                            if not in_think_block:
                                token_buffer.append("<think>\n")
                                in_think_block = True
                        else:
                            if in_think_block:
                                token_buffer.append("\n</think>\n\n")
                                in_think_block = False

                        token_buffer.append(text_delta)
                        if len(token_buffer) >= _TOKEN_BATCH_SIZE or (time.time() - last_flush) >= _TOKEN_FLUSH_SECONDS:
                            flush_tokens()
            elif mode == "updates":
                # Each update carries the messages produced by that node;
                # accumulating them in order reconstructs the final state.
                for _node, state in data.items():
                    node_messages = state.get("messages") or []
                    if node_messages:
                        final_messages.extend(node_messages)
    except Exception:
        logger.exception("Agent stream failed for session_id=%s", session_id)
        # Flush whatever tokens we have so the UI isn't left hanging, then
        # fall back to a plain invoke so the user still gets an answer.
        if in_think_block:
            token_buffer.append("\n</think>\n\n")
            in_think_block = False
        flush_tokens()
        return agent.invoke(
            {"messages": messages},
            config=config,
        )
    finally:
        if in_think_block:
            token_buffer.append("\n</think>\n\n")
            in_think_block = False
        flush_tokens()

    if not final_messages:
        # Defensive: stream produced no updates (shouldn't happen) — fall back.
        logger.warning("Agent stream produced no updates for session_id=%s — falling back to invoke", session_id)
        return agent.invoke({"messages": messages}, config=config)

    return {"messages": final_messages}



def talk_to_ceo(company_id: int, message: str, history: list[dict] | None = None, effort: str = "flash", session_id: str = ""):
    """Talk to the CEO agent.

    Returns either a plain string reply, or a dict payload
    {"type": "clarification_request", "question": ..., "options": [...]}
    when the agent asks the user a multiple choice question.

    effort: "flash" (fastest, skips chat memories + reflections),
            "mid" (balanced),
            "max" (full quality).

    session_id: when provided, tool-call and LLM events are streamed
                to the WebSocket observability layer.
    """
    logger.info("talk_to_ceo called: company_id=%d, message='%s', history_len=%d, effort=%s", company_id, message[:100], len(history or []), effort)
    ceo_agent = _get_ceo_agent(company_id, effort=effort)
    if effort == "flash":
        chat_memories = []
    else:
        chat_memories = _get_relevant_chat_memories(company_id, message)
    user_message = _build_user_message_with_memories(message, chat_memories)

    if session_id:
        existing = get_session_resources(session_id)
        if existing is None:
            init_session_resources(session_id, effort)
        # If effort changed mid-session, re-init (or you could choose to preserve)
        elif existing.get("effort") != effort:
            init_session_resources(session_id, effort)
    
    

    # Build the message list: prior conversation turns + current message.
    # Cap at the last 20 turns to keep context manageable.
    messages = []

    if session_id:
        resource_prompt = format_resources_for_prompt(session_id)
        if resource_prompt:
            messages.append({"role": "system", "content": resource_prompt})

    if history:
        recent = history[-20:]
        for turn in recent:
            role = turn.get("role")
            # DB stores the text in "message"; some callers may use "content".
            content = turn.get("content") or turn.get("message") or ""
            if role in ("user", "assistant") and content.strip():
                messages.append({"role": role, "content": content.strip()})
    messages.append({"role": "user", "content": user_message})



    # Store request state in Redis (thread-safe across any execution context)
    ceo_state.init_request_state(session_id, effort)

    # ── Observability callback ──────────────────────────────────────
    invoke_config: dict = {}
    if session_id:
        from agents.helpers.observability import ObservabilityCallback
        invoke_config["callbacks"] = [ObservabilityCallback(session_id)]

    result = _invoke_agent(
        ceo_agent,
        messages,
        session_id=session_id,
        invoke_config=invoke_config,
    )
    # Record per-model token usage (for the credit-management Kafka job).
    if session_id:
        ceo_state.record_usage(session_id, _collect_usage(result))
    # Check tool outputs for image_generated payload (from graphic_design_request)
    image_payload = _find_image_generated_payload(result)
    if image_payload:
        # Resolve the image token back to the real data URL (kept out of LLM context).
        token = image_payload.pop("image_token", None)
        if token:
            from agents.graphic_design.graphic_desiger_tools import get_generated_image
            image_data_url = get_generated_image(token)
            if image_data_url:
                image_payload["image_data_url"] = image_data_url
                if not image_payload.get("message") or image_payload.get("message") == "Graphic generated successfully.":
                    image_payload["message"] = "Here is the generated graphic based on your brand requirements."
                logger.info("CEO agent returned image_generated")
                return image_payload
            logger.warning("Image token %s not found in cache", token)
        elif "image_data_url" in image_payload:
            logger.info("CEO agent returned image_generated")
            return image_payload
    content = _extract_content(result)
    if isinstance(content, str):
        try:
            parsed = json.loads(content)
            if isinstance(parsed, dict) and parsed.get("type") in {"clarification_request", "image_generated"}:
                logger.info("CEO agent returned %s", parsed.get("type"))
                return parsed
        except (json.JSONDecodeError, TypeError):
            pass
    logger.info("talk_to_ceo completed for company_id=%d", company_id)
    return content


def _find_image_generated_payload(response) -> dict | None:
    """Scan tool and response messages for an image_generated JSON payload."""
    messages = response.get("messages", []) if isinstance(response, Mapping) else []
    for message in reversed(messages):
        content = message.get("content") if isinstance(message, Mapping) else getattr(message, "content", None)
        if isinstance(content, dict) and content.get("type") == "image_generated":
            return content
        if isinstance(content, str) and "image_generated" in content:
            try:
                parsed = json.loads(content)
                if isinstance(parsed, dict) and parsed.get("type") == "image_generated":
                    return parsed
            except (json.JSONDecodeError, TypeError):
                continue
    return None


def _collect_usage(result: dict) -> dict:
    """Aggregate per-model token usage from the agent's final messages.

    LangChain AIMessages carry ``usage_metadata`` (input/output tokens) and
    ``response_metadata`` (model name) populated by the OpenRouter provider.
    Returns ``{"breakdown": [{"model", "input_tokens", "output_tokens"}...],
    "no_of_images": int}`` — the shape the credit-management consumer expects.
    """
    from langchain_core.messages import AIMessage
    from agents.helpers.choose_llm import DEFAULT_MODEL

    per_model: dict[str, dict[str, int]] = {}
    image_count = 0
    for message in result.get("messages", []):
        if not isinstance(message, AIMessage):
            continue
        usage_metadata = getattr(message, "usage_metadata", None) or {}
        if not usage_metadata:
            continue
        resp_meta = getattr(message, "response_metadata", {}) or {}
        model = (
            resp_meta.get("model_name")
            or resp_meta.get("model")
            or resp_meta.get("model_id")
            or DEFAULT_MODEL.value
        )
        entry = per_model.setdefault(model, {"input_tokens": 0, "output_tokens": 0, "image_count": 0})
        entry["input_tokens"] += int(usage_metadata.get("input_tokens") or 0)
        entry["output_tokens"] += int(usage_metadata.get("output_tokens") or 0)

    # Count generated graphics — charged separately via the image model.
    image_payload = _find_image_generated_payload(result)
    if image_payload:
        image_count += 1
        image_model = "google/gemini-2.5-flash-image"
        if isinstance(image_payload, dict) and image_payload.get("model"):
            image_model = image_payload.get("model")
        entry = per_model.setdefault(image_model, {"input_tokens": 0, "output_tokens": 0, "image_count": 0})
        entry["image_count"] = entry.get("image_count", 0) + 1

    breakdown = [
        {
            "model": model,
            "input_tokens": counts.get("input_tokens", 0),
            "output_tokens": counts.get("output_tokens", 0),
            "image_count": counts.get("image_count", 0),
        }
        for model, counts in per_model.items()
    ]
    return {"breakdown": breakdown, "no_of_images": image_count}
