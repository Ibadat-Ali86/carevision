"""Security utilities for authentication, authorization, and audit logging.

This module provides:
- Device token generation and verification (JWT-based)
- Password hashing for sensitive credentials
- Audit logging for HIPAA compliance
- Request validation utilities
"""

from __future__ import annotations

import hashlib
import logging
import re
import time
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

logger = logging.getLogger(__name__)

# ── Password Hashing ────────────────────────────────────────────────────────
# Using bcrypt for secure password hashing (adaptive cost factor)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a password using bcrypt.
    
    Args:
        password: Plain text password
        
    Returns:
        Hashed password string
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash.
    
    Args:
        plain_password: Plain text password to verify
        hashed_password: Previously hashed password
        
    Returns:
        True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


# ── JWT Token Management ────────────────────────────────────────────────────
# Algorithm for JWT signing
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours for device tokens


def create_device_token(
    device_id: str,
    location_code: str,
    device_name: Optional[str] = None,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create a JWT token for device authentication.
    
    Args:
        device_id: Unique device identifier
        location_code: Location code this device is authorized for
        device_name: Optional human-readable device name
        expires_delta: Optional custom expiration time
        
    Returns:
        Signed JWT token string
    """
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    to_encode = {
        "sub": device_id,
        "location_code": location_code,
        "device_name": device_name,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "device_access",
    }
    
    secret_key = settings.device_auth_secret_key.get_secret_value()
    encoded_jwt = jwt.encode(to_encode, secret_key, algorithm=ALGORITHM)
    
    logger.info("Created device token for device=%s, location=%s", device_id, location_code)
    return encoded_jwt


def verify_device_token(token: str) -> Dict[str, Any]:
    """Verify and decode a JWT device token.
    
    Args:
        token: JWT token string to verify
        
    Returns:
        Decoded token payload as dictionary
        
    Raises:
        JWTError: If token is invalid or expired
    """
    try:
        secret_key = settings.device_auth_secret_key.get_secret_value()
        payload = jwt.decode(token, secret_key, algorithms=[ALGORITHM])
        
        device_id: str = payload.get("sub")
        location_code: str = payload.get("location_code")
        token_type: str = payload.get("type")
        
        if device_id is None or location_code is None:
            raise JWTError("Invalid token: missing required claims")
        
        if token_type != "device_access":
            raise JWTError(f"Invalid token type: {token_type}")
        
        return {
            "device_id": device_id,
            "location_code": location_code,
            "device_name": payload.get("device_name"),
            "exp": payload.get("exp"),
        }
        
    except JWTError:
        logger.warning("Invalid or expired device token")
        raise


# ── Input Validation ────────────────────────────────────────────────────────
# Base64 validation pattern (more efficient than regex for large strings)
BASE64_PATTERN = re.compile(r'^[A-Za-z0-9+/]*={0,2}$')


def validate_base64_image(image_b64: str, max_length: int = 10 * 1024 * 1024) -> bool:
    """Validate a base64 image string.
    
    Args:
        image_b64: Base64 encoded image string
        max_length: Maximum allowed length in characters (default: 10MB)
        
    Returns:
        True if valid
        
    Raises:
        ValueError: If validation fails
    """
    if not image_b64:
        raise ValueError("Image data is empty")
    
    if len(image_b64) > max_length:
        raise ValueError(f"Image too large: {len(image_b64)} bytes (max: {max_length})")
    
    # Check for data URI prefix and strip if present
    if image_b64.startswith("data:"):
        if not image_b64.startswith(("data:image/jpeg", "data:image/png")):
            raise ValueError("Only JPEG and PNG images are allowed")
        try:
            image_b64 = image_b64.split(",", 1)[1]
        except IndexError:
            raise ValueError("Invalid data URI format")
    
    # Validate base64 characters
    if not BASE64_PATTERN.match(image_b64):
        raise ValueError("Invalid base64 encoding")
    
    # Check minimum plausible size (at least a few bytes)
    if len(image_b64) < 100:
        raise ValueError("Image too small to be valid")
    
    return True


def sanitize_location_code(location_code: str) -> str:
    """Sanitize and validate a location code.
    
    Args:
        location_code: Raw location code string
        
    Returns:
        Sanitized location code
        
    Raises:
        ValueError: If location code is invalid
    """
    if not location_code:
        raise ValueError("Location code cannot be empty")
    
    # Strip whitespace
    location_code = location_code.strip()
    
    # Length check
    if len(location_code) > 50:
        raise ValueError("Location code too long (max 50 characters)")
    
    # Allow only alphanumeric, spaces, hyphens, underscores
    if not re.match(r'^[\w\s\-]+$', location_code):
        raise ValueError("Location code contains invalid characters")
    
    return location_code


# ── Audit Logging ───────────────────────────────────────────────────────────
class AuditLogger:
    """HIPAA-compliant audit logger for tracking PHI access.
    
    Logs all access to patient data, including:
    - Who accessed the data (device_id)
    - What data was accessed (location_code, record_id)
    - When it was accessed (timestamp)
    - From where (IP address)
    - What action was performed (action)
    """
    
    def __init__(self):
        self.enabled = settings.audit_log_enabled
        self._logger = logging.getLogger("audit")
        
        # Configure dedicated audit logger
        if not self._logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '{"audit": true, "timestamp": "%(asctime)s", '
                '"device_id": "%(device_id)s", "location_code": "%(location_code)s", '
                '"action": "%(action)s", "ip_address": "%(ip_address)s", '
                '"record_id": "%(record_id)s", "status": "%(status)s"}'
            )
            handler.setFormatter(formatter)
            self._logger.addHandler(handler)
            self._logger.setLevel(logging.INFO)
            self._logger.propagate = False
    
    def log_access(
        self,
        device_id: str,
        location_code: str,
        action: str,
        ip_address: str,
        record_id: Optional[str] = None,
        status: str = "success",
    ) -> None:
        """Log an access event for audit trail.
        
        Args:
            device_id: ID of the device making the request
            location_code: Location code being accessed
            action: Action performed (e.g., "READ", "CREATE", "UPDATE", "DELETE")
            ip_address: IP address of the requester
            record_id: Optional specific record ID accessed
            status: Access status ("success" or "failure")
        """
        if not self.enabled:
            return
        
        extra = {
            "device_id": device_id,
            "location_code": location_code,
            "action": action,
            "ip_address": ip_address,
            "record_id": record_id or "N/A",
            "status": status,
        }
        
        self._logger.info("Audit event: %s", action, extra=extra)


# Module-level audit logger instance
audit_logger = AuditLogger()


# ── Security Headers ────────────────────────────────────────────────────────
def get_security_headers() -> Dict[str, str]:
    """Get recommended security headers for responses.
    
    Returns:
        Dictionary of security headers
    """
    return {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    }


# ── Utility Functions ───────────────────────────────────────────────────────
def generate_device_id() -> str:
    """Generate a unique device identifier.
    
    Returns:
        UUID-based device ID string
    """
    return str(uuid.uuid4())


def hash_sensitive_data(data: str) -> str:
    """Create a deterministic hash of sensitive data for logging.
    
    Useful for tracking data without exposing actual values.
    
    Args:
        data: Sensitive data to hash
        
    Returns:
        SHA-256 hash of the data
    """
    return hashlib.sha256(data.encode()).hexdigest()[:16]
