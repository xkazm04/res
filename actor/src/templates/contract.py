"""Contract analysis template for government contracts, pricing, and corruption detection."""

from typing import List, Dict, Any, Optional

from .base import BaseTemplate
from ..services.report_components import (
    ComponentType, ComponentConfig, ReportHints, get_report_hints
)


class ContractTemplate(BaseTemplate):
    """Template for government contract evaluation and corruption detection."""

    template_id = "contract"
    template_name = "Government Contract Analysis"
    description = "Analyze state/government contracts for overpricing, corruption, and suspicious elements"

    # Report hints for component-based rendering
    report_hints = ReportHints(
        template_type="contract",
        structure="balanced",
        findings_grouping="category",
        tone="professional",
        decision_format="checklist",
        emphasis=["key_terms", "obligations", "risks", "opportunities"],
        required_components=[
            ComponentType.CONTRACT_ANALYSIS,
            ComponentType.CHECKLIST,
            ComponentType.RISK_MATRIX,
        ],
        optional_components=[
            ComponentType.FINDINGS_TABLE,
            ComponentType.ACTION_ITEMS,
            ComponentType.COMPARISON_TABLE,
            ComponentType.KEY_INSIGHTS,
        ],
        visualization_preference=["contract_structure", "obligation_timeline", "risk_assessment"],
        custom_sections={
            "show_pricing_comparison": True,
            "red_flag_priority": True,
            "vendor_history": True,
        }
    )

    # Expert perspectives for contract analysis
    default_perspectives = [
        "contract_auditor",           # Pricing and cost analysis
        "procurement_investigator",   # Bid process, competition issues
        "forensic_accountant",        # Financial red flags
        "regulatory_compliance",      # Legal requirements
        "industry_benchmarker",       # Market rate comparison
    ]

    default_max_searches = 12

    # Thorough verification for fraud detection
    verification_config = {
        "cross_reference": "thorough",
        "bias_detection": "thorough",
        "expert_sanity_check": "thorough",
        "source_quality": "thorough",
    }

    async def generate_search_queries(
        self,
        query: str,
        max_searches: int,
        granularity: str = "standard",
    ) -> List[str]:
        """Generate contract-specific search queries."""
        prompt = f"""
You are a government contract analyst and fraud investigator planning research queries
to analyze contracts for overpricing, corruption risks, and suspicious elements.

CONTRACT/TOPIC TO ANALYZE: {query}

Depth Level: {granularity}

Generate search queries covering these critical investigation areas:

1. VENDOR/CONTRACTOR BACKGROUND
   - Company registration, incorporation date, ownership history
   - Key executives and beneficial owners
   - Prior government contracts with this vendor
   - Complaints, lawsuits, debarment history
   - Related companies, subsidiaries, DBAs
   - Political donations by company or executives

2. PRICING BENCHMARK RESEARCH
   - Industry standard rates for similar work/services
   - Government rate schedules (GSA schedules for federal)
   - Comparable contracts in same sector/region
   - Unit pricing for common line items
   - Labor rate comparisons (prevailing wage data)
   - Material cost benchmarks

3. BID PROCESS AND COMPETITION
   - Other bidders on this contract (if public)
   - Similar recent solicitations for comparison
   - Sole-source justification patterns
   - Bid protest history
   - Procurement officer history and patterns

4. CONTRACT MODIFICATIONS AND OVERRUNS
   - Change order patterns on similar contracts
   - Amendment and modification history
   - Cost overrun statistics in sector
   - Schedule extension patterns
   - Scope creep indicators

5. VENDOR PERFORMANCE HISTORY
   - Past performance evaluations (PPIRS for federal)
   - Completed projects: on-time, on-budget?
   - Quality issues, defects, rework
   - Customer complaints and disputes
   - Warranty claims and callbacks

6. CONNECTED ENTITIES AND CONFLICTS
   - Subcontractor relationships
   - Joint venture partners
   - Related party transactions
   - Revolving door: former officials now at vendor
   - Family connections to agency staff
   - Shell company indicators

7. REGULATORY AND COMPLIANCE
   - Required certifications/licenses
   - Small business set-aside compliance
   - DBE/MBE/WBE certification verification
   - Insurance and bonding requirements
   - DCAA audit findings (federal)

8. NEWS AND INVESTIGATIONS
   - Media coverage of vendor or contract
   - Inspector General reports
   - GAO/state auditor findings
   - Whistleblower complaints
   - FBI/DOJ investigations in sector

9. CONSTRUCTION-SPECIFIC (if applicable)
   - Prevailing wage compliance
   - OSHA violations
   - Environmental compliance
   - Permit and inspection history
   - Subcontractor payment disputes

10. SOFTWARE/IT-SPECIFIC (if applicable)
    - Similar IT projects cost/duration
    - Technology stack market rates
    - Developer/consultant hourly rates
    - Software license fair pricing
    - Customization vs. COTS analysis

For "{granularity}" depth level:
- quick (4-5): Focus on vendor background + pricing benchmark + news/issues
- standard (8-10): Add bid process + performance + connected entities
- deep (12+): All angles with multiple queries per angle, deep ownership research

Return a JSON array of exactly {max_searches} search query strings.
Make queries SPECIFIC to the contract details provided. Include:
- Vendor/company name if mentioned
- Agency/government entity if mentioned
- Project type and location if mentioned
- Dollar amounts or timeframes if mentioned

Example: ["ABC Construction LLC government contracts history complaints", "highway construction prevailing wage rates 2024 Texas", ...]
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
        """Extract contract analysis findings with fraud indicators."""
        # Build source context
        source_context = "\n\n".join([
            f"Source: {s.get('title', 'Unknown')} ({s.get('url', '')})\n"
            f"Credibility: {s.get('credibility_score', 'Unknown')}\n"
            f"Domain: {s.get('domain', '')}"
            for s in sources[:20]
        ])

        prompt = f"""
You are a government contract auditor and fraud investigator extracting findings
from research on a contract or contractor. Your goal is to identify red flags,
pricing anomalies, and corruption indicators.

CONTRACT/TOPIC ANALYZED: {query}

Synthesized Research Content:
{synthesized_content[:15000]}

Sources Referenced:
{source_context}

Extract findings in these contract analysis categories:

1. CONTRACT ENTITY (finding_type: "contract_entity")
   - Key parties: vendor, agency, contracting officer, subcontractors
   - Include in extracted_data: entity_name, entity_type, role, registration_info
   - Note: ownership structure, key personnel

2. CONTRACT TERMS (finding_type: "contract_terms")
   - Value, duration, payment schedule, key rates
   - Include in extracted_data: total_value, duration, payment_terms, key_rates, type (fixed/cost-plus)
   - Note: unusual terms, milestone payments

3. PRICING ANALYSIS (finding_type: "pricing_analysis")
   - Cost breakdown, unit rates, comparison to market
   - Include in extracted_data: item, proposed_rate, market_rate, variance_percent, benchmark_source
   - Note: overhead, profit margins, labor vs. materials

4. BID PROCESS FINDING (finding_type: "bid_process")
   - Competition level, bidders, evaluation criteria
   - Include in extracted_data: bid_count, bidder_names, award_basis, competition_type
   - Note: sole-source justifications, bid rotation patterns

5. SUSPICIOUS ELEMENT (finding_type: "suspicious_element") - HIGH PRIORITY
   - Unusual terms, sweetheart deals, conflict indicators
   - Include in extracted_data:
     * "element_type": type of suspicious activity
     * "description": what was found
     * "severity": "high" | "medium" | "low"
     * "related_parties": who is involved
     * "evidence": supporting facts
   - Examples: related party transactions, revolving door, bid steering

6. CONNECTED ENTITY (finding_type: "connected_entity")
   - Related parties, shell companies, family businesses
   - Include in extracted_data: primary_entity, connected_entity, relationship_type, evidence
   - Note: ownership overlaps, shared addresses, common executives

7. COMPLIANCE ISSUE (finding_type: "compliance_issue")
   - Regulatory violations, missing documentation
   - Include in extracted_data: requirement, status, violation_type, consequence
   - Note: licensing, certifications, insurance, bonding

8. PERFORMANCE ISSUE (finding_type: "performance_issue")
   - Delays, cost overruns, quality problems
   - Include in extracted_data: issue_type, original_value, actual_value, variance, cause
   - Note: pattern across multiple contracts

9. COMPARABLE CONTRACT (finding_type: "comparable_contract")
   - Similar contracts for benchmarking
   - Include in extracted_data: contract_id, agency, vendor, value, scope, outcome
   - Note: price per unit/sq ft/hour comparisons

10. RED FLAG (finding_type: "red_flag") - CRITICAL
    - Strong corruption or fraud indicators
    - Include in extracted_data:
      * "flag_type": category of red flag
      * "description": specific concern
      * "risk_level": "high" | "critical"
      * "supporting_evidence": list of facts
      * "recommended_investigation": next steps
    - Examples: phantom vendors, kickbacks, bid rigging, overbilling

11. GAP (finding_type: "gap")
    - Missing critical information needed
    - Include in extracted_data: information_needed, importance (high/medium/low), impact_on_analysis
    - Note: what documents/data would help investigation

12. DATE/TIMELINE (finding_type: "date_timeline")
    - Important dates and timeline inconsistencies
    - Include in extracted_data: event, date, significance, related_events
    - Note: contract award before bid deadline, rushed timelines

For each finding, return:
- finding_type: One of the types above
- content: Detailed finding with specific facts, numbers, names
- summary: One sentence summary
- confidence_score: 0.0-1.0 (based on source quality and evidence strength)
- temporal_context: 'past', 'present', 'ongoing', or 'predicted'
- event_date: ISO date if known (YYYY-MM-DD)
- date_referenced: Specific date mentioned in finding (e.g., "December 15, 2024")
- date_range: Date range if applicable (e.g., "Q4 2024", "2023-2025")
- extracted_data: JSON object with structured data specific to finding type

For "{granularity}" depth:
- quick: 8-10 findings focusing on major red flags and pricing
- standard: 15-20 findings with balanced coverage of all areas
- deep: 25-30 comprehensive findings with full investigation support

CRITICAL: Prioritize RED_FLAG and SUSPICIOUS_ELEMENT findings. If you identify
potential fraud indicators, ensure they are captured even if confidence is moderate.
False negatives (missing fraud) are worse than false positives (flagging non-issues).

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
                        "event_date": f.get("event_date"),
                        "date_referenced": f.get("date_referenced"),
                        "date_range": f.get("date_range"),
                        "extracted_data": f.get("extracted_data"),
                    })

        return findings

    # ========== CONTRACT-SPECIFIC REPORT GENERATION ==========

    def get_supported_report_variants(self) -> List[str]:
        """Contract template supports red_flags_summary and pricing_analysis variants."""
        return ["full_report", "executive_summary", "red_flags_summary", "pricing_analysis"]

    def generate_red_flags_summary(
        self,
        result: Dict[str, Any],
        title: Optional[str] = None,
    ) -> str:
        """Generate red flags summary report - contract-specific variant.

        This report focuses on corruption indicators, suspicious elements,
        and fraud risk factors identified in the contract analysis.
        """
        from datetime import datetime

        query = result.get("query", "Unknown")
        report_title = title or f"Red Flags Summary: {query[:40]}"

        sections = []
        sections.append(f"# {report_title}")
        sections.append("")
        sections.append(f"**Contract/Subject:** {query}")
        sections.append(f"**Date:** {datetime.now().strftime('%B %d, %Y')}")
        sections.append("")
        sections.append("---")
        sections.append("")

        findings = result.get("findings", [])

        # Critical Red Flags
        red_flags = [f for f in findings if f.get("finding_type") == "red_flag"]
        sections.append("## Critical Red Flags")
        sections.append("")
        if red_flags:
            for rf in red_flags:
                extracted = rf.get("extracted_data", {})
                if extracted and isinstance(extracted, dict):
                    flag_type = extracted.get("flag_type", "Unknown")
                    risk_level = extracted.get("risk_level", "high")
                    sections.append(f"### {flag_type.replace('_', ' ').title()} ({risk_level.upper()} RISK)")
                    sections.append("")
                    sections.append(rf.get("content", ""))
                    sections.append("")
                    evidence = extracted.get("supporting_evidence", [])
                    if evidence:
                        sections.append("**Supporting Evidence:**")
                        for e in evidence[:3]:
                            sections.append(f"- {e}")
                        sections.append("")
                    recommendation = extracted.get("recommended_investigation", "")
                    if recommendation:
                        sections.append(f"**Recommended Investigation:** {recommendation}")
                        sections.append("")
                else:
                    sections.append(f"- **RED FLAG**: {rf.get('summary') or rf.get('content', '')[:150]}")
        else:
            sections.append("No critical red flags identified.")
        sections.append("")

        # Suspicious Elements
        suspicious = [f for f in findings if f.get("finding_type") == "suspicious_element"]
        if suspicious:
            sections.append("## Suspicious Elements")
            sections.append("")
            for se in suspicious:
                extracted = se.get("extracted_data", {})
                if extracted and isinstance(extracted, dict):
                    element_type = extracted.get("element_type", "Unknown")
                    severity = extracted.get("severity", "medium")
                    sections.append(f"- **{element_type.replace('_', ' ').title()}** ({severity}): {se.get('summary', '')}")
                else:
                    sections.append(f"- {se.get('summary') or se.get('content', '')[:100]}")
            sections.append("")

        # Connected Entities (potential conflicts)
        connected = [f for f in findings if f.get("finding_type") == "connected_entity"]
        if connected:
            sections.append("## Connected Entities (Potential Conflicts)")
            sections.append("")
            for ce in connected:
                extracted = ce.get("extracted_data", {})
                if extracted and isinstance(extracted, dict):
                    primary = extracted.get("primary_entity", "Unknown")
                    related = extracted.get("connected_entity", "Unknown")
                    rel_type = extracted.get("relationship_type", "related to")
                    sections.append(f"- **{primary}** {rel_type} **{related}**")
                else:
                    sections.append(f"- {ce.get('summary') or ce.get('content', '')[:100]}")
            sections.append("")

        # Compliance Issues
        compliance = [f for f in findings if f.get("finding_type") == "compliance_issue"]
        if compliance:
            sections.append("## Compliance Issues")
            sections.append("")
            for ci in compliance:
                sections.append(f"- {ci.get('summary') or ci.get('content', '')[:100]}")
            sections.append("")

        # Bid Process Concerns
        bid_issues = [f for f in findings if f.get("finding_type") == "bid_process"]
        if bid_issues:
            sections.append("## Bid Process Concerns")
            sections.append("")
            for bi in bid_issues:
                extracted = bi.get("extracted_data", {})
                if extracted and isinstance(extracted, dict):
                    bid_count = extracted.get("bid_count", "Unknown")
                    competition_type = extracted.get("competition_type", "Unknown")
                    sections.append(f"- **Bids:** {bid_count} | **Competition:** {competition_type}")
                    sections.append(f"  {bi.get('content', '')[:200]}")
                else:
                    sections.append(f"- {bi.get('summary') or bi.get('content', '')[:100]}")
            sections.append("")

        # Risk Assessment from Perspectives
        perspectives = result.get("perspectives", [])
        all_warnings = []
        for p in perspectives:
            all_warnings.extend(p.get("warnings", []))
        if all_warnings:
            sections.append("## Expert Risk Assessment")
            sections.append("")
            for warning in all_warnings[:8]:
                sections.append(f"- {warning}")
            sections.append("")

        # Recommended Investigations
        sections.append("## Recommended Actions")
        sections.append("")
        for p in perspectives:
            recs = p.get("recommendations", [])
            for rec in recs[:2]:
                sections.append(f"- {rec}")
        sections.append("")

        return "\n".join(sections)

    def generate_pricing_analysis(
        self,
        result: Dict[str, Any],
        title: Optional[str] = None,
    ) -> str:
        """Generate pricing analysis report - contract-specific variant.

        This report focuses on pricing comparisons, cost analysis,
        and value-for-money assessment.
        """
        from datetime import datetime

        query = result.get("query", "Unknown")
        report_title = title or f"Pricing Analysis: {query[:40]}"

        sections = []
        sections.append(f"# {report_title}")
        sections.append("")
        sections.append(f"**Contract/Subject:** {query}")
        sections.append(f"**Date:** {datetime.now().strftime('%B %d, %Y')}")
        sections.append("")
        sections.append("---")
        sections.append("")

        findings = result.get("findings", [])

        # Contract Terms Summary
        terms = [f for f in findings if f.get("finding_type") == "contract_terms"]
        if terms:
            sections.append("## Contract Terms")
            sections.append("")
            for t in terms:
                extracted = t.get("extracted_data", {})
                if extracted and isinstance(extracted, dict):
                    value = extracted.get("total_value", "Unknown")
                    duration = extracted.get("duration", "Unknown")
                    contract_type = extracted.get("type", "Unknown")
                    sections.append(f"- **Total Value:** ${value:,}" if isinstance(value, (int, float)) else f"- **Total Value:** {value}")
                    sections.append(f"- **Duration:** {duration}")
                    sections.append(f"- **Contract Type:** {contract_type}")
                else:
                    sections.append(f"- {t.get('content', '')[:200]}")
            sections.append("")

        # Pricing Analysis Details
        pricing = [f for f in findings if f.get("finding_type") == "pricing_analysis"]
        if pricing:
            sections.append("## Pricing Comparison")
            sections.append("")
            sections.append("| Item | Proposed Rate | Market Rate | Variance |")
            sections.append("|------|--------------|-------------|----------|")
            for p in pricing:
                extracted = p.get("extracted_data", {})
                if extracted and isinstance(extracted, dict):
                    item = extracted.get("item", "Unknown")
                    proposed = extracted.get("proposed_rate", "N/A")
                    market = extracted.get("market_rate", "N/A")
                    variance = extracted.get("variance_percent", "N/A")
                    sections.append(f"| {item} | {proposed} | {market} | {variance}% |")
                else:
                    sections.append(f"- {p.get('summary') or p.get('content', '')[:100]}")
            sections.append("")

        # Comparable Contracts
        comparables = [f for f in findings if f.get("finding_type") == "comparable_contract"]
        if comparables:
            sections.append("## Comparable Contracts")
            sections.append("")
            for c in comparables:
                extracted = c.get("extracted_data", {})
                if extracted and isinstance(extracted, dict):
                    agency = extracted.get("agency", "Unknown")
                    vendor = extracted.get("vendor", "Unknown")
                    value = extracted.get("value", "Unknown")
                    sections.append(f"- **{agency}** with {vendor}: ${value:,}" if isinstance(value, (int, float)) else f"- **{agency}** with {vendor}: {value}")
                else:
                    sections.append(f"- {c.get('summary') or c.get('content', '')[:100]}")
            sections.append("")

        # Performance Issues (cost overruns)
        performance = [f for f in findings if f.get("finding_type") == "performance_issue"]
        if performance:
            sections.append("## Historical Performance Issues")
            sections.append("")
            for perf in performance:
                extracted = perf.get("extracted_data", {})
                if extracted and isinstance(extracted, dict):
                    issue_type = extracted.get("issue_type", "Unknown")
                    variance = extracted.get("variance", "Unknown")
                    sections.append(f"- **{issue_type.replace('_', ' ').title()}**: {variance} variance")
                else:
                    sections.append(f"- {perf.get('summary') or perf.get('content', '')[:100]}")
            sections.append("")

        # Industry Benchmarking Perspective
        perspectives = result.get("perspectives", [])
        benchmarker = next((p for p in perspectives if "benchmark" in p.get("perspective_type", "").lower()), None)
        if benchmarker:
            sections.append("## Industry Benchmarking Analysis")
            sections.append("")
            sections.append(benchmarker.get("analysis_text", "")[:500])
            sections.append("")

        # Value Assessment
        sections.append("## Value Assessment")
        sections.append("")
        auditor = next((p for p in perspectives if "auditor" in p.get("perspective_type", "").lower()), None)
        if auditor:
            insights = auditor.get("key_insights", [])
            for insight in insights[:4]:
                sections.append(f"- {insight}")
        sections.append("")

        return "\n".join(sections)

    def _get_priority_findings(self, findings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Contract template prioritizes red flags and suspicious elements first."""
        # Priority order for contract findings
        priority_types = ["red_flag", "suspicious_element", "compliance_issue", "pricing_analysis", "connected_entity"]
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
        """Group findings with contract-specific priority order."""
        # Order emphasizes risk and fraud indicators
        order = ["red_flag", "suspicious_element", "connected_entity", "compliance_issue",
                 "pricing_analysis", "bid_process", "contract_terms", "performance_issue",
                 "comparable_contract", "contract_entity", "date_timeline", "gap"]
        grouped: Dict[str, List[Dict[str, Any]]] = {}

        for ftype in order:
            type_findings = [f for f in findings if f.get("finding_type") == ftype]
            if type_findings:
                grouped[ftype] = type_findings

        # Add any remaining types not in order
        for f in findings:
            ftype = f.get("finding_type", "other")
            if ftype not in grouped:
                if ftype not in grouped:
                    grouped[ftype] = []
                grouped[ftype].append(f)

        return grouped

    def _generate_report_header(self, result: Dict[str, Any]) -> str:
        """Generate contract-specific header with risk summary."""
        findings = result.get("findings", [])

        red_flags = len([f for f in findings if f.get("finding_type") == "red_flag"])
        suspicious = len([f for f in findings if f.get("finding_type") == "suspicious_element"])
        compliance = len([f for f in findings if f.get("finding_type") == "compliance_issue"])

        if red_flags > 0 or suspicious > 0:
            risk_level = "HIGH" if red_flags >= 2 else "MEDIUM" if red_flags >= 1 or suspicious >= 2 else "LOW"
            return f"""## Risk Summary

**Overall Risk Level:** {risk_level}

- **Critical Red Flags:** {red_flags}
- **Suspicious Elements:** {suspicious}
- **Compliance Issues:** {compliance}"""
        return ""

    def _generate_key_sections(self, result: Dict[str, Any]) -> str:
        """Generate contract-specific key sections: Red Flags Summary, Pricing Overview."""
        findings = result.get("findings", [])
        sections = []

        # Red Flags Summary
        red_flags = [f for f in findings if f.get("finding_type") == "red_flag"]
        if red_flags:
            sections.append("## Red Flags Summary")
            sections.append("")
            for rf in red_flags[:5]:
                extracted = rf.get("extracted_data", {})
                if extracted and isinstance(extracted, dict):
                    flag_type = extracted.get("flag_type", "Unknown")
                    risk_level = extracted.get("risk_level", "high")
                    sections.append(f"- **[{risk_level.upper()}]** {flag_type.replace('_', ' ').title()}: {rf.get('summary', '')}")
                else:
                    sections.append(f"- {rf.get('summary') or rf.get('content', '')[:100]}")
            sections.append("")

        # Pricing Overview
        pricing = [f for f in findings if f.get("finding_type") == "pricing_analysis"]
        if pricing:
            sections.append("## Pricing Overview")
            sections.append("")
            for p in pricing[:4]:
                sections.append(f"- {p.get('summary') or p.get('content', '')[:100]}")
            sections.append("")

        return "\n".join(sections)

    def _generate_executive_highlights(self, result: Dict[str, Any]) -> str:
        """Generate contract-specific executive highlights focusing on risk."""
        findings = result.get("findings", [])
        sections = []

        # Risk indicators
        red_flags = [f for f in findings if f.get("finding_type") == "red_flag"]
        suspicious = [f for f in findings if f.get("finding_type") == "suspicious_element"]

        if red_flags or suspicious:
            sections.append("## Risk Indicators")
            sections.append("")
            for rf in red_flags[:3]:
                sections.append(f"- **RED FLAG**: {rf.get('summary') or rf.get('content', '')[:80]}")
            for se in suspicious[:2]:
                sections.append(f"- **SUSPICIOUS**: {se.get('summary') or se.get('content', '')[:80]}")
            sections.append("")

        return "\n".join(sections)
