"""Investigative journalism research template."""

from typing import List, Dict, Any, Optional

from .base import BaseTemplate
from ..services.report_components import (
    ComponentType, ComponentConfig, ReportHints, get_report_hints
)


class InvestigativeTemplate(BaseTemplate):
    """Template for investigative journalism research."""

    template_id = "investigative"
    template_name = "Investigative Research"
    description = "Deep investigative journalism with actor and relationship analysis"

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

    async def generate_search_queries(
        self,
        query: str,
        max_searches: int,
        granularity: str = "standard",
    ) -> List[str]:
        """Generate investigative search queries."""
        prompt = f"""
You are an investigative journalist planning research queries for a deep investigation.

Investigation Topic: {query}

Depth Level: {granularity}

Generate search queries covering these investigative angles:
1. KEY ACTORS: Who are the main people/organizations involved?
2. TIMELINE: What events happened and when?
3. LOCATIONS: Where did key events occur? What jurisdictions are involved?
4. MOTIVATIONS: What are the underlying interests and relationships?
5. METHODS: How were things done? What mechanisms were used?
6. MONEY TRAIL: Financial connections and transactions
7. OFFICIAL RECORDS: Government filings, court documents, regulatory actions
8. MEDIA COVERAGE: News reports, interviews, public statements

For a "{granularity}" depth level:
- "quick": Focus on 1-3 most critical angles
- "standard": Cover 4-5 key angles with balanced depth
- "deep": Comprehensive coverage of all angles with follow-up queries

Return a JSON array of exactly {max_searches} search query strings, ordered by importance.
Example: ["query about main actor", "query about key event", ...]
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
        """Extract investigative findings."""
        # Build source context
        source_context = "\n\n".join([
            f"Source: {s.get('title', 'Unknown')} ({s.get('url', '')})\n"
            f"Credibility: {s.get('credibility_score', 'Unknown')}\n"
            f"Domain: {s.get('domain', '')}"
            for s in sources[:20]
        ])

        prompt = f"""
You are an investigative analyst extracting key findings for a deep investigation.

Investigation Topic: {query}

Synthesized Research Content:
{synthesized_content[:15000]}

Sources Referenced:
{source_context}

Extract findings in these investigative categories:

1. ACTORS (finding_type: "actor")
   - People, organizations, entities involved
   - Include: name, role, affiliations, significance
   - Note any aliases or connections

2. EVENTS (finding_type: "event")
   - Key incidents, actions, decisions
   - Include: date (if known), location, participants, outcome
   - Note sequence and causation

3. RELATIONSHIPS (finding_type: "relationship")
   - Connections between actors
   - Types: personal, professional, political, criminal
   - Include strength of evidence

4. FINANCIAL TRANSACTIONS (finding_type: "financial")
   - ANY money movement: payments, gifts, loans, wire transfers, settlements
   - Property purchases, sales, or transfers
   - Investments, donations, or funding
   - Include in extracted_data:
     * "amount": dollar amount (number)
     * "currency": "USD", "GBP", etc.
     * "payer": who paid/gave the money
     * "payee": who received the money
     * "transaction_date": date if known (YYYY-MM-DD)
     * "transaction_type": payment/gift/loan/wire_transfer/property/settlement/investment
     * "purpose": reason or context for the transaction
   - This is CRITICAL - extract ALL financial amounts mentioned

5. EVIDENCE (finding_type: "evidence")
   - Documents, statements, data points
   - Include: type, source, significance
   - Note verification status

6. PATTERNS (finding_type: "pattern")
   - Recurring behaviors, methods, structures
   - Include: description, frequency, participants

7. GAPS (finding_type: "gap")
   - Missing information, unanswered questions
   - What we don't know and why it matters
   - Suggested follow-up

For each finding, return:
- finding_type: One of 'actor', 'event', 'relationship', 'financial', 'evidence', 'pattern', 'gap'
- content: Detailed finding with specific facts
- summary: One sentence
- confidence_score: 0.0-1.0 (based on source quality and corroboration)
- temporal_context: 'past', 'present', 'ongoing', or 'prediction'
- extracted_data: JSON object with structured data specific to the finding type
  - For 'financial': MUST include amount, payer, payee, transaction_type

Return as JSON array. Prioritize extracting ALL financial transactions with specific dollar amounts.
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

    # ========== INVESTIGATIVE-SPECIFIC REPORT GENERATION ==========

    def get_supported_report_variants(self) -> List[str]:
        """Investigative template supports risk_assessment variant."""
        return ["full_report", "executive_summary", "risk_assessment"]

    def generate_risk_assessment(
        self,
        result: Dict[str, Any],
        title: Optional[str] = None,
    ) -> str:
        """Generate risk assessment report - investigative-specific variant."""
        from datetime import datetime

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
                        sections.append(f"- **${amount:,}** from {payer} to {payee}")
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

    def _get_priority_findings(self, findings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Investigative template prioritizes actors, financial, and evidence."""
        # Priority order for investigative findings
        priority_types = ["financial", "evidence", "actor", "relationship", "pattern"]
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
        """Group findings with investigative priority order."""
        # Custom order for investigative reports
        order = ["financial", "actor", "relationship", "evidence", "event", "pattern", "gap", "other"]
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
