"""Encryption-at-rest for connector credentials.

OAuth grants are the most sensitive rows in the database: a Google refresh token
can read a founder's mail and spreadsheets, and the Instagram token can publish
to their account. `backend/db/*` therefore seals the credential columns before
they ever reach Postgres and opens them again on read, so every caller (agent
tools, status APIs, the OAuth callback) keeps working with plaintext.

Two algorithms, because the columns have two different jobs:

* **Secrets** (`access_token`, `refresh_token`) — random-nonce AES-256-GCM. Equal
  tokens must not produce equal ciphertext, so every write is padded with fresh
  random bytes. Ciphertext: ``enc:v1:<b64(nonce || ct)>``.
* **Identifiers** (`google_user_id`, `instagram_user_id`) — deterministic
  AES-256-SIV. `instagram_connections` has a unique index on `instagram_user_id`
  ("one Instagram account, one company"), and equality is what makes that index
  mean anything. Plain GCM would give two different ciphertexts for the same
  account and silently neuter the constraint. Ciphertext: ``encid:v1:<b64(ct)>``.

Both algorithms authenticate their purpose via associated data, so an identifier
ciphertext cannot be replayed into a token column.

Configuration
-------------

``TOKEN_ENCRYPTION_KEY`` — 32 random bytes, base64-encoded (generate with
``python -m backend.field_crypto``). A single key is expanded with HKDF-SHA256
into the two independent subkeys above, so there is one thing to store and
rotate. When it is **unset** the app still runs (dev friendliness) but logs a
loud warning and stores credentials unencrypted — set it in any real
deployment. A malformed key raises at import instead, because that is a
configuration error rather than an optional feature being off.

Rollout and rotation
--------------------

Reads are prefix-driven, so existing plaintext rows keep working untouched and
get re-encrypted the next time that connection is written (the OAuth callback
does this on every reconnect). Rotating the key is therefore: set the new key,
then reconnect each connector — values written under the old key cannot be read
with the new one and raise a clear, actionable error naming the connector to
reconnect. `key_fingerprint()` goes into the startup log so it is obvious which
key an instance is holding.
"""

from __future__ import annotations

import base64
import hashlib
import logging
import os

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM, AESSIV
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

logger = logging.getLogger(__name__)

# Versioned so a future algorithm change is a data migration, not a guess.
SECRET_PREFIX = "enc:v1:"
IDENTIFIER_PREFIX = "encid:v1:"

# Purpose binding: AAD is authenticated but not stored, so a value sealed for
# one column cannot be decrypted into another (an id can never masquerade as a
# token, even if both were written under the same key).
_SECRET_AAD = b"cofounder:secret:v1"
_IDENTIFIER_AAD = b"cofounder:identifier:v1"

# HKDF context — a second key-hygiene layer: this key material can only ever
# produce subkeys for this purpose, never for (say) session signing.
_HKDF_INFO_PREFIX = b"cofounder-field-crypto-v1:"

_KEY_ENV_VAR = "TOKEN_ENCRYPTION_KEY"
_EXPECTED_KEY_BYTES = 32


class FieldDecryptionError(RuntimeError):
    """A stored value cannot be opened with the currently configured key."""


def generate_key() -> str:
    """A fresh, correctly sized key for ``TOKEN_ENCRYPTION_KEY``."""
    return base64.urlsafe_b64encode(os.urandom(_EXPECTED_KEY_BYTES)).decode("ascii")


def _material() -> bytes | None:
    """Decode the configured key, or None when encryption is switched off.

    A malformed key is fatal on purpose: silently falling back to plaintext
    because of a typo would defeat the entire point of setting the variable.
    """
    raw = os.getenv(_KEY_ENV_VAR)
    if not raw or not raw.strip():
        return None

    trimmed = raw.strip()
    try:
        material = base64.urlsafe_b64decode(trimmed + "=" * (-len(trimmed) % 4))
    except Exception as exc:
        raise RuntimeError(
            f"{_KEY_ENV_VAR} is not valid base64 — generate one with "
            "`python -m backend.field_crypto`."
        ) from exc

    if len(material) != _EXPECTED_KEY_BYTES:
        raise RuntimeError(
            f"{_KEY_ENV_VAR} must decode to exactly {_EXPECTED_KEY_BYTES} bytes "
            f"(got {len(material)}) — generate one with "
            "`python -m backend.field_crypto`."
        )
    return material


def _derive(material: bytes, purpose: bytes, length: int) -> bytes:
    return HKDF(
        algorithm=hashes.SHA256(),
        length=length,
        salt=None,
        info=_HKDF_INFO_PREFIX + purpose,
    ).derive(material)


_material = _material()

# Captured before the raw material is dropped, and safe to log: a truncated
# SHA-256 says which key is loaded without being reversible.
_fingerprint = "disabled"

if _material is None:
    logger.warning(
        "Connector credentials are stored UNENCRYPTED — %s is not set. Set it "
        "(generate with `python -m backend.field_crypto`) before running this "
        "anywhere real; existing rows stay readable either way.",
        _KEY_ENV_VAR,
    )
    _secrets: AESGCM | None = None
    _identifiers: AESSIV | None = None
else:
    # Copied into the AEAD objects, and the local is dropped so the raw key
    # material does not linger as a module global.
    _secrets = AESGCM(_derive(_material, b"secrets", 32))
    _identifiers = AESSIV(_derive(_material, b"identifiers", 64))
    _fingerprint = hashlib.sha256(_material).hexdigest()[:12]
    del _material


def encryption_enabled() -> bool:
    """Whether new writes are being encrypted (False = plaintext dev mode)."""
    return _secrets is not None


def key_fingerprint() -> str:
    """Short, non-reversible id of the active key, for logs.

    Enough to tell two keys apart during a rotation ("why can't this row be
    read?") without revealing anything usable: the source material is not
    recoverable from a truncated SHA-256 of it.
    """
    return _fingerprint


# ── sealing / opening ────────────────────────────────────────────────────────


def encrypt_secret(value: str | None) -> str | None:
    """Seal a credential column (randomized AES-256-GCM)."""
    if value is None or value == "" or _secrets is None:
        return value

    nonce = os.urandom(12)  # fresh per write: equal tokens never look equal
    sealed = _secrets.encrypt(nonce, str(value).encode("utf-8"), _SECRET_AAD)
    return SECRET_PREFIX + base64.urlsafe_b64encode(nonce + sealed).decode("ascii")


def encrypt_identifier(value: str | int | None) -> str | None:
    """Seal an identifier column (deterministic AES-256-SIV).

    Deterministic so the unique index on `instagram_user_id` keeps enforcing
    "one Instagram account, one company" — the trade-off is that equal inputs
    are visibly equal at rest, which is exactly what a constraint needs and
    acceptable for a non-secret account id.
    """
    if value is None or value == "" or _identifiers is None:
        return value

    sealed = _identifiers.encrypt(str(value).encode("utf-8"), [_IDENTIFIER_AAD])
    return IDENTIFIER_PREFIX + base64.urlsafe_b64encode(sealed).decode("ascii")


def decrypt_value(value: str | None) -> str | None:
    """Open a column written by `encrypt_secret` / `encrypt_identifier`.

    Values without a known prefix are returned unchanged: that is how the rows
    written before this module existed (and the plaintext dev mode) keep
    working — the next write re-seals them.
    """
    if value is None or not isinstance(value, str) or value == "":
        return value

    if value.startswith(SECRET_PREFIX):
        ciphertext = _secrets
        aad = _SECRET_AAD
        payload = value[len(SECRET_PREFIX) :]
        is_secret = True
    elif value.startswith(IDENTIFIER_PREFIX):
        ciphertext = _identifiers
        aad = _IDENTIFIER_AAD
        payload = value[len(IDENTIFIER_PREFIX) :]
        is_secret = False
    else:
        return value  # legacy plaintext

    if ciphertext is None:
        raise FieldDecryptionError(
            f"A stored credential is encrypted, but {_KEY_ENV_VAR} is not set on "
            "this instance — configure the key that was used to write it."
        )

    try:
        raw = base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4))
        if is_secret:
            nonce, body = raw[:12], raw[12:]
            return ciphertext.decrypt(nonce, body, aad).decode("utf-8")
        return ciphertext.decrypt(raw, [aad]).decode("utf-8")
    except InvalidTag as exc:
        raise FieldDecryptionError(
            "A stored connector credential could not be decrypted with the current "
            f"{_KEY_ENV_VAR} (wrong or rotated key). Reconnect that connector from "
            "the Plugins page to re-issue and re-encrypt it."
        ) from exc
    except Exception as exc:
        raise FieldDecryptionError(
            "A stored connector credential is corrupt and could not be read. "
            "Reconnect that connector from the Plugins page."
        ) from exc


if __name__ == "__main__":  # pragma: no cover - developer convenience
    print(generate_key())
