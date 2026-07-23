import logging

from backend.models import CompanyData
import supabase
from backend.utils import get_supabase_client
from typing import Optional, List, Dict, Any

logger = logging.getLogger(__name__)

supabase_client = get_supabase_client()

def get_company_data(company_id: int) -> Optional[CompanyData]:
    response = supabase_client.table("companies").select("*").eq("id", company_id).execute()
    if response.data:
        return response.data[0]
    logger.warning("No company data found for company_id=%s", company_id)
    return None

def get_company_id(user_id: int) -> Optional[int]:
    response = supabase_client.table("companies").select("id").eq("user_id", user_id).execute()
    if response.data:
        cid = response.data[0]["id"]
        return cid
    logger.warning("No company found for user_id=%s", user_id)
    return None

def get_company_by_user(user_id: int) -> Optional[Dict[str, Any]]:
    """Return full company record for a given user_id."""
    response = supabase_client.table("companies").select("*").eq("user_id", user_id).execute()
    if response.data:
        return response.data[0]
    logger.warning("No company record found for user_id=%s", user_id)
    return None

def get_user_files(company_id: int) -> List[Dict[str, Any]]:
    """Return all files for a given company, ordered by newest first."""
    response = (
        supabase_client.table("files")
        .select("*")
        .eq("company_id", company_id)
        .order("created_at", desc=True)
        .execute()
    )
    files = response.data if response.data else []
    return files

def get_file_count(company_id: int) -> int:
    """Return the number of files for a company."""
    response = (
        supabase_client.table("files")
        .select("id", count="exact")
        .eq("company_id", company_id)
        .execute()
    )
    count = response.count if response.count is not None else 0
    return count

def get_dashboard_stats(company_id: int) -> Dict[str, Any]:
    """Aggregate dashboard stats for a company."""
    files = get_user_files(company_id)
    total_files = len(files)
    total_size = sum(f.get("file_size") or 0 for f in files)

    images = sum(1 for f in files if (f.get("mime_type") or "").startswith("image/"))
    documents = sum(1 for f in files if (f.get("mime_type") or "").startswith("application/") or (f.get("mime_type") or "").startswith("text/"))

    stats = {
        "total_files": total_files,
        "total_size_bytes": total_size,
        "images": images,
        "documents": documents,
    }
    return stats

def get_chats_in_session(session_id: str) -> List[Dict[str, Any]]:
    """Return all chat messages for a session, ordered from oldest to newest."""
    response = (
        supabase_client.table("chat_messages")
        .select("*")
        .eq("session_id", session_id)
        .order("created_at", desc=False)
        .execute()
    )
    messages = response.data if response.data else []
    return messages


def get_chat_sessions(company_id: int) -> List[Dict[str, Any]]:
    """Return all chat sessions for a company, ordered by newest first."""
    response = (
        supabase_client.table("chat_sessions")
        .select("*")
        .eq("company_id", company_id)
        .order("created_at", desc=True)
        .execute()
    )
    sessions = response.data if response.data else []
    return sessions
