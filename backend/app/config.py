from __future__ import annotations

import json
import os
from typing import Optional

from pydantic import field_validator, SecretStr
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Single source of truth for all environment-driven configuration.

    Loaded once at module import. Downstream modules import the `settings`
    singleton — never instantiate Settings() directly.

    All values with defaults are optional in the .env file. Values without
    defaults are required and will raise a ValidationError on startup if absent.
    """

    # ── AI Model ─────────────────────────────────────────────────────────────
    gemma_api_key: SecretStr  # Use SecretStr to prevent accidental logging
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
    r2_access_key: SecretStr = SecretStr("")  # Use SecretStr for sensitive data
    r2_secret_key: SecretStr = SecretStr("")  # Use SecretStr for sensitive data
    r2_bucket: str = "carevision"
    r2_public_url: str = ""

    # ── Observability ─────────────────────────────────────────────────────────
    logfire_token: SecretStr = SecretStr("")  # Use SecretStr for sensitive data

    # ── CORS ─────────────────────────────────────────────────────────────────
    # JSON array string in env: '["https://carevision.vercel.app"]'
    allowed_origins: list[str] = ["http://localhost:5173"]

    # ── Runtime ───────────────────────────────────────────────────────────────
    environment: str = "development"

    # ── Security ─────────────────────────────────────────────────────────────
    # Device authentication secret key (required for production)
    device_auth_secret_key: SecretStr = SecretStr("dev_secret_key_change_in_production")
    
    # Rate limiting configuration
    rate_limit_default: str = "10/minute"
    rate_limit_analyze: str = "5/minute"
    
    # Maximum request size in bytes (default: 10MB)
    max_request_size: int = 10485760
    
    # Audit logging for HIPAA compliance
    audit_log_enabled: bool = True

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_allowed_origins(cls, value: str | list[str]) -> list[str]:
        """Parse ALLOWED_ORIGINS from JSON string or return list as-is."""
        if isinstance(value, str):
            origins = json.loads(value)
        else:
            origins = value
        
        # SECURITY: Block dangerous wildcards
        if "*" in origins:
            raise ValueError("Wildcard CORS origins (*) are not allowed for security reasons")
        
        # SECURITY: Validate HTTPS in production
        if os.getenv("ENVIRONMENT", "development") == "production":
            for origin in origins:
                if not origin.startswith("https://"):
                    raise ValueError(
                        f"Production CORS origins must use HTTPS: {origin}. "
                        "HTTP origins are only allowed in development."
                    )
        
        return origins

    @field_validator("environment", mode="after")
    @classmethod
    def validate_environment(cls, value: str) -> str:
        """Validate environment value."""
        valid_environments = {"development", "production", "staging", "testing"}
        if value.lower() not in valid_environments:
            raise ValueError(
                f"Invalid environment '{value}'. Must be one of: {', '.join(valid_environments)}"
            )
        return value.lower()

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


# Module-level singleton — imported by all route and service modules.
# Instantiated once at startup; never re-created per request.
settings = Settings()
