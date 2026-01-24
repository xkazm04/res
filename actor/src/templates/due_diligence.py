"""Due Diligence template for vetting companies, vendors, and partners."""

from typing import List, Dict, Any, Optional
from datetime import datetime

from .base import BaseTemplate
from ..services.report_components import (
    ComponentType, ComponentConfig, ReportHints, get_report_hints
)


class DueDiligenceTemplate(BaseTemplate):
    """Template for business due diligence research.

    Helps users vet potential business partners, vendors, employers,
    or investment targets by surfacing risks and verifying claims.
    """

    template_id = "due_diligence"
    template_name = "Due Diligence"
    description = "Vet companies, vendors, and partners before signing contracts or making commitments"

    # Report hints for component-based rendering
    report_hints = ReportHints(
        template_type="due_diligence",
        structure="verdict_first",
        findings_grouping="category",
        tone="professional",
        decision_format="scorecard",
        emphasis=["overall_assessment", "red_flags", "strengths", "category_scores"],
        required_components=[
            ComponentType.DUE_DILIGENCE_SCORECARD,
            ComponentType.CHECKLIST,
            ComponentType.FINDINGS_TABLE,
        ],
        optional_components=[
            ComponentType.RISK_MATRIX,
            ComponentType.KEY_INSIGHTS,
            ComponentType.ACTION_ITEMS,
            ComponentType.TIMELINE,
        ],
        visualization_preference=["scorecard", "category_radar", "red_flag_matrix"],
        custom_sections={
            "show_risk_score": True,
            "category_breakdown": True,
            "recommendation_prominent": True,
        }
    )

    # Expert perspectives for due diligence
    default_perspectives = [
        "due_diligence_analyst",  # Professional vetting
        "forensic_financial",     # Follow the money
        "legal_liability",        # Legal exposure
        "industry_insider",       # Operational reality
    ]

    default_max_searches = 8

    # Due diligence requires thorough verification
    verification_config = {
        "cross_reference": "thorough",
        "bias_detection": "standard",
        "expert_sanity_check": "thorough",
        "source_quality": "thorough",
    }

    async def generate_search_queries(
        self,
        query: str,
        max_searches: int,
        granularity: str = "standard",
    ) -> List[str]:
        """Generate search queries for due diligence research."""
        prompt = f"""
You are a professional due diligence researcher helping someone vet a business entity.

Research Subject: {query}

Depth Level: {granularity}

Generate search queries to thoroughly vet this entity. Cover these angles:

1. COMPANY BASICS
   - Official registration, founding date, headquarters
   - Business model, products/services, market position
   - Company size, employee count, growth trajectory

2. LEADERSHIP & KEY PEOPLE
   - Founders, executives, board members
   - Their backgrounds, previous companies, track records
   - Any controversies or notable achievements

3. FINANCIAL HEALTH
   - Funding history, investors, revenue signals
   - Profitability indicators, growth metrics
   - Any signs of financial distress

4. LEGAL & REGULATORY
   - Lawsuits (plaintiff and defendant)
   - Regulatory actions, fines, settlements
   - Compliance issues, license status

5. REPUTATION & REVIEWS
   - Customer reviews and complaints (BBB, Trustpilot, G2, etc.)
   - Employee reviews (Glassdoor, Indeed)
   - Industry reputation, awards, recognition

6. RED FLAGS
   - Scam reports, fraud allegations
   - High-profile failures or scandals
   - Pattern of complaints or issues

For a "{granularity}" depth level:
- "quick": Focus on 3-4 most critical angles (legal, reviews, red flags)
- "standard": Cover 5-6 angles with balanced depth
- "deep": Comprehensive coverage of all angles

Return a JSON array of exactly {max_searches} search query strings.
Make queries specific and investigative. Include the entity name in each query.
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
        """Extract due diligence findings."""
        source_context = "\n\n".join([
            f"Source: {s.get('title', 'Unknown')} ({s.get('url', '')})\n"
            f"Domain: {s.get('domain', '')}"
            for s in sources[:20]
        ])

        prompt = f"""
You are a due diligence analyst extracting findings to help someone make a business decision.

Research Subject: {query}

Synthesized Research Content:
{synthesized_content[:16000]}

Sources Referenced:
{source_context}

Extract findings in these categories:

1. COMPANY_PROFILE (finding_type: "company_profile")
   - Basic facts about the entity
   - extracted_data: {{"name": "", "founded": "", "headquarters": "", "size": "", "industry": "", "business_model": ""}}

2. FINANCIAL_HEALTH (finding_type: "financial_health")
   - Financial stability indicators
   - extracted_data: {{"indicator": "", "status": "healthy/concerning/unknown", "evidence": "", "trend": ""}}

3. LEGAL_HISTORY (finding_type: "legal_history")
   - Lawsuits, regulatory actions, legal issues
   - extracted_data: {{"case_type": "", "status": "", "outcome": "", "amount": "", "date": "", "significance": ""}}

4. RED_FLAG (finding_type: "red_flag")
   - Warning signs that should concern the user
   - Be specific about WHY this is a red flag
   - extracted_data: {{"flag_type": "", "severity": "high/medium/low", "evidence": "", "recommendation": ""}}

5. REPUTATION_SIGNAL (finding_type: "reputation_signal")
   - Reviews, testimonials, industry standing
   - extracted_data: {{"source": "", "sentiment": "positive/negative/mixed", "rating": "", "common_themes": []}}

6. KEY_PERSON (finding_type: "key_person")
   - Leadership background and track record
   - extracted_data: {{"name": "", "role": "", "background": "", "track_record": "", "concerns": ""}}

For each finding, return:
- finding_type: One of the types above
- content: Detailed finding with specific facts
- summary: One concise sentence (this is what users see first)
- confidence_score: 0.0-1.0 based on source quality and corroboration
- temporal_context: 'past', 'present', 'ongoing'
- extracted_data: Structured data for the finding type

IMPORTANT:
- Prioritize RED FLAGS - users need to know risks first
- Be specific with dates, amounts, and names when available
- Distinguish between verified facts and allegations
- Note when information is outdated or unverifiable

Return as JSON array. Prioritize actionable findings that help the user decide whether to proceed.
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
        """Due diligence supports risk_summary variant."""
        return ["full_report", "executive_summary", "risk_summary"]

    def generate_risk_summary(
        self,
        result: Dict[str, Any],
        title: Optional[str] = None,
    ) -> str:
        """Generate risk-focused summary for due diligence."""
        query = result.get("query", "Unknown")
        report_title = title or f"Due Diligence: {query[:50]}"

        sections = []
        sections.append(f"# {report_title}")
        sections.append("")
        sections.append(f"**Subject:** {query}")
        sections.append(f"**Date:** {datetime.now().strftime('%B %d, %Y')}")
        sections.append("")

        findings = result.get("findings", [])

        # Risk verdict
        red_flags = [f for f in findings if f.get("finding_type") == "red_flag"]
        high_severity = [f for f in red_flags if f.get("extracted_data", {}).get("severity") == "high"]

        sections.append("## Risk Assessment")
        sections.append("")
        if high_severity:
            sections.append("**RISK LEVEL: HIGH** - Significant concerns identified")
        elif red_flags:
            sections.append("**RISK LEVEL: MEDIUM** - Some concerns warrant attention")
        else:
            sections.append("**RISK LEVEL: LOW** - No major red flags detected")
        sections.append("")

        # Red flags first
        if red_flags:
            sections.append("## Red Flags")
            sections.append("")
            for rf in red_flags[:6]:
                extracted = rf.get("extracted_data", {})
                severity = extracted.get("severity", "medium").upper() if extracted else "MEDIUM"
                sections.append(f"- **[{severity}]** {rf.get('summary', rf.get('content', '')[:100])}")
            sections.append("")

        # Legal issues
        legal = [f for f in findings if f.get("finding_type") == "legal_history"]
        if legal:
            sections.append("## Legal History")
            sections.append("")
            for l in legal[:5]:
                sections.append(f"- {l.get('summary', l.get('content', '')[:100])}")
            sections.append("")

        # Reputation
        reputation = [f for f in findings if f.get("finding_type") == "reputation_signal"]
        if reputation:
            sections.append("## Reputation Signals")
            sections.append("")
            for r in reputation[:4]:
                sections.append(f"- {r.get('summary', r.get('content', '')[:100])}")
            sections.append("")

        return "\n".join(sections)

    def _get_priority_findings(self, findings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Due diligence prioritizes red flags and legal issues."""
        priority_types = ["red_flag", "legal_history", "financial_health", "reputation_signal", "key_person"]
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
        """Group findings with due diligence priority order."""
        order = ["red_flag", "legal_history", "financial_health", "reputation_signal", "key_person", "company_profile"]
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
