from __future__ import annotations

from typing import Any

from app.prompts import docreader, medscan, teststrip, woundassess

# PROMPT_MAP: single lookup dict mapping analysis_type string to (system_prompt, output_schema).
# Adding a new analysis type requires ONLY adding an entry here — no conditional logic changes.
# TRADEOFF: Dict lookup is O(1) and makes the mapping explicit and auditable.
PROMPT_MAP: dict[str, tuple[str, dict[str, Any]]] = {
    "teststrip": (teststrip.SYSTEM_PROMPT, teststrip.OUTPUT_SCHEMA),
    "medscan": (medscan.SYSTEM_PROMPT, medscan.OUTPUT_SCHEMA),
    "woundassess": (woundassess.SYSTEM_PROMPT, woundassess.OUTPUT_SCHEMA),
    "docreader": (docreader.SYSTEM_PROMPT, docreader.OUTPUT_SCHEMA),
}


def get_prompt_and_schema(analysis_type: str) -> tuple[str, dict[str, Any]]:
    """Return the (system_prompt, output_schema) tuple for the given analysis type.

    Args:
        analysis_type: One of 'teststrip', 'medscan', 'woundassess', 'docreader'

    Returns:
        Tuple of (system_prompt string, output_schema dict)

    Raises:
        ValueError: For any analysis_type not in PROMPT_MAP. This is caught in
                    routes/analyze.py and returned as a 422 response.
    """
    if analysis_type not in PROMPT_MAP:
        raise ValueError(
            f"Unknown analysis type: {analysis_type!r}. "
            f"Must be one of: {list(PROMPT_MAP.keys())}"
        )
    return PROMPT_MAP[analysis_type]
