"""
Canonical event schema for the WebSocket observability stream.

Every event sent over the WebSocket follows the ObservabilityEvent envelope.
Factory functions at the bottom ensure consistent construction across all call sites.

Frontend rendering expectations:
  - tool_start / tool_end     → expandable cards with timing badge
  - subagent_spawn / subagent_end → indented child rows under the parent tool
  - llm_token                 → streaming "thinking..." text (optional, high volume)
  - error                     → red banner, non-blocking
"""

from __future__ import annotations

import time
from dataclasses import asdict, dataclass, field
from enum import StrEnum
from typing import Any


# ── Event type enumeration ──────────────────────────────────────────────────

class EventType(StrEnum):
    # ── Tool lifecycle (fired automatically by LangChain callbacks) ──────────
    TOOL_START = "tool_start"
    TOOL_END   = "tool_end"
    TOOL_ERROR = "tool_error"

    # ── Subagent lifecycle (fired manually inside spawn_* functions) ──────────
    SUBAGENT_SPAWN = "subagent_spawn"   # subagent has been invoked
    SUBAGENT_START = "subagent_start"   # subagent began processing
    SUBAGENT_END   = "subagent_end"     # subagent finished successfully
    SUBAGENT_ERROR = "subagent_error"   # subagent raised an exception

    # ── LLM streaming (optional, for "thinking" effect on the frontend) ──────
    LLM_TOKEN = "llm_token"   # single token from the LLM (high frequency)
    LLM_START = "llm_start"   # LLM inference started
    LLM_END   = "llm_end"     # LLM inference ended

    # ── Session lifecycle ────────────────────────────────────────────────────
    SESSION_START = "session_start"  # client connected to WS
    SESSION_END   = "session_end"    # client disconnected

    # ── Housekeeping ─────────────────────────────────────────────────────────
    HEARTBEAT = "heartbeat"  # keepalive ping (every 30 s)
    ERROR     = "error"      # catch-all for unexpected failures


# ── Canonical envelope ──────────────────────────────────────────────────────

@dataclass
class ObservabilityEvent:
    """Every WebSocket message is one ObservabilityEvent serialized to JSON.

    Fields:
        type:       What kind of event (see EventType).
        session_id: The chat session this belongs to.  Frontend filters on this.
        timestamp:  Unix timestamp with fractional seconds.
        agent:      Which agent produced the event:
                    "CEO", "Researcher", "Writer", "CMO", "DataAnalyst",
                    "GraphicDesigner", or "system".
        data:       Type-specific payload — shape varies by event type.
    """
    type: EventType
    session_id: str
    timestamp: float = field(default_factory=time.time)
    agent: str = "system"
    data: dict[str, Any] = field(default_factory=dict)

    def to_json(self) -> dict[str, Any]:
        """Serialise to a JSON-serializable dict ready for `ws.send_json()`."""
        d = asdict(self)
        d["type"] = self.type.value  # StrEnum → plain string
        return d


# ── Payload dataclasses (documentation + optional typed construction helpers) ─

@dataclass
class ToolStartPayload:
    tool_name: str
    tool_input: str       # LLM-generated arguments, truncated to 500 chars
    tool_description: str = ""


@dataclass
class ToolEndPayload:
    tool_name: str
    tool_output: str      # truncated to 500 chars (full output is in DB)
    duration_ms: float
    success: bool = True


@dataclass
class SubagentSpawnPayload:
    subagent_name: str    # "Researcher", "Writer", "CMO", "DataAnalyst", "GraphicDesigner"
    task: str             # task description passed to the subagent
    effort: str           # "flash" | "mid" | "max"


@dataclass
class SubagentEndPayload:
    subagent_name: str
    duration_ms: float
    result_preview: str   # first 300 chars of the subagent output
    reflection_count: int = 0
    success: bool = True


# ── Factory functions ───────────────────────────────────────────────────────
# Every call site uses one of these — no raw dicts floating around.

def make_tool_start(
    session_id: str,
    tool_name: str,
    tool_input: str,
    agent: str = "CEO",
) -> ObservabilityEvent:
    return ObservabilityEvent(
        type=EventType.TOOL_START,
        session_id=session_id,
        agent=agent,
        data={
            "tool_name": tool_name,
            "tool_input": str(tool_input)[:500],
        },
    )


def make_tool_end(
    session_id: str,
    tool_name: str,
    duration_ms: float,
    tool_output: str,
    agent: str = "CEO",
) -> ObservabilityEvent:
    return ObservabilityEvent(
        type=EventType.TOOL_END,
        session_id=session_id,
        agent=agent,
        data={
            "tool_name": tool_name,
            "duration_ms": round(duration_ms, 1),
            "tool_output": str(tool_output)[:500],
            "success": True,
        },
    )


def make_tool_error(
    session_id: str,
    tool_name: str,
    error_message: str,
    agent: str = "CEO",
) -> ObservabilityEvent:
    return ObservabilityEvent(
        type=EventType.TOOL_ERROR,
        session_id=session_id,
        agent=agent,
        data={
            "tool_name": tool_name,
            "error": str(error_message)[:500],
        },
    )


def make_subagent_spawn(
    session_id: str,
    subagent_name: str,
    task: str,
    effort: str,
) -> ObservabilityEvent:
    return ObservabilityEvent(
        type=EventType.SUBAGENT_SPAWN,
        session_id=session_id,
        agent=subagent_name,
        data={
            "subagent_name": subagent_name,
            "task": task,
            "effort": effort,
        },
    )


def make_subagent_end(
    session_id: str,
    subagent_name: str,
    duration_ms: float,
    result_preview: str,
    reflection_count: int = 0,
) -> ObservabilityEvent:
    return ObservabilityEvent(
        type=EventType.SUBAGENT_END,
        session_id=session_id,
        agent=subagent_name,
        data={
            "subagent_name": subagent_name,
            "duration_ms": round(duration_ms, 1),
            "result_preview": str(result_preview)[:300],
            "reflection_count": reflection_count,
            "success": True,
        },
    )


def make_subagent_error(
    session_id: str,
    subagent_name: str,
    error_message: str,
) -> ObservabilityEvent:
    return ObservabilityEvent(
        type=EventType.SUBAGENT_ERROR,
        session_id=session_id,
        agent=subagent_name,
        data={
            "subagent_name": subagent_name,
            "error": str(error_message)[:500],
        },
    )


def make_llm_token(
    session_id: str,
    token: str,
    agent: str = "CEO",
) -> ObservabilityEvent:
    return ObservabilityEvent(
        type=EventType.LLM_TOKEN,
        session_id=session_id,
        agent=agent,
        data={"token": token},
    )


def make_llm_start(
    session_id: str,
    agent: str = "CEO",
) -> ObservabilityEvent:
    return ObservabilityEvent(
        type=EventType.LLM_START,
        session_id=session_id,
        agent=agent,
        data={},
    )


def make_llm_end(
    session_id: str,
    agent: str = "CEO",
) -> ObservabilityEvent:
    return ObservabilityEvent(
        type=EventType.LLM_END,
        session_id=session_id,
        agent=agent,
        data={},
    )


def make_error(
    session_id: str,
    error_message: str,
    agent: str = "system",
) -> ObservabilityEvent:
    return ObservabilityEvent(
        type=EventType.ERROR,
        session_id=session_id,
        agent=agent,
        data={"error": str(error_message)[:1000]},
    )


def make_heartbeat(session_id: str) -> ObservabilityEvent:
    return ObservabilityEvent(
        type=EventType.HEARTBEAT,
        session_id=session_id,
        agent="system",
        data={},
    )


def make_session_start(session_id: str) -> ObservabilityEvent:
    return ObservabilityEvent(
        type=EventType.SESSION_START,
        session_id=session_id,
        agent="system",
        data={},
    )


def make_session_end(session_id: str) -> ObservabilityEvent:
    return ObservabilityEvent(
        type=EventType.SESSION_END,
        session_id=session_id,
        agent="system",
        data={},
    )
