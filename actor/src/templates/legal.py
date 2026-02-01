"""Legal research template."""

from typing import List, Dict, Any, Optional
from datetime import datetime

from .base import BaseTemplate, TemplateConfig, FindingTypeConfig, FindingType
from ..services.report_components import (
    ComponentType, ReportHints
)


# ========== FINDING TYPE ENUM ==========

class LegalFindingType(FindingType):
    """Valid finding types for legal research."""
    EVIDENCE = "evidence"
    FACT = "fact"
    EVENT = "event"
    CLAIM = "claim"
    PATTERN = "pattern"
    RELATIONSHIP = "relationship"
    GAP = "gap"


# ========== TEMPLATE CONFIGURATION ==========

LEGAL_CONFIG = TemplateConfig(
    search_intro="You are a legal researcher planning comprehensive legal research for a law firm or legal department.",
    search_angles=[
        {
            "name": "CASE LAW",
            "items": [
                "Relevant federal and state court decisions",
                "Appellate decisions and precedents",
                "Recent rulings in this area",
                "Landmark cases that shaped the law",
            ]
        },
        {
            "name": "STATUTES AND REGULATIONS",
            "items": [
                "Applicable federal statutes (U.S. Code)",
                "State statutes and laws",
                "Federal regulations (CFR, Federal Register)",
                "State and local regulations",
            ]
        },
        {
            "name": "REGULATORY GUIDANCE",
            "items": [
                "Agency interpretive guidance",
                "No-action letters, advisory opinions",
                "Enforcement policy statements",
                "FAQ and compliance bulletins",
            ]
        },
        {
            "name": "ENFORCEMENT ACTIONS",
            "items": [
                "SEC, DOJ, FTC enforcement actions",
                "State AG actions",
                "Consent decrees and settlements",
                "Criminal prosecutions",
            ]
        },
        {
            "name": "LITIGATION HISTORY",
            "items": [
                "Active lawsuits and proceedings",
                "Class action filings",
                "Qui tam and whistleblower cases",
                "Arbitration and alternative dispute resolution",
            ]
        },
        {
            "name": "LEGAL COMMENTARY",
            "items": [
                "Law review articles and legal scholarship",
                "Bar association publications",
                "Legal blog analysis",
                "Expert commentary",
            ]
        },
        {
            "name": "REGULATORY FILINGS",
            "items": [
                "SEC filings (8-K, 10-K risk factors)",
                "Lobbying disclosures",
                "Comment letters on proposed rules",
                "Patent and trademark filings",
            ]
        },
        {
            "name": "CONTRACTUAL ANALYSIS",
            "items": [
                "Standard contract terms in this area",
                "Key contractual provisions",
                "Industry standard agreements",
                "Licensing and IP arrangements",
            ]
        },
        {
            "name": "COMPLIANCE REQUIREMENTS",
            "items": [
                "Regulatory compliance checklists",
                "Industry standards and best practices",
                "Self-regulatory organization rules",
                "International compliance requirements",
            ]
        },
        {
            "name": "LEGAL TRENDS",
            "items": [
                "Proposed legislation",
                "Regulatory reform initiatives",
                "Emerging legal theories",
                "Judicial appointment impacts",
            ]
        },
    ],
    search_depth_guidance={
        "quick": "Focus on most relevant cases and current regulations",
        "standard": "Balanced coverage of cases, regulations, and enforcement",
        "deep": "Comprehensive legal research including commentary and trends",
    },

    extraction_intro="You are a legal research analyst extracting key findings for legal analysis.",
    finding_types=[
        FindingTypeConfig(
            name="evidence",
            display_name="Case Law",
            description="Court decisions and holdings. Include: case name, court, date, holding. Note precedential value and applicability.",
            extracted_data_schema='{"case_name": "...", "court": "...", "date": "...", "citation": "...", "holding": "...", "precedential_value": "binding/persuasive"}',
            analysis_fallback="This case law finding is relevant for establishing legal precedent in the matter at hand.",
        ),
        FindingTypeConfig(
            name="fact",
            display_name="Statutes and Regulations",
            description="Applicable laws and regulations. Include: statute/regulation name, citation, key provisions. Note effective date and amendments.",
            extracted_data_schema='{"name": "...", "citation": "...", "key_provisions": [...], "effective_date": "..."}',
            analysis_fallback="This statutory or regulatory finding establishes the legal framework applicable to the matter.",
        ),
        FindingTypeConfig(
            name="event",
            display_name="Enforcement/Litigation",
            description="Regulatory enforcement, prosecutions, and active lawsuits. Include: agency/parties, date, allegations, outcome. Note penalties, injunctions, and remedies.",
            extracted_data_schema='{"case_type": "enforcement/litigation", "parties": "...", "date": "...", "allegations": [...], "outcome": "...", "penalty": "..."}',
            analysis_fallback="This enforcement or litigation event provides context for understanding regulatory risk and legal exposure.",
        ),
        FindingTypeConfig(
            name="claim",
            display_name="Regulatory Guidance",
            description="Agency interpretations and guidance. Include: agency, date, topic, key points. Note legal weight and binding nature.",
            extracted_data_schema='{"agency": "...", "document_type": "...", "date": "...", "topic": "...", "key_points": [...]}',
            analysis_fallback="This regulatory guidance helps interpret how agencies apply the law in practice.",
        ),
        FindingTypeConfig(
            name="pattern",
            display_name="Legal Risk",
            description="Identified legal exposure patterns. Include: risk type, likelihood, severity. Note mitigation strategies if mentioned.",
            extracted_data_schema='{"risk_type": "...", "likelihood": "high/medium/low", "severity": "high/medium/low", "mitigation": [...]}',
            analysis_fallback="This legal risk pattern should be considered in risk assessment and mitigation planning.",
        ),
        FindingTypeConfig(
            name="relationship",
            display_name="Legal Precedent",
            description="How cases relate to each other. Include: cases involved, relationship type. Note whether overruled or distinguished.",
            extracted_data_schema='{"citing_case": "...", "cited_case": "...", "relationship": "follows/distinguishes/overrules/questions"}',
            analysis_fallback="This precedent relationship helps understand the evolution and current state of the law.",
        ),
        FindingTypeConfig(
            name="gap",
            display_name="Knowledge Gap",
            description="Missing legal research. What additional research is needed. Suggested follow-up sources.",
            extracted_data_schema='{"information_needed": "...", "importance": "high/medium/low", "suggested_sources": [...]}',
            analysis_fallback="This gap in legal research should be addressed before reaching final conclusions.",
        ),
    ],
    analysis_instruction="""YOUR EXPERT LEGAL ANALYSIS (REQUIRED - 2-4 sentences) explaining:
  * The LEGAL SIGNIFICANCE of this finding and how it affects the matter at hand
  * How this PRECEDENT or REGULATION applies to the specific situation
  * What RISKS or OPPORTUNITIES this creates from a legal perspective
  * How this COMPARES to similar cases or regulatory interpretations""",
    extraction_guidelines="""CRITICAL: The "analysis" field must provide substantive legal reasoning, not just describe the finding.
Good example: "This Supreme Court holding is controlling precedent that directly applies to the current matter. The Court's reasoning suggests a broad interpretation that would likely cover the conduct at issue. However, the concurrence's narrower reading has been adopted by some circuit courts, creating potential for distinguishing arguments."

IMPORTANT:
- Prioritize primary sources (court filings, statutes) over secondary commentary
- Include specific citations where available
- Distinguish between established law and emerging interpretations
- Note jurisdictional limitations of precedents""",

    priority_finding_types=["evidence", "fact", "event", "pattern", "claim"],
    grouping_order=["evidence", "fact", "event", "claim", "pattern", "relationship", "gap"],
)


class LegalTemplate(BaseTemplate):
    """Template for legal research, regulatory analysis, and compliance."""

    template_id = "legal"
    template_name = "Legal Research"
    description = "Legal case research, regulatory analysis, and compliance assessment"

    # Data-driven configuration
    config = LEGAL_CONFIG

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

    def get_supported_report_variants(self) -> List[str]:
        """Legal template supports legal_brief and compliance_assessment variants."""
        return ["full_report", "executive_summary", "legal_brief", "compliance_assessment"]

    def generate_legal_brief(
        self,
        result: Dict[str, Any],
        title: Optional[str] = None,
    ) -> str:
        """Generate legal brief report - legal-specific variant."""
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
