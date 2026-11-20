import hashlib
import os
import hmac
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import jwt
from app.config import settings

# Number of PBKDF2 iterations for secure password hashing
PBKDF2_ITERATIONS = 100_000


def hash_password(password: str) -> str:
    """Hash a plaintext password securely using PBKDF2-HMAC-SHA256 with a random salt."""
    salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        PBKDF2_ITERATIONS,
    )
    return f"{salt.hex()}${key.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against the stored PBKDF2-HMAC-SHA256 hash."""
    try:
        salt_hex, key_hex = hashed_password.split("$", 1)
        salt = bytes.fromhex(salt_hex)
        expected_key = bytes.fromhex(key_hex)
        new_key = hashlib.pbkdf2_hmac(
            "sha256",
            plain_password.encode("utf-8"),
            salt,
            PBKDF2_ITERATIONS,
        )
        return hmac.compare_digest(new_key, expected_key)
    except Exception:
        return False


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate a JWT access token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except (jwt.PyJWTError, Exception):
        return None


def generate_numeric_code(length: int = 6) -> str:
    """Generate a cryptographically secure numeric verification or reset code."""
    import secrets
    return "".join(secrets.choice("0123456789") for _ in range(length))


def hash_token_code(code: str) -> str:
    """Hash a numeric code using SHA-256 before persisting."""
    return hashlib.sha256(code.strip().encode("utf-8")).hexdigest()


def verify_token_code(plain_code: str, hashed_code: str) -> bool:
    """Verify a user-provided numeric code against its stored hash."""
    computed_hash = hash_token_code(plain_code)
    return hmac.compare_digest(computed_hash, hashed_code)

