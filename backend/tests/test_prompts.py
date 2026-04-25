from __future__ import annotations

import pytest

from app.prompts import docreader, medscan, teststrip, woundassess
from app.services.prompt_router import PROMPT_MAP, get_prompt_and_schema


# ── TestStrip prompt ────────────────────────────────────────────────────────────

def test_teststrip_prompt_has_control_line_instruction() -> None:
    assert "control line" in teststrip.SYSTEM_PROMPT.lower()


def test_teststrip_prompt_has_invalid_result() -> None:
    assert "invalid" in teststrip.SYSTEM_PROMPT.lower()


def test_teststrip_output_schema_has_all_required_fields() -> None:
    required = teststrip.OUTPUT_SCHEMA.get("required", [])
    for field in ["test_type", "result", "confidence", "recommended_action", "disclaimer"]:
        assert field in required, f"Missing required field: {field}"


def test_teststrip_result_enum_covers_all_cases() -> None:
    result_enums = teststrip.OUTPUT_SCHEMA["properties"]["result"]["enum"]
    assert set(result_enums) == {"positive", "negative", "invalid", "unclear"}


# ── WoundAssess prompt ─────────────────────────────────────────────────────────

def test_woundassess_prompt_has_all_5_severity_levels() -> None:
    prompt = woundassess.SYSTEM_PROMPT
    for i in range(1, 6):
        assert f"{i} -" in prompt or f"{i}-" in prompt, (
            f"Severity level {i} definition missing from woundassess prompt"
        )


def test_woundassess_prompt_has_uncertainty_default() -> None:
    assert "uncertainty" in woundassess.SYSTEM_PROMPT.lower() or \
           "uncertain" in woundassess.SYSTEM_PROMPT.lower()


def test_woundassess_prompt_has_never_downgrade_rule() -> None:
    assert "downgrade" in woundassess.SYSTEM_PROMPT.lower() or \
           "never downgrade" in woundassess.SYSTEM_PROMPT.lower() or \
           "err toward" in woundassess.SYSTEM_PROMPT.lower()


def test_woundassess_output_schema_has_refer_immediately() -> None:
    assert "refer_immediately" in woundassess.OUTPUT_SCHEMA["properties"]
    assert woundassess.OUTPUT_SCHEMA["properties"]["refer_immediately"]["type"] == "boolean"


# ── All prompts have disclaimer field ──────────────────────────────────────────

@pytest.mark.parametrize("module", [teststrip, medscan, woundassess, docreader])
def test_all_prompts_have_disclaimer_in_schema(module: object) -> None:
    assert "disclaimer" in module.OUTPUT_SCHEMA["properties"]  # type: ignore[attr-defined]


# ── Prompt router ──────────────────────────────────────────────────────────────

def test_prompt_router_covers_all_types() -> None:
    for analysis_type in ["teststrip", "medscan", "woundassess", "docreader"]:
        assert analysis_type in PROMPT_MAP


def test_prompt_router_raises_for_unknown_type() -> None:
    with pytest.raises(ValueError) as exc_info:
        get_prompt_and_schema("unknown_type")
    assert "unknown_type" in str(exc_info.value)


def test_prompt_router_returns_tuple_of_two() -> None:
    result = get_prompt_and_schema("teststrip")
    assert isinstance(result, tuple)
    assert len(result) == 2
    assert isinstance(result[0], str)
    assert isinstance(result[1], dict)
