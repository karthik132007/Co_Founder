"""
CRUD for `public.payment_history` — see `schemas/payment_history.sql`.

payment_history:
  id            bigint identity PK
  company_id    bigint FK -> companies(id) ON DELETE CASCADE
  amount        numeric(18,4) check >= 0
  status        text check in ('pending','completed','failed','refunded')
  payment_date  timestamptz default now()
  created_at    timestamptz default now()

Every credit top-up / payment attempt is recorded here so the billing page can
render an invoice-style history. The `payment_date` column is the
business-facing timestamp (what the user sees); `created_at` is internal.
"""
import logging
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from typing import Any, Dict, List, Optional

from backend.utils import get_supabase_client

logger = logging.getLogger(__name__)
_client = get_supabase_client()

_VALID_STATUSES = {"pending", "completed", "failed", "refunded"}


def _validate_status(status: str) -> str:
    status = (status or "").strip().lower()
    if status not in _VALID_STATUSES:
        raise ValueError(f"status must be one of {sorted(_VALID_STATUSES)}, got {status!r}")
    return status


def _to_decimal(v: Any) -> Decimal:
    try:
        return Decimal(str(v))
    except (InvalidOperation, TypeError, ValueError) as e:
        raise ValueError(f"Invalid amount: {v!r}") from e


def _validate_amount(v: Any) -> Decimal:
    d = _to_decimal(v)
    if d < 0:
        raise ValueError(f"amount must be >= 0, got {d}")
    return d


def _iso(dt: Optional[datetime]) -> Optional[str]:
    """Normalise an optional datetime to an ISO-8601 UTC string for Postgres."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat()


# ── CREATE ──────────────────────────────────────────────────────────────────
def create_payment_history(
    company_id: int,
    amount: Any,
    status: str = "completed",
    payment_date: Optional[datetime] = None,
) -> Dict[str, Any]:
    """Insert a new payment_history row. Returns the created row."""
    if not isinstance(company_id, int) or company_id <= 0:
        raise ValueError("company_id must be a positive int")
    dec = _validate_amount(amount)
    st = _validate_status(status)

    payload: Dict[str, Any] = {
        "company_id": company_id,
        "amount": str(dec),
        "status": st,
    }
    if payment_date is not None:
        payload["payment_date"] = _iso(payment_date)

    resp = _client.table("payment_history").insert(payload).execute()
    if not resp.data:
        raise RuntimeError(f"Failed to create payment_history for company_id={company_id}")
    logger.info(
        "payment_history created company_id=%s amount=%s status=%s",
        company_id, dec, st,
    )
    return resp.data[0]


# ── READ ────────────────────────────────────────────────────────────────────
def get_payment_history(
    company_id: int,
    limit: int = 50,
    offset: int = 0,
    status: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Return payment history for a company, newest first.

    `limit` is clamped to [1, 200]; `offset` must be >= 0.
    """
    if not isinstance(company_id, int) or company_id <= 0:
        raise ValueError("company_id must be a positive int")
    limit = max(1, min(int(limit), 200))
    offset = max(0, int(offset))

    query = (
        _client.table("payment_history")
        .select("*")
        .eq("company_id", company_id)
        .order("payment_date", desc=True)
        .order("id", desc=True)
        .limit(limit)
        .offset(offset)
    )
    if status is not None:
        query = query.eq("status", _validate_status(status))

    resp = query.execute()
    return resp.data or []


def count_payment_history(
    company_id: int,
    status: Optional[str] = None,
) -> int:
    """Return the number of payment_history rows for a company."""
    if not isinstance(company_id, int) or company_id <= 0:
        raise ValueError("company_id must be a positive int")
    query = (
        _client.table("payment_history")
        .select("id", count="exact")
        .eq("company_id", company_id)
    )
    if status is not None:
        query = query.eq("status", _validate_status(status))
    resp = query.execute()
    return int(resp.count or 0)


def get_payment_history_by_id(payment_id: int) -> Optional[Dict[str, Any]]:
    """Return a single payment_history row by id, or None."""
    if not isinstance(payment_id, int) or payment_id <= 0:
        raise ValueError("payment_id must be a positive int")
    resp = _client.table("payment_history").select("*").eq("id", payment_id).execute()
    return resp.data[0] if resp.data else None


# ── UPDATE ──────────────────────────────────────────────────────────────────
def update_payment_history_status(payment_id: int, status: str) -> Dict[str, Any]:
    """Update the status of a payment_history row. Row must exist."""
    st = _validate_status(status)
    if not get_payment_history_by_id(payment_id):
        raise ValueError(f"No payment_history row for id={payment_id}")
    resp = (
        _client.table("payment_history")
        .update({"status": st})
        .eq("id", payment_id)
        .execute()
    )
    if not resp.data:
        raise RuntimeError(f"Failed to update payment_history id={payment_id}")
    logger.info("payment_history updated id=%s status=%s", payment_id, st)
    return resp.data[0]


# ── DELETE ──────────────────────────────────────────────────────────────────
def delete_payment_history(payment_id: int) -> bool:
    """Delete a payment_history row. Returns False if not found."""
    if not get_payment_history_by_id(payment_id):
        return False
    _client.table("payment_history").delete().eq("id", payment_id).execute()
    logger.info("payment_history deleted id=%s", payment_id)
    return True
