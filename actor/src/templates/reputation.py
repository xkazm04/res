"""Reputation Check template for verifying legitimacy and trustworthiness."""

from typing import List, Dict, Any, Optional
from datetime import datetime

from .base import BaseTemplate, TemplateConfig, FindingTypeConfig, FindingType
from ..services.report_components import (
    ComponentType, ReportHints
)


# ========== FINDING TYPE ENUM ==========

class ReputationFindingType(FindingType):
    """Valid finding types for reputation check research."""
    TRUST_SIGNAL = "trust_signal"
    WARNING_SIGN = "warning_sign"
    COMPLAINT_PATTERN = "complaint_pattern"
    VERIFICATION_STATUS = "verification_status"
    SENTIMENT_TREND = "sentiment_trend"
    COMPARISON_BENCHMARK = "comparison_benchmark"


# ========== TEMPLATE CONFIGURATION ==========

REPUTATION_CONFIG = TemplateConfig(
    search_intro="You are a consumer protection researcher helping someone verify if an entity is trustworthy.",
    search_angles=[
        {
            "name": "SCAM & FRAUD REPORTS",
            "items": [
                "Scam reports, fraud allegations",
                "BBB complaints, FTC reports",
                "Consumer protection warnings",
            ]
        },
        {
            "name": "REVIEWS & COMPLAINTS",
            "items": [
                "Customer reviews across multiple platforms",
                "Complaint patterns and common issues",
                "Response to complaints",
            ]
        },
        {
            "name": "LEGITIMACY VERIFICATION",
            "items": [
                "Business registration, licenses",
                "Physical address verification",
                "Contact information validity",
            ]
        },
        {
            "name": "ONLINE PRESENCE",
            "items": [
                "Website age, domain history",
                "Social media presence and engagement",
                "Professional profiles (LinkedIn, industry directories)",
            ]
        },
        {
            "name": "INDUSTRY REPUTATION",
            "items": [
                "Industry association membership",
                "Awards, certifications",
                "Peer recognition",
            ]
        },
        {
            "name": "NEWS & MEDIA",
            "items": [
                "News coverage (positive and negative)",
                "Investigations or exposés",
                "Press releases vs. independent coverage",
            ]
        },
    ],
    search_depth_guidance={
        "quick": "Focus on 3-4 angles (scam reports, reviews, legitimacy)",
        "standard": "Cover 5-6 angles",
        "deep": "Comprehensive coverage",
    },

    extraction_intro="You are a consumer protection analyst checking if an entity is trustworthy.",
    finding_types=[
        FindingTypeConfig(
            name="trust_signal",
            display_name="Trust Signal",
            description="Positive indicators of legitimacy. Must be verifiable, not self-reported.",
            extracted_data_schema='{"signal_type": "", "verification_status": "verified/unverified/self_reported", "source": "", "strength": "strong/moderate/weak"}',
            analysis_fallback="This trust signal provides evidence of legitimacy that can be verified.",
        ),
        FindingTypeConfig(
            name="warning_sign",
            display_name="Warning Sign",
            description="Red flags and concerns. Be specific about what's concerning and why.",
            extracted_data_schema='{"warning_type": "", "severity": "critical/significant/minor", "evidence": "", "recommendation": ""}',
            analysis_fallback="This warning sign warrants caution and further investigation.",
        ),
        FindingTypeConfig(
            name="complaint_pattern",
            display_name="Complaint Pattern",
            description="Recurring issues reported by multiple people",
            extracted_data_schema='{"complaint_type": "", "frequency": "many/several/few", "resolution": "resolved/unresolved/mixed", "sources": []}',
            analysis_fallback="This complaint pattern indicates systemic issues that affect multiple customers.",
        ),
        FindingTypeConfig(
            name="verification_status",
            display_name="Verification Status",
            description="Credentials, licenses, certifications",
            extracted_data_schema='{"credential": "", "issuer": "", "status": "valid/expired/unverifiable/fake", "verification_url": ""}',
            analysis_fallback="This verification status helps establish whether claims are legitimate.",
        ),
        FindingTypeConfig(
            name="sentiment_trend",
            display_name="Sentiment Trend",
            description="How perception has changed over time",
            extracted_data_schema='{"direction": "improving/declining/stable", "timeframe": "", "key_events": [], "current_sentiment": "positive/negative/mixed"}',
            analysis_fallback="This sentiment trend indicates how the entity's reputation has evolved.",
        ),
        FindingTypeConfig(
            name="comparison_benchmark",
            display_name="Comparison Benchmark",
            description="How they compare to similar entities",
            extracted_data_schema='{"benchmark": "", "rating": "above_average/average/below_average", "comparison_basis": ""}',
            analysis_fallback="This comparison helps contextualize the entity's performance relative to peers.",
        ),
    ],
    analysis_instruction="""YOUR EXPERT REPUTATION ANALYSIS (REQUIRED - 2-4 sentences) explaining:
  * WHY this signal matters for assessing trustworthiness
  * What this PATTERN indicates about the entity's practices
  * How this COMPARES to typical behavior of legitimate vs problematic actors
  * What SPECIFIC RISKS or assurances this provides""",
    extraction_guidelines="""CRITICAL: The "analysis" field must provide substantive assessment reasoning, not just describe the finding.
Good example: "This pattern of unresolved complaints is a major red flag because legitimate companies typically respond to BBB complaints within 14 days. The consistent theme of delayed refunds suggests systemic cash flow issues or intentional delay tactics. Companies with this complaint volume and non-response rate have a 78% correlation with eventual enforcement action."

IMPORTANT:
- WARNING SIGNS are the most important - surface these first
- Be skeptical of self-reported credentials
- Note if reviews appear fake or manipulated
- Distinguish between isolated incidents and patterns""",

    priority_finding_types=["warning_sign", "complaint_pattern", "verification_status", "trust_signal", "sentiment_trend", "comparison_benchmark"],
    grouping_order=["warning_sign", "complaint_pattern", "trust_signal", "verification_status", "sentiment_trend", "comparison_benchmark"],
)


class ReputationTemplate(BaseTemplate):
    """Template for reputation and legitimacy checks.

    Helps users verify whether a business, service, or professional
    is legitimate and trustworthy before engaging with them.
    """

    template_id = "reputation"
    template_name = "Reputation Check"
    description = "Verify legitimacy and trustworthiness - scam detection, reviews, and trust signals"

    # Data-driven configuration
    config = REPUTATION_CONFIG

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
