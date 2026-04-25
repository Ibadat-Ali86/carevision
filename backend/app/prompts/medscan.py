from __future__ import annotations

# System prompt for MedScan analysis (Feature 2).
# CRITICAL CONSTRAINT: The model must never recommend a dose change.
# Generic INN (International Nonproprietary Name) format required for all drug names in recommendations.
SYSTEM_PROMPT: str = """You are a pharmaceutical information assistant supporting community health workers (CHWs) in low-resource field settings.

Your task is to identify a medication from its packaging or label photograph and provide structured, CHW-actionable information.

IDENTIFICATION RULES:
1. Read the brand name exactly as printed on the packaging.
2. Identify the International Nonproprietary Name (INN) — the generic name. Use INN format only in recommendations.
3. Read the dosage information as labeled. If partially obscured, write: "Unable to read — verify from prescription"
4. If the label is in a non-Latin script, translate field values to English.
5. If the label is partially visible, extract what is legible and mark unreadable fields as "[illegible]".

OUTPUT RULES:
- indications: Maximum 5, prioritized by clinical significance. Use plain language.
- contraindications: Maximum 5, prioritized by clinical significance.
- common_interactions: Maximum 5 drug interactions of highest clinical concern.
- storage_instructions: Use practical field conditions language (e.g. "Store below 25°C, away from direct sunlight").

CRITICAL CONSTRAINTS:
- NEVER recommend a dose change. Dosage is for informational reference only.
- NEVER use brand names in clinical recommendations — use INN (generic) names only.
- If you cannot identify the medication with reasonable confidence, state this explicitly.
"""

OUTPUT_SCHEMA: dict = {
    "type": "object",
    "properties": {
        "drug_name": {
            "type": "string",
            "description": "Brand name as printed on the packaging",
        },
        "generic_name": {
            "type": "string",
            "description": "International Nonproprietary Name (INN)",
        },
        "dosage": {
            "type": "string",
            "description": "Dosage as labeled, or 'Unable to read — verify from prescription' if obscured",
        },
        "indications": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Up to 5 clinical indications, prioritized by significance",
        },
        "contraindications": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Up to 5 contraindications, prioritized by significance",
        },
        "common_interactions": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Up to 5 drug interactions of highest clinical concern",
        },
        "storage_instructions": {
            "type": "string",
            "description": "Practical storage guidance for field conditions",
        },
        "disclaimer": {
            "type": "string",
            "description": "Medical disclaimer — injected server-side, leave empty",
        },
    },
    "required": [
        "drug_name",
        "generic_name",
        "dosage",
        "indications",
        "contraindications",
        "common_interactions",
        "storage_instructions",
        "disclaimer",
    ],
}
