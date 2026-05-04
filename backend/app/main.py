from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.session import init_db
from app.dependencies import global_exception_handler
from app.routes import analyze, auth, log, protocols, referral

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
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.parsed_allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type", "Authorization"],
    )

    # Global exception handler — sanitizes all 500 responses
    app.add_exception_handler(Exception, global_exception_handler)

    # Register all routers
    app.include_router(auth.router)
    app.include_router(analyze.router)
    app.include_router(protocols.router)
    app.include_router(referral.router)
    app.include_router(log.router)

    @app.get("/health", tags=["health"])
    async def health_check() -> dict[str, str]:
        """Liveness probe — no DB or AI dependency.

        Target latency: < 100ms. Used by Koyeb health checks and UptimeRobot monitoring.
        """
        return {"status": "ok", "version": "1.0.0"}

    return app


# Module-level app instance for uvicorn: uvicorn app.main:app
app = create_app()
