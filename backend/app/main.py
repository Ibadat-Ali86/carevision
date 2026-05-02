from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.middleware.security import SecurityHeadersMiddleware

from app.config import settings
from app.db.session import init_db
from app.dependencies import global_exception_handler
from app.routes import analyze, log, protocols, referral
from app.security import get_security_headers

logger = logging.getLogger(__name__)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """FastAPI lifespan context manager — runs startup and shutdown logic.

    Startup: initialise database tables (create_all). In production, Alembic
    runs before uvicorn starts (Dockerfile CMD), so this is a safety net for
    development and CI where the DB starts from scratch.

    Shutdown: log teardown. SQLAlchemy engine disposal happens automatically
    when the process terminates.
    """
    logger.info("CareVision backend starting. Environment: %s", settings.environment)
    await init_db()
    logger.info("Database ready.")
    yield
    logger.info("CareVision backend shutting down.")


def create_app() -> FastAPI:
    """FastAPI application factory.

    WHY factory pattern: allows test fixtures to create isolated app instances
    with overridden settings without affecting the global singleton.
    """
    app = FastAPI(
        title="CareVision API",
        description="Multimodal AI clinical decision-support for community health workers.",
        version="1.0.0",
        docs_url="/docs" if settings.environment == "development" else None,
        redoc_url=None,
        lifespan=lifespan,
    )

    # CORS — origins controlled by ALLOWED_ORIGINS env var
    # SECURITY: Origins validated in config.py (no wildcards, HTTPS required in production)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type", "Authorization"],
    )

    # Security headers middleware - adds HSTS, X-Frame-Options, etc.
    app.add_middleware(SecurityHeadersMiddleware)

    # Rate limiter - attach to app state for use in routes
    app.state.limiter = analyze.limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # Global exception handler — sanitizes all 500 responses
    app.add_exception_handler(Exception, global_exception_handler)

    # Register all routers
    app.include_router(analyze.router)
    app.include_router(protocols.router)
    app.include_router(referral.router)
    app.include_router(log.router)

    @app.get("/health", tags=["health"])
    async def health_check(request: Request) -> dict[str, str]:
        """Liveness probe — no DB or AI dependency.

        Target latency: < 100ms. Used by Koyeb health checks and UptimeRobot monitoring.
        SECURITY: Removed version info from response to prevent information disclosure.
        """
        # Add security headers to health endpoint
        return {"status": "ok"}

    # Add custom security headers to all responses
    @app.middleware("http")
    async def add_security_headers(request: Request, call_next):
        response = await call_next(request)
        headers = get_security_headers()
        for header, value in headers.items():
            response.headers[header] = value
        return response

    return app


# Module-level app instance for uvicorn: uvicorn app.main:app
app = create_app()
