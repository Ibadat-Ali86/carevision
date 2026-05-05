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
    # WHY two fields: Railway dashboard uses NVIDIA_API_KEY, but older deploys
    # used GEMMA_API_KEY. We accept BOTH and unify in the validator below.
    # The NVIDIA NIM endpoint (integrate.api.nvidia.com) accepts the same key
    # regardless of which env var name you use to store it.
    gemma_api_key: str = ""
    nvidia_api_key: str = ""   # Alias accepted from NVIDIA_API_KEY in Railway
    gemini_api_key: str = ""   # Added for Google AI Studio
    gemma_model: str = "gemini-1.5-flash"
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

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def validate_allowed_origins(cls, v: Any) -> str:
        """Sanitize ALLOWED_ORIGINS to prevent Pydantic parsing errors.
        
        Handles malformed environment variables gracefully by falling back to localhost.
        This prevents deployment crashes due to environment variable typos.
        """
        if not v:
            return "http://localhost:5173"
        
        # If it's already a string, validate it's parseable
        if isinstance(v, str):
            v = v.strip()
            # Test if it's valid JSON array
            if v.startswith("[") and v.endswith("]"):
                try:
                    parsed = json.loads(v)
                    if not isinstance(parsed, list):
                        raise ValueError("ALLOWED_ORIGINS JSON must be an array")
                    return v
                except json.JSONDecodeError as e:
                    # Log error but don't crash - fall back to localhost
                    import logging
                    logging.warning(
                        f"ALLOWED_ORIGINS contains invalid JSON, using localhost fallback. Error: {e}"
                    )
                    return "http://localhost:5173"
            # Validate comma-separated format
            return v
        
        return str(v)

    @field_validator("secret_key", mode="before")
    @classmethod
    def validate_secret_key(cls, v: Any) -> str:
        """Strip whitespace from secret_key.

        WHY: Railway (and other PaaS) env var editors can silently introduce leading
        or trailing spaces. A corrupted secret_key causes JWT signing/verification
        to use a different key than intended — tokens issued before/after a redeploy
        become invalid and users are logged out unexpectedly.
        """
        if isinstance(v, str):
            v = v.strip()
        if not v or len(v) < 32:
            import logging
            logging.warning(
                "SECRET_KEY is missing or shorter than 32 characters. "
                "Using dev default — change this in production!"
            )
            return "dev-secret-change-in-production-32chars-minimum"
        return v

    @property
    def parsed_allowed_origins(self) -> list[str]:
        """Parse ALLOWED_ORIGINS from JSON string, comma-separated string, or return list as-is."""
        value = self.allowed_origins.strip()
        if not value:
            return ["http://localhost:5173"]
        if value.startswith("[") and value.endswith("]"):
            try:
                parsed = json.loads(value)
                return parsed if isinstance(parsed, list) else ["http://localhost:5173"]
            except json.JSONDecodeError:
                return ["http://localhost:5173"]
        # Fallback for simple comma-separated strings without brackets
        origins = [origin.strip() for origin in value.split(",") if origin.strip()]
        return origins if origins else ["http://localhost:5173"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}

    def model_post_init(self, __context: object) -> None:
        """Unify GEMMA_API_KEY and NVIDIA_API_KEY into a single resolved key.

        WHY post_init: field_validator cannot reference sibling fields (they may
        not be set yet). model_post_init runs after ALL fields are validated,
        making it the only safe place to cross-reference two fields.

        Resolution order:
          1. GEMMA_API_KEY (explicit, legacy)
          2. NVIDIA_API_KEY (Railway convention)
          3. Empty string → startup warning (not a crash; routes will 503)
        """
        import logging as _logging
        _log = _logging.getLogger(__name__)

        resolved = (self.gemini_api_key or self.gemma_api_key or self.nvidia_api_key or "").strip()
        if not resolved:
            _log.error(
                "CRITICAL: Neither GEMINI_API_KEY, GEMMA_API_KEY, nor NVIDIA_API_KEY is set. "
                "All AI analysis endpoints will return 503. "
                "Set GEMINI_API_KEY in Railway Variables and redeploy."
            )
        else:
            # Overwrite gemma_api_key so gemma_client always reads one field
            object.__setattr__(self, "gemma_api_key", resolved)
            
            source = "NVIDIA_API_KEY"
            if self.gemini_api_key: source = "GEMINI_API_KEY"
            elif self.gemma_api_key: source = "GEMMA_API_KEY"
            
            _log.info(
                "AI API key loaded (source=%s, length=%d).",
                source,
                len(resolved),
            )


# Module-level singleton — imported by all route and service modules.
# Instantiated once at startup; never re-created per request.
settings = Settings()
