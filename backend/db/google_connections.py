"""Storage for Google connector OAuth grants (`google_connections`).

One row per company. A single Google consent covers every Google connector, so
the row holds the raw token material plus the scopes Google actually granted;
per-connector status is derived from those scopes higher up (see
`connections/google/google_connection_manager.py`).

Secrets (`access_token`, `refresh_token`) live here and are only ever read by
server-side code — they are never returned by the API. They are sealed with
`backend/field_crypto.py` before the write and opened on read, so callers keep
dealing in plaintext while Postgres only ever stores ciphertext. `email` is left
readable on purpose (it labels the connection in the Plugins grid and carries no
access of its own).
"""

from datetime import datetime, timezone
from typing import Any, cast

from backend.field_crypto import (
    FieldDecryptionError,
    decrypt_value,
    encrypt_identifier,
    encrypt_secret,
)
from backend.utils import get_supabase_client


_client = get_supabase_client()

# Credential columns: sealed on write, opened on read. Keep these lists next to
# each other so a new secret column cannot be added to one and forgotten in the
# other.
_SECRET_COLUMNS = ("access_token", "refresh_token")
_IDENTIFIER_COLUMNS = ("google_user_id",)


def put_google_connection(
    company_id: int,
    access_token: str,
    *,
    google_user_id: str | None = None,
    email: str | None = None,
    refresh_token: str | None = None,
    scopes: list[str] | None = None,
    expires_at: datetime | str | None = None,
) -> dict[str, Any]:
    """Insert or update the company's Google grant.

    Google only returns a `refresh_token` on the *first* consent for a client
    (or when `prompt=consent` forces re-consent, or when the previously granted
    scopes change). When it is missing from a re-connect we deliberately omit
    the column from the upsert so the stored refresh token is preserved instead
    of being overwritten with NULL.

    Returns the stored row. Raises RuntimeError on storage failure.
    """
    data: dict[str, Any] = {
        "company_id": company_id,
        "access_token": encrypt_secret(access_token),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    if google_user_id is not None:
        data["google_user_id"] = encrypt_identifier(google_user_id)
    if email is not None:
        data["email"] = email
    if refresh_token is not None:
        data["refresh_token"] = encrypt_secret(refresh_token)
    if scopes is not None:
        data["scopes"] = scopes
    if expires_at is not None:
        data["expires_at"] = (
            expires_at.isoformat() if isinstance(expires_at, datetime) else expires_at
        )

    try:
        response = _client.table("google_connections").upsert(
            data, on_conflict="company_id"
        ).execute()
    except Exception as exc:
        raise RuntimeError(f"Failed to save Google connection: {exc}") from exc

    if not response.data:
        raise RuntimeError("Failed to save Google connection")
    return _open_row(cast(dict[str, Any], response.data[0]))


def get_google_connection(company_id: int) -> dict[str, Any] | None:
    """The company's Google grant (tokens included), or None if never connected.

    Credentials come back decrypted, so every caller works with plaintext.
    """
    try:
        response = (
            _client.table("google_connections")
            .select("*")
            .eq("company_id", company_id)
            .maybe_single()
            .execute()
        )
        row = cast(dict[str, Any] | None, getattr(response, "data", None))
        return _open_row(row) if row else None
    except FieldDecryptionError:
        # Already actionable ("reconnect from the Plugins page") — do not bury
        # it under a generic storage error.
        raise
    except Exception as exc:
        raise RuntimeError(f"Failed to retrieve Google connection: {exc}") from exc


def _open_row(row: dict[str, Any] | None) -> dict[str, Any] | None:
    """Open every sealed column of a row (legacy plaintext passes through)."""
    if not row:
        return row
    for column in (*_SECRET_COLUMNS, *_IDENTIFIER_COLUMNS):
        if row.get(column) is not None:
            try:
                row[column] = decrypt_value(row[column])
            except FieldDecryptionError as exc:
                raise FieldDecryptionError(f"Google connection field '{column}': {exc}") from exc
    return row


def delete_google_connection(company_id: int) -> bool:
    """Revoke our stored Google grant.

    Returns True when a row was removed, False when there was nothing to
    remove. Raises RuntimeError on unexpected storage errors.
    """
    try:
        response = (
            _client.table("google_connections")
            .delete()
            .eq("company_id", company_id)
            .execute()
        )
        return bool(getattr(response, "data", None))
    except Exception as exc:
        raise RuntimeError(f"Failed to delete Google connection: {exc}") from exc
