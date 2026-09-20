
from datetime import datetime
from typing import Any, cast

from backend.field_crypto import (
    FieldDecryptionError,
    decrypt_value,
    encrypt_identifier,
    encrypt_secret,
)
from backend.utils import get_supabase_client


_client = get_supabase_client()

# Sealed on write, opened on read (see backend/field_crypto.py). `instagram_user_id`
# uses deterministic encryption so the unique index on it keeps meaning "one
# Instagram account, one company".
_SECRET_COLUMNS = ("access_token",)
_IDENTIFIER_COLUMNS = ("instagram_user_id",)


def put_to_insta_table(
    company_id: int,
    instagram_user_id: str,
    access_token: str,
    expires_at: datetime | str | None = None,
) -> dict[str, Any]:
    data = {
        "company_id": company_id,
        "instagram_user_id": encrypt_identifier(instagram_user_id),
        "access_token": encrypt_secret(access_token),
    }
    if expires_at is not None:
        data["expires_at"] = expires_at.isoformat() if isinstance(expires_at, datetime) else expires_at

    response = _client.table("instagram_connections").upsert(
        data, on_conflict="company_id"
    ).execute()
    if not response.data:
        raise RuntimeError("Failed to save Instagram connection")
    return _open_row(cast(dict[str, Any], response.data[0]))


def get_from_insta_table(company_id: int) -> dict[str, Any] | None:
    """The company's Instagram connection with credentials decrypted."""
    try: 
        response = (
            _client.table("instagram_connections")
            .select("*")
            .eq("company_id", company_id)
            .maybe_single()
            .execute()
        )
        row = cast(dict[str, Any] | None, getattr(response, "data", None))
        return _open_row(row) if row else None
    except FieldDecryptionError:
        # Already actionable ("reconnect from the Plugins page").
        raise
    except Exception as e:
        raise RuntimeError(f"Failed to retrieve Instagram connection: {e}")


def _open_row(row: dict[str, Any] | None) -> dict[str, Any] | None:
    """Open every sealed column of a row (legacy plaintext passes through)."""
    if not row:
        return row
    for column in (*_SECRET_COLUMNS, *_IDENTIFIER_COLUMNS):
        if row.get(column) is not None:
            try:
                row[column] = decrypt_value(row[column])
            except FieldDecryptionError as exc:
                raise FieldDecryptionError(
                    f"Instagram connection field '{column}': {exc}"
                ) from exc
    return row


def delete_from_insta_table(company_id: int) -> bool:
    """Remove an Instagram connection for a company.

    Returns True when a row was removed, False when there was nothing to
    remove. Raises RuntimeError on unexpected storage errors.
    """
    try:
        response = (
            _client.table("instagram_connections")
            .delete()
            .eq("company_id", company_id)
            .execute()
        )
        return bool(getattr(response, "data", None))
    except Exception as e:
        raise RuntimeError(f"Failed to delete Instagram connection: {e}")
