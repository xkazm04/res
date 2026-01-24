"""Export format renderers for research reports."""

from .base import BaseExporter, ExportResult
from .pdf import PDFExporter
from .docx import DOCXExporter
from .json_ld import JSONLDExporter
from .obsidian import ObsidianExporter
from .slack import SlackExporter

__all__ = [
    "BaseExporter",
    "ExportResult",
    "PDFExporter",
    "DOCXExporter",
    "JSONLDExporter",
    "ObsidianExporter",
    "SlackExporter",
]


def get_exporter(format_name: str) -> BaseExporter:
    """Get exporter instance by format name.

    Args:
        format_name: One of 'pdf', 'docx', 'json_ld', 'obsidian', 'slack'

    Returns:
        Exporter instance for the specified format

    Raises:
        ValueError: If format is not supported
    """
    exporters = {
        "pdf": PDFExporter,
        "docx": DOCXExporter,
        "json_ld": JSONLDExporter,
        "json-ld": JSONLDExporter,
        "obsidian": ObsidianExporter,
        "slack": SlackExporter,
    }

    exporter_class = exporters.get(format_name.lower())
    if not exporter_class:
        supported = ", ".join(sorted(set(exporters.keys())))
        raise ValueError(f"Unsupported export format: {format_name}. Supported: {supported}")

    return exporter_class()


def get_supported_formats() -> list:
    """Get list of supported export formats."""
    return ["pdf", "docx", "json_ld", "obsidian", "slack"]
