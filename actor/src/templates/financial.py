"""Financial analysis research template."""

from typing import List, Dict, Any, Optional
from datetime import datetime

from .base import BaseTemplate, TemplateConfig, FindingTypeConfig, FindingType
from ..services.report_components import (
    ComponentType, ReportHints
)


# ========== FINDING TYPE ENUM ==========

class FinancialFindingType(FindingType):
    """Valid finding types for financial analysis research."""
    BULLISH_SIGNAL = "bullish_signal"
    BEARISH_SIGNAL = "bearish_signal"
    RISK = "risk"
    RED_FLAG = "red_flag"
    FINANCIAL_METRIC = "financial_metric"
    PREDICTION = "prediction"


# ========== TEMPLATE CONFIGURATION ==========

FINANCIAL_CONFIG = TemplateConfig(
    search_intro="You are a financial analyst planning comprehensive research for investment analysis.",
    search_angles=[
        {
            "name": "EARNINGS AND FUNDAMENTALS",
            "items": [
                "Recent quarterly and annual earnings reports",
                "Revenue trends, margins, profitability metrics",
                "Earnings beats/misses, guidance changes",
                "Balance sheet strength, cash flow analysis",
            ]
        },
        {
            "name": "ANALYST COVERAGE",
            "items": [
                "Wall Street analyst ratings and price targets",
                "Buy/hold/sell recommendations",
                "Earnings estimates and revisions",
                "Recent analyst upgrades/downgrades",
            ]
        },
        {
            "name": "MARKET POSITION",
            "items": [
                "Competitive landscape and market share",
                "Industry trends and tailwinds/headwinds",
                "Customer concentration and diversification",
                "Geographic revenue breakdown",
            ]
        },
        {
            "name": "RISK FACTORS",
            "items": [
                "Regulatory and compliance risks",
                "Macro economic exposure",
                "Supply chain dependencies",
                "Legal and litigation issues",
            ]
        },
        {
            "name": "VALUATION",
            "items": [
                "Current valuation multiples (P/E, EV/EBITDA, P/S)",
                "Historical valuation ranges",
                "Peer comparison valuations",
                "DCF and fair value estimates",
            ]
        },
        {
            "name": "NEWS AND CATALYSTS",
            "items": [
                "Recent company announcements",
                "Product launches, partnerships, M&A",
                "Management changes, insider transactions",
                "Upcoming events (earnings, conferences)",
            ]
        },
        {
            "name": "ECOSYSTEM ANALYSIS",
            "items": [
                "Top customers: revenue concentration",
                "Competitors: market share comparison",
                "For AI/chip companies: hyperscaler capex spending",
                "Supplier dependencies: supply chain risks",
            ]
        },
        {
            "name": "BEAR CASE RESEARCH",
            "items": [
                "Short seller thesis and bear case risks",
                "Stock overvalued concerns",
                "Contrarian analysis and critiques",
            ]
        },
    ],
    search_depth_guidance={
        "quick": "4-5 searches on key fundamentals and analyst sentiment",
        "standard": "8-10 searches covering all areas INCLUDING ecosystem and bear case",
        "deep": "12+ searches with comprehensive coverage including technicals",
    },

    extraction_intro="You are a financial analyst extracting key findings for investment research. CRITICAL: Use EXACT finding_type values specified below - they map to UI components.",
    finding_types=[
        FindingTypeConfig(
            name="bullish_signal",
            display_name="Bullish Signal",
            description="Positive earnings surprises, revenue beats, margin expansion. Analyst upgrades, price target increases. Growth acceleration, market share gains. Strong guidance, positive management commentary.",
            extracted_data_schema='{"metric": "...", "value": "...", "change": "...", "source": "...", "significance": "high/medium/low"}',
            analysis_fallback="This positive indicator suggests favorable conditions for the investment thesis.",
        ),
        FindingTypeConfig(
            name="bearish_signal",
            display_name="Bearish Signal",
            description="Earnings misses, revenue declines, margin compression. Analyst downgrades, price target cuts. Growth deceleration, market share losses. Weak guidance, negative management tone.",
            extracted_data_schema='{"metric": "...", "value": "...", "change": "...", "source": "...", "significance": "high/medium/low"}',
            analysis_fallback="This concerning signal warrants caution and may indicate downside risk.",
        ),
        FindingTypeConfig(
            name="risk",
            display_name="Risk Factor",
            description="Business, market, regulatory, competitive risks. Debt concerns, liquidity issues, concentration risks. Key person dependencies, governance issues.",
            extracted_data_schema='{"risk_type": "...", "severity": "high/medium/low", "likelihood": "high/medium/low", "mitigation": "..."}',
            analysis_fallback="This risk factor should be monitored as part of ongoing position management.",
        ),
        FindingTypeConfig(
            name="red_flag",
            display_name="Red Flag",
            description="Accounting irregularities, restatements. Insider selling, executive departures. SEC investigations, legal issues, guidance cuts.",
            extracted_data_schema='{"issue": "...", "severity": "critical/high/medium", "evidence": "...", "implications": "..."}',
            analysis_fallback="This red flag requires careful attention and may warrant reducing position size.",
        ),
        FindingTypeConfig(
            name="financial_metric",
            display_name="Financial Metric",
            description="Revenue, EPS, margins with specific numbers. Valuation multiples (P/E, EV/EBITDA). Price targets with analyst attribution.",
            extracted_data_schema='{"metric": "...", "value": "...", "period": "...", "analyst": "...", "rating": "...", "target_price": "..."}',
            analysis_fallback="This metric provides insight into the company's financial health and trajectory.",
        ),
        FindingTypeConfig(
            name="prediction",
            display_name="Prediction",
            description="Forward guidance, analyst forecasts. Industry trend predictions.",
            extracted_data_schema='{"prediction": "...", "source": "...", "timeline": "...", "confidence": "high/medium/low"}',
            analysis_fallback="This forward-looking indicator may help inform investment timing decisions.",
        ),
    ],
    analysis_instruction="""YOUR EXPERT FINANCIAL ANALYSIS (REQUIRED - 2-4 sentences) explaining:
  * Why this finding matters for the investment thesis
  * What it implies for the future
  * Any caveats or nuances investors should consider""",
    extraction_guidelines="""CRITICAL: The "analysis" field must provide substantive reasoning, not just describe the finding.
Good example: "This exceptional growth rate significantly outpaces the broader semiconductor industry. The data center segment now represents 78% of total revenue, validating the AI infrastructure investment thesis. However, maintaining such growth rates will be increasingly difficult as the base grows larger."

IMPORTANT:
- Prioritize verified financial data from SEC filings
- Note analyst conflicts and investment banking relationships
- Be skeptical of overly optimistic projections""",

    priority_finding_types=["bullish_signal", "bearish_signal", "risk", "red_flag", "financial_metric", "prediction"],
    grouping_order=["bullish_signal", "bearish_signal", "financial_metric", "risk", "red_flag", "prediction"],
)


class FinancialTemplate(BaseTemplate):
    """Template for financial and stock analysis research."""

    template_id = "financial"
    template_name = "Financial Analysis"
    description = "Stock and financial analysis for investment research"

    # Data-driven configuration
    config = FINANCIAL_CONFIG

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

    def get_supported_report_variants(self) -> List[str]:
        """Financial template supports investment_thesis variant."""
        return ["full_report", "executive_summary", "investment_thesis"]

    def generate_investment_thesis(
        self,
        result: Dict[str, Any],
        title: Optional[str] = None,
    ) -> str:
        """Generate investment thesis report - financial-specific variant."""
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
        bullish = [f for f in findings if f.get("finding_type") == "bullish_signal"]
        if bullish:
            for f in bullish[:5]:
                sections.append(f"- {f.get('summary') or f.get('content', '')[:100]}")
        else:
            positive = [f for f in findings if f.get("confidence_score", 0) >= 0.7]
            for f in positive[:5]:
                sections.append(f"- {f.get('summary') or f.get('content', '')[:100]}")
        sections.append("")

        # Bear case
        sections.append("## Bear Case / Risks")
        sections.append("")
        bearish = [f for f in findings if f.get("finding_type") in ["bearish_signal", "risk", "red_flag"]]
        if bearish:
            for f in bearish[:5]:
                sections.append(f"- {f.get('summary') or f.get('content', '')[:100]}")
        sections.append("")

        # Key metrics
        metrics = [f for f in findings if f.get("finding_type") == "financial_metric"]
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

    def _generate_key_sections(self, result: Dict[str, Any]) -> str:
        """Generate financial-specific key sections: Bull/Bear case summary."""
        findings = result.get("findings", [])
        sections = []

        # Bullish Signals
        bullish = [f for f in findings if f.get("finding_type") == "bullish_signal"]
        if bullish:
            sections.append("## Bullish Signals")
            sections.append("")
            for b in bullish[:4]:
                sections.append(f"- {b.get('summary') or b.get('content', '')[:100]}")
            sections.append("")

        # Bearish Signals / Risks
        bearish = [f for f in findings if f.get("finding_type") in ["bearish_signal", "risk"]]
        if bearish:
            sections.append("## Key Risk Factors")
            sections.append("")
            for r in bearish[:4]:
                sections.append(f"- {r.get('summary') or r.get('content', '')[:100]}")
            sections.append("")

        return "\n".join(sections)

    def _generate_executive_highlights(self, result: Dict[str, Any]) -> str:
        """Generate financial-specific executive highlights."""
        findings = result.get("findings", [])
        sections = []

        # Key metrics highlight
        metrics = [f for f in findings if f.get("finding_type") == "financial_metric"]
        if metrics:
            sections.append("## Key Metrics")
            sections.append("")
            for m in metrics[:4]:
                sections.append(f"- {m.get('summary') or m.get('content', '')[:100]}")
            sections.append("")

        return "\n".join(sections)

    def generate_kill_criteria(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Extract kill criteria - specific signals that would invalidate the investment thesis."""
        findings = result.get("findings", [])
        perspectives = result.get("perspectives", [])

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
        """Generate upstream/downstream ecosystem analysis."""
        findings = result.get("findings", [])

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
                "Customer concentration/health is a key driver. Monitor top customer spending patterns."
            )
        if ecosystem["competitors"]:
            ecosystem["implications"].append(
                "Competitive dynamics identified. Track market share shifts quarterly."
            )
        if ecosystem["suppliers"]:
            ecosystem["implications"].append(
                "Supply chain dependencies exist. Monitor for disruption risks."
            )

        return ecosystem
