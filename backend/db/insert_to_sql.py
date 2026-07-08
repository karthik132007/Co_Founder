"""
Database write operations using Supabase REST API (HTTPS).
Replaces SQLAlchemy direct PostgreSQL connections which require IPv6.
"""
from backend.utils import get_supabase_client
from typing import Optional, Dict, Any

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
        return None

    response = _client.table("users").insert({
        "email": email,
        "password": password,
    }).execute()

    if response.data:
        row = response.data[0]
        return _UserResult(id=row["id"], email=row["email"])
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
        return _CompanyResult(id=row["id"], company_name=row["company_name"])
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
    raise RuntimeError("Failed to insert file metadata")


def create_chat_session(session_id: str, company_id: int, title: Optional[str] = None) -> _ChatSessionResult:
    """Create a chat session row and return a lightweight result object."""
    if not session_id:
        raise ValueError("session_id must be provided.")
    if company_id is None:
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
        return _ChatSessionResult(
            session_id=row["session_id"],
            company_id=row["company_id"],
            title=row.get("title"),
        )
    raise RuntimeError("Failed to insert chat session")


def add_message_to_session(session_id: str, role: str, message: str) -> _ChatMessageResult:
    """Add a new message entry to the chat_messages table."""
    if not session_id:
        raise ValueError("session_id must be provided.")
    if role not in {"user", "assistant", "system"}:
        raise ValueError("role must be one of: user, assistant, system")
    if not message:
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
    raise RuntimeError("Failed to insert chat message")
