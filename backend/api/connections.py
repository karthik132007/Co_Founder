"""Connections API — connector catalog + OAuth handshake lifecycle.

Exposes the status of every integration a company can connect to, and the
connect/disconnect lifecycle for the ones that are implemented:

  * **Instagram** — handshake lives in `backend/api/auth.py`
    (`GET /auth/instagram/login` → Instagram → `GET /auth/instagram/callback`),
    storing the token in `instagram_connections`; this router is the
    read/disconnect surface.
  * **Google (Gmail today)** — handshake lives here at
    `GET /connections/google/gmail/connect` → Google →
    `GET /connections/google/gmail/callback`, storing the grant in
    `google_connections` (one grant per company, shared by every Google
    connector; see `connections/google/google_connection_manager.py`).

Token material never leaves the backend: status payloads only ever expose the
bound account, scopes and timestamps.
"""

import json
import logging
import os
import secrets
import urllib.parse
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import RedirectResponse

from backend.db.connections import get_from_insta_table, delete_from_insta_table
from backend.db.get_from_sql import get_company_id
from backend.db.google_connections import (
    delete_google_connection,
    get_google_connection,
)
from backend.db.redis_client import get_redis_client
from backend.security import verify_session_token
from connections.google.google_connection_manager import (
    CONNECTOR_SCOPES,
    GOOGLE_CONNECTOR_SCOPES,
    Google_Connection_Manager,
    connector_is_connected,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/connections",
    tags=["Connections"],
)

_SESSION_COOKIE_NAME = "cofounder_session"

# OAuth state (company id + return URL) lives in Redis for ten minutes and is
# deleted as soon as the callback consumes it, so a state can never be replayed.
_OAUTH_STATE_TTL_SECONDS = 600

_redis_client = get_redis_client()

# Catalog of integrations the app knows about. Only entries with
# `available=True` have a working OAuth handshake + token store behind them;
# the rest are surfaced so the frontend can render a full grid with
# "coming soon" affordances without hardcoding the list client-side.
_INTEGRATIONS: list[dict[str, Any]] = [
    {
        "id": "instagram",
        "name": "Instagram",
        "description": "Publish content and pull insights from Instagram",
        "available": True,
    },
    {
        "id": "google_sheets",
        "name": "Google Sheets",
        "description": "Sync data and reports from your spreadsheets",
        "available": False,
    },
    {
        "id": "google_drive",
        "name": "Google Drive",
        "description": "Search, read, and upload files instantly",
        "available": False,
    },
    {
        "id": "gmail",
        "name": "Gmail",
        "description": "Draft replies, summarize threads & search your inbox",
        "available": True,
    },
    {
        "id": "google_calendar",
        "name": "Google Calendar",
        "description": "Manage your schedule and coordinate meetings",
        "available": False,
    },
    {
        "id": "google_ads",
        "name": "Google Ads",
        "description": "Monitor campaigns and pull ad performance data",
        "available": False,
    },
    {
        "id": "notion",
        "name": "Notion",
        "description": "Connect your Notion workspace to power workflows",
        "available": False,
    },
    {
        "id": "shopify",
        "name": "Shopify",
        "description": "Orders & sales data",
        "available": False,
    },
]


def _resolve_user(request: Request, user_id: int | None) -> int:
    """Identify the caller: a valid session cookie wins, else the `user_id` param.

    Mirrors `backend/api/payments.py`. When both are supplied and disagree the
    request is rejected — an OAuth handshake must never be started on behalf of
    somebody else's account.
    """
    token = request.cookies.get(_SESSION_COOKIE_NAME)
    verified = verify_session_token(token) if token else None
    if verified is not None:
        if user_id is not None and user_id != verified:
            logger.warning(
                "connections: session cookie (user_id=%s) does not match user_id=%s",
                verified, user_id,
            )
            raise HTTPException(
                status_code=403,
                detail="user_id does not match the authenticated session",
            )
        return verified
    if user_id is not None:
        return user_id
    raise HTTPException(status_code=401, detail="Not authenticated")


def _require_company(user_id: int) -> int:
    """Resolve a user id to its company id, or fail with a helpful message."""
    company_id = get_company_id(user_id)
    if not company_id:
        logger.warning("No company found for user_id=%s", user_id)
        raise HTTPException(
            status_code=404,
            detail="No company found for this user. Complete onboarding first.",
        )
    return company_id


def _plugins_url() -> str:
    return f"{(os.getenv('FRONTEND_URL') or 'http://localhost:3000').rstrip('/')}/plugins"


def _safe_redirect_to(redirect_to: str | None) -> str:
    """Validate the post-OAuth return URL, falling back to the Plugins page.

    `redirect_to` arrives on a redirect that is not itself authenticated, so
    only absolute http(s) URLs are honoured — anything else (`javascript:`,
    `data:`, protocol-relative `//evil.com`) would turn the callback into an
    open-redirect gadget.
    """
    if not redirect_to:
        return _plugins_url()
    parsed = urllib.parse.urlparse(redirect_to)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        logger.warning(
            "Ignoring unsafe redirect_to=%r — falling back to %s",
            redirect_to, _plugins_url(),
        )
        return _plugins_url()
    return redirect_to


def _google_redirect_uri(request: Request) -> str:
    """Resolve the Google OAuth `redirect_uri`.

    Must exactly match a redirect URI registered on the Google OAuth client,
    and must be sent identically on the authorize and token requests. The
    explicit `GOOGLE_OAUTH_REDIRECT_URI` env wins (in production the API lives
    behind the `/api` proxy path); otherwise it is reconstructed from the
    incoming request, honouring `X-Forwarded-*` headers set by reverse proxies.
    """
    configured = os.getenv("GOOGLE_OAUTH_REDIRECT_URI")
    if configured and configured.strip():
        return configured.strip()

    scheme = request.headers.get("x-forwarded-proto") or request.url.scheme
    host = (
        request.headers.get("x-forwarded-host")
        or request.headers.get("host")
        or "localhost:8000"
    )
    prefix = request.headers.get("x-forwarded-prefix", "")
    return f"{scheme}://{host}{prefix}/connections/google/gmail/callback"


def _google_status(company_id: int) -> dict[str, Any]:
    """Build the Google grant status payload for a company.

    Tokens are deliberately NOT included — only the bound account, the granted
    scopes and timestamps. `connected` here means "a Google grant exists";
    whether it covers a *specific* connector is decided by
    `connector_is_connected()`.
    """
    row = get_google_connection(company_id)
    if not row:
        return {"connected": False, "google_email": None, "scopes": []}

    return {
        "connected": True,
        "google_email": row.get("email"),
        "scopes": list(row.get("scopes") or []),
        "expires_at": row.get("expires_at"),
        "created_at": row.get("created_at"),
    }


def _consume_google_state(state: str | None) -> dict[str, Any] | None:
    """Pop the Redis-held Google OAuth state, returning its payload (or None).

    Single-use: the key is deleted as soon as it is read, so a replayed
    callback can never re-bind a token.
    """
    if not state:
        return None

    key = f"google_oauth:{state}"
    try:
        raw = _redis_client.get(key)
        _redis_client.delete(key)
    except Exception:
        logger.exception("Failed to read Google OAuth state from Redis")
        return None

    if not raw:
        return None
    try:
        data = json.loads(raw)
    except (ValueError, TypeError):
        logger.warning("Corrupt Google OAuth state payload")
        return None
    return data if isinstance(data, dict) else None


def _instagram_status(company_id: int) -> dict[str, Any]:
    """Build the Instagram connection status payload for a company.

    The access token is deliberately NOT included — it is a secret that only
    the backend (agent tools) should ever see, never the browser.
    """
    row = get_from_insta_table(company_id)
    if not row:
        return {"connected": False}

    return {
        "connected": True,
        "instagram_user_id": row.get("instagram_user_id"),
        "expires_at": row.get("expires_at"),
        "created_at": row.get("created_at"),
    }


@router.get("")
def list_connections(
    request: Request,
    user_id: int | None = Query(None, description="User ID (fallback when no session cookie)"),
):
    """List every integration and whether the user's company has connected it."""
    company_id = _require_company(_resolve_user(request, user_id))
    google = _google_status(company_id)

    connections: list[dict[str, Any]] = []
    for integration in _INTEGRATIONS:
        item: dict[str, Any] = {
            "id": integration["id"],
            "name": integration["name"],
            "description": integration["description"],
            "available": integration["available"],
            "connected": False,
        }
        if integration["id"] == "instagram":
            item.update(_instagram_status(company_id))
        elif integration["id"] in GOOGLE_CONNECTOR_SCOPES:
            # Google connectors share one grant: "connected" is scope-derived.
            item["connected"] = google["connected"] and connector_is_connected(
                google["scopes"], integration["id"]
            )
            if item["connected"]:
                item["google_email"] = google["google_email"]
        connections.append(item)

    return {"connections": connections}


@router.get("/instagram")
def get_instagram_connection(
    request: Request,
    user_id: int | None = Query(None, description="User ID (fallback when no session cookie)"),
):
    """Status of the company's Instagram connection."""
    company_id = _require_company(_resolve_user(request, user_id))
    return _instagram_status(company_id)


@router.delete("/instagram")
def disconnect_instagram(
    request: Request,
    user_id: int | None = Query(None, description="User ID (fallback when no session cookie)"),
):
    """Remove the company's Instagram connection (revokes our stored token)."""
    company_id = _require_company(_resolve_user(request, user_id))

    try:
        removed = delete_from_insta_table(company_id)
    except RuntimeError as exc:
        logger.exception("Failed to disconnect Instagram for company_id=%s", company_id)
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    if not removed:
        logger.info("No Instagram connection to remove for company_id=%s", company_id)

    return {"status": "disconnected", "company_id": company_id}


# ── Google connectors (Gmail) ────────────────────────────────────────────────
#
# One Google OAuth grant per company covers every Google connector, so:
#   * `GET /connections/google`          → grant status (scopes + connectors)
#   * `DELETE /connections/google`       → revoke the grant entirely
#   * `GET /connections/google/gmail/connect`  → start the handshake (302)
#   * `GET /connections/google/gmail/callback` → finish it, back to /plugins
#
# Disconnecting Gmail removes the shared grant, which is why the disconnect
# lives on `/connections/google` rather than `/connections/google/gmail`.


@router.get("/google")
def get_google_connection_status(
    request: Request,
    user_id: int | None = Query(None, description="User ID (fallback when no session cookie)"),
):
    """Status of the company's Google grant and which connectors it covers."""
    company_id = _require_company(_resolve_user(request, user_id))
    status = _google_status(company_id)
    status["connectors"] = {
        connector_id: connector_is_connected(status.get("scopes"), connector_id)
        for connector_id in GOOGLE_CONNECTOR_SCOPES
    }
    return status


@router.delete("/google")
def disconnect_google(
    request: Request,
    user_id: int | None = Query(None, description="User ID (fallback when no session cookie)"),
):
    """Remove the company's Google grant (disconnects every Google connector)."""
    company_id = _require_company(_resolve_user(request, user_id))

    try:
        removed = delete_google_connection(company_id)
    except RuntimeError as exc:
        logger.exception("Failed to disconnect Google for company_id=%s", company_id)
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    if not removed:
        logger.info("No Google connection to remove for company_id=%s", company_id)

    return {"status": "disconnected", "company_id": company_id}


@router.get("/google/gmail/connect")
def google_gmail_connect(
    request: Request,
    user_id: int | None = Query(None, description="User ID (fallback when no session cookie)"),
    redirect_to: str | None = Query(None, description="Frontend URL to return to after the callback"),
):
    """Start the Gmail OAuth handshake (302 → Google consent screen).

    `user_id` is resolved to the caller's company server-side, so the browser
    can never bind a mailbox to a company it does not own. The company id and
    return URL travel in a short-lived, single-use Redis state instead of the
    query string.

    After the callback the browser lands back on the Plugins page with
    `?gmail=connected` or `?gmail=error&detail=…`.
    """
    company_id = _require_company(_resolve_user(request, user_id))

    manager = Google_Connection_Manager()
    if not manager.configured:
        missing = ", ".join(manager.missing_config)
        logger.error(
            "Gmail connector is not configured — missing env var(s): %s "
            "(see docs/technical.md → Gmail connection flow)",
            missing,
        )
        raise HTTPException(
            status_code=500,
            detail=(
                f"Gmail integration is not configured (missing: {missing}). "
                "Add them to the repo-root .env and restart the backend."
            ),
        )

    # The redirect URI is pinned into the state so the callback reuses the
    # exact same value even if the proxy headers differ between the two legs.
    redirect_uri = _google_redirect_uri(request)
    state = secrets.token_urlsafe(32)
    try:
        _redis_client.setex(
            f"google_oauth:{state}",
            _OAUTH_STATE_TTL_SECONDS,
            json.dumps(
                {
                    "company_id": str(company_id),
                    "connector": "gmail",
                    "redirect_uri": redirect_uri,
                    "redirect_to": _safe_redirect_to(redirect_to),
                }
            ),
        )
    except Exception as exc:
        logger.exception("Failed to store Google OAuth state in Redis")
        raise HTTPException(
            status_code=503, detail="Could not start the connection — try again shortly"
        ) from exc

    logger.info(
        "Starting Gmail OAuth — company_id=%s, redirect_uri=%s", company_id, redirect_uri
    )
    return RedirectResponse(
        manager.build_authorize_url(
            redirect_uri=redirect_uri,
            state=state,
            scopes=CONNECTOR_SCOPES["gmail"],
        )
    )


@router.get("/google/gmail/callback")
async def google_gmail_callback(
    request: Request,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    error_description: str | None = None,
):
    """Gmail OAuth callback.

    Google redirects here after the user approves or denies the request. On
    denial it sends `error`/`error_description` and no `code`, which must not
    422. Either way the browser ends up back on the Plugins page with
    `?gmail=connected` or `?gmail=error&detail=…` so the UI can show the
    outcome instead of rendering raw JSON.
    """
    state_data = _consume_google_state(state)
    redirect_to = (state_data or {}).get("redirect_to")
    company_id = (state_data or {}).get("company_id")

    def _plugin_redirect(**params: str) -> RedirectResponse:
        base = _safe_redirect_to(redirect_to)
        return RedirectResponse(
            url=f"{base.rstrip('/')}?{urllib.parse.urlencode(params)}"
        )

    if error:
        logger.warning(
            "Gmail OAuth denied — error=%s, description=%s", error, error_description
        )
        return _plugin_redirect(
            gmail="error",
            detail=error_description or error or "Gmail authorization failed",
        )

    if not code:
        return _plugin_redirect(gmail="error", detail="Authorization code is required")

    if not state or company_id is None:
        return _plugin_redirect(
            gmail="error", detail="Invalid or expired OAuth state"
        )

    manager = Google_Connection_Manager()
    redirect_uri = (state_data or {}).get("redirect_uri") or _google_redirect_uri(request)
    bound_email: str | None = None
    try:
        token = await manager.exchange_code(code, redirect_uri)
        access_token = token.get("access_token")
        if not access_token:
            raise ValueError("Google token response is missing access_token")

        userinfo = await manager.fetch_userinfo(access_token)
        bound_email = userinfo.get("email")
        manager.store_grant(int(company_id), token, userinfo)
    except (ValueError, TypeError) as exc:
        logger.warning("Gmail OAuth returned invalid data: %s", exc)
        return _plugin_redirect(gmail="error", detail="Gmail authorization failed")
    except httpx.HTTPError as exc:
        logger.warning("Gmail OAuth token exchange failed: %s", exc)
        return _plugin_redirect(gmail="error", detail="Gmail authorization failed")
    except Exception:
        logger.exception("Gmail OAuth token exchange failed")
        return _plugin_redirect(gmail="error", detail="Gmail authorization failed")

    logger.info("Gmail connected — company_id=%s, email=%s", company_id, bound_email)
    return _plugin_redirect(gmail="connected")
