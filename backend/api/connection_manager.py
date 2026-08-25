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

    Each ``drain()`` call creates its own queue; events are fanned out
    to all active drain loops for the session.  A ``None`` sentinel is
    pushed to each queue when ``send_sentinel()`` is called, signaling
    the corresponding drain loop to stop.

    Queues are cleaned up when the drain loop exits (normally or via
    exception in the caller's finally block).

    Robustness (prod fix): events are also kept in a small per-session
    replay buffer when no drain loop is listening yet.  This closes the
    race where the agent (running in the ``POST /chat`` threadpool) starts
    emitting events before the browser's WebSocket has finished upgrading —
    which silently dropped every event and made the trace invisible in
    production.  ``begin_query()`` is called by the chat handler before the
    agent runs so each query starts with a clean buffer.
    """

    # Maximum events kept in the replay buffer per session.  Prevents a
    # session with no connected WebSocket from growing the buffer forever.
    _MAX_BUFFER = 1500

    def __init__(self) -> None:
        self._queues: dict[str, list[asyncio.Queue[ObservabilityEvent | None]]] = {}
        # session_id -> list of events that arrived before any drain loop
        # was listening.  Replayed into a drain loop when it registers.
        self._buffers: dict[str, list[ObservabilityEvent]] = {}
        # session_id -> a query already ended (sentinel sent) with NO drain
        # loop registered.  A drain loop that connects afterwards ends
        # immediately (after replaying the buffer) instead of blocking
        # forever waiting for a sentinel it will never receive.
        self._pending_sentinel: set[str] = set()
        self._loop: asyncio.AbstractEventLoop | None = None
        self._warned_no_event_loop = False

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

    def _register_queue(self, session_id: str) -> asyncio.Queue[ObservabilityEvent | None]:
        """Create a new queue for a drain loop and register it."""
        q: asyncio.Queue[ObservabilityEvent | None] = asyncio.Queue()
        self._queues.setdefault(session_id, []).append(q)
        logger.debug("EventBus: registered queue for session_id=%s (total=%d)", session_id, len(self._queues[session_id]))
        return q

    def _unregister_queue(self, session_id: str, q: asyncio.Queue[ObservabilityEvent | None]) -> None:
        """Remove a queue after its drain loop exits."""
        queues = self._queues.get(session_id)
        if queues is None:
            return
        try:
            queues.remove(q)
        except ValueError:
            pass
        if not queues:
            self._queues.pop(session_id, None)
            logger.debug("EventBus: removed last queue for session_id=%s", session_id)

    # ------------------------------------------------------------------
    # begin_query (marks a fresh query, clears stale replay buffer)
    # ------------------------------------------------------------------

    def begin_query(self, session_id: str) -> None:
        """Signal that a new query is starting for *session_id*.

        Clears any stale buffered events and the pending-sentinel flag from
        a previous query so a fresh query starts clean.  Called by the
        ``POST /chat`` handler just before the agent runs.  Thread-safe.
        """
        self._buffers.pop(session_id, None)
        self._pending_sentinel.discard(session_id)
        logger.debug("EventBus: begin_query session_id=%s", session_id)

    # ------------------------------------------------------------------
    # push (sync, thread-safe)
    # ------------------------------------------------------------------

    def push(self, event: ObservabilityEvent) -> None:
        """Enqueue an event from **any thread**.  Non-blocking, never raises.

        If no drain loops are listening for this session the event is kept
        in a small replay buffer (see class docstring) so it is not lost
        when the WebSocket connects slightly late — the common cause of a
        missing agent trace in production.
        """
        # Always buffer if nobody is listening.  When a drain loop is
        # listening we still buffer only if no queue exists yet.
        queues = self._queues.get(event.session_id)

        if not queues:
            # Nobody listening (yet) — keep it for replay when a drain
            # loop registers.  Bounded so a dead session can't grow it.
            buffered = self._buffers.setdefault(event.session_id, [])
            buffered.append(event)
            if len(buffered) > self._MAX_BUFFER:
                del buffered[: len(buffered) - self._MAX_BUFFER]

        if self._loop is None:
            # CLI/eval processes intentionally have no WebSocket event loop.
            # Keep one visible diagnostic without flooding long test runs.
            if not self._warned_no_event_loop:
                logger.warning("EventBus: no event loop set; buffering CLI observability events (replayed when a WS connects)")
                self._warned_no_event_loop = True
            else:
                logger.debug("EventBus: no event loop set; buffering event type=%s", event.type)
            return

        if not queues:
            return  # no drain loop yet — event is safely buffered

        for q in queues:
            try:
                self._loop.call_soon_threadsafe(q.put_nowait, event)
            except Exception:
                logger.exception("EventBus: failed to push event type=%s for session_id=%s", event.type, event.session_id)

    # ------------------------------------------------------------------
    # drain (async generator)
    # ------------------------------------------------------------------

    async def drain(self, session_id: str) -> AsyncIterator[ObservabilityEvent]:
        """Async generator yielding events for *session_id*.

        Creates its own queue so multiple drain loops for the same
        session receive all events independently.

        Replays any events that were buffered before this drain loop
        connected (the late-WebSocket race), then streams live events.
        Stops when a ``None`` sentinel is received.  The queue is
        automatically cleaned up on exit.
        """
        queue = self._register_queue(session_id)
        logger.debug("EventBus: draining started for session_id=%s", session_id)
        try:
            # Replay anything buffered before we connected, then drop the
            # buffer so a later drain loop (e.g. after reconnect) only sees
            # events pushed from now on.
            buffered = self._buffers.pop(session_id, None)
            if buffered:
                logger.info(
                    "EventBus: replaying %d buffered event(s) for session_id=%s",
                    len(buffered), session_id,
                )
                for event in buffered:
                    await queue.put(event)

            # If this query already ended before we connected (sentinel was
            # sent while no drain loop was registered), end this drain right
            # away — otherwise it would block forever.  The flag is consumed
            # here so the WS handler's next drain (for the following query)
            # blocks normally instead of hot-looping on session_end.
            if session_id in self._pending_sentinel:
                self._pending_sentinel.discard(session_id)
                logger.info("EventBus: consuming missed sentinel for session_id=%s", session_id)
                await queue.put(None)

            while True:
                event = await queue.get()
                if event is None:
                    logger.debug("EventBus: sentinel received for session_id=%s", session_id)
                    break
                yield event
        finally:
            self._unregister_queue(session_id, queue)
            logger.debug("EventBus: queue cleaned up for session_id=%s", session_id)

    # ------------------------------------------------------------------
    # sentinel (signals end-of-stream to all active drain loops)
    # ------------------------------------------------------------------

    def send_sentinel(self, session_id: str) -> None:
        """Signal that no more events will be pushed for *session_id*.

        Pushes a ``None`` sentinel to every active drain queue so all
        ``drain()`` iterators exit.  If NO drain loop is registered yet
        (WebSocket still connecting), records a pending sentinel so a
        drain loop that connects afterwards ends immediately instead of
        blocking forever.  Safe to call from any thread.
        """
        queues = self._queues.get(session_id)
        if self._loop is None:
            return
        if queues:
            for q in queues:
                self._loop.call_soon_threadsafe(q.put_nowait, None)
        else:
            self._pending_sentinel.add(session_id)
            logger.debug("EventBus: sentinel pending for session_id=%s (no drain loop yet)", session_id)


# ── Module-level singletons ─────────────────────────────────────────────────

manager = ConnectionManager()
event_bus = SessionEventBus()
