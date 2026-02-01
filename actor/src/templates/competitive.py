"""Competitive analysis research template."""

from typing import List, Dict, Any, Optional
from datetime import datetime

from .base import BaseTemplate, TemplateConfig, FindingTypeConfig, FindingType
from ..services.report_components import (
    ComponentType, ReportHints
)


# ========== FINDING TYPE ENUM ==========

class CompetitiveFindingType(FindingType):
    """Valid finding types for competitive analysis research."""
    FACT = "fact"
    ACTOR = "actor"
    EVENT = "event"
    RELATIONSHIP = "relationship"
    EVIDENCE = "evidence"
    PATTERN = "pattern"
    CLAIM = "claim"
    PREDICTION = "prediction"
    GAP = "gap"


# ========== TEMPLATE CONFIGURATION ==========

COMPETITIVE_CONFIG = TemplateConfig(
    search_intro="You are a competitive intelligence analyst planning research for a comprehensive competitive analysis.",
    search_angles=[
        {
            "name": "MARKET OVERVIEW",
            "items": [
                "Total addressable market size and growth rate",
                "Market segmentation and dynamics",
                "Industry value chain analysis",
            ]
        },
        {
            "name": "COMPETITOR IDENTIFICATION",
            "items": [
                "Direct competitors by market segment",
                "Indirect and emerging competitors",
                "Potential new entrants and substitutes",
            ]
        },
        {
            "name": "COMPETITOR PROFILES",
            "items": [
                "Business model and revenue streams",
                "Product/service offerings and differentiation",
                "Geographic presence and expansion plans",
                "Recent news, announcements, product launches",
            ]
        },
        {
            "name": "FINANCIAL COMPARISON",
            "items": [
                "Revenue, growth rates, margins",
                "Market share estimates",
                "Investment and R&D spending",
                "Profitability and unit economics",
            ]
        },
        {
            "name": "STRATEGIC POSITIONING",
            "items": [
                "Value propositions and target customers",
                "Pricing strategies and models",
                "Distribution and go-to-market approaches",
                "Partnerships and ecosystem plays",
            ]
        },
        {
            "name": "COMPETITIVE ADVANTAGES",
            "items": [
                "Technology and IP advantages",
                "Network effects and switching costs",
                "Scale and cost advantages",
                "Brand and reputation",
            ]
        },
        {
            "name": "CUSTOMER INTELLIGENCE",
            "items": [
                "Customer reviews and satisfaction",
                "Win/loss analysis patterns",
                "Customer concentration",
                "Churn and retention data",
            ]
        },
        {
            "name": "TALENT AND CULTURE",
            "items": [
                "Leadership team background",
                "Key hires and departures",
                "Glassdoor/Indeed reviews",
                "Engineering talent and culture",
            ]
        },
        {
            "name": "WEAKNESSES AND THREATS",
            "items": [
                "Known vulnerabilities",
                "Customer complaints",
                "Regulatory challenges",
                "Strategic missteps",
            ]
        },
        {
            "name": "FUTURE OUTLOOK",
            "items": [
                "Stated strategies and roadmaps",
                "M&A activity and rumors",
                "Industry trend positioning",
            ]
        },
    ],
    search_depth_guidance={
        "quick": "Focus on top 3 competitors with key metrics only",
        "standard": "Cover 5-7 competitors with balanced analysis",
        "deep": "Comprehensive coverage of 10+ competitors with detailed profiles",
    },

    extraction_intro="You are a competitive intelligence analyst extracting key findings for strategic decision-making.",
    finding_types=[
        FindingTypeConfig(
            name="fact",
            display_name="Market Data",
            description="Market size, growth rates, segments. Include: metric, value, source, date. Note methodology if available.",
            extracted_data_schema='{"metric": "...", "value": "...", "period": "...", "growth": "...", "source": "..."}',
            analysis_fallback="This market data provides context for understanding the competitive landscape.",
        ),
        FindingTypeConfig(
            name="actor",
            display_name="Competitor Profile",
            description="Company overview, positioning, strategy. Include: company name, segment, key metrics. Note strengths and weaknesses.",
            extracted_data_schema='{"company": "...", "segment": "...", "revenue": "...", "market_share": "...", "strengths": [...], "weaknesses": [...]}',
            analysis_fallback="This competitor profile helps understand their market position and strategic focus.",
        ),
        FindingTypeConfig(
            name="event",
            display_name="Market Event",
            description="Product launches, M&A, leadership changes. Include: date, companies involved, impact. Note strategic implications.",
            extracted_data_schema='{"date": "...", "companies": [...], "event_type": "...", "impact": "..."}',
            analysis_fallback="This market event may signal strategic shifts or competitive dynamics changes.",
        ),
        FindingTypeConfig(
            name="relationship",
            display_name="Competitive Dynamics",
            description="Head-to-head competition, partnerships, ecosystems. Include: companies, nature of relationship. Note competitive intensity.",
            extracted_data_schema='{"company_a": "...", "company_b": "...", "relationship_type": "...", "competitive_intensity": "high/medium/low"}',
            analysis_fallback="This competitive relationship reveals market dynamics and potential strategic implications.",
        ),
        FindingTypeConfig(
            name="evidence",
            display_name="Market Share Data",
            description="Market share percentages, rankings. Include: source, methodology, time period. Note trends and changes.",
            extracted_data_schema='{"company": "...", "market_share": "...", "ranking": "...", "source": "...", "period": "...", "trend": "..."}',
            analysis_fallback="This market share data helps quantify competitive positions.",
        ),
        FindingTypeConfig(
            name="pattern",
            display_name="Strategic Move",
            description="Pricing changes, go-to-market shifts, pivots. Include: company, action, timing. Note competitive response.",
            extracted_data_schema='{"company": "...", "action": "...", "timing": "...", "competitive_response": "..."}',
            analysis_fallback="This strategic move may indicate shifts in competitive strategy.",
        ),
        FindingTypeConfig(
            name="claim",
            display_name="Customer Intelligence",
            description="Customer feedback, satisfaction, preferences. Include: sentiment, specifics, volume. Note credibility of source.",
            extracted_data_schema='{"source": "...", "sentiment": "positive/negative/mixed", "volume": "...", "key_themes": [...]}',
            analysis_fallback="This customer intelligence provides insight into market perceptions and preferences.",
        ),
        FindingTypeConfig(
            name="prediction",
            display_name="Threats and Opportunities",
            description="Emerging threats, market opportunities. Include: threat/opportunity, likelihood, timeline. Note strategic implications.",
            extracted_data_schema='{"type": "threat/opportunity", "description": "...", "likelihood": "high/medium/low", "timeline": "...", "implications": "..."}',
            analysis_fallback="This forward-looking assessment identifies potential strategic considerations.",
        ),
        FindingTypeConfig(
            name="gap",
            display_name="Gap",
            description="Missing competitive data. Information needed for complete analysis. Suggested intelligence gathering.",
            extracted_data_schema='{"information_needed": "...", "importance": "high/medium/low", "suggested_sources": [...]}',
            analysis_fallback="This gap in competitive intelligence should be addressed for a complete analysis.",
        ),
    ],
    analysis_instruction="""YOUR EXPERT ANALYTICAL COMMENTARY (REQUIRED - 2-4 sentences) explaining:
  * WHY this finding matters for competitive positioning
  * What STRATEGIC IMPLICATIONS it has for market players
  * How this COMPARES to historical patterns or industry norms
  * What ACTIONS or responses this might trigger from competitors""",
    extraction_guidelines="""CRITICAL: The "analysis" field must provide substantive strategic reasoning, not just restate the finding.
Good example: "This market share gain is significant because it crosses the 30% threshold typically required for pricing power. Historically, companies reaching this level have been able to raise prices 5-10% without significant churn. Competitors will likely respond with aggressive bundling or price cuts within 6 months."

IMPORTANT:
- Be skeptical of vendor-provided market share data
- Note methodology differences between market research sources
- Distinguish between market leadership claims and verified data""",

    priority_finding_types=["actor", "evidence", "fact", "relationship", "pattern"],
    grouping_order=["actor", "evidence", "fact", "relationship", "pattern", "event", "claim", "prediction", "gap"],
)


class CompetitiveTemplate(BaseTemplate):
    """Template for competitive intelligence and market analysis."""

    template_id = "competitive"
    template_name = "Competitive Analysis"
    description = "Deep competitive intelligence, market positioning, and strategic analysis"

    # Data-driven configuration
    config = COMPETITIVE_CONFIG

    # Report hints for component-based rendering
    report_hints = ReportHints(
        template_type="competitive",
        structure="balanced",
        findings_grouping="category",
        tone="analytical",
        decision_format="matrix",
        emphasis=["market_position", "competitive_advantages", "strategic_gaps"],
        required_components=[
            ComponentType.COMPETITOR_MATRIX,
            ComponentType.COMPARISON_TABLE,
            ComponentType.METRIC_CARDS,
        ],
        optional_components=[
            ComponentType.FINDINGS_TABLE,
            ComponentType.PROS_CONS,
            ComponentType.KEY_INSIGHTS,
            ComponentType.ACTION_ITEMS,
        ],
        visualization_preference=["competitor_matrix", "market_share_chart", "swot_grid"],
        custom_sections={
            "show_market_share": True,
            "highlight_leader": True,
            "show_strategic_gaps": True,
        }
    )

    # Expert perspectives for competitive intelligence
    default_perspectives = [
        "strategy_consultant",      # Porter's forces, competitive positioning
        "industry_insider",         # Operational realities, customer dynamics
        "institutional_investor",   # Long-term value, moat durability
        "short_seller",             # Skeptical view, hidden weaknesses
    ]

    default_max_searches = 10

    # Competitive analysis is rife with vendor marketing and inflated claims
    # Market share numbers vary wildly, need to detect promotional content
    verification_config = {
        "cross_reference": "standard",      # Market data varies by methodology
        "bias_detection": "thorough",       # Vendors inflate their position
        "expert_sanity_check": "standard",  # Flag unrealistic market claims
        "source_quality": "standard",       # Mix of analyst and vendor sources
    }

    def get_supported_report_variants(self) -> List[str]:
        """Competitive template supports competitor_matrix variant."""
        return ["full_report", "executive_summary", "competitor_matrix"]

    def generate_competitor_matrix(
        self,
        result: Dict[str, Any],
        title: Optional[str] = None,
    ) -> str:
        """Generate competitor matrix report - competitive-specific variant."""
        query = result.get("query", "Unknown")
        report_title = title or f"Competitive Matrix: {query[:40]}"

        sections = []
        sections.append(f"# {report_title}")
        sections.append("")
        sections.append(f"**Market/Subject:** {query}")
        sections.append(f"**Date:** {datetime.now().strftime('%B %d, %Y')}")
        sections.append("")
        sections.append("---")
        sections.append("")

        findings = result.get("findings", [])

        # Market Overview
        market_data = [f for f in findings if f.get("finding_type") == "fact"]
        if market_data:
            sections.append("## Market Overview")
            sections.append("")
            for m in market_data[:4]:
                sections.append(f"- {m.get('summary') or m.get('content', '')[:100]}")
            sections.append("")

        # Competitor Profiles
        competitors = [f for f in findings if f.get("finding_type") == "actor"]
        if competitors:
            sections.append("## Competitor Profiles")
            sections.append("")
            for comp in competitors:
                extracted = comp.get("extracted_data", {})
                if extracted and isinstance(extracted, dict):
                    company = extracted.get("company", "Unknown")
                    segment = extracted.get("segment", "")
                    revenue = extracted.get("revenue", "")
                    market_share = extracted.get("market_share", "")
                    sections.append(f"### {company}")
                    sections.append("")
                    if segment:
                        sections.append(f"- **Segment:** {segment}")
                    if revenue:
                        sections.append(f"- **Revenue:** {revenue}")
                    if market_share:
                        sections.append(f"- **Market Share:** {market_share}")
                    sections.append(f"- {comp.get('content', '')[:200]}")
                    sections.append("")
                else:
                    sections.append(f"- {comp.get('summary') or comp.get('content', '')[:100]}")
            sections.append("")

        # Competitive Dynamics
        relationships = [f for f in findings if f.get("finding_type") == "relationship"]
        if relationships:
            sections.append("## Competitive Dynamics")
            sections.append("")
            for rel in relationships[:6]:
                sections.append(f"- {rel.get('summary') or rel.get('content', '')[:100]}")
            sections.append("")

        # Market Share Data
        evidence = [f for f in findings if f.get("finding_type") == "evidence"]
        if evidence:
            sections.append("## Market Share & Metrics")
            sections.append("")
            for e in evidence[:6]:
                sections.append(f"- {e.get('summary') or e.get('content', '')[:100]}")
            sections.append("")

        # Strategic Moves
        patterns = [f for f in findings if f.get("finding_type") == "pattern"]
        if patterns:
            sections.append("## Recent Strategic Moves")
            sections.append("")
            for p in patterns[:5]:
                sections.append(f"- {p.get('summary') or p.get('content', '')[:100]}")
            sections.append("")

        # Threats and Opportunities
        predictions = [f for f in findings if f.get("finding_type") == "prediction"]
        if predictions:
            sections.append("## Threats & Opportunities")
            sections.append("")
            for pred in predictions[:5]:
                sections.append(f"- {pred.get('summary') or pred.get('content', '')[:100]}")
            sections.append("")

        return "\n".join(sections)

    def _generate_key_sections(self, result: Dict[str, Any]) -> str:
        """Generate competitive-specific key sections: Market Position, Key Competitors."""
        findings = result.get("findings", [])
        sections = []

        # Market Position Summary
        evidence = [f for f in findings if f.get("finding_type") == "evidence"]
        if evidence:
            sections.append("## Market Position Summary")
            sections.append("")
            for e in evidence[:4]:
                sections.append(f"- {e.get('summary') or e.get('content', '')[:100]}")
            sections.append("")

        # Key Competitors
        competitors = [f for f in findings if f.get("finding_type") == "actor"]
        if competitors:
            sections.append("## Key Competitors")
            sections.append("")
            for comp in competitors[:5]:
                sections.append(f"- {comp.get('summary') or comp.get('content', '')[:100]}")
            sections.append("")

        return "\n".join(sections)

    def _generate_executive_highlights(self, result: Dict[str, Any]) -> str:
        """Generate competitive-specific executive highlights."""
        findings = result.get("findings", [])
        sections = []

        # Top competitors highlight
        competitors = [f for f in findings if f.get("finding_type") == "actor"]
        if competitors:
            sections.append("## Top Competitors")
            sections.append("")
            for comp in competitors[:3]:
                sections.append(f"- {comp.get('summary') or comp.get('content', '')[:80]}")
            sections.append("")

        return "\n".join(sections)
