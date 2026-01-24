"""Reputation Check template for verifying legitimacy and trustworthiness."""

from typing import List, Dict, Any, Optional
from datetime import datetime

from .base import BaseTemplate
from ..services.report_components import (
    ComponentType, ComponentConfig, ReportHints, get_report_hints
)


class ReputationTemplate(BaseTemplate):
    """Template for reputation and legitimacy checks.

    Helps users verify whether a business, service, or professional
    is legitimate and trustworthy before engaging with them.
    """

    template_id = "reputation"
    template_name = "Reputation Check"
    description = "Verify legitimacy and trustworthiness - scam detection, reviews, and trust signals"

    # Report hints for component-based rendering
    report_hints = ReportHints(
        template_type="reputation",
        structure="verdict_first",
        findings_grouping="sentiment",
        tone="advisory",
        decision_format="checklist",
        emphasis=["trust_score", "red_flags", "user_sentiment", "verification"],
        required_components=[
            ComponentType.TRUST_DASHBOARD,
            ComponentType.CHECKLIST,
            ComponentType.FINDINGS_TABLE,
        ],
        optional_components=[
            ComponentType.QUOTE_CAROUSEL,
            ComponentType.TIMELINE,
            ComponentType.KEY_INSIGHTS,
            ComponentType.SOURCE_LIST,
        ],
        visualization_preference=["trust_gauge", "sentiment_chart", "verification_checklist"],
        custom_sections={
            "trust_score_prominent": True,
            "red_flag_alerts": True,
            "sentiment_breakdown": True,
        }
    )

    # Expert perspectives for reputation checks
    default_perspectives = [
        "consumer_protection",   # Scam detection focus
        "reputation_analyst",    # Pattern analysis
        "fact_checker",          # Verification specialist
        "industry_benchmarker",  # Comparative assessment
    ]

    default_max_searches = 6

    # Reputation checks need thorough bias detection (fake reviews are common)
    verification_config = {
        "cross_reference": "thorough",
        "bias_detection": "thorough",
        "expert_sanity_check": "standard",
        "source_quality": "thorough",
    }

    async def generate_search_queries(
        self,
        query: str,
        max_searches: int,
        granularity: str = "standard",
    ) -> List[str]:
        """Generate search queries for reputation check research."""
        prompt = f"""
You are a consumer protection researcher helping someone verify if an entity is trustworthy.

Subject to Check: {query}

Depth Level: {granularity}

Generate search queries to determine if this entity is legitimate and trustworthy. Cover:

1. SCAM & FRAUD REPORTS
   - Scam reports, fraud allegations
   - BBB complaints, FTC reports
   - Consumer protection warnings

2. REVIEWS & COMPLAINTS
   - Customer reviews across multiple platforms
   - Complaint patterns and common issues
   - Response to complaints

3. LEGITIMACY VERIFICATION
   - Business registration, licenses
   - Physical address verification
   - Contact information validity

4. ONLINE PRESENCE
   - Website age, domain history
   - Social media presence and engagement
   - Professional profiles (LinkedIn, industry directories)

5. INDUSTRY REPUTATION
   - Industry association membership
   - Awards, certifications
   - Peer recognition

6. NEWS & MEDIA
   - News coverage (positive and negative)
   - Investigations or exposés
   - Press releases vs. independent coverage

For a "{granularity}" depth level:
- "quick": Focus on 3-4 angles (scam reports, reviews, legitimacy)
- "standard": Cover 5-6 angles
- "deep": Comprehensive coverage

Return a JSON array of exactly {max_searches} search query strings.
Include "scam", "reviews", "complaints", "legitimate" in relevant queries.
"""

        result = await self._call_gemini_json(prompt)

        if isinstance(result, list):
            return result[:max_searches]
        return []

    async def extract_findings(
        self,
        query: str,
        sources: List[Dict[str, Any]],
        synthesized_content: str,
        granularity: str = "standard",
    ) -> List[Dict[str, Any]]:
        """Extract reputation check findings."""
        source_context = "\n\n".join([
            f"Source: {s.get('title', 'Unknown')} ({s.get('url', '')})\n"
            f"Domain: {s.get('domain', '')}"
            for s in sources[:20]
        ])

        prompt = f"""
You are a consumer protection analyst checking if an entity is trustworthy.

Subject: {query}

Synthesized Research Content:
{synthesized_content[:16000]}

Sources Referenced:
{source_context}

Extract findings in these categories:

1. TRUST_SIGNAL (finding_type: "trust_signal")
   - Positive indicators of legitimacy
   - Must be verifiable, not self-reported
   - extracted_data: {{"signal_type": "", "verification_status": "verified/unverified/self_reported", "source": "", "strength": "strong/moderate/weak"}}

2. WARNING_SIGN (finding_type: "warning_sign")
   - Red flags and concerns
   - Be specific about what's concerning and why
   - extracted_data: {{"warning_type": "", "severity": "critical/significant/minor", "evidence": "", "recommendation": ""}}

3. COMPLAINT_PATTERN (finding_type: "complaint_pattern")
   - Recurring issues reported by multiple people
   - extracted_data: {{"complaint_type": "", "frequency": "many/several/few", "resolution": "resolved/unresolved/mixed", "sources": []}}

4. VERIFICATION_STATUS (finding_type: "verification_status")
   - Credentials, licenses, certifications
   - extracted_data: {{"credential": "", "issuer": "", "status": "valid/expired/unverifiable/fake", "verification_url": ""}}

5. SENTIMENT_TREND (finding_type: "sentiment_trend")
   - How perception has changed over time
   - extracted_data: {{"direction": "improving/declining/stable", "timeframe": "", "key_events": [], "current_sentiment": "positive/negative/mixed"}}

6. COMPARISON_BENCHMARK (finding_type: "comparison_benchmark")
   - How they compare to similar entities
   - extracted_data: {{"benchmark": "", "rating": "above_average/average/below_average", "comparison_basis": ""}}

For each finding, return:
- finding_type: One of the types above
- content: Detailed finding with specific evidence
- summary: One concise sentence (what users see first)
- confidence_score: 0.0-1.0 based on source quality and corroboration
- temporal_context: 'past', 'present', 'ongoing'
- extracted_data: Structured data for the finding type

IMPORTANT:
- WARNING SIGNS are the most important - surface these first
- Be skeptical of self-reported credentials
- Note if reviews appear fake or manipulated
- Distinguish between isolated incidents and patterns

Return as JSON array. Help the user avoid scams and bad actors.
"""

        result = await self._call_gemini_json(prompt)

        findings = []
        if isinstance(result, list):
            for f in result:
                if isinstance(f, dict):
                    findings.append({
                        "finding_type": f.get("finding_type", "fact"),
                        "content": f.get("content", ""),
                        "summary": f.get("summary"),
                        "confidence_score": f.get("confidence_score", 0.5),
                        "temporal_context": f.get("temporal_context", "present"),
                        "extracted_data": f.get("extracted_data"),
                    })

        return findings

    def get_supported_report_variants(self) -> List[str]:
        """Reputation check supports trust_report variant."""
        return ["full_report", "executive_summary", "trust_report"]

    def generate_trust_report(
        self,
        result: Dict[str, Any],
        title: Optional[str] = None,
    ) -> str:
        """Generate trust-focused report."""
        query = result.get("query", "Unknown")
        report_title = title or f"Reputation Check: {query[:50]}"

        sections = []
        sections.append(f"# {report_title}")
        sections.append("")
        sections.append(f"**Subject:** {query}")
        sections.append(f"**Date:** {datetime.now().strftime('%B %d, %Y')}")
        sections.append("")

        findings = result.get("findings", [])

        # Trust verdict
        warnings = [f for f in findings if f.get("finding_type") == "warning_sign"]
        critical_warnings = [f for f in warnings
                           if f.get("extracted_data", {}).get("severity") == "critical"]
        trust_signals = [f for f in findings if f.get("finding_type") == "trust_signal"]
        strong_signals = [f for f in trust_signals
                        if f.get("extracted_data", {}).get("strength") == "strong"]

        sections.append("## Trust Verdict")
        sections.append("")
        if critical_warnings:
            sections.append("**DO NOT ENGAGE** - Critical warning signs detected")
        elif len(warnings) > len(strong_signals):
            sections.append("**PROCEED WITH CAUTION** - More concerns than trust signals")
        elif strong_signals and not warnings:
            sections.append("**APPEARS LEGITIMATE** - Strong trust signals, no warnings")
        elif trust_signals and not critical_warnings:
            sections.append("**LIKELY LEGITIMATE** - Some trust signals, minor or no concerns")
        else:
            sections.append("**INSUFFICIENT DATA** - Unable to verify, proceed carefully")
        sections.append("")

        # Warning signs
        if warnings:
            sections.append("## Warning Signs")
            sections.append("")
            for w in warnings[:6]:
                extracted = w.get("extracted_data", {})
                severity = extracted.get("severity", "").upper() if extracted else ""
                prefix = f"**[{severity}]** " if severity else ""
                sections.append(f"- {prefix}{w.get('summary', w.get('content', '')[:100])}")
            sections.append("")

        # Complaint patterns
        complaints = [f for f in findings if f.get("finding_type") == "complaint_pattern"]
        if complaints:
            sections.append("## Complaint Patterns")
            sections.append("")
            for c in complaints[:4]:
                sections.append(f"- {c.get('summary', c.get('content', '')[:100])}")
            sections.append("")

        # Trust signals
        if trust_signals:
            sections.append("## Trust Signals")
            sections.append("")
            for t in trust_signals[:5]:
                extracted = t.get("extracted_data", {})
                strength = extracted.get("strength", "").upper() if extracted else ""
                prefix = f"**[{strength}]** " if strength else ""
                sections.append(f"- {prefix}{t.get('summary', t.get('content', '')[:100])}")
            sections.append("")

        # Verification status
        verifications = [f for f in findings if f.get("finding_type") == "verification_status"]
        if verifications:
            sections.append("## Verification Status")
            sections.append("")
            for v in verifications[:4]:
                extracted = v.get("extracted_data", {})
                status = extracted.get("status", "").upper() if extracted else ""
                credential = extracted.get("credential", "") if extracted else ""
                if credential and status:
                    sections.append(f"- **{credential}**: {status}")
                else:
                    sections.append(f"- {v.get('summary', v.get('content', '')[:100])}")
            sections.append("")

        return "\n".join(sections)

    def _get_priority_findings(self, findings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Reputation check prioritizes warnings and complaint patterns."""
        priority_types = ["warning_sign", "complaint_pattern", "verification_status",
                        "trust_signal", "sentiment_trend", "comparison_benchmark"]
        prioritized = []

        for ftype in priority_types:
            type_findings = [f for f in findings if f.get("finding_type") == ftype]
            prioritized.extend(sorted(
                type_findings,
                key=lambda x: x.get("confidence_score", 0),
                reverse=True
            ))

        remaining = [f for f in findings if f not in prioritized]
        prioritized.extend(sorted(remaining, key=lambda x: x.get("confidence_score", 0), reverse=True))

        return prioritized

    def _group_findings(self, findings: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """Group findings with reputation check priority order."""
        order = ["warning_sign", "complaint_pattern", "trust_signal",
                "verification_status", "sentiment_trend", "comparison_benchmark"]
        grouped: Dict[str, List[Dict[str, Any]]] = {}

        for ftype in order:
            type_findings = [f for f in findings if f.get("finding_type") == ftype]
            if type_findings:
                grouped[ftype] = type_findings

        for f in findings:
            ftype = f.get("finding_type", "other")
            if ftype not in grouped:
                grouped[ftype] = []
            if f not in grouped.get(ftype, []):
                grouped.setdefault(ftype, []).append(f)

        return grouped
