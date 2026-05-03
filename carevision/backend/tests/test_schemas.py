from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.schemas.analyze import (
    MAX_IMAGE_B64_LENGTH,
    AnalyzeRequest,
    WoundAssessResult,
)
from app.schemas.common import DISCLAIMER, SeverityLevel


# ── SeverityLevel ──────────────────────────────────────────────────────────────

def test_severity_level_values() -> None:
    assert SeverityLevel.MINOR == 1
    assert SeverityLevel.MILD == 2
    assert SeverityLevel.MODERATE == 3
    assert SeverityLevel.SERIOUS == 4
    assert SeverityLevel.EMERGENCY == 5


def test_severity_level_count() -> None:
    assert len(SeverityLevel) == 5


# ── DISCLAIMER ─────────────────────────────────────────────────────────────────

def test_disclaimer_is_nonempty_string() -> None:
    assert isinstance(DISCLAIMER, str)
    assert len(DISCLAIMER) > 50


def test_disclaimer_contains_key_phrases() -> None:
    assert "decision-support" in DISCLAIMER
    assert "healthcare professional" in DISCLAIMER
    assert "emergency" in DISCLAIMER.lower()


# ── AnalyzeRequest image validation ────────────────────────────────────────────

def test_image_too_large_rejected() -> None:
    with pytest.raises(ValidationError) as exc_info:
        AnalyzeRequest(
            type="teststrip",
            image_b64="A" * (MAX_IMAGE_B64_LENGTH + 1),
        )
    assert "too large" in str(exc_info.value).lower()


def test_image_at_limit_accepted() -> None:
    req = AnalyzeRequest(
        type="teststrip",
        image_b64="A" * MAX_IMAGE_B64_LENGTH,
    )
    assert len(req.image_b64) == MAX_IMAGE_B64_LENGTH


# ── AnalyzeRequest language normalization ───────────────────────────────────────

def test_unsupported_language_normalized_to_en() -> None:
    req = AnalyzeRequest(type="teststrip", image_b64="A", language="zz")
    assert req.language == "en"


def test_supported_language_preserved() -> None:
    for lang in ["en", "fr", "sw", "ar", "hi"]:
        req = AnalyzeRequest(type="teststrip", image_b64="A", language=lang)
        assert req.language == lang


# ── WoundAssessResult severity validator ────────────────────────────────────────

def test_wound_severity_out_of_range_rejected() -> None:
    with pytest.raises(ValidationError):
        WoundAssessResult(
            wound_type="laceration",
            severity=6,
            severity_rationale="test",
            recommended_action="test",
            refer_immediately=False,
            wound_care_steps=["step1"],
        )


def test_wound_severity_zero_rejected() -> None:
    with pytest.raises(ValidationError):
        WoundAssessResult(
            wound_type="abrasion",
            severity=0,
            severity_rationale="test",
            recommended_action="test",
            refer_immediately=False,
            wound_care_steps=["step1"],
        )


def test_wound_severity_valid_range() -> None:
    for sev in range(1, 6):
        result = WoundAssessResult(
            wound_type="laceration",
            severity=sev,
            severity_rationale="test",
            recommended_action="test",
            refer_immediately=sev >= 4,
            wound_care_steps=["step1"],
        )
        assert result.severity == sev
