"""PDF exporter with branded headers."""

from typing import Dict, Any, Optional
from datetime import datetime
import html as html_mod
import base64

from .base import BaseExporter, ExportResult


class PDFExporter(BaseExporter):
    """Export research results to PDF with branded headers.

    Uses HTML-to-PDF approach with print-optimized CSS.
    The output is an HTML file optimized for PDF printing that can be
    converted to PDF using a headless browser or WeasyPrint.
    """

    @property
    def format_name(self) -> str:
        return "pdf"

    @property
    def mime_type(self) -> str:
        return "text/html"  # Returns print-ready HTML; convert with browser print or WeasyPrint

    @property
    def file_extension(self) -> str:
        return "html"  # Print-ready HTML for PDF conversion

    def export(
        self,
        research_result: Dict[str, Any],
        title: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None,
    ) -> ExportResult:
        """Export to print-optimized HTML for PDF conversion.

        Options:
            company_name: Brand name for header
            logo_url: URL to company logo (base64 or http)
            primary_color: Primary brand color (hex)
            accent_color: Accent brand color (hex)
            include_toc: Include table of contents (default: True)
            include_sources: Include sources section (default: True)
        """
        options = options or {}
        branding = self._get_branding(options)

        query = research_result.get("query", "Unknown Query")
        report_title = title or f"Research Report: {query[:60]}"
        template = research_result.get("template", "unknown")
        status = research_result.get("status", "unknown")

        findings = research_result.get("findings", [])
        perspectives = research_result.get("perspectives", [])
        sources = research_result.get("sources", [])
        cost = research_result.get("cost_summary", {})

        include_toc = options.get("include_toc", True)
        include_sources = options.get("include_sources", True)

        # Build sections
        html_sections = []

        # Table of Contents
        if include_toc:
            toc_items = ["Executive Summary", "Key Findings"]
            if perspectives:
                toc_items.append("Expert Analysis")
            if include_sources and sources:
                toc_items.append("Sources")
            toc_items.append("Metadata")

            toc_html = '<nav class="toc"><h2>Contents</h2><ul>'
            for idx, item in enumerate(toc_items, 1):
                anchor = item.lower().replace(" ", "-")
                toc_html += f'<li><a href="#{anchor}">{idx}. {item}</a></li>'
            toc_html += "</ul></nav>"
            html_sections.append(toc_html)

        # Executive Summary
        high_conf = [f for f in findings if f.get("confidence_score", 0) >= 0.7]
        html_sections.append(f'''
        <section id="executive-summary">
            <h2>1. Executive Summary</h2>
            <div class="summary-stats">
                <div class="stat-item">
                    <span class="stat-value">{len(findings)}</span>
                    <span class="stat-label">Findings</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">{len(high_conf)}</span>
                    <span class="stat-label">High Confidence</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">{len(sources)}</span>
                    <span class="stat-label">Sources</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">{len(perspectives)}</span>
                    <span class="stat-label">Perspectives</span>
                </div>
            </div>
            <p class="lead">
                This research analyzed <strong>{query}</strong> using the {template.title()} methodology,
                extracting {len(findings)} key findings from {len(sources)} sources with expert analysis
                from {len(perspectives)} perspectives.
            </p>
        </section>
        ''')

        # Key Findings
        findings_html = '<section id="key-findings"><h2>2. Key Findings</h2>'
        grouped = {}
        for f in findings:
            ft = f.get("finding_type", "other")
            if ft not in grouped:
                grouped[ft] = []
            grouped[ft].append(f)

        for ftype, flist in grouped.items():
            findings_html += f'<h3>{ftype.replace("_", " ").title()}</h3>'
            for f in flist:
                conf = f.get("confidence_score", 0.5)
                conf_pct = f"{conf:.0%}"
                summary = html_mod.escape(f.get("summary") or f.get("content", "")[:80])
                content = html_mod.escape(f.get("content", ""))
                findings_html += f'''
                <div class="finding">
                    <div class="finding-header">
                        <span class="finding-title">{summary}</span>
                        <span class="confidence-badge">{conf_pct}</span>
                    </div>
                    <p>{content}</p>
                </div>
                '''
        findings_html += "</section>"
        html_sections.append(findings_html)

        # Expert Analysis
        if perspectives:
            persp_html = '<section id="expert-analysis"><h2>3. Expert Analysis</h2>'
            for p in perspectives:
                ptype = p.get("perspective_type", "unknown").replace("_", " ").title()
                analysis = html_mod.escape(p.get("analysis_text", ""))
                insights = p.get("key_insights", [])
                warnings = p.get("warnings", [])

                persp_html += f'<div class="perspective"><h3>{ptype}</h3><p>{analysis}</p>'

                if insights:
                    persp_html += "<h4>Key Insights</h4><ul>"
                    for i in insights:
                        persp_html += f"<li>{html_mod.escape(i)}</li>"
                    persp_html += "</ul>"

                if warnings:
                    persp_html += '<h4>Warnings</h4><ul class="warnings">'
                    for w in warnings:
                        persp_html += f"<li>{html_mod.escape(w)}</li>"
                    persp_html += "</ul>"

                persp_html += "</div>"
            persp_html += "</section>"
            html_sections.append(persp_html)

        # Sources
        if include_sources and sources:
            src_section_num = 4 if perspectives else 3
            sources_html = f'<section id="sources"><h2>{src_section_num}. Sources</h2><table class="sources-table"><thead><tr><th>Source</th><th>Domain</th><th>Credibility</th></tr></thead><tbody>'
            for s in sorted(sources, key=lambda x: x.get("credibility_score", 0), reverse=True)[:25]:
                src_title = html_mod.escape(s.get("title", "Unknown")[:50])
                src_url = html_mod.escape(s.get("url", "#"))
                domain = html_mod.escape(s.get("domain", ""))
                cred = s.get("credibility_score", 0.5)
                sources_html += f'<tr><td><a href="{src_url}">{src_title}</a></td><td>{domain}</td><td>{cred:.0%}</td></tr>'
            sources_html += "</tbody></table></section>"
            html_sections.append(sources_html)

        # Metadata
        meta_section_num = (4 if perspectives else 3) + (1 if include_sources and sources else 0)
        exec_time = research_result.get("execution_time_seconds", 0)
        total_cost = cost.get("total_cost_usd", 0)
        session_id = research_result.get("session_id", "N/A")

        html_sections.append(f'''
        <section id="metadata">
            <h2>{meta_section_num}. Research Metadata</h2>
            <table class="metadata-table">
                <tr><th>Session ID</th><td>{html_mod.escape(session_id)}</td></tr>
                <tr><th>Template</th><td>{html_mod.escape(template.title())}</td></tr>
                <tr><th>Status</th><td>{html_mod.escape(status.title())}</td></tr>
                <tr><th>Execution Time</th><td>{exec_time:.1f} seconds</td></tr>
                <tr><th>API Cost</th><td>${total_cost:.4f}</td></tr>
                <tr><th>Generated</th><td>{self._format_date()}</td></tr>
            </table>
        </section>
        ''')

        body_content = "\n".join(html_sections)

        # Generate full HTML
        html_content = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{html_mod.escape(report_title)}</title>
    <style>
        @page {{
            size: A4;
            margin: 2cm;
            @top-center {{ content: "{html_mod.escape(branding['company_name'])} Research Report"; font-size: 10pt; color: #666; }}
            @bottom-center {{ content: "Page " counter(page) " of " counter(pages); font-size: 10pt; color: #666; }}
        }}
        * {{ box-sizing: border-box; margin: 0; padding: 0; }}
        body {{
            font-family: "Georgia", "Times New Roman", serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #1a1a1a;
            max-width: 210mm;
            margin: 0 auto;
            padding: 20mm;
        }}
        .header {{
            border-bottom: 3px solid {branding['primary_color']};
            padding-bottom: 20px;
            margin-bottom: 30px;
        }}
        .header-brand {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }}
        .brand-name {{
            font-size: 14pt;
            font-weight: bold;
            color: {branding['primary_color']};
            text-transform: uppercase;
            letter-spacing: 2px;
        }}
        .report-date {{
            font-size: 10pt;
            color: #666;
        }}
        .header h1 {{
            font-size: 22pt;
            color: {branding['primary_color']};
            margin-bottom: 10px;
        }}
        .header-meta {{
            font-size: 10pt;
            color: #666;
        }}
        .header-meta span {{ margin-right: 20px; }}
        .toc {{
            background: #f8f9fa;
            padding: 20px 30px;
            margin-bottom: 30px;
            page-break-after: avoid;
        }}
        .toc h2 {{
            font-size: 14pt;
            margin-bottom: 15px;
            color: {branding['primary_color']};
        }}
        .toc ul {{ list-style: none; }}
        .toc li {{
            padding: 5px 0;
            border-bottom: 1px dotted #ddd;
        }}
        .toc a {{
            color: {branding['accent_color']};
            text-decoration: none;
        }}
        section {{
            margin-bottom: 30px;
            page-break-inside: avoid;
        }}
        h2 {{
            font-size: 16pt;
            color: {branding['primary_color']};
            border-bottom: 1px solid #ddd;
            padding-bottom: 10px;
            margin-bottom: 20px;
            page-break-after: avoid;
        }}
        h3 {{
            font-size: 13pt;
            color: #333;
            margin: 20px 0 10px;
            page-break-after: avoid;
        }}
        h4 {{
            font-size: 11pt;
            color: #555;
            margin: 15px 0 8px;
        }}
        .summary-stats {{
            display: flex;
            justify-content: space-around;
            margin: 20px 0;
            padding: 15px;
            background: linear-gradient(135deg, {branding['primary_color']}10, {branding['accent_color']}10);
            border-radius: 8px;
        }}
        .stat-item {{ text-align: center; }}
        .stat-value {{
            display: block;
            font-size: 24pt;
            font-weight: bold;
            color: {branding['accent_color']};
        }}
        .stat-label {{
            font-size: 9pt;
            color: #666;
            text-transform: uppercase;
        }}
        .lead {{
            font-size: 12pt;
            font-style: italic;
            color: #444;
            margin: 15px 0;
        }}
        .finding {{
            margin: 15px 0;
            padding: 15px;
            border-left: 3px solid {branding['accent_color']};
            background: #fafafa;
            page-break-inside: avoid;
        }}
        .finding-header {{
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }}
        .finding-title {{ font-weight: bold; }}
        .confidence-badge {{
            background: {branding['accent_color']};
            color: white;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 9pt;
        }}
        .perspective {{
            margin: 20px 0;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 5px;
            page-break-inside: avoid;
        }}
        .perspective h3 {{
            color: {branding['accent_color']};
            margin-top: 0;
        }}
        ul {{ margin: 10px 0 10px 20px; }}
        li {{ margin: 5px 0; }}
        ul.warnings li {{ color: #b91c1c; }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 10pt;
        }}
        th, td {{
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }}
        th {{
            background: {branding['primary_color']};
            color: white;
            font-weight: normal;
            text-transform: uppercase;
            font-size: 9pt;
        }}
        .metadata-table th {{ width: 30%; }}
        a {{ color: {branding['accent_color']}; text-decoration: none; }}
        .footer {{
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid {branding['primary_color']};
            font-size: 9pt;
            color: #666;
            text-align: center;
        }}
        @media print {{
            body {{ padding: 0; }}
            .header, section {{ box-shadow: none; }}
            a {{ color: #333; }}
            a[href]::after {{ content: " (" attr(href) ")"; font-size: 8pt; color: #666; }}
        }}
    </style>
</head>
<body>
    <header class="header">
        <div class="header-brand">
            <span class="brand-name">{html_mod.escape(branding['company_name'])}</span>
            <span class="report-date">{self._format_date()}</span>
        </div>
        <h1>{html_mod.escape(report_title)}</h1>
        <div class="header-meta">
            <span><strong>Template:</strong> {html_mod.escape(template.title())}</span>
            <span><strong>Status:</strong> {html_mod.escape(status.title())}</span>
            <span><strong>Session:</strong> {html_mod.escape(session_id[:12])}...</span>
        </div>
    </header>
    {body_content}
    <footer class="footer">
        <p>Generated by {html_mod.escape(branding['company_name'])} | {self._format_date()}</p>
        <p>This report is confidential and intended for the recipient only.</p>
    </footer>
</body>
</html>'''

        return ExportResult(
            format=self.format_name,
            content=html_content,
            filename=self._generate_filename(report_title, query),
            mime_type=self.mime_type,
            metadata={
                "title": report_title,
                "findings_count": len(findings),
                "sources_count": len(sources),
                "conversion_note": "Print this HTML or use WeasyPrint/Puppeteer to convert to PDF",
            },
        )
