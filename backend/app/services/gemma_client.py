from __future__ import annotations

import logging
import time
from typing import Any

import google.generativeai as genai
from google.generativeai.types import GenerationConfig

from app.config import settings

logger = logging.getLogger(__name__)


class GemmaClient:
    """Sole integration point with the Google Generative AI SDK.

    Handles image+prompt composition, function calling for structured JSON
    output, retry logic, and latency logging.

    DESIGN DECISIONS:
    - Module-level singleton: SDK client initialised once at import; never per-request.
    - temperature=0.1 for all analysis endpoints — enforces factual, consistent output.
      Raising temperature increases hallucination risk for clinical content.
    - Function calling (FunctionDeclaration) forces structured JSON output, eliminating
      the JSON parsing fragility of prompt-based extraction approaches.
    - On parse failure: retries once with a correction instruction prepended.
      Retry cap = gemma_max_retries (default 2) to avoid quota exhaustion.
    """

    def __init__(self) -> None:
        genai.configure(api_key=settings.gemma_api_key)
        self._model_name = settings.gemma_model
        self._max_retries = settings.gemma_max_retries

    def analyze(
        self,
        system_prompt: str,
        output_schema: dict[str, Any],
        image_b64: str,
        language: str,
        temperature: float = 0.1,
        max_output_tokens: int = 1024,
    ) -> dict[str, Any]:
        """Send an image + prompt to Gemma 4 and return a structured dict.

        Args:
            system_prompt: Feature-specific clinical instruction from prompts/*.py
            output_schema: JSON schema dict used to build the FunctionDeclaration
            image_b64: Pure base64 JPEG string (no data: prefix)
            language: ISO 639-1 language code for response language
            temperature: Default 0.1 for analysis; 0.2 permitted for Protocol Assistant
            max_output_tokens: Tunable per feature to manage latency

        Returns:
            dict with all output_schema fields plus _elapsed_ms for latency logging.

        Raises:
            RuntimeError: After max_retries failed attempts. Caller handles as 503.
        """
        # Append language directive — only dynamic element in the prompt
        full_prompt = f"{system_prompt}\n\nIMPORTANT: Respond in language code: {language}"

        tool = genai.protos.Tool(
            function_declarations=[
                genai.protos.FunctionDeclaration(
                    name="return_analysis",
                    description="Return the structured clinical analysis result",
                    parameters=genai.protos.Schema(
                        type=genai.protos.Type.OBJECT,
                        properties={
                            k: self._build_schema_property(v)
                            for k, v in output_schema["properties"].items()
                        },
                        required=output_schema.get("required", []),
                    ),
                )
            ]
        )

        image_part = {
            "mime_type": "image/jpeg",
            "data": image_b64,
        }

        model = genai.GenerativeModel(
            model_name=self._model_name,
            system_instruction=full_prompt,
        )

        generation_config = GenerationConfig(
            temperature=temperature,
            max_output_tokens=max_output_tokens,
        )

        last_error: Exception | None = None
        for attempt in range(self._max_retries + 1):
            try:
                t_start = time.monotonic()

                content: list[Any] = [image_part]
                if attempt > 0:
                    # On retry: prepend correction instruction to help model recover
                    content = [
                        "Previous response did not use the required function call format. "
                        "You MUST call the return_analysis function with all required fields.",
                        image_part,
                    ]

                response = model.generate_content(
                    content,
                    tools=[tool],
                    generation_config=generation_config,
                )

                elapsed_ms = (time.monotonic() - t_start) * 1000

                result = self._extract_function_call_args(response)
                result["_elapsed_ms"] = elapsed_ms
                return result

            except Exception as exc:
                last_error = exc
                logger.warning(
                    "Gemma 4 attempt %d/%d failed: %s",
                    attempt + 1,
                    self._max_retries + 1,
                    exc,
                )

        raise RuntimeError(
            f"Gemma 4 API failed after {self._max_retries + 1} attempts. "
            f"Last error: {last_error}"
        )

    def query_protocol(self, query: str, language: str) -> str:
        """Text-only query for the Protocol Assistant (no image, no function call).

        Temperature 0.2 — slightly higher than analysis to allow more natural prose.
        max_output_tokens 512 — protocol answers must be concise.
        """
        from app.prompts.protocol import SYSTEM_PROMPT

        model = genai.GenerativeModel(
            model_name=self._model_name,
            system_instruction=SYSTEM_PROMPT,
        )

        response = model.generate_content(
            f"Language: {language}\n\nQuestion: {query}",
            generation_config=GenerationConfig(temperature=0.2, max_output_tokens=512),
        )

        return response.text or ""

    @staticmethod
    def _extract_function_call_args(response: Any) -> dict[str, Any]:
        """Extract function_call.args from the Gemma 4 response.

        Falls back to JSON parsing of response.text if no function call is present.
        WHY fallback: Some model versions return structured text instead of function
        calls on first attempt; the retry path re-enforces the function call format.
        """
        import json

        candidates = getattr(response, "candidates", [])
        if candidates:
            parts = getattr(candidates[0].content, "parts", [])
            for part in parts:
                if hasattr(part, "function_call") and part.function_call:
                    return dict(part.function_call.args)

        # Fallback: try to parse raw text as JSON
        text = getattr(response, "text", "") or ""
        text = text.strip()
        if text.startswith("{"):
            return json.loads(text)

        raise ValueError("No function call or parseable JSON in Gemma 4 response")

    @staticmethod
    def _build_schema_property(prop: dict[str, Any]) -> genai.protos.Schema:
        """Convert a JSON schema property dict to a Gemma SDK Schema object."""
        type_map = {
            "string": genai.protos.Type.STRING,
            "integer": genai.protos.Type.INTEGER,
            "boolean": genai.protos.Type.BOOLEAN,
            "array": genai.protos.Type.ARRAY,
            "object": genai.protos.Type.OBJECT,
            "number": genai.protos.Type.NUMBER,
        }

        prop_type = type_map.get(prop.get("type", "string"), genai.protos.Type.STRING)

        kwargs: dict[str, Any] = {
            "type_": prop_type,
            "description": prop.get("description", ""),
        }

        if prop_type == genai.protos.Type.ARRAY and "items" in prop:
            kwargs["items"] = GemmaClient._build_schema_property(prop["items"])

        if "enum" in prop:
            kwargs["enum"] = prop["enum"]

        return genai.protos.Schema(**kwargs)


# Module-level singleton — never instantiate GemmaClient() inside a route handler.
# Importing this module is sufficient: from app.services.gemma_client import gemma_client
gemma_client = GemmaClient()
