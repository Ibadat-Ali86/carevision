from __future__ import annotations

import json
import os

from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Single source of truth for all environment-driven configuration.

    Loaded once at module import. Downstream modules import the `settings`
    singleton — never instantiate Settings() directly.

    All values with defaults are optional in the .env file. Values without
    defaults are required and will raise a ValidationError on startup if absent.
    """

    # ── AI Model ─────────────────────────────────────────────────────────────
    gemma_api_key: str
    gemma_model: str = "gemini-2.0-flash"
    gemma_max_retries: int = 2
    gemma_timeout_seconds: int = 30

    # ── Database ─────────────────────────────────────────────────────────────
    # SQLite for development, postgresql+asyncpg:// for production.
    # TRADEOFF: Single DATABASE_URL supports both; driver chosen by URL scheme.
    database_url: str = "sqlite+aiosqlite:///./carevision.db"

    # ── Cloudflare R2 Image Storage ───────────────────────────────────────────
    # All R2 vars optional — storage.is_configured() returns False when absent.
    # Storage failure is non-fatal by design; clinical response always returned.
    r2_account_id: str = ""
    r2_access_key: str = ""
    r2_secret_key: str = ""
    r2_bucket: str = "carevision"
    r2_public_url: str = ""

    # ── Observability ─────────────────────────────────────────────────────────
    logfire_token: str = ""

    # ── CORS ─────────────────────────────────────────────────────────────────
    # JSON array string in env: '["https://carevision.vercel.app"]'
    allowed_origins: list[str] = ["http://localhost:5173"]

    # ── Runtime ───────────────────────────────────────────────────────────────
    environment: str = "development"

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_allowed_origins(cls, value: str | list[str]) -> list[str]:
        """Parse ALLOWED_ORIGINS from JSON string or return list as-is."""
        if isinstance(value, str):
            return json.loads(value)
        return value

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


# Module-level singleton — imported by all route and service modules.
# Instantiated once at startup; never re-created per request.
settings = Settings()
