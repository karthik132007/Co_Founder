import asyncio
import contextlib
import logging
import json
import os
from fastapi import APIRouter, BackgroundTasks, Form, HTTPException, Query, Request, WebSocket
from starlette.websockets import WebSocketDisconnect

from backend.kafka_jobs.producers.producer import (
    queue_session_message,
    queue_chat_memory,
    queue_title_creation,
)
from main import chat
from backend.db.get_from_sql import get_company_id, get_chats_in_session, get_chat_sessions
from backend.db.insert_to_sql import create_chat_session, add_message_to_session
from backend.db.delete_from_sql import delete_chat_session
from uuid import uuid4
from typing import Optional
from agents.helpers.utils import base64_to_img
from backend.db.put_to_drive import save_generated_graphic
from backend.api.connection_manager import manager, event_bus
from backend.api.observability_events import (
    make_session_start,
    make_session_end,
)
from backend.api.rate_limit import SlidingWindowRateLimiter

logger = logging.getLogger(__name__)

router = APIRouter()

# LLM calls are expensive — throttle per client IP to blunt abuse/DoS.
_chat_limiter = SlidingWindowRateLimiter(
    max_attempts=int(os.getenv("CHAT_RATE_LIMIT_PER_MINUTE", "30")),
    window_seconds=60,
)


def _get_mcq_limit_for_effort(effort: str) -> int:
    """Return the MCQ limit matching the resource system for the given effort."""
    if effort == "flash":
        return 1
    elif effort == "mid":
        return 2
    else:  # max
        return 3


def _count_mcqs_in_history(history: list[dict]) -> int:
    """Count how many MCQ questions the CEO has asked in this session.
    MCQs are stored as assistant messages containing 'Options:'."""
    count = 0
    for msg in history:
        if msg.get("role") == "assistant" and "Options:" in (msg.get("message") or ""):
            count += 1
    return count


@router.post("/chat")
def chat_with_user(
    background_tasks: BackgroundTasks,
    request: Request,
    user_id: int = Form(...),
    message: str = Form(...),
    session_id: Optional[str] = Form(None),
    effort: str = Form("flash"),
):
    """
    effort: "flash" (fastest, default), "mid", or "max" (highest quality).
    Controls agent reflection depth, model selection, and post-processing.
    """
    _chat_limiter.check(request)
    if effort not in ("flash", "mid", "max"):
        effort = "flash"
    logger.info("chat_with_user called — user_id=%s, message_length=%d, session_id=%s, effort=%s", user_id, len(message), session_id, effort)

    company_id = get_company_id(user_id)
    if not company_id:
        logger.warning("No company found for user_id=%s", user_id)
        raise HTTPException(status_code=404, detail="Company not found")

    is_new_session = False
    history: list[dict] = []

    # If no session_id provided, create a new session with a title
    if not session_id:
        session_id = str(uuid4())
        title = "New Chat"
        logger.info("Creating new chat session — session_id=%s, company_id=%s", session_id, company_id)
        create_chat_session(session_id, company_id, title=title)
        
        queue_title_creation(session_id, message)
        is_new_session = True
    else:
        # Fetch existing messages once — used both to verify the session
        # exists and as conversation history for the CEO.
        history = get_chats_in_session(session_id)
        if not history:
            logger.info("Session %s not found — creating it now", session_id)
            title = "New Chat"
            create_chat_session(session_id, company_id, title=title)
            
            queue_title_creation(session_id, message)
            is_new_session = True
            history = []
        else:
            title = None  # existing session already has a title

    add_message_to_session(session_id, "user", message)

    # ── MCQ abuse guard ──
    # If the CEO has already asked too many questions in this session,
    # inject a hard system directive into the message to force execution.
    # Limit matches the per-effort resource system (ceo_resources.py).
    mcq_count = _count_mcqs_in_history(history)
    mcq_limit = _get_mcq_limit_for_effort(effort)
    ceo_message = message
    if mcq_count >= mcq_limit:
        logger.warning(
            "MCQ limit reached (%d/%d) for session_id=%s — injecting execution directive",
            mcq_count, mcq_limit, session_id,
        )
        ceo_message = (
            f"[SYSTEM DIRECTIVE — READ THIS FIRST]\n"
            f"You have already asked {mcq_count} clarification questions in this session. "
            f"The hard limit is {mcq_limit}. "
            f"You MUST execute the task NOW with the information you have. "
            f"Do NOT call ask_mcq_for_user again. Delegate immediately.\n\n"
            f"User message: {message}"
        )

    try:
        # Signal the event bus that a fresh query is starting.  This clears
        # any stale buffered events from a previous query so the trace the
        # user sees corresponds exactly to THIS request.
        event_bus.begin_query(session_id)
        reply = chat(company_id, ceo_message, history, effort=effort, session_id=session_id)
    finally:
        # Signal the WebSocket drain loop that no more events are coming.
        # Safe to call even if nobody is listening on the WS for this session.
        event_bus.send_sentinel(session_id)

    # chat() may short-circuit with an error (e.g. insufficient credits).
    # Surface it as a structured 402 so the frontend can show the message and
    # branch on the machine-readable code (e.g. offer a top-up CTA).
    if isinstance(reply, dict) and reply.get("error"):
        logger.warning("chat() returned error for session_id=%s: %s", session_id, reply["error"])
        raise HTTPException(
            status_code=402,
            detail={
                "code": "insufficient_credits",
                "message": reply["error"],
            },
        )

    # CEO may return a clarification request (MCQ) instead of a text reply.
    if isinstance(reply, dict) and reply.get("type") == "clarification_request":
        logger.info("CEO returned clarification request for session_id=%s", session_id)
        question = reply.get("question", "")
        options = reply.get("options", [])
        multi_select = reply.get("multi_select", False)
        # Store as text with multi_select flag preserved for reload
        stored_text = question
        if multi_select:
            stored_text = "[multi]\n" + stored_text
        if options:
            stored_text += "\n\nOptions: " + " | ".join(options)

        # Persist directly to DB so the MCQ is immediately visible in history.
        # Also queue via Kafka for async consumers (chat memory, etc.).
        add_message_to_session(session_id, "assistant", stored_text)
        try:
            queue_session_message(session_id, company_id, "assistant", stored_text)
        except Exception:
            logger.exception("Kafka side-queue failed for MCQ reply — already saved to DB")
        response = {
            "status": "success",
            "type": "clarification_request",
            "clarification": {
                "question": reply.get("question"),
                "options": reply.get("options", []),
                "allow_custom": reply.get("allow_custom", True),
                "multi_select": reply.get("multi_select", False),
            },
            "session_id": session_id,
        }
        if is_new_session or title:
            response["title"] = title
            response["is_new_session"] = True
        return response

    if isinstance(reply, dict) and reply.get("type") == "image_generated":
        generated_message = reply.get("message") or "Here is the generated graphic."
        image_data_url = reply.get("image_data_url")
        if not isinstance(image_data_url, str):
            logger.error("CEO returned an invalid generated-image payload")
            raise HTTPException(status_code=500, detail="Generated image preview was invalid")

        try:
            image_bytes = base64_to_img(image_data_url)
        except ValueError as exc:
            logger.error("CEO returned invalid generated image data: %s", exc)
            raise HTTPException(status_code=500, detail="Generated image data was invalid") from exc

        add_message_to_session(session_id, "assistant", generated_message)
        background_tasks.add_task(save_generated_graphic, company_id, image_bytes)

        queue_chat_memory(company_id, message, generated_message)
        response = {
            "status": "success",
            "type": "image_generated",
            "message": generated_message,
            "image_data_url": image_data_url,
            "session_id": session_id,
        }
        if is_new_session or title:
            response["title"] = title
            response["is_new_session"] = True
        return response

    # Any other dict shape is unexpected — refuse to persist it as a message.
    if isinstance(reply, dict):
        logger.error("CEO returned unexpected dict reply for session_id=%s: %s", session_id, reply)
        raise HTTPException(status_code=500, detail="Unexpected response from CEO agent")

    add_message_to_session(session_id, "assistant", reply)
    
    queue_chat_memory(company_id, message, reply)

    response = {
        "status": "success",
        "message": reply,
        "session_id": session_id,
    }
    if is_new_session or title:
        response["title"] = title
        response["is_new_session"] = True

    return response




@router.get("/chat/sessions")
def list_chat_sessions(user_id: int = Query(..., description="User ID")):
    """Return all chat sessions for the user's company."""
    logger.info("list_chat_sessions called — user_id=%s", user_id)
    company_id = get_company_id(user_id)
    if not company_id:
        logger.warning("No company found for user_id=%s", user_id)
        raise HTTPException(status_code=404, detail="Company not found")

    sessions = get_chat_sessions(company_id)
    logger.info("Found %d chat sessions for company_id=%s", len(sessions), company_id)
    return {
        "sessions": [
            {
                "session_id": s["session_id"],
                "title": s.get("title", "Untitled Chat"),
                "created_at": s.get("created_at"),
            }
            for s in sessions
        ]
    }


@router.get("/chat/sessions/{session_id}")
def get_session_messages(
    session_id: str,
    user_id: int = Query(..., description="User ID"),
):
    """Return all messages for a specific chat session."""
    logger.info("get_session_messages called — session_id=%s, user_id=%s", session_id, user_id)
    company_id = get_company_id(user_id)
    if not company_id:
        logger.warning("No company found for user_id=%s", user_id)
        raise HTTPException(status_code=404, detail="Company not found")

    messages = get_chats_in_session(session_id)
    if not messages:
        logger.warning("Session %s not found for company_id=%s", session_id, company_id)
        raise HTTPException(status_code=404, detail="Session not found")

    logger.info("Returning %d messages for session_id=%s", len(messages), session_id)
    return {
        "session_id": session_id,
        "messages": [
            {
                "id": m["id"],
                "role": m["role"],
                "content": m["message"],
                "created_at": m.get("created_at"),
            }
            for m in messages
        ],
    }


@router.delete("/chat/sessions/{session_id}")
def delete_session(
    session_id: str,
    user_id: int = Query(..., description="User ID"),
):
    """Delete a chat session and all its messages."""
    logger.info("delete_session called — session_id=%s, user_id=%s", session_id, user_id)
    company_id = get_company_id(user_id)
    if not company_id:
        logger.warning("No company found for user_id=%s", user_id)
        raise HTTPException(status_code=404, detail="Company not found")

    deleted = delete_chat_session(session_id, company_id)
    if not deleted:
        logger.warning("Session %s not found for company_id=%s", session_id, company_id)
        raise HTTPException(status_code=404, detail="Session not found")

    return {"status": "success", "message": "Chat session deleted"}


@router.websocket("/chat/ws")
async def show_internals(ws: WebSocket, session_id: str = Query(...)):
    """Stream internal agent activity (tool calls, subagent spawns, LLM tokens)
    in real time for a specific chat session.

    Connect from the frontend:
        const ws = new WebSocket(`ws://host:8000/chat/ws?session_id=${sid}`);

    Receives JSON objects matching ``ObservabilityEvent.to_json()``.
    """
    logger.info("WS client connecting — session_id=%s", session_id)

    # Lazy-initialise the event loop reference on first connection.
    loop = asyncio.get_running_loop()
    event_bus.set_event_loop(loop)

    await manager.connect(session_id, ws)
    await manager.broadcast(session_id, make_session_start(session_id))

    # ── heartbeat: keepalive ping every 30 s ────────────────────────────
    async def _heartbeat() -> None:
        while True:
            await asyncio.sleep(30)
            try:
                await manager.broadcast_heartbeat(session_id)
            except Exception:
                break

    heartbeat_task = asyncio.create_task(_heartbeat())

    try:
        # Keep the WS alive across multiple queries.
        # Each query pushes events → sentinel → drain exits → session_end sent →
        # loop creates a fresh drain queue for the next query.
        while True:
            async for event in event_bus.drain(session_id):
                await manager.broadcast(session_id, event)

            # Signal the frontend that this query's stream is complete.
            await manager.broadcast(session_id, make_session_end(session_id))

    except WebSocketDisconnect:
        logger.info("WS client disconnected — session_id=%s", session_id)
    except Exception:
        logger.exception("WS error for session_id=%s", session_id)
        await manager.broadcast_error(session_id, "Internal stream error")
    finally:
        heartbeat_task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await heartbeat_task
        manager.disconnect(session_id, ws)
        logger.info("WS cleanup complete — session_id=%s", session_id)