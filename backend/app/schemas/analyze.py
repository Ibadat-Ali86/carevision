from __future__ import annotations

from typing import Any

from pydantic import BaseModel, field_validator

from app.schemas.common import DISCLAIMER, AnalysisType, SeverityLevel

# Supported language codes — unsupported codes are normalized to "en"
SUPPORTED_LANGUAGES: frozenset[str] = frozenset(
    ["en", "fr", "es", "pt", "sw", "ha", "am", "ar", "hi", "bn", "id", "tl", "vi", "my", "km"]
)

# Maximum base64 string length accepted at the API boundary (1.5MB encoded)
MAX_IMAGE_B64_LENGTH: int = 1_500_000


class AnalyzeRequest(BaseModel):
    """Incoming request for all four analysis types.

    Validators enforce the image size limit and language code whitelist
    at the Pydantic layer — before any processing begins.
    """

    type: str
    image_b64: str
    language: str = "en"
    consent_given: bool = False

    @field_validator("image_b64")
    @classmethod
    def validate_image_size(cls, value: str) -> str:
        if len(value) > MAX_IMAGE_B64_LENGTH:
            raise ValueError(
                f"Image too large. Maximum {MAX_IMAGE_B64_LENGTH} characters encoded. "
                f"Received {len(value)} characters."
            )
        return value

    @field_validator("language")
    @classmethod
    def normalize_language(cls, value: str) -> str:
        # Silently normalize unsupported language codes to English.
        # WHY silent: CHWs must never see a language-related error; graceful fallback
        # is safer than a 422 that breaks the workflow.
        if value not in SUPPORTED_LANGUAGES:
            return "en"
        return value

    @field_validator("type")
    @classmethod
    def validate_analysis_type(cls, value: str) -> str:
        valid_types = {
            AnalysisType.TESTSTRIP,
            AnalysisType.MEDSCAN,
            AnalysisType.WOUNDASSESS,
            AnalysisType.DOCREADER,
        }
        if value not in valid_types:
            raise ValueError(f"Invalid analysis type: {value!r}. Must be one of {valid_types}.")
        return value


# ── Per-type result schemas ────────────────────────────────────────────────────
# Each result schema has `disclaimer` as a field, but it is NEVER set by the
# caller — it is always force-injected in routes/analyze.py _parse_result().
# The default="" allows construction without the field; injection overwrites it.


class TestStripResult(BaseModel):
    test_type: str
    result: str  # positive | negative | invalid | unclear
    confidence: str  # high | medium | low
    line_description: str
    recommended_action: str
    next_steps: list[str]
    disclaimer: str = ""


class MedScanResult(BaseModel):
    drug_name: str
    generic_name: str
    dosage: str
    indications: list[str]
    contraindications: list[str]
    common_interactions: list[str]
    storage_instructions: str
    disclaimer: str = ""


class WoundAssessResult(BaseModel):
    wound_type: str
    severity: int  # 1–5 per SeverityLevel enum
    severity_rationale: str
    recommended_action: str
    refer_immediately: bool
    refer_reason: str | None = None
    wound_care_steps: list[str]
    disclaimer: str = ""

    @field_validator("severity")
    @classmethod
    def validate_severity_range(cls, value: int) -> int:
        valid = {s.value for s in SeverityLevel}
        if value not in valid:
            raise ValueError(f"Severity must be 1–5. Received: {value}")
        return value


class DocReaderResult(BaseModel):
    document_type: str  # lab_report | referral_letter | prescription | patient_record | vaccination_card | other
    extracted_fields: dict[str, Any]
    critical_values: list[str]
    summary: str
    action_required: bool
    disclaimer: str = ""


# ── Unified response wrapper ───────────────────────────────────────────────────


class AnalyzeResponse(BaseModel):
    type: str
    result: TestStripResult | MedScanResult | WoundAssessResult | DocReaderResult
    processing_time_ms: float
    model_used: str
    image_stored: bool
    image_url: str | None = None
