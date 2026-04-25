from __future__ import annotations

from enum import IntEnum


class SeverityLevel(IntEnum):
    """Five-tier wound severity scale used by WoundAssess.

    These integer values map directly to the output schema field `severity`
    and to the urgency color mapping in routes/referral.py.

    CRITICAL: These values must never be changed without updating
    the referral.py URGENCY_LABELS dict and the frontend formatters.ts.
    """

    MINOR = 1
    MILD = 2
    MODERATE = 3
    SERIOUS = 4
    EMERGENCY = 5


class AnalysisType:
    """String constants for the four analysis endpoint types.

    Used as keys in the PROMPT_MAP dict in services/prompt_router.py.
    Adding a new analysis type requires updating PROMPT_MAP only.
    """

    TESTSTRIP = "teststrip"
    MEDSCAN = "medscan"
    WOUNDASSESS = "woundassess"
    DOCREADER = "docreader"


# SINGLE SOURCE OF TRUTH for the mandatory medical disclaimer.
# This string is injected server-side on EVERY analysis response.
# It is never typed inline in any other file.
# The frontend also renders it from the response — never hardcodes it.
#
# WHY server-side injection: Gemma 4 can hallucinate or omit fields.
# Routing the disclaimer through the model creates an unacceptable clinical
# risk of omission. Force-injection in _parse_result() in routes/analyze.py
# guarantees the disclaimer is always present, regardless of model output.
DISCLAIMER: str = (
    "IMPORTANT: This AI-assisted analysis is a decision-support tool only. "
    "It does not replace the judgment of a trained healthcare professional. "
    "Always verify results with a qualified clinician before taking clinical action. "
    "In case of emergency, call local emergency services immediately."
)
