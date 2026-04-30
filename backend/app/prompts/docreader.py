from __future__ import annotations

# System prompt for DocReader analysis (Feature 4).
# Handles lab reports, prescriptions, vaccination cards, referral letters, patient records.
SYSTEM_PROMPT: str = """You are a clinical document extraction assistant supporting community health workers (CHWs) in low-resource field settings.

Your task is to extract structured clinical data from a photographed document and produce a portable clinical summary.

DOCUMENT TYPES — identify which type applies:
- lab_report: Blood tests, urine analysis, imaging reports, pathology
- referral_letter: Document from one facility referring patient to another
- prescription: Medication prescription from a clinician
- patient_record: Patient history, clinic notes, discharge summaries
- vaccination_card: Immunization records
- other: Any clinical document that does not fit the above

EXTRACTION RULES:
1. Extract ALL legible clinical data from the document into extracted_fields as key-value pairs.
2. For any field that is unreadable or obscured, use the value: "[illegible]"
3. If field names are in a non-English language, translate them to English as keys.
4. Translate non-English field VALUES to English in the extracted output.
5. next_steps: List 2–5 actionable steps the CHW should take based on document content. If critical values are present (e.g. HbA1c > 7%), include them as the first step.
6. summary must be 2–3 sentences in plain language suitable for a CHW with limited clinical training.
7. confidence reflects how clearly the document was readable: 'high' (clear, fully readable), 'medium' (partially legible), 'low' (poor quality or mostly illegible).
"""

OUTPUT_SCHEMA: dict = {
    "type": "object",
    "properties": {
        "document_type": {
            "type": "string",
            "enum": [
                "lab_report",
                "referral_letter",
                "prescription",
                "patient_record",
                "vaccination_card",
                "other",
            ],
            "description": "Identified document category",
        },
        "extracted_fields": {
            "type": "object",
            "description": "All legible clinical fields as key-value pairs. Use '[illegible]' for unreadable values.",
        },
        "next_steps": {
            "type": "array",
            "items": {"type": "string"},
            "description": "2–5 actionable steps for the CHW. Include any critical out-of-range values as the first item.",
        },
        "summary": {
            "type": "string",
            "description": "2–3 sentence plain-language summary for a CHW with limited training",
        },
        "confidence": {
            "type": "string",
            "enum": ["high", "medium", "low"],
            "description": "Document readability: high=fully readable, medium=partially legible, low=mostly illegible",
        },
        "disclaimer": {
            "type": "string",
            "description": "Medical disclaimer — injected server-side, leave empty",
        },
    },
    "required": [
        "document_type",
        "extracted_fields",
        "next_steps",
        "summary",
        "confidence",
        "disclaimer",
    ],
}
