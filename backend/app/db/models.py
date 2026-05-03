from __future__ import annotations

import datetime
import uuid

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

# fmt: off


class Base(DeclarativeBase):
    pass


class EncounterLog(Base):
    """Stores structured analysis results for community health worker encounters.

    No patient PII is stored in this table unless consent_given is True
    and an image_url is present. The result_json field stores the full
    structured output from Gemma 4 for that encounter.

    TRADEOFF: Storing result_json as Text (not a JSON column) preserves
    compatibility with both SQLite (dev) and PostgreSQL (prod) via a
    single model definition.
    """

    __tablename__ = "encounter_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    analysis_type: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    result_json: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    refer_immediately: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    consent_given: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    # image_url is only populated when consent_given=True and R2 is configured
    image_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    chw_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    location_code: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    model_used: Mapped[str | None] = mapped_column(String(100), nullable=True)
    processing_time_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.datetime.utcnow,
    )


class SyncQueue(Base):
    """Server-side fallback queue for edge-case sync failures.

    The primary offline queue lives in the browser's IndexedDB (Dexie.js).
    This table is a server-side safety net for cases where the frontend
    cannot confirm delivery — not a primary data flow.
    """

    __tablename__ = "sync_queue"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    payload_json: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    retry_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.datetime.utcnow,
    )


class Device(Base):
    """Stores registered client devices for authentication.
    
    Devices represent instances of the CareVision PWA installed by
    Community Health Workers. Each device gets a unique ID and a hashed secret
    used to issue JWT access tokens.
    """

    __tablename__ = "devices"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    device_name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    hashed_secret: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.datetime.utcnow,
    )


class User(Base):
    """Stores authenticated Community Health Worker accounts.

    WHY UUID pk: Prevents sequential ID enumeration via public API.
    WHY hashed_password nullable: Allows future social/SSO auth flows without
    schema migration by setting hashed_password=None for OAuth-only accounts.

    Refresh tokens are stored here (not a separate table) for simplicity.
    On logout or compromise, set refresh_token=None to invalidate all
    sessions for that user. For multi-device support, extract to a
    separate refresh_tokens table (one row per device).
    """

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True,
        index=True,
    )
    hashed_password: Mapped[str | None] = mapped_column(String(512), nullable=True)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    # role: 'chw' | 'supervisor' | 'admin' — enforced at app layer via Literal
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="chw")
    # facility_id scopes data access — CHWs only see logs from their facility
    facility_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    region: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    # Opaque token — rotated on every refresh or logout
    refresh_token: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.datetime.utcnow,
    )
