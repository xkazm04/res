"""Due Diligence template for vetting companies, vendors, and partners."""

from typing import List, Dict, Any, Optional
from datetime import datetime

from .base import (
    BaseTemplate,
    TemplateConfig,
    FindingTypeConfig,
    FindingType,
    ReportBuilder,
    ReportVariantSpec,
    SectionSpec,
    AssessmentSpec,
)
from ..services.report_components import (
    ComponentType, ReportHints
)


# ========== FINDING TYPE ENUM ==========

class DueDiligenceFindingType(FindingType):
    """Valid finding types for due diligence research."""
    COMPANY_PROFILE = "company_profile"
    FINANCIAL_HEALTH = "financial_health"
    LEGAL_HISTORY = "legal_history"
    RED_FLAG = "red_flag"
    REPUTATION_SIGNAL = "reputation_signal"
    KEY_PERSON = "key_person"


# ========== DECLARATIVE REPORT SPECS ==========

# Risk Summary report variant - declarative definition
RISK_SUMMARY_SPEC = ReportVariantSpec(
    variant_name="risk_summary",
    title_template="Due Diligence: {query}",
    show_divider=False,
    query_label="Subject",
    assessment_section=AssessmentSpec(
        title="Risk Assessment",
        assessment_type="risk",
        finding_type="red_flag",
        severity_field="severity",
        high_threshold=1,
        medium_threshold=1,
        high_label="**RISK LEVEL: HIGH** - Significant concerns identified",
        medium_label="**RISK LEVEL: MEDIUM** - Some concerns warrant attention",
        low_label="**RISK LEVEL: LOW** - No major red flags detected",
    ),
    sections=[
        SectionSpec(
            title="Red Flags",
            finding_types=["red_flag"],
            max_items=6,
            prefix_field="severity",
            prefix_transform="upper",
        ),
        SectionSpec(
            title="Legal History",
            finding_types=["legal_history"],
            max_items=5,
        ),
        SectionSpec(
            title="Reputation Signals",
            finding_types=["reputation_signal"],
            max_items=4,
        ),
    ],
)


# ========== TEMPLATE CONFIGURATION ==========

DUE_DILIGENCE_CONFIG = TemplateConfig(
    search_intro="You are a professional due diligence researcher helping someone vet a business entity.",
    search_angles=[
        {
            "name": "COMPANY BASICS",
            "items": [
                "Official registration, founding date, headquarters",
                "Business model, products/services, market position",
                "Company size, employee count, growth trajectory",
            ]
        },
        {
            "name": "LEADERSHIP & KEY PEOPLE",
            "items": [
                "Founders, executives, board members",
                "Their backgrounds, previous companies, track records",
                "Any controversies or notable achievements",
            ]
        },
        {
            "name": "FINANCIAL HEALTH",
            "items": [
                "Funding history, investors, revenue signals",
                "Profitability indicators, growth metrics",
                "Any signs of financial distress",
            ]
        },
        {
            "name": "LEGAL & REGULATORY",
            "items": [
                "Lawsuits (plaintiff and defendant)",
                "Regulatory actions, fines, settlements",
                "Compliance issues, license status",
            ]
        },
        {
            "name": "REPUTATION & REVIEWS",
            "items": [
                "Customer reviews and complaints (BBB, Trustpilot, G2, etc.)",
                "Employee reviews (Glassdoor, Indeed)",
                "Industry reputation, awards, recognition",
            ]
        },
        {
            "name": "RED FLAGS",
            "items": [
                "Scam reports, fraud allegations",
                "High-profile failures or scandals",
                "Pattern of complaints or issues",
            ]
        },
    ],
    search_depth_guidance={
        "quick": "Focus on 3-4 most critical angles (legal, reviews, red flags)",
        "standard": "Cover 5-6 angles with balanced depth",
        "deep": "Comprehensive coverage of all angles",
    },

    extraction_intro="You are a due diligence analyst extracting findings to help someone make a business decision.",
    finding_types=[
        FindingTypeConfig(
            name="company_profile",
            display_name="Company Profile",
            description="Basic facts about the entity",
            extracted_data_schema='{"name": "", "founded": "", "headquarters": "", "size": "", "industry": "", "business_model": ""}',
            analysis_fallback="This profile information provides essential context for evaluating the entity.",
        ),
        FindingTypeConfig(
            name="financial_health",
            display_name="Financial Health",
            description="Financial stability indicators",
            extracted_data_schema='{"indicator": "", "status": "healthy/concerning/unknown", "evidence": "", "trend": ""}',
            analysis_fallback="This financial indicator helps assess the entity's stability and viability.",
        ),
        FindingTypeConfig(
            name="legal_history",
            display_name="Legal History",
            description="Lawsuits, regulatory actions, legal issues",
            extracted_data_schema='{"case_type": "", "status": "", "outcome": "", "amount": "", "date": "", "significance": ""}',
            analysis_fallback="This legal matter is relevant for assessing potential risks and liabilities.",
        ),
        FindingTypeConfig(
            name="red_flag",
            display_name="Red Flag",
            description="Warning signs that should concern the user. Be specific about WHY this is a red flag.",
            extracted_data_schema='{"flag_type": "", "severity": "high/medium/low", "evidence": "", "recommendation": ""}',
            analysis_fallback="This red flag warrants careful attention and may indicate significant risk.",
        ),
        FindingTypeConfig(
            name="reputation_signal",
            display_name="Reputation Signal",
            description="Reviews, testimonials, industry standing",
            extracted_data_schema='{"source": "", "sentiment": "positive/negative/mixed", "rating": "", "common_themes": []}',
            analysis_fallback="This reputation indicator helps gauge how the entity is perceived by stakeholders.",
        ),
        FindingTypeConfig(
            name="key_person",
            display_name="Key Person",
            description="Leadership background and track record",
            extracted_data_schema='{"name": "", "role": "", "background": "", "track_record": "", "concerns": ""}',
            analysis_fallback="Understanding this person's background helps assess leadership quality and risk.",
        ),
    ],
    analysis_instruction="""YOUR EXPERT DUE DILIGENCE ANALYSIS (REQUIRED - 2-4 sentences) explaining:
  * WHY this finding matters for the business decision at hand
  * What RISK or OPPORTUNITY this represents and how significant it is
  * How this COMPARES to industry norms or similar entities
  * What ADDITIONAL INVESTIGATION or verification this warrants""",
    extraction_guidelines="""CRITICAL: The "analysis" field must provide substantive reasoning, not just describe the finding.
Good example: "This pattern of multiple lawsuits from former employees alleging wage theft is a significant red flag. In our experience, companies with 3+ wage-related lawsuits in a 2-year period have a 70% likelihood of ongoing compliance issues. This also suggests potential labor law violations that could expose acquirers to successor liability. Recommend thorough review of payroll practices and settlement terms."

IMPORTANT:
- Prioritize RED FLAGS - users need to know risks first
- Be specific with dates, amounts, and names when available
- Distinguish between verified facts and allegations
- Note when information is outdated or unverifiable""",

    priority_finding_types=["red_flag", "legal_history", "financial_health", "reputation_signal", "key_person", "company_profile"],
    grouping_order=["red_flag", "legal_history", "financial_health", "reputation_signal", "key_person", "company_profile"],
)


class DueDiligenceTemplate(BaseTemplate):
    """Template for business due diligence research.

    Helps users vet potential business partners, vendors, employers,
    or investment targets by surfacing risks and verifying claims.
    """

    template_id = "due_diligence"
    template_name = "Due Diligence"
    description = "Vet companies, vendors, and partners before signing contracts or making commitments"

    # Data-driven configuration
    config = DUE_DILIGENCE_CONFIG

    # Report hints for component-based rendering
    report_hints = ReportHints(
        template_type="due_diligence",
        structure="verdict_first",
        findings_grouping="category",
        tone="professional",
        decision_format="scorecard",
        emphasis=["overall_assessment", "red_flags", "strengths", "category_scores"],
        required_components=[
            ComponentType.DUE_DILIGENCE_SCORECARD,
            ComponentType.CHECKLIST,
            ComponentType.FINDINGS_TABLE,
        ],
        optional_components=[
            ComponentType.RISK_MATRIX,
            ComponentType.KEY_INSIGHTS,
            ComponentType.ACTION_ITEMS,
            ComponentType.TIMELINE,
        ],
        visualization_preference=["scorecard", "category_radar", "red_flag_matrix"],
        custom_sections={
            "show_risk_score": True,
            "category_breakdown": True,
            "recommendation_prominent": True,
        }
    )

    # Expert perspectives for due diligence
    default_perspectives = [
        "due_diligence_analyst",  # Professional vetting
        "forensic_financial",     # Follow the money
        "legal_liability",        # Legal exposure
        "industry_insider",       # Operational reality
    ]

    default_max_searches = 8

    # Due diligence requires thorough verification
    verification_config = {
        "cross_reference": "thorough",
        "bias_detection": "standard",
        "expert_sanity_check": "thorough",
        "source_quality": "thorough",
    }

    def get_supported_report_variants(self) -> List[str]:
        """Due diligence supports risk_summary variant."""
        return ["full_report", "executive_summary", "risk_summary"]

    def generate_risk_summary(
        self,
        result: Dict[str, Any],
        title: Optional[str] = None,
    ) -> str:
        """Generate risk-focused summary for due diligence.

        Uses the declarative ReportBuilder with RISK_SUMMARY_SPEC for consistent,
        maintainable report generation.
        """
        builder = ReportBuilder(result, self)
        return builder.render(RISK_SUMMARY_SPEC, title)
