from __future__ import annotations

import json
import os
from typing import Any

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
    gemma_model: str = "meta/llama-3.2-11b-vision-instruct"
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
    # JSON array string in env: '["https://carevision.vercel.app"]' or comma-separated
    allowed_origins: str = "http://localhost:5173"

    # ── Runtime ───────────────────────────────────────────────────────────────
    environment: str = "development"

    # ── Security ──────────────────────────────────────────────────────────────
    # WHY required (no default): A missing secret_key means JWT verification
    # cannot happen. Fail loudly at startup rather than silently accepting
    # unsigned tokens. Generate with: python -c "import secrets; print(secrets.token_hex(32))"
    secret_key: str = "dev-secret-change-in-production-32chars-minimum"

    @property
    def parsed_allowed_origins(self) -> list[str]:
        """Parse ALLOWED_ORIGINS from JSON string, comma-separated string, or return list as-is."""
        value = self.allowed_origins.strip()
        if not value:
            return []
        if value.startswith("[") and value.endswith("]"):
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                pass
        # Fallback for simple comma-separated strings without brackets
        return [origin.strip() for origin in value.split(",") if origin.strip()]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


# Module-level singleton — imported by all route and service modules.
# Instantiated once at startup; never re-created per request.
settings = Settings()
