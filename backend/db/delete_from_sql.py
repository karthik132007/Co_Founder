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
