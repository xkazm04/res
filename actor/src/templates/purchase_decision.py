"""Purchase Decision template for evaluating products and services before buying."""

from typing import List, Dict, Any, Optional
from datetime import datetime

from .base import BaseTemplate
from ..services.report_components import (
    ComponentType, ComponentConfig, ReportHints, get_report_hints
)


class PurchaseDecisionTemplate(BaseTemplate):
    """Template for purchase decision research.

    Helps users make informed buying decisions by aggregating real user
    experiences, identifying hidden costs, and comparing alternatives.
    """

    template_id = "purchase_decision"
    template_name = "Purchase Decision"
    description = "Research products and services before buying - real reviews, hidden costs, and alternatives"

    # Report hints for component-based rendering
    report_hints = ReportHints(
        template_type="purchase_decision",
        structure="verdict_first",
        findings_grouping="category",
        tone="advisory",
        decision_format="matrix",
        emphasis=["recommendation", "comparison", "value_assessment", "user_fit"],
        required_components=[
            ComponentType.DECISION_MATRIX,
            ComponentType.VERDICT_HERO,
            ComponentType.PROS_CONS,
        ],
        optional_components=[
            ComponentType.COMPARISON_TABLE,
            ComponentType.METRIC_CARDS,
            ComponentType.CHECKLIST,
            ComponentType.QUOTE_CAROUSEL,
        ],
        visualization_preference=["decision_matrix", "comparison_chart", "value_radar"],
        custom_sections={
            "show_winner_highlight": True,
            "hidden_costs_prominent": True,
            "real_user_voices": True,
        }
    )

    # Expert perspectives for purchase decisions
    default_perspectives = [
        "consumer_advocate",   # Protect buyer interests
        "technical_expert",    # Technical evaluation
        "value_analyst",       # Cost-benefit analysis
        "long_term_owner",     # Experience over time
    ]

    default_max_searches = 7

    # Purchase decisions need good source quality but less legal rigor
    verification_config = {
        "cross_reference": "standard",
        "bias_detection": "thorough",  # Important to detect fake reviews
        "expert_sanity_check": "standard",
        "source_quality": "standard",
    }

    async def generate_search_queries(
        self,
        query: str,
        max_searches: int,
        granularity: str = "standard",
    ) -> List[str]:
        """Generate search queries for purchase decision research."""
        prompt = f"""
You are a consumer research expert helping someone make an informed purchase decision.

Purchase Query: {query}

Depth Level: {granularity}

Generate search queries to help the user decide. Cover these angles:

1. REAL USER EXPERIENCES
   - Long-term owner reviews (6+ months of use)
   - Reddit, forums, and community discussions
   - Verified purchaser reviews on retail sites

2. PROFESSIONAL REVIEWS
   - Expert reviews from reputable sources
   - Comparison tests and benchmarks
   - Industry publication assessments

3. PROBLEMS & ISSUES
   - Common complaints and failure points
   - Recall notices, safety issues
   - Customer service experiences

4. HIDDEN COSTS
   - Maintenance, repairs, consumables
   - Required accessories or add-ons
   - Subscription fees, licensing costs

5. ALTERNATIVES & COMPARISONS
   - Direct competitors
   - Better value options
   - Different approaches to same need

6. VALUE & TIMING
   - Price history and trends
   - Best time to buy, sales cycles
   - Refurbished/used market options

For a "{granularity}" depth level:
- "quick": Focus on 3-4 angles (user reviews, problems, alternatives)
- "standard": Cover 5-6 angles with balanced depth
- "deep": Comprehensive coverage of all angles

Return a JSON array of exactly {max_searches} search query strings.
Focus on finding REAL user experiences, not marketing content.
Include specific product names and "reddit", "forum", "long term review" where relevant.
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
        """Extract purchase decision findings."""
        source_context = "\n\n".join([
            f"Source: {s.get('title', 'Unknown')} ({s.get('url', '')})\n"
            f"Domain: {s.get('domain', '')}"
            for s in sources[:20]
        ])

        prompt = f"""
You are a consumer research analyst helping someone make a purchase decision.

Purchase Query: {query}

Synthesized Research Content:
{synthesized_content[:16000]}

Sources Referenced:
{source_context}

Extract findings in these categories:

1. PRODUCT_STRENGTH (finding_type: "product_strength")
   - What the product genuinely does well
   - Must be backed by multiple user reports, not just marketing
   - extracted_data: {{"strength": "", "evidence_type": "user_reports/expert_review/benchmark", "frequency": "commonly mentioned/sometimes mentioned"}}

2. PRODUCT_WEAKNESS (finding_type: "product_weakness")
   - Known issues, limitations, failure points
   - Be specific about how common and how serious
   - extracted_data: {{"weakness": "", "severity": "deal_breaker/annoying/minor", "frequency": "widespread/occasional/rare", "workaround": ""}}

3. REAL_USER_EXPERIENCE (finding_type: "real_user_experience")
   - Actual owner feedback from forums, Reddit, reviews
   - Focus on long-term use experiences
   - extracted_data: {{"source_type": "reddit/forum/verified_review", "ownership_duration": "", "overall_sentiment": "positive/negative/mixed", "key_points": []}}

4. HIDDEN_COST (finding_type: "hidden_cost")
   - Unexpected expenses the user should know about
   - extracted_data: {{"cost_type": "", "estimated_amount": "", "frequency": "one_time/recurring/occasional", "avoidable": true/false}}

5. ALTERNATIVE_OPTION (finding_type: "alternative_option")
   - Competitors or alternatives worth considering
   - extracted_data: {{"product": "", "price_comparison": "", "key_advantage": "", "key_disadvantage": "", "best_for": ""}}

6. VALUE_ASSESSMENT (finding_type: "value_assessment")
   - Price vs. value analysis
   - extracted_data: {{"verdict": "good_value/fair_value/overpriced/budget_option", "reasoning": "", "price_range": "", "best_time_to_buy": ""}}

For each finding, return:
- finding_type: One of the types above
- content: Detailed finding with specific evidence
- summary: One concise sentence (what users see first)
- confidence_score: 0.0-1.0 based on how many sources corroborate this
- temporal_context: 'past', 'present', 'ongoing'
- extracted_data: Structured data for the finding type

IMPORTANT:
- Prioritize WEAKNESSES - users need to know problems before buying
- Distinguish between widespread issues and isolated complaints
- Be skeptical of reviews that sound like marketing
- Include specific prices, timeframes, and quantities when available

Return as JSON array. Help the user avoid a bad purchase.
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
        """Purchase decision supports buyer_guide variant."""
        return ["full_report", "executive_summary", "buyer_guide"]

    def generate_buyer_guide(
        self,
        result: Dict[str, Any],
        title: Optional[str] = None,
    ) -> str:
        """Generate buyer-focused guide."""
        query = result.get("query", "Unknown")
        report_title = title or f"Buyer's Guide: {query[:50]}"

        sections = []
        sections.append(f"# {report_title}")
        sections.append("")
        sections.append(f"**Research Query:** {query}")
        sections.append(f"**Date:** {datetime.now().strftime('%B %d, %Y')}")
        sections.append("")

        findings = result.get("findings", [])

        # Quick verdict
        weaknesses = [f for f in findings if f.get("finding_type") == "product_weakness"]
        deal_breakers = [f for f in weaknesses
                        if f.get("extracted_data", {}).get("severity") == "deal_breaker"]

        sections.append("## Quick Verdict")
        sections.append("")
        if deal_breakers:
            sections.append("**CAUTION** - Significant issues identified that may be deal-breakers for some buyers")
        elif len(weaknesses) > 3:
            sections.append("**MIXED** - Several notable weaknesses to consider alongside the strengths")
        else:
            sections.append("**GENERALLY POSITIVE** - No major red flags, but review details below")
        sections.append("")

        # What to watch out for (weaknesses first)
        if weaknesses:
            sections.append("## Watch Out For")
            sections.append("")
            for w in weaknesses[:5]:
                extracted = w.get("extracted_data", {})
                severity = extracted.get("severity", "").upper() if extracted else ""
                prefix = f"**[{severity}]** " if severity else ""
                sections.append(f"- {prefix}{w.get('summary', w.get('content', '')[:100])}")
            sections.append("")

        # Hidden costs
        hidden_costs = [f for f in findings if f.get("finding_type") == "hidden_cost"]
        if hidden_costs:
            sections.append("## Hidden Costs")
            sections.append("")
            for hc in hidden_costs[:4]:
                extracted = hc.get("extracted_data", {})
                amount = extracted.get("estimated_amount", "") if extracted else ""
                if amount:
                    sections.append(f"- **{amount}**: {hc.get('summary', '')}")
                else:
                    sections.append(f"- {hc.get('summary', hc.get('content', '')[:100])}")
            sections.append("")

        # Strengths
        strengths = [f for f in findings if f.get("finding_type") == "product_strength"]
        if strengths:
            sections.append("## Strengths")
            sections.append("")
            for s in strengths[:5]:
                sections.append(f"- {s.get('summary', s.get('content', '')[:100])}")
            sections.append("")

        # Alternatives
        alternatives = [f for f in findings if f.get("finding_type") == "alternative_option"]
        if alternatives:
            sections.append("## Alternatives to Consider")
            sections.append("")
            for a in alternatives[:4]:
                extracted = a.get("extracted_data", {})
                product = extracted.get("product", "") if extracted else ""
                if product:
                    sections.append(f"- **{product}**: {a.get('summary', '')}")
                else:
                    sections.append(f"- {a.get('summary', a.get('content', '')[:100])}")
            sections.append("")

        # Real user experiences
        experiences = [f for f in findings if f.get("finding_type") == "real_user_experience"]
        if experiences:
            sections.append("## What Real Users Say")
            sections.append("")
            for e in experiences[:4]:
                sections.append(f"- {e.get('summary', e.get('content', '')[:120])}")
            sections.append("")

        return "\n".join(sections)

    def _get_priority_findings(self, findings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Purchase decision prioritizes weaknesses and hidden costs."""
        priority_types = ["product_weakness", "hidden_cost", "alternative_option",
                        "real_user_experience", "product_strength", "value_assessment"]
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
        """Group findings with purchase decision priority order."""
        order = ["product_weakness", "hidden_cost", "product_strength",
                "alternative_option", "real_user_experience", "value_assessment"]
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
