"""Legal research template."""

from typing import List, Dict, Any, Optional

from .base import BaseTemplate
from ..services.report_components import (
    ComponentType, ComponentConfig, ReportHints, get_report_hints
)


class LegalTemplate(BaseTemplate):
    """Template for legal research, regulatory analysis, and compliance."""

    template_id = "legal"
    template_name = "Legal Research"
    description = "Legal case research, regulatory analysis, and compliance assessment"

    # Report hints for component-based rendering
    report_hints = ReportHints(
        template_type="legal",
        structure="narrative_first",
        findings_grouping="category",
        tone="professional",
        decision_format="recommendation",
        emphasis=["legal_precedents", "regulatory_implications", "compliance_requirements"],
        required_components=[
            ComponentType.LEGAL_CASE_TRACKER,
            ComponentType.FINDINGS_TABLE,
            ComponentType.TIMELINE,
        ],
        optional_components=[
            ComponentType.KEY_INSIGHTS,
            ComponentType.CHECKLIST,
            ComponentType.RISK_MATRIX,
            ComponentType.ACTION_ITEMS,
        ],
        visualization_preference=["case_timeline", "jurisdiction_map", "precedent_chain"],
        custom_sections={
            "show_case_citations": True,
            "compliance_checklist": True,
            "regulatory_timeline": True,
        }
    )

    # Expert perspectives for legal analysis
    default_perspectives = [
        "litigation_strategist",   # Case strength, discovery, outcomes
        "regulatory_expert",       # Compliance, enforcement, political factors
        "legal_liability",         # Liability exposure, evidence strength
        "forensic_financial",      # Financial crimes, fraud patterns
    ]

    default_max_searches = 10

    # Legal research is more factual - court citations are verifiable
    # Focus on source quality (primary legal sources) over bias detection
    verification_config = {
        "cross_reference": "light",         # Legal citations are specific
        "bias_detection": "light",          # Less bias in case law
        "expert_sanity_check": "light",     # Legal findings are factual
        "source_quality": "thorough",       # Primary sources (court filings) critical
    }

    async def generate_search_queries(
        self,
        query: str,
        max_searches: int,
        granularity: str = "standard",
    ) -> List[str]:
        """Generate legal research search queries."""
        prompt = f"""
You are a legal researcher planning comprehensive legal research for a law firm or legal department.

Research Topic: {query}

Depth Level: {granularity}

Generate search queries covering these legal research angles:

1. CASE LAW
   - Relevant federal and state court decisions
   - Appellate decisions and precedents
   - Recent rulings in this area
   - Landmark cases that shaped the law

2. STATUTES AND REGULATIONS
   - Applicable federal statutes (U.S. Code)
   - State statutes and laws
   - Federal regulations (CFR, Federal Register)
   - State and local regulations

3. REGULATORY GUIDANCE
   - Agency interpretive guidance
   - No-action letters, advisory opinions
   - Enforcement policy statements
   - FAQ and compliance bulletins

4. ENFORCEMENT ACTIONS
   - SEC, DOJ, FTC enforcement actions
   - State AG actions
   - Consent decrees and settlements
   - Criminal prosecutions

5. LITIGATION HISTORY
   - Active lawsuits and proceedings
   - Class action filings
   - Qui tam and whistleblower cases
   - Arbitration and alternative dispute resolution

6. LEGAL COMMENTARY
   - Law review articles and legal scholarship
   - Bar association publications
   - Legal blog analysis
   - Expert commentary

7. REGULATORY FILINGS
   - SEC filings (8-K, 10-K risk factors)
   - Lobbying disclosures
   - Comment letters on proposed rules
   - Patent and trademark filings

8. CONTRACTUAL ANALYSIS
   - Standard contract terms in this area
   - Key contractual provisions
   - Industry standard agreements
   - Licensing and IP arrangements

9. COMPLIANCE REQUIREMENTS
   - Regulatory compliance checklists
   - Industry standards and best practices
   - Self-regulatory organization rules
   - International compliance requirements

10. LEGAL TRENDS
    - Proposed legislation
    - Regulatory reform initiatives
    - Emerging legal theories
    - Judicial appointment impacts

For a "{granularity}" depth level:
- "quick": Focus on most relevant cases and current regulations
- "standard": Balanced coverage of cases, regulations, and enforcement
- "deep": Comprehensive legal research including commentary and trends

Return a JSON array of exactly {max_searches} search query strings, ordered by importance.
Example: ["SEC v Company X securities fraud case 2024", "GDPR compliance requirements data breach", ...]
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
        """Extract legal research findings."""
        # Build source context
        source_context = "\n\n".join([
            f"Source: {s.get('title', 'Unknown')} ({s.get('url', '')})\n"
            f"Credibility: {s.get('credibility_score', 'Unknown')}\n"
            f"Domain: {s.get('domain', '')}"
            for s in sources[:20]
        ])

        prompt = f"""
You are a legal research analyst extracting key findings for legal analysis.

Research Topic: {query}

Synthesized Research Content:
{synthesized_content[:15000]}

Sources Referenced:
{source_context}

Extract findings in these legal research categories:

1. CASE LAW (finding_type: "evidence")
   - Court decisions and holdings
   - Include: case name, court, date, holding
   - Note precedential value and applicability
   - extracted_data: {{"case_name": "...", "court": "...", "date": "...", "citation": "...", "holding": "...", "precedential_value": "binding/persuasive"}}

2. STATUTES AND REGULATIONS (finding_type: "fact")
   - Applicable laws and regulations
   - Include: statute/regulation name, citation, key provisions
   - Note effective date and amendments
   - extracted_data: {{"name": "...", "citation": "...", "key_provisions": [...], "effective_date": "..."}}

3. ENFORCEMENT ACTIONS (finding_type: "event")
   - Regulatory enforcement and prosecutions
   - Include: agency, respondent, date, allegations, outcome
   - Note penalties, injunctions, and remedies
   - extracted_data: {{"agency": "...", "respondent": "...", "date": "...", "allegations": [...], "outcome": "...", "penalty": ...}}

4. LITIGATION (finding_type: "event")
   - Active and resolved lawsuits
   - Include: parties, court, claims, status
   - Note settlement amounts if disclosed
   - extracted_data: {{"case_name": "...", "court": "...", "filing_date": "...", "claims": [...], "status": "...", "settlement": ...}}

5. REGULATORY GUIDANCE (finding_type: "claim")
   - Agency interpretations and guidance
   - Include: agency, date, topic, key points
   - Note legal weight and binding nature
   - extracted_data: {{"agency": "...", "document_type": "...", "date": "...", "topic": "...", "key_points": [...]}}

6. LEGAL RISKS (finding_type: "pattern")
   - Identified legal exposure patterns
   - Include: risk type, likelihood, severity
   - Note mitigation strategies if mentioned
   - extracted_data: {{"risk_type": "...", "likelihood": "high/medium/low", "severity": "high/medium/low", "mitigation": [...]}}

7. COMPLIANCE REQUIREMENTS (finding_type: "fact")
   - Specific compliance obligations
   - Include: requirement, authority, deadline
   - Note penalties for non-compliance
   - extracted_data: {{"requirement": "...", "authority": "...", "deadline": "...", "penalty": "..."}}

8. LEGAL PRECEDENT (finding_type: "relationship")
   - How cases relate to each other
   - Include: cases involved, relationship type
   - Note whether overruled or distinguished
   - extracted_data: {{"citing_case": "...", "cited_case": "...", "relationship": "follows/distinguishes/overrules/questions"}}

9. LEGAL ANALYSIS (finding_type: "claim")
   - Expert legal opinions and commentary
   - Include: source, position, reasoning
   - Note author credentials
   - extracted_data: {{"source": "...", "author": "...", "position": "...", "reasoning": "..."}}

10. KNOWLEDGE GAPS (finding_type: "gap")
    - Missing legal research
    - What additional research is needed
    - Suggested follow-up sources

For each finding, return:
- finding_type: One of 'evidence', 'fact', 'event', 'claim', 'pattern', 'relationship', 'gap'
- content: Detailed finding with specific citations and facts
- summary: One sentence
- confidence_score: 0.0-1.0 (based on source authority and recency)
- temporal_context: 'past', 'present', 'ongoing', or 'prediction'
- extracted_data: JSON object with structured legal data as specified above

Return as JSON array. Prioritize accuracy and proper legal citations.
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

    # ========== LEGAL-SPECIFIC REPORT GENERATION ==========

    def get_supported_report_variants(self) -> List[str]:
        """Legal template supports legal_brief and compliance_assessment variants."""
        return ["full_report", "executive_summary", "legal_brief", "compliance_assessment"]

    def generate_legal_brief(
        self,
        result: Dict[str, Any],
        title: Optional[str] = None,
    ) -> str:
        """Generate legal brief report - legal-specific variant."""
        from datetime import datetime

        query = result.get("query", "Unknown")
        report_title = title or f"Legal Brief: {query[:40]}"

        sections = []
        sections.append(f"# {report_title}")
        sections.append("")
        sections.append(f"**Subject:** {query}")
        sections.append(f"**Date:** {datetime.now().strftime('%B %d, %Y')}")
        sections.append("")
        sections.append("---")
        sections.append("")

        findings = result.get("findings", [])

        # Applicable Law
        statutes = [f for f in findings if f.get("finding_type") == "fact"
                    and ("statute" in f.get("content", "").lower() or "regulation" in f.get("content", "").lower())]
        if statutes:
            sections.append("## Applicable Law")
            sections.append("")
            for s in statutes[:5]:
                extracted = s.get("extracted_data", {})
                if extracted and isinstance(extracted, dict):
                    name = extracted.get("name", "")
                    citation = extracted.get("citation", "")
                    if name and citation:
                        sections.append(f"- **{name}** ({citation})")
                else:
                    sections.append(f"- {s.get('summary') or s.get('content', '')[:100]}")
            sections.append("")

        # Relevant Case Law
        cases = [f for f in findings if f.get("finding_type") == "evidence"]
        if cases:
            sections.append("## Relevant Case Law")
            sections.append("")
            for case in cases[:6]:
                extracted = case.get("extracted_data", {})
                if extracted and isinstance(extracted, dict):
                    case_name = extracted.get("case_name", "")
                    citation = extracted.get("citation", "")
                    holding = extracted.get("holding", "")
                    if case_name:
                        sections.append(f"### {case_name}")
                        if citation:
                            sections.append(f"*{citation}*")
                        sections.append("")
                        if holding:
                            sections.append(f"**Holding:** {holding}")
                        sections.append("")
                else:
                    sections.append(f"- {case.get('summary') or case.get('content', '')[:150]}")
            sections.append("")

        # Legal Analysis
        perspectives = result.get("perspectives", [])
        litigation = next((p for p in perspectives if "litigation" in p.get("perspective_type", "").lower()), None)
        if litigation:
            sections.append("## Legal Analysis")
            sections.append("")
            sections.append(litigation.get("analysis_text", "")[:800])
            sections.append("")

        # Risk Assessment
        risks = [f for f in findings if f.get("finding_type") == "pattern"]
        if risks:
            sections.append("## Legal Risk Assessment")
            sections.append("")
            for r in risks[:5]:
                sections.append(f"- {r.get('summary') or r.get('content', '')[:100]}")
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

    def generate_compliance_assessment(
        self,
        result: Dict[str, Any],
        title: Optional[str] = None,
    ) -> str:
        """Generate compliance assessment report - legal-specific variant."""
        from datetime import datetime

        query = result.get("query", "Unknown")
        report_title = title or f"Compliance Assessment: {query[:40]}"

        sections = []
        sections.append(f"# {report_title}")
        sections.append("")
        sections.append(f"**Subject:** {query}")
        sections.append(f"**Date:** {datetime.now().strftime('%B %d, %Y')}")
        sections.append("")
        sections.append("---")
        sections.append("")

        findings = result.get("findings", [])

        # Compliance Requirements
        requirements = [f for f in findings if f.get("finding_type") == "fact"]
        if requirements:
            sections.append("## Compliance Requirements")
            sections.append("")
            for req in requirements[:6]:
                extracted = req.get("extracted_data", {})
                if extracted and isinstance(extracted, dict):
                    requirement = extracted.get("requirement", "")
                    authority = extracted.get("authority", "")
                    if requirement:
                        sections.append(f"- **{requirement}** (Authority: {authority})")
                else:
                    sections.append(f"- {req.get('summary') or req.get('content', '')[:100]}")
            sections.append("")

        # Enforcement Actions
        enforcement = [f for f in findings if f.get("finding_type") == "event"]
        if enforcement:
            sections.append("## Relevant Enforcement Actions")
            sections.append("")
            for e in enforcement[:5]:
                extracted = e.get("extracted_data", {})
                if extracted and isinstance(extracted, dict):
                    agency = extracted.get("agency", "")
                    respondent = extracted.get("respondent", "")
                    outcome = extracted.get("outcome", "")
                    if agency and respondent:
                        sections.append(f"- **{agency} v. {respondent}**: {outcome}")
                else:
                    sections.append(f"- {e.get('summary') or e.get('content', '')[:100]}")
            sections.append("")

        # Compliance Gaps
        gaps = [f for f in findings if f.get("finding_type") == "gap"]
        if gaps:
            sections.append("## Identified Compliance Gaps")
            sections.append("")
            for g in gaps[:5]:
                sections.append(f"- {g.get('summary') or g.get('content', '')[:100]}")
            sections.append("")

        # Regulatory Expert Analysis
        perspectives = result.get("perspectives", [])
        regulatory = next((p for p in perspectives if "regulatory" in p.get("perspective_type", "").lower()), None)
        if regulatory:
            sections.append("## Regulatory Analysis")
            sections.append("")
            sections.append(regulatory.get("analysis_text", "")[:600])
            sections.append("")
            warnings = regulatory.get("warnings", [])
            if warnings:
                sections.append("**Compliance Warnings:**")
                for w in warnings[:4]:
                    sections.append(f"- {w}")
            sections.append("")

        # Remediation Recommendations
        sections.append("## Remediation Recommendations")
        sections.append("")
        for p in perspectives:
            recs = p.get("recommendations", [])
            for rec in recs[:3]:
                sections.append(f"- {rec}")
        sections.append("")

        return "\n".join(sections)

    def _get_priority_findings(self, findings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Legal template prioritizes evidence (case law) and facts (statutes)."""
        priority_types = ["evidence", "fact", "event", "pattern", "claim"]
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

    def _generate_key_sections(self, result: Dict[str, Any]) -> str:
        """Generate legal-specific key sections: Case Law, Statutes."""
        findings = result.get("findings", [])
        sections = []

        # Key Case Law
        cases = [f for f in findings if f.get("finding_type") == "evidence"]
        if cases:
            sections.append("## Key Case Law")
            sections.append("")
            for case in cases[:4]:
                sections.append(f"- {case.get('summary') or case.get('content', '')[:100]}")
            sections.append("")

        # Applicable Statutes
        statutes = [f for f in findings if f.get("finding_type") == "fact"]
        if statutes:
            sections.append("## Applicable Statutes & Regulations")
            sections.append("")
            for s in statutes[:4]:
                sections.append(f"- {s.get('summary') or s.get('content', '')[:100]}")
            sections.append("")

        return "\n".join(sections)

    def _generate_executive_highlights(self, result: Dict[str, Any]) -> str:
        """Generate legal-specific executive highlights."""
        findings = result.get("findings", [])
        sections = []

        # Legal risks highlight
        risks = [f for f in findings if f.get("finding_type") == "pattern"]
        if risks:
            sections.append("## Key Legal Risks")
            sections.append("")
            for r in risks[:3]:
                sections.append(f"- {r.get('summary') or r.get('content', '')[:80]}")
            sections.append("")

        return "\n".join(sections)
