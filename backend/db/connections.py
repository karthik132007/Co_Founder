
from datetime import datetime
from typing import Any, cast

from backend.utils import get_supabase_client


_client = get_supabase_client()


def put_to_insta_table(
    company_id: int,
    instagram_user_id: str,
    access_token: str,
    expires_at: datetime | str | None = None,
) -> dict[str, Any]:
    data = {
        "company_id": company_id,
        "instagram_user_id": instagram_user_id,
        "access_token": access_token,
    }
    if expires_at is not None:
        data["expires_at"] = expires_at.isoformat() if isinstance(expires_at, datetime) else expires_at

    response = _client.table("instagram_connections").upsert(
        data, on_conflict="company_id"
    ).execute()
    if not response.data:
        raise RuntimeError("Failed to save Instagram connection")
    return cast(dict[str, Any], response.data[0])


def get_from_insta_table(company_id: int) -> dict[str, Any] | None:
    try: 
        response = (
            _client.table("instagram_connections")
            .select("*")
            .eq("company_id", company_id)
            .maybe_single()
            .execute()
        )
        return cast(dict[str, Any] | None, getattr(response, "data", None))
    except Exception as e:
        raise RuntimeError(f"Failed to retrieve Instagram connection: {e}")
