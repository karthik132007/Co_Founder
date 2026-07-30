"""
LangChain / LangGraph callback that pushes tool-call and LLM events
into the SessionEventBus so the WebSocket layer can stream them to the frontend.

Usage (in talk_to_ceo)::

    from agents.helpers.observability import ObservabilityCallback

    callback = ObservabilityCallback(session_id)
    result = agent.invoke(
        {"messages": [...]},
        config={"callbacks": [callback]},
    )
"""

from __future__ import annotations

import logging
import time
from uuid import UUID

from langgraph.callbacks import GraphCallbackHandler

from backend.api.connection_manager import event_bus
from backend.api.observability_events import (
    make_llm_end,
    make_llm_start,
    make_llm_token,
    make_tool_end,
    make_tool_error,
    make_tool_start,
)

logger = logging.getLogger(__name__)


def _push_tool_end_manual(session_id: str, tool_name: str, duration_ms: float, output: str) -> None:
    """Push a tool_end event manually (for return_direct=True tools that skip the callback)."""
    event_bus.push(
        make_tool_end(
            session_id=session_id,
            tool_name=tool_name,
            duration_ms=duration_ms,
            tool_output=output,
            agent="CEO",
        )
    )


class ObservabilityCallback(GraphCallbackHandler):
    """LangGraph callback that streams agent activity to the WebSocket layer.

    Push semantic:
      * ``on_tool_start``  → ``tool_start``  event with tool name + input
      * ``on_tool_end``    → ``tool_end``    event with output preview + duration
      * ``on_tool_error``  → ``tool_error``  event with error message
      * ``on_llm_start``   → ``llm_start``   event (optional — high volume)
      * ``on_llm_new_token`` → ``llm_token`` event (one per token — very chatty!)
      * ``on_llm_end``     → ``llm_end``     event

    LLM streaming events are opt-in via the constructor because they are
    extremely high frequency and can flood the WebSocket.

    Thread safety: all ``on_*`` methods may be called from arbitrary threads
    (LangChain's agent loop).  The underlying ``event_bus.push()`` uses
    ``call_soon_threadsafe`` so this is safe without locks.
    """

    # ------------------------------------------------------------------
    def __init__(
        self,
        session_id: str,
        *,
        agent: str = "CEO",
        stream_llm_tokens: bool = False,
    ) -> None:
        super().__init__()
        self._session_id = session_id
        self._agent = agent
        self._stream_llm = stream_llm_tokens
        # run_id → (tool_name, start_timestamp)
        self._tool_runs: dict[UUID, tuple[str, float]] = {}

    # ══════════════════════════════════════════════════════════════════
    # Tool lifecycle
    # ══════════════════════════════════════════════════════════════════

    def on_tool_start(
        self,
        serialized: dict[str, object],
        input_str: str,
        *,
        run_id: UUID,
        parent_run_id: UUID | None = None,
        tags: list[str] | None = None,
        metadata: dict[str, object] | None = None,
        inputs: dict[str, object] | None = None,
        **kwargs: object,
    ) -> None:
        tool_name = str(serialized.get("name", "unknown_tool"))
        self._tool_runs[run_id] = (tool_name, time.time())

        logger.debug(
            "Tool start — session=%s tool=%s input=%.100s",
            self._session_id, tool_name, input_str,
        )
        event_bus.push(
            make_tool_start(
                session_id=self._session_id,
                tool_name=tool_name,
                tool_input=input_str,
                agent=self._agent,
                tool_run_id=str(run_id),
            )
        )

    def on_tool_end(
        self,
        output: object,
        *,
        run_id: UUID,
        parent_run_id: UUID | None = None,
        **kwargs: object,
    ) -> None:
        tool_name, start = self._tool_runs.pop(run_id, ("unknown_tool", None))
        duration_ms = (time.time() - start) * 1000 if start is not None else 0.0

        logger.debug(
            "Tool end — session=%s tool=%s duration=%.1fms output=%.100s",
            self._session_id, tool_name, duration_ms, output,
        )
        event_bus.push(
            make_tool_end(
                session_id=self._session_id,
                tool_name=tool_name,
                duration_ms=duration_ms,
                tool_output=str(output),
                agent=self._agent,
                tool_run_id=str(run_id),
            )
        )

    def on_tool_error(
        self,
        error: BaseException,
        *,
        run_id: UUID,
        parent_run_id: UUID | None = None,
        **kwargs: object,
    ) -> None:
        tool_name, _start = self._tool_runs.pop(run_id, ("unknown_tool", None))

        logger.error(
            "Tool error — session=%s tool=%s error=%s",
            self._session_id, tool_name, error,
        )
        event_bus.push(
            make_tool_error(
                session_id=self._session_id,
                agent=self._agent,
                tool_name=tool_name,
                error_message=str(error),
                tool_run_id=str(run_id),
            )
        )

    # ══════════════════════════════════════════════════════════════════
    # LLM lifecycle (opt-in via stream_llm_tokens)
    # ══════════════════════════════════════════════════════════════════

    def on_llm_start(
        self,
        serialized: dict[str, object],
        prompts: list[str],
        *,
        run_id: UUID,
        parent_run_id: UUID | None = None,
        tags: list[str] | None = None,
        metadata: dict[str, object] | None = None,
        **kwargs: object,
    ) -> None:
        if not self._stream_llm:
            return
        event_bus.push(make_llm_start(self._session_id, agent=self._agent))

    def on_llm_new_token(
        self,
        token: str | list[str | dict[str, object]],
        *,
        chunk: object | None = None,
        run_id: UUID,
        parent_run_id: UUID | None = None,
        tags: list[str] | None = None,
        **kwargs: object,
    ) -> None:
        if not self._stream_llm:
            return
        token_str = token if isinstance(token, str) else str(token)
        event_bus.push(make_llm_token(self._session_id, token_str, agent=self._agent))

    def on_llm_end(
        self,
        response: object,
        *,
        run_id: UUID,
        parent_run_id: UUID | None = None,
        tags: list[str] | None = None,
        **kwargs: object,
    ) -> None:
        if not self._stream_llm:
            return
        event_bus.push(make_llm_end(self._session_id, agent=self._agent))
