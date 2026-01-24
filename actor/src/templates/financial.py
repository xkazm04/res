"""Financial analysis research template."""

from typing import List, Dict, Any, Optional

from .base import BaseTemplate
from ..services.report_components import (
    ComponentType, ComponentConfig, ReportHints, get_report_hints
)


class FinancialTemplate(BaseTemplate):
    """Template for financial and stock analysis research."""

    template_id = "financial"
    template_name = "Financial Analysis"
    description = "Stock and financial analysis for investment research"

    # Report hints for component-based rendering
    report_hints = ReportHints(
        template_type="financial",
        structure="quantitative_first",
        findings_grouping="sentiment",
        tone="analytical",
        decision_format="thesis",
        emphasis=["valuation", "risk_assessment", "financial_metrics"],
        required_components=[
            ComponentType.INVESTMENT_THESIS,
            ComponentType.METRIC_CARDS,
            ComponentType.RISK_MATRIX,
        ],
        optional_components=[
            ComponentType.FINDINGS_TABLE,
            ComponentType.PREDICTION_CARDS,
            ComponentType.COMPARISON_TABLE,
            ComponentType.CONFIDENCE_GAUGE,
        ],
        visualization_preference=["financial_metrics", "risk_matrix", "peer_comparison"],
        custom_sections={
            "show_bull_bear_cases": True,
            "price_targets": True,
            "risk_factors_prominent": True,
        }
    )

    # Expert perspectives for deep financial analysis
    default_perspectives = [
        "institutional_investor",   # Long-term value creation, moats, management
        "short_seller",             # Red flags, fraud detection, skeptical analysis
        "quantitative_risk",        # Tail risks, stress testing, correlations
        "activist_investor",        # Value creation levers, governance, catalysts
        "macro_strategist",         # Economic cycles, policy risks, global context
    ]

    default_max_searches = 8

    # Financial analysis needs rigorous verification
    # Analysts have conflicts, numbers must be verified, projections questioned
    verification_config = {
        "cross_reference": "thorough",      # Verify financial numbers across sources
        "bias_detection": "thorough",       # Analyst conflicts, investment banking ties
        "expert_sanity_check": "thorough",  # Flag unrealistic valuations/projections
        "source_quality": "standard",       # SEC filings are reliable, analyst reports vary
    }

    async def generate_search_queries(
        self,
        query: str,
        max_searches: int,
        granularity: str = "standard",
    ) -> List[str]:
        """Generate financial analysis search queries."""
        prompt = f"""
You are a financial analyst planning comprehensive research for investment analysis.

Research Topic: {query}

Depth Level: {granularity}

Generate search queries covering these financial analysis angles:

1. EARNINGS AND FUNDAMENTALS
   - Recent quarterly and annual earnings reports
   - Revenue trends, margins, profitability metrics
   - Earnings beats/misses, guidance changes
   - Balance sheet strength, cash flow analysis

2. ANALYST COVERAGE
   - Wall Street analyst ratings and price targets
   - Buy/hold/sell recommendations
   - Earnings estimates and revisions
   - Recent analyst upgrades/downgrades

3. MARKET POSITION
   - Competitive landscape and market share
   - Industry trends and tailwinds/headwinds
   - Customer concentration and diversification
   - Geographic revenue breakdown

4. RISK FACTORS
   - Regulatory and compliance risks
   - Macro economic exposure
   - Supply chain dependencies
   - Legal and litigation issues

5. VALUATION
   - Current valuation multiples (P/E, EV/EBITDA, P/S)
   - Historical valuation ranges
   - Peer comparison valuations
   - DCF and fair value estimates

6. NEWS AND CATALYSTS
   - Recent company announcements
   - Product launches, partnerships, M&A
   - Management changes, insider transactions
   - Upcoming events (earnings, conferences)

7. ECOSYSTEM ANALYSIS (Upstream/Downstream)
   - Top customers: Who are the biggest buyers? What's their spending outlook?
   - Key suppliers: Any dependencies that could become vulnerabilities?
   - Competitors: Who is gaining/losing share? Any disruptive threats?
   - Adjacent markets: What related trends could impact this company?

For a "{granularity}" depth level:
- "quick": 4-5 searches on key fundamentals and analyst sentiment
- "standard": 8-10 searches covering all areas
- "deep": 12+ searches with comprehensive coverage including technicals

Return a JSON array of exactly {max_searches} search query strings, ordered by importance.
Example: ["NVIDIA Q4 2025 earnings analysis", "NVIDIA stock analyst ratings price target 2025", ...]
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
        """Extract financial findings with component-aligned types."""
        # Build source context
        source_context = "\n\n".join([
            f"Source: {s.get('title', 'Unknown')} ({s.get('url', '')})\n"
            f"Credibility: {s.get('credibility_score', 'Unknown')}\n"
            f"Domain: {s.get('domain', '')}"
            for s in sources[:20]
        ])

        prompt = f"""
You are a financial analyst extracting key findings for investment research.
CRITICAL: Use EXACT finding_type values specified below - they map to UI components.

Research Topic: {query}

Synthesized Research Content:
{synthesized_content[:15000]}

Sources Referenced:
{source_context}

=== USE ONLY THESE finding_type VALUES ===

1. BULLISH SIGNALS (finding_type: "bullish_signal")
   - Positive earnings surprises, revenue beats, margin expansion
   - Analyst upgrades, price target increases
   - Growth acceleration, market share gains
   - Strong guidance, positive management commentary

2. BEARISH SIGNALS (finding_type: "bearish_signal")
   - Earnings misses, revenue declines, margin compression
   - Analyst downgrades, price target cuts
   - Growth deceleration, market share losses
   - Weak guidance, negative management tone

3. RISK FACTORS (finding_type: "risk")
   - Business, market, regulatory, competitive risks
   - Debt concerns, liquidity issues, concentration risks
   - Key person dependencies, governance issues

4. RED FLAGS (finding_type: "red_flag")
   - Accounting irregularities, restatements
   - Insider selling, executive departures
   - SEC investigations, legal issues, guidance cuts

5. FINANCIAL METRICS (finding_type: "financial_metric")
   - Revenue, EPS, margins with specific numbers
   - Valuation multiples (P/E, EV/EBITDA)
   - Price targets with analyst attribution

6. PREDICTIONS (finding_type: "prediction")
   - Forward guidance, analyst forecasts
   - Industry trend predictions

=== STRICT JSON OUTPUT FORMAT ===

Return JSON array with EXACT structure. CRITICAL: Include "analysis" field with YOUR analytical commentary.
[
  {{
    "finding_type": "bullish_signal",
    "summary": "NVIDIA data center revenue surged 409% YoY to $18.4B",
    "content": "Detailed explanation with numbers, dates, sources...",
    "analysis": "This exceptional growth rate significantly outpaces the broader semiconductor industry. The data center segment now represents 78% of total revenue, validating the AI infrastructure investment thesis. However, maintaining such growth rates will be increasingly difficult as the base grows larger.",
    "confidence_score": 0.95,
    "date_referenced": "Q3 FY2024",
    "extracted_data": {{"metric": "Data Center Revenue", "value": "$18.4B", "change": "+409% YoY"}}
  }},
  {{
    "finding_type": "risk",
    "summary": "China export restrictions pose 20-25% revenue risk",
    "content": "US government export controls on AI chips...",
    "analysis": "This is a structural headwind that could persist for years. While NVIDIA has developed compliant alternatives, ASPs are lower. Investors should model a 15-20% China revenue haircut as the new normal rather than expecting policy relaxation.",
    "confidence_score": 0.85,
    "date_referenced": "2024",
    "extracted_data": {{"risk_type": "regulatory", "severity": "high"}}
  }},
  {{
    "finding_type": "financial_metric",
    "summary": "Morgan Stanley: Overweight rating, $180 target",
    "content": "Morgan Stanley analyst Joseph Moore...",
    "analysis": "This price target implies ~25% upside from current levels. Morgan Stanley has historically been accurate on semiconductor calls. Their thesis centers on continued hyperscaler CapEx expansion, which aligns with recent guidance from major cloud providers.",
    "confidence_score": 0.90,
    "date_referenced": "January 2025",
    "extracted_data": {{"analyst": "Morgan Stanley", "rating": "Overweight", "target_price": "$180"}}
  }}
]

IMPORTANT: The "analysis" field should contain YOUR expert analytical commentary explaining:
- Why this finding matters for the investment thesis
- What it implies for the future
- Any caveats or nuances investors should consider

Extract 8-15 findings covering bullish_signal, bearish_signal, risk, red_flag, financial_metric, prediction.
Return ONLY the JSON array.
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
                        "analysis": f.get("analysis", ""),  # LLM's analytical commentary
                        "confidence_score": f.get("confidence_score", 0.5),
                        "temporal_context": f.get("temporal_context", "present"),
                        "date_referenced": f.get("date_referenced", ""),
                        "extracted_data": f.get("extracted_data"),
                    })

        return findings

    # ========== FINANCIAL-SPECIFIC REPORT GENERATION ==========

    def get_supported_report_variants(self) -> List[str]:
        """Financial template supports investment_thesis variant."""
        return ["full_report", "executive_summary", "investment_thesis"]

    def generate_investment_thesis(
        self,
        result: Dict[str, Any],
        title: Optional[str] = None,
    ) -> str:
        """Generate investment thesis report - financial-specific variant."""
        from datetime import datetime

        query = result.get("query", "Unknown")
        report_title = title or f"Investment Thesis: {query[:40]}"

        sections = []
        sections.append(f"# {report_title}")
        sections.append("")
        sections.append(f"**Subject:** {query}")
        sections.append(f"**Date:** {datetime.now().strftime('%B %d, %Y')}")
        sections.append("")
        sections.append("---")
        sections.append("")

        # Thesis summary
        sections.append("## Investment Thesis")
        sections.append("")

        # Extract valuation perspective
        perspectives = result.get("perspectives", [])
        valuation = next((p for p in perspectives if "valuation" in p.get("perspective_type", "").lower()), None)
        investor = next((p for p in perspectives if "investor" in p.get("perspective_type", "").lower()), None)

        if valuation:
            sections.append(valuation.get("analysis_text", ""))
            sections.append("")
        elif investor:
            sections.append(investor.get("analysis_text", ""))
            sections.append("")

        # Bull case
        sections.append("## Bull Case")
        sections.append("")
        findings = result.get("findings", [])
        positive = [f for f in findings if f.get("confidence_score", 0) >= 0.7]
        for f in positive[:5]:
            sections.append(f"- {f.get('summary') or f.get('content', '')[:100]}")
        sections.append("")

        # Bear case
        sections.append("## Bear Case / Risks")
        sections.append("")
        risks = [f for f in findings if f.get("finding_type") in ["pattern", "gap", "risk"]]
        if not risks:
            risks = [f for f in findings if f.get("confidence_score", 0) < 0.6]
        for f in risks[:5]:
            sections.append(f"- {f.get('summary') or f.get('content', '')[:100]}")
        sections.append("")

        # Key metrics
        metrics = [f for f in findings if f.get("finding_type") == "fact"]
        if metrics:
            sections.append("## Key Financial Metrics")
            sections.append("")
            for m in metrics[:8]:
                extracted = m.get("extracted_data", {})
                if extracted and isinstance(extracted, dict):
                    metric = extracted.get("metric", "")
                    value = extracted.get("value", "")
                    if metric and value:
                        sections.append(f"- **{metric}:** {value}")
                else:
                    sections.append(f"- {m.get('summary') or m.get('content', '')[:80]}")
            sections.append("")

        # Recommendations
        sections.append("## Recommendations")
        sections.append("")
        for p in perspectives:
            recs = p.get("recommendations", [])
            for rec in recs[:2]:
                sections.append(f"- {rec}")
        sections.append("")

        # Warnings
        all_warnings = []
        for p in perspectives:
            all_warnings.extend(p.get("warnings", []))
        if all_warnings:
            sections.append("## Risk Warnings")
            sections.append("")
            for warning in all_warnings[:5]:
                sections.append(f"- {warning}")
            sections.append("")

        return "\n".join(sections)

    def _get_priority_findings(self, findings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Financial template prioritizes facts and evidence with high confidence."""
        # Prioritize financial metrics and evidence
        priority_types = ["fact", "evidence", "prediction"]
        prioritized = []

        for ftype in priority_types:
            type_findings = [f for f in findings if f.get("finding_type") == ftype]
            prioritized.extend(sorted(
                type_findings,
                key=lambda x: x.get("confidence_score", 0),
                reverse=True
            ))

        # Add remaining high-confidence findings
        remaining = [f for f in findings if f not in prioritized and f.get("confidence_score", 0) >= 0.6]
        prioritized.extend(sorted(remaining, key=lambda x: x.get("confidence_score", 0), reverse=True))

        return prioritized

    def _generate_key_sections(self, result: Dict[str, Any]) -> str:
        """Generate financial-specific key sections: Bull/Bear case summary."""
        findings = result.get("findings", [])
        sections = []

        # Valuation Summary
        valuations = [f for f in findings if f.get("finding_type") == "evidence"
                      and "valuation" in f.get("content", "").lower()]
        if valuations:
            sections.append("## Valuation Summary")
            sections.append("")
            for v in valuations[:3]:
                sections.append(f"- {v.get('summary') or v.get('content', '')[:100]}")
            sections.append("")

        # Risk Factors Summary
        risks = [f for f in findings if f.get("finding_type") in ["pattern", "gap"]]
        if risks:
            sections.append("## Key Risk Factors")
            sections.append("")
            for r in risks[:4]:
                sections.append(f"- {r.get('summary') or r.get('content', '')[:100]}")
            sections.append("")

        return "\n".join(sections)

    def _generate_executive_highlights(self, result: Dict[str, Any]) -> str:
        """Generate financial-specific executive highlights."""
        findings = result.get("findings", [])
        sections = []

        # Key metrics highlight
        metrics = [f for f in findings if f.get("finding_type") == "fact"]
        if metrics:
            sections.append("## Key Metrics")
            sections.append("")
            for m in metrics[:4]:
                sections.append(f"- {m.get('summary') or m.get('content', '')[:100]}")
            sections.append("")

        return "\n".join(sections)

    def generate_kill_criteria(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Extract kill criteria - specific signals that would invalidate the investment thesis.

        Returns dict with:
        - criteria: List of specific, measurable exit signals
        - monitoring_items: What to watch for each criterion
        - severity: How quickly to act if triggered
        """
        findings = result.get("findings", [])
        perspectives = result.get("perspectives", [])

        # Default kill criteria structure
        kill_criteria = {
            "criteria": [],
            "summary": "Exit or reverse position if any of these conditions materialize",
            "update_frequency": "Review weekly, act immediately on major triggers"
        }

        # Extract from risk findings
        risks = [f for f in findings if f.get("finding_type") in ["risk", "red_flag", "bearish_signal"]]
        for risk in risks[:5]:
            content = risk.get("content", "")
            summary = risk.get("summary", "")

            # Create kill criterion from risk
            criterion = {
                "trigger": summary[:100] if summary else content[:100],
                "threshold": "Significant deterioration from current levels",
                "action": "Reduce position by 50% immediately, exit fully if trend continues",
                "monitoring": "Track in earnings reports and news flow",
                "severity": "high" if risk.get("confidence_score", 0) > 0.8 else "medium"
            }
            kill_criteria["criteria"].append(criterion)

        # Extract from short seller perspective warnings
        short_seller = next((p for p in perspectives if "short" in p.get("perspective_type", "").lower()), None)
        if short_seller:
            for warning in short_seller.get("warnings", [])[:3]:
                criterion = {
                    "trigger": warning[:100],
                    "threshold": "Evidence of materialization",
                    "action": "Exit position",
                    "monitoring": "Track via SEC filings and investigative reporting",
                    "severity": "critical"
                }
                kill_criteria["criteria"].append(criterion)

        # Add standard financial kill criteria if not enough specific ones
        if len(kill_criteria["criteria"]) < 3:
            standard_criteria = [
                {
                    "trigger": "Revenue growth decelerates to below industry average",
                    "threshold": "<10% YoY growth for 2 consecutive quarters",
                    "action": "Reduce position, reassess thesis",
                    "monitoring": "Quarterly earnings reports",
                    "severity": "high"
                },
                {
                    "trigger": "Gross margin compression beyond guidance",
                    "threshold": ">500bps decline from peak margins",
                    "action": "Exit 50% of position",
                    "monitoring": "Quarterly earnings, competitive pricing data",
                    "severity": "high"
                },
                {
                    "trigger": "Key customer concentration increases or major customer loss",
                    "threshold": "Top customer >40% of revenue OR loss of top-5 customer",
                    "action": "Reassess position size, consider hedging",
                    "monitoring": "10-K filings, customer announcements",
                    "severity": "medium"
                }
            ]
            kill_criteria["criteria"].extend(standard_criteria[:3 - len(kill_criteria["criteria"])])

        return kill_criteria

    def generate_ecosystem_analysis(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Generate upstream/downstream ecosystem analysis.

        Returns dict with:
        - customers: Top customers and their outlook
        - competitors: Key competitors and momentum
        - suppliers: Critical dependencies
        - implications: What ecosystem dynamics mean for investment
        """
        findings = result.get("findings", [])
        perspectives = result.get("perspectives", [])

        ecosystem = {
            "customers": [],
            "competitors": [],
            "suppliers": [],
            "implications": []
        }

        # Extract customer/competitor mentions from findings
        for f in findings:
            content = (f.get("content", "") + " " + f.get("summary", "")).lower()

            if any(word in content for word in ["customer", "client", "buyer", "revenue from"]):
                ecosystem["customers"].append({
                    "mention": f.get("summary", f.get("content", ""))[:150],
                    "source": "research_finding"
                })

            if any(word in content for word in ["competitor", "competition", "rival", "market share"]):
                ecosystem["competitors"].append({
                    "mention": f.get("summary", f.get("content", ""))[:150],
                    "source": "research_finding"
                })

            if any(word in content for word in ["supplier", "supply chain", "dependency", "vendor"]):
                ecosystem["suppliers"].append({
                    "mention": f.get("summary", f.get("content", ""))[:150],
                    "source": "research_finding"
                })

        # Generate implications based on ecosystem data
        if ecosystem["customers"]:
            ecosystem["implications"].append(
                f"Customer concentration/health is a key driver. Monitor top customer spending patterns."
            )
        if ecosystem["competitors"]:
            ecosystem["implications"].append(
                f"Competitive dynamics identified. Track market share shifts quarterly."
            )
        if ecosystem["suppliers"]:
            ecosystem["implications"].append(
                f"Supply chain dependencies exist. Monitor for disruption risks."
            )

        return ecosystem
