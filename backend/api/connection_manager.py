"""
WebSocket connection registry + sync→async event bridge.

Two singletons:
  - manager    → tracks WebSocket connections per session, broadcasts events.
  - event_bus  → thread-safe queue so sync agent code can push events into
                  the async WebSocket world.
"""

from __future__ import annotations

import asyncio
import logging
from typing import AsyncIterator

from fastapi import WebSocket

from backend.api.observability_events import ObservabilityEvent, make_error, make_heartbeat

logger = logging.getLogger(__name__)

# ── Connection Manager ─────────────────────────────────────────────────────

class ConnectionManager:
    """Registry of active WebSocket connections, keyed by session_id.

    A single session can have multiple connections (e.g. two browser tabs).
    Broadcasts go to every connection for the target session.
    """

    def __init__(self) -> None:
        self._connections: dict[str, list[WebSocket]] = {}

    # ------------------------------------------------------------------
    # lifecycle
    # ------------------------------------------------------------------

    async def connect(self, session_id: str, ws: WebSocket) -> None:
        """Accept a new WebSocket and register it under *session_id*."""
        await ws.accept()
        self._connections.setdefault(session_id, []).append(ws)
        logger.info(
            "WS connect — session_id=%s (total connections for session: %d)",
            session_id, len(self._connections[session_id]),
        )

    def disconnect(self, session_id: str, ws: WebSocket) -> None:
        """Remove a WebSocket.  If the session is empty afterwards, drop the key."""
        conns = self._connections.get(session_id, [])
        if ws in conns:
            conns.remove(ws)
        if conns:
            logger.info(
                "WS disconnect — session_id=%s (remaining: %d)",
                session_id, len(conns),
            )
        else:
            self._connections.pop(session_id, None)
            logger.info("WS disconnect — session_id=%s (last connection, key removed)", session_id)

    # ------------------------------------------------------------------
    # broadcast
    # ------------------------------------------------------------------

    async def broadcast(self, session_id: str, event: ObservabilityEvent) -> None:
        """Push *event* to every WebSocket registered for *session_id*.

        Dead connections are silently removed during broadcast.
        """
        conns = self._connections.get(session_id, [])
        if not conns:
            return  # nobody listening — silently drop

        dead: list[WebSocket] = []
        for ws in conns:
            try:
                await ws.send_json(event.to_json())
            except Exception:
                logger.debug("WS send failed for session_id=%s, marking as dead", session_id)
                dead.append(ws)

        for ws in dead:
            self.disconnect(session_id, ws)

    async def broadcast_error(self, session_id: str, error_message: str) -> None:
        """Convenience: broadcast an ERROR event."""
        await self.broadcast(session_id, make_error(session_id, error_message))

    async def broadcast_heartbeat(self, session_id: str) -> None:
        """Convenience: broadcast a HEARTBEAT event."""
        await self.broadcast(session_id, make_heartbeat(session_id))

    # ------------------------------------------------------------------
    # query
    # ------------------------------------------------------------------

    @property
    def active_sessions(self) -> set[str]:
        return set(self._connections.keys())

    def connection_count(self, session_id: str) -> int:
        return len(self._connections.get(session_id, []))


# ── Sync → Async Event Bus ─────────────────────────────────────────────────

class SessionEventBus:
    """Thread-safe bridge: sync agent code → async WebSocket code.

    Sync call-sites call ``push(event)`` — non-blocking, thread-safe.
    Async WebSocket code iterates ``drain(session_id)`` to consume.

    Internally backed by per-session ``asyncio.Queue`` instances.
    A ``None`` sentinel signals "no more events for this session".
    """

    def __init__(self) -> None:
        self._queues: dict[str, asyncio.Queue[ObservabilityEvent | None]] = {}
        self._loop: asyncio.AbstractEventLoop | None = None

    # ------------------------------------------------------------------
    # setup
    # ------------------------------------------------------------------

    def set_event_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        """Store a reference to the main event loop.

        Must be called once before any ``push()`` calls — typically
        during FastAPI startup or lazily on first WebSocket connect.
        """
        self._loop = loop
        logger.info("SessionEventBus bound to event loop %s", id(loop))

    # ------------------------------------------------------------------
    # queue management
    # ------------------------------------------------------------------

    def _get_or_create_queue(self, session_id: str) -> asyncio.Queue[ObservabilityEvent | None]:
        if session_id not in self._queues:
            self._queues[session_id] = asyncio.Queue()
            logger.debug("EventBus: created queue for session_id=%s", session_id)
        return self._queues[session_id]

    # ------------------------------------------------------------------
    # push (sync, thread-safe)
    # ------------------------------------------------------------------

    def push(self, event: ObservabilityEvent) -> None:
        """Enqueue an event from **any thread**.  Non-blocking, never raises.

        If the event loop reference hasn't been set yet the event is
        silently dropped (shouldn't happen once the server is running).
        """
        if self._loop is None:
            logger.warning("EventBus: push() called but no event loop set — dropping event type=%s", event.type)
            return

        queue = self._get_or_create_queue(event.session_id)
        try:
            self._loop.call_soon_threadsafe(queue.put_nowait, event)
        except Exception:
            logger.exception("EventBus: failed to push event type=%s for session_id=%s", event.type, event.session_id)

    # ------------------------------------------------------------------
    # drain (async generator)
    # ------------------------------------------------------------------

    async def drain(self, session_id: str) -> AsyncIterator[ObservabilityEvent]:
        """Async generator yielding events for *session_id*.

        Stops when a ``None`` sentinel is received, then cleans up the queue.
        """
        queue = self._get_or_create_queue(session_id)
        logger.debug("EventBus: draining started for session_id=%s", session_id)
        while True:
            event = await queue.get()
            if event is None:
                logger.debug("EventBus: sentinel received for session_id=%s", session_id)
                break
            yield event
        # Cleanup
        self._queues.pop(session_id, None)
        logger.debug("EventBus: queue cleaned up for session_id=%s", session_id)

    # ------------------------------------------------------------------
    # sentinel (signals end-of-stream)
    # ------------------------------------------------------------------

    def send_sentinel(self, session_id: str) -> None:
        """Signal that no more events will be pushed for *session_id*.

        The ``drain()`` iterator will exit after consuming all prior events.
        Safe to call from any thread.
        """
        queue = self._queues.get(session_id)
        if queue is not None and self._loop is not None:
            self._loop.call_soon_threadsafe(queue.put_nowait, None)
            logger.debug("EventBus: sentinel queued for session_id=%s", session_id)


# ── Module-level singletons ─────────────────────────────────────────────────

manager = ConnectionManager()
event_bus = SessionEventBus()
