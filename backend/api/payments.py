"""
Razorpay Standard Checkout payment endpoints.

Flow:
  1. Frontend POSTs /payments/create-order → backend creates a Razorpay order
     and returns { order_id, amount, currency }.
  2. The Razorpay Checkout modal collects payment in the browser (keyed only
     by the public RAZORPAY_KEY_ID — the secret never reaches the client).
  3. Frontend POSTs /payments/verify-payment with
     { razorpay_payment_id, razorpay_order_id, razorpay_signature } → backend
     verifies the HMAC-SHA256 signature and, only on success, credits the
     company's balance (1 credit == ₹1, see `backend/db/credits.py`).

Credentials come from RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET in `.env`.
KEY_SECRET is backend-only and never leaves this module.
"""
import hashlib
import hmac
import logging
import os
import time
from decimal import Decimal

import razorpay
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from razorpay.errors import BadRequestError

from backend.db.credits import add_credits, get_company_credits
from backend.db.get_from_sql import get_company_id
from backend.db.payment_history import create_payment_history
from backend.security import verify_session_token

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["Payments"])

_SESSION_COOKIE_NAME = "cofounder_session"

# Razorpay minimum order amount is ₹1 (100 paise).
_MIN_AMOUNT_PAISE = 100
_CURRENCIES = {"INR", "USD", "EUR", "AED", "GBP"}

# Redis key TTL for the idempotency guard (long past any retry window).
_CREDIT_GUARD_TTL_SECONDS = 86400


# ── helpers ─────────────────────────────────────────────────────────────────
def _razorpay_client() -> razorpay.Client:
    key_id = os.getenv("RAZORPAY_KEY_ID", "").strip()
    key_secret = os.getenv("RAZORPAY_KEY_SECRET", "").strip()
    if not key_id or not key_secret:
        raise RuntimeError("RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not configured")
    return razorpay.Client(auth=(key_id, key_secret))


def _get_redis():
    """Best-effort Redis handle — a Redis outage must not break payments."""
    try:
        from backend.db.redis_client import get_redis_client
        return get_redis_client()
    except Exception:
        return None


def _resolve_user(request: Request, client_user_id: int | None = None) -> int:
    """Resolve the acting user id.

    Prefers the signed session cookie. Falls back to the client-provided
    `user_id` — the rest of the app already trusts the frontend's user_id this
    way (see /user/* and /credits/add), and some login flows only leave a
    localStorage session in the browser, not the httpOnly cookie. Returns 401
    if neither is available.
    """
    token = request.cookies.get(_SESSION_COOKIE_NAME)
    session_user = verify_session_token(token) if token else None
    if session_user is not None:
        return session_user
    if client_user_id is not None and client_user_id > 0:
        return client_user_id
    raise HTTPException(status_code=401, detail="Not authenticated")


def _require_company(user_id: int, company_id: int) -> int:
    """Ensure the company belongs to the session user; return the company id."""
    owner_id = get_company_id(user_id)
    if owner_id is None or owner_id != company_id:
        logger.warning(
            "Company mismatch user_id=%s requested_company_id=%s owner_company_id=%s",
            user_id, company_id, owner_id,
        )
        raise HTTPException(
            status_code=403, detail="Company does not belong to this user"
        )
    return company_id


# ── CREATE ORDER ────────────────────────────────────────────────────────────
class CreateOrderRequest(BaseModel):
    user_id: int | None = Field(None, gt=0, description="Fallback identity — session cookie preferred")
    company_id: int = Field(..., gt=0, description="Company to credit")
    amount: float = Field(..., gt=0, description="Credits to buy (INR, 1 credit = ₹1)")
    currency: str = Field("INR", min_length=3, max_length=3, description="ISO 4217 code")


@router.post("/create-order")
def create_order(req: CreateOrderRequest, request: Request):
    """Create a Razorpay order. Minimum amount is 100 paise (₹1)."""
    user_id = _resolve_user(request, req.user_id)
    _require_company(user_id, req.company_id)

    currency = req.currency.upper()
    if currency not in _CURRENCIES:
        raise HTTPException(status_code=422, detail=f"Unsupported currency: {currency}")

    amount_paise = int(round(req.amount * 100))
    if amount_paise < _MIN_AMOUNT_PAISE:
        raise HTTPException(
            status_code=422,
            detail="Amount must be at least ₹1 (100 paise)",
        )

    receipt = f"credit_{req.company_id}_{int(time.time())}"
    try:
        # The razorpay SDK exposes order.create dynamically — no type stubs.
        order = _razorpay_client().order.create(  # type: ignore[attr-defined]
            {
                "amount": amount_paise,
                "currency": currency,
                "receipt": receipt,
            }
        )
    except BadRequestError as e:
        logger.warning("Razorpay rejected order creation: %s", e)
        raise HTTPException(
            status_code=400, detail=f"Razorpay rejected the order: {e}"
        ) from e
    except Exception as e:
        logger.exception("Failed to create Razorpay order for company_id=%s", req.company_id)
        raise HTTPException(status_code=500, detail="Failed to create payment order") from e

    logger.info(
        "Razorpay order created company_id=%s order_id=%s amount_paise=%s currency=%s",
        req.company_id, order.get("id"), order.get("amount"), order.get("currency"),
    )
    return {
        "order_id": order["id"],
        "amount": order.get("amount", amount_paise),
        "currency": order.get("currency", currency),
    }


# ── VERIFY PAYMENT ──────────────────────────────────────────────────────────
class VerifyPaymentRequest(BaseModel):
    user_id: int | None = Field(None, gt=0, description="Fallback identity — session cookie preferred")
    company_id: int = Field(..., gt=0)
    razorpay_payment_id: str = Field(..., min_length=1)
    razorpay_order_id: str = Field(..., min_length=1)
    razorpay_signature: str = Field(..., min_length=1)


@router.post("/verify-payment")
def verify_payment(req: VerifyPaymentRequest, request: Request):
    """Verify the Razorpay signature and credit the company on success.

    Returns 400 on signature mismatch (payment is NOT credited). Missing
    required fields are rejected by pydantic with 422.
    """
    user_id = _resolve_user(request, req.user_id)
    _require_company(user_id, req.company_id)

    key_secret = os.getenv("RAZORPAY_KEY_SECRET", "").strip()
    if not key_secret:
        logger.error("RAZORPAY_KEY_SECRET not configured — cannot verify payments")
        raise HTTPException(status_code=500, detail="Payment verification is not configured")

    # 1. Signature check: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    expected = hmac.new(
        key_secret.encode("utf-8"),
        f"{req.razorpay_order_id}|{req.razorpay_payment_id}".encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(expected, req.razorpay_signature):
        logger.warning(
            "Payment signature mismatch order_id=%s payment_id=%s",
            req.razorpay_order_id, req.razorpay_payment_id,
        )
        # Record the failed attempt so it shows up in payment history.
        try:
            create_payment_history(req.company_id, 0, status="failed")
        except Exception:
            logger.exception("Failed to record failed payment for company_id=%s", req.company_id)
        raise HTTPException(status_code=400, detail="Payment signature verification failed")

    # 2. Idempotency guard: a payment id is credited exactly once.
    credited_key = f"razorpay_paid:{req.razorpay_payment_id}"
    r = _get_redis()
    if r:
        try:
            claimed = r.set(credited_key, "1", nx=True, ex=_CREDIT_GUARD_TTL_SECONDS)
            if not claimed:
                # Already processed — return success without double-crediting.
                row = get_company_credits(req.company_id, use_cache=False)
                logger.info(
                    "Duplicate verify payment_id=%s — already credited", req.razorpay_payment_id
                )
                return {
                    "status": "paid",
                    "amount": 0,
                    "balance": row.get("credits", 0) if row else 0,
                    "duplicate": True,
                }
        except Exception:
            logger.exception("Redis idempotency guard failed for payment=%s", req.razorpay_payment_id)

    # 3. Authoritative amount from Razorpay — the client cannot lie about it.
    try:
        order = _razorpay_client().order.fetch(  # type: ignore[attr-defined]
            req.razorpay_order_id
        )
    except Exception as e:
        logger.exception("Failed to fetch Razorpay order %s", req.razorpay_order_id)
        raise HTTPException(status_code=500, detail="Failed to confirm payment with Razorpay") from e

    amount_inr = Decimal(str(order.get("amount", 0))) / Decimal(100)

    # 4. Credit the company (creates the balance row at 0 if missing).
    try:
        row = add_credits(req.company_id, amount_inr)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
    except Exception as e:
        logger.exception("Failed to add credits company_id=%s", req.company_id)
        raise HTTPException(status_code=500, detail="Payment verified but failed to add credits") from e

    # 5. Record the completed payment in payment_history (invoice-style list).
    try:
        create_payment_history(req.company_id, amount_inr, status="completed")
    except Exception:
        logger.exception("Failed to record payment_history for company_id=%s", req.company_id)

    logger.info(
        "Payment verified & credited company_id=%s payment_id=%s amount_inr=%s",
        req.company_id, req.razorpay_payment_id, amount_inr,
    )
    return {
        "status": "paid",
        "amount": float(amount_inr),
        "balance": row.get("credits"),
    }
