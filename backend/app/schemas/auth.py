"""
CareVision — Authentication Pydantic Schemas
Phase 5 (Auth System) per carevision-ux-improvements.md

WHY Pydantic models at API boundary: validates inputs before they touch any
domain logic or database layer. Field validators enforce password policy
without coupling the route handler to validation concerns.

Security note: TokenResponse includes user profile so the frontend
can populate state in a single round-trip instead of calling /me immediately.
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator


class UserRole:
    CHW        = "chw"         # Community Health Worker
    SUPERVISOR = "supervisor"  # CHW Supervisor
    ADMIN      = "admin"       # System Administrator


class UserRegistration(BaseModel):
    """Registration payload — validated before any DB write."""

    model_config = ConfigDict(str_strip_whitespace=True)

    email: EmailStr
    password: str
    full_name: str
    role: Literal["chw", "supervisor", "admin"] = "chw"
    facility_id: Optional[str] = None
    region: Optional[str] = None

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        # WHY 8-char minimum: OWASP ASVS Level 2 minimum for non-critical accounts.
        # CHWs operate on mobile — longer requirements increase abandonment.
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        if len(v.strip()) < 2:
            raise ValueError("Full name must be at least 2 characters")
        return v


class UserLogin(BaseModel):
    """Login payload — username field matches OAuth2PasswordRequestForm convention."""

    model_config = ConfigDict(str_strip_whitespace=True)

    email: EmailStr
    password: str


class UserProfile(BaseModel):
    """Outbound user profile — never includes password hash or refresh token."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: str
    role: str
    facility_id: Optional[str]
    is_active: bool
    created_at: datetime


class TokenResponse(BaseModel):
    """JWT token pair returned on successful login or registration.

    WHY include user profile: eliminates a follow-up GET /auth/me
    call, reducing latency on slow mobile connections.
    """

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds until access_token expiry
    user: UserProfile


class RefreshRequest(BaseModel):
    """Payload for the token refresh endpoint."""

    refresh_token: str
