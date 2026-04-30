import json
import logging
import time
from typing import Any

from openai import AsyncOpenAI
from app.config import settings

logger = logging.getLogger(__name__)


class GemmaClient:
    """Sole integration point with the NVIDIA NIM (OpenAI-compatible) API.

    Handles image+prompt composition, structured JSON output extraction,
    retry logic, and latency logging.
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
        """Send an image + prompt to NVIDIA NIM and return a structured dict."""
        
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

        import re
        text = choice.message.content or ""
        text = text.strip()
        
        # Look for JSON block anywhere in the text using regex
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass
                
        raise ValueError(f"No parseable JSON in NIM response: {text[:100]}...")


# Module-level singleton — never instantiate GemmaClient() inside a route handler.
gemma_client = GemmaClient()
