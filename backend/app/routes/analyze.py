from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, HTTPException

from app.schemas.analyze import (
    AnalyzeRequest,
    AnalyzeResponse,
    DocReaderResult,
    MedScanResult,
    TestStripResult,
    WoundAssessResult,
)
from app.schemas.common import DISCLAIMER, AnalysisType
from app.services.gemma_client import gemma_client
from app.services.image_processor import validate_and_compress
from app.services.prompt_router import get_prompt_and_schema
from app.services.storage import storage_service

router = APIRouter(prefix="/analyze", tags=["analyze"])
logger = logging.getLogger(__name__)

# Schema map for _parse_result — explicit dict preferred over globals() lookup
_RESULT_SCHEMA_MAP: dict[str, type] = {
    AnalysisType.TESTSTRIP:   TestStripResult,
    AnalysisType.MEDSCAN:     MedScanResult,
    AnalysisType.WOUNDASSESS: WoundAssessResult,
    AnalysisType.DOCREADER:   DocReaderResult,
}


def _parse_result(
    analysis_type: str,
    raw: dict[str, Any],
) -> TestStripResult | MedScanResult | WoundAssessResult | DocReaderResult:
    """Construct a typed result schema from the raw Gemma 4 output dict.

    CRITICAL: The DISCLAIMER is force-injected here, regardless of what the
    model returned in the `disclaimer` field. This is the single enforcement
    point — never remove this injection without explicit documented approval.
    """
    raw["disclaimer"] = DISCLAIMER  # Force-inject — do not remove
    schema_class = _RESULT_SCHEMA_MAP[analysis_type]
    return schema_class(**raw)


async def _run_analysis(request: AnalyzeRequest, analysis_type: str) -> AnalyzeResponse:
    """
    Shared pipeline for all analysis endpoints.

    Extracted so the 4 sub-path routes and the generic /analyze/ route
    all share identical logic without duplication. DRY enforcement.

    Pipeline:
    1. Server-side image compression (validate_and_compress)
    2. Prompt routing (get_prompt_and_schema)
    3. Gemma API call (gemma_client.analyze)
    4. Result parsing with DISCLAIMER injection (_parse_result)
    5. Optional R2 image storage (consent_given gate, non-fatal)
    6. Response assembly

    Error taxonomy:
    - 422: Validation errors (image size, invalid type) — raised by Pydantic or validate_and_compress
    - 503: Gemma API failure after max retries
    - 500: Unhandled errors — caught by global_exception_handler in dependencies.py
    """
    # Override type from URL path if provided (sub-path routes)
    # This ensures the request body `type` field matches the URL
    request.type = analysis_type

    # Step 1: Server-side image compression
    try:
        compressed_b64 = validate_and_compress(request.image_b64)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    # Step 2: Prompt routing
    system_prompt, output_schema = get_prompt_and_schema(request.type)

    # Step 3: Gemma API call
    try:
        raw_result = await gemma_client.analyze(
            system_prompt=system_prompt,
            output_schema=output_schema,
            image_b64=compressed_b64,
            language=request.language,
        )
    except RuntimeError as exc:
        logger.error("Gemma API failed for type=%s: %s", request.type, exc)
        raise HTTPException(status_code=503, detail=f"AI service error: {exc}") from exc

    elapsed_ms = float(raw_result.pop("_elapsed_ms", 0.0))

    # Step 4: Parse result and force-inject disclaimer
    result = _parse_result(request.type, raw_result)

    # Step 5: Optional R2 storage — non-fatal by design
    # WHY bare except here: storage failure must NEVER block the clinical response.
    # This is the ONLY permitted bare except/pass pattern in the codebase.
    image_stored = False
    image_url: str | None = None
    if request.consent_given and storage_service.is_configured():
        try:
            image_url = storage_service.upload_image(compressed_b64, request.type)
            image_stored = image_url is not None
        except Exception:  # noqa: BLE001 — storage failure is explicitly non-fatal
            pass

    # Step 6: Response assembly
    return AnalyzeResponse(
        type=request.type,
        result=result,
        processing_time_ms=elapsed_ms,
        model_used=gemma_client._model_name,
        image_stored=image_stored,
        image_url=image_url,
    )


# ---------------------------------------------------------------------------
# Sub-path routes — match frontend endpoint calls exactly
# Frontend in src/api/endpoints.ts calls these specific URLs.
# ---------------------------------------------------------------------------

@router.post("/teststrip", response_model=AnalyzeResponse)
async def analyze_teststrip(request: AnalyzeRequest) -> AnalyzeResponse:
    """POST /analyze/teststrip — rapid diagnostic test strip analysis."""
    return await _run_analysis(request, AnalysisType.TESTSTRIP)


@router.post("/medscan", response_model=AnalyzeResponse)
async def analyze_medscan(request: AnalyzeRequest) -> AnalyzeResponse:
    """POST /analyze/medscan — medication packaging and label analysis."""
    return await _run_analysis(request, AnalysisType.MEDSCAN)


@router.post("/woundassess", response_model=AnalyzeResponse)
async def analyze_woundassess(request: AnalyzeRequest) -> AnalyzeResponse:
    """POST /analyze/woundassess — wound severity and care assessment."""
    return await _run_analysis(request, AnalysisType.WOUNDASSESS)


@router.post("/docreader", response_model=AnalyzeResponse)
async def analyze_docreader(request: AnalyzeRequest) -> AnalyzeResponse:
    """POST /analyze/docreader — clinical document extraction and summarisation."""
    return await _run_analysis(request, AnalysisType.DOCREADER)


# ---------------------------------------------------------------------------
# Generic route — kept for backward compatibility and Swagger testing.
# Takes `type` from the request body. The sub-path routes above are preferred.
# ---------------------------------------------------------------------------

@router.post("/", response_model=AnalyzeResponse)
async def analyze_image(request: AnalyzeRequest) -> AnalyzeResponse:
    """POST /analyze/ — generic endpoint (type specified in body).

    Prefer the sub-path routes (/analyze/teststrip etc.) from application code.
    This route is retained for direct Swagger UI testing and backward compatibility.
    """
    return await _run_analysis(request, request.type)
