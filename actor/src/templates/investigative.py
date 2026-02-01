"""Investigative journalism research template."""

from typing import List, Dict, Any, Optional
from datetime import datetime

from .base import BaseTemplate, TemplateConfig, FindingTypeConfig, FindingType
from ..services.report_components import (
    ComponentType, ReportHints
)


# ========== FINDING TYPE ENUM ==========

class InvestigativeFindingType(FindingType):
    """Valid finding types for investigative journalism research."""
    ACTOR = "actor"
    EVENT = "event"
    RELATIONSHIP = "relationship"
    FINANCIAL = "financial"
    EVIDENCE = "evidence"
    PATTERN = "pattern"
    GAP = "gap"


# ========== TEMPLATE CONFIGURATION ==========

INVESTIGATIVE_CONFIG = TemplateConfig(
    search_intro="You are an investigative journalist planning research queries for a deep investigation.",
    search_angles=[
        {
            "name": "KEY ACTORS",
            "items": [
                "Who are the main people/organizations involved?",
                "Backgrounds and histories of key individuals",
                "Corporate structures and ownership",
            ]
        },
        {
            "name": "TIMELINE",
            "items": [
                "What events happened and when?",
                "Sequence of key decisions and actions",
                "Historical context and precedents",
            ]
        },
        {
            "name": "LOCATIONS",
            "items": [
                "Where did key events occur?",
                "What jurisdictions are involved?",
                "Geographic patterns and connections",
            ]
        },
        {
            "name": "MOTIVATIONS",
            "items": [
                "What are the underlying interests?",
                "Relationships and alliances",
                "Conflicts of interest",
            ]
        },
        {
            "name": "METHODS",
            "items": [
                "How were things done?",
                "What mechanisms were used?",
                "Patterns of behavior or action",
            ]
        },
        {
            "name": "MONEY TRAIL",
            "items": [
                "Financial connections and transactions",
                "Funding sources and flows",
                "Property and asset movements",
            ]
        },
        {
            "name": "OFFICIAL RECORDS",
            "items": [
                "Government filings and registrations",
                "Court documents and legal proceedings",
                "Regulatory actions and investigations",
            ]
        },
        {
            "name": "MEDIA COVERAGE",
            "items": [
                "News reports and investigations",
                "Interviews and public statements",
                "Coverage patterns and omissions",
            ]
        },
    ],
    search_depth_guidance={
        "quick": "Focus on 1-3 most critical angles",
        "standard": "Cover 4-5 key angles with balanced depth",
        "deep": "Comprehensive coverage of all angles with follow-up queries",
    },

    extraction_intro="You are an investigative analyst extracting key findings for a deep investigation.",
    finding_types=[
        FindingTypeConfig(
            name="actor",
            display_name="Actor",
            description="People, organizations, entities involved. Include: name, role, affiliations, significance. Note any aliases or connections.",
            extracted_data_schema='{"name": "...", "role": "...", "affiliations": [...], "significance": "...", "aliases": [...]}',
            analysis_fallback="This actor's role and connections warrant further investigation to understand their influence on events.",
        ),
        FindingTypeConfig(
            name="event",
            display_name="Event",
            description="Key incidents, actions, decisions. Include: date (if known), location, participants, outcome. Note sequence and causation.",
            extracted_data_schema='{"date": "...", "location": "...", "participants": [...], "outcome": "...", "causation": "..."}',
            analysis_fallback="This event is significant in the investigative timeline and may have causal links to other developments.",
        ),
        FindingTypeConfig(
            name="relationship",
            display_name="Relationship",
            description="Connections between actors. Types: personal, professional, political, criminal. Include strength of evidence.",
            extracted_data_schema='{"actor_a": "...", "actor_b": "...", "relationship_type": "...", "evidence_strength": "strong/moderate/weak"}',
            analysis_fallback="This connection reveals potential coordination or influence that could be relevant to the investigation.",
        ),
        FindingTypeConfig(
            name="financial",
            display_name="Financial Transaction",
            description="ANY money movement: payments, gifts, loans, wire transfers, settlements, property purchases, investments, donations. This is CRITICAL - extract ALL financial amounts mentioned.",
            extracted_data_schema='{"amount": 0, "currency": "USD", "payer": "...", "payee": "...", "transaction_date": "YYYY-MM-DD", "transaction_type": "payment/gift/loan/wire_transfer/property/settlement/investment", "purpose": "..."}',
            analysis_fallback="This financial transaction may indicate underlying arrangements that require further scrutiny.",
        ),
        FindingTypeConfig(
            name="evidence",
            display_name="Evidence",
            description="Documents, statements, data points. Include: type, source, significance. Note verification status.",
            extracted_data_schema='{"evidence_type": "document/statement/data", "source": "...", "significance": "...", "verified": true/false}',
            analysis_fallback="This evidence supports key aspects of the investigation and strengthens the evidentiary foundation.",
        ),
        FindingTypeConfig(
            name="pattern",
            display_name="Pattern",
            description="Recurring behaviors, methods, structures. Include: description, frequency, participants.",
            extracted_data_schema='{"description": "...", "frequency": "...", "participants": [...], "time_span": "..."}',
            analysis_fallback="This recurring pattern suggests systematic behavior that may indicate intentional coordination.",
        ),
        FindingTypeConfig(
            name="gap",
            display_name="Gap",
            description="Missing information, unanswered questions. What we don't know and why it matters. Suggested follow-up.",
            extracted_data_schema='{"question": "...", "importance": "high/medium/low", "suggested_followup": [...]}',
            analysis_fallback="This information gap limits our ability to draw complete conclusions and should be addressed.",
        ),
    ],
    analysis_instruction="""YOUR EXPERT ANALYTICAL COMMENTARY (REQUIRED - 2-4 sentences) explaining:
  * WHY this finding is significant for the investigation
  * What it IMPLIES about the broader situation
  * How it CONNECTS to other findings or patterns
  * What questions it RAISES or answers""",
    extraction_guidelines="""CRITICAL: The "analysis" field must provide substantive reasoning, not just restate the finding.
Bad example: "This is an important financial transaction."
Good example: "This payment pattern suggests a quid pro quo arrangement because the timing coincides with the policy change. The use of intermediary accounts indicates awareness that direct payment would raise red flags. This connects to the earlier lobbying activity and raises questions about who authorized the payment structure."

IMPORTANT:
- Prioritize extracting ALL financial transactions with specific dollar amounts
- Note corroboration status for key claims
- Flag connections that warrant further investigation""",

    priority_finding_types=["financial", "evidence", "actor", "relationship", "pattern"],
    grouping_order=["financial", "actor", "relationship", "evidence", "event", "pattern", "gap"],
)


class InvestigativeTemplate(BaseTemplate):
    """Template for investigative journalism research."""

    template_id = "investigative"
    template_name = "Investigative Research"
    description = "Deep investigative journalism with actor and relationship analysis"

    # Data-driven configuration
    config = INVESTIGATIVE_CONFIG

    # Report hints for component-based rendering
    report_hints = ReportHints(
        template_type="investigative",
        structure="narrative_first",
        findings_grouping="chronological",
        tone="investigative",
        decision_format="recommendation",
        emphasis=["evidence", "timeline", "key_actors", "implications"],
        required_components=[
            ComponentType.INVESTIGATION_TIMELINE,
            ComponentType.FINDINGS_TABLE,
            ComponentType.QUOTE_CAROUSEL,
        ],
        optional_components=[
            ComponentType.KEY_INSIGHTS,
            ComponentType.RISK_MATRIX,
            ComponentType.CHECKLIST,
            ComponentType.SOURCE_LIST,
        ],
        visualization_preference=["investigation_timeline", "evidence_network", "actor_map"],
        custom_sections={
            "show_financial_trail": True,
            "highlight_actors": True,
            "evidence_strength_indicators": True,
        }
    )

    # Expert perspectives for deep investigative analysis
    default_perspectives = [
        "forensic_financial",      # Follow the money, fraud detection
        "power_network",           # Map influence networks and institutional capture
        "psychological_behavioral", # Analyze motivations and credibility
        "legal_liability",          # Assess legal exposure and enforcement risk
        "geopolitical_strategic",   # Strategic interests and power dynamics
    ]

    default_max_searches = 8

    # Investigative requires thorough verification on all dimensions
    # Critical to verify claims, detect cover-ups, and identify spin
    verification_config = {
        "cross_reference": "thorough",      # Must corroborate claims
        "bias_detection": "thorough",       # Detect PR spin, cover-ups
        "expert_sanity_check": "thorough",  # Flag implausible claims
        "source_quality": "thorough",       # Primary sources critical
    }

    def get_supported_report_variants(self) -> List[str]:
        """Investigative template supports risk_assessment variant."""
        return ["full_report", "executive_summary", "risk_assessment"]

    def generate_risk_assessment(
        self,
        result: Dict[str, Any],
        title: Optional[str] = None,
    ) -> str:
        """Generate risk assessment report - investigative-specific variant."""
        query = result.get("query", "Unknown")
        report_title = title or f"Risk Assessment: {query[:40]}"

        sections = []
        sections.append(f"# {report_title}")
        sections.append("")
        sections.append(f"**Subject:** {query}")
        sections.append(f"**Date:** {datetime.now().strftime('%B %d, %Y')}")
        sections.append("")
        sections.append("---")
        sections.append("")

        findings = result.get("findings", [])

        # Critical findings (high risk)
        high_risk = [f for f in findings if f.get("finding_type") in ["financial", "evidence"]
                     and f.get("confidence_score", 0) >= 0.7]
        sections.append("## Critical Findings")
        sections.append("")
        if high_risk:
            for f in high_risk[:6]:
                sections.append(f"- **{f.get('finding_type', 'fact').upper()}**: {f.get('summary') or f.get('content', '')[:100]}")
        else:
            sections.append("No critical findings identified.")
        sections.append("")

        # Key actors
        actors = [f for f in findings if f.get("finding_type") == "actor"]
        if actors:
            sections.append("## Key Actors")
            sections.append("")
            for actor in actors[:8]:
                extracted = actor.get("extracted_data", {})
                if extracted and isinstance(extracted, dict):
                    name = extracted.get("name", "")
                    role = extracted.get("role", "")
                    if name:
                        sections.append(f"- **{name}**: {role}")
                else:
                    sections.append(f"- {actor.get('summary') or actor.get('content', '')[:80]}")
            sections.append("")

        # Financial transactions
        financial = [f for f in findings if f.get("finding_type") == "financial"]
        if financial:
            sections.append("## Financial Trail")
            sections.append("")
            for txn in financial[:6]:
                extracted = txn.get("extracted_data", {})
                if extracted and isinstance(extracted, dict):
                    amount = extracted.get("amount", "")
                    payer = extracted.get("payer", "")
                    payee = extracted.get("payee", "")
                    if amount:
                        sections.append(f"- **${amount:,}** from {payer} to {payee}" if isinstance(amount, (int, float)) else f"- **{amount}** from {payer} to {payee}")
                else:
                    sections.append(f"- {txn.get('summary') or txn.get('content', '')[:80]}")
            sections.append("")

        # Relationships map
        relationships = [f for f in findings if f.get("finding_type") == "relationship"]
        if relationships:
            sections.append("## Key Relationships")
            sections.append("")
            for rel in relationships[:6]:
                sections.append(f"- {rel.get('summary') or rel.get('content', '')[:100]}")
            sections.append("")

        # Patterns
        patterns = [f for f in findings if f.get("finding_type") == "pattern"]
        if patterns:
            sections.append("## Identified Patterns")
            sections.append("")
            for p in patterns[:5]:
                sections.append(f"- {p.get('summary') or p.get('content', '')[:100]}")
            sections.append("")

        # Knowledge gaps
        gaps = [f for f in findings if f.get("finding_type") == "gap"]
        if gaps:
            sections.append("## Investigation Gaps")
            sections.append("")
            for g in gaps[:5]:
                sections.append(f"- {g.get('summary') or g.get('content', '')[:100]}")
            sections.append("")

        # Warnings from perspectives
        perspectives = result.get("perspectives", [])
        all_warnings = []
        for p in perspectives:
            all_warnings.extend(p.get("warnings", []))
        if all_warnings:
            sections.append("## Risk Warnings")
            sections.append("")
            for warning in all_warnings[:6]:
                sections.append(f"- {warning}")
            sections.append("")

        return "\n".join(sections)

    def _generate_key_sections(self, result: Dict[str, Any]) -> str:
        """Generate investigative-specific key sections: Actor map, Financial trail."""
        findings = result.get("findings", [])
        sections = []

        # Key Actors Summary
        actors = [f for f in findings if f.get("finding_type") == "actor"]
        if actors:
            sections.append("## Key Actors Summary")
            sections.append("")
            for actor in actors[:5]:
                sections.append(f"- {actor.get('summary') or actor.get('content', '')[:100]}")
            sections.append("")

        # Financial Trail Summary
        financial = [f for f in findings if f.get("finding_type") == "financial"]
        if financial:
            sections.append("## Financial Trail Summary")
            sections.append("")
            for txn in financial[:5]:
                sections.append(f"- {txn.get('summary') or txn.get('content', '')[:100]}")
            sections.append("")

        return "\n".join(sections)

    def _generate_executive_highlights(self, result: Dict[str, Any]) -> str:
        """Generate investigative-specific executive highlights."""
        findings = result.get("findings", [])
        sections = []

        # Critical evidence highlight
        evidence = [f for f in findings if f.get("finding_type") == "evidence"
                    and f.get("confidence_score", 0) >= 0.7]
        if evidence:
            sections.append("## Critical Evidence")
            sections.append("")
            for e in evidence[:3]:
                sections.append(f"- {e.get('summary') or e.get('content', '')[:100]}")
            sections.append("")

        return "\n".join(sections)
