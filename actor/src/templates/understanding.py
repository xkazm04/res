"""Understanding template for analyzing major world events."""

from typing import List, Dict, Any, Optional
from datetime import datetime

from .base import BaseTemplate, TemplateConfig, FindingTypeConfig, FindingType
from ..services.report_components import (
    ComponentType, ReportHints
)


# ========== FINDING TYPE ENUM ==========

class UnderstandingFindingType(FindingType):
    """Valid finding types for world event understanding research."""
    EVENT_CHAIN = "event_chain"
    MEDIA_NARRATIVE = "media_narrative"
    FINANCIAL_MOTIVATION = "financial_motivation"
    MISINFORMATION_PATTERN = "misinformation_pattern"
    SOURCE_CREDIBILITY = "source_credibility"
    ACTOR_INTEREST = "actor_interest"
    COUNTER_NARRATIVE = "counter_narrative"
    HISTORICAL_PARALLEL = "historical_parallel"


# ========== TEMPLATE CONFIGURATION ==========

UNDERSTANDING_CONFIG = TemplateConfig(
    search_intro="You are an investigative researcher analyzing a major world event to understand its true causes, context, and implications.",
    search_angles=[
        {
            "name": "EVENT CHRONOLOGY & PREDECESSOR EVENTS",
            "items": [
                "What events led up to this? Timeline of precursor incidents",
                "Historical context and buildup",
                "Key decisions and turning points before the main event",
            ]
        },
        {
            "name": "MEDIA COVERAGE ANALYSIS",
            "items": [
                "How did major outlets cover related events before this?",
                "Compare coverage across different media ecosystems (Western, local, alternative)",
                "Historical accuracy of these sources on similar topics",
            ]
        },
        {
            "name": "FINANCIAL MOTIVATIONS & BENEFICIARIES",
            "items": [
                "Who benefits financially? (defense contractors, corporations, governments)",
                "Market movements before and after related events",
                "Economic interests at stake",
                "Follow the money: funding, contracts, investments",
            ]
        },
        {
            "name": "ACTOR INTERESTS & STATED vs HIDDEN AGENDAS",
            "items": [
                "Official positions vs revealed actions",
                "Stakeholder analysis (governments, corporations, NGOs)",
                "Declared objectives vs strategic interests",
            ]
        },
        {
            "name": "FACT-CHECKING & MISINFORMATION",
            "items": [
                "Debunked claims about this topic",
                "Known propaganda narratives",
                "Corrections and retractions by media",
                "Primary source verification",
            ]
        },
        {
            "name": "ALTERNATIVE PERSPECTIVES",
            "items": [
                "Non-mainstream analysis and commentary",
                "Local/regional reporting vs international coverage",
                "Academic and expert analysis",
                "Dissenting viewpoints",
            ]
        },
        {
            "name": "HISTORICAL PARALLELS",
            "items": [
                "Similar events in history",
                "Pattern recognition across comparable situations",
                "Lessons from past events",
            ]
        },
    ],
    search_depth_guidance={
        "quick": "Focus on 4-5 most critical angles (chronology, media, financial, fact-check)",
        "standard": "Cover 6-7 angles with balanced depth",
        "deep": "Comprehensive coverage of all angles with follow-up queries",
    },

    extraction_intro="You are an investigative analyst extracting findings to understand a major world event.",
    finding_types=[
        FindingTypeConfig(
            name="event_chain",
            display_name="Event Chain",
            description="Chronological events leading to the main event. Include: date, description, causal link to main event.",
            extracted_data_schema='{"event_date": "YYYY-MM-DD", "event_description": "", "causal_link": "", "established_fact": true/false}',
            analysis_fallback="This event in the causal chain helps explain how the situation developed over time.",
        ),
        FindingTypeConfig(
            name="media_narrative",
            display_name="Media Narrative",
            description="How specific outlets/media types covered this or predecessor events. Note any significant omissions or spin.",
            extracted_data_schema='{"outlet": "", "narrative_frame": "", "historical_accuracy": "high/medium/low", "noted_bias": "", "omissions": ""}',
            analysis_fallback="This media framing reveals how different outlets are shaping public perception of the event.",
        ),
        FindingTypeConfig(
            name="financial_motivation",
            display_name="Financial Motivation",
            description="Money flows, beneficiaries, economic interests. Be specific about HOW they benefit.",
            extracted_data_schema='{"actor": "", "benefit_type": "", "amount": "", "mechanism": "", "timing": ""}',
            analysis_fallback="This financial interest helps explain the underlying motivations behind key actors' positions.",
        ),
        FindingTypeConfig(
            name="misinformation_pattern",
            display_name="Misinformation Pattern",
            description="Detected false claims, propaganda techniques, debunked narratives.",
            extracted_data_schema='{"claim": "", "debunking_evidence": "", "propagators": [], "technique": "", "spread_level": "high/medium/low"}',
            analysis_fallback="This misinformation pattern demonstrates active narrative manipulation that affects public understanding.",
        ),
        FindingTypeConfig(
            name="source_credibility",
            display_name="Source Credibility",
            description="Assessment of source reliability based on historical coverage.",
            extracted_data_schema='{"source_name": "", "track_record": "good/mixed/poor", "notable_errors": [], "notable_successes": [], "ownership_bias": ""}',
            analysis_fallback="This credibility assessment helps calibrate how much weight to give different sources.",
        ),
        FindingTypeConfig(
            name="actor_interest",
            display_name="Actor Interest",
            description="Stakeholders and their stated vs hidden interests.",
            extracted_data_schema='{"actor": "", "stated_position": "", "likely_interest": "", "evidence_for_hidden_interest": ""}',
            analysis_fallback="Understanding this actor's interests reveals the gap between stated positions and likely motivations.",
        ),
        FindingTypeConfig(
            name="counter_narrative",
            display_name="Counter Narrative",
            description="Alternative explanations and dissenting views.",
            extracted_data_schema='{"alternative_view": "", "proponents": [], "evidence": "", "credibility_assessment": ""}',
            analysis_fallback="This alternative perspective challenges mainstream assumptions and deserves consideration.",
        ),
        FindingTypeConfig(
            name="historical_parallel",
            display_name="Historical Parallel",
            description="Similar events in history that provide context.",
            extracted_data_schema='{"parallel_event": "", "date": "", "similarities": [], "differences": [], "lesson": ""}',
            analysis_fallback="This historical comparison provides context for understanding likely outcomes and patterns.",
        ),
    ],
    analysis_instruction="""YOUR EXPERT ANALYTICAL COMMENTARY (REQUIRED - 2-4 sentences) explaining:
  * WHY this finding matters for understanding the event/topic
  * What CONTEXT or BACKGROUND helps interpret this
  * How this RELATES to other findings or the broader narrative
  * What this REVEALS about hidden motivations, biases, or dynamics""",
    extraction_guidelines="""CRITICAL: The "analysis" field must provide substantive reasoning, not just restate the finding.
Bad example: "This is an important media narrative."
Good example: "This narrative framing emerged specifically after the policy announcement, suggesting coordinated messaging. The choice to emphasize economic impacts while omitting human costs reflects the outlet's historical pattern of pro-business coverage. This contrasts sharply with local media reporting, which prioritized community impacts."

IMPORTANT GUIDELINES:
- Be skeptical - flag claims that lack corroboration
- Distinguish between established facts and analysis/opinion
- Note conflicting narratives rather than choosing one
- Prioritize primary sources over secondary reporting
- Flag propaganda techniques (emotional manipulation, false equivalence, strawmen, etc.)""",

    priority_finding_types=["event_chain", "financial_motivation", "misinformation_pattern", "actor_interest", "media_narrative", "source_credibility"],
    grouping_order=["event_chain", "financial_motivation", "misinformation_pattern", "actor_interest", "media_narrative", "source_credibility", "counter_narrative", "historical_parallel"],
)


class UnderstandingTemplate(BaseTemplate):
    """Template for deep understanding of major world events."""

    template_id = "understanding"
    template_name = "Event Understanding"
    description = "Deep analysis of major world events: causes, media credibility, financial motivations, and misinformation"

    # Data-driven configuration
    config = UNDERSTANDING_CONFIG

    # Report hints for component-based rendering
    report_hints = ReportHints(
        template_type="understanding",
        structure="narrative_first",
        findings_grouping="chronological",
        tone="educational",
        decision_format="recommendation",
        emphasis=["context", "explanation", "implications", "perspectives"],
        required_components=[
            ComponentType.EVENT_EXPLAINER,
            ComponentType.TIMELINE,
            ComponentType.KEY_INSIGHTS,
        ],
        optional_components=[
            ComponentType.FINDINGS_TABLE,
            ComponentType.QUOTE_CAROUSEL,
            ComponentType.PREDICTION_CARDS,
            ComponentType.SOURCE_LIST,
        ],
        visualization_preference=["event_timeline", "stakeholder_map", "impact_diagram"],
        custom_sections={
            "explainer_format": True,
            "multiple_perspectives": True,
            "historical_context": True,
        }
    )

    # Expert perspectives for understanding complex events
    default_perspectives = [
        "media_analyst",
        "forensic_financial",
        "geopolitical_strategic",
        "fact_checker",
        "historian",
        "intelligence_analyst",
    ]

    default_max_searches = 10

    verification_config = {
        "cross_reference": "thorough",
        "bias_detection": "thorough",
        "expert_sanity_check": "thorough",
        "source_quality": "thorough",
    }

    def get_supported_report_variants(self) -> List[str]:
        """Understanding template supports credibility_report variant."""
        return ["full_report", "executive_summary", "credibility_report"]

    def generate_credibility_report(
        self,
        result: Dict[str, Any],
        title: Optional[str] = None,
    ) -> str:
        """Generate credibility-focused report."""
        query = result.get("query", "Unknown")
        report_title = title or f"Media Credibility & Misinformation Analysis: {query[:50]}"

        sections = []
        sections.append(f"# {report_title}")
        sections.append("")
        sections.append(f"**Subject:** {query}")
        sections.append(f"**Date:** {datetime.now().strftime('%B %d, %Y')}")
        sections.append("")
        sections.append("---")
        sections.append("")

        findings = result.get("findings", [])

        # Misinformation patterns
        misinfo = [f for f in findings if f.get("finding_type") == "misinformation_pattern"]
        sections.append("## Detected Misinformation")
        sections.append("")
        if misinfo:
            for m in misinfo[:8]:
                extracted = m.get("extracted_data", {})
                if extracted and isinstance(extracted, dict):
                    claim = extracted.get("claim", "")
                    technique = extracted.get("technique", "")
                    sections.append(f"- **Claim:** {claim}")
                    if technique:
                        sections.append(f"  - Technique: {technique}")
                    sections.append(f"  - {m.get('summary', '')}")
                else:
                    sections.append(f"- {m.get('summary') or m.get('content', '')[:150]}")
        else:
            sections.append("No significant misinformation patterns detected.")
        sections.append("")

        # Source credibility
        credibility = [f for f in findings if f.get("finding_type") == "source_credibility"]
        if credibility:
            sections.append("## Source Credibility Assessment")
            sections.append("")
            for c in credibility[:6]:
                extracted = c.get("extracted_data", {})
                if extracted and isinstance(extracted, dict):
                    source = extracted.get("source_name", "")
                    track = extracted.get("track_record", "")
                    sections.append(f"- **{source}**: {track} track record")
                    if extracted.get("ownership_bias"):
                        sections.append(f"  - Ownership/Bias: {extracted.get('ownership_bias')}")
                else:
                    sections.append(f"- {c.get('summary') or c.get('content', '')[:100]}")
            sections.append("")

        # Media narratives
        narratives = [f for f in findings if f.get("finding_type") == "media_narrative"]
        if narratives:
            sections.append("## Media Narrative Analysis")
            sections.append("")
            for n in narratives[:6]:
                extracted = n.get("extracted_data", {})
                if extracted and isinstance(extracted, dict):
                    outlet = extracted.get("outlet", "Unknown")
                    frame = extracted.get("narrative_frame", "")
                    accuracy = extracted.get("historical_accuracy", "")
                    sections.append(f"- **{outlet}** ({accuracy} accuracy)")
                    sections.append(f"  - Framing: {frame[:100]}")
                else:
                    sections.append(f"- {n.get('summary') or n.get('content', '')[:100]}")
            sections.append("")

        # Counter narratives
        counter = [f for f in findings if f.get("finding_type") == "counter_narrative"]
        if counter:
            sections.append("## Alternative Perspectives")
            sections.append("")
            for c in counter[:5]:
                sections.append(f"- {c.get('summary') or c.get('content', '')[:150]}")
            sections.append("")

        return "\n".join(sections)

    def _generate_key_sections(self, result: Dict[str, Any]) -> str:
        """Generate understanding-specific key sections."""
        findings = result.get("findings", [])
        sections = []

        # Event Chain Summary
        events = [f for f in findings if f.get("finding_type") == "event_chain"]
        if events:
            sections.append("## Event Chain Summary")
            sections.append("")
            for event in events[:8]:
                extracted = event.get("extracted_data", {})
                if extracted and isinstance(extracted, dict):
                    date = extracted.get("event_date", "")
                    desc = extracted.get("event_description", "")
                    if date and desc:
                        sections.append(f"- **{date}**: {desc[:100]}")
                        continue
                sections.append(f"- {event.get('summary') or event.get('content', '')[:100]}")
            sections.append("")

        # Financial Motivations Summary
        financial = [f for f in findings if f.get("finding_type") == "financial_motivation"]
        if financial:
            sections.append("## Financial Motivations Summary")
            sections.append("")
            for txn in financial[:6]:
                extracted = txn.get("extracted_data", {})
                if extracted and isinstance(extracted, dict):
                    actor = extracted.get("actor", "")
                    benefit = extracted.get("benefit_type", "")
                    if actor and benefit:
                        sections.append(f"- **{actor}**: {benefit}")
                        continue
                sections.append(f"- {txn.get('summary') or txn.get('content', '')[:100]}")
            sections.append("")

        return "\n".join(sections)

    def _generate_executive_highlights(self, result: Dict[str, Any]) -> str:
        """Generate understanding-specific executive highlights."""
        findings = result.get("findings", [])
        sections = []

        misinfo = [f for f in findings if f.get("finding_type") == "misinformation_pattern"
                   and f.get("confidence_score", 0) >= 0.7]
        if misinfo:
            sections.append("## Key Misinformation Detected")
            sections.append("")
            for m in misinfo[:3]:
                sections.append(f"- {m.get('summary') or m.get('content', '')[:120]}")
            sections.append("")

        financial = [f for f in findings if f.get("finding_type") == "financial_motivation"
                    and f.get("confidence_score", 0) >= 0.7]
        if financial:
            sections.append("## Key Financial Interests")
            sections.append("")
            for f in financial[:3]:
                sections.append(f"- {f.get('summary') or f.get('content', '')[:120]}")
            sections.append("")

        return "\n".join(sections)
