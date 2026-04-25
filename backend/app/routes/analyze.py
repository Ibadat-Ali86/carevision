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

# Schema map for _parse_result — explicit dict preferred over globals() lookup (Section 10.2)
_RESULT_SCHEMA_MAP: dict[str, type] = {
    AnalysisType.TESTSTRIP: TestStripResult,
    AnalysisType.MEDSCAN: MedScanResult,
    AnalysisType.WOUNDASSESS: WoundAssessResult,
    AnalysisType.DOCREADER: DocReaderResult,
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


@router.post("/", response_model=AnalyzeResponse)
async def analyze_image(request: AnalyzeRequest) -> AnalyzeResponse:
    """POST /analyze/ — primary multimodal analysis endpoint.

    Orchestrates the full pipeline:
    1. Server-side image compression (validate_and_compress)
    2. Prompt routing (get_prompt_and_schema)
    3. Gemma 4 call (gemma_client.analyze)
    4. Result parsing with DISCLAIMER injection (_parse_result)
    5. Optional R2 image storage (consent_given gate)
    6. Response assembly

    Error taxonomy:
    - 422: Validation errors (image size, invalid type) — raised by Pydantic
    - 503: Gemma 4 API failure after max retries
    - 500: Unhandled errors — caught by global_exception_handler in dependencies.py
    """
    # Step 1: Server-side image compression
    try:
        compressed_b64 = validate_and_compress(request.image_b64)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    # Step 2: Prompt routing
    system_prompt, output_schema = get_prompt_and_schema(request.type)

    # Step 3: Gemma 4 call
    try:
        raw_result = gemma_client.analyze(
            system_prompt=system_prompt,
            output_schema=output_schema,
            image_b64=compressed_b64,
            language=request.language,
        )
    except RuntimeError as exc:
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
            image_stored = image_url is not None or storage_service.is_configured()
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
