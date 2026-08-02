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