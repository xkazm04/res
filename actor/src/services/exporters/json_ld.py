"""JSON-LD exporter for structured data consumers."""

from typing import Dict, Any, Optional, List
from datetime import datetime
import json

from .base import BaseExporter, ExportResult


class JSONLDExporter(BaseExporter):
    """Export research results as JSON-LD for structured data consumers.

    Outputs Schema.org-compatible JSON-LD that can be consumed by:
    - Search engines (Google, Bing)
    - Knowledge graphs
    - Data aggregation services
    - AI/ML pipelines
    - Enterprise data lakes
    """

    @property
    def format_name(self) -> str:
        return "json_ld"

    @property
    def mime_type(self) -> str:
        return "application/ld+json"

    @property
    def file_extension(self) -> str:
        return "jsonld"

    def export(
        self,
        research_result: Dict[str, Any],
        title: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None,
    ) -> ExportResult:
        """Export to JSON-LD format.

        Options:
            include_sources: Include source references (default: True)
            include_findings: Include all findings (default: True)
            include_perspectives: Include perspective analyses (default: True)
            compact: Use compact JSON format (default: False)
        """
        options = options or {}
        branding = self._get_branding(options)

        query = research_result.get("query", "Unknown Query")
        report_title = title or f"Research Report: {query[:60]}"
        template = research_result.get("template", "unknown")
        status = research_result.get("status", "unknown")
        session_id = research_result.get("session_id", "")

        findings = research_result.get("findings", [])
        perspectives = research_result.get("perspectives", [])
        sources = research_result.get("sources", [])
        cost = research_result.get("cost_summary", {})

        include_sources = options.get("include_sources", True)
        include_findings = options.get("include_findings", True)
        include_perspectives = options.get("include_perspectives", True)

        # Base timestamp
        now = datetime.now()
        created_at = research_result.get("started_at", now)
        if isinstance(created_at, str):
            created_at = now
        modified_at = research_result.get("completed_at", now)
        if isinstance(modified_at, str):
            modified_at = now

        # Build JSON-LD structure
        jsonld = {
            "@context": {
                "@vocab": "https://schema.org/",
                "findings": "https://deepresearch.ai/vocab#findings",
                "perspectives": "https://deepresearch.ai/vocab#perspectives",
                "confidence": "https://deepresearch.ai/vocab#confidence",
                "credibility": "https://deepresearch.ai/vocab#credibility",
                "researchTemplate": "https://deepresearch.ai/vocab#researchTemplate",
            },
            "@type": "ResearchReport",
            "@id": f"urn:research:{session_id}",
            "name": report_title,
            "description": f"AI-powered research analysis: {query}",
            "about": {
                "@type": "Thing",
                "name": query,
                "description": f"Research topic investigated using {template} methodology",
            },
            "author": {
                "@type": "Organization",
                "name": branding["company_name"],
            },
            "publisher": {
                "@type": "Organization",
                "name": branding["company_name"],
            },
            "dateCreated": created_at.isoformat() if hasattr(created_at, "isoformat") else str(created_at),
            "dateModified": modified_at.isoformat() if hasattr(modified_at, "isoformat") else str(modified_at),
            "researchTemplate": template,
            "status": status,
            "keywords": self._extract_keywords(research_result),
        }

        # Add statistics
        jsonld["aggregateRating"] = {
            "@type": "AggregateRating",
            "ratingValue": self._calculate_overall_confidence(findings),
            "ratingCount": len(findings),
            "bestRating": 1.0,
            "worstRating": 0.0,
        }

        # Add findings as Claims
        if include_findings and findings:
            jsonld["hasPart"] = []
            for f in findings:
                finding_ld = {
                    "@type": "Claim",
                    "@id": f"urn:finding:{f.get('finding_id', '')}",
                    "name": f.get("summary") or f.get("content", "")[:60],
                    "description": f.get("content", ""),
                    "claimType": f.get("finding_type", "other"),
                    "confidence": f.get("confidence_score", 0.5),
                    "temporalCoverage": f.get("temporal_context", "present"),
                }

                # Add date if available
                date_ref = f.get("date_referenced")
                if date_ref:
                    finding_ld["datePublished"] = date_ref

                # Add supporting sources
                supporting = f.get("supporting_sources", [])
                if supporting:
                    finding_ld["citation"] = [
                        {"@type": "WebPage", "url": s.get("url", "")}
                        for s in supporting if s.get("url")
                    ]

                jsonld["hasPart"].append(finding_ld)

        # Add perspectives as Reviews/Analyses
        if include_perspectives and perspectives:
            jsonld["review"] = []
            for p in perspectives:
                perspective_ld = {
                    "@type": "Review",
                    "author": {
                        "@type": "Person",
                        "name": p.get("perspective_type", "unknown").replace("_", " ").title(),
                        "jobTitle": "Expert Analyst",
                    },
                    "reviewBody": p.get("analysis_text", ""),
                    "reviewRating": {
                        "@type": "Rating",
                        "ratingValue": p.get("confidence", 0.5),
                        "bestRating": 1.0,
                        "worstRating": 0.0,
                    },
                }

                # Key insights as itemReviewed aspects
                insights = p.get("key_insights", [])
                if insights:
                    perspective_ld["itemReviewed"] = {
                        "@type": "ItemList",
                        "itemListElement": [
                            {"@type": "ListItem", "position": i + 1, "name": insight}
                            for i, insight in enumerate(insights)
                        ],
                    }

                # Warnings as negativeNotes
                warnings = p.get("warnings", [])
                if warnings:
                    perspective_ld["negativeNotes"] = warnings

                # Recommendations as positiveNotes
                recs = p.get("recommendations", [])
                if recs:
                    perspective_ld["positiveNotes"] = recs

                # Predictions
                predictions = p.get("predictions", [])
                if predictions:
                    perspective_ld["prediction"] = []
                    for pred in predictions:
                        if isinstance(pred, dict):
                            pred_ld = {
                                "@type": "Claim",
                                "claimType": "prediction",
                                "name": pred.get("prediction", ""),
                                "description": pred.get("rationale", ""),
                                "confidence": pred.get("confidence", "medium"),
                            }
                            if pred.get("timeline"):
                                pred_ld["temporalCoverage"] = pred["timeline"]
                            perspective_ld["prediction"].append(pred_ld)

                jsonld["review"].append(perspective_ld)

        # Add sources as citations
        if include_sources and sources:
            jsonld["citation"] = []
            for s in sources:
                source_ld = {
                    "@type": "WebPage",
                    "url": s.get("url", ""),
                    "name": s.get("title", "Unknown"),
                    "publisher": {
                        "@type": "Organization",
                        "name": s.get("domain", ""),
                    },
                    "credibility": s.get("credibility_score", 0.5),
                    "credibilityLabel": s.get("credibility_label", "medium"),
                }
                if s.get("snippet"):
                    source_ld["description"] = s["snippet"]
                jsonld["citation"].append(source_ld)

        # Add research metadata
        exec_time = research_result.get("execution_time_seconds", 0)
        jsonld["additionalProperty"] = [
            {
                "@type": "PropertyValue",
                "name": "executionTime",
                "value": exec_time,
                "unitText": "seconds",
            },
            {
                "@type": "PropertyValue",
                "name": "apiCost",
                "value": cost.get("total_cost_usd", 0),
                "unitText": "USD",
            },
            {
                "@type": "PropertyValue",
                "name": "totalTokens",
                "value": cost.get("total_tokens", 0),
            },
            {
                "@type": "PropertyValue",
                "name": "sourcesCount",
                "value": len(sources),
            },
            {
                "@type": "PropertyValue",
                "name": "findingsCount",
                "value": len(findings),
            },
        ]

        # Cache information
        if research_result.get("cache_hit"):
            jsonld["additionalProperty"].append({
                "@type": "PropertyValue",
                "name": "cacheHit",
                "value": True,
            })

        # Format output
        indent = None if options.get("compact", False) else 2
        content = json.dumps(jsonld, indent=indent, ensure_ascii=False, default=str)

        return ExportResult(
            format=self.format_name,
            content=content,
            filename=self._generate_filename(report_title, query),
            mime_type=self.mime_type,
            metadata={
                "title": report_title,
                "schema_org_types": ["ResearchReport", "Claim", "Review", "WebPage"],
                "findings_count": len(findings),
                "sources_count": len(sources),
            },
        )

    def _extract_keywords(self, result: Dict[str, Any]) -> List[str]:
        """Extract keywords from research result."""
        keywords = set()

        # Add template as keyword
        template = result.get("template", "")
        if template:
            keywords.add(template.replace("_", " "))

        # Extract from query
        query = result.get("query", "")
        # Simple keyword extraction - split on common delimiters
        for word in query.split():
            if len(word) > 3 and word.isalpha():
                keywords.add(word.lower())

        # Extract finding types
        for f in result.get("findings", []):
            ft = f.get("finding_type", "")
            if ft:
                keywords.add(ft.replace("_", " "))

        # Limit to top keywords
        return list(keywords)[:15]

    def _calculate_overall_confidence(self, findings: List[Dict[str, Any]]) -> float:
        """Calculate overall confidence score from findings."""
        if not findings:
            return 0.5

        scores = [f.get("confidence_score", 0.5) for f in findings]
        return sum(scores) / len(scores)
