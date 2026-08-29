"""
Credit management endpoints (company-level).

These are called by the payments flow (after a payment succeeds) and by the
frontend to read the current balance.  Credits are stored in INR
(1 credit == ₹1 of selling value) — see `backend/db/credits.py`.
"""
import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.db.credits import add_credits, get_company_credits

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/credits", tags=["Credits"])


class AddCreditsRequest(BaseModel):
    company_id: int = Field(..., gt=0, description="Company to credit")
    amount: float = Field(..., gt=0, description="Credits to add (INR, 1 credit = ₹1)")


@router.post("/add")
def add_company_credits(req: AddCreditsRequest):
    """Add credits to a company — call once the payment for *amount* succeeds."""
    try:
        row = add_credits(req.company_id, req.amount)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
    except Exception as e:
        logger.exception("Failed to add credits for company_id=%s", req.company_id)
        raise HTTPException(status_code=500, detail="Failed to add credits") from e
    logger.info("Credits added company_id=%s amount=%s new_balance=%s", req.company_id, req.amount, row.get("credits"))
    return {"company_id": req.company_id, "amount": req.amount, "balance": row.get("credits")}


@router.get("/{company_id}")
def get_company_credit_balance(company_id: int):
    """Return the current credit balance for a company (0 if never credited)."""
    row = get_company_credits(company_id)
    balance = row.get("credits", 0) if row else 0
    return {"company_id": company_id, "balance": balance}
