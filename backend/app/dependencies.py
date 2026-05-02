from __future__ import annotations

import logging

from fastapi import Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError

from app.security import verify_device_token, audit_logger

logger = logging.getLogger(__name__)

# HTTP Bearer token security scheme
security = HTTPBearer(auto_error=False)


async def get_current_device(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict:
    """Dependency to authenticate device requests via JWT token.
    
    Extracts and validates the device token from the Authorization header.
    
    Args:
        request: FastAPI request object
        credentials: HTTP Bearer credentials from Authorization header
        
    Returns:
        Dictionary with device_id, location_code, and device_name
        
    Raises:
        HTTPException: If authentication fails
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        token_data = verify_device_token(credentials.credentials)
        
        # Log successful authentication for audit trail
        client_ip = request.client.host if request.client else "unknown"
        audit_logger.log_access(
            device_id=token_data["device_id"],
            location_code=token_data["location_code"],
            action="AUTHENTICATE",
            ip_address=client_ip,
            status="success",
        )
        
        return token_data
        
    except JWTError as e:
        logger.warning("Token validation failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e


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
