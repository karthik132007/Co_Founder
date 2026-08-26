"""
CRUD for `public.company_credits` — see `schemas/company_credits.sql`.

company_credits:
  company_id bigint PK FK -> companies(id) CASCADE
  credits    numeric(18,4) default 0 check >=0
  created_at / updated_at timestamptz default now()
"""
import json
import logging
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from typing import Any, Dict, Optional

from postgrest.exceptions import APIError

from backend.utils import get_supabase_client

logger = logging.getLogger(__name__)
_client = get_supabase_client()

# ── Redis ─────────────────────────────────────────────────────────────────
_CACHE_TTL = 60


def _get_redis():
    try:
        from backend.db.redis_client import get_redis_client
        return get_redis_client()
    except Exception:
        return None


def _cache_key(company_id: int) -> str:
    return f"company_credits:{company_id}"


def _invalidate(company_id: int) -> None:
    r = _get_redis()
    if r:
        try:
            r.delete(_cache_key(company_id))
        except Exception:
            pass


# ── helpers ─────────────────────────────────────────────────────────────────
_QUANTA = Decimal("0.0001")


def _to_decimal(v: Any) -> Decimal:
    try:
        d = Decimal(str(v))
    except (InvalidOperation, TypeError, ValueError) as e:
        raise ValueError(f"Invalid credits value: {v!r}") from e
    return d.quantize(_QUANTA, rounding=ROUND_HALF_UP)


def _validate_amount(v: Any, allow_zero: bool = True) -> Decimal:
    d = _to_decimal(v)
    if d < 0 or (not allow_zero and d == 0):
        raise ValueError(f"credits must be {'>=0' if allow_zero else '>0'}, got {d}")
    if d >= Decimal("1E14"):
        raise ValueError(f"credits too large: {d}")
    return d


class InsufficientCreditsError(Exception):
    pass


# ── CREATE ──────────────────────────────────────────────────────────────────
def create_company_credits(company_id: int, credits: Any = Decimal("0")) -> Dict[str, Any]:
    """Insert new row. Raises APIError on duplicate PK / FK violation."""
    if not isinstance(company_id, int) or company_id <= 0:
        raise ValueError("company_id must be positive int")
    dec = _validate_amount(credits)
    resp = _client.table("company_credits").insert({"company_id": company_id, "credits": str(dec)}).execute()
    if not resp.data:
        raise RuntimeError(f"Failed to create credits for company_id={company_id}")
    _invalidate(company_id)
    logger.info("credits created company_id=%s credits=%s", company_id, dec)
    return resp.data[0]


# ── READ ────────────────────────────────────────────────────────────────────
def get_company_credits(company_id: int, use_cache: bool = True) -> Optional[Dict[str, Any]]:
    """Return row or None. Redis cached for _CACHE_TTL seconds."""
    if not isinstance(company_id, int) or company_id <= 0:
        raise ValueError("company_id must be positive int")

    if use_cache:
        r = _get_redis()
        if r:
            try:
                cached = r.get(_cache_key(company_id))
                if cached:
                    return json.loads(cached)
            except Exception:
                pass

    resp = _client.table("company_credits").select("*").eq("company_id", company_id).execute()
    if not resp.data:
        return None
    row = resp.data[0]

    if use_cache and (r := _get_redis()):
        try:
            r.setex(_cache_key(company_id), _CACHE_TTL, json.dumps(row, default=str))
        except Exception:
            pass
    return row


# ── UPDATE ──────────────────────────────────────────────────────────────────
def update_company_credits(company_id: int, credits: Any) -> Dict[str, Any]:
    """Set absolute balance. Row must exist."""
    dec = _validate_amount(credits)
    if not get_company_credits(company_id, use_cache=False):
        raise ValueError(f"No credits row for company_id={company_id}")
    resp = (
        _client.table("company_credits")
        .update({"credits": str(dec), "updated_at": datetime.now(timezone.utc).isoformat()})
        .eq("company_id", company_id)
        .execute()
    )
    if not resp.data:
        raise RuntimeError(f"Failed to update credits for company_id={company_id}")
    _invalidate(company_id)
    logger.info("credits set company_id=%s credits=%s", company_id, dec)
    return resp.data[0]


def add_credits(company_id: int, amount: Any) -> Dict[str, Any]:
    """Add amount (>0). Creates row with 0 if missing."""
    dec = _validate_amount(amount, allow_zero=False)
    row = get_company_credits(company_id, use_cache=False)
    if row is None:
        row = create_company_credits(company_id, Decimal("0"))
    new_bal = (_to_decimal(row["credits"]) + dec).quantize(_QUANTA)
    resp = (
        _client.table("company_credits")
        .update({"credits": str(new_bal), "updated_at": datetime.now(timezone.utc).isoformat()})
        .eq("company_id", company_id)
        .execute()
    )
    if not resp.data:
        raise RuntimeError(f"Failed to add credits for company_id={company_id}")
    _invalidate(company_id)
    return resp.data[0]


def deduct_credits(company_id: int, amount: Any) -> Dict[str, Any]:
    """Deduct amount (>0). Raises InsufficientCreditsError if balance < amount."""
    dec = _validate_amount(amount, allow_zero=False)
    row = get_company_credits(company_id, use_cache=False)
    if row is None:
        raise ValueError(f"No credits row for company_id={company_id}")
    bal = _to_decimal(row["credits"])
    if bal < dec:
        raise InsufficientCreditsError(f"balance={bal} required={dec}")
    new_bal = (bal - dec).quantize(_QUANTA)
    try:
        resp = (
            _client.table("company_credits")
            .update({"credits": str(new_bal), "updated_at": datetime.now(timezone.utc).isoformat()})
            .eq("company_id", company_id)
            .execute()
        )
    except APIError as e:
        if getattr(e, "code", None) == "23514":  # check_violation credits >=0 (race)
            raise InsufficientCreditsError("concurrent deduct made balance negative") from e
        raise
    if not resp.data:
        raise RuntimeError(f"Failed to deduct credits for company_id={company_id}")
    _invalidate(company_id)
    return resp.data[0]


# ── DELETE ──────────────────────────────────────────────────────────────────
def delete_company_credits(company_id: int) -> bool:
    """Delete row. Returns False if not found."""
    resp = _client.table("company_credits").select("company_id").eq("company_id", company_id).execute()
    if not resp.data:
        return False
    _client.table("company_credits").delete().eq("company_id", company_id).execute()
    _invalidate(company_id)
    logger.info("credits deleted company_id=%s", company_id)
    return True
