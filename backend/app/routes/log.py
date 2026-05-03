from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import EncounterLog
from app.db.session import get_session
from app.schemas.log import EncounterLogCreate, EncounterLogListResponse, EncounterLogRead

router = APIRouter(prefix="/log", tags=["log"])


@router.post("/", response_model=EncounterLogRead, status_code=201)
async def save_encounter(
    data: EncounterLogCreate,
    db: AsyncSession = Depends(get_session),
) -> EncounterLog:
    """POST /log/ — save a CHW encounter to the database.

    IMPORTANT: This endpoint is triggered by a conscious "Save to log" button
    tap by the CHW — never called automatically. Explicit consent is enforced
    at the UI level; this endpoint records whatever consent_given flag is sent.
    """
    encounter = EncounterLog(
        analysis_type=data.analysis_type,
        result_json=data.result_json,
        severity=data.severity,
        refer_immediately=data.refer_immediately,
        consent_given=data.consent_given,
        image_url=data.image_url,
        chw_notes=data.chw_notes,
        location_code=data.location_code,
        model_used=data.model_used,
        processing_time_ms=data.processing_time_ms,
    )
    db.add(encounter)
    await db.commit()
    await db.refresh(encounter)
    return encounter


@router.get("/{location_code}", response_model=EncounterLogListResponse)
async def get_encounters(
    location_code: str,
    db: AsyncSession = Depends(get_session),
) -> EncounterLogListResponse:
    """GET /log/{location_code} — retrieve the 50 most recent encounters for a location.

    location_code is the CHW's self-reported location identifier (e.g. village name,
    district code). It is not authenticated — data isolation is by location code only.
    Post-hackathon: add device token authentication for production deployments.
    """
    if not location_code or len(location_code) > 50:
        raise HTTPException(status_code=422, detail="Invalid location_code.")

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
