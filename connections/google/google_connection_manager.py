"""Google OAuth connection manager (Gmail today; Sheets / Drive / Calendar later).

A single Google OAuth client covers every Google connector, so the grant is
stored **once per company** in `google_connections` together with the scopes
Google actually granted. Per-connector "connected" state is derived from those
scopes (`connector_is_connected`), which is what keeps the Plugins grid honest
without a table per provider.

Two consumers:

  * the HTTP layer (`backend/api/connections.py`) — handshake + status;
  * agent-side tools — `get_access_token()` returns a valid bearer token,
    transparently refreshing it before expiry. Tokens never leave the server.
"""

from __future__ import annotations

import logging
import os
import urllib.parse
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx

from backend.db.google_connections import (
    delete_google_connection,
    get_google_connection,
    put_google_connection,
)

logger = logging.getLogger(__name__)

# Google endpoints (OAuth 2.0 for web server apps).
GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"

# Refresh a little before the token actually dies so a long agent run cannot
# start with a token that expires mid-flight.
_EXPIRY_SKEW_SECONDS = 60

# Scopes requested when the user connects a given connector. Least privilege:
# only what that connector's tools need, so the consent screen stays small.
#
# `openid` + `email` are part of EVERY Google connector's request, not just the
# sign-in ones: the shared handshake calls `fetch_userinfo()` to label the
# connection (bound account + `google_user_id`), and that endpoint 401s for an
# access token that carries no identity scope. Dropping them from a connector
# makes the whole exchange look like an "authorization failed" dead end.
GMAIL_SCOPES = [
    "openid",
    "email",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.compose",
]
GOOGLE_SHEETS_SCOPES = [
    "openid",
    "email",
    "https://www.googleapis.com/auth/spreadsheets",
]
CONNECTOR_SCOPES: dict[str, list[str]] = {
    "gmail": GMAIL_SCOPES,
    "google_sheets": GOOGLE_SHEETS_SCOPES,
    # Reserved for the connectors still marked "coming soon" — switching one on
    # is a one-line change here plus its tools (and remember the identity
    # scopes above).
    "google_drive": [
        "openid",
        "email",
        "https://www.googleapis.com/auth/drive",
    ],
    "google_calendar": [
        "openid",
        "email",
        "https://www.googleapis.com/auth/calendar.events",
    ],
}

# Capability scopes a stored grant must contain for a connector to count as
# connected. Identity scopes (`openid`/`email`) are not capabilities, so they
# are intentionally absent.
GOOGLE_CONNECTOR_SCOPES: dict[str, tuple[str, ...]] = {
    "gmail": ("https://www.googleapis.com/auth/gmail.readonly",),
    "google_sheets": ("https://www.googleapis.com/auth/spreadsheets",),
    "google_drive": ("https://www.googleapis.com/auth/drive",),
    "google_calendar": ("https://www.googleapis.com/auth/calendar.events",),
}


def connector_is_connected(scopes: Any, connector_id: str) -> bool:
    """Whether a stored grant covers *connector_id*'s capability scopes."""
    required = GOOGLE_CONNECTOR_SCOPES.get(connector_id)
    if not required or not scopes:
        return False
    granted = set(scopes)
    return all(scope in granted for scope in required)


def _env(name: str) -> str | None:
    """Read an env var, trimmed; empty strings become None."""
    value = os.getenv(name)
    if value is None:
        return None
    trimmed = value.strip()
    return trimmed or None


class Google_Connection_Manager:
    """Owns the Google OAuth handshake and server-side token access.

    Stateless: every call reads/writes `google_connections` through
    `backend/db/google_connections.py`.
    """

    def __init__(self) -> None:
        # `.strip()` because a pasted trailing space or newline is invisible in
        # a log line but breaks Google's byte-exact comparisons — showing up as
        # `redirect_uri_mismatch` (redirect URI) or `invalid_client` (secret).
        self.client_id = _env("GOOGLE_OAUTH_CLIENT_ID")
        self.client_secret = _env("GOOGLE_OAUTH_CLIENT_SECRET")
        # Must match a redirect URI registered on the Google OAuth client and
        # be sent identically on the authorize *and* token requests.
        self.redirect_uri = _env("GOOGLE_OAUTH_REDIRECT_URI")

    @property
    def configured(self) -> bool:
        return not self.missing_config

    @property
    def missing_config(self) -> list[str]:
        """Env vars this manager needs but cannot see.

        Only the *names* are exposed (to the API error message and the startup
        log) so a misconfigured deployment is a one-line fix instead of a
        guess. `GOOGLE_OAUTH_REDIRECT_URI` is not listed: when unset it is
        reconstructed from the incoming request.
        """
        required = {
            "GOOGLE_OAUTH_CLIENT_ID": self.client_id,
            "GOOGLE_OAUTH_CLIENT_SECRET": self.client_secret,
        }
        return [name for name, value in required.items() if not value]

    # ------------------------------------------------------------------
    # handshake
    # ------------------------------------------------------------------

    def build_authorize_url(
        self,
        *,
        redirect_uri: str,
        state: str,
        scopes: list[str],
        login_hint: str | None = None,
    ) -> str:
        """Google consent URL. `access_type=offline` + `prompt=consent` are
        what guarantee a refresh token (Google withholds it otherwise)."""
        params = {
            "client_id": self.client_id or "",
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": " ".join(scopes),
            "state": state,
            "access_type": "offline",
            "prompt": "consent",
            # Incremental authorization: re-connecting for another Google
            # connector keeps the scopes already granted instead of asking the
            # user to re-approve everything from scratch.
            "include_granted_scopes": "true",
        }
        if login_hint:
            params["login_hint"] = login_hint
        return f"{GOOGLE_AUTHORIZE_URL}?{urllib.parse.urlencode(params)}"

    async def exchange_code(self, code: str, redirect_uri: str) -> dict[str, Any]:
        """Swap the authorization code for tokens."""
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": redirect_uri,
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(GOOGLE_TOKEN_URL, data=data)
        response.raise_for_status()
        return response.json()

    async def fetch_userinfo(self, access_token: str) -> dict[str, Any]:
        """Identity behind the grant (`sub` = stable Google user id)."""
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"},
            )
        response.raise_for_status()
        return response.json()

    async def refresh_access_token(self, refresh_token: str) -> dict[str, Any]:
        """Mint a new access token. Google does not return a new refresh token."""
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(GOOGLE_TOKEN_URL, data=data)
        response.raise_for_status()
        return response.json()

    # ------------------------------------------------------------------
    # persistence
    # ------------------------------------------------------------------

    def store_grant(
        self,
        company_id: int,
        token: dict[str, Any],
        userinfo: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Persist a token response (+ identity) as the company's grant."""
        userinfo = userinfo or {}
        scopes = str(token.get("scope") or "").split()
        if not scopes:
            # Google omitted the scope list — keep whatever we already had so a
            # re-connect can never *shrink* a working grant to nothing.
            existing = get_google_connection(company_id) or {}
            scopes = list(existing.get("scopes") or [])

        expires_in = token.get("expires_in")
        expires_at = (
            datetime.now(timezone.utc) + timedelta(seconds=int(expires_in))
            if expires_in is not None
            else None
        )
        return put_google_connection(
            company_id,
            token["access_token"],
            google_user_id=userinfo.get("sub"),
            email=userinfo.get("email"),
            refresh_token=token.get("refresh_token"),
            scopes=scopes,
            expires_at=expires_at,
        )

    def get_connection(self, company_id: int) -> dict[str, Any] | None:
        return get_google_connection(company_id)

    def delete_connection(self, company_id: int) -> bool:
        return delete_google_connection(company_id)

    # ------------------------------------------------------------------
    # agent-side token access
    # ------------------------------------------------------------------

    async def get_access_token(self, company_id: int) -> str:
        """A currently-valid access token for the company, refreshing if needed.

        Raises RuntimeError when the company has no Google connection or the
        grant can no longer be refreshed (the user must reconnect).
        """
        row = get_google_connection(company_id)
        if not row:
            raise RuntimeError(
                f"No Google connection found for company_id {company_id}"
            )

        access_token = row.get("access_token")
        if not access_token:
            raise RuntimeError(
                f"Google connection for company_id {company_id} has no access token"
            )

        if not _is_expiring(row.get("expires_at")):
            return str(access_token)

        refresh_token = row.get("refresh_token")
        if not refresh_token:
            raise RuntimeError(
                "Google connection has expired and cannot be refreshed — "
                "reconnect the connector from the Plugins page"
            )

        logger.info("Refreshing Google access token for company_id=%s", company_id)
        refreshed = await self.refresh_access_token(str(refresh_token))
        self.store_grant(company_id, refreshed)
        return str(refreshed["access_token"])

    async def get_connection_email(self, company_id: int) -> str | None:
        """The Google account bound to the company, if any."""
        row = get_google_connection(company_id)
        if not row:
            return None
        email = row.get("email")
        return str(email) if email else None


def _is_expiring(expires_at: Any) -> bool:
    """True when *expires_at* is inside the refresh skew (or already past).

    Unparsable / missing timestamps are treated as still valid: the stored
    token is used and Google's own 401 is the source of truth, which avoids a
    spurious refresh call on every single request.
    """
    if not expires_at:
        return False
    if isinstance(expires_at, datetime):
        expires = expires_at
    else:
        try:
            expires = datetime.fromisoformat(str(expires_at).replace("Z", "+00:00"))
        except ValueError:
            return False

    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    return expires <= datetime.now(timezone.utc) + timedelta(seconds=_EXPIRY_SKEW_SECONDS)
