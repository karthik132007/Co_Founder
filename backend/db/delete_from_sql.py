"""
Database delete operations using Supabase REST API (HTTPS).
Replaces SQLAlchemy direct PostgreSQL connections which require IPv6.
"""
from backend.utils import get_supabase_client

_client = get_supabase_client()


def delete_file_by_id(file_id: int) -> bool:
    """Delete a file from the database by ID. Returns True if deleted, False if not found."""
    # First check if the file exists
    check = _client.table("files").select("id").eq("id", file_id).execute()
    if not check.data:
        return False

    _client.table("files").delete().eq("id", file_id).execute()
    return True


def delete_chat_session(session_id: str, company_id: int) -> bool:
    """Delete a chat session and all its messages. Returns True if deleted, False if not found or unauthorized."""
    # Verify the session exists and belongs to the company
    check = (
        _client.table("chat_sessions")
        .select("session_id")
        .eq("session_id", session_id)
        .eq("company_id", company_id)
        .execute()
    )
    if not check.data:
        return False

    # Delete all messages in the session first
    _client.table("chat_messages").delete().eq("session_id", session_id).execute()
    # Delete the session itself
    _client.table("chat_sessions").delete().eq("session_id", session_id).execute()
    return True
