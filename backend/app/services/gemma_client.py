import json
import logging
import time
from typing import Any

from openai import AsyncOpenAI
from app.config import settings

logger = logging.getLogger(__name__)


class GemmaClient:
    """Sole integration point with the Google AI Studio (OpenAI-compatible) API.

    Handles image+prompt composition, structured JSON output extraction,
    retry logic, and latency logging.
    """

    def __init__(self) -> None:
        self._client = AsyncOpenAI(
            api_key=settings.gemma_api_key,
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
            timeout=float(settings.gemma_timeout_seconds),
            max_retries=0,  # We handle retries manually in analyze() with logging
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
        """Send an image + prompt to Google AI Studio and return a structured dict."""
        
        full_prompt = (
            f"{system_prompt}\n\n"
            f"IMPORTANT: All natural language text in your JSON values MUST be in the language corresponding to ISO code '{language}'.\n\n"
            f"OUTPUT INSTRUCTIONS:\n"
            f"- Output ONLY a valid JSON object containing the requested clinical data.\n"
            f"- DO NOT output a JSON Schema definition (do not use 'properties' or 'type: object' as root keys).\n"
            f"- Your JSON must strictly conform to the fields required by this JSON Schema:\n\n"
            f"{json.dumps(output_schema, indent=2)}\n\n"
            f"Return ONLY the raw JSON data object. No markdown formatting, no explanations."
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
                import openai
                if isinstance(exc, openai.RateLimitError):
                    logger.error("Rate limit or quota exhausted: %s", exc)
                    # For hackathon: fail fast with friendly message instead of retrying forever
                    raise RuntimeError(
                        "API_QUOTA_EXHAUSTED: We are experiencing high traffic and have reached our "
                        "Gemini API limits for the hackathon demonstration. Please check out our "
                        "demo video in the README to see this feature in action!"
                    ) from exc

                logger.warning(
                    "Google API attempt %d/%d failed: %s",
                    attempt + 1,
                    self._max_retries + 1,
                    exc,
                )

        raise RuntimeError(
            f"Google API failed after {self._max_retries + 1} attempts. "
            f"Last error: {last_error}"
        )

    async def query_protocol(
        self,
        query: str,
        language: str,
        image_b64: str | None = None,
        context: str | None = None,
    ) -> str:
        """Context-aware multimodal query for the Protocol Assistant."""
        from app.prompts.protocol import SYSTEM_PROMPT

        context_block = f"CONTEXT FROM PREVIOUS ANALYSIS:\n{context}\n\n" if context else ""
        
        text_prompt = (
            f"{SYSTEM_PROMPT}\n\n"
            f"CRITICAL INSTRUCTION: You MUST formulate your entire response in the language corresponding to the ISO code '{language}'. "
            f"Do NOT answer in English unless the language code is 'en'. "
            f"If the user explicitly asks you to answer in a different language, you MUST honor their request. "
            f"Otherwise, your response MUST be in the language: {language}\n\n"
            f"{context_block}"
            f"Question: {query}"
        )

        if image_b64:
            messages = [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": text_prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_b64}"
                            }
                        }
                    ],
                }
            ]
        else:
            messages = [
                {"role": "user", "content": text_prompt}
            ]

        try:
            response = await self._client.chat.completions.create(
                model=self._model_name,
                messages=messages,
                temperature=0.2,
                max_tokens=512,
            )
        except Exception as exc:
            import openai
            if isinstance(exc, openai.RateLimitError):
                raise RuntimeError(
                    "API_QUOTA_EXHAUSTED: We are experiencing high traffic and have reached our "
                    "Gemini API limits for the hackathon demonstration. Please check out our "
                    "demo video in the README to see this feature in action!"
                ) from exc
            raise

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
                
        raise ValueError(f"No parseable JSON in Google API response: {text[:100]}...")


# Module-level singleton — never instantiate GemmaClient() inside a route handler.
gemma_client = GemmaClient()
