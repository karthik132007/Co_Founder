from pwdlib import PasswordHash
from pwdlib.exceptions import UnknownHashError

password_hash = PasswordHash.recommended()

def hash_password(password: str) -> str:
    return password_hash.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    # Fail closed: an empty/missing stored hash must never authenticate, even if
    # the submitted password is also empty. Otherwise a row with a NULL password
    # would let anyone log in with an empty password via the legacy fallback.
    if not hashed:
        return False
    try:
        return password_hash.verify(password, hashed)
    except UnknownHashError:
        # Legacy plaintext fallback for stored values that are not argon2.
        return password == hashed


# ── Session tokens (stateless, signed) ───────────────────────────────────────
#
# Used for the browser session cookie. The token is a URL-safe base64 encoding
# of "<user_id>.<expiry_unix>.<hmac_signature>" where the signature is an
# HMAC-SHA256 over "<user_id>.<expiry_unix>" keyed with SESSION_SECRET. It is
# stateless (no DB table needed) and the browser cannot read or forge it
# (httpOnly cookie).
import base64
import hashlib
import hmac
import os
import time

_SESSION_SECRET = os.getenv("SESSION_SECRET", "cofounder-dev-session-secret-change-me")
_SESSION_MAX_AGE_DAYS = int(os.getenv("SESSION_MAX_AGE_DAYS", "30"))


def _session_sign(payload: str) -> str:
    return hmac.new(
        _SESSION_SECRET.encode("utf-8"),
        payload.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def create_session_token(user_id: int) -> str:
    """Create a signed, expiring session token for the given user id."""
    expiry = int(time.time()) + _SESSION_MAX_AGE_DAYS * 86400
    payload = f"{user_id}.{expiry}"
    raw = f"{payload}.{_session_sign(payload)}"
    return base64.urlsafe_b64encode(raw.encode("utf-8")).decode("ascii")


def verify_session_token(token: str) -> int | None:
    """Validate a session token and return the user id, or None if invalid/expired."""
    try:
        raw = base64.urlsafe_b64decode(token.encode("ascii")).decode("utf-8")
        payload, _, signature = raw.rpartition(".")
        if not payload or not signature:
            return None
        if not hmac.compare_digest(_session_sign(payload), signature):
            return None
        user_id_str, _, expiry_str = payload.partition(".")
        if int(expiry_str) < int(time.time()):
            return None
        return int(user_id_str)
    except Exception:
        return None