import logging

from fastapi import APIRouter, BackgroundTasks, Form, HTTPException, Query
from main import chat, store_chat_memory, store_chat_title
from backend.db.get_from_sql import get_company_id, get_chats_in_session, get_chat_sessions
from backend.db.insert_to_sql import create_chat_session, add_message_to_session
from backend.db.delete_from_sql import delete_chat_session
from uuid import uuid4
from typing import Optional
from agents.helpers.utils import base64_to_img
from backend.db.put_to_drive import save_generated_graphic

logger = logging.getLogger(__name__)

router = APIRouter()

# Hard limit: after this many MCQs in a session, we force the CEO to execute.
_MAX_MCQ_PER_SESSION = 2


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
    user_id: int = Form(...),
    message: str = Form(...),
    session_id: Optional[str] = Form(None),
    effort: str = Form("flash"),
):
    """
    effort: "flash" (fastest, default), "mid", or "max" (highest quality).
    Controls agent reflection depth, model selection, and post-processing.
    """
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
        if effort != "flash":
            background_tasks.add_task(store_chat_title, session_id, message)
        is_new_session = True
    else:
        # Fetch existing messages once — used both to verify the session
        # exists and as conversation history for the CEO.
        history = get_chats_in_session(session_id)
        if not history:
            logger.warning("Session %s not found — creating new session", session_id)
            session_id = str(uuid4())
            title = "New Chat"
            create_chat_session(session_id, company_id, title=title)
            if effort != "flash":
                background_tasks.add_task(store_chat_title, session_id, message)
            is_new_session = True
            history = []
        else:
            title = None  # existing session already has a title

    add_message_to_session(session_id, "user", message)

    # ── MCQ abuse guard ──
    # If the CEO has already asked too many questions in this session,
    # inject a hard system directive into the message to force execution.
    mcq_count = _count_mcqs_in_history(history)
    ceo_message = message
    if mcq_count >= _MAX_MCQ_PER_SESSION:
        logger.warning(
            "MCQ limit reached (%d/%d) for session_id=%s — injecting execution directive",
            mcq_count, _MAX_MCQ_PER_SESSION, session_id,
        )
        ceo_message = (
            f"[SYSTEM DIRECTIVE — READ THIS FIRST]\n"
            f"You have already asked {mcq_count} clarification questions in this session. "
            f"The hard limit is {_MAX_MCQ_PER_SESSION}. "
            f"You MUST execute the task NOW with the information you have. "
            f"Do NOT call ask_mcq_for_user again. Delegate immediately.\n\n"
            f"User message: {message}"
        )

    reply = chat(company_id, ceo_message, history, effort=effort)

    # CEO may return a clarification request (MCQ) instead of a text reply.
    if isinstance(reply, dict) and reply.get("type") == "clarification_request":
        logger.info("CEO returned clarification request for session_id=%s", session_id)
        question = reply.get("question", "")
        options = reply.get("options", [])
        # Store the question so conversation history stays coherent.
        stored_text = question
        if options:
            stored_text += "\n\nOptions: " + " | ".join(options)
        add_message_to_session(session_id, "assistant", stored_text)
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
        if effort != "flash":
            background_tasks.add_task(store_chat_memory, company_id, message, generated_message)
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

    add_message_to_session(session_id, "assistant", reply)
    if effort != "flash":
        background_tasks.add_task(store_chat_memory, company_id, message, reply)

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
