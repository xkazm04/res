"""Contract analysis template for government contracts, pricing, and corruption detection."""

from typing import List, Dict, Any

from .base import BaseTemplate


class ContractTemplate(BaseTemplate):
    """Template for government contract evaluation and corruption detection."""

    template_id = "contract"
    template_name = "Government Contract Analysis"
    description = "Analyze state/government contracts for overpricing, corruption, and suspicious elements"

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
