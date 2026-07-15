from backend.models import CompanyData
import supabase
from backend.utils import get_supabase_client
from typing import Optional, List, Dict, Any

supabase_client = get_supabase_client()

def get_company_data(company_id: int) -> Optional[CompanyData]:
    response = supabase_client.table("companies").select("*").eq("id", company_id).execute()
    return response.data[0] if response.data else None

def get_company_id(user_id: int) -> Optional[int]:
    response = supabase_client.table("companies").select("id").eq("user_id", user_id).execute()
    return response.data[0]["id"] if response.data else None

def get_company_by_user(user_id: int) -> Optional[Dict[str, Any]]:
    """Return full company record for a given user_id."""
    response = supabase_client.table("companies").select("*").eq("user_id", user_id).execute()
    return response.data[0] if response.data else None

def get_user_files(company_id: int) -> List[Dict[str, Any]]:
    """Return all files for a given company, ordered by newest first."""
    response = (
        supabase_client.table("files")
        .select("*")
        .eq("company_id", company_id)
        .order("created_at", desc=True)
        .execute()
    )
    return response.data if response.data else []

def get_file_count(company_id: int) -> int:
    """Return the number of files for a company."""
    response = (
        supabase_client.table("files")
        .select("id", count="exact")
        .eq("company_id", company_id)
        .execute()
    )
    return response.count if response.count is not None else 0

def get_dashboard_stats(company_id: int) -> Dict[str, Any]:
    """Aggregate dashboard stats for a company."""
    files = get_user_files(company_id)
    total_files = len(files)
    # Sum file sizes
    total_size = sum(f.get("file_size") or 0 for f in files)

    # Count by mime type category
    images = sum(1 for f in files if (f.get("mime_type") or "").startswith("image/"))
    documents = sum(1 for f in files if (f.get("mime_type") or "").startswith("application/") or (f.get("mime_type") or "").startswith("text/"))

    return {
        "total_files": total_files,
        "total_size_bytes": total_size,
        "images": images,
        "documents": documents,
    }

def get_chats_in_session(session_id: str) -> List[Dict[str, Any]]:
    """Return all chat messages for a session, ordered from oldest to newest."""
    response = (
        supabase_client.table("chat_messages")
        .select("*")
        .eq("session_id", session_id)
        .order("created_at", desc=False)
        .execute()
    )
    return response.data if response.data else []


def get_chat_sessions(company_id: int) -> List[Dict[str, Any]]:
    """Return all chat sessions for a company, ordered by newest first."""
    response = (
        supabase_client.table("chat_sessions")
        .select("*")
        .eq("company_id", company_id)
        .order("created_at", desc=True)
        .execute()
    )
    return response.data if response.data else []
