# CareVision — Accuracy Validation Report

> **Phase 4 Deliverable** | Spec Reference: Section 5.6  
> **Status:** Test data to be collected before submission (May 18, 2026)  
> **Dataset:** Field test images collected with CHW consent

---

## Methodology

All analyses were conducted on a held-out test set of **20 images per analysis type** (80 images total), evaluated by:

1. **AI output** — CareVision / Gemma 4 (google/gemma-4-27b-it)
2. **Ground truth** — Verified by a qualified clinician or reference documentation

Confidence threshold: Results with `confidence: "low"` are flagged separately.

---

## 1. TestStrip Reader

| Test Type | N | Correct | Incorrect | Ambiguous | Accuracy |
|---|---|---|---|---|---|
| Malaria RDT | 8 | — | — | — | — |
| HIV Rapid Test | 4 | — | — | — | — |
| Pregnancy Test | 4 | — | — | — | — |
| TB Lateral Flow | 4 | — | — | — | — |
| **Total** | **20** | **—** | **—** | **—** | **TBD** |

**Common failure modes:** Poor lighting, partial strip visibility, expired test strips.

---

## 2. MedScan (Medication Identification)

| Scenario | N | Correct | Incorrect | Accuracy |
|---|---|---|---|---|
| Branded blister pack | 5 | — | — | — |
| Generic packaging | 5 | — | — | — |
| Multi-language label | 5 | — | — | — |
| Damaged/worn label | 5 | — | — | — |
| **Total** | **20** | **—** | **—** | **TBD** |

**Common failure modes:** Partial labels, non-Latin scripts.

---

## 3. WoundAssess (Wound Severity)

| Severity Level | N | Correct Level | ±1 Level | >±1 Level | Accuracy |
|---|---|---|---|---|---|
| 1 (Minor) | 4 | — | — | — | — |
| 2 (Mild) | 4 | — | — | — | — |
| 3 (Moderate) | 4 | — | — | — | — |
| 4 (Serious) | 4 | — | — | — | — |
| 5 (Emergency) | 4 | — | — | — | — |
| **Total** | **20** | **—** | **—** | **—** | **TBD** |

> **Critical safety metric:** False negatives on severity 4-5 (emergency under-diagnosis) must be **0%**.

---

## 4. DocReader (Clinical Document Extraction)

| Document Type | N | All Fields Correct | Partial | Failed | Accuracy |
|---|---|---|---|---|---|
| Lab Report | 5 | — | — | — | — |
| Prescription | 5 | — | — | — | — |
| Referral Letter | 5 | — | — | — | — |
| Vaccination Card | 5 | — | — | — | — |
| **Total** | **20** | **—** | **—** | **—** | **TBD** |

**Common failure modes:** Handwritten text, low-DPI scans, multi-column layouts.

---

## 5. Protocol Assistant (Qualitative Assessment)

Evaluated against WHO guideline correctness by a clinician reviewer:

| Category | N Queries | Correct | Partially Correct | Incorrect | Accuracy |
|---|---|---|---|---|---|
| Malaria treatment | 5 | — | — | — | — |
| Malnutrition protocol | 5 | — | — | — | — |
| Obstetric emergency | 5 | — | — | — | — |
| Referral criteria | 5 | — | — | — | — |
| **Total** | **20** | **—** | **—** | **—** | **TBD** |

---

## 6. System Performance Metrics

| Metric | Target | Measured |
|---|---|---|
| API response time (p95) | < 10s | TBD |
| Analysis success rate | > 95% | TBD |
| Offline queue sync success | 100% | TBD |
| PWA install on Android | Confirmed | TBD |

---

## Disclaimer

> CareVision is intended to **support**, not replace, clinical judgment. Accuracy figures are based on limited test sets. Real-world performance may vary based on image quality, lighting conditions, and clinical context.
