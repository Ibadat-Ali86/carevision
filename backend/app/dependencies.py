from __future__ import annotations

import logging

from fastapi import Request
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all handler for unhandled exceptions.

    WHY: FastAPI's default 500 handler returns stack traces in the response body,
    leaking internal paths, dependency versions, and query details to external callers.
    This handler sanitizes all 500 responses to a single user-readable message.

    The full exception is still logged server-side with exc_info=True for debugging.
    """
    logger.error(
        "Unhandled exception on %s %s",
        request.method,
        request.url.path,
        exc_info=True,
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please retry."},
    )
