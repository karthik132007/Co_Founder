from fastapi import APIRouter, BackgroundTasks, Form, Query
from fastapi import HTTPException
from main import chat, store_chat_memory, store_chat_title
from backend.db.get_from_sql import get_company_id, get_chats_in_session, get_chat_sessions
from backend.db.insert_to_sql import create_chat_session, add_message_to_session
from backend.db.delete_from_sql import delete_chat_session
from uuid import uuid4
from typing import Optional

router = APIRouter()


@router.post("/chat")
def chat_with_user(
    background_tasks: BackgroundTasks,
    user_id: int = Form(...),
    message: str = Form(...),
    session_id: Optional[str] = Form(None),
):
    company_id = get_company_id(user_id)
    if not company_id:
        raise HTTPException(status_code=404, detail="Company not found")

    is_new_session = False

    # If no session_id provided, create a new session with a title
    if not session_id:
        session_id = str(uuid4())
        title = "New Chat"
        create_chat_session(session_id, company_id, title=title)
        background_tasks.add_task(store_chat_title, session_id, message)
        is_new_session = True
    else:
        # Verify the session exists
        existing = get_chats_in_session(session_id)
        # If session doesn't exist, fall back to creating a new one
        if not existing:
            session_id = str(uuid4())
            title = "New Chat"
            create_chat_session(session_id, company_id, title=title)
            background_tasks.add_task(store_chat_title, session_id, message)
            is_new_session = True
        else:
            title = None  # existing session already has a title

    add_message_to_session(session_id, "user", message)
    reply = chat(company_id, message)

    # CEO may return a clarification request (MCQ) instead of a text reply.
    if isinstance(reply, dict) and reply.get("type") == "clarification_request":
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

    add_message_to_session(session_id, "assistant", reply)
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
    company_id = get_company_id(user_id)
    if not company_id:
        raise HTTPException(status_code=404, detail="Company not found")

    sessions = get_chat_sessions(company_id)
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
    company_id = get_company_id(user_id)
    if not company_id:
        raise HTTPException(status_code=404, detail="Company not found")

    messages = get_chats_in_session(session_id)
    if not messages:
        raise HTTPException(status_code=404, detail="Session not found")

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
    company_id = get_company_id(user_id)
    if not company_id:
        raise HTTPException(status_code=404, detail="Company not found")

    deleted = delete_chat_session(session_id, company_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Session not found")

    return {"status": "success", "message": "Chat session deleted"}
