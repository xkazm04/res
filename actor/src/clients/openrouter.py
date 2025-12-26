"""OpenRouter client for OCR using vision models."""

import base64
import logging
from typing import Optional, Dict, Any

import httpx

logger = logging.getLogger(__name__)

OCR_PROMPT = """Extract all text from this document image.
Preserve the original structure including:
- Paragraphs and line breaks
- Tables (use markdown table format)
- Lists (numbered and bulleted)
- Headers and sections

Output the extracted text in clean Markdown format.
Only output the extracted content, no explanations."""


class OpenRouterClient:
    """OCR client using OpenRouter API with vision models."""

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://openrouter.ai/api/v1",
        model: str = "google/gemini-2.0-flash-001",
    ):
        self.api_key = api_key
        self.base_url = base_url
        self.model = model

    def is_available(self) -> bool:
        """Check if API key is configured."""
        return bool(self.api_key)

    async def process_image(
        self,
        image_bytes: bytes,
        prompt: Optional[str] = None,
        max_tokens: int = 4096,
    ) -> Dict[str, Any]:
        """
        Process an image with OCR.

        Args:
            image_bytes: Raw image bytes
            prompt: Optional custom prompt (defaults to OCR_PROMPT)
            max_tokens: Maximum output tokens

        Returns:
            Dict with 'text', 'tokens', 'cost' keys
        """
        if not self.is_available():
            raise ValueError("OpenRouter API key not configured")

        mime_type = self._get_mime_type(image_bytes)
        base64_image = base64.b64encode(image_bytes).decode("utf-8")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://apify-deep-research.app",
            "X-Title": "Deep Research Actor"
        }

        payload = {
            "model": self.model,
            "messages": [{
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt or OCR_PROMPT},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{mime_type};base64,{base64_image}"
                        }
                    }
                ]
            }],
            "max_tokens": max_tokens
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            data = response.json()

        text = data["choices"][0]["message"]["content"]
        usage = data.get("usage", {})

        return {
            "text": text,
            "tokens": usage.get("total_tokens", 0),
            "cost": self._estimate_cost(usage)
        }

    async def analyze_document(
        self,
        image_bytes: bytes,
        analysis_prompt: str,
    ) -> Dict[str, Any]:
        """
        Analyze a document image with custom prompt.

        Args:
            image_bytes: Raw image bytes
            analysis_prompt: Custom analysis prompt

        Returns:
            Dict with 'text', 'tokens', 'cost' keys
        """
        return await self.process_image(image_bytes, prompt=analysis_prompt)

    def _get_mime_type(self, image_bytes: bytes) -> str:
        """Detect image MIME type from magic bytes."""
        if image_bytes[:8] == b'\x89PNG\r\n\x1a\n':
            return "image/png"
        elif image_bytes[:2] == b'\xff\xd8':
            return "image/jpeg"
        elif image_bytes[:4] == b'GIF8':
            return "image/gif"
        elif image_bytes[:4] == b'RIFF' and image_bytes[8:12] == b'WEBP':
            return "image/webp"
        else:
            return "image/png"  # Default

    def _estimate_cost(self, usage: Dict[str, Any]) -> Optional[float]:
        """Estimate cost based on token usage."""
        total = usage.get("total_tokens", 0)
        if not total:
            return None
        # Gemini Flash rate via OpenRouter: ~$0.50/1M tokens
        return (total / 1_000_000) * 0.50
