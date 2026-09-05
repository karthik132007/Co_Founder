"""
Payment history endpoints.

Exposes CRUD over `public.payment_history` (see `schemas/payment_history.sql`)
so the billing page can render an invoice-style history of top-ups, and the
payments flow can record completed / failed / refunded attempts.

Auth mirrors the payments module: the signed session cookie is preferred,
falling back to the client-provided `user_id` (the rest of the app already
trusts the frontend this way for /user/* and /credits/*).
"""
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel, Field

from backend.db.payment_history import (
    count_payment_history,
    create_payment_history,
    delete_payment_history,
    get_payment_history,
    get_payment_history_by_id,
    update_payment_history_status,
)
from backend.db.get_from_sql import get_company_id
from backend.security import verify_session_token

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payment-history", tags=["Payment History"])

_SESSION_COOKIE_NAME = "cofounder_session"

_VALID_STATUSES = {"pending", "completed", "failed", "refunded"}


def _resolve_user(request: Request, client_user_id: int | None = None) -> Optional[int]:
    """Resolve the acting user id if we can (session cookie or fallback id)."""
    token = request.cookies.get(_SESSION_COOKIE_NAME)
    session_user = verify_session_token(token) if token else None
    if session_user is not None:
        return session_user
    if client_user_id is not None and client_user_id > 0:
        return client_user_id
    return None


def _require_company(user_id: int, company_id: int) -> None:
    """Ensure the company belongs to the session user (403 otherwise)."""
    owner_id = get_company_id(user_id)
    if owner_id is None or owner_id != company_id:
        logger.warning(
            "Company mismatch user_id=%s requested_company_id=%s owner_company_id=%s",
            user_id, company_id, owner_id,
        )
        raise HTTPException(
            status_code=403, detail="Company does not belong to this user"
        )


# ── CREATE ──────────────────────────────────────────────────────────────────
class CreatePaymentHistoryRequest(BaseModel):
    user_id: int | None = Field(None, gt=0, description="Fallback identity — session cookie preferred")
    company_id: int = Field(..., gt=0)
    amount: float = Field(..., ge=0, description="INR amount (1 credit = ₹1)")
    status: str = Field("completed")
    payment_date: Optional[datetime] = None


@router.post("")
def create_payment_record(req: CreatePaymentHistoryRequest, request: Request):
    """Create a payment_history row (used internally by the payments flow)."""
    user_id = _resolve_user(request, req.user_id)
    if user_id is not None:
        _require_company(user_id, req.company_id)

    try:
        row = create_payment_history(
            company_id=req.company_id,
            amount=req.amount,
            status=req.status,
            payment_date=req.payment_date,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
    except Exception as e:
        logger.exception("Failed to create payment_history for company_id=%s", req.company_id)
        raise HTTPException(status_code=500, detail="Failed to record payment") from e
    return row


# ── READ ────────────────────────────────────────────────────────────────────
@router.get("")
def list_payment_history(
    request: Request,
    company_id: int = Query(..., gt=0),
    user_id: int | None = Query(None, gt=0),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    status: Optional[str] = Query(None),
):
    """List a company's payment history, newest first."""
    user = _resolve_user(request, user_id)
    if user is not None:
        _require_company(user, company_id)

    if status is not None and status not in _VALID_STATUSES:
        raise HTTPException(
            status_code=422,
            detail=f"status must be one of {sorted(_VALID_STATUSES)}",
        )

    try:
        rows = get_payment_history(company_id, limit=limit, offset=offset, status=status)
        total = count_payment_history(company_id, status=status)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
    except Exception as e:
        logger.exception("Failed to list payment_history for company_id=%s", company_id)
        raise HTTPException(status_code=500, detail="Failed to load payment history") from e
    return {"payments": rows, "total": total, "limit": limit, "offset": offset}


@router.get("/{payment_id}")
def get_payment_record(payment_id: int):
    """Fetch a single payment_history row by id."""
    try:
        row = get_payment_history_by_id(payment_id)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
    if row is None:
        raise HTTPException(status_code=404, detail="Payment record not found")
    return row


# ── UPDATE ──────────────────────────────────────────────────────────────────
class UpdatePaymentHistoryRequest(BaseModel):
    status: str = Field(..., description="One of pending, completed, failed, refunded")


@router.patch("/{payment_id}")
def update_payment_record(payment_id: int, req: UpdatePaymentHistoryRequest):
    """Update the status of a payment_history row."""
    try:
        row = update_payment_history_status(payment_id, req.status)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
    except Exception as e:
        logger.exception("Failed to update payment_history id=%s", payment_id)
        raise HTTPException(status_code=500, detail="Failed to update payment record") from e
    return row


# ── DELETE ──────────────────────────────────────────────────────────────────
@router.delete("/{payment_id}")
def delete_payment_record(payment_id: int):
    """Delete a payment_history row."""
    try:
        deleted = delete_payment_history(payment_id)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
    except Exception as e:
        logger.exception("Failed to delete payment_history id=%s", payment_id)
        raise HTTPException(status_code=500, detail="Failed to delete payment record") from e
    if not deleted:
        raise HTTPException(status_code=404, detail="Payment record not found")
    return {"status": "deleted", "id": payment_id}
