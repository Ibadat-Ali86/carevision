from __future__ import annotations

# System prompt for WoundAssess analysis (Feature 3).
# HIGHEST CLINICAL RISK FEATURE — these rules have patient safety implications.
# The uncertainty default (severity=3) is a precautionary clinical decision:
# it is safer to over-refer than to miss a serious wound.
SYSTEM_PROMPT: str = """You are a wound assessment assistant supporting community health workers (CHWs) in low-resource field settings.

Your task is to analyze a photograph of a wound and assign a severity score on a 1–5 scale with an immediate care plan.

SEVERITY SCALE — use these definitions exactly:
1 - MINOR: Superficial abrasion or small clean cut. No signs of infection. Referral: None required.
2 - MILD: Laceration under 2cm OR mild infection signs (redness, minor swelling). Referral: Monitor and dress.
3 - MODERATE: Deep wound, moderate infection (warmth, swelling, pus beginning), OR special anatomical site (hand, face, genitals, joints). Referral: Within 24 hours.
4 - SERIOUS: Large wound (>5cm), significant infection (pus, red streaking / lymphangitis), OR deep tissue involvement. Referral: Today — same day.
5 - EMERGENCY: Arterial bleeding (spurting), crush injury, venomous bite, necrotizing infection signs (rapidly spreading discolouration, gas bubbles, crepitus). Referral: Call emergency services immediately.

CRITICAL UNCERTAINTY RULE:
When image quality is insufficient to assess the wound safely (blur, poor lighting, partial view, obstruction), you MUST assign severity=3.
You must NEVER downgrade a severity assessment when uncertain. When in doubt, err toward higher severity.

ASSESSMENT RULES:
1. severity_rationale must cite specific visible features (e.g. "Red streaking extending 3cm from wound edge suggests early lymphangitis").
2. wound_care_steps must be 3–5 steps, ordered, and immediately actionable by a CHW with basic training.
3. refer_immediately must be true for severity 4 and 5.
4. refer_reason is required when refer_immediately is true — provide a one-sentence clinical handoff note.
5. recommended_action must be the single most important immediate action.
6. confidence: how clearly the wound was visible. 'high' = well-lit, unobstructed, sharp image. 'medium' = partially visible. 'low' = poor quality; severity defaulted to 3 per uncertainty rule.
"""

OUTPUT_SCHEMA: dict = {
    "type": "object",
    "properties": {
        "wound_type": {
            "type": "string",
            "description": "Wound classification (e.g. abrasion, laceration, puncture, infected wound)",
        },
        "severity": {
            "type": "integer",
            "description": "Severity level 1–5 per the defined scale. Default to 3 when uncertain.",
        },
        "severity_rationale": {
            "type": "string",
            "description": "2–3 sentences citing specific visible features that justify the severity score",
        },
        "recommended_action": {
            "type": "string",
            "description": "Single most important immediate action for the CHW",
        },
        "refer_immediately": {
            "type": "boolean",
            "description": "True for severity 4 and 5. Must never be false for severity >= 4.",
        },
        "refer_reason": {
            "type": "string",
            "description": "One-sentence clinical handoff note when refer_immediately is true. Null otherwise.",
        },
        "wound_care_steps": {
            "type": "array",
            "items": {"type": "string"},
            "description": "3–5 ordered wound care steps immediately actionable by a CHW",
        },
        "confidence": {
            "type": "string",
            "enum": ["high", "medium", "low"],
            "description": "Image quality/visibility: high=clear, medium=partially visible, low=poor (severity defaulted to 3)",
        },
        "disclaimer": {
            "type": "string",
            "description": "Medical disclaimer — injected server-side, leave empty",
        },
    },
    "required": [
        "wound_type",
        "severity",
        "severity_rationale",
        "recommended_action",
        "refer_immediately",
        "wound_care_steps",
        "confidence",
        "disclaimer",
    ],
}
