"""Purchase Decision template for evaluating products and services before buying."""

from typing import List, Dict, Any, Optional
from datetime import datetime

from .base import BaseTemplate, TemplateConfig, FindingTypeConfig, FindingType
from ..services.report_components import (
    ComponentType, ReportHints
)


# ========== FINDING TYPE ENUM ==========

class PurchaseDecisionFindingType(FindingType):
    """Valid finding types for purchase decision research."""
    PRODUCT_STRENGTH = "product_strength"
    PRODUCT_WEAKNESS = "product_weakness"
    REAL_USER_EXPERIENCE = "real_user_experience"
    HIDDEN_COST = "hidden_cost"
    ALTERNATIVE_OPTION = "alternative_option"
    VALUE_ASSESSMENT = "value_assessment"


# ========== TEMPLATE CONFIGURATION ==========

PURCHASE_DECISION_CONFIG = TemplateConfig(
    search_intro="You are a consumer research expert helping someone make an informed purchase decision.",
    search_angles=[
        {
            "name": "REAL USER EXPERIENCES",
            "items": [
                "Long-term owner reviews (6+ months of use)",
                "Reddit, forums, and community discussions",
                "Verified purchaser reviews on retail sites",
            ]
        },
        {
            "name": "PROFESSIONAL REVIEWS",
            "items": [
                "Expert reviews from reputable sources",
                "Comparison tests and benchmarks",
                "Industry publication assessments",
            ]
        },
        {
            "name": "PROBLEMS & ISSUES",
            "items": [
                "Common complaints and failure points",
                "Recall notices, safety issues",
                "Customer service experiences",
            ]
        },
        {
            "name": "HIDDEN COSTS",
            "items": [
                "Maintenance, repairs, consumables",
                "Required accessories or add-ons",
                "Subscription fees, licensing costs",
            ]
        },
        {
            "name": "ALTERNATIVES & COMPARISONS",
            "items": [
                "Direct competitors",
                "Better value options",
                "Different approaches to same need",
            ]
        },
        {
            "name": "VALUE & TIMING",
            "items": [
                "Price history and trends",
                "Best time to buy, sales cycles",
                "Refurbished/used market options",
            ]
        },
    ],
    search_depth_guidance={
        "quick": "Focus on 3-4 angles (user reviews, problems, alternatives)",
        "standard": "Cover 5-6 angles with balanced depth",
        "deep": "Comprehensive coverage of all angles",
    },

    extraction_intro="You are a consumer research analyst helping someone make a purchase decision.",
    finding_types=[
        FindingTypeConfig(
            name="product_strength",
            display_name="Product Strength",
            description="What the product genuinely does well. Must be backed by multiple user reports, not just marketing.",
            extracted_data_schema='{"strength": "", "evidence_type": "user_reports/expert_review/benchmark", "frequency": "commonly mentioned/sometimes mentioned"}',
            analysis_fallback="This strength is consistently noted by users and may be a key buying factor.",
        ),
        FindingTypeConfig(
            name="product_weakness",
            display_name="Product Weakness",
            description="Known issues, limitations, failure points. Be specific about how common and how serious.",
            extracted_data_schema='{"weakness": "", "severity": "deal_breaker/annoying/minor", "frequency": "widespread/occasional/rare", "workaround": ""}',
            analysis_fallback="This weakness should be considered in the context of your specific use case and priorities.",
        ),
        FindingTypeConfig(
            name="real_user_experience",
            display_name="Real User Experience",
            description="Actual owner feedback from forums, Reddit, reviews. Focus on long-term use experiences.",
            extracted_data_schema='{"source_type": "reddit/forum/verified_review", "ownership_duration": "", "overall_sentiment": "positive/negative/mixed", "key_points": []}',
            analysis_fallback="Real user feedback provides ground-truth insight into ownership experience.",
        ),
        FindingTypeConfig(
            name="hidden_cost",
            display_name="Hidden Cost",
            description="Unexpected expenses the user should know about",
            extracted_data_schema='{"cost_type": "", "estimated_amount": "", "frequency": "one_time/recurring/occasional", "avoidable": true/false}',
            analysis_fallback="This hidden cost affects total ownership cost and should be factored into the purchase decision.",
        ),
        FindingTypeConfig(
            name="alternative_option",
            display_name="Alternative Option",
            description="Competitors or alternatives worth considering",
            extracted_data_schema='{"product": "", "price_comparison": "", "key_advantage": "", "key_disadvantage": "", "best_for": ""}',
            analysis_fallback="This alternative may be worth considering depending on your priorities and budget.",
        ),
        FindingTypeConfig(
            name="value_assessment",
            display_name="Value Assessment",
            description="Price vs. value analysis",
            extracted_data_schema='{"verdict": "good_value/fair_value/overpriced/budget_option", "reasoning": "", "price_range": "", "best_time_to_buy": ""}',
            analysis_fallback="This value assessment helps contextualize whether the price is justified for what you get.",
        ),
    ],
    analysis_instruction="""YOUR EXPERT CONSUMER ANALYSIS (REQUIRED - 2-4 sentences) explaining:
  * WHY this matters for someone making this purchase decision
  * How COMMON this experience is based on the evidence pattern
  * What TYPE OF BUYER this affects most (or doesn't affect)
  * What ALTERNATIVES or WORKAROUNDS exist for this issue""",
    extraction_guidelines="""CRITICAL: The "analysis" field must provide substantive consumer guidance, not just describe the finding.
Good example: "This battery degradation issue is a significant concern for buyers planning to keep the product 3+ years. Based on 47 forum reports, this affects approximately 30% of units after 2 years of daily use. However, users who follow the 20-80% charging guideline report much better longevity. For lease/upgrade buyers who cycle every 2 years, this is less relevant."

IMPORTANT:
- Prioritize WEAKNESSES - users need to know problems before buying
- Distinguish between widespread issues and isolated complaints
- Be skeptical of reviews that sound like marketing
- Include specific prices, timeframes, and quantities when available""",

    priority_finding_types=["product_weakness", "hidden_cost", "alternative_option", "real_user_experience", "product_strength", "value_assessment"],
    grouping_order=["product_weakness", "hidden_cost", "product_strength", "alternative_option", "real_user_experience", "value_assessment"],
)


class PurchaseDecisionTemplate(BaseTemplate):
    """Template for purchase decision research.

    Helps users make informed buying decisions by aggregating real user
    experiences, identifying hidden costs, and comparing alternatives.
    """

    template_id = "purchase_decision"
    template_name = "Purchase Decision"
    description = "Research products and services before buying - real reviews, hidden costs, and alternatives"

    # Data-driven configuration
    config = PURCHASE_DECISION_CONFIG

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
