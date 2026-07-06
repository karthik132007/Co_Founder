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

