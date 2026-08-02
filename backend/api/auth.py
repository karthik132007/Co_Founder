import logging
import time
from collections import defaultdict, deque

from fastapi import APIRouter, HTTPException, Request
from backend.models import LoginRequest, UserCreate
from backend.db.insert_to_sql import (
    create_user,
    authenticate_user,
    get_user_by_email,
    UserAlreadyExistsError,
)
from backend.security import hash_password

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

# ── In-memory sliding-window rate limiter ──────────────────────────────────
# Per process, per client IP. Blocks naive brute-force / signup spam on the
# unauthenticated auth endpoints. Note: when running behind a reverse proxy,
# `request.client.host` is the proxy address — swap in the X-Forwarded-For
# header for multi-worker accuracy.
_AUTH_WINDOW_SECONDS = 60
_AUTH_MAX_ATTEMPTS = 10
_attempts: defaultdict[str, deque[float]] = defaultdict(deque)


def _client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def _rate_limited(client_ip: str) -> bool:
    """Return True if the client has exceeded the attempt budget in the window."""
    now = time.monotonic()
    window = _attempts[client_ip]
    # Drop attempts older than the window.
    while window and now - window[0] > _AUTH_WINDOW_SECONDS:
        window.popleft()
    if len(window) >= _AUTH_MAX_ATTEMPTS:
        return True
    window.append(now)
    return False


@router.post("/login")
def login(user: LoginRequest, request: Request):
    if _rate_limited(_client_ip(request)):
        raise HTTPException(status_code=429, detail="Too many attempts. Try again later.")
    # logger.info("Login attempt for email=%s", user.email)
    authenticated = authenticate_user(email=user.email, password=user.password)
    if authenticated:
        logger.info("Login successful for email=%s (id=%s)", user.email, authenticated.id)
        return {"id": authenticated.id, "email": authenticated.email, "message": "Login successful"}
    logger.warning("Login failed for email=%s — invalid credentials", user.email)
    raise HTTPException(status_code=401, detail="Invalid credentials")


@router.post("/signup")
def signup(user: UserCreate, request: Request):
    if _rate_limited(_client_ip(request)):
        raise HTTPException(status_code=429, detail="Too many attempts. Try again later.")
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