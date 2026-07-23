"""
Database write operations using Supabase REST API (HTTPS).
Replaces SQLAlchemy direct PostgreSQL connections which require IPv6.
"""
import logging

from backend.utils import get_supabase_client
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

_client = get_supabase_client()


class _UserResult:
    """Lightweight object matching the shape callers expect from SQLAlchemy User objects."""
    def __init__(self, id: int, email: str):
        self.id = id
        self.email = email


class _CompanyResult:
    """Lightweight object matching the shape callers expect from SQLAlchemy Company objects."""
    def __init__(self, id: int, company_name: str):
        self.id = id
        self.company_name = company_name


class _FileResult:
    """Lightweight object matching the shape callers expect from SQLAlchemy File objects."""
    def __init__(self, id: int, **kwargs):
        self.id = id
        for k, v in kwargs.items():
            setattr(self, k, v)


class _ChatSessionResult:
    """Lightweight object for chat_sessions rows."""
    def __init__(self, session_id: str, company_id: int, title: Optional[str] = None):
        self.session_id = session_id
        self.company_id = company_id
        self.title = title


class _ChatMessageResult:
    """Lightweight object for chat_messages rows."""
    def __init__(self, id: int, session_id: str, role: str, message: str):
        self.id = id
        self.session_id = session_id
        self.role = role
        self.message = message


def create_user(email: str, password: str) -> Optional[_UserResult]:
    """Create a new user. Returns a user-like object or None if the email already exists."""
    # Check for existing user first
    existing = _client.table("users").select("id").eq("email", email).execute()
    if existing.data:
        logger.warning("User with email=%s already exists", email)
        return None

    response = _client.table("users").insert({
        "email": email,
        "password": password,
    }).execute()

    if response.data:
        row = response.data[0]
        logger.info("User created — id=%s, email=%s", row["id"], row["email"])
        return _UserResult(id=row["id"], email=row["email"])
    logger.error("Failed to create user with email=%s — no data returned", email)
    return None


def get_user_by_email(email: str) -> Optional[_UserResult]:
    """Return a user-like object by email or None."""
    response = _client.table("users").select("*").eq("email", email).execute()
    if response.data:
        row = response.data[0]
        return _UserResult(id=row["id"], email=row["email"])
    return None


def authenticate_user(email: str, password: str) -> Optional[_UserResult]:
    """Authenticate credentials; return user-like object if valid, else None."""
    response = _client.table("users").select("*").eq("email", email).execute()
    if response.data:
        row = response.data[0]
        if row.get("password") == password:
            return _UserResult(id=row["id"], email=row["email"])
        logger.warning("Authentication failed for email=%s — password mismatch", email)
    else:
        logger.warning("Authentication failed for email=%s — user not found", email)
    return None


def create_company(
    company_name: str,
    small_description: str,
    industry: str,
    user_id: int,
    tone: str = None,
) -> Optional[_CompanyResult]:
    """Create a company associated with a user. Returns company-like object or None on failure."""
    payload: Dict[str, Any] = {
        "company_name": company_name,
        "small_description": small_description,
        "industry": industry,
        "user_id": user_id,
    }
    if tone:
        payload["tone"] = tone

    response = _client.table("companies").insert(payload).execute()
    if response.data:
        row = response.data[0]
        logger.info("Company created — id=%s, name=%s", row["id"], row["company_name"])
        return _CompanyResult(id=row["id"], company_name=row["company_name"])
    logger.error("Failed to create company — name=%s, user_id=%s", company_name, user_id)
    return None


def add_meta_to_file(
    company_id: int,
    file_name: str,
    original_file_name: str,
    storage_path: str,
    mime_type: str,
    bucket_name: str = "company_files",
    description: str = None,
    file_extension: str = None,
    file_size: int = None,
    status: str = "ready",
) -> _FileResult:
    """Insert file metadata into the files table. Returns a file-like object or raises on failure."""
    payload: Dict[str, Any] = {
        "company_id": company_id,
        "file_name": file_name,
        "original_file_name": original_file_name,
        "storage_path": storage_path,
        "mime_type": mime_type,
        "bucket_name": bucket_name,
        "status": status,
    }
    if description:
        payload["description"] = description
    if file_extension:
        payload["file_extension"] = file_extension
    if file_size is not None:
        payload["file_size"] = file_size

    response = _client.table("files").insert(payload).execute()
    if response.data:
        row = response.data[0]
        logger.info("File metadata inserted — id=%s, file_name=%s", row["id"], row.get("file_name"))
        return _FileResult(
            id=row["id"],
            company_id=row.get("company_id"),
            file_name=row.get("file_name"),
            original_file_name=row.get("original_file_name"),
            storage_path=row.get("storage_path"),
            mime_type=row.get("mime_type"),
            bucket_name=row.get("bucket_name"),
            description=row.get("description"),
            file_extension=row.get("file_extension"),
            file_size=row.get("file_size"),
            status=row.get("status"),
        )
    logger.error("Failed to insert file metadata — file_name=%s", file_name)
    raise RuntimeError("Failed to insert file metadata")


def add_document_chunks(
    file_id: int,
    company_id: int,
    chunks: list[Dict[str, Any]],
    original_file_name: str = None,
    mime_type: str = None,
) -> list[Dict[str, Any]]:
    """Insert embedded document chunks into the document_chunks table."""
    if not chunks:
        return []

    rows = []
    for chunk in chunks:
        metadata: Dict[str, Any] = {}
        if original_file_name:
            metadata["original_file_name"] = original_file_name
        if mime_type:
            metadata["mime_type"] = mime_type
        if chunk.get("file_path"):
            metadata["file_path"] = chunk["file_path"]

        row: Dict[str, Any] = {
            "file_id": file_id,
            "company_id": company_id,
            "chunk_index": chunk["chunk_index"],
            "chunk_text": chunk["chunk_text"],
            "embedding": chunk.get("embedding"),
        }
        if metadata:
            row["metadata"] = metadata
        rows.append(row)

    response = _client.table("document_chunks").insert(rows).execute()
    inserted = response.data if response.data else []
    logger.info("%d document chunks inserted for file_id=%s", len(inserted), file_id)
    return inserted

def create_chat_session(session_id: str, company_id: int, title: Optional[str] = None) -> _ChatSessionResult:
    """Create a chat session row and return a lightweight result object."""
    if not session_id:
        logger.error("session_id must be provided")
        raise ValueError("session_id must be provided.")
    if company_id is None:
        logger.error("company_id must be provided")
        raise ValueError("company_id must be provided.")

    payload: Dict[str, Any] = {
        "session_id": session_id,
        "company_id": company_id,
    }
    if title is not None:
        payload["title"] = title

    response = _client.table("chat_sessions").insert(payload).execute()
    if response.data:
        row = response.data[0]
        logger.info("Chat session created — session_id=%s, company_id=%s", row["session_id"], row["company_id"])
        return _ChatSessionResult(
            session_id=row["session_id"],
            company_id=row["company_id"],
            title=row.get("title"),
        )
    logger.error("Failed to insert chat session — session_id=%s", session_id)
    raise RuntimeError("Failed to insert chat session")


def update_chat_session_title(session_id: str, title: str) -> Optional[_ChatSessionResult]:
    """Update a chat session title and return the updated lightweight session object."""
    if not session_id:
        logger.error("session_id must be provided")
        raise ValueError("session_id must be provided.")
    if not title:
        logger.error("title must be provided")
        raise ValueError("title must be provided.")

    response = (
        _client.table("chat_sessions")
        .update({"title": title})
        .eq("session_id", session_id)
        .execute()
    )
    if response.data:
        row = response.data[0]
        logger.info("Chat session title updated — session_id=%s, title=%s", session_id, title)
        return _ChatSessionResult(
            session_id=row["session_id"],
            company_id=row["company_id"],
            title=row.get("title"),
        )
    logger.warning("Chat session %s not found for title update", session_id)
    return None


def add_message_to_session(session_id: str, role: str, message: str) -> _ChatMessageResult:
    """Add a new message entry to the chat_messages table."""
    if not session_id:
        logger.error("session_id must be provided")
        raise ValueError("session_id must be provided.")
    if role not in {"user", "assistant", "system"}:
        logger.error("Invalid role: %s", role)
        raise ValueError("role must be one of: user, assistant, system")
    if not message:
        logger.error("message must be provided for session_id=%s", session_id)
        raise ValueError("message must be provided.")

    payload: Dict[str, Any] = {
        "session_id": session_id,
        "role": role,
        "message": message,
    }

    response = _client.table("chat_messages").insert(payload).execute()
    if response.data:
        row = response.data[0]
        return _ChatMessageResult(
            id=row["id"],
            session_id=row["session_id"],
            role=row["role"],
            message=row["message"],
        )
    logger.error("Failed to insert chat message for session_id=%s", session_id)
    raise RuntimeError("Failed to insert chat message")
