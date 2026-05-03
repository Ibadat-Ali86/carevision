# CareVision — Complete Project Documentation

**Product Requirements, Architecture, Infrastructure, and Engineering Standards**

| Field | Value |
|---|---|
| **Project Name** | CareVision |
| **Tagline** | Clinical clarity for the last mile. |
| **Hackathon** | Kaggle Gemma 4 Good |
| **Submission Deadline** | May 18, 2026 |
| **Document Version** | 2.0 |
| **Last Updated** | April 2026 |
| **License** | Apache 2.0 |
| **Status** | MVP — Active Development |

> **Target Audience:** Kaggle Gemma 4 Good Hackathon Judges, Development Team, Portfolio Reviewers
> **Primary User:** Community Health Workers (CHWs) in low-resource field settings

---

## Table of Contents

1. [Product Requirements Document (PRD)](#section-1-product-requirements-document-prd)
2. [Complete Directory Structure](#section-2-complete-directory-structure)
3. [Technology Stack](#section-3-technology-stack)
4. [Functional Architecture](#section-4-functional-architecture)
5. [Implementation Roadmap](#section-5-implementation-roadmap)
6. [Free-Tier Infrastructure Capacity Validation](#section-6-free-tier-infrastructure-capacity-validation)
7. [Code Standards and Optimization Guidelines](#section-7-code-standards-and-optimization-guidelines)
8. [Testing and Quality Assurance Plan](#section-8-testing-and-quality-assurance-plan)
9. [Monitoring and Uptime Configuration](#section-9-monitoring-and-uptime-configuration)
10. [AI Agent Constraints for Code Generation](#section-10-ai-agent-constraints-for-code-generation)

---

## SECTION 1: Product Requirements Document (PRD)

### 1.1 Product Vision

**Product Name:** CareVision
**Tagline:** Clinical clarity for the last mile.
**Category:** Multimodal AI Clinical Decision-Support Tool
**Primary User:** Community Health Workers (CHWs) in low-resource settings with limited clinical training and unreliable internet connectivity.

**Core Value Proposition:**
CHWs photograph clinical artifacts — rapid test strips, medication packaging, wounds, handwritten records — and receive structured, actionable, language-appropriate guidance within seconds. The AI (Gemma 4 31B multimodal) performs the analysis; the CHW retains decision authority.

**Hackathon Judging Alignment (Kaggle Gemma 4 Good):**

| Criterion | CareVision Implementation |
|---|---|
| **Health and Sciences** | AI-assisted triage, RDT interpretation, wound severity scoring |
| **Digital Equity** | Offline-capable PWA runs on low-end Android devices with degraded connectivity |
| **Global Resilience** | Multilingual support across 15 language codes; referral chain via WhatsApp and SMS |

---

### 1.2 Feature Specifications

#### CORE ANALYSIS FEATURES — Weeks 1 and 2

---

**Feature 1: TestStrip Reader**

**Purpose:** Enable CHWs to photograph a rapid diagnostic test (RDT) strip and receive an interpreted result — positive, negative, invalid, or unclear — with a plain-language recommended action.

**Business Justification:** RDT misinterpretation by untrained CHWs is a documented cause of both over-treatment (antimalarial resistance) and under-referral (missed HIV/TB diagnoses). Gemma 4's multimodal vision makes this the clearest demonstration of AI adding clinical value.

**Supported Test Types:** Malaria RDT, Pregnancy test, TB Lateral Flow Test, HIV RDT, and any test type Gemma 4 can identify from strip markings or packaging.

**Input:** Base64-encoded JPEG image, language code, consent flag.

**Output Schema:**

| Field | Type | Description |
|---|---|---|
| `test_type` | string | Identified test category |
| `result` | enum | positive \| negative \| invalid \| unclear |
| `confidence` | enum | high \| medium \| low |
| `line_description` | string | What the CHW should visually verify |
| `recommended_action` | string | Maximum 2 sentences, immediately actionable |
| `next_steps` | array[string] | 2–4 ordered actions |
| `disclaimer` | string | Mandatory; injected server-side |

**Accuracy Gate:** Minimum 80% accuracy on clear images before Week 2 begins. If below 80%, scope pivots to MedScan and DocReader as primary features.

**Validation Requirement:** Minimum 15 tests across varied lighting (good natural light, dim indoor, direct flash), focus quality (sharp and slightly blurred), and test types before submission.

**UI Behavior:** Camera overlay with framing guide rectangle to improve image positioning. Both live camera capture and gallery upload supported.

---

**Feature 2: MedScan**

**Purpose:** Identify a medication from its packaging or label and provide CHW-actionable pharmaceutical information.

**Business Justification:** Medication mix-ups due to non-Latin scripts, generic/brand confusion, and missing labels cause preventable harm. Gemma 4's vision handles multi-language label text with high reliability due to high-contrast text on packaging.

**Input:** Base64-encoded JPEG image, language code, consent flag.

**Output Schema:**

| Field | Type | Description |
|---|---|---|
| `drug_name` | string | Brand name as printed |
| `generic_name` | string | INN (International Nonproprietary Name) format |
| `dosage` | string | As labeled; "Unable to read — verify from prescription" if obscured |
| `indications` | array | Maximum 5, prioritized by clinical significance |
| `contraindications` | array | Maximum 5, prioritized by clinical significance |
| `common_interactions` | array | Maximum 5 |
| `storage_instructions` | string | Practical field conditions language |
| `disclaimer` | string | Mandatory; injected server-side |

**Constraint:** The model must never recommend a dose change. Generic INN names only in recommendations.

**Validation Requirement:** Minimum 5 medications with visible packaging. Include at least one non-Latin script label.

---

**Feature 3: WoundAssess**

**Purpose:** Enable CHWs to photograph a wound and receive a severity score on a 1–5 scale with an immediate care plan and referral decision.

**Business Justification:** CHWs frequently manage wounds without access to nurses or physicians. Incorrect severity triage leads to either unnecessary referral (scarce transport) or fatal delays in genuine emergencies.

**Severity Scale:**

| Level | Label | Definition | Referral |
|---|---|---|---|
| 1 | **MINOR** | Superficial abrasion or small clean cut | None required |
| 2 | **MILD** | Laceration under 2cm or mild infection signs | Monitor and dress |
| 3 | **MODERATE** | Deep wound, moderate infection, or special anatomical site (hand, face, genitals) | Within 24 hours |
| 4 | **SERIOUS** | Large wound, significant infection (pus, red streaking), or deep tissue involvement | Today |
| 5 | **EMERGENCY** | Arterial bleeding, crush injury, venomous bite, necrotizing infection signs | Call emergency services immediately |

**Uncertainty Rule:** When Gemma 4 cannot assess safely due to image quality, severity defaults to 3 (moderate). The model must never downgrade when uncertain.

**Output Schema:**

| Field | Type | Description |
|---|---|---|
| `wound_type` | string | Wound classification |
| `severity` | integer 1–5 | Severity level |
| `severity_rationale` | string | 2–3 sentences citing visible features |
| `recommended_action` | string | Immediate action |
| `refer_immediately` | boolean | True for severity 4 and 5 |
| `refer_reason` | string \| null | One-sentence clinical handoff note when `refer_immediately` is true |
| `wound_care_steps` | array | 3–5 steps in order, immediately actionable |
| `disclaimer` | string | Mandatory; injected server-side |

**Clinical Risk Note:** This is the highest-risk feature. Validation must use Creative Commons medical educational wound images (one per severity level). Real wound photography is not ethically appropriate for validation.

**UI Behavior:** After analysis, if `refer_immediately` is true, a "Generate Referral Card" button appears automatically.

---

**Feature 4: DocReader**

**Purpose:** Extract structured clinical data from photographed documents — lab reports, prescriptions, vaccination cards, referral letters, patient records.

**Business Justification:** Paper-based clinical records create information gaps when patients move between facilities. CHWs photograph documents at point of care; the structured extract becomes a portable clinical summary.

**Input:** Base64-encoded JPEG image (single-page for hackathon demo), language code, consent flag.

**Output Schema:**

| Field | Type | Description |
|---|---|---|
| `document_type` | enum | lab_report \| referral_letter \| prescription \| patient_record \| vaccination_card \| other |
| `extracted_fields` | object | field_name → value mapping for all legible clinical data |
| `critical_values` | array | Any value outside normal range, e.g. "HbA1c: 9.2% (high — normal <7%)" |
| `summary` | string | 2–3 sentences in plain language for CHW with limited training |
| `action_required` | boolean | True when critical values present or document requests follow-up |
| `disclaimer` | string | Mandatory; injected server-side |

**Illegible Field Handling:** Write `[illegible]` for unreadable fields. Foreign-language field values translated to English.

**Validation Requirement:** Minimum 4 document types tested. Accuracy measured as: (correct fields ÷ total fields) × 100.

---

#### ASSISTANT AND CHATBOT FEATURES — Week 3

**Feature 5: Protocol Assistant**

**Purpose:** Provide a text and voice interface for CHWs to ask clinical protocol questions and receive WHO-guideline-based answers.

**Business Justification:** CHWs encounter clinical situations not covered by their training. A protocol assistant reduces referral burden and enables evidence-based field decisions.

**Input:** Text query (string), language code. Voice input via Web Speech API.

**Output:** Structured plain-language answer with source note and disclaimer.

**Addressable Topics:** Malaria case management, diarrhoea and dehydration, pneumonia danger signs, malnutrition screening (MUAC), antenatal care danger signs, immunisation schedules, wound care, TB case finding, fever management in children.

**Out-of-scope behavior:** If query is outside CHW scope, the model explicitly states the limitation and recommends referral. It does not guess beyond its defined knowledge boundary.

**Voice Output:** Web Speech API text-to-speech reads results aloud. Critical for CHWs with low literacy or hands-full field conditions.

---

**Feature 6: Post-Analysis Chat**

**Purpose:** After any image analysis result, allow the CHW to ask follow-up questions about that specific image and result.

**Business Justification:** Analysis results often raise follow-up questions. Re-submitting the image with context reduces latency and enables iterative clinical dialogue.

**Implementation:** The original image (base64) plus the analysis result plus the new question are sent to Gemma 4 in a single multimodal request. No new image capture is required.

**UI Behavior:** After any result card renders, an "Ask a follow-up question" button appears. Text input is shown inline below the result.

**Priority Fallback Rule:** If the project falls behind schedule, Post-Analysis Chat is the first feature to drop — before Voice, before on-device model.

---

#### SUPPORTING FEATURES — Week 3

**Feature 7: Referral Card Generator**

**Purpose:** Auto-generate a structured patient referral card from a WoundAssess or TestStrip result, formatted for WhatsApp and SMS sharing.

**Business Justification:** Referral communication is a documented bottleneck in CHW workflows. Pre-formatted cards reduce cognitive load during high-stress emergency situations.

**Input:** patient_summary, urgency (SeverityLevel 1–5), clinical_reason, facility_type_needed, chw_name, chw_location.

**Output:** WhatsApp deep-link message, shorter SMS version, urgency label and color code, disclaimer.

**Urgency Color Mapping:**

| Level | Label | Hex Color |
|---|---|---|
| 1 | Routine | `#27A769` (green) |
| 2 | Non-urgent | `#F4A819` (amber) |
| 3 | Semi-urgent | `#E07B00` (orange) |
| 4 | Urgent | `#D64045` (red) |
| 5 | EMERGENCY | `#9B1B30` (dark red) |

**WhatsApp Deep Link Format:** `https://wa.me/?text={url_encoded_message}`

---

**Feature 8: Patient Logger**

**Purpose:** Store structured encounter data locally (offline-first via Dexie.js) with background sync to PostgreSQL.

**Business Justification:** CHW encounter data enables program managers to track community health patterns and identify referral gaps. The log must be opt-in (explicit save button, not automatic) to enforce data ownership and consent.

**Save Trigger:** A conscious "Save to log" button on every result card. Never automatic.

**Offline Strategy:** Dexie.js IndexedDB queue stores requests locally. The window `online` event triggers queue processing. Failed items retry up to 3 times before being marked as failed.

**Log Retrieval:** `GET /log/{location_code}` returns the 50 most recent encounters, ordered by `created_at` descending.

---

**Feature 9: Multilingual Support**

**Purpose:** Deliver UI labels and AI analysis responses in 15 supported languages.

**Supported Language Codes:** `en, fr, es, pt, sw, ha, am, ar, hi, bn, id, tl, vi, my, km`

**Implementation:** i18next for UI string translation. Language code passed to every API request; Gemma 4 responds in the specified language.

**Fallback:** If an unsupported language code is submitted, the backend normalizes to `en`.

---

**Feature 10: Offline Queue**

**Purpose:** Allow CHWs to capture and queue analyses when connectivity is unavailable, with automatic replay when connection is restored.

**Implementation:** Dexie.js IndexedDB on the frontend stores pending requests. On reconnection, the queue processor iterates pending items and submits them to the backend. After 3 consecutive failures, an item is marked as failed and excluded from future retries.

---

### 1.3 Non-Functional Requirements

| Requirement | Specification |
|---|---|
| TestStrip latency target | Under 4 seconds |
| DocReader latency target | Under 10 seconds (handwritten text is most expensive) |
| Frontend API timeout | 35 seconds |
| Max image size (server input) | 1.5MB encoded |
| Max image size (after server compression) | 1MB to Gemma 4 |
| Client pre-compression target | 0.8MB before transmission |
| HTTPS | Mandatory — Camera API (getUserMedia) requires HTTPS on all Android browsers |
| Disclaimer enforcement | Injected server-side on every response; cannot be omitted by model hallucination or frontend error |
| Consent for image storage | `consent_given=true` required for R2 storage; storage failure is non-fatal |
| Accessibility | Voice input and output support critical for CHWs with low literacy or hands-free field conditions |

---

## SECTION 2: Complete Directory Structure

### 2.1 Full File Hierarchy with Purpose

```
carevision/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   │   Purpose: Python package marker. Empty file.
│   │   │
│   │   ├── main.py
│   │   │   Purpose: FastAPI application factory. Defines lifespan context (db init),
│   │   │   registers all routers, configures CORS middleware, instruments Logfire
│   │   │   observability, and exposes the /health endpoint.
│   │   │   Dependencies: config.py, db/session.py, all route modules, logfire.
│   │   │
│   │   ├── config.py
│   │   │   Purpose: Single source of truth for all environment-driven configuration.
│   │   │   Uses Pydantic BaseSettings for type-safe env var parsing with .env file
│   │   │   support. Exposes a module-level singleton: settings = Settings().
│   │   │   Dependencies: pydantic-settings. Consumed by all service and route modules.
│   │   │
│   │   ├── dependencies.py
│   │   │   Purpose: Shared FastAPI dependency functions and global exception handler.
│   │   │   The global_exception_handler catches unhandled exceptions, logs them,
│   │   │   and returns a sanitized 500 response without leaking stack traces.
│   │   │   Dependencies: fastapi, logging.
│   │   │
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   │
│   │   │   ├── common.py
│   │   │   │   Purpose: Shared types used across multiple schemas.
│   │   │   │   Contains: SeverityLevel (IntEnum 1-5), AnalysisType constants,
│   │   │   │   DISCLAIMER string constant (the mandatory medical disclaimer text).
│   │   │   │   This file is the single source of truth for the disclaimer text.
│   │   │   │
│   │   │   ├── analyze.py
│   │   │   │   Purpose: Request and response Pydantic models for the /analyze endpoint.
│   │   │   │   Contains: AnalyzeRequest (with image size and language validators),
│   │   │   │   TestStripResult, MedScanResult, WoundAssessResult, DocReaderResult,
│   │   │   │   and the unified AnalyzeResponse wrapper.
│   │   │   │   Dependencies: schemas/common.py, pydantic.
│   │   │   │
│   │   │   ├── log.py
│   │   │   │   Purpose: Pydantic schemas for patient log read/write operations.
│   │   │   │   Maps to the EncounterLog ORM model.
│   │   │   │
│   │   │   └── referral.py
│   │   │       Purpose: Pydantic schemas for referral card request and response.
│   │   │       Contains ReferralRequest and ReferralCard models.
│   │   │
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   │
│   │   │   ├── analyze.py
│   │   │   │   Purpose: POST /analyze/ — the primary endpoint.
│   │   │   │   Orchestrates the full analysis pipeline: image validation,
│   │   │   │   prompt routing, Gemma 4 call, optional R2 storage, result parsing.
│   │   │   │   The disclaimer is force-injected here before response serialization.
│   │   │   │   Dependencies: services/gemma_client.py, services/prompt_router.py,
│   │   │   │   services/image_processor.py, services/storage.py, schemas/analyze.py.
│   │   │   │
│   │   │   ├── log.py
│   │   │   │   Purpose: POST /log (save encounter) and GET /log/{location_code}
│   │   │   │   (retrieve encounters for a location). Handles async SQLAlchemy queries.
│   │   │   │   Dependencies: db/session.py, db/models.py, schemas/log.py.
│   │   │   │
│   │   │   ├── protocols.py
│   │   │   │   Purpose: POST /protocols/ — text-only Protocol Assistant endpoint.
│   │   │   │   Calls Gemma 4 with the protocol system prompt directly (no image).
│   │   │   │   Returns plain-language clinical guidance answer.
│   │   │   │   Dependencies: services/gemma_client.py (text mode), prompts/protocol.py.
│   │   │   │
│   │   │   └── referral.py
│   │   │       Purpose: POST /referral/ — generates structured referral card.
│   │   │       Pure logic: no AI call. Formats WhatsApp and SMS message strings,
│   │   │       maps urgency level to label and color, returns ReferralCard.
│   │   │       Dependencies: schemas/referral.py, schemas/common.py.
│   │   │
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   │
│   │   │   ├── gemma_client.py
│   │   │   │   Purpose: The sole integration point with Google Generative AI SDK.
│   │   │   │   Handles image+prompt composition, function calling for structured JSON
│   │   │   │   output, retry logic (up to gemma_max_retries), and latency logging.
│   │   │   │   Exposes a module-level singleton: gemma_client = GemmaClient().
│   │   │   │   Temperature is fixed at 0.1 for factual, consistent clinical output.
│   │   │   │   Dependencies: google-generativeai, config.py.
│   │   │   │
│   │   │   ├── prompt_router.py
│   │   │   │   Purpose: Maps analysis_type string to the correct (system_prompt, output_schema)
│   │   │   │   tuple. Single lookup dict — no conditional logic. Adding a new analysis
│   │   │   │   type requires only adding an entry to PROMPT_MAP.
│   │   │   │   Dependencies: prompts/*.py modules.
│   │   │   │
│   │   │   ├── image_processor.py
│   │   │   │   Purpose: Validates and compresses incoming base64 images server-side.
│   │   │   │   Converts to RGB (handles CMYK and PNG-with-alpha), resizes longest
│   │   │   │   edge to 1024px, compresses to JPEG at quality 85, iteratively reduces
│   │   │   │   quality to 50 if still above 1MB. Returns compressed base64 string.
│   │   │   │   Dependencies: Pillow, base64.
│   │   │   │
│   │   │   └── storage.py
│   │   │       Purpose: Cloudflare R2 (S3-compatible) upload client.
│   │   │       Creates date-prefixed object keys: YYYY/MM/DD/{type}/{uuid}.jpg.
│   │   │       Only instantiates the boto3 client when first used (lazy init).
│   │   │       Exposes is_configured() check to prevent silent failures when R2
│   │   │       env vars are not set (development mode).
│   │   │       Dependencies: boto3, config.py.
│   │   │
│   │   ├── prompts/
│   │   │   ├── teststrip.py
│   │   │   │   Purpose: System prompt and output schema for TestStrip analysis.
│   │   │   │   Defines line-reading rules, control-line logic, confidence levels.
│   │   │   │
│   │   │   ├── medscan.py
│   │   │   │   Purpose: System prompt and output schema for MedScan.
│   │   │   │   Defines INN format requirement, partial-label handling, field limits.
│   │   │   │
│   │   │   ├── woundassess.py
│   │   │   │   Purpose: System prompt and output schema for WoundAssess.
│   │   │   │   Contains the exact 5-level severity scale definition.
│   │   │   │   Uncertainty defaults to severity 3 (precautionary).
│   │   │   │
│   │   │   ├── docreader.py
│   │   │   │   Purpose: System prompt and output schema for DocReader.
│   │   │   │   Defines document type enum, illegible field handling, translation rule.
│   │   │   │
│   │   │   └── protocol.py
│   │   │       Purpose: System instruction for the Protocol Assistant (text-only).
│   │   │       Defines addressable topic list, referral threshold rules,
│   │   │       INN-only drug naming, and uncertainty-acknowledgment requirement.
│   │   │
│   │   └── db/
│   │       ├── __init__.py
│   │       │
│   │       ├── session.py
│   │       │   Purpose: SQLAlchemy async engine and session factory.
│   │       │   Provides init_db() for startup table creation and get_session()
│   │       │   as a FastAPI dependency for per-request async sessions.
│   │       │   Supports both SQLite (development) and PostgreSQL (production)
│   │       │   via DATABASE_URL env var.
│   │       │
│   │       ├── models.py
│   │       │   Purpose: SQLAlchemy ORM models.
│   │       │   EncounterLog: stores structured analysis results, metadata, and
│   │       │   optional R2 image reference. No patient PII unless consent given.
│   │       │   SyncQueue: server-side fallback for edge-case sync failures.
│   │       │
│   │       └── migrations/
│   │           Purpose: Alembic migration directory.
│   │           Contains alembic.ini, env.py (configured to use Base.metadata
│   │           from models.py), and version scripts.
│   │
│   ├── tests/
│   │   ├── test_schemas.py
│   │   │   Purpose: Unit tests for Pydantic schema validation — image size limits,
│   │   │   language code normalization, field validators.
│   │   │
│   │   ├── test_prompts.py
│   │   │   Purpose: Unit tests for prompt template completeness — each prompt
│   │   │   contains required instruction keywords, output schema has required fields.
│   │   │
│   │   └── test_routes.py
│   │       Purpose: Integration tests for API routes using TestClient and mocked
│   │       Gemma 4 responses. Tests happy path, image too large, Gemma timeout,
│   │       invalid analysis type, and offline queue behavior.
│   │
│   ├── pyproject.toml
│   │   Purpose: Build system config, ruff linting rules (line length 100,
│   │   E/F/I/UP rules), mypy strict type checking config, pytest asyncio settings.
│   │
│   ├── requirements.txt
│   │   Purpose: Pinned Python dependency list. All versions pinned to exact
│   │   patch version to ensure reproducible builds across dev and Koyeb.
│   │
│   └── Dockerfile
│       Purpose: Production container image. Python 3.12-slim base, installs
│       libpq-dev for asyncpg, runs Alembic migrations before uvicorn start.
│       CMD uses $PORT env var for Koyeb compatibility.
│
├── frontend/
│   ├── public/
│   │   ├── manifest.json
│   │   │   Purpose: PWA web manifest. Defines app name, theme color (#0D7377),
│   │   │   display mode (standalone), orientation (portrait), start_url (/),
│   │   │   and icon references. Required for Android "Add to Home Screen" install.
│   │   │
│   │   └── icons/
│   │       Purpose: PWA icon assets at 192x192 and 512x512 pixels.
│   │       The 512x512 icon must also be marked as maskable for adaptive icons.
│   │
│   ├── src/
│   │   ├── main.tsx
│   │   │   Purpose: React application entry point. Mounts App to #root DOM element.
│   │   │
│   │   ├── App.tsx
│   │   │   Purpose: Root component. Sets up QueryClientProvider (TanStack Query),
│   │   │   BrowserRouter, OfflineIndicator (always visible), and the route table.
│   │   │   All 8 page routes defined here.
│   │   │
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   │   Purpose: Axios instance configured with VITE_API_BASE_URL base URL,
│   │   │   │   35-second timeout (Gemma 4 latency budget), and JSON content type.
│   │   │   │   Response interceptor handles timeout errors and offline detection,
│   │   │   │   normalizes error.response.data.detail to a user-readable message.
│   │   │   │
│   │   │   └── endpoints.ts
│   │   │       Purpose: Typed API call functions. analyzeImage(), generateReferral(),
│   │   │       queryProtocol(). All functions are async and return typed response
│   │   │       objects. No raw axios calls outside this file.
│   │   │
│   │   ├── components/
│   │   │   ├── Camera.tsx
│   │   │   │   Purpose: Dual-mode image capture — live getUserMedia (rear camera,
│   │   │   │   ideal 1280x960) and file input upload fallback. Applies
│   │   │   │   browser-image-compression to both paths (target 0.8MB, 1024px).
│   │   │   │   Calls onCapture with base64 string on completion.
│   │   │   │
│   │   │   ├── ResultCard.tsx
│   │   │   │   Purpose: Unified result display component handling all 4 analysis types.
│   │   │   │   Renders type-specific fields with appropriate visual hierarchy.
│   │   │   │   Always renders disclaimer at the bottom. Processing time and model
│   │   │   │   name shown in header for transparency.
│   │   │   │
│   │   │   ├── SeverityBadge.tsx
│   │   │   │   Purpose: Color-coded severity indicator for WoundAssess results.
│   │   │   │   Displays numeric level (1-5) and label using the 5-tier color system.
│   │   │   │
│   │   │   ├── DisclaimerBanner.tsx
│   │   │   │   Purpose: Mandatory medical disclaimer rendered before camera activates
│   │   │   │   on every analysis page. Cannot be dismissed or hidden.
│   │   │   │
│   │   │   ├── ConsentToggle.tsx
│   │   │   │   Purpose: Explicit per-image consent checkbox for R2 storage.
│   │   │   │   Defaults to unchecked. Consent text is fixed and not editable.
│   │   │   │
│   │   │   ├── LanguageSelector.tsx
│   │   │   │   Purpose: ISO 639-1 language picker shown in the Home page header.
│   │   │   │   Writes selected code to localStorage and triggers page reload to
│   │   │   │   apply i18next language change.
│   │   │   │
│   │   │   └── OfflineIndicator.tsx
│   │   │       Purpose: Always-visible connectivity status banner. Listens to
│   │   │       navigator.onLine and window online/offline events. Shows warning
│   │   │       banner when offline; hidden when online.
│   │   │
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   │   Purpose: Feature selector grid (2 columns). 6 feature cards navigate
│   │   │   │   to respective analysis pages. Footer disclaimer text always visible.
│   │   │   │
│   │   │   ├── TestStrip.tsx — TestStrip analysis page (camera, consent, result, queue fallback)
│   │   │   ├── MedScan.tsx   — MedScan analysis page (same pattern as TestStrip)
│   │   │   ├── WoundAssess.tsx — Adds "Generate Referral" button when refer_immediately is true
│   │   │   ├── DocReader.tsx — DocReader analysis page (same pattern as TestStrip)
│   │   │   ├── ProtocolAssistant.tsx — Text + voice query interface; no camera
│   │   │   ├── PatientLog.tsx — Encounter history view from GET /log/{location_code}
│   │   │   └── ReferralCard.tsx — Referral card generator; WhatsApp share + SMS copy
│   │   │
│   │   ├── store/
│   │   │   ├── offlineQueue.ts
│   │   │   │   Purpose: Dexie.js IndexedDB wrapper for offline request queuing.
│   │   │   │   Provides useOfflineQueue hook: enqueue() and processPendingQueue().
│   │   │   │   Registers window online listener at module load for automatic replay.
│   │   │   │   Max 3 retry attempts per item before marking as failed.
│   │   │   │
│   │   │   └── settings.ts
│   │   │       Purpose: Language preference persistence via localStorage.
│   │   │       Exposes getLanguage() and setLanguage(). Page reload on language
│   │   │       change ensures i18next re-initialization.
│   │   │
│   │   ├── i18n/
│   │   │   ├── index.ts — i18next initialization; reads language from localStorage
│   │   │   └── locales/ — UI string JSON files; one file per language code
│   │   │
│   │   └── utils/
│   │       ├── imageCompressor.ts — browser-image-compression wrapper (0.8MB, 1024px, WebWorker)
│   │       └── formatters.ts — Date formatting, severity-to-label mapping, type-to-name mapping
│   │
│   ├── index.html         — Vite HTML entry; viewport meta, PWA manifest link
│   ├── vite.config.ts     — Vite + React plugin + VitePWA (Workbox); dev proxy to :8000
│   ├── tailwind.config.ts — Brand color #0D7377 and 5-level severity color scale
│   └── package.json       — npm manifest with all dependency versions pinned
│
├── .github/
│   └── workflows/
│       ├── backend-ci.yml  — ruff, mypy, pytest; deploys to Koyeb on main branch success
│       └── frontend-ci.yml — tsc --noEmit, npm run build; Vercel deploys via GitHub integration
│
├── docker-compose.yml
│   Purpose: Local full-stack development environment.
│   Services: db (postgres:16-alpine), backend (./backend Dockerfile),
│   frontend (./frontend, npm run dev). Backend depends_on db.
│   All env vars read from shell environment or .env file at project root.
│
└── README.md
    Purpose: Hackathon submission primary artifact.
    Must contain: problem statement, Gemma 4 capabilities used, setup
    instructions, architecture diagram, accuracy validation results, team info,
    Apache 2.0 license declaration.
```

### 2.2 Module Dependency Map

```
routes/analyze.py
  └── services/gemma_client.py    (AI call)
  └── services/prompt_router.py   (prompt selection)
  └── services/image_processor.py (compression)
  └── services/storage.py          (R2 upload)
  └── schemas/analyze.py           (validation + response)
  └── db/session.py                (database session)
  └── schemas/common.py            (DISCLAIMER constant)

services/gemma_client.py
  └── config.py                    (API key, model name, retries, timeout)
  └── google-generativeai SDK

services/prompt_router.py
  └── prompts/teststrip.py
  └── prompts/medscan.py
  └── prompts/woundassess.py
  └── prompts/docreader.py

db/session.py
  └── db/models.py
  └── config.py                    (DATABASE_URL)

frontend/src/api/endpoints.ts
  └── api/client.ts                (axios instance)

frontend/src/pages/*.tsx
  └── components/Camera.tsx
  └── components/ResultCard.tsx
  └── components/DisclaimerBanner.tsx
  └── components/ConsentToggle.tsx
  └── api/endpoints.ts
  └── store/offlineQueue.ts
  └── store/settings.ts
```

---

## SECTION 3: Technology Stack

### 3.1 Backend Stack

| Package | Version | Justification |
|---|---|---|
| **Python** | 3.12 | Gemma 4 SDK requires Python 3.10+; 3.12 provides best async performance and type narrowing |
| **FastAPI** | 0.111.0 | Native async support; Pydantic v2 first-class integration; auto-generated OpenAPI docs |
| **google-generativeai** | 0.7.2 | Official SDK for Gemma 4 31B via Google AI Studio; handles function calling and multimodal input |
| **pydantic** | 2.7.1 | Type-safe request/response validation; enforces image size limits and language code whitelist |
| **pydantic-settings** | 2.3.0 | BaseSettings for env var parsing with .env file support |
| **SQLAlchemy** | 2.0.30 | Async session support; single DATABASE_URL covers SQLite (dev) and PostgreSQL (prod) |
| **asyncpg** | 0.29.0 | PostgreSQL async driver for Neon (production) |
| **aiosqlite** | 0.20.0 | SQLite async driver for local development and CI |
| **alembic** | 1.13.1 | Schema migration; auto-generated from SQLAlchemy metadata; runs in Dockerfile CMD |
| **Pillow** | 10.3.0 | Server-side image validation and compression; RGB conversion, resize, JPEG reduction |
| **boto3** | 1.34.114 | Cloudflare R2 via S3-compatible API; s3v4 signature + R2 endpoint |
| **logfire** | 0.46.1 | Pydantic's native observability; FastAPI instrumentation; structured logging and latency tracking |
| **uvicorn[standard]** | 0.30.1 | ASGI server; `[standard]` extra includes uvloop and httptools |
| **pytest** | 8.2.0 | Test runner |
| **pytest-asyncio** | 0.23.6 | Async test support |
| **ruff** | 0.4.4 | Linting (line-length 100; E/F/I/UP rule sets) |
| **mypy** | 1.10.0 | Type checking (strict mode) |

### 3.2 Frontend Stack

| Package | Version | Justification |
|---|---|---|
| **React** | 18.3.1 | Stable concurrent mode; native hooks |
| **TypeScript** | 5.4.5 | Catches API contract mismatches at compile time |
| **Vite** | 5.3.1 | Sub-second HMR; Rollup-based production builds with code splitting |
| **vite-plugin-pwa** | 0.20.0 | Generates service worker and web manifest; Workbox runtime caching |
| **Tailwind CSS** | 3.4.4 | Utility-first; custom brand and severity color palette via tailwind.config.ts |
| **axios** | 1.7.2 | Interceptor support for centralized error handling; 35-second timeout |
| **react-router-dom** | 6.23.1 | Declarative route definitions; BrowserRouter compatible with Vercel SPA rewrite |
| **@tanstack/react-query** | 5.40.0 | Server state management; automatic background refetch and retry |
| **dexie** | 3.2.7 | Typed IndexedDB wrapper for offline queue; SQL-like query syntax |
| **browser-image-compression** | 2.0.2 | Client-side compression in Web Worker; targets 0.8MB maximum |
| **i18next** | 23.11.5 | Industry-standard i18n; 15 language codes; localStorage persistence |
| **react-i18next** | 14.1.2 | React bindings for i18next |

### 3.3 Infrastructure and Deployment

**Frontend Hosting: Vercel (Free Tier)**

| Setting | Value |
|---|---|
| HTTPS | Automatic (required for Camera API on Android) |
| Deployment trigger | GitHub integration auto-deploys from `main` branch |
| SPA routing | All routes serve `index.html` via rewrite rule |
| Environment variable | `VITE_API_BASE_URL` = Koyeb backend URL |
| Build command | `npm run build` |
| Output directory | `dist/` |

---

**Backend Hosting: Koyeb (Free Tier)**

Koyeb was selected over other free-tier providers for the following reasons:

| Criterion | Koyeb Advantage |
|---|---|
| RAM | 512MB free tier — 2x headroom over estimated 250MB usage |
| Request volume | Unlimited requests on free tier |
| Cold start | Faster warm-up than comparable free-tier services |
| PORT injection | `$PORT` environment variable injected at runtime; uvicorn binds to `$PORT` |
| Docker support | Deploys directly from GitHub via Dockerfile |
| Timeout | 300-second request timeout — well within Gemma 4 latency budget |

**Key Koyeb Configuration:**
- Service deploys from `backend/` directory Dockerfile
- All environment variables set in Koyeb service settings
- `PORT` variable injected by Koyeb at runtime; uvicorn binds to `$PORT`
- Health check endpoint: `GET /health` (lightweight, no DB or AI dependency)
- Keep-alive strategy: UptimeRobot pings `/health` every 5 minutes to prevent instance sleep

---

**Database: Neon PostgreSQL (Free Tier)**

| Setting | Value |
|---|---|
| Free storage | 0.5GB — 10× headroom over expected <50MB usage |
| Connection string format | `postgresql+asyncpg://user:password@ep-xxx.region.aws.neon.tech/carevision?sslmode=require` |
| asyncpg requirement | Must use `postgresql+asyncpg://` scheme, not `postgresql://` |
| SSL | Required for all Neon connections (`sslmode=require`) |
| Development alternative | `sqlite+aiosqlite:///./carevision.db` (no external service required) |

---

**Image Storage: Cloudflare R2 (Free Tier)**

| Setting | Value |
|---|---|
| Free storage | 10GB — 20× headroom over expected 100–500MB usage |
| Egress fees | None (R2 charges no egress fees) |
| Bucket names | `carevision` (production), `carevision-dev` (development) |
| Object key format | `YYYY/MM/DD/{analysis_type}/{uuid}.jpg` |
| Storage gate | `consent_given=true` required in request |
| Storage failure | Non-fatal; clinical response always returned regardless |

---

### 3.4 API Contracts Between Services

**Frontend → Backend (analyze endpoint):**

```http
POST /analyze/
Content-Type: application/json

Request:
{
  "type": "teststrip" | "medscan" | "woundassess" | "docreader",
  "image_b64": "<base64 string, max 1.5MB encoded>",
  "language": "<ISO 639-1 code>",
  "consent_given": boolean
}

Response 200:
{
  "type": "string",
  "result": { /* type-specific fields */ },
  "processing_time_ms": integer,
  "model_used": "string",
  "image_stored": boolean,
  "image_url": "string | null"
}

Error 422: Image too large, invalid base64, unsupported language
Error 503: Gemma 4 API unreachable after max retries
Error 500: Unhandled server error (sanitized response, no stack trace)
```

**Frontend → Backend (referral endpoint):**

```http
POST /referral/
Content-Type: application/json

Request:
{
  "patient_summary": "string",
  "urgency": integer (1-5),
  "clinical_reason": "string",
  "facility_type_needed": "string",
  "chw_name": "string (optional, default 'CHW')",
  "chw_location": "string (optional)"
}

Response 200:
{
  "urgency_label": "string",
  "urgency_color": "#hex",
  "patient_summary": "string",
  "clinical_reason": "string",
  "facility_type_needed": "string",
  "referring_chw": "string",
  "whatsapp_message": "string",
  "sms_message": "string",
  "disclaimer": "string"
}
```

**Frontend → Backend (protocols endpoint):**

```http
POST /protocols/
Content-Type: application/json

Request:
{
  "query": "string",
  "language": "string"
}

Response 200:
{
  "answer": "string",
  "source_note": "string",
  "disclaimer": "string"
}
```

**Backend → Gemma 4 (Google AI Studio):**

```
Input:   system_prompt (string) + image (inline base64, mime_type image/jpeg) + language directive
Tools:   [FunctionDeclaration return_analysis with output_schema properties]
Config:  temperature=0.1, max_output_tokens=1024
Output:  function_call.args dict matching output_schema
Retry:   Up to gemma_max_retries (default 2) on parse failure
```

**Backend → Cloudflare R2 (S3 API):**

```http
PUT s3://{bucket}/{YYYY/MM/DD}/{type}/{uuid}.jpg
Content-Type: image/jpeg
Authentication: s3v4 signature with R2 access key
Endpoint: https://{account_id}.r2.cloudflarestorage.com
```

---

### 3.5 Environment Variable Reference

| Variable | Service | Required | Default | Description |
|---|---|---|---|---|
| `GEMMA_API_KEY` | Backend | **Yes** | — | Google AI Studio API key |
| `GEMMA_MODEL` | Backend | No | `gemma-4-31b-it` | Model identifier |
| `GEMMA_MAX_RETRIES` | Backend | No | `2` | Retry attempts on parse failure |
| `GEMMA_TIMEOUT_SECONDS` | Backend | No | `30` | SDK request timeout |
| `DATABASE_URL` | Backend | **Yes** | — | SQLAlchemy-compatible connection URL |
| `R2_ACCOUNT_ID` | Backend | No | — | Cloudflare account ID |
| `R2_ACCESS_KEY` | Backend | No | — | R2 API access key |
| `R2_SECRET_KEY` | Backend | No | — | R2 API secret key |
| `R2_BUCKET` | Backend | No | `carevision` | R2 bucket name |
| `R2_PUBLIC_URL` | Backend | No | — | Public URL for R2 bucket (optional) |
| `LOGFIRE_TOKEN` | Backend | No | — | Pydantic Logfire observability token |
| `ALLOWED_ORIGINS` | Backend | **Yes** | — | JSON array of CORS-allowed origins |
| `ENVIRONMENT` | Backend | No | `development` | `development` or `production` |
| `VITE_API_BASE_URL` | Frontend | **Yes** | — | Backend base URL |

---

## SECTION 4: Functional Architecture

### 4.1 System Overview

```
                    COMMUNITY HEALTH WORKER (Android Phone)
                              |
                    [CareVision PWA — Vercel]
                    React 18 + TypeScript + Tailwind CSS
                    Service Worker (Workbox — offline cache)
                    Dexie.js (IndexedDB — offline queue)
                              |
                    (HTTPS — required for Camera API)
                              |
                    [CareVision Backend — Koyeb]
                    FastAPI 0.111.0 + Python 3.12
                    uvicorn[standard] + Pydantic v2
                    SQLAlchemy 2 (async)
                              |
               +--------------+---------------+
               |              |               |
    [Google AI Studio]  [Cloudflare R2]  [Neon PostgreSQL]
    Gemma 4 31B         Image Storage    Encounter Logs
    Multimodal API      (consent only)   Free Tier
```

### 4.2 Request Lifecycle — Analysis Feature (Happy Path)

```
Step 1 — CAPTURE
  CHW opens TestStrip page
  DisclaimerBanner renders (cannot be dismissed)
  Camera.tsx activates rear camera (getUserMedia, facingMode: environment)
  CHW positions strip in framing overlay rectangle
  CHW taps capture button
  Canvas drawImage() captures current video frame
  browser-image-compression reduces to 0.8MB max, 1024px max
  onCapture() fires with base64 string

Step 2 — CONSENT AND SUBMIT
  Image preview renders on page
  CHW optionally checks ConsentToggle (defaults unchecked)
  CHW taps "Analyze Test Strip"
  analyzeImage() called from endpoints.ts
  axios POST /analyze/ with {type, image_b64, language, consent_given}

Step 3 — BACKEND VALIDATION
  AnalyzeRequest Pydantic model validates:
    - image_b64 length <= 1,500,000 characters (422 if exceeded)
    - language code in allowed set (normalized to "en" if not)
  validate_and_compress() in image_processor.py:
    - base64 decode and Pillow verify
    - RGB conversion (handles CMYK, PNG-with-alpha)
    - Resize to max 1024px longest edge (LANCZOS)
    - JPEG compression quality 85, iterative reduction to 50 if > 1MB

Step 4 — PROMPT ROUTING
  get_prompt_and_schema("teststrip") returns:
    - SYSTEM_PROMPT from prompts/teststrip.py
    - OUTPUT_SCHEMA dict with property names

Step 5 — GEMMA 4 CALL
  gemma_client.analyze() called:
    - Composes [full_prompt_string, image_part] content list
    - Builds FunctionDeclaration return_analysis from OUTPUT_SCHEMA
    - generate_content() with tools=[tool], temperature=0.1, max_output_tokens=1024
    - Extracts function_call.args from response.candidates[0].content.parts
    - If no function call: tries JSON parse from response.text
    - On failure: retries once with correction instruction prepended
    - _elapsed_ms recorded and returned in dict

Step 6 — RESULT ASSEMBLY
  _parse_result("teststrip", raw_dict) called in routes/analyze.py:
    - schemas/common.DISCLAIMER injected regardless of model output
    - TestStripResult(**raw_dict) constructed and validated
  AnalyzeResponse returned: {type, result, processing_time_ms, model_used, image_stored, image_url}

Step 7 — OPTIONAL STORAGE
  Only if consent_given=True AND storage_service.is_configured():
    boto3 PUT to R2 at YYYY/MM/DD/teststrip/{uuid}.jpg
    image_url populated if R2_PUBLIC_URL is configured
    Storage failure is caught and ignored (non-fatal by design)

Step 8 — RENDER
  Frontend receives AnalyzeResponse
  ResultCard.tsx renders type-specific fields based on result.type
  SeverityBadge renders if type is woundassess
  Disclaimer rendered at bottom of card (always)
  If refer_immediately is true: "Generate Referral Card" button appears
```

### 4.3 Request Lifecycle — Offline Path

```
Step 1 — CONNECTIVITY CHECK
  navigator.onLine is false OR axios request throws network error

Step 2 — QUEUE
  useOfflineQueue().enqueue(request) called
  Dexie.js writes to IndexedDB queue table:
    {type, image_b64, language, consent_given, created_at, retry_count: 0, status: "pending"}
  UI shows: "You are offline. This analysis has been queued and will run when you reconnect."

Step 3 — REPLAY
  window "online" event fires when connectivity restored
  processPendingQueue() fetches all records with status "pending"
  For each item:
    Sets status to "processing"
    Calls analyzeImage() with stored request fields
    On success: deletes item from IndexedDB
    On failure: increments retry_count
      If retry_count >= 3: sets status to "failed" (excluded from future retries)
      Else: resets status to "pending" for next replay cycle
```

### 4.4 Authentication and Authorization

**Current State (MVP):**
- No user authentication
- CORS restriction via `ALLOWED_ORIGINS` env var limits API access to the Vercel frontend domain
- Data isolation achieved via `location_code` field on EncounterLog (CHW enters their location identifier)

**Recommended Post-Hackathon Extension:**
- NGO/program manager accounts (organization-level)
- CHW device tokens (device-level, not personal credentials — CHWs frequently share devices)
- FastAPI dependency for token validation on log read/write endpoints
- HTTPS enforced at Vercel and Koyeb level (already in place)

### 4.5 Protocol Assistant Data Flow

```
CHW types query in ProtocolAssistant.tsx text input
  OR speaks via Web Speech API (SpeechRecognition → transcript → text input)

queryProtocol(query, language) called from endpoints.ts
POST /protocols/ with {query, language}

Backend routes/protocols.py:
  genai.GenerativeModel with SYSTEM_PROMPT as system_instruction
  generate_content(f"Language: {language}\n\nQuestion: {query}")
  temperature=0.2, max_output_tokens=512

Response: {answer, source_note, disclaimer}

Frontend renders answer text
Web Speech API SpeechSynthesis optionally reads answer aloud
```

### 4.6 Referral Card Data Flow

```
WoundAssess or TestStrip result has refer_immediately=true
OR CHW manually taps "Create Referral" on Home page

ReferralCard.tsx collects:
  patient_summary (text input)
  urgency (pre-filled from analysis severity, or manual selection)
  clinical_reason (pre-filled from refer_reason, or manual entry)
  facility_type_needed (manual selection or text)
  chw_name, chw_location (from settings or manual)

POST /referral/ with ReferralRequest

Backend routes/referral.py (pure logic — no AI call):
  Maps urgency integer to (label, hex_color) via URGENCY_LABELS dict
  Formats whatsapp_message (multi-line, includes all clinical fields)
  Formats sms_message (length-limited single-line version)
  Returns ReferralCard

Frontend renders:
  Urgency badge with color
  Patient summary and clinical reason
  "Share on WhatsApp" button: window.open(https://wa.me/?text={encoded_message})
  "Copy SMS text" button: navigator.clipboard.writeText(sms_message)
```

### 4.7 Image Processing Pipeline

**Client Side (Camera.tsx + imageCompressor.ts):**

```
Input: Raw camera frame or uploaded file
browser-image-compression: {maxSizeMB: 0.8, maxWidthOrHeight: 1024, useWebWorker: true}
Output: File object (compressed JPEG)
FileReader.readAsDataURL() → base64 string
Strip "data:image/jpeg;base64," prefix → pure base64 sent to backend
```

**Server Side (image_processor.py):**

```
Step 1: base64.b64decode() → bytes
Step 2: Pillow Image.open() + verify() → validates format
Step 3: img.convert("RGB") → normalizes color space (handles CMYK, PNG-with-alpha)
Step 4: Resize to MAX_DIMENSION=1024px on longest edge (LANCZOS filter)
Step 5: Save to BytesIO as JPEG quality=85
Step 6: If size > 1MB: reduce quality by 10, repeat until ≤ 1MB or quality < 50
Step 7: base64.b64encode() → compressed base64 string passed to Gemma 4
```

**Size Limits Summary:**

| Stage | Limit |
|---|---|
| Client target (before transmission) | 0.8MB |
| Server input (AnalyzeRequest validator) | 1.5MB encoded |
| Server output to Gemma 4 | ≤ 1MB |

### 4.8 Database Read/Write Patterns

**Write — Encounter Log (CHW taps "Save to log"):**

```python
# Frontend: POST /log/ with encounter data
# Backend:
encounter = EncounterLog(
    analysis_type=data.analysis_type,
    result_json=data.result_json,
    severity=data.severity,
    refer_immediately=data.refer_immediately,
    consent_given=data.consent_given,
    image_url=data.image_url,
    chw_notes=data.chw_notes,
    location_code=data.location_code,
)
db.add(encounter)
await db.commit()
```

**Read — Patient Log:**

```python
# Frontend: GET /log/{location_code}
# Backend:
result = await db.execute(
    select(EncounterLog)
    .where(EncounterLog.location_code == location_code)
    .order_by(EncounterLog.created_at.desc())
    .limit(50)
)
```

### 4.9 Service Worker and Caching Strategy

| Cache Type | Strategy | Scope |
|---|---|---|
| Static assets | Workbox precache (cache-first) | All JS, CSS, HTML, icons, woff2 |
| API responses | NetworkFirst, 10-second timeout | `/analyze/`, `/protocols/`, `/referral/` |
| Offline fallback | Returns cached response on network timeout | All API routes |

**Note:** Gemma 4 responses are cached as a connectivity buffer only. Analysis results must not be treated as persistent data for clinical decisions.

---

## SECTION 5: Implementation Roadmap

### 5.1 Phase Overview

| Phase | Timeline | Objective |
|---|---|---|
| **Phase 0** | April 18 (Day 1) | Working local environment |
| **Phase 1** | April 18–24 (Week 1) | TestStrip end-to-end with real images |
| **Phase 2** | April 25–May 1 (Week 2) | All 4 analysis features complete |
| **Phase 3** | May 2–8 (Week 3) | Protocol Assistant, Referral Card, Logger, Voice |
| **Phase 4** | May 9–18 (Week 4) | Production deployment, validation, submission |

### 5.2 Phase 0: Day 1 Setup (April 18)

**Objective:** Working local environment. Nothing built; everything runnable.

**Tasks (in order):**

1. Create GitHub repo: `carevision` (public, Apache 2.0 license)
2. Create full directory structure per Section 2
3. Backend setup:
   ```bash
   python -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt
   cp .env.example .env  # fill in GEMMA_API_KEY
   alembic upgrade head
   uvicorn app.main:app --reload --port 8000
   ```
4. Verify: `curl http://localhost:8000/health` returns `{"status":"ok"}`
5. Frontend setup:
   ```bash
   npm install
   cp .env.example .env.local  # VITE_API_BASE_URL=http://localhost:8000
   npm run dev
   ```
6. Verify: `http://localhost:5173` loads without errors
7. Docker Compose full-stack:
   ```bash
   docker-compose up --build
   ```
8. Verify all 3 services start: `db`, `backend`, `frontend`
9. Obtain Google AI Studio API key from `https://aistudio.google.com`
10. Collect 10–15 real test strip photos on Android phone for Week 1 validation

**Completion Gate:** `GET /health` returns 200. Frontend home page loads. Docker Compose starts all services.

---

### 5.3 Phase 1: Week 1 — Foundation and TestStrip (April 18–24)

**Objective:** Working TestStrip analysis end-to-end, tested with real photos on a real Android device.

**Priority:** Highest. Everything else depends on proving Gemma 4 multimodal works for this use case.

**Step 1: Backend Foundation**
- Implement `app/config.py` with all settings from Section 3.5
- Implement `app/db/models.py` (EncounterLog and SyncQueue)
- Implement `app/db/session.py` (init_db, get_session)
- Run `alembic revision --autogenerate -m "initial schema" && alembic upgrade head`
- Implement `app/services/gemma_client.py` (GemmaClient class and singleton)
- Implement `app/services/image_processor.py` (validate_and_compress)

**Testing Checkpoint 1A:**
- `pytest tests/test_schemas.py` (image size validation, language normalization)
- Manual: `python -c "from app.services.gemma_client import gemma_client; print('SDK loaded')"`

**Step 2: TestStrip Prompt**
- Implement `app/prompts/teststrip.py` (SYSTEM_PROMPT and OUTPUT_SCHEMA)
- Implement `app/services/prompt_router.py` (PROMPT_MAP with teststrip entry only)
- Implement `app/routes/analyze.py` (full pipeline)
- Register route in `main.py`

**Testing Checkpoint 1B:**
- POST `/analyze/` with a real malaria RDT base64 image
- Verify: `result.test_type` is populated; `result` is `positive`/`negative`/`invalid`/`unclear`
- Verify: `disclaimer` field matches `schemas/common.DISCLAIMER` exactly

**Step 3: TestStrip Frontend**
- Implement `components/Camera.tsx`, `DisclaimerBanner.tsx`, `ConsentToggle.tsx`, `ResultCard.tsx`
- Implement `pages/TestStrip.tsx`
- Implement `api/client.ts` and `api/endpoints.ts` (analyzeImage only)
- Implement `store/offlineQueue.ts` and `store/settings.ts`
- Add `/teststrip` route in `App.tsx`

**Testing Checkpoint 1C (real Android device):**
- Camera activates (rear-facing)
- Photo captured and compressed to under 0.8MB
- Analysis request completes; result card renders with disclaimer
- In airplane mode: offline queue message displays

**Step 4: Week 1 Accuracy Validation**
- Test minimum 15 strips: 3+ malaria RDTs (positive/negative/invalid), 2+ pregnancy tests, 2+ poor-lighting, 2+ slight blur
- Record results in `docs/accuracy-validation.md`
- **Accuracy gate:** Below 80% on clear images → pivot to MedScan as primary demo

**Week 1 Milestone:** Take a photo of a real test strip on an Android phone. Get a structured result with disclaimer visible.

---

### 5.4 Phase 2: Week 2 — All 4 Analysis Features (April 25–May 1)

**Objective:** All 4 core analysis features working end-to-end. All 4 main buttons on home screen functional.

**Dependency:** Phase 1 complete. `gemma_client.py` proven working.

**Step 1: Remaining Prompts**
- Implement `app/prompts/medscan.py`, `woundassess.py`, `docreader.py`
- Add all 3 entries to PROMPT_MAP in `prompt_router.py`

**Testing Checkpoint 2A:**
- POST `/analyze/` for each of: `medscan` (medication photo), `woundassess` (wound image), `docreader` (lab report)
- Verify each returns correct schema with disclaimer injected

**Step 2: Remaining Schemas**
- Add `MedScanResult`, `WoundAssessResult`, `DocReaderResult` to `schemas/analyze.py`
- Update `_parse_result()` in `routes/analyze.py` to handle all 4 types

**Step 3: Frontend Feature Pages**
- Implement `pages/MedScan.tsx`, `WoundAssess.tsx`, `DocReader.tsx`
- Update `ResultCard.tsx` to render all 4 result types
- Implement `components/SeverityBadge.tsx`
- Implement `pages/Home.tsx` with 6 feature cards
- Add `LanguageSelector` to header; `OfflineIndicator` component

**Step 4: Consent and Disclaimer Audit**
- `ConsentToggle` on every analysis page (defaults unchecked)
- `DisclaimerBanner` renders before camera activates on every page
- Disclaimer text in every result card matches `common.DISCLAIMER` exactly
- Disclaimer text in Home page footer

**Step 5: Storage Integration**
- Implement `app/services/storage.py`
- Verify: `consent_given=true` triggers R2 upload
- Verify: storage failure does not block clinical response
- Verify: `image_stored=false` when R2 not configured (development mode)

**Testing Checkpoint 2B:**
- All 4 analysis routes return correct typed responses
- WoundAssess shows "Generate Referral" button when `refer_immediately=true`
- Consent toggle correctly gates image storage

**Step 6: Week 2 Validation**
- MedScan: 5 medications tested (include 1 non-Latin script label)
- WoundAssess: 5 wound images (one per severity level, CC-licensed images)
- DocReader: 4 document types tested
- All results documented in `docs/accuracy-validation.md`

**Week 2 Milestone:** All 4 main buttons on home screen work end-to-end with real images.

---

### 5.5 Phase 3: Week 3 — Assistant and Supporting Features (May 2–8)

**Objective:** App feels like an intelligent clinical assistant. Protocol chat, voice, referral, and logger all functional.

**Step 1: Protocol Assistant**
- Implement `app/prompts/protocol.py` and `app/routes/protocols.py`
- Implement `pages/ProtocolAssistant.tsx` (text + voice input via Web Speech API)
- Add `queryProtocol()` to `api/endpoints.ts`

**Testing Checkpoint 3A:**
- POST `/protocols/` with "What is the treatment for uncomplicated malaria?" → structured answer
- Voice input populates text field
- Response in French when `language=fr`

**Step 2: Referral Card**
- Implement `app/routes/referral.py` (pure logic, URGENCY_LABELS, message formatting)
- Implement `pages/ReferralCard.tsx`
- WhatsApp deep link tested on real Android device
- Add `generateReferral()` to `api/endpoints.ts`

**Step 3: Patient Logger**
- Implement `app/routes/log.py` (POST `/log/` and GET `/log/{location_code}`)
- Implement `pages/PatientLog.tsx`
- Add "Save to log" button on every ResultCard (manual trigger only; never automatic)

**Step 4: Post-Analysis Chat (if ahead of schedule)**
- After ResultCard renders, show "Ask a follow-up question" text input
- Send: original `image_b64` + `result_json` + new question to `/analyze/` with context prepended
- **If behind schedule: drop this feature first**

**Step 5: Voice Features**
- `SpeechRecognition` for Protocol Assistant input
- `SpeechSynthesis` for reading results aloud (lower priority)
- **If behind schedule: drop voice output before dropping Protocol Assistant**

**Step 6: Multilingual Support**
- Add all i18n locale files under `src/i18n/locales/`
- Minimum: `en`, `fr`, `sw` (highest CHW population overlap)
- Test: change language to French → UI labels update; API responses in French

**Step 7: Offline Queue Validation**
- Enable airplane mode on Android
- Capture and attempt analysis (should queue silently)
- Re-enable connectivity → verify automatic replay and queue cleanup

**Week 3 Milestone:** App functions as a real clinical assistant. Voice, referral, and logger all functional.

---

### 5.6 Phase 4: Week 4 — Polish, Deploy, Validate, Submit (May 9–18)

**Objective:** Live public application. Full submission package. Demo video recorded.

**Step 1: Production Deployment (May 9–11)**

Backend → Koyeb:
- Push `backend/` to GitHub `main` branch
- Koyeb detects Dockerfile, builds and deploys
- Set all environment variables in Koyeb service settings
- Set `DATABASE_URL` to Neon PostgreSQL connection string (with `?sslmode=require`)
- Verify `alembic upgrade head` runs in Dockerfile CMD
- Verify `GET https://{koyeb-url}/health` returns 200

Frontend → Vercel:
- Import GitHub repo in Vercel dashboard
- Set root directory: `frontend`
- Set `VITE_API_BASE_URL` to Koyeb backend URL
- Deploy → verify HTTPS URL works on Android Chrome

Images → Cloudflare R2:
- Create bucket `carevision` in Cloudflare R2 dashboard
- Create API token with read + write scope
- Add `R2_ACCOUNT_ID`, `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `R2_BUCKET` to Koyeb environment
- Test: submit analysis with `consent_given=true`, verify `image_stored=true`

**Testing Checkpoint 4A (production):**
- Full analysis round-trip from real Android Chrome on production HTTPS URL
- R2 upload confirmed with consent flow
- Neon PostgreSQL encounter log save confirmed

**Step 2: Monitoring Setup (May 10)**
- Register Koyeb backend health URL in UptimeRobot (see Section 9 for full details)
- Set ping interval to every 5 minutes to prevent instance sleep
- Configure alert email
- Verify first UptimeRobot "Up" confirmation in dashboard

**Step 3: Accuracy Validation Final (May 11–13)**
- Complete validation suite across all 4 analysis types
- Minimum 15 TestStrip tests documented
- Complete `docs/accuracy-validation.md`:

  ```
  | Analysis Type | Test Count | Accuracy % | Failure Conditions          |
  |---------------|-----------|------------|------------------------------|
  | TestStrip     | 15+       | TBD        | Notes on lighting/blur       |
  | MedScan       | 5+        | TBD        | Notes on label quality       |
  | WoundAssess   | 5         | TBD        | Notes on CC image quality    |
  | DocReader     | 4+        | TBD        | Notes on handwriting clarity |
  ```

- Document latency measurements per feature type

**Step 4: Submission Package (May 13–16)**
- `README.md` final version with all required sections
- `docs/architecture.md` (consolidated from this document)
- `docs/accuracy-validation.md` (completed)
- All prompt files with inline comments
- `.env.example` files for both services
- CI/CD workflows verified passing on GitHub Actions
- Apache 2.0 license file in root

**Step 5: Demo Video Recording (May 14–16)**

Script (3–5 minutes):

| Time | Content |
|---|---|
| 0:00–0:30 | Problem statement voiceover |
| 0:30–1:30 | TestStrip demo — photograph real malaria RDT on Android; show result card |
| 1:30–2:30 | MedScan demo — photograph medication package; show drug identification |
| 2:30–3:30 | WoundAssess demo — photograph wound image; show severity score and referral generation |
| 3:30–4:00 | Referral card — show WhatsApp share flow on Android |
| 4:00–5:00 | Architecture walkthrough — brief GitHub repo tour |

**Filming advice:** Use a real Android phone held in one hand while photographing a real test strip with the other. The physical artifact is the most powerful visual in the demo video.

**Step 6: Technical Write-Up (May 15–16)**

Structure (maximum 3,000 words):

| Section | Word Target |
|---|---|
| Problem | 200 |
| Solution | 200 |
| Gemma 4 integration (cite specific multimodal capabilities) | 600 |
| Architecture (system diagram, data flow, offline strategy) | 400 |
| Results (accuracy validation table, latency measurements) | 400 |
| Impact potential (NGO partnerships, offline edge deployment) | 200 |

**Step 7: Final Submission (May 17–18)**
- Submit on Kaggle before May 18 deadline

**Final Submission Checklist:**
- [ ] Public demo URL accessible on Android Chrome (HTTPS)
- [ ] GitHub repo public with Apache 2.0 license
- [ ] README complete with all required sections
- [ ] Demo video published (YouTube unlisted or equivalent)
- [ ] Technical write-up submitted
- [ ] `docs/accuracy-validation.md` committed to repo

---

### 5.7 Phase Dependencies

```
Phase 0 (Setup)
  └── Required before Phase 1 (backend and frontend must run locally)

Phase 1 (TestStrip)
  └── Required before Phase 2 (gemma_client.py proven, image pipeline validated)
  └── Accuracy gate (80% on clear images) must pass before Week 2 begins

Phase 2 (All 4 Features)
  └── Required before Phase 3 (all analysis routes must exist for Post-Analysis Chat)
  └── R2 storage integration can overlap with Week 3

Phase 3 (Assistant Features)
  └── Post-Analysis Chat depends on Phase 2 (needs existing result objects)
  └── Referral Card depends on WoundAssess result schema (from Phase 2)
  └── Patient Logger depends on Phase 2 routes being registered

Phase 4 (Ship)
  └── Depends on Phase 3 core features (Protocol Assistant, Referral Card, Logger)
  └── Post-Analysis Chat and Voice output are optional for submission
  └── Monitoring must be configured before demo video recording
```

### 5.8 Priority Fallback Rules

If the project falls behind schedule, drop features in this order:

| Priority | Feature | Drop Condition |
|---|---|---|
| Drop 1st | Post-Analysis Chat | Any schedule slip |
| Drop 2nd | Voice output (keep voice input) | Moderate slip |
| Drop 3rd | On-device Gemma 4 E4B | Significant slip |

**Non-negotiable features** (do not drop under any circumstances):
TestStrip, WoundAssess, MedScan, DocReader, Protocol Assistant, Referral Card, Patient Logger, Disclaimer enforcement, Offline Queue.

---

## SECTION 6: Free-Tier Infrastructure Capacity Validation

This section documents the rationale for selecting free-tier hosting services and validates that expected usage remains within safe limits for the hackathon demo period.

### 6.1 Capacity Summary

| Resource | Expected Usage | Free Tier Limit | Safety Margin | Provider |
|---|---|---|---|---|
| **Backend RAM** | ~250 MB | 512 MB | ✅ 2× headroom | Koyeb |
| **Monthly Requests** | 1,000–5,000 | Unlimited | ✅ Safe | Koyeb |
| **Database Storage** | <50 MB | 0.5 GB | ✅ 10× headroom | Neon |
| **Image Storage** | 100–500 MB | 10 GB | ✅ 20× headroom | Cloudflare R2 |
| **Backend Request Timeout** | 25–40 s | 300 s | ✅ Safe | Koyeb |

### 6.2 Backend RAM Estimation (Koyeb — 512MB Free Tier)

| Component | Estimated Allocation |
|---|---|
| Python 3.12 runtime + FastAPI baseline | ~80 MB |
| SQLAlchemy async engine + connection pool | ~20 MB |
| Pillow image processing (peak, single request) | ~50 MB |
| google-generativeai SDK in-memory overhead | ~40 MB |
| boto3 S3 client (lazy init) | ~15 MB |
| Logfire instrumentation | ~10 MB |
| General heap + uvicorn workers | ~35 MB |
| **Total estimated peak** | **~250 MB** |

Koyeb's 512MB free-tier limit provides a **2× safety margin**. Concurrent requests will increase peak RAM transiently, but the hackathon traffic profile (1,000–5,000 requests per month from demo reviewers and judges) does not approach saturation.

### 6.3 Database Storage Estimation (Neon — 0.5GB Free Tier)

Each `EncounterLog` row stores:
- `analysis_type`: ~10 bytes
- `result_json`: ~500–2,000 bytes (varies by feature type)
- `severity`, `refer_immediately`, `consent_given`: ~10 bytes (integers/boolean)
- `image_url`, `chw_notes`, `location_code`: ~200 bytes average
- `model_used`, `processing_time_ms`, `created_at`: ~50 bytes

**Estimated row size:** ~3KB average.
**At 10,000 saved encounters:** ~30MB total.

Neon's 0.5GB free tier provides **10× headroom** relative to the expected volume during the hackathon evaluation period.

### 6.4 Image Storage Estimation (Cloudflare R2 — 10GB Free Tier)

- Images are stored only when `consent_given=true`
- Post-compression size per image: 200–800KB (average ~500KB)
- Estimated demo/validation sessions generating stored images: 200–1,000 total
- **Estimated storage:** 100–500MB

Cloudflare R2's 10GB free tier provides **20× headroom** and charges no egress fees, making it optimal for a zero-budget deployment.

### 6.5 Latency Budget vs. Koyeb Timeout (300s)

| Feature | Target Latency | Worst-Case Latency | Koyeb 300s Timeout |
|---|---|---|---|
| TestStrip | <4s | ~8s | ✅ Safe |
| MedScan | <6s | ~12s | ✅ Safe |
| WoundAssess | <6s | ~12s | ✅ Safe |
| DocReader | <10s | ~20s | ✅ Safe |
| Protocol Assistant | <4s | ~8s | ✅ Safe |

The frontend axios timeout (35s) and the Koyeb 300-second request timeout both safely exceed all worst-case Gemma 4 latency projections.

### 6.6 Free-Tier Risk Register

| Risk | Likelihood | Mitigation |
|---|---|---|
| Koyeb instance sleeps under low traffic | Medium | UptimeRobot health pings every 5 minutes |
| Neon connection pool exhaustion | Low | Default pool_size=5; hackathon traffic is low-concurrency |
| R2 API token expiry | Low | Verify token before demo; store backup credentials |
| Google AI Studio rate limit during demo | Medium | Implement exponential backoff in gemma_client.py; test during off-peak hours |
| Vercel build timeout on large bundle | Low | Code splitting via React Router lazy() keeps individual chunk sizes small |

---

## SECTION 7: Code Standards and Optimization Guidelines

### 7.1 Universal Rules (Apply to Every File)

**No Emojis in Code**
Zero tolerance. No emoji characters in Python files, TypeScript files, JSON configs, environment files, SQL, or CI/CD YAML. Rationale: emojis create encoding inconsistencies across platforms and are invisible to screen readers.

Allowed locations for emojis:
- `Home.tsx` feature card icons (UI-facing only, in JSX string literals)
- `README.md` (documentation only)
- Demo video scripts (not committed code)

**No Inline Comments That State the Obvious**
Comments must explain *why*, not *what*. `# Get the session` above `get_session()` is forbidden. `# Retry once with correction instruction — Gemma 4 sometimes returns text instead of function call` is acceptable.

**Single Responsibility Per File**
Each module has exactly one reason to change:
- `gemma_client.py` — changes when the SDK contract changes
- `prompt_router.py` — changes when a new analysis type is added
- `image_processor.py` — changes when compression requirements change

These must not be merged.

---

### 7.2 Python Code Standards

**Linting:** ruff 0.4.4

Configuration in `pyproject.toml`:
```toml
[tool.ruff]
line-length = 100
target-version = "py312"
select = ["E", "F", "I", "UP"]
```

Rule set:
- `E` — pycodestyle errors
- `F` — pyflakes (undefined names, unused imports)
- `I` — isort-compatible import sorting
- `UP` — pyupgrade (modernize Python syntax for 3.12)

**Type Checking:** mypy 1.10.0 in strict mode. All function parameters and return types must be annotated. No `Any` types except where genuinely required by the Google AI SDK.

**Async Discipline:**
- All database operations must use `AsyncSession` (never sync `Session` in async context)
- All FastAPI route handlers must be `async def`
- Module-level singletons (`gemma_client`, `storage_service`) are synchronous objects — their async methods are implemented via `asyncio` within the class

**Error Handling Pattern:**

```python
# Correct — specific exceptions caught, typed, and re-raised or handled
try:
    image_bytes = base64.b64decode(image_b64)
except Exception:
    raise ValueError("Invalid base64 image data.")

# Incorrect — never use bare except with pass except for non-fatal side effects
try:
    some_operation()
except Exception:
    pass  # FORBIDDEN unless explicitly documented as non-fatal
```

The only permitted bare `except: pass` pattern is in `routes/analyze.py` for R2 storage — explicitly documented: storage failure must never block the clinical response.

**Import Order (enforced by ruff I rules):**
1. Standard library
2. Third-party packages
3. Local application modules

One blank line between each group.

**Pydantic Model Conventions:**
- All models inherit from `BaseModel` (or `BaseSettings` for config)
- Field descriptions provided for every non-obvious field
- Validators use `@field_validator` with `@classmethod` decorator
- No `__init__` overrides — use `model_post_init` if post-construction logic needed

**Gemma 4 Temperature Rule:**

| Context | Temperature | Rationale |
|---|---|---|
| Analysis endpoints (TestStrip, MedScan, WoundAssess, DocReader) | `0.1` | Factual, consistent clinical output |
| Protocol Assistant | `0.2` | Allows slightly more natural language |
| Maximum for any clinical feature | `0.3` | Higher values introduce hallucination risk |

---

### 7.3 TypeScript/React Code Standards

**Strict TypeScript** — `tsconfig.json` must include:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

**Component File Conventions:**
- One component per file
- File name matches exported component name exactly (PascalCase)
- Props interface defined immediately before the component
- No default exports except for page components and the App root

**API Call Pattern:** All API calls go through `api/endpoints.ts`. No direct axios imports in page or component files. This creates a single layer to mock in tests.

**State Management Discipline:**
- No global state library (Redux, Zustand) — TanStack Query handles server state; React `useState` handles UI state
- Dexie.js handles only the offline queue — not used as a general state store
- `localStorage` used only for language preference (`store/settings.ts`) — no other direct `localStorage` calls

**CSS Conventions:** Tailwind utility classes only. No custom CSS files. Class ordering: `layout → spacing → typography → color → interactive`.

**Performance Rules:**
- `Camera.tsx`: `useCallback` on all handlers to prevent re-render loops
- No synchronous `FileReader` usage — always use `onloadend` callback
- `browser-image-compression` must always use `useWebWorker: true`
- `ResultCard.tsx` renders conditionally by type — no switch statement fallthrough

---

### 7.4 Performance Optimization

**Backend Optimizations:**
- Module-level singletons for `GemmaClient` and `StorageService` — initialized once at module load, never per-request
- SQLAlchemy async engine with connection pooling (default `pool_size=5` in PostgreSQL mode)
- Image compression pipeline terminates early when target size is achieved
- Gemma 4 function calling forces structured output — eliminates JSON parsing overhead vs. prompt-based extraction

**Frontend Optimizations:**
- Code splitting: React Router `lazy()` wraps all page components — only current page bundle loads
- `browser-image-compression` in Web Worker: main thread never blocked during image processing
- TanStack Query `staleTime=30,000ms`: avoids redundant API calls within 30-second window
- `OfflineIndicator`: native browser online/offline events (no polling)
- Camera stream explicitly stopped (`stopCamera`) after capture to release device resources

**Gemma 4 Latency Budget:**

| Feature | Target | Fallback if Exceeded |
|---|---|---|
| TestStrip | <4s | Reduce `max_output_tokens` to 512 |
| MedScan | <6s | Reduce `max_output_tokens` to 768 |
| WoundAssess | <6s | Reduce `max_output_tokens` to 768 |
| DocReader | <10s | Accept — handwritten OCR is computationally expensive |
| Protocol Assistant | <4s | Reduce `max_output_tokens` to 384 |

---

### 7.5 Logging Strategy

**Instrumentation:** Logfire (`logfire.instrument_fastapi(app)`) captures all request/response pairs with latency, status codes, route patterns, and unhandled exceptions.

**Standard Python Logging:**
```python
import logging
logger = logging.getLogger(__name__)

# WARNING: recoverable, expected errors
logger.warning(f"Gemma 4 attempt {attempts} failed: {e}")

# ERROR: unhandled exceptions only — always include exc_info=True
logger.error(f"Unhandled exception on {request.url}: {exc}", exc_info=True)
```

**Log Level Policy:**

| Level | Usage |
|---|---|
| DEBUG | Development only; never in production |
| INFO | Significant events (startup, migration success, first session analysis) |
| WARNING | Recoverable errors (Gemma retry, R2 upload failure, language code normalization) |
| ERROR | Unhandled exceptions (always with `exc_info=True`) |
| CRITICAL | Not used — fatal errors raise `HTTPException` or propagate to global handler |

**Never Log:**
- `image_b64` content (data privacy)
- `GEMMA_API_KEY` or any secret values
- Patient-identifiable information from `result_json` in production
- Raw Gemma 4 response text in production (may contain hallucinated PII)

---

### 7.6 Error Reporting

**HTTP Error Taxonomy:**

| HTTP Status | Cause | User-Facing Message |
|---|---|---|
| 400 | Malformed JSON request body | "Invalid request format." |
| 422 | Image too large, invalid base64, unsupported type | Specific field validation message from Pydantic |
| 500 | Unhandled server error | "Internal server error. Please retry." |
| 503 | Gemma 4 API failed after max retries | "AI service error: {last_error}" |

The global exception handler in `dependencies.py` sanitizes all 500 responses. No stack trace, internal path, or database error details are returned to the client.

**Frontend Error Display:**
```typescript
// Correct: normalized error message rendered in red box
setError(err.message || "Analysis failed. Please try again.")

// The axios interceptor normalizes all server errors to a string message:
const detail = error.response?.data?.detail || "An error occurred."
return Promise.reject(new Error(detail))
```

---

### 7.7 Code Quality Checkpoints

**Before merging any commit to `main`:**
1. `ruff check app/` — zero errors
2. `mypy app/` — zero errors in strict mode
3. `pytest tests/ -v` — all tests pass
4. `tsc --noEmit` — zero TypeScript errors
5. `npm run build` — build succeeds

**Before production deployment (Phase 4):**
1. All 4 analysis routes tested with real images on production URL
2. Disclaimer present in all 4 response types (automated assertion in `test_routes.py`)
3. Consent gate verified: `consent_given=false` returns `image_stored=false`
4. Health endpoint returns 200 from Koyeb URL
5. UptimeRobot ping confirmed (see Section 9)

---

## SECTION 8: Testing and Quality Assurance Plan

### 8.1 Unit Testing Strategy

**Test File: `tests/test_schemas.py`**

Purpose: Validate all Pydantic schema constraints without hitting the database or Gemma 4 API.

Required test cases:
```python
def test_image_too_large_rejected():
    # base64 string of 1,600,000 characters — assert ValueError raised

def test_image_at_limit_accepted():
    # base64 string of 1,499,999 characters — assert no error

def test_unsupported_language_normalized_to_en():
    req = AnalyzeRequest(type="teststrip", image_b64="...", language="xx")
    assert req.language == "en"

def test_supported_language_preserved():
    req = AnalyzeRequest(type="teststrip", image_b64="...", language="sw")
    assert req.language == "sw"

def test_disclaimer_always_injected():
    raw = {"test_type": "malaria", "result": "negative", "confidence": "high",
           "line_description": "...", "recommended_action": "...", "next_steps": []}
    result = TestStripResult(**raw)
    assert result.disclaimer == DISCLAIMER

def test_severity_level_range():
    assert SeverityLevel.MINOR == 1
    assert SeverityLevel.EMERGENCY == 5
```

---

**Test File: `tests/test_prompts.py`**

Purpose: Validate prompt template completeness. Prompts are the highest-risk component — a missing instruction has clinical consequences.

Required test cases:
```python
def test_teststrip_prompt_has_control_line_instruction():
    assert "control line" in teststrip.SYSTEM_PROMPT.lower()

def test_teststrip_prompt_has_invalid_result_instruction():
    assert "invalid" in teststrip.SYSTEM_PROMPT.lower()

def test_woundassess_prompt_has_all_5_severity_levels():
    for level in ["1 - MINOR", "2 - MILD", "3 - MODERATE", "4 - SERIOUS", "5 - EMERGENCY"]:
        assert level in woundassess.SYSTEM_PROMPT

def test_woundassess_prompt_has_uncertainty_default():
    assert "severity=3" in woundassess.SYSTEM_PROMPT or \
           "severity 3" in woundassess.SYSTEM_PROMPT.lower()

def test_all_prompts_have_disclaimer_field():
    for mod in [teststrip, medscan, woundassess, docreader]:
        assert "disclaimer" in mod.OUTPUT_SCHEMA["properties"]

def test_prompt_router_covers_all_types():
    for t in ["teststrip", "medscan", "woundassess", "docreader"]:
        prompt, schema = get_prompt_and_schema(t)
        assert prompt and schema

def test_prompt_router_raises_for_unknown_type():
    with pytest.raises(ValueError):
        get_prompt_and_schema("unknown_type")
```

---

### 8.2 Integration Testing Requirements

**Test File: `tests/test_routes.py`**

Strategy: FastAPI `TestClient` with mocked Gemma 4 responses. Never call the real Gemma 4 API in CI (requires API key; incurs quota cost).

Mock pattern:
```python
from unittest.mock import patch

MOCK_TESTSTRIP_RESPONSE = {
    "test_type": "Malaria RDT",
    "result": "positive",
    "confidence": "high",
    "line_description": "Two lines visible: C and T",
    "recommended_action": "Refer to health facility.",
    "next_steps": ["Confirm with supervisor", "Initiate treatment protocol"],
    "_elapsed_ms": 1200
}

@patch("app.routes.analyze.gemma_client.analyze", return_value=MOCK_TESTSTRIP_RESPONSE)
@patch("app.routes.analyze.validate_and_compress", return_value="compressed_b64")
def test_analyze_teststrip_success(mock_compress, mock_gemma, client):
    response = client.post("/analyze/", json={
        "type": "teststrip",
        "image_b64": "a" * 100,
        "language": "en",
        "consent_given": False
    })
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "teststrip"
    assert data["result"]["disclaimer"] == DISCLAIMER  # Critical assertion — never remove
    assert data["image_stored"] == False
```

**Required integration test cases:**
- Happy path for all 4 analysis types
- `422` on `image_b64` exceeding size limit
- `503` when Gemma client raises `RuntimeError` after retries
- Disclaimer present in all 4 response types (**critical — never skip this assertion**)
- `consent_given=false` → `image_stored=false` regardless of R2 configuration
- `consent_given=true` with R2 not configured → `image_stored=false` (graceful)
- `GET /health` returns 200 with `{"status": "ok"}`
- `POST /protocols/` with valid query returns answer with disclaimer
- `POST /referral/` with `urgency=5` returns `urgency_label="EMERGENCY"` and `urgency_color="#9B1B30"`

---

### 8.3 Error Handling and Recovery Procedures

**Gemma 4 Timeout:**
1. Check Logfire for which analysis type is slow
2. Reduce `max_output_tokens` for that type (TestStrip: try 512)
3. If still slow: check Google AI Studio quota dashboard for rate limiting
4. If rate limited: implement exponential backoff in `gemma_client.py`

**Database Connection Failure:**
1. Check Neon dashboard for connection pool status and active connections
2. Verify `DATABASE_URL` is correctly set with `sslmode=require` in Koyeb env
3. For SQLite development: "database is locked" on concurrent requests → add `?timeout=30` to `DATABASE_URL`
4. Run `alembic upgrade head` manually via Koyeb CLI if migration did not run on startup

**R2 Upload Failure:**
Storage failure is non-fatal by design. To diagnose:
1. Check Logfire — the swallowed exception is logged before being ignored
2. Verify `R2_ACCOUNT_ID`, `R2_ACCESS_KEY`, `R2_SECRET_KEY` are set in Koyeb environment
3. Verify bucket name matches `R2_BUCKET` exactly
4. Verify API token has write permission on the bucket

**Offline Queue Replay Failure:**
1. Verify `offlineQueue.ts` module is imported in `App.tsx`
2. Inspect IndexedDB in Chrome DevTools → Application → IndexedDB → `CareVisionDB` → queue
3. Verify item status is `"pending"` (items with status `"failed"` are excluded from replay)
4. For items stuck in `"processing"`: manually update status to `"pending"` or clear queue table

---

## SECTION 9: Monitoring and Uptime Configuration

### 9.1 Keep-Alive Strategy for Koyeb Free Tier

Koyeb free-tier instances may enter a low-activity sleep state under sustained traffic absence. For demo and evaluation purposes, the `/health` endpoint must be pinged periodically to maintain server warmth.

**Solution:** UptimeRobot pings `GET /health` every 5 minutes. This is sufficient to prevent sleep and costs zero additional resources.

---

### 9.2 UptimeRobot Configuration

Service: `https://uptimerobot.com` (free tier: 50 monitors at 5-minute intervals)

Setup procedure:
1. Register at `https://uptimerobot.com`
2. Add New Monitor → Monitor Type: HTTP(s)
3. Friendly Name: `CareVision Backend`
4. URL: `https://{your-koyeb-url}/health`
5. Monitoring Interval: 5 minutes
6. Alert Contacts: Add your email address
7. Save Monitor
8. Verify: After 10 minutes, dashboard shows "Up" status

**After demo recording:** Reduce or pause monitoring to conserve free-tier quota.

---

### 9.3 cron-job.org Configuration (Alternative)

Service: `https://cron-job.org` (free, no monitor limit)

Setup procedure:
1. Register at `https://cron-job.org`
2. Create New Cronjob
3. URL: `https://{your-koyeb-url}/health`
4. Schedule: `*/5 * * * *` (every 5 minutes)
5. Request Method: GET
6. Success detection: HTTP status 200
7. Enable email notifications on failure
8. Save and enable

---

### 9.4 Health Check Endpoint Specification

```python
@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}
```

Requirements:
- No database call (a failing database must not cause `/health` to return non-200)
- No Gemma 4 API call
- No authentication header required
- Response time target: under 100ms
- Returns HTTP 200 with `Content-Type: application/json`

**Extended health check for post-hackathon production:** Add a `/health/detailed` endpoint that checks database connectivity and returns component-level status. Keep `/health` as the lightweight ping target.

---

### 9.5 Alerting and Response Procedures

UptimeRobot alert configuration:
- Alert after 2 consecutive failed checks (reduces false positives from transient network issues)
- Alert channels: email (primary); optional Slack webhook
- Recovery notification: enabled

Response procedures when alert fires:

| Step | Action |
|---|---|
| 1 | Check Koyeb dashboard — verify service is running |
| 2 | Check Logfire for recent error patterns before the alert |
| 3 | If service is stopped: Koyeb dashboard → Restart service |
| 4 | If service is running but `/health` returns non-200: check Logfire for startup errors (likely failed Alembic migration) |
| 5 | If Neon PostgreSQL is down: check Neon dashboard → verify connection string → check Neon status page |

---

### 9.6 Logfire Performance Monitoring

Logfire is configured in `main.py`:
```python
logfire.configure(token=settings.logfire_token)
logfire.instrument_fastapi(app)
```

Key metrics to monitor:
- p50 and p99 latency for `POST /analyze/` (by analysis type)
- Error rate for `POST /analyze/` (target: under 5%)
- Gemma 4 retry rate (warning if above 10% — indicates prompt quality issue)
- R2 upload failure rate (warning if above 0% when `consent_given=true`)

---

## SECTION 10: AI Agent Constraints for Code Generation

> These rules apply when using Cursor, GitHub Copilot, or any AI code generation tool on this codebase.

### 10.1 Scope Rules

**Rule 1: Never generate beyond the approved feature list.**
The approved feature list is defined in Section 1.2. If a code generation prompt implies a feature not in that list (user authentication, real-time collaboration, data export), stop and flag the scope expansion. Do not implement it without explicit approval.

**Rule 2: Do not add dependencies not in `requirements.txt` or `package.json`.**
Any new library requires justification against an existing library already in the stack. Propose the addition explicitly; do not silently import a new package.

**Rule 3: Prefer the existing pattern over a new one.**
If a pattern already exists in the codebase (example: the `analyze.py` route orchestration pattern, the `useOfflineQueue` hook pattern), follow it exactly. Do not introduce a different pattern for a new route or page.

---

### 10.2 Token-Efficient Implementation Patterns

**Prefer explicit over clever:**

```python
# Correct — readable by hackathon judges
schema_map = {
    "teststrip": TestStripResult,
    "medscan": MedScanResult,
    "woundassess": WoundAssessResult,
    "docreader": DocReaderResult,
}
return schema_map[analysis_type](**raw)

# Incorrect — obscure, harder to audit
return globals()[f"{analysis_type.capitalize()}Result"](**raw)
```

**Prefer constants over repeated strings:** `DISCLAIMER` is defined once in `schemas/common.py`. It is never typed inline in any other file.

**Prefer module-level singletons:** `gemma_client` and `storage_service` are module-level singletons. Never instantiate a `GemmaClient()` inside a route handler.

**Prefer explicit None checks:**
```python
# Correct
if settings.logfire_token is not None and settings.logfire_token != "":
    logfire.configure(token=settings.logfire_token)
```

---

### 10.3 Avoid Redundant Code Generation

Flag these patterns before generating them:
1. A new utility function that duplicates existing logic in `utils/`
2. A new API endpoint that partially overlaps with an existing endpoint
3. A React component that could be a variant of `ResultCard.tsx`
4. A new Pydantic schema field that duplicates information already in an existing field
5. Inline SQL or raw database queries (use SQLAlchemy ORM only)
6. Direct `genai` calls outside of `gemma_client.py` (all AI calls must go through `GemmaClient`)

---

### 10.4 Scope Flags — When to Stop and Ask

Stop code generation and ask before proceeding when:

1. The prompt implies adding a fifth analysis type beyond the 4 defined. This requires a new prompt file, schema, route handler update, frontend page, and result card branch — it is not a small addition.

2. The prompt implies modifying the disclaimer text or making it conditional. The disclaimer is non-negotiable and must appear verbatim on every response.

3. The prompt implies storing patient-identifiable information in the database. The current schema stores no PII. Any PII addition requires a consent model redesign.

4. The prompt implies switching from Koyeb to a different hosting provider, or changing the `DATABASE_URL` format. The database URL format differs between SQLite, asyncpg PostgreSQL, and Neon PostgreSQL — a silent change will break migrations.

5. The prompt implies removing or weakening the image size validation. The 1MB limit protects both Gemma 4 API quota and server memory.

6. The prompt implies calling `generate_content()` directly in a route handler instead of through `gemma_client.py`. All Gemma 4 calls must go through the centralized client for retry logic, latency logging, and safety settings.

---

### 10.5 Prefer Simple, Maintainable Solutions

**Database queries: ORM only, never raw SQL**
```python
# Correct
result = await db.execute(
    select(EncounterLog)
    .where(EncounterLog.location_code == location_code)
    .order_by(EncounterLog.created_at.desc())
    .limit(50)
)

# Incorrect
result = await db.execute(
    text("SELECT * FROM encounter_logs WHERE location_code = :lc ORDER BY created_at DESC LIMIT 50"),
    {"lc": location_code}
)
```

**React state: `useState` for local, TanStack Query for server state.** Never put API response data into a `useState` that is also managed by TanStack Query.

**Error messages: user-readable, not technical**
```typescript
setError("Analysis failed. Please try again.")  // Correct
setError(err.stack)  // Incorrect
```

**Prompt templates: no dynamic string interpolation for clinical logic.** The only dynamic element is the language directive appended at the end: `f"Respond in language code: {language}"`. Clinical rules must be static strings reviewed and committed as readable text.

---

### 10.6 Generation Scope Boundaries by File

| File | AI Generation Permitted? | Critical Restrictions |
|---|---|---|
| `prompts/*.py` | With caution | All clinical rules must be reviewed by a human before commit |
| `schemas/common.py` | No | `DISCLAIMER` text and `SeverityLevel` values are fixed; do not change without explicit instruction |
| `routes/analyze.py` | Yes | Disclaimer injection in `_parse_result` must be preserved; never generate a version that skips it |
| `services/gemma_client.py` | Yes | `temperature` must remain ≤ 0.3; `safety_settings` structure must be preserved |
| `tests/*.py` | Yes | Generated tests must cover the disclaimer injection case; never mock out the disclaimer |
| `.env` files | Never | AI editors must not generate, read, or modify `.env` files |
| `Dockerfile` | With caution | The `alembic upgrade head` step in CMD must be preserved |

---

### 10.7 Code Review Checklist Before Any Commit

**Backend (Python):**
- [ ] `ruff check app/` returns zero errors
- [ ] `mypy app/` returns zero errors
- [ ] `pytest tests/ -v` all pass
- [ ] No new bare `except: pass` patterns (except the documented R2 storage case)
- [ ] No direct `genai` calls outside `services/gemma_client.py`
- [ ] Disclaimer injected server-side on every new analysis route
- [ ] No PII stored in `EncounterLog` without consent gate
- [ ] No emoji characters in any `.py` file

**Frontend (TypeScript):**
- [ ] `tsc --noEmit` zero errors
- [ ] `npm run build` succeeds
- [ ] No direct axios imports outside `api/client.ts`
- [ ] No `localStorage` or `sessionStorage` calls outside `store/settings.ts`
- [ ] `DisclaimerBanner` renders before camera on every new analysis page
- [ ] `ConsentToggle` present and defaults to unchecked on every analysis page
- [ ] No emoji characters in any `.ts` or `.tsx` file (except `Home.tsx` feature card icons)

**Infrastructure:**
- [ ] No new environment variables added without updating Section 3.5 table and `.env.example`
- [ ] No new route registered without a corresponding test in `test_routes.py`
- [ ] No Dockerfile change that removes the `alembic upgrade head` step

---

## Appendix: Gemma 4 Latency and Accuracy Validation Summary

> This section is completed after Phase 4 validation (May 11–13, 2026) and committed to the repository before submission.

### A.1 Accuracy Validation Results

| Analysis Type | Test Count | Clear Image Accuracy | Notes on Failure Conditions |
|---|---|---|---|
| TestStrip | ≥15 | TBD% | TBD |
| MedScan | ≥5 | TBD% | TBD |
| WoundAssess | 5 | TBD% | TBD (CC-licensed images) |
| DocReader | ≥4 | TBD% | TBD |

### A.2 Latency Measurements (Production)

| Feature | p50 Latency | p95 Latency | Target Met? |
|---|---|---|---|
| TestStrip | TBD | TBD | TBD |
| MedScan | TBD | TBD | TBD |
| WoundAssess | TBD | TBD | TBD |
| DocReader | TBD | TBD | TBD |
| Protocol Assistant | TBD | TBD | TBD |

---

*CareVision — Clinical clarity for the last mile.*
*Hackathon: Kaggle Gemma 4 Good | Deadline: May 18, 2026 | License: Apache 2.0*
