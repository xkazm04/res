"""PDF processing utilities using PyMuPDF."""

import logging
from typing import List, Tuple
from io import BytesIO

logger = logging.getLogger(__name__)

try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False
    fitz = None


def pdf_to_images(
    pdf_bytes: bytes,
    dpi: int = 150,
    max_pages: int = 50,
) -> List[Tuple[bytes, int]]:
    """
    Convert PDF pages to images.

    Args:
        pdf_bytes: Raw PDF file bytes
        dpi: Resolution for rendering (default 150)
        max_pages: Maximum pages to process

    Returns:
        List of tuples: (image_bytes, page_number)
    """
    if not PYMUPDF_AVAILABLE:
        raise ImportError(
            "PyMuPDF not installed. "
            "Install with: pip install pymupdf"
        )

    images = []
    doc = None

    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        num_pages = min(len(doc), max_pages)

        for page_num in range(num_pages):
            page = doc[page_num]
            # Render at specified DPI
            zoom = dpi / 72.0
            mat = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=mat)

            # Convert to PNG bytes
            img_bytes = pix.tobytes("png")
            images.append((img_bytes, page_num + 1))

            logger.debug(f"Rendered page {page_num + 1}/{num_pages}")

    except Exception as e:
        logger.error(f"PDF processing error: {e}")
        raise

    finally:
        if doc:
            doc.close()

    return images


def get_pdf_info(pdf_bytes: bytes) -> dict:
    """
    Get PDF metadata and page count.

    Args:
        pdf_bytes: Raw PDF file bytes

    Returns:
        Dict with 'page_count', 'title', 'author', etc.
    """
    if not PYMUPDF_AVAILABLE:
        raise ImportError("PyMuPDF not installed")

    doc = None
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        metadata = doc.metadata or {}

        return {
            "page_count": len(doc),
            "title": metadata.get("title", ""),
            "author": metadata.get("author", ""),
            "subject": metadata.get("subject", ""),
            "creator": metadata.get("creator", ""),
            "producer": metadata.get("producer", ""),
        }

    finally:
        if doc:
            doc.close()
