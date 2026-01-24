"""Competitive analysis research template."""

from typing import List, Dict, Any, Optional

from .base import BaseTemplate
from ..services.report_components import (
    ComponentType, ComponentConfig, ReportHints, get_report_hints
)


class CompetitiveTemplate(BaseTemplate):
    """Template for competitive intelligence and market analysis."""

    template_id = "competitive"
    template_name = "Competitive Analysis"
    description = "Deep competitive intelligence, market positioning, and strategic analysis"

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

    async def generate_search_queries(
        self,
        query: str,
        max_searches: int,
        granularity: str = "standard",
    ) -> List[str]:
        """Generate competitive analysis search queries."""
        prompt = f"""
You are a competitive intelligence analyst planning research for a comprehensive competitive analysis.

Research Topic: {query}

Depth Level: {granularity}

Generate search queries covering these competitive intelligence angles:

1. MARKET OVERVIEW
   - Total addressable market size and growth rate
   - Market segmentation and dynamics
   - Industry value chain analysis

2. COMPETITOR IDENTIFICATION
   - Direct competitors by market segment
   - Indirect and emerging competitors
   - Potential new entrants and substitutes

3. COMPETITOR PROFILES (for each key competitor)
   - Business model and revenue streams
   - Product/service offerings and differentiation
   - Geographic presence and expansion plans
   - Recent news, announcements, product launches

4. FINANCIAL COMPARISON
   - Revenue, growth rates, margins
   - Market share estimates
   - Investment and R&D spending
   - Profitability and unit economics

5. STRATEGIC POSITIONING
   - Value propositions and target customers
   - Pricing strategies and models
   - Distribution and go-to-market approaches
   - Partnerships and ecosystem plays

6. COMPETITIVE ADVANTAGES
   - Technology and IP advantages
   - Network effects and switching costs
   - Scale and cost advantages
   - Brand and reputation

7. CUSTOMER INTELLIGENCE
   - Customer reviews and satisfaction
   - Win/loss analysis patterns
   - Customer concentration
   - Churn and retention data

8. TALENT AND CULTURE
   - Leadership team background
   - Key hires and departures
   - Glassdoor/Indeed reviews
   - Engineering talent and culture

9. WEAKNESSES AND THREATS
   - Known vulnerabilities
   - Customer complaints
   - Regulatory challenges
   - Strategic missteps

10. FUTURE OUTLOOK
    - Stated strategies and roadmaps
    - M&A activity and rumors
    - Industry trend positioning

For a "{granularity}" depth level:
- "quick": Focus on top 3 competitors with key metrics only
- "standard": Cover 5-7 competitors with balanced analysis
- "deep": Comprehensive coverage of 10+ competitors with detailed profiles

Return a JSON array of exactly {max_searches} search query strings, ordered by importance.
Example: ["company X vs company Y market share 2024", "company X revenue growth analysis", ...]
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
        """Extract competitive intelligence findings."""
        # Build source context
        source_context = "\n\n".join([
            f"Source: {s.get('title', 'Unknown')} ({s.get('url', '')})\n"
            f"Credibility: {s.get('credibility_score', 'Unknown')}\n"
            f"Domain: {s.get('domain', '')}"
            for s in sources[:20]
        ])

        prompt = f"""
You are a competitive intelligence analyst extracting key findings for strategic decision-making.

Research Topic: {query}

Synthesized Research Content:
{synthesized_content[:15000]}

Sources Referenced:
{source_context}

Extract findings in these competitive intelligence categories:

1. MARKET DATA (finding_type: "fact")
   - Market size, growth rates, segments
   - Include: metric, value, source, date
   - Note methodology if available

2. COMPETITOR PROFILES (finding_type: "actor")
   - Company overview, positioning, strategy
   - Include: company name, segment, key metrics
   - Note strengths and weaknesses

3. MARKET EVENTS (finding_type: "event")
   - Product launches, M&A, leadership changes
   - Include: date, companies involved, impact
   - Note strategic implications

4. COMPETITIVE DYNAMICS (finding_type: "relationship")
   - Head-to-head competition, partnerships, ecosystems
   - Include: companies, nature of relationship
   - Note competitive intensity

5. MARKET SHARE DATA (finding_type: "evidence")
   - Market share percentages, rankings
   - Include: source, methodology, time period
   - Note trends and changes

6. STRATEGIC MOVES (finding_type: "pattern")
   - Pricing changes, go-to-market shifts, pivots
   - Include: company, action, timing
   - Note competitive response

7. CUSTOMER INTELLIGENCE (finding_type: "claim")
   - Customer feedback, satisfaction, preferences
   - Include: sentiment, specifics, volume
   - Note credibility of source

8. FINANCIAL METRICS (finding_type: "evidence")
   - Revenue, margins, growth rates by competitor
   - Include: metric, value, period, YoY change
   - Note vs. industry benchmarks

9. THREATS AND OPPORTUNITIES (finding_type: "prediction")
   - Emerging threats, market opportunities
   - Include: threat/opportunity, likelihood, timeline
   - Note strategic implications

10. GAPS (finding_type: "gap")
    - Missing competitive data
    - Information needed for complete analysis
    - Suggested intelligence gathering

For each finding, return:
- finding_type: One of 'fact', 'actor', 'event', 'relationship', 'evidence', 'pattern', 'claim', 'prediction', 'gap'
- content: Detailed finding with specific data points
- summary: One sentence
- confidence_score: 0.0-1.0 (based on source quality and recency)
- temporal_context: 'past', 'present', 'ongoing', or 'prediction'
- extracted_data: JSON object with structured data:
  - For market data: {{"metric": "...", "value": ..., "period": "...", "growth": ...}}
  - For competitors: {{"company": "...", "segment": "...", "revenue": ..., "market_share": ...}}
  - For events: {{"date": "...", "companies": [...], "event_type": "...", "impact": "..."}}

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
                        "extracted_data": f.get("extracted_data"),
                    })

        return findings

    # ========== COMPETITIVE-SPECIFIC REPORT GENERATION ==========

    def get_supported_report_variants(self) -> List[str]:
        """Competitive template supports competitor_matrix variant."""
        return ["full_report", "executive_summary", "competitor_matrix"]

    def generate_competitor_matrix(
        self,
        result: Dict[str, Any],
        title: Optional[str] = None,
    ) -> str:
        """Generate competitor matrix report - competitive-specific variant."""
        from datetime import datetime

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

    def _get_priority_findings(self, findings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Competitive template prioritizes actors (competitors) and evidence."""
        priority_types = ["actor", "evidence", "fact", "relationship", "pattern"]
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
