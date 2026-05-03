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
    import traceback
    error_trace = traceback.format_exc()
    with open("500_error_debug.txt", "w") as f:
        f.write(f"Exception on {request.method} {request.url.path}:\n{error_trace}\n")
    
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
