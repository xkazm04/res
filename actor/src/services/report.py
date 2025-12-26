"""Report generation service."""

from typing import List, Dict, Any, Optional
from datetime import datetime


class ReportService:
    """Generates markdown and HTML reports from research results."""

    def generate_markdown(
        self,
        research_result: Dict[str, Any],
        variant: str = "full_report",
        title: Optional[str] = None,
    ) -> str:
        """
        Generate markdown report from research results.

        Args:
            research_result: Dict from ResearchService.execute_research()
            variant: "executive_summary", "full_report", or "investment_thesis"
            title: Optional custom title

        Returns:
            Formatted markdown string
        """
        if variant == "executive_summary":
            return self._generate_executive_summary(research_result, title)
        elif variant == "investment_thesis":
            return self._generate_investment_thesis(research_result, title)
        else:
            return self._generate_full_report(research_result, title)

    def generate_html(
        self,
        markdown_content: str,
        title: str = "Research Report",
    ) -> str:
        """
        Convert markdown to styled HTML.

        Args:
            markdown_content: Markdown string
            title: HTML page title

        Returns:
            Complete HTML document
        """
        # Simple markdown to HTML conversion
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

    def _generate_full_report(
        self,
        result: Dict[str, Any],
        title: Optional[str],
    ) -> str:
        """Generate full detailed report."""
        query = result.get("query", "Unknown Query")
        template = result.get("template", "unknown")
        report_title = title or f"Research Report: {query[:50]}"

        sections = []

        # Header
        sections.append(f"# {report_title}")
        sections.append("")
        sections.append(f"**Research Query:** {query}")
        sections.append(f"**Template:** {template.title()} Research")
        sections.append(f"**Generated:** {datetime.now().strftime('%B %d, %Y at %H:%M')}")
        sections.append(f"**Status:** {result.get('status', 'unknown').title()}")
        sections.append("")
        sections.append("---")
        sections.append("")

        # Executive Summary
        sections.append("## Executive Summary")
        sections.append("")
        findings = result.get("findings", [])
        if findings:
            high_conf = [f for f in findings if f.get("confidence_score", 0) >= 0.7]
            sections.append(f"This research identified **{len(findings)}** key findings across multiple categories.")
            sections.append(f"**{len(high_conf)}** findings have high confidence (>70%).")
            sections.append("")

            # Key findings summary
            for finding in findings[:5]:
                ftype = finding.get("finding_type", "fact").upper()
                summary = finding.get("summary") or finding.get("content", "")[:100]
                sections.append(f"- **[{ftype}]** {summary}")
            sections.append("")
        else:
            sections.append("No significant findings were extracted.")
            sections.append("")

        sections.append("---")
        sections.append("")

        # Detailed Findings
        sections.append("## Detailed Findings")
        sections.append("")

        # Group by type
        finding_types = {}
        for f in findings:
            ftype = f.get("finding_type", "other")
            if ftype not in finding_types:
                finding_types[ftype] = []
            finding_types[ftype].append(f)

        for ftype, type_findings in finding_types.items():
            sections.append(f"### {ftype.title()} ({len(type_findings)})")
            sections.append("")

            for finding in type_findings:
                conf = finding.get("confidence_score", 0.5)
                conf_label = "High" if conf >= 0.8 else "Medium" if conf >= 0.6 else "Low"
                sections.append(f"#### {finding.get('summary', finding.get('content', '')[:60])}")
                sections.append("")
                sections.append(finding.get("content", ""))
                sections.append("")
                sections.append(f"*Confidence: {conf_label} ({conf:.0%})*")
                sections.append("")

        sections.append("---")
        sections.append("")

        # Perspectives
        perspectives = result.get("perspectives", [])
        if perspectives:
            sections.append("## Multi-Perspective Analysis")
            sections.append("")

            for perspective in perspectives:
                ptype = perspective.get("perspective_type", "unknown").title()
                sections.append(f"### {ptype} Perspective")
                sections.append("")
                sections.append(perspective.get("analysis_text", ""))
                sections.append("")

                insights = perspective.get("key_insights", [])
                if insights:
                    sections.append("**Key Insights:**")
                    for insight in insights:
                        sections.append(f"- {insight}")
                    sections.append("")

                recs = perspective.get("recommendations", [])
                if recs:
                    sections.append("**Recommendations:**")
                    for rec in recs:
                        sections.append(f"- {rec}")
                    sections.append("")

                warnings = perspective.get("warnings", [])
                if warnings:
                    sections.append("**Warnings:**")
                    for warning in warnings:
                        sections.append(f"- {warning}")
                    sections.append("")

            sections.append("---")
            sections.append("")

        # Sources
        sources = result.get("sources", [])
        if sources:
            sections.append("## Sources")
            sections.append("")

            for source in sources[:20]:
                title_text = source.get("title", source.get("url", "Unknown"))
                url = source.get("url", "#")
                cred = source.get("credibility_score", 0.5)
                sections.append(f"- [{title_text}]({url}) - Credibility: {cred:.0%}")

            sections.append("")
            sections.append("---")
            sections.append("")

        # Metadata
        sections.append("## Research Metadata")
        sections.append("")
        sections.append(f"- **Session ID:** {result.get('session_id', 'N/A')}")
        sections.append(f"- **Execution Time:** {result.get('execution_time_seconds', 0):.1f} seconds")

        cost = result.get("cost_summary", {})
        if cost:
            sections.append(f"- **Total Tokens:** {cost.get('total_tokens', 0):,}")
            sections.append(f"- **Total Cost:** ${cost.get('total_cost_usd', 0):.4f}")

        queries = result.get("search_queries_executed", [])
        if queries:
            sections.append(f"- **Searches Executed:** {len(queries)}")

        return "\n".join(sections)

    def _generate_executive_summary(
        self,
        result: Dict[str, Any],
        title: Optional[str],
    ) -> str:
        """Generate brief executive summary."""
        query = result.get("query", "Unknown Query")
        report_title = title or f"Executive Summary: {query[:40]}"

        sections = []
        sections.append(f"# {report_title}")
        sections.append("")
        sections.append(f"**Research Query:** {query}")
        sections.append(f"**Generated:** {datetime.now().strftime('%B %d, %Y')}")
        sections.append("")
        sections.append("---")
        sections.append("")

        # Key findings
        sections.append("## Key Findings")
        sections.append("")

        findings = result.get("findings", [])
        high_conf = sorted(
            [f for f in findings if f.get("confidence_score", 0) >= 0.6],
            key=lambda x: x.get("confidence_score", 0),
            reverse=True
        )

        for finding in high_conf[:7]:
            ftype = finding.get("finding_type", "fact").upper()
            summary = finding.get("summary") or finding.get("content", "")[:150]
            sections.append(f"- **[{ftype}]** {summary}")

        sections.append("")

        # Key perspectives
        perspectives = result.get("perspectives", [])
        if perspectives:
            sections.append("## Expert Perspectives")
            sections.append("")

            for p in perspectives:
                ptype = p.get("perspective_type", "").title()
                insights = p.get("key_insights", [])
                if insights:
                    sections.append(f"**{ptype}:** {insights[0]}")

            sections.append("")

        sections.append("---")
        sections.append("")
        sections.append(f"*Full report contains {len(findings)} findings from {len(result.get('sources', []))} sources.*")

        return "\n".join(sections)

    def _generate_investment_thesis(
        self,
        result: Dict[str, Any],
        title: Optional[str],
    ) -> str:
        """Generate investment thesis report."""
        query = result.get("query", "Unknown")
        report_title = title or f"Investment Thesis: {query[:40]}"

        sections = []
        sections.append(f"# {report_title}")
        sections.append("")
        sections.append(f"**Subject:** {query}")
        sections.append(f"**Date:** {datetime.now().strftime('%B %d, %Y')}")
        sections.append("")
        sections.append("---")
        sections.append("")

        # Thesis summary
        sections.append("## Investment Thesis")
        sections.append("")

        # Extract valuation perspective
        perspectives = result.get("perspectives", [])
        valuation = next((p for p in perspectives if "valuation" in p.get("perspective_type", "").lower()), None)

        if valuation:
            sections.append(valuation.get("analysis_text", ""))
            sections.append("")

        # Bull case
        sections.append("## Bull Case")
        sections.append("")
        findings = result.get("findings", [])
        positive = [f for f in findings if f.get("confidence_score", 0) >= 0.7]
        for f in positive[:5]:
            sections.append(f"- {f.get('summary') or f.get('content', '')[:100]}")
        sections.append("")

        # Bear case
        sections.append("## Bear Case / Risks")
        sections.append("")
        risks = [f for f in findings if f.get("finding_type") in ["pattern", "gap"]]
        for f in risks[:5]:
            sections.append(f"- {f.get('summary') or f.get('content', '')[:100]}")
        sections.append("")

        # Recommendations
        sections.append("## Recommendations")
        sections.append("")
        for p in perspectives:
            recs = p.get("recommendations", [])
            for rec in recs[:2]:
                sections.append(f"- {rec}")
        sections.append("")

        return "\n".join(sections)

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
