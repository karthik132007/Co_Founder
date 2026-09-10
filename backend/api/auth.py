import json
import logging
import os
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import RedirectResponse
import urllib.parse

from backend.models import LoginRequest, UserCreate, GoogleLoginRequest
from backend.db.insert_to_sql import (
    create_user,
    authenticate_user,
    get_user_by_email,
    get_user_by_id,
    find_or_create_google_user,
    GoogleEmailConflictError,
    UserAlreadyExistsError,
)
from backend.db.redis_client import get_redis_client
from backend.security import hash_password, create_session_token, verify_session_token
from backend.api.rate_limit import SlidingWindowRateLimiter
from backend.utils import get_supabase_client
from backend.db.get_from_sql import get_company_id
from connections.instagram_connection_manager import Instagram_Connection_Manager
from supabase_auth.errors import (
    AuthApiError,
    AuthInvalidJwtError,
    AuthRetryableError,
)

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
# Google sign-in still creates accounts, so it is rate-limited too (more
# lenient — a valid Supabase token is required, which is already verified).
_google_limiter = SlidingWindowRateLimiter(max_attempts=20, window_seconds=60)

_supabase_client = get_supabase_client()

_redis_client = get_redis_client()

# ── Session cookie ────────────────────────────────────────────────────────────
# On a successful login/signup we set an httpOnly cookie holding a signed,
# expiring session token. The browser stores it and sends it back automatically;
# the frontend then calls GET /auth/me to restore the session (auto-login) on
# the next visit. `SESSION_COOKIE_SECURE` must be true in production (HTTPS).
_SESSION_COOKIE_NAME = "cofounder_session"
_SESSION_COOKIE_SECURE = os.getenv("SESSION_COOKIE_SECURE", "false").lower() == "true"
_SESSION_MAX_AGE_SECONDS = int(os.getenv("SESSION_MAX_AGE_DAYS", "30")) * 86400


def _session_cookie_kwargs(value: str) -> dict:
    return {
        "key": _SESSION_COOKIE_NAME,
        "value": value,
        "max_age": _SESSION_MAX_AGE_SECONDS,
        "path": "/",
        "httponly": True,
        "samesite": "lax",
        "secure": _SESSION_COOKIE_SECURE,
    }


def _onboarding_complete(user_id: int) -> bool:
    """Whether the user has finished onboarding (i.e. created a company).

    Used by login flows so a returning user who signed up but never completed
    onboarding is sent back to /onboarding instead of a company-less app.
    """
    return get_company_id(user_id) is not None


@router.post("/login")
def login(user: LoginRequest, request: Request, response: Response):
    _auth_limiter.check(request)
    # logger.info("Login attempt for email=%s", user.email)
    authenticated = authenticate_user(email=user.email, password=user.password)
    if authenticated:
        logger.info("Login successful for email=%s (id=%s)", user.email, authenticated.id)
        response.set_cookie(**_session_cookie_kwargs(create_session_token(authenticated.id)))
        return {
            "id": authenticated.id,
            "email": authenticated.email,
            "onboarding_complete": _onboarding_complete(authenticated.id),
            "message": "Login successful",
        }
    logger.warning("Login failed for email=%s — invalid credentials", user.email)
    raise HTTPException(status_code=401, detail="Invalid credentials")


@router.post("/signup")
def signup(user: UserCreate, request: Request, response: Response):
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
    response.set_cookie(**_session_cookie_kwargs(create_session_token(created.id)))
    return {"id": created.id, "email": created.email, "message": "User created"}


def _extract_google_name(user) -> str | None:
    """Best-effort display name from Supabase user metadata (never trusted)."""
    metadata = user.user_metadata or {}
    name = metadata.get("full_name") or metadata.get("name") or None
    return str(name).strip() if name else None


def _instagram_redirect_uri(request: Request) -> str:
    """Resolve the Instagram OAuth `redirect_uri`.

    This MUST exactly match a redirect URI registered on the Instagram/Meta
    app. The explicit `INSTAGRAM_REDIRECT_URI` env wins — in production the
    API lives behind the `/api` proxy path, so it must be the full public URL
    (e.g. `https://get-cofounder.tech/api/auth/instagram/callback`). When the
    env is unset (local dev), the URL is reconstructed from the incoming
    request, honouring `X-Forwarded-*` headers set by reverse proxies.
    """
    configured = os.getenv("INSTAGRAM_REDIRECT_URI")
    if configured:
        return configured

    scheme = request.headers.get("x-forwarded-proto") or request.url.scheme
    host = request.headers.get("x-forwarded-host") or request.headers.get("host") or "localhost:8000"
    prefix = request.headers.get("x-forwarded-prefix", "")
    return f"{scheme}://{host}{prefix}/auth/instagram/callback"


@router.get("/instagram/login")
async def instagram_login(
    request: Request,
    company_id: int,
    redirect_to: str | None = None,
):
    """Start the Instagram OAuth handshake.

    Redirects the browser to Instagram's authorization screen. `company_id`
    is the company to bind the resulting token to, and `redirect_to` (when
    provided) is the frontend URL the browser is sent back to after the
    callback completes — the callback appends `?instagram=connected` or
    `?instagram=error&detail=…` to it.
    """
    if not company_id:
        raise HTTPException(status_code=400, detail="Company ID is required")

    client_id = os.getenv("INSTAGRAM_APP_ID")
    redirect_uri = _instagram_redirect_uri(request)
    if not client_id:
        logger.error("Instagram OAuth config missing — INSTAGRAM_APP_ID not set")
        raise HTTPException(status_code=500, detail="Instagram integration is not configured")

    state = secrets.token_urlsafe(32)
    state_payload = json.dumps(
        {"company_id": str(company_id), "redirect_to": redirect_to}
    )
    _redis_client.setex(
        f"instagram_oauth:{state}",
        600,
        state_payload,
    )
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": ",".join([
            "instagram_business_basic",
            "instagram_business_content_publish",
            "instagram_business_manage_comments",
            "instagram_business_manage_messages",
        ]),
        "state": state,
    }

    url = (
        "https://www.instagram.com/oauth/authorize?"
        + urllib.parse.urlencode(params)
    )
    return RedirectResponse(url)

@router.get("/instagram/callback")
async def instagram_callback(
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    error_reason: str | None = None,
    error_description: str | None = None,
):
    """Instagram OAuth callback.

    Instagram redirects back here after the user approves or denies the
    authorization request. On denial it returns `error`/`error_reason`/
    `error_description` (no `code`), which must not 422.

    On completion the browser is redirected back to the frontend plugins
    page (the `redirect_to` captured at login, or FRONTEND_URL as a
    fallback) with `?instagram=connected|error` so the UI can show the
    outcome instead of landing on a raw JSON response.
    """
    def _plugin_redirect(redirect_to: str | None, **params: str) -> RedirectResponse:
        # `redirect_to` is already the full plugins page URL (e.g.
        # http://localhost:3000/plugins) supplied by the frontend at login time.
        # Only fall back to building one from FRONTEND_URL when it is absent.
        base = redirect_to or f"{(os.getenv('FRONTEND_URL') or 'http://localhost:3000').rstrip('/')}/plugins"
        qs = urllib.parse.urlencode(params)
        return RedirectResponse(url=f"{base.rstrip('/')}?{qs}")

    # Resolve the state payload first so we can redirect the user back to the
    # exact frontend URL they came from, even on early failures.
    redirect_to: str | None = None
    company_id: str | None = None
    if state:
        state_key = f"instagram_oauth:{state}"
        raw_state = _redis_client.get(state_key)
        _redis_client.delete(state_key)
        if raw_state:
            raw_state_str = (
                raw_state.decode("utf-8")
                if isinstance(raw_state, bytes)
                else raw_state
            )
            try:
                state_data = json.loads(raw_state_str)
                if isinstance(state_data, dict):
                    redirect_to = state_data.get("redirect_to") or None
                    company_id = state_data.get("company_id") or None
                else:
                    # Legacy state payloads stored the raw company_id string.
                    company_id = raw_state_str
            except (ValueError, TypeError):
                company_id = raw_state_str

    if error:
        logger.warning(
            "Instagram OAuth denied — error=%s, reason=%s, description=%s",
            error, error_reason, error_description,
        )
        return _plugin_redirect(
            redirect_to,
            instagram="error",
            detail=error_description or error or "Instagram authorization failed",
        )

    if not code:
        return _plugin_redirect(redirect_to, instagram="error", detail="Authorization code is required")

    if not state or company_id is None:
        return _plugin_redirect(redirect_to, instagram="error", detail="Invalid or expired OAuth state")

    manager = Instagram_Connection_Manager()
    try:
        short_token = await manager.exchange_instagram_code(code)
        access_token = short_token.get("access_token")
        instagram_user_id = short_token.get("user_id")
        if not access_token or not instagram_user_id:
            raise ValueError("Instagram token response is incomplete")

        token = await manager.get_long_lived_token(access_token)
        expires_in = token.get("expires_in")
        token_data = {
            "access_token": token.get("access_token", access_token),
            "user_id": instagram_user_id,
            "expires_at": (
                datetime.now(timezone.utc) + timedelta(seconds=int(expires_in))
                if expires_in is not None else None
            ),
        }
        manager.store_instagram_access_token_in_db(int(company_id), token_data)
    except (ValueError, TypeError) as exc:
        logger.warning("Instagram OAuth returned invalid data: %s", exc)
        return _plugin_redirect(redirect_to, instagram="error", detail="Instagram authorization failed")
    except Exception:
        logger.exception("Instagram OAuth token exchange failed")
        return _plugin_redirect(redirect_to, instagram="error", detail="Instagram authorization failed")

    return _plugin_redirect(redirect_to, instagram="connected")

@router.post("/google")
def google_login(payload: GoogleLoginRequest, request: Request, response: Response):
    """Google OAuth sign-in.

    Receives the Supabase access token from the /auth/callback page, verifies
    it against Supabase Auth, then finds/creates the matching `public.users`
    row and returns the same shape as /auth/login (id + email) plus `is_new`.

    Security: the browser is never trusted for email/name/user-id. Only the
    Supabase-verified identity is used. The access token is never logged.
    """
    _google_limiter.check(request)

    access_token = payload.access_token

    # 1. Verify the token with Supabase Auth → authenticated Supabase user.
    try:
        user_response = _supabase_client.auth.get_user(access_token)
    except (AuthApiError, AuthInvalidJwtError):
        logger.warning("Google sign-in rejected — invalid/expired Supabase token")
        raise HTTPException(status_code=401, detail="Invalid or expired authentication token")
    except AuthRetryableError:
        logger.warning("Google sign-in — Supabase Auth temporarily unavailable")
        raise HTTPException(status_code=502, detail="Could not verify authentication token")
    except Exception:
        logger.exception("Google sign-in failed while verifying Supabase token")
        raise HTTPException(status_code=502, detail="Could not verify authentication token")

    if user_response is None or user_response.user is None:
        logger.warning("Google sign-in rejected — Supabase returned no user")
        raise HTTPException(status_code=401, detail="Invalid or expired authentication token")

    supabase_user = user_response.user
    email = (supabase_user.email or "").strip().lower()
    if not email:
        logger.warning("Google sign-in rejected — Supabase user has no email (id=%s)", supabase_user.id)
        raise HTTPException(status_code=400, detail="Google account has no email address")

    supabase_user_id = supabase_user.id
    name = _extract_google_name(supabase_user)

    # 2. Find or create the corresponding application user.
    try:
        app_user = find_or_create_google_user(
            supabase_user_id=supabase_user_id,
            email=email,
            name=name,
        )
    except GoogleEmailConflictError:
        logger.warning(
            "Google sign-in blocked for email=%s — email/password account exists (no auto-merge)",
            email,
        )
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists. Please sign in with your email and password.",
        )

    logger.info(
        "Google sign-in successful — id=%s, email=%s, is_new=%s",
        app_user.id, app_user.email, app_user.is_new,
    )
    response.set_cookie(**_session_cookie_kwargs(create_session_token(app_user.id)))
    return {
        "id": app_user.id,
        "email": app_user.email,
        "name": app_user.name,
        "is_new": app_user.is_new,
        "onboarding_complete": _onboarding_complete(app_user.id),
        "message": "Login successful",
    }


@router.get("/me")
def me(request: Request):
    """Restore the logged-in user from the session cookie.

    The frontend calls this on load: the browser sends the cookie automatically,
    and if it's valid the user is redirected straight to the app (dashboard or
    onboarding) without re-entering credentials.
    """
    token = request.cookies.get(_SESSION_COOKIE_NAME)
    user_id = verify_session_token(token) if token else None
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")

    row = get_user_by_id(user_id)
    if not row:
        logger.warning("Session cookie references unknown user id=%s", user_id)
        raise HTTPException(status_code=401, detail="Not authenticated")

    return {
        "id": int(row["id"]),
        "email": str(row.get("email") or ""),
        "name": str(row.get("name") or "") or None,
        "onboarding_complete": _onboarding_complete(int(row["id"])),
        "message": "Session restored",
    }


@router.post("/logout")
def logout(response: Response):
    """Clear the session cookie (best-effort; deleting an absent cookie is fine)."""
    response.delete_cookie(
        _SESSION_COOKIE_NAME,
        path="/",
        httponly=True,
        samesite="lax",
        secure=_SESSION_COOKIE_SECURE,
    )
    return {"status": "ok", "message": "Logged out"}