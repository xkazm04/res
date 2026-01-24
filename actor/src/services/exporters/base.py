"""Base exporter class for all export formats."""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime


@dataclass
class ExportResult:
    """Result of an export operation."""

    format: str
    content: Any  # str for text formats, bytes for binary formats
    filename: str
    mime_type: str
    encoding: Optional[str] = "utf-8"  # None for binary formats
    metadata: Optional[Dict[str, Any]] = None

    def is_binary(self) -> bool:
        """Check if content is binary."""
        return isinstance(self.content, bytes)


class BaseExporter(ABC):
    """Abstract base class for export format renderers."""

    @property
    @abstractmethod
    def format_name(self) -> str:
        """Return the format name (e.g., 'pdf', 'docx')."""
        pass

    @property
    @abstractmethod
    def mime_type(self) -> str:
        """Return the MIME type for this format."""
        pass

    @property
    @abstractmethod
    def file_extension(self) -> str:
        """Return the file extension (without dot)."""
        pass

    @abstractmethod
    def export(
        self,
        research_result: Dict[str, Any],
        title: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None,
    ) -> ExportResult:
        """Export research results to the target format.

        Args:
            research_result: Dict from ResearchService.execute_research()
            title: Optional custom title for the export
            options: Format-specific export options

        Returns:
            ExportResult containing the exported content
        """
        pass

    def _generate_filename(self, title: str, query: str) -> str:
        """Generate a safe filename from title or query."""
        base = title or query[:50]
        # Replace unsafe characters
        safe_chars = "".join(c if c.isalnum() or c in " -_" else "_" for c in base)
        # Remove multiple underscores and trim
        safe_chars = "_".join(filter(None, safe_chars.split("_")))
        timestamp = datetime.now().strftime("%Y%m%d_%H%M")
        return f"{safe_chars[:40]}_{timestamp}.{self.file_extension}"

    def _get_branding(self, options: Optional[Dict[str, Any]] = None) -> Dict[str, str]:
        """Get branding information from options or defaults."""
        options = options or {}
        return {
            "company_name": options.get("company_name", "Deep Research"),
            "logo_url": options.get("logo_url", ""),
            "primary_color": options.get("primary_color", "#1e293b"),
            "accent_color": options.get("accent_color", "#3b82f6"),
        }

    def _format_date(self, dt: Optional[datetime] = None) -> str:
        """Format datetime for display."""
        dt = dt or datetime.now()
        return dt.strftime("%B %d, %Y at %H:%M")
