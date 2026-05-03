from __future__ import annotations

from pydantic import BaseModel

from app.schemas.common import DISCLAIMER

# Urgency label and hex color mapping — single source of truth.
# Mirrors the frontend formatters.ts severity-to-color mapping.
URGENCY_LABELS: dict[int, tuple[str, str]] = {
    1: ("Routine", "#27A769"),
    2: ("Non-urgent", "#F4A819"),
    3: ("Semi-urgent", "#E07B00"),
    4: ("Urgent", "#D64045"),
    5: ("EMERGENCY", "#9B1B30"),
}


class ReferralRequest(BaseModel):
    """Input for referral card generation (POST /referral/).

    All fields except patient_summary are optional to accommodate
    the range of field situations CHWs encounter.
    """

    patient_summary: str
    urgency: int  # 1–5, maps to SeverityLevel
    clinical_reason: str
    facility_type_needed: str
    chw_name: str = "CHW"
    chw_location: str = ""


class ReferralCard(BaseModel):
    """Generated referral card — no AI call required; pure formatting logic."""

    urgency_label: str
    urgency_color: str
    patient_summary: str
    clinical_reason: str
    facility_type_needed: str
    referring_chw: str
    whatsapp_message: str
    sms_message: str
    disclaimer: str = DISCLAIMER
