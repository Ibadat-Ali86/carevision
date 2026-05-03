"""
CareVision — Authentication Routes
Phase 5 (Auth System) per carevision-ux-improvements.md

WHY PyJWT over python-jose: Already in requirements.txt (v2.8.0),
actively maintained, avoids an extra dependency.

WHY argon2-cffi for hashing: Already in requirements.txt (v23.1.0).
Argon2id is the OWASP-recommended choice (memory-hard, side-channel resistant)
and superior to bcrypt for new systems. bcrypt is NOT in requirements.

WHY 24-hour access token: CHWs operate in low-connectivity environments.
Short (15-min) tokens would require frequent re-auth in offline/poor-signal
scenarios, degrading the clinical experience. The frontend stores tokens in
IndexedDB (not localStorage) which mitigates XSS risk.

TRADEOFF: Refresh token is stored as a plain opaque string in the DB.
This is simpler than a separate refresh_tokens table and sufficient for
single-device sessions. Multi-device support requires extracting to a
separate table with a device_id column.

Security checklist:
  [x] Inputs validated at boundary (Pydantic schemas)
  [x] Passwords hashed (Argon2id via argon2-cffi)
  [x] No secrets in code (JWT_SECRET_KEY from settings)
  [x] Errors do not leak internal state to callers
  [x] Logging uses anonymized identifiers (user ID, not email in logs)
  [x] Rate limiting applied via existing RateLimitMiddleware (if configured)
"""

from __future__ import annotations

import logging
import secrets
from datetime import datetime, timedelta
from typing import Any

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.session import get_session
from app.db.models import User
from app.schemas.auth import (
    UserRegistration,
    RefreshRequest,
    TokenResponse,
    UserProfile,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Argon2id hasher — memory_cost=65536 (64MB), time_cost=3, parallelism=4
# WHY these params: OWASP Cheat Sheet 2024 recommendation for interactive logins.
_ph = PasswordHasher(
    time_cost=3,
    memory_cost=65536,
    parallelism=4,
    hash_len=32,
    salt_len=16,
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token", auto_error=False)

# ─── Token utilities ─────────────────────────────────────────────────────────

def _create_access_token(user_id: str, role: str) -> str:
    """Issue a signed JWT access token.

    Payload:
      sub  — user UUID (opaque to client)
      role — 'chw' | 'supervisor' | 'admin'
      exp  — UTC expiry (24 h from now)
      iat  — issued-at for audit trails
    """
    now = datetime.utcnow()
    payload: dict[str, Any] = {
        "sub": user_id,
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=24)).timestamp()),
    }
    # PyJWT 2.x: algorithm specified as list
    return jwt.encode(payload, settings.secret_key, algorithm="HS256")


def _create_refresh_token() -> str:
    """Generate a cryptographically secure opaque refresh token (256-bit)."""
    return secrets.token_urlsafe(32)


def _build_token_response(user: User, refresh_token: str) -> TokenResponse:
    access_token = _create_access_token(user.id, user.role)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=86400,  # 24 hours in seconds
        user=UserProfile.model_validate(user),
    )


# ─── Dependency — current authenticated user ─────────────────────────────────

async def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_session),
) -> User:
    """JWT dependency — extracts and verifies caller identity.

    Returns the User ORM object so route handlers can check .role
    and .is_active without an extra DB query.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        user_id: str | None = payload.get("sub")
        if not user_id:
            raise credentials_exception
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        raise credentials_exception

    return user


# ─── Routes ──────────────────────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    payload: UserRegistration,
    db: AsyncSession = Depends(get_session),
) -> TokenResponse:
    """Register a new Community Health Worker account.

    Supervisors and admins register as CHWs and are upgraded by an admin.
    WHY auto-approve CHWs: Removes friction for frontline workers who need
    immediate access in the field. Supervisors require admin approval.
    """
    # Duplicate email check
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists",
        )

    hashed = _ph.hash(payload.password)
    # WHY auto-approve CHWs only: Supervisor/admin roles have broader data access
    is_active = payload.role == "chw"

    user = User(
        email=payload.email,
        hashed_password=hashed,
        full_name=payload.full_name,
        role=payload.role,
        facility_id=payload.facility_id,
        region=payload.region,
        is_active=is_active,
    )
    refresh_token = _create_refresh_token()
    user.refresh_token = refresh_token

    db.add(user)
    await db.commit()
    await db.refresh(user)

    logger.info("New user registered: id=%s role=%s", user.id, user.role)
    return _build_token_response(user, refresh_token)


@router.post("/token", response_model=TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_session),
) -> TokenResponse:
    """OAuth2-compatible login endpoint.

    Uses application/x-www-form-urlencoded (OAuth2 standard).
    WHY OAuth2PasswordRequestForm: Allows standard tooling (Swagger UI,
    Postman OAuth2 helpers) to work without custom configuration.
    """
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()

    # WHY unified error: distinct "user not found" vs "wrong password" messages
    # allow user enumeration attacks.
    invalid_creds = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect email or password",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not user or not user.hashed_password:
        raise invalid_creds

    try:
        _ph.verify(user.hashed_password, form_data.password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        raise invalid_creds

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account pending approval. Contact your supervisor.",
        )

    # Rotate refresh token on every login
    refresh_token = _create_refresh_token()
    user.refresh_token = refresh_token
    await db.commit()

    logger.info("User login: id=%s", user.id)
    return _build_token_response(user, refresh_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_access_token(
    payload: RefreshRequest,
    db: AsyncSession = Depends(get_session),
) -> TokenResponse:
    """Exchange a valid refresh token for a new access token.

    WHY keep same refresh token: Rotation on every refresh creates
    race conditions on mobile networks where the ACK is lost.
    Token is rotated on every login and logout instead.
    """
    result = await db.execute(
        select(User).where(User.refresh_token == payload.refresh_token)
    )
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    logger.info("Token refresh: id=%s", user.id)
    return _build_token_response(user, payload.refresh_token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
) -> None:
    """Invalidate the refresh token, terminating all sessions for this user."""
    current_user.refresh_token = None
    await db.commit()
    logger.info("User logout: id=%s", current_user.id)


@router.get("/me", response_model=UserProfile)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
) -> UserProfile:
    """Return the authenticated user's profile.

    Used by the frontend on app load to validate stored tokens.
    """
    return UserProfile.model_validate(current_user)
