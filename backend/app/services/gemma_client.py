from __future__ import annotations

import json
import logging
import time
from typing import Any

import openai
from openai import AsyncOpenAI
from app.config import settings

logger = logging.getLogger(__name__)

# ─── Provider constants ───────────────────────────────────────────────────────
# WHY separate vision/text models for NVIDIA:
# Gemma 3 on NVIDIA NIM is text-only (no vision). Image analysis requires a
# separate vision-capable model. The instructor's free NVIDIA key grants access
# to Google Gemma models AND Llama 3.2 Vision on the free NIM tier.
_NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"
_NVIDIA_TEXT_MODEL = "google/gemma-3-27b-it"          # Gemma 3 on NVIDIA NIM — text only
_NVIDIA_VISION_MODEL = "meta/llama-3.2-11b-vision-instruct"  # 11B is on free tier; 90B is paid

_GOOGLE_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"
# gemini-2.0-flash supports both text and vision and is the recommended model
# for the Google AI hackathon.


def _classify_api_error(exc: Exception) -> RuntimeError | None:
    """Map openai SDK exceptions to typed RuntimeError strings.

    WHY centralise: Both analyze() and query_protocol() need identical
    mapping logic. A single function prevents drift between the two call
    sites and makes future provider additions trivial.

    WHY catch APIStatusError last: It is the base class for AuthenticationError,
    PermissionDeniedError, RateLimitError, and BadRequestError. Checking it
    AFTER the specific subclasses ensures the most precise error message.
    NVIDIA NIM sometimes returns 403/429 in a non-standard JSON body that the
    SDK fails to parse into a subclass, so APIStatusError.status_code is the
    authoritative fallback.

    Returns None if the error should be retried.
    """
    if isinstance(exc, (openai.AuthenticationError, openai.PermissionDeniedError)):
        return RuntimeError(
            "API_KEY_INVALID: The API key is invalid or does not have permission "
            "to access this model. Verify your Railway environment variable."
        )

    if isinstance(exc, openai.RateLimitError):
        return RuntimeError(
            "API_QUOTA_EXHAUSTED: The API quota is exhausted. "
            "Please try again shortly or use a different API key."
        )

    if isinstance(exc, openai.BadRequestError):
        return RuntimeError(
            f"API_BAD_REQUEST: The provider rejected the request — {exc}"
        )

    if isinstance(exc, (openai.APITimeoutError, openai.APIConnectionError)):
        return RuntimeError(
            "API_TIMEOUT: The AI provider did not respond in time. "
            "Please try again in a few moments."
        )

    # Catch-all for NVIDIA and other providers that return non-standard
    # JSON bodies: the SDK surfaces these as generic APIStatusError objects
    # with a numeric status_code rather than a typed subclass.
    if isinstance(exc, openai.APIStatusError):
        code = exc.status_code
        if code in (401, 403):
            return RuntimeError(
                f"API_KEY_INVALID: Provider returned HTTP {code} — "
                "the API key is invalid, expired, or lacks model access. "
                "Check your Railway environment variable."
            )
        if code == 429:
            return RuntimeError(
                "API_QUOTA_EXHAUSTED: Provider returned HTTP 429 — quota exhausted. "
                "Please try again shortly."
            )
        if code == 400:
            return RuntimeError(
                f"API_BAD_REQUEST: Provider returned HTTP 400 — {exc}"
            )
        if code >= 500:
            # Provider-side error — safe to retry
            return None

    # Unknown error — do not suppress; allow retry loop to continue
    return None


class GemmaClient:
    """Unified integration point for Google AI Studio and NVIDIA NIM.

    Provider is auto-selected based on the resolved API key prefix:
      - Keys starting with "nvapi-" → NVIDIA NIM
      - All others → Google AI Studio (Gemini/Gemma)

    WHY separate text and vision models for NVIDIA:
    Google Gemma 3 on NVIDIA NIM is text-only (no vision API). Image analysis
    requires routing to llama-3.2-11b-vision-instruct which IS available on the
    NVIDIA free (student) tier.

    WHY module-level singleton (see bottom of file):
    AsyncOpenAI client maintains an internal connection pool. Creating it per-
    request would open a new TLS session per call. The singleton reuses the pool
    across the process lifetime, amortising TLS handshake overhead.
    """

    def __init__(self) -> None:
        api_key = settings.gemma_api_key.strip()
        self._is_nvidia = api_key.startswith("nvapi-")

        if self._is_nvidia:
            base_url = _NVIDIA_BASE_URL
            # Separate models: text for Protocol Assistant, vision for image analysis
            self._text_model = _NVIDIA_TEXT_MODEL
            self._vision_model = _NVIDIA_VISION_MODEL
            logger.info(
                "GemmaClient: provider=NVIDIA NIM | text_model=%s | vision_model=%s",
                self._text_model,
                self._vision_model,
            )
        else:
            base_url = _GOOGLE_BASE_URL
            # Google Gemini handles both text and vision with one model
            self._text_model = settings.gemma_model
            self._vision_model = settings.gemma_model
            logger.info(
                "GemmaClient: provider=Google AI Studio | model=%s",
                self._text_model,
            )

        self._client = AsyncOpenAI(
            api_key=api_key,
            base_url=base_url,
            timeout=float(settings.gemma_timeout_seconds),
            max_retries=0,  # Manual retry loop below provides structured logging
        )
        self._max_retries = settings.gemma_max_retries

    # ── Public interface ──────────────────────────────────────────────────────

    async def analyze(
        self,
        system_prompt: str,
        output_schema: dict[str, Any],
        image_b64: str,
        language: str,
        temperature: float = 0.1,
        max_output_tokens: int = 1024,
    ) -> dict[str, Any]:
        """Submit an image + prompt for structured clinical analysis.

        Routes to the vision-capable model regardless of provider.
        Returns a dict conforming to output_schema with an injected
        _elapsed_ms key for latency logging.
        """
        full_prompt = (
            f"{system_prompt}\n\n"
            f"IMPORTANT: All natural language text in your JSON values MUST be "
            f"in the language corresponding to ISO code '{language}'.\n\n"
            f"OUTPUT INSTRUCTIONS:\n"
            f"- Output ONLY a valid JSON object containing the requested clinical data.\n"
            f"- DO NOT output a JSON Schema definition.\n"
            f"- Strictly conform to this JSON Schema:\n\n"
            f"{json.dumps(output_schema, indent=2)}\n\n"
            f"Return ONLY the raw JSON data object. No markdown, no explanations."
        )

        messages: list[dict[str, Any]] = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": full_prompt},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"},
                    },
                ],
            }
        ]

        last_error: Exception | None = None
        for attempt in range(self._max_retries + 1):
            if attempt > 0:
                messages.append({
                    "role": "user",
                    "content": (
                        "Previous response was not valid JSON matching the schema. "
                        "Please output ONLY valid JSON."
                    ),
                })

            try:
                t_start = time.monotonic()
                response = await self._client.chat.completions.create(
                    model=self._vision_model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_output_tokens,
                )
                elapsed_ms = (time.monotonic() - t_start) * 1000
                result = self._extract_json(response)
                result["_elapsed_ms"] = elapsed_ms
                return result

            except Exception as exc:
                last_error = exc
                mapped = _classify_api_error(exc)
                if mapped is not None:
                    # Non-retryable — raise immediately with a clean message
                    logger.error("AI analyze() fatal error: %s", mapped)
                    raise mapped from exc
                logger.warning(
                    "AI analyze() attempt %d/%d failed: %s",
                    attempt + 1,
                    self._max_retries + 1,
                    exc,
                )

        raise RuntimeError(
            f"AI API failed after {self._max_retries + 1} attempts. "
            f"Last error: {last_error}"
        )

    async def query_protocol(
        self,
        query: str,
        language: str,
        image_b64: str | None = None,
        context: str | None = None,
    ) -> str:
        """Submit a text (± image) query to the Clinical Protocol Assistant.

        Routes to the text model. On NVIDIA, this is the Gemma 3 model;
        on Google, it is gemini-2.0-flash (same as vision).
        """
        from app.prompts.protocol import SYSTEM_PROMPT

        context_block = (
            f"CONTEXT FROM PREVIOUS ANALYSIS:\n{context}\n\n" if context else ""
        )
        text_prompt = (
            f"{SYSTEM_PROMPT}\n\n"
            f"CRITICAL INSTRUCTION: You MUST respond in the language with ISO code "
            f"'{language}'. Do NOT answer in English unless the code is 'en'. "
            f"If the user asks for a different language, honor that request.\n\n"
            f"{context_block}"
            f"Question: {query}"
        )

        # On NVIDIA: Gemma 3 is text-only — strip image even if provided
        # On Google: gemini-2.0-flash handles both
        if image_b64 and not self._is_nvidia:
            messages: list[dict[str, Any]] = [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": text_prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_b64}"
                            },
                        },
                    ],
                }
            ]
        else:
            messages = [{"role": "user", "content": text_prompt}]

        try:
            response = await self._client.chat.completions.create(
                model=self._text_model,
                messages=messages,
                temperature=0.2,
                max_tokens=512,
            )
            return response.choices[0].message.content or ""

        except Exception as exc:
            mapped = _classify_api_error(exc)
            if mapped is not None:
                logger.error("AI query_protocol() fatal error: %s", mapped)
                raise mapped from exc
            raise

    # ── Private helpers ───────────────────────────────────────────────────────

    @staticmethod
    def _extract_json(response: Any) -> dict[str, Any]:
        """Extract a JSON dict from an OpenAI-format chat completion response.

        WHY regex fallback: Some model configurations wrap JSON in markdown
        fences (```json ... ```) despite instructions not to. The regex finds
        the first {...} block and parses it directly.
        """
        import re

        choice = response.choices[0]

        # Tool-call path (legacy, some model configs)
        if hasattr(choice.message, "tool_calls") and choice.message.tool_calls:
            tc = choice.message.tool_calls[0]
            if tc.function.arguments:
                return json.loads(tc.function.arguments)

        text = (choice.message.content or "").strip()
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass

        raise ValueError(f"No parseable JSON in API response: {text[:200]!r}")


# Module-level singleton — import this, never instantiate GemmaClient() in routes.
gemma_client = GemmaClient()
