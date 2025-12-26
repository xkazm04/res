"""OCR service for PDF and image processing."""

import logging
from typing import Optional, List, Dict, Any

import httpx

from ..clients.openrouter import OpenRouterClient
from ..utils.pdf import pdf_to_images, get_pdf_info

logger = logging.getLogger(__name__)


class OCRService:
    """Service for extracting text from PDFs and images."""

    def __init__(self, openrouter_client: OpenRouterClient):
        self.client = openrouter_client
        self.total_tokens = 0
        self.total_cost = 0.0

    async def process_file_url(
        self,
        file_url: str,
        max_pages: int = 20,
    ) -> Dict[str, Any]:
        """
        Download and process a file from URL.

        Args:
            file_url: URL to PDF or image file
            max_pages: Maximum pages to process for PDFs

        Returns:
            Dict with 'text', 'pages_processed', 'tokens', 'cost'
        """
        # Download file
        async with httpx.AsyncClient(timeout=60.0) as http_client:
            response = await http_client.get(file_url)
            response.raise_for_status()
            file_bytes = response.content
            content_type = response.headers.get("content-type", "")

        # Determine file type
        if self._is_pdf(file_bytes, content_type):
            return await self.process_pdf(file_bytes, max_pages)
        else:
            return await self.process_image(file_bytes)

    async def process_pdf(
        self,
        pdf_bytes: bytes,
        max_pages: int = 20,
    ) -> Dict[str, Any]:
        """
        Process a PDF file with OCR.

        Args:
            pdf_bytes: Raw PDF bytes
            max_pages: Maximum pages to process

        Returns:
            Dict with 'text', 'pages_processed', 'tokens', 'cost'
        """
        # Get PDF info
        info = get_pdf_info(pdf_bytes)
        total_pages = info.get("page_count", 0)

        # Convert to images
        images = pdf_to_images(pdf_bytes, dpi=150, max_pages=max_pages)

        # Process each page
        all_text = []
        total_tokens = 0
        total_cost = 0.0

        for img_bytes, page_num in images:
            try:
                result = await self.client.process_image(img_bytes)
                all_text.append(f"## Page {page_num}\n\n{result['text']}")
                total_tokens += result.get("tokens", 0)
                total_cost += result.get("cost", 0) or 0

            except Exception as e:
                logger.warning(f"Failed to process page {page_num}: {e}")
                all_text.append(f"## Page {page_num}\n\n[OCR failed: {str(e)}]")

        # Update totals
        self.total_tokens += total_tokens
        self.total_cost += total_cost

        return {
            "text": "\n\n".join(all_text),
            "pages_processed": len(images),
            "total_pages": total_pages,
            "tokens": total_tokens,
            "cost": total_cost,
            "metadata": info,
        }

    async def process_image(
        self,
        image_bytes: bytes,
    ) -> Dict[str, Any]:
        """
        Process a single image with OCR.

        Args:
            image_bytes: Raw image bytes

        Returns:
            Dict with 'text', 'tokens', 'cost'
        """
        result = await self.client.process_image(image_bytes)

        # Update totals
        self.total_tokens += result.get("tokens", 0)
        self.total_cost += result.get("cost", 0) or 0

        return {
            "text": result["text"],
            "pages_processed": 1,
            "tokens": result.get("tokens", 0),
            "cost": result.get("cost", 0),
        }

    def get_usage(self) -> Dict[str, Any]:
        """Get total usage statistics."""
        return {
            "total_tokens": self.total_tokens,
            "total_cost_usd": self.total_cost,
        }

    def _is_pdf(self, file_bytes: bytes, content_type: str) -> bool:
        """Check if file is a PDF."""
        # Check magic bytes
        if file_bytes[:4] == b'%PDF':
            return True
        # Check content type
        if 'pdf' in content_type.lower():
            return True
        return False
