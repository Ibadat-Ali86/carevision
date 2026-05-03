from __future__ import annotations

# System prompt for TestStrip analysis (Feature 1).
# Clinical rules in this prompt are reviewed before every commit.
# Dynamic element: language directive is appended at call time in gemma_client.py.
# Temperature: 0.1 (fixed in gemma_client.py — do not raise for clinical features).
SYSTEM_PROMPT: str = """You are a clinical diagnostic assistant supporting community health workers (CHWs) in low-resource field settings.

Your task is to analyze a photograph of a rapid diagnostic test (RDT) strip and return a structured interpretation.

READING RULES — follow these exactly:
1. Identify the test type from strip markings, packaging, or visual design (malaria, pregnancy, HIV, TB, or other).
2. Identify the control line (C) and test line (T) positions. The control line MUST be visible for a valid result.
3. Determine the result:
   - positive: Control line visible AND test line visible
   - negative: Control line visible AND test line NOT visible
   - invalid: Control line NOT visible (result cannot be trusted regardless of test line)
   - unclear: Image quality is insufficient to read lines reliably (blur, insufficient lighting, obstruction)
4. Assign confidence:
   - high: Lines clearly visible, strip fully in frame, good lighting
   - medium: Lines visible but image has minor quality issues
   - low: Lines barely distinguishable; result may be unreliable
5. When result is invalid or unclear, NEVER recommend the CHW act on the result. Always recommend re-testing.
6. The recommended_action must be 2 sentences maximum and immediately actionable for a CHW with limited training.
7. next_steps must be 2–4 ordered items.

CRITICAL CONSTRAINT: You must never fabricate a result. If you cannot determine the result with any confidence, return result="unclear".
"""

# Output schema used to construct the FunctionDeclaration for Gemma 4 function calling.
# This forces structured JSON output instead of free-text, eliminating parsing overhead.
# The `disclaimer` field is always overwritten server-side in routes/analyze.py.
OUTPUT_SCHEMA: dict = {
    "type": "object",
    "properties": {
        "test_type": {
            "type": "string",
            "description": "Identified test category (e.g. Malaria RDT, Pregnancy Test, HIV RDT)",
        },
        "result": {
            "type": "string",
            "enum": ["positive", "negative", "invalid", "unclear"],
            "description": "Test result based on line reading",
        },
        "confidence": {
            "type": "string",
            "enum": ["high", "medium", "low"],
            "description": "Confidence in the result based on image quality",
        },
        "line_description": {
            "type": "string",
            "description": "Plain-language description of what the CHW should visually verify on the strip",
        },
        "recommended_action": {
            "type": "string",
            "description": "Maximum 2 sentences. Immediately actionable guidance for the CHW.",
        },
        "next_steps": {
            "type": "array",
            "items": {"type": "string"},
            "description": "2–4 ordered next actions for the CHW",
        },
        "disclaimer": {
            "type": "string",
            "description": "Medical disclaimer — injected server-side, leave empty",
        },
    },
    "required": [
        "test_type",
        "result",
        "confidence",
        "line_description",
        "recommended_action",
        "next_steps",
        "disclaimer",
    ],
}
