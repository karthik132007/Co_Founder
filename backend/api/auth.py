import logging

from fastapi import APIRouter, HTTPException, Request
from backend.models import LoginRequest, UserCreate
from backend.db.insert_to_sql import (
    create_user,
    authenticate_user,
    get_user_by_email,
    UserAlreadyExistsError,
)
from backend.security import hash_password
from backend.api.rate_limit import SlidingWindowRateLimiter

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

# ── Rate limiting ────────────────────────────────────────────────────────────
# Sliding-window limiter per client IP. Blocks naive brute-force / signup spam
# on the unauthenticated auth endpoints. `X-Forwarded-For` is honoured so the
# real client IP is used behind a reverse proxy.
_auth_limiter = SlidingWindowRateLimiter(max_attempts=10, window_seconds=60)


@router.post("/login")
def login(user: LoginRequest, request: Request):
    _auth_limiter.check(request)
    # logger.info("Login attempt for email=%s", user.email)
    authenticated = authenticate_user(email=user.email, password=user.password)
    if authenticated:
        logger.info("Login successful for email=%s (id=%s)", user.email, authenticated.id)
        return {"id": authenticated.id, "email": authenticated.email, "message": "Login successful"}
    logger.warning("Login failed for email=%s — invalid credentials", user.email)
    raise HTTPException(status_code=401, detail="Invalid credentials")


@router.post("/signup")
def signup(user: UserCreate, request: Request):
    _auth_limiter.check(request)
    # logger.info("Signup attempt for email=%s", user.email)

    # Check existence BEFORE hashing: argon2 is ~100ms of CPU, so spamming
    # signup with already-registered emails would otherwise be a cheap DoS.
    if get_user_by_email(user.email):
        raise HTTPException(status_code=400, detail="Email already exists")

    hashed_password = hash_password(user.password)
    try:
        created = create_user(email=user.email, password=hashed_password)
    except UserAlreadyExistsError:
        # TOCTOU loser (unique constraint) or double-check hit — same 400.
        raise HTTPException(status_code=400, detail="Email already exists")

    logger.info("Signup successful for email=%s (id=%s)", user.email, created.id)
    return {"id": created.id, "email": created.email, "message": "User created"}