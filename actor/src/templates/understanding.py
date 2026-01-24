"""Understanding template for analyzing major world events."""

from typing import List, Dict, Any, Optional
from datetime import datetime

from .base import BaseTemplate
from ..services.report_components import (
    ComponentType, ComponentConfig, ReportHints, get_report_hints
)


class UnderstandingTemplate(BaseTemplate):
    """Template for deep understanding of major world events.

    Analyzes events like military operations, political upheavals, market crashes,
    etc. to understand:
    - What led to the event (causal chain)
    - How media covered predecessor events (credibility assessment)
    - Financial motivations and beneficiaries
    - Misinformation patterns and propaganda detection
    """

    template_id = "understanding"
    template_name = "Event Understanding"
    description = "Deep analysis of major world events: causes, media credibility, financial motivations, and misinformation"

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
        "media_analyst",           # Track narrative shifts, ownership biases, coverage patterns
        "forensic_financial",      # Follow the money, cui bono analysis
        "geopolitical_strategic",  # Strategic interests, power dynamics
        "fact_checker",            # Verify claims, detect manipulation
        "historian",               # Historical parallels, pattern recognition
        "intelligence_analyst",    # Information operations, propaganda detection
    ]

    default_max_searches = 10

    # Understanding requires thorough verification - misinformation is a key concern
    verification_config = {
        "cross_reference": "thorough",      # Must corroborate across multiple sources
        "bias_detection": "thorough",       # Detect propaganda and spin
        "expert_sanity_check": "thorough",  # Flag implausible claims
        "source_quality": "thorough",       # Primary sources critical
    }

    async def generate_search_queries(
        self,
        query: str,
        max_searches: int,
        granularity: str = "standard",
    ) -> List[str]:
        """Generate search queries for understanding major events."""
        prompt = f"""
You are an investigative researcher analyzing a major world event to understand its true causes, context, and implications.

Event/Topic: {query}

Depth Level: {granularity}

Generate search queries covering these critical angles:

1. EVENT CHRONOLOGY & PREDECESSOR EVENTS
   - What events led up to this? Timeline of precursor incidents
   - Historical context and buildup
   - Key decisions and turning points before the main event

2. MEDIA COVERAGE ANALYSIS
   - How did major outlets cover related events before this?
   - Compare coverage across different media ecosystems (Western, local, alternative)
   - Historical accuracy of these sources on similar topics

3. FINANCIAL MOTIVATIONS & BENEFICIARIES
   - Who benefits financially? (defense contractors, corporations, governments)
   - Market movements before and after related events
   - Economic interests at stake
   - Follow the money: funding, contracts, investments

4. ACTOR INTERESTS & STATED vs HIDDEN AGENDAS
   - Official positions vs revealed actions
   - Stakeholder analysis (governments, corporations, NGOs)
   - Declared objectives vs strategic interests

5. FACT-CHECKING & MISINFORMATION
   - Debunked claims about this topic
   - Known propaganda narratives
   - Corrections and retractions by media
   - Primary source verification

6. ALTERNATIVE PERSPECTIVES
   - Non-mainstream analysis and commentary
   - Local/regional reporting vs international coverage
   - Academic and expert analysis
   - Dissenting viewpoints

7. HISTORICAL PARALLELS
   - Similar events in history
   - Pattern recognition across comparable situations
   - Lessons from past events

For a "{granularity}" depth level:
- "quick": Focus on 4-5 most critical angles (chronology, media, financial, fact-check)
- "standard": Cover 6-7 angles with balanced depth
- "deep": Comprehensive coverage of all angles with follow-up queries

Return a JSON array of exactly {max_searches} search query strings, ordered by importance.
Example: ["timeline events leading to [topic]", "[topic] financial beneficiaries analysis", ...]

IMPORTANT: Make queries specific and investigative. Include date ranges where relevant.
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
        """Extract findings for understanding major events."""
        # Build source context
        source_context = "\n\n".join([
            f"Source: {s.get('title', 'Unknown')} ({s.get('url', '')})\n"
            f"Credibility: {s.get('credibility_score', 'Unknown')}\n"
            f"Domain: {s.get('domain', '')}"
            for s in sources[:25]
        ])

        prompt = f"""
You are an investigative analyst extracting findings to understand a major world event.

Event/Topic: {query}

Synthesized Research Content:
{synthesized_content[:18000]}

Sources Referenced:
{source_context}

Extract findings in these categories for understanding the event:

1. EVENT_CHAIN (finding_type: "event_chain")
   - Chronological events leading to the main event
   - Include: date, description, causal link to main event
   - Note whether this is established fact or analysis
   - extracted_data: {{"event_date": "YYYY-MM-DD", "event_description": "", "causal_link": "", "established_fact": true/false}}

2. MEDIA_NARRATIVE (finding_type: "media_narrative")
   - How specific outlets/media types covered this or predecessor events
   - Include: outlet name, narrative framing, historical accuracy assessment
   - Note any significant omissions or spin
   - extracted_data: {{"outlet": "", "narrative_frame": "", "historical_accuracy": "high/medium/low", "noted_bias": "", "omissions": ""}}

3. FINANCIAL_MOTIVATION (finding_type: "financial_motivation")
   - Money flows, beneficiaries, economic interests
   - Include: actor, financial benefit, amount if known, mechanism
   - Be specific about HOW they benefit
   - extracted_data: {{"actor": "", "benefit_type": "", "amount": "", "mechanism": "", "timing": ""}}

4. MISINFORMATION_PATTERN (finding_type: "misinformation_pattern")
   - Detected false claims, propaganda techniques, debunked narratives
   - Include: the claim, why it's false, who propagated it, technique used
   - extracted_data: {{"claim": "", "debunking_evidence": "", "propagators": [], "technique": "", "spread_level": "high/medium/low"}}

5. SOURCE_CREDIBILITY (finding_type: "source_credibility")
   - Assessment of source reliability based on historical coverage
   - Include: source name, track record on similar topics, notable errors/successes
   - extracted_data: {{"source_name": "", "track_record": "good/mixed/poor", "notable_errors": [], "notable_successes": [], "ownership_bias": ""}}

6. ACTOR_INTEREST (finding_type: "actor_interest")
   - Stakeholders and their stated vs hidden interests
   - Include: actor name, official position, likely true interest, evidence
   - extracted_data: {{"actor": "", "stated_position": "", "likely_interest": "", "evidence_for_hidden_interest": ""}}

7. COUNTER_NARRATIVE (finding_type: "counter_narrative")
   - Alternative explanations and dissenting views
   - Include: the alternative view, who holds it, supporting evidence, credibility
   - extracted_data: {{"alternative_view": "", "proponents": [], "evidence": "", "credibility_assessment": ""}}

8. HISTORICAL_PARALLEL (finding_type: "historical_parallel")
   - Similar events in history that provide context
   - Include: the parallel event, similarities, differences, lessons
   - extracted_data: {{"parallel_event": "", "date": "", "similarities": [], "differences": [], "lesson": ""}}

For each finding, return:
- finding_type: One of the types above
- content: Detailed finding with specific facts and analysis
- summary: One concise sentence
- confidence_score: 0.0-1.0 (based on source quality, corroboration, and verification status)
- temporal_context: 'past', 'present', 'ongoing', or 'prediction'
- extracted_data: JSON object with structured data specific to the finding type
- date_referenced: Specific date if applicable (e.g., "2024-12-15")
- date_range: Date range if applicable (e.g., "Q4 2024")

IMPORTANT GUIDELINES:
- Be skeptical - flag claims that lack corroboration
- Distinguish between established facts and analysis/opinion
- Note conflicting narratives rather than choosing one
- Prioritize primary sources over secondary reporting
- Flag propaganda techniques (emotional manipulation, false equivalence, strawmen, etc.)

Return as JSON array.
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
                        "date_referenced": f.get("date_referenced"),
                        "date_range": f.get("date_range"),
                    })

        return findings

    # ========== UNDERSTANDING-SPECIFIC REPORT GENERATION ==========

    def get_supported_report_variants(self) -> List[str]:
        """Understanding template supports credibility_report variant."""
        return ["full_report", "executive_summary", "credibility_report"]

    def generate_credibility_report(
        self,
        result: Dict[str, Any],
        title: Optional[str] = None,
    ) -> str:
        """Generate credibility-focused report - understanding-specific variant."""
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

    def _get_priority_findings(self, findings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Understanding template prioritizes event chain, financial motivations, and misinformation."""
        priority_types = ["event_chain", "financial_motivation", "misinformation_pattern",
                        "actor_interest", "media_narrative", "source_credibility"]
        prioritized = []

        for ftype in priority_types:
            type_findings = [f for f in findings if f.get("finding_type") == ftype]
            prioritized.extend(sorted(
                type_findings,
                key=lambda x: x.get("confidence_score", 0),
                reverse=True
            ))

        # Add remaining
        remaining = [f for f in findings if f not in prioritized]
        prioritized.extend(sorted(remaining, key=lambda x: x.get("confidence_score", 0), reverse=True))

        return prioritized

    def _group_findings(self, findings: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """Group findings with understanding priority order."""
        order = ["event_chain", "financial_motivation", "misinformation_pattern",
                "actor_interest", "media_narrative", "source_credibility",
                "counter_narrative", "historical_parallel", "other"]
        grouped: Dict[str, List[Dict[str, Any]]] = {}

        for ftype in order:
            type_findings = [f for f in findings if f.get("finding_type") == ftype]
            if type_findings:
                grouped[ftype] = type_findings

        # Add any remaining types not in order
        for f in findings:
            ftype = f.get("finding_type", "other")
            if ftype not in grouped:
                grouped[ftype] = []
            if f not in grouped.get(ftype, []):
                grouped.setdefault(ftype, []).append(f)

        return grouped

    def _generate_key_sections(self, result: Dict[str, Any]) -> str:
        """Generate understanding-specific key sections: Event Timeline, Financial Trail."""
        findings = result.get("findings", [])
        sections = []

        # Event Chain Summary
        events = [f for f in findings if f.get("finding_type") == "event_chain"]
        if events:
            sections.append("## Event Chain Summary")
            sections.append("")
            # Sort by date if available
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

        # Key misinformation highlight
        misinfo = [f for f in findings if f.get("finding_type") == "misinformation_pattern"
                   and f.get("confidence_score", 0) >= 0.7]
        if misinfo:
            sections.append("## Key Misinformation Detected")
            sections.append("")
            for m in misinfo[:3]:
                sections.append(f"- {m.get('summary') or m.get('content', '')[:120]}")
            sections.append("")

        # Key financial interests
        financial = [f for f in findings if f.get("finding_type") == "financial_motivation"
                    and f.get("confidence_score", 0) >= 0.7]
        if financial:
            sections.append("## Key Financial Interests")
            sections.append("")
            for f in financial[:3]:
                sections.append(f"- {f.get('summary') or f.get('content', '')[:120]}")
            sections.append("")

        return "\n".join(sections)
