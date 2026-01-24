"""Report generation service."""

from typing import List, Dict, Any, Optional, Union
from datetime import datetime

from .report_interactive import generate_interactive_html
from .exporters import get_exporter, get_supported_formats, ExportResult
from ..templates import get_template, BaseTemplate


class ReportService:
    """Generates markdown and HTML reports from research results.

    Report generation is delegated to template classes, which have domain-specific
    knowledge about how to render findings for their particular research type.
    For example, FinancialTemplate knows how to render an investment thesis,
    while ContractTemplate knows how to render a red flags summary.

    Supported formats:
    - markdown: Standard markdown format
    - html: Rich interactive HTML
    - pdf: Print-optimized HTML for PDF conversion
    - docx: DOCX structure as JSON (use with python-docx)
    - json_ld: JSON-LD structured data for SEO/knowledge graphs
    - obsidian: Obsidian markdown with wiki-links and frontmatter
    - slack: Slack Block Kit message JSON
    """

    @staticmethod
    def get_supported_formats() -> List[str]:
        """Get list of all supported export formats."""
        return ["markdown", "html"] + get_supported_formats()

    def export(
        self,
        research_result: Dict[str, Any],
        format: str = "markdown",
        variant: str = "full_report",
        title: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Export research results to specified format.

        Args:
            research_result: Dict from ResearchService.execute_research()
            format: Export format (markdown, html, pdf, docx, json_ld, obsidian, slack)
            variant: Report variant for markdown/html (executive_summary, full_report, investment_thesis)
            title: Optional custom title
            options: Format-specific options

        Returns:
            Dict with keys:
                - content: The exported content (str or bytes)
                - filename: Suggested filename
                - mime_type: MIME type for the content
                - format: Format name
                - metadata: Additional format-specific metadata
        """
        options = options or {}

        # Handle legacy formats
        if format == "markdown":
            content = self.generate_markdown(research_result, variant, title)
            query = research_result.get("query", "research")[:40]
            filename = f"research_{query.replace(' ', '_')}.md"
            return {
                "content": content,
                "filename": filename,
                "mime_type": "text/markdown",
                "format": "markdown",
                "metadata": {"variant": variant},
            }

        if format == "html":
            markdown_content = self.generate_markdown(research_result, variant, title)
            content = self.generate_html(markdown_content, title or "Research Report", research_result)
            query = research_result.get("query", "research")[:40]
            filename = f"research_{query.replace(' ', '_')}.html"
            return {
                "content": content,
                "filename": filename,
                "mime_type": "text/html",
                "format": "html",
                "metadata": {"variant": variant, "interactive": bool(research_result)},
            }

        # Use extended format exporters
        try:
            exporter = get_exporter(format)
            result = exporter.export(research_result, title, options)
            return {
                "content": result.content,
                "filename": result.filename,
                "mime_type": result.mime_type,
                "format": result.format,
                "metadata": result.metadata,
            }
        except ValueError as e:
            supported = ", ".join(self.get_supported_formats())
            raise ValueError(f"Unsupported format: {format}. Supported formats: {supported}")

    def export_multiple(
        self,
        research_result: Dict[str, Any],
        formats: List[str],
        variant: str = "full_report",
        title: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Dict[str, Any]]:
        """Export research results to multiple formats at once.

        Args:
            research_result: Dict from ResearchService.execute_research()
            formats: List of format names to export
            variant: Report variant for markdown/html
            title: Optional custom title
            options: Format-specific options (applied to all formats)

        Returns:
            Dict mapping format name to export result
        """
        results = {}
        for fmt in formats:
            try:
                results[fmt] = self.export(research_result, fmt, variant, title, options)
            except ValueError as e:
                results[fmt] = {"error": str(e)}
        return results

    def get_supported_variants(
        self,
        research_result: Dict[str, Any],
    ) -> List[str]:
        """Get list of report variants supported for this research result.

        The available variants depend on the template used for research.
        For example, FinancialTemplate supports "investment_thesis",
        while ContractTemplate supports "red_flags_summary".

        Args:
            research_result: Dict from ResearchService.execute_research()

        Returns:
            List of supported variant names
        """
        template_type = research_result.get("template", "investigative")
        template = get_template(template_type)
        return template.get_supported_report_variants()

    def generate_markdown(
        self,
        research_result: Dict[str, Any],
        variant: str = "full_report",
        title: Optional[str] = None,
    ) -> str:
        """
        Generate markdown report from research results.

        Report generation is delegated to the template class that matches
        the research type. Each template has domain-specific knowledge about
        how to render findings and supports different report variants.

        Args:
            research_result: Dict from ResearchService.execute_research()
            variant: Report variant (depends on template):
                - All templates: "full_report", "executive_summary"
                - financial: "investment_thesis"
                - investigative: "risk_assessment"
                - contract: "red_flags_summary", "pricing_analysis"
                - competitive: "competitor_matrix"
                - legal: "legal_brief", "compliance_assessment"
                - tech_market: "trend_forecast", "vc_briefing"
            title: Optional custom title

        Returns:
            Formatted markdown string
        """
        # Get the template that was used for this research
        template_type = research_result.get("template", "investigative")
        template = get_template(template_type)

        # Delegate report generation to the template
        return template.generate_report(research_result, variant, title)

    def generate_html(
        self,
        markdown_content: str,
        title: str = "Research Report",
        research_result: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Generate styled HTML report.

        If research_result is provided, generates rich visual HTML.
        Otherwise, converts markdown to basic styled HTML.
        """
        # Use interactive HTML if research result is available
        if research_result:
            return generate_interactive_html(research_result, title)

        # Fallback to markdown conversion
        html_body = self._markdown_to_html(markdown_content)

        return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            line-height: 1.6;
            max-width: 900px;
            margin: 0 auto;
            padding: 2rem;
            color: #333;
        }}
        h1 {{ color: #1a1a1a; border-bottom: 2px solid #eee; padding-bottom: 0.5rem; }}
        h2 {{ color: #2a2a2a; margin-top: 2rem; }}
        h3 {{ color: #3a3a3a; }}
        .finding {{ background: #f9f9f9; padding: 1rem; margin: 1rem 0; border-left: 4px solid #007bff; }}
        .finding-type {{ font-size: 0.8rem; color: #666; text-transform: uppercase; }}
        .confidence {{ color: #666; font-size: 0.9rem; font-style: italic; }}
        .source {{ margin: 0.5rem 0; }}
        .source a {{ color: #007bff; text-decoration: none; }}
        .source a:hover {{ text-decoration: underline; }}
        .perspective {{ background: #f0f7ff; padding: 1rem; margin: 1rem 0; border-radius: 4px; }}
        .insight {{ margin: 0.25rem 0; padding-left: 1rem; border-left: 2px solid #28a745; }}
        .warning {{ margin: 0.25rem 0; padding-left: 1rem; border-left: 2px solid #dc3545; }}
        hr {{ border: none; border-top: 1px solid #eee; margin: 2rem 0; }}
        table {{ border-collapse: collapse; width: 100%; margin: 1rem 0; }}
        th, td {{ border: 1px solid #ddd; padding: 0.5rem; text-align: left; }}
        th {{ background: #f5f5f5; }}
    </style>
</head>
<body>
{html_body}
</body>
</html>"""

    # NOTE: Report variant generation methods (_generate_full_report, _generate_executive_summary,
    # _generate_investment_thesis, etc.) have been moved to template classes.
    # Each template now has domain-specific knowledge about how to render its findings.
    # See:
    #   - BaseTemplate.generate_full_report() - default implementation
    #   - BaseTemplate.generate_executive_summary() - default implementation
    #   - FinancialTemplate.generate_investment_thesis() - financial-specific
    #   - InvestigativeTemplate.generate_risk_assessment() - investigative-specific
    #   - ContractTemplate.generate_red_flags_summary() - contract-specific
    #   - CompetitiveTemplate.generate_competitor_matrix() - competitive-specific
    #   - LegalTemplate.generate_legal_brief() - legal-specific
    #   - TechMarketTemplate.generate_trend_forecast() - tech market-specific

    def _markdown_to_html(self, markdown: str) -> str:
        """Simple markdown to HTML conversion."""
        lines = markdown.split("\n")
        html_lines = []
        in_list = False

        for line in lines:
            # Headers
            if line.startswith("# "):
                html_lines.append(f"<h1>{line[2:]}</h1>")
            elif line.startswith("## "):
                html_lines.append(f"<h2>{line[3:]}</h2>")
            elif line.startswith("### "):
                html_lines.append(f"<h3>{line[4:]}</h3>")
            elif line.startswith("#### "):
                html_lines.append(f"<h4>{line[5:]}</h4>")
            # Horizontal rule
            elif line.strip() == "---":
                html_lines.append("<hr>")
            # List items
            elif line.startswith("- "):
                if not in_list:
                    html_lines.append("<ul>")
                    in_list = True
                # Handle bold and links
                content = self._format_inline(line[2:])
                html_lines.append(f"<li>{content}</li>")
            # Empty line
            elif line.strip() == "":
                if in_list:
                    html_lines.append("</ul>")
                    in_list = False
                html_lines.append("")
            # Regular paragraph
            else:
                if in_list:
                    html_lines.append("</ul>")
                    in_list = False
                content = self._format_inline(line)
                html_lines.append(f"<p>{content}</p>")

        if in_list:
            html_lines.append("</ul>")

        return "\n".join(html_lines)

    def _format_inline(self, text: str) -> str:
        """Format inline markdown (bold, italic, links)."""
        import re

        # Bold
        text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)
        # Italic
        text = re.sub(r'\*(.+?)\*', r'<em>\1</em>', text)
        # Links
        text = re.sub(r'\[(.+?)\]\((.+?)\)', r'<a href="\2">\1</a>', text)

        return text
