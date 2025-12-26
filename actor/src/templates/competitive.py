"""Competitive analysis research template."""

from typing import List, Dict, Any

from .base import BaseTemplate


class CompetitiveTemplate(BaseTemplate):
    """Template for competitive intelligence and market analysis."""

    template_id = "competitive"
    template_name = "Competitive Analysis"
    description = "Deep competitive intelligence, market positioning, and strategic analysis"

    # Expert perspectives for competitive intelligence
    default_perspectives = [
        "strategy_consultant",      # Porter's forces, competitive positioning
        "industry_insider",         # Operational realities, customer dynamics
        "institutional_investor",   # Long-term value, moat durability
        "short_seller",             # Skeptical view, hidden weaknesses
    ]

    default_max_searches = 10

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
