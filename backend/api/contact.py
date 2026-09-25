"""Public contact / support-ticket endpoints — `/contact`.

The `/contact` page lets anyone (logged in or guest) raise a support ticket.
Logged-in founders get the ticket linked to their company so they can track
`raised` → `closed` status from the same page (the "small ticking system").
Guests are stored with a NULL company_id (see
schemas/migrations/allow_guest_tickets.sql).
"""

import logging
import re

from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel, ConfigDict, EmailStr, Field

from backend.api.rate_limit import SlidingWindowRateLimiter
from backend.db.get_from_sql import get_company_id

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/contact", tags=["Contact"])

# Public form — 10 submits / 10 min per IP is generous for humans,
# tight enough to blunt spam bots.
_contact_limiter = SlidingWindowRateLimiter(max_attempts=10, window_seconds=600)
_list_limiter = SlidingWindowRateLimiter(max_attempts=30, window_seconds=60)

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class ContactCreate(BaseModel):
    """Mirrors the `tickets` table write columns: email, title, message.

    `company_id` is never taken from the client — it is resolved server-side
    from `user_id` (NULL for guests). `status` defaults to 'raised' in SQL.
    """

    model_config = ConfigDict(extra="forbid")

    email: EmailStr
    title: str = Field(min_length=3, max_length=200)
    message: str = Field(min_length=10, max_length=5000)
    user_id: int | None = Field(default=None, description="Optional logged-in user id — links the ticket to their company")


def _clean(value: str) -> str:
    # Strip control chars / collapse blank lines so stored tickets stay tidy.
    cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", value).strip()
    return re.sub(r"\n{3,}", "\n\n", cleaned)


@router.post("")
def submit_ticket(body: ContactCreate, request: Request):
    """Raise a support ticket from the public contact form."""
    _contact_limiter.check(request, detail="Too many messages. Please wait a few minutes and try again.")

    from backend.db.insert_to_sql import create_ticket

    title = _clean(body.title)
    message = _clean(body.message)
    email = body.email.strip().lower()

    if not title or not message:
        raise HTTPException(status_code=422, detail="Title and message are required.")
    if not _EMAIL_RE.match(email):
        raise HTTPException(status_code=422, detail="Enter a valid email address.")

    company_id: int | None = None
    if body.user_id:
        # Best-effort link: unknown user or no company yet → guest ticket.
        from backend.db.insert_to_sql import get_user_by_id

        try:
            user_row = get_user_by_id(body.user_id)
        except Exception:
            logger.exception("Contact ticket: user lookup failed — user_id=%s", body.user_id)
            user_row = None
        if user_row:
            try:
                company_id = get_company_id(body.user_id)
            except Exception:
                logger.exception("Contact ticket: company lookup failed — user_id=%s", body.user_id)
                company_id = None

    try:
        ticket = create_ticket(
            company_id=company_id,
            email=email,
            title=title,
            message=message,
        )
    except RuntimeError as exc:
        logger.exception("Failed to store contact ticket — email=%s", email)
        raise HTTPException(status_code=500, detail="Could not save your message. Please try again.") from exc

    logger.info("Contact ticket raised — id=%s, email=%s, company_id=%s", ticket.get("id"), email, company_id)
    return {
        "status": "ok",
        "ticket_id": ticket.get("id"),
        "message": "Message received. We usually reply within 1 business day.",
    }


@router.get("/mine")
def list_my_tickets(request: Request, user_id: int | None = Query(default=None), email: EmailStr | None = Query(default=None), limit: int = Query(default=20, ge=1, le=100)):
    """List tickets for the small ticketing view on /contact.

    Pass `user_id` (preferred — resolves the founder's company) or `email`
    (guest lookup). Returns newest first.
    """
    _list_limiter.check(request)
    from backend.db.get_from_sql import list_tickets_by_company, list_tickets_by_email

    if user_id:
        company_id = get_company_id(user_id)
        if not company_id:
            # No company yet (e.g. pre-onboarding) — fall back to email tickets.
            from backend.db.insert_to_sql import get_user_by_id

            user_row = get_user_by_id(user_id)
            lookup_email = (user_row or {}).get("email") if isinstance(user_row, dict) else None
            tickets = list_tickets_by_email(lookup_email, limit) if lookup_email else []
            return {"tickets": tickets, "total": len(tickets)}
        tickets = list_tickets_by_company(company_id, limit)
        return {"tickets": tickets, "total": len(tickets)}

    if email:
        tickets = list_tickets_by_email(str(email).strip().lower(), limit)
        return {"tickets": tickets, "total": len(tickets)}

    raise HTTPException(status_code=422, detail="Pass user_id or email to list tickets.")
