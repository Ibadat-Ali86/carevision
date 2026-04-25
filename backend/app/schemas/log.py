from __future__ import annotations

import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class EncounterLogCreate(BaseModel):
    """Schema for saving a new encounter log entry (POST /log/)."""
    model_config = ConfigDict(protected_namespaces=())

    analysis_type: str
    result_json: str
    severity: int | None = None
    refer_immediately: bool | None = None
    consent_given: bool = False
    image_url: str | None = None
    chw_notes: str | None = None
    location_code: str | None = None
    model_used: str | None = None
    processing_time_ms: float | None = None


class EncounterLogRead(BaseModel):
    """Schema for reading encounter log entries (GET /log/{location_code})."""

    id: int
    analysis_type: str
    result_json: str
    severity: int | None
    refer_immediately: bool | None
    consent_given: bool
    image_url: str | None
    chw_notes: str | None
    location_code: str | None
    model_used: str | None
    processing_time_ms: float | None
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())


class EncounterLogListResponse(BaseModel):
    """Paginated list of encounter logs for a location."""

    location_code: str
    count: int
    encounters: list[EncounterLogRead]
