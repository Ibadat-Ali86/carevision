from __future__ import annotations

import json
import logging
import time
from typing import Any

from openai import AsyncOpenAI

from app.config import settings

logger = logging.getLogger(__name__)


class GemmaClient:
    """Sole integration point with the NVIDIA NIM API (OpenAI compatible).

    Handles image+prompt composition, function calling for structured JSON
    output, retry logic, and latency logging.

    DESIGN DECISIONS:
    - Module-level singleton: SDK client initialised once at import; never per-request.
    - temperature=0.1 for all analysis endpoints — enforces factual, consistent output.
    - Uses OpenAI tools spec for structured output, replacing Google's FunctionDeclaration.
    - On parse failure: retries once with a correction instruction prepended.
    - Async API: uses AsyncOpenAI to prevent event loop blocking.
    """

    def __init__(self) -> None:
        self._client = AsyncOpenAI(
            api_key=settings.gemma_api_key,
            base_url="https://integrate.api.nvidia.com/v1",
        )
        self._model_name = settings.gemma_model
        self._max_retries = settings.gemma_max_retries

    async def analyze(
        self,
        system_prompt: str,
        output_schema: dict[str, Any],
        image_b64: str,
        language: str,
        temperature: float = 0.1,
        max_output_tokens: int = 1024,
    ) -> dict[str, Any]:
        """Send an image + prompt to Gemma via NVIDIA NIM and return a structured dict.

        Args:
            system_prompt: Feature-specific clinical instruction from prompts/*.py
            output_schema: JSON schema dict used to build the tools spec
            image_b64: Pure base64 JPEG string (no data: prefix)
            language: ISO 639-1 language code for response language
            temperature: Default 0.1 for analysis; 0.2 permitted for Protocol Assistant
            max_output_tokens: Tunable per feature to manage latency

        Returns:
            dict with all output_schema fields plus _elapsed_ms for latency logging.

        Raises:
            RuntimeError: After max_retries failed attempts. Caller handles as 503.
        """
        full_prompt = (
            f"{system_prompt}\n\n"
            f"IMPORTANT: Respond in language code: {language}\n\n"
            f"You MUST respond with ONLY raw, valid JSON matching this exact schema. Do not include markdown code blocks. Schema:\n"
            f"{json.dumps(output_schema, indent=2)}"
        )

        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": full_prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{image_b64}"
                        }
                    }
                ],
            }
        ]

        last_error: Exception | None = None
        for attempt in range(self._max_retries + 1):
            try:
                t_start = time.monotonic()

                if attempt > 0:
                    messages.append({
                        "role": "user",
                        "content": "Previous response was not valid JSON matching the schema. Please try again, outputting ONLY valid JSON."
                    })

                response = await self._client.chat.completions.create(
                    model=self._model_name,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_output_tokens,
                    response_format={"type": "json_object"},
                )

                elapsed_ms = (time.monotonic() - t_start) * 1000

                result = self._extract_function_call_args(response)
                result["_elapsed_ms"] = elapsed_ms
                return result

            except Exception as exc:
                last_error = exc
                logger.warning(
                    "Gemma NIM API attempt %d/%d failed: %s",
                    attempt + 1,
                    self._max_retries + 1,
                    exc,
                )

        raise RuntimeError(
            f"Gemma NIM API failed after {self._max_retries + 1} attempts. "
            f"Last error: {last_error}"
        )

    async def query_protocol(self, query: str, language: str) -> str:
        """Text-only query for the Protocol Assistant."""
        from app.prompts.protocol import SYSTEM_PROMPT

        # Put system prompt in user message to avoid system role rejection on some NIM models
        messages = [
            {"role": "user", "content": f"{SYSTEM_PROMPT}\n\nLanguage: {language}\n\nQuestion: {query}"}
        ]

        response = await self._client.chat.completions.create(
            model=self._model_name,
            messages=messages,
            temperature=0.2,
            max_tokens=512,
        )

        return response.choices[0].message.content or ""

    @staticmethod
    def _extract_function_call_args(response: Any) -> dict[str, Any]:
        """Extract JSON from the OpenAI format response."""
        choice = response.choices[0]
        
        # If tool calls are present (legacy fallback)
        if hasattr(choice.message, "tool_calls") and choice.message.tool_calls:
            tool_call = choice.message.tool_calls[0]
            if tool_call.function.arguments:
                return json.loads(tool_call.function.arguments)

        text = choice.message.content or ""
        text = text.strip()
        
        # Remove markdown JSON code blocks if the model ignored our instruction
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

        if text.startswith("{"):
            return json.loads(text)

        raise ValueError("No parseable JSON in NIM response")


# Module-level singleton — never instantiate GemmaClient() inside a route handler.
# Importing this module is sufficient: from app.services.gemma_client import gemma_client
gemma_client = GemmaClient()
