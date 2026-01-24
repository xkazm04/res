"""Obsidian Markdown exporter with wiki-links."""

from typing import Dict, Any, Optional, List, Set
from datetime import datetime
import re

from .base import BaseExporter, ExportResult


class ObsidianExporter(BaseExporter):
    """Export research results as Obsidian-compatible markdown with wiki-links.

    Creates interconnected notes using Obsidian's wiki-link syntax:
    - [[Finding Name]] for cross-references
    - #tags for categorization
    - YAML frontmatter for metadata
    - Callouts for important information
    """

    @property
    def format_name(self) -> str:
        return "obsidian"

    @property
    def mime_type(self) -> str:
        return "text/markdown"

    @property
    def file_extension(self) -> str:
        return "md"

    def export(
        self,
        research_result: Dict[str, Any],
        title: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None,
    ) -> ExportResult:
        """Export to Obsidian markdown format.

        Options:
            vault_folder: Folder path within vault (default: "Research")
            create_individual_notes: Create separate note structure (default: False)
            include_dataview: Add Dataview-compatible fields (default: True)
            tag_prefix: Prefix for generated tags (default: "research")
        """
        options = options or {}

        query = research_result.get("query", "Unknown Query")
        report_title = title or f"Research: {query[:60]}"
        template = research_result.get("template", "unknown")
        status = research_result.get("status", "unknown")
        session_id = research_result.get("session_id", "")

        findings = research_result.get("findings", [])
        perspectives = research_result.get("perspectives", [])
        sources = research_result.get("sources", [])
        cost = research_result.get("cost_summary", {})

        vault_folder = options.get("vault_folder", "Research")
        include_dataview = options.get("include_dataview", True)
        tag_prefix = options.get("tag_prefix", "research")

        # Build wiki-link map for cross-referencing
        link_map = self._build_link_map(findings, sources)

        sections = []

        # YAML Frontmatter
        frontmatter = self._generate_frontmatter(
            research_result, report_title, template, tag_prefix, include_dataview
        )
        sections.append(frontmatter)

        # Title and metadata
        sections.append(f"# {report_title}")
        sections.append("")
        sections.append(f"> [!info] Research Overview")
        sections.append(f"> **Query:** {query}")
        sections.append(f"> **Template:** [[{template.title()} Research]]")
        sections.append(f"> **Status:** {status.title()}")
        sections.append(f"> **Generated:** {self._format_date()}")
        sections.append("")

        # Quick stats callout
        high_conf = len([f for f in findings if f.get("confidence_score", 0) >= 0.7])
        high_cred = len([s for s in sources if s.get("credibility_score", 0) >= 0.7])
        sections.append("> [!summary] Quick Stats")
        sections.append(f"> - **{len(findings)}** findings ({high_conf} high confidence)")
        sections.append(f"> - **{len(sources)}** sources ({high_cred} high credibility)")
        sections.append(f"> - **{len(perspectives)}** expert perspectives")
        sections.append("")

        # Table of Contents
        sections.append("## Contents")
        sections.append("")
        sections.append("- [[#Executive Summary]]")
        sections.append("- [[#Key Findings]]")
        if perspectives:
            sections.append("- [[#Expert Analysis]]")
        sections.append("- [[#Sources]]")
        sections.append("- [[#Metadata]]")
        sections.append("")

        # Executive Summary
        sections.append("## Executive Summary")
        sections.append("")

        # Top findings with wiki-links
        if findings:
            sections.append("### Top Findings")
            sections.append("")
            for f in sorted(findings, key=lambda x: x.get("confidence_score", 0), reverse=True)[:5]:
                summary = f.get("summary") or f.get("content", "")[:100]
                ftype = f.get("finding_type", "fact")
                conf = f.get("confidence_score", 0.5)
                conf_emoji = "🟢" if conf >= 0.8 else "🟡" if conf >= 0.6 else "🔴"

                # Create wiki-link friendly name
                link_name = self._to_wiki_link_name(summary[:40])
                sections.append(f"- {conf_emoji} [[{link_name}]] `#{tag_prefix}/{ftype}` ({conf:.0%})")
            sections.append("")

        # Warnings callout
        all_warnings = []
        for p in perspectives:
            all_warnings.extend(p.get("warnings", []))

        if all_warnings:
            sections.append("> [!warning] Key Warnings")
            for w in all_warnings[:5]:
                sections.append(f"> - {w}")
            sections.append("")

        # Key Findings
        sections.append("## Key Findings")
        sections.append("")

        # Group by type
        grouped = {}
        for f in findings:
            ft = f.get("finding_type", "other")
            if ft not in grouped:
                grouped[ft] = []
            grouped[ft].append(f)

        for ftype, flist in grouped.items():
            sections.append(f"### {ftype.replace('_', ' ').title()}")
            sections.append("")

            for f in flist:
                finding_id = f.get("finding_id", "")
                summary = f.get("summary") or f.get("content", "")[:60]
                content = f.get("content", "")
                conf = f.get("confidence_score", 0.5)
                temporal = f.get("temporal_context", "present")

                link_name = self._to_wiki_link_name(summary[:40])

                # Finding header with anchor
                sections.append(f"#### {summary}")
                sections.append("")

                # Apply wiki-links to content
                linked_content = self._apply_wiki_links(content, link_map)
                sections.append(linked_content)
                sections.append("")

                # Metadata inline
                sections.append(f"*Confidence: {conf:.0%} | Context: {temporal.title()} | ID: `{finding_id}`*")
                sections.append("")

                # Supporting sources
                supporting = f.get("supporting_sources", [])
                if supporting:
                    sections.append("**Sources:**")
                    for s in supporting:
                        src_title = s.get("title", s.get("url", "Unknown"))[:30]
                        src_url = s.get("url", "")
                        sections.append(f"- [{src_title}]({src_url})")
                    sections.append("")

        # Expert Analysis
        if perspectives:
            sections.append("## Expert Analysis")
            sections.append("")

            for p in perspectives:
                ptype = p.get("perspective_type", "unknown").replace("_", " ").title()
                sections.append(f"### [[{ptype} Perspective]]")
                sections.append("")

                analysis = p.get("analysis_text", "")
                linked_analysis = self._apply_wiki_links(analysis, link_map)
                sections.append(linked_analysis)
                sections.append("")

                # Insights callout
                insights = p.get("key_insights", [])
                if insights:
                    sections.append("> [!tip] Key Insights")
                    for i in insights:
                        sections.append(f"> - {i}")
                    sections.append("")

                # Recommendations
                recs = p.get("recommendations", [])
                if recs:
                    sections.append("**Recommendations:**")
                    for r in recs:
                        sections.append(f"- [ ] {r}")  # Checkbox for actionability
                    sections.append("")

                # Predictions
                predictions = p.get("predictions", [])
                if predictions:
                    sections.append("> [!abstract] Predictions")
                    for pred in predictions:
                        if isinstance(pred, dict):
                            pred_text = pred.get("prediction", "")
                            conf = pred.get("confidence", "medium")
                            timeline = pred.get("timeline", "")
                            sections.append(f"> - **{pred_text}** ({conf} confidence{', ' + timeline if timeline else ''})")
                        else:
                            sections.append(f"> - {pred}")
                    sections.append("")

                # Warnings for this perspective
                warnings = p.get("warnings", [])
                if warnings:
                    sections.append("> [!caution] Warnings")
                    for w in warnings:
                        sections.append(f"> - {w}")
                    sections.append("")

        # Sources
        sections.append("## Sources")
        sections.append("")

        # Source table
        sections.append("| Source | Domain | Credibility | Link |")
        sections.append("|--------|--------|-------------|------|")

        sorted_sources = sorted(sources, key=lambda x: x.get("credibility_score", 0), reverse=True)
        for s in sorted_sources[:25]:
            src_title = s.get("title", "Unknown")[:35].replace("|", "-")
            domain = s.get("domain", "")
            cred = s.get("credibility_score", 0.5)
            cred_label = "🟢 High" if cred >= 0.8 else "🟡 Medium" if cred >= 0.6 else "🔴 Low"
            url = s.get("url", "")
            sections.append(f"| {src_title} | `{domain}` | {cred_label} | [Link]({url}) |")

        sections.append("")

        # Metadata
        sections.append("## Metadata")
        sections.append("")

        exec_time = research_result.get("execution_time_seconds", 0)
        total_cost = cost.get("total_cost_usd", 0)

        sections.append("| Property | Value |")
        sections.append("|----------|-------|")
        sections.append(f"| Session ID | `{session_id}` |")
        sections.append(f"| Template | [[{template.title()} Research]] |")
        sections.append(f"| Execution Time | {exec_time:.1f}s |")
        sections.append(f"| API Cost | ${total_cost:.4f} |")
        sections.append(f"| Generated | {self._format_date()} |")
        sections.append("")

        # Related notes section
        sections.append("## Related Notes")
        sections.append("")
        sections.append(f"- [[{vault_folder}/Index]]")
        sections.append(f"- [[{template.title()} Research Template]]")

        # Add related finding links
        for f in findings[:5]:
            summary = f.get("summary") or f.get("content", "")[:40]
            link_name = self._to_wiki_link_name(summary[:40])
            sections.append(f"- [[{link_name}]]")

        sections.append("")

        # Footer
        sections.append("---")
        sections.append(f"*Generated by Deep Research on {self._format_date()}*")

        content = "\n".join(sections)

        return ExportResult(
            format=self.format_name,
            content=content,
            filename=self._generate_filename(report_title, query),
            mime_type=self.mime_type,
            metadata={
                "title": report_title,
                "vault_folder": vault_folder,
                "wiki_links_count": content.count("[["),
                "tags_count": content.count("#" + tag_prefix),
            },
        )

    def _generate_frontmatter(
        self,
        result: Dict[str, Any],
        title: str,
        template: str,
        tag_prefix: str,
        include_dataview: bool,
    ) -> str:
        """Generate YAML frontmatter for Obsidian."""
        query = result.get("query", "")
        session_id = result.get("session_id", "")
        status = result.get("status", "unknown")
        findings = result.get("findings", [])
        sources = result.get("sources", [])

        lines = ["---"]
        lines.append(f"title: \"{title}\"")
        lines.append(f"query: \"{query[:100]}\"")
        lines.append(f"template: {template}")
        lines.append(f"status: {status}")
        lines.append(f"session_id: {session_id}")
        lines.append(f"created: {datetime.now().strftime('%Y-%m-%d')}")

        # Tags
        tags = [f"{tag_prefix}/report", f"{tag_prefix}/{template}"]
        finding_types = set(f.get("finding_type", "other") for f in findings)
        for ft in finding_types:
            tags.append(f"{tag_prefix}/{ft}")
        lines.append(f"tags: [{', '.join(tags)}]")

        # Aliases for search
        lines.append(f"aliases: [\"{query[:50]}\", \"{session_id[:8]}\"]")

        if include_dataview:
            # Dataview-compatible fields
            lines.append(f"findings_count: {len(findings)}")
            lines.append(f"sources_count: {len(sources)}")
            high_conf = len([f for f in findings if f.get("confidence_score", 0) >= 0.7])
            lines.append(f"high_confidence_count: {high_conf}")
            cost = result.get("cost_summary", {})
            lines.append(f"api_cost: {cost.get('total_cost_usd', 0):.4f}")
            lines.append(f"execution_time: {result.get('execution_time_seconds', 0):.1f}")

        lines.append("---")
        lines.append("")

        return "\n".join(lines)

    def _build_link_map(
        self,
        findings: List[Dict[str, Any]],
        sources: List[Dict[str, Any]],
    ) -> Dict[str, str]:
        """Build map of terms to wiki-link names."""
        link_map = {}

        # Map finding summaries
        for f in findings:
            summary = f.get("summary") or f.get("content", "")[:60]
            # Extract key phrases (simple approach)
            words = summary.split()
            if len(words) >= 2:
                # Link 2-3 word phrases
                for i in range(len(words) - 1):
                    phrase = " ".join(words[i:i+2])
                    if len(phrase) > 5:
                        link_map[phrase.lower()] = self._to_wiki_link_name(summary[:40])

        # Map source domains as potential links
        for s in sources:
            domain = s.get("domain", "")
            if domain:
                link_map[domain.lower()] = f"Source: {domain}"

        return link_map

    def _apply_wiki_links(self, text: str, link_map: Dict[str, str]) -> str:
        """Apply wiki-links to text based on link map."""
        # For now, just return the text - full implementation would
        # scan for matching phrases and wrap them in [[ ]]
        # This is kept simple to avoid over-linking
        return text

    def _to_wiki_link_name(self, text: str) -> str:
        """Convert text to a valid wiki-link name."""
        # Remove special characters that break wiki-links
        safe = re.sub(r'[|\[\]#^]', '', text)
        # Trim and normalize whitespace
        safe = " ".join(safe.split())
        return safe[:50]
