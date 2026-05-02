from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import EncounterLog
from app.db.session import get_session
from app.schemas.log import EncounterLogCreate, EncounterLogListResponse, EncounterLogRead
from app.security import sanitize_location_code, audit_logger
from app.dependencies import get_current_device

router = APIRouter(prefix="/log", tags=["log"])
logger = logging.getLogger(__name__)


@router.post("/", response_model=EncounterLogRead, status_code=201)
async def save_encounter(
    request: Request,
    data: EncounterLogCreate,
    db: AsyncSession = Depends(get_session),
    token_data: dict = Depends(get_current_device),
) -> EncounterLog:
    """POST /log/ — save a CHW encounter to the database.

    IMPORTANT: This endpoint is triggered by a conscious "Save to log" button
    tap by the CHW — never called automatically. Explicit consent is enforced
    at the UI level; this endpoint records whatever consent_given flag is sent.
    
    Authentication: Requires valid device token. The location_code from the token
    is used to ensure data isolation.
    """
    client_ip = request.client.host if request.client else "unknown"
    device_id = token_data["device_id"]
    token_location = token_data["location_code"]
    
    # Ensure the location_code in the request matches the token's location
    # This prevents devices from saving data to other locations
    if data.location_code and data.location_code != token_location:
        logger.warning(
            "Location mismatch: device=%s tried to save to location=%s (token has %s)",
            device_id,
            data.location_code,
            token_location,
        )
        raise HTTPException(
            status_code=403,
            detail="Cannot save encounter to a different location than authenticated",
        )
    
    # Use token's location_code if not provided in request
    final_location_code = data.location_code or token_location
    
    encounter = EncounterLog(
        analysis_type=data.analysis_type,
        result_json=data.result_json,
        severity=data.severity,
        refer_immediately=data.refer_immediately,
        consent_given=data.consent_given,
        image_url=data.image_url,
        chw_notes=data.chw_notes,
        location_code=final_location_code,
        model_used=data.model_used,
        processing_time_ms=data.processing_time_ms,
    )
    db.add(encounter)
    await db.commit()
    await db.refresh(encounter)
    
    # Log the create action for audit trail
    audit_logger.log_access(
        device_id=device_id,
        location_code=final_location_code,
        action="CREATE_ENCOUNTER",
        ip_address=client_ip,
        record_id=str(encounter.id),
        status="success",
    )
    
    return encounter


@router.get("/{location_code}", response_model=EncounterLogListResponse)
async def get_encounters(
    request: Request,
    location_code: str,
    db: AsyncSession = Depends(get_session),
    token_data: dict = Depends(get_current_device),
) -> EncounterLogListResponse:
    """GET /log/{location_code} — retrieve the 50 most recent encounters for a location.

    SECURITY: Requires valid device token. Devices can ONLY access encounters
    from their own authenticated location. Cross-location access is denied.
    
    This ensures HIPAA-compliant data isolation by location.
    """
    client_ip = request.client.host if request.client else "unknown"
    device_id = token_data["device_id"]
    token_location = token_data["location_code"]
    
    # Sanitize the location code
    try:
        location_code = sanitize_location_code(location_code)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
    
    # CRITICAL: Ensure the requested location matches the token's location
    # This prevents unauthorized cross-location data access (IDOR protection)
    if location_code != token_location:
        logger.warning(
            "Unauthorized access attempt: device=%s (location=%s) tried to access location=%s",
            device_id,
            token_location,
            location_code,
        )
        audit_logger.log_access(
            device_id=device_id,
            location_code=location_code,
            action="READ_ENCOUNTERS_UNAUTHORIZED",
            ip_address=client_ip,
            status="failure",
        )
        raise HTTPException(
            status_code=403,
            detail="Access denied: Can only access encounters from your authenticated location",
        )
    
    # Log the access attempt for audit trail (before query)
    audit_logger.log_access(
        device_id=device_id,
        location_code=location_code,
        action="READ_ENCOUNTERS",
        ip_address=client_ip,
        status="success",
    )
    
    result = await db.execute(
        select(EncounterLog)
        .where(EncounterLog.location_code == location_code)
        .order_by(EncounterLog.created_at.desc())
        .limit(50)
    )
    encounters = list(result.scalars().all())

    return EncounterLogListResponse(
        location_code=location_code,
        count=len(encounters),
        encounters=[EncounterLogRead.model_validate(e) for e in encounters],
    )
