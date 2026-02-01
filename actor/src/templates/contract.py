"""Contract analysis template for government contracts, pricing, and corruption detection."""

from typing import List, Dict, Any, Optional
from datetime import datetime

from .base import BaseTemplate, TemplateConfig, FindingTypeConfig, FindingType
from ..services.report_components import (
    ComponentType, ReportHints
)


# ========== FINDING TYPE ENUM ==========

class ContractFindingType(FindingType):
    """Valid finding types for contract analysis research."""
    CONTRACT_ENTITY = "contract_entity"
    CONTRACT_TERMS = "contract_terms"
    PRICING_ANALYSIS = "pricing_analysis"
    BID_PROCESS = "bid_process"
    SUSPICIOUS_ELEMENT = "suspicious_element"
    CONNECTED_ENTITY = "connected_entity"
    COMPLIANCE_ISSUE = "compliance_issue"
    PERFORMANCE_ISSUE = "performance_issue"
    COMPARABLE_CONTRACT = "comparable_contract"
    RED_FLAG = "red_flag"
    GAP = "gap"
    DATE_TIMELINE = "date_timeline"


# ========== TEMPLATE CONFIGURATION ==========

CONTRACT_CONFIG = TemplateConfig(
    search_intro="You are a government contract analyst and fraud investigator planning research queries to analyze contracts for overpricing, corruption risks, and suspicious elements.",
    search_angles=[
        {
            "name": "VENDOR/CONTRACTOR BACKGROUND",
            "items": [
                "Company registration, incorporation date, ownership history",
                "Key executives and beneficial owners",
                "Prior government contracts with this vendor",
                "Complaints, lawsuits, debarment history",
                "Related companies, subsidiaries, DBAs",
                "Political donations by company or executives",
            ]
        },
        {
            "name": "PRICING BENCHMARK RESEARCH",
            "items": [
                "Industry standard rates for similar work/services",
                "Government rate schedules (GSA schedules for federal)",
                "Comparable contracts in same sector/region",
                "Unit pricing for common line items",
                "Labor rate comparisons (prevailing wage data)",
                "Material cost benchmarks",
            ]
        },
        {
            "name": "BID PROCESS AND COMPETITION",
            "items": [
                "Other bidders on this contract (if public)",
                "Similar recent solicitations for comparison",
                "Sole-source justification patterns",
                "Bid protest history",
                "Procurement officer history and patterns",
            ]
        },
        {
            "name": "CONTRACT MODIFICATIONS AND OVERRUNS",
            "items": [
                "Change order patterns on similar contracts",
                "Amendment and modification history",
                "Cost overrun statistics in sector",
                "Schedule extension patterns",
                "Scope creep indicators",
            ]
        },
        {
            "name": "VENDOR PERFORMANCE HISTORY",
            "items": [
                "Past performance evaluations (PPIRS for federal)",
                "Completed projects: on-time, on-budget?",
                "Quality issues, defects, rework",
                "Customer complaints and disputes",
                "Warranty claims and callbacks",
            ]
        },
        {
            "name": "CONNECTED ENTITIES AND CONFLICTS",
            "items": [
                "Subcontractor relationships",
                "Joint venture partners",
                "Related party transactions",
                "Revolving door: former officials now at vendor",
                "Family connections to agency staff",
                "Shell company indicators",
            ]
        },
        {
            "name": "REGULATORY AND COMPLIANCE",
            "items": [
                "Required certifications/licenses",
                "Small business set-aside compliance",
                "DBE/MBE/WBE certification verification",
                "Insurance and bonding requirements",
                "DCAA audit findings (federal)",
            ]
        },
        {
            "name": "NEWS AND INVESTIGATIONS",
            "items": [
                "Media coverage of vendor or contract",
                "Inspector General reports",
                "GAO/state auditor findings",
                "Whistleblower complaints",
                "FBI/DOJ investigations in sector",
            ]
        },
    ],
    search_depth_guidance={
        "quick": "Focus on vendor background + pricing benchmark + news/issues",
        "standard": "Add bid process + performance + connected entities",
        "deep": "All angles with multiple queries per angle, deep ownership research",
    },

    extraction_intro="You are a government contract auditor and fraud investigator extracting findings from research on a contract or contractor. Your goal is to identify red flags, pricing anomalies, and corruption indicators.",
    finding_types=[
        FindingTypeConfig(
            name="contract_entity",
            display_name="Contract Entity",
            description="Key parties: vendor, agency, contracting officer, subcontractors. Note: ownership structure, key personnel.",
            extracted_data_schema='{"entity_name": "...", "entity_type": "...", "role": "...", "registration_info": "..."}',
            analysis_fallback="This entity information provides context for understanding the contract relationships.",
        ),
        FindingTypeConfig(
            name="contract_terms",
            display_name="Contract Terms",
            description="Value, duration, payment schedule, key rates. Note: unusual terms, milestone payments.",
            extracted_data_schema='{"total_value": "...", "duration": "...", "payment_terms": "...", "key_rates": "...", "type": "fixed/cost-plus"}',
            analysis_fallback="These contract terms should be evaluated against industry standards and benchmarks.",
        ),
        FindingTypeConfig(
            name="pricing_analysis",
            display_name="Pricing Analysis",
            description="Cost breakdown, unit rates, comparison to market. Note: overhead, profit margins, labor vs. materials.",
            extracted_data_schema='{"item": "...", "proposed_rate": "...", "market_rate": "...", "variance_percent": "...", "benchmark_source": "..."}',
            analysis_fallback="This pricing analysis helps assess whether contract rates are reasonable and competitive.",
        ),
        FindingTypeConfig(
            name="bid_process",
            display_name="Bid Process Finding",
            description="Competition level, bidders, evaluation criteria. Note: sole-source justifications, bid rotation patterns.",
            extracted_data_schema='{"bid_count": "...", "bidder_names": [...], "award_basis": "...", "competition_type": "..."}',
            analysis_fallback="The bid process findings reveal the level of competition and potential procurement concerns.",
        ),
        FindingTypeConfig(
            name="suspicious_element",
            display_name="Suspicious Element",
            description="Unusual terms, sweetheart deals, conflict indicators. Examples: related party transactions, revolving door, bid steering.",
            extracted_data_schema='{"element_type": "...", "description": "...", "severity": "high/medium/low", "related_parties": [...], "evidence": "..."}',
            analysis_fallback="This suspicious element warrants further investigation to assess potential impropriety.",
        ),
        FindingTypeConfig(
            name="connected_entity",
            display_name="Connected Entity",
            description="Related parties, shell companies, family businesses. Note: ownership overlaps, shared addresses, common executives.",
            extracted_data_schema='{"primary_entity": "...", "connected_entity": "...", "relationship_type": "...", "evidence": "..."}',
            analysis_fallback="This connection between entities may indicate conflicts of interest or coordinated activity.",
        ),
        FindingTypeConfig(
            name="compliance_issue",
            display_name="Compliance Issue",
            description="Regulatory violations, missing documentation. Note: licensing, certifications, insurance, bonding.",
            extracted_data_schema='{"requirement": "...", "status": "...", "violation_type": "...", "consequence": "..."}',
            analysis_fallback="This compliance issue may affect contract validity or create legal exposure.",
        ),
        FindingTypeConfig(
            name="performance_issue",
            display_name="Performance Issue",
            description="Delays, cost overruns, quality problems. Note: pattern across multiple contracts.",
            extracted_data_schema='{"issue_type": "...", "original_value": "...", "actual_value": "...", "variance": "...", "cause": "..."}',
            analysis_fallback="This performance issue indicates potential problems with contractor capability or management.",
        ),
        FindingTypeConfig(
            name="comparable_contract",
            display_name="Comparable Contract",
            description="Similar contracts for benchmarking. Note: price per unit/sq ft/hour comparisons.",
            extracted_data_schema='{"contract_id": "...", "agency": "...", "vendor": "...", "value": "...", "scope": "...", "outcome": "..."}',
            analysis_fallback="This comparable contract provides a benchmark for evaluating pricing and terms.",
        ),
        FindingTypeConfig(
            name="red_flag",
            display_name="Red Flag",
            description="Strong corruption or fraud indicators. Examples: phantom vendors, kickbacks, bid rigging, overbilling.",
            extracted_data_schema='{"flag_type": "...", "description": "...", "risk_level": "high/critical", "supporting_evidence": [...], "recommended_investigation": "..."}',
            analysis_fallback="This red flag indicates potential fraud or corruption that requires immediate attention.",
        ),
        FindingTypeConfig(
            name="gap",
            display_name="Gap",
            description="Missing critical information needed. Note: what documents/data would help investigation.",
            extracted_data_schema='{"information_needed": "...", "importance": "high/medium/low", "impact_on_analysis": "..."}',
            analysis_fallback="This information gap limits the completeness of the analysis and should be addressed.",
        ),
        FindingTypeConfig(
            name="date_timeline",
            display_name="Date/Timeline",
            description="Important dates and timeline inconsistencies. Note: contract award before bid deadline, rushed timelines.",
            extracted_data_schema='{"event": "...", "date": "...", "significance": "...", "related_events": [...]}',
            analysis_fallback="This timeline information helps understand the sequence of events and identify anomalies.",
        ),
    ],
    analysis_instruction="""YOUR EXPERT INVESTIGATIVE ANALYSIS (REQUIRED - 2-4 sentences) explaining:
  * WHY this finding is significant for contract oversight or fraud detection
  * What PATTERN or RED FLAG this represents in government contracting
  * How this COMPARES to normal contracting practices or known fraud schemes
  * What FURTHER INVESTIGATION or action this finding warrants""",
    extraction_guidelines="""CRITICAL: The "analysis" field must provide substantive investigative reasoning, not just describe the finding.
Good example: "This 40% price premium over market rate is a significant red flag in competitive bid environments. In similar cases, inflated pricing of this magnitude has been associated with kickback schemes where the excess margin funds illicit payments. The fact that this vendor has previously worked with the contracting officer warrants examination of their relationship and any campaign contributions or post-employment arrangements."

CRITICAL: Prioritize RED_FLAG and SUSPICIOUS_ELEMENT findings. If you identify
potential fraud indicators, ensure they are captured even if confidence is moderate.
False negatives (missing fraud) are worse than false positives (flagging non-issues).""",

    priority_finding_types=["red_flag", "suspicious_element", "compliance_issue", "pricing_analysis", "connected_entity"],
    grouping_order=["red_flag", "suspicious_element", "connected_entity", "compliance_issue", "pricing_analysis", "bid_process", "contract_terms", "performance_issue", "comparable_contract", "contract_entity", "date_timeline", "gap"],
)


class ContractTemplate(BaseTemplate):
    """Template for government contract evaluation and corruption detection."""

    template_id = "contract"
    template_name = "Government Contract Analysis"
    description = "Analyze state/government contracts for overpricing, corruption, and suspicious elements"

    # Data-driven configuration
    config = CONTRACT_CONFIG

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

    def get_supported_report_variants(self) -> List[str]:
        """Contract template supports red_flags_summary and pricing_analysis variants."""
        return ["full_report", "executive_summary", "red_flags_summary", "pricing_analysis"]

    def generate_red_flags_summary(
        self,
        result: Dict[str, Any],
        title: Optional[str] = None,
    ) -> str:
        """Generate red flags summary report - contract-specific variant."""
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
        """Generate pricing analysis report - contract-specific variant."""
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
