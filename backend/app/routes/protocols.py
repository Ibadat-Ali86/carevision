from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.schemas.common import DISCLAIMER
from app.services.gemma_client import gemma_client

router = APIRouter(prefix="/protocols", tags=["protocols"])


class ProtocolRequest(BaseModel):
    query: str
    language: str = "en"
    image_b64: str | None = None
    context: str | None = None


class ProtocolResponse(BaseModel):
    answer: str
    source_note: str
    disclaimer: str


@router.post("/", response_model=ProtocolResponse)
async def query_protocol(request: ProtocolRequest) -> ProtocolResponse:
    """POST /protocols/ — text-only Protocol Assistant endpoint.

    Calls Gemma 4 with the protocol system prompt and the CHW's question.
    No image processing. No function calling — free-text response.
    Temperature 0.2 (set inside gemma_client.query_protocol).

    Returns a structured response with answer, source_note, and mandatory disclaimer.
    """
    try:
        raw_answer = await gemma_client.query_protocol(
            query=request.query,
            language=request.language,
            image_b64=request.image_b64,
            context=request.context,
        )
    except RuntimeError as exc:
        exc_str = str(exc)
        if "API_KEY_INVALID" in exc_str or "API_BAD_REQUEST" in exc_str:
            status_code = 400
        elif "API_TIMEOUT" in exc_str:
            status_code = 504
        elif "API_QUOTA_EXHAUSTED" in exc_str:
            status_code = 429
        else:
            status_code = 503
        raise HTTPException(
            status_code=status_code,
            detail=f"Protocol assistant unavailable: {exc}",
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Protocol assistant internal error: {exc}",
        ) from exc

    # Extract source_note from response if model included it; otherwise use default.
    # WHY: query_protocol returns free text — we parse a best-effort source note.
    source_note = "Based on WHO clinical guidelines and standard CHW training protocols."
    answer = raw_answer

    if "Source:" in raw_answer:
        parts = raw_answer.split("Source:", 1)
        answer = parts[0].strip()
        source_note = parts[1].strip()
    elif "Based on" in raw_answer:
        # Model included citation inline — use as-is
        pass

    return ProtocolResponse(
        answer=answer,
        source_note=source_note,
        disclaimer=DISCLAIMER,
    )
