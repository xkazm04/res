"""Tech market research template for 2025 developments and 2026 predictions."""

from typing import List, Dict, Any, Optional
from datetime import datetime

from .base import BaseTemplate, TemplateConfig, FindingTypeConfig, FindingType
from ..services.report_components import (
    ComponentType, ReportHints
)


# ========== FINDING TYPE ENUM ==========

class TechMarketFindingType(FindingType):
    """Valid finding types for tech market research."""
    TECH_TREND = "tech_trend"
    MARKET_TREND = "market_trend"
    ADOPTION_PATTERN = "adoption_pattern"
    FINANCIAL_METRIC = "financial_metric"
    PREDICTION = "prediction"
    RED_FLAG = "red_flag"


# ========== TEMPLATE CONFIGURATION ==========

TECH_MARKET_CONFIG = TemplateConfig(
    search_intro="You are a technology market analyst planning comprehensive research on developer tools, infrastructure, and enterprise technology trends.",
    search_angles=[
        {
            "name": "SOFTWARE DEVELOPMENT ECOSYSTEM",
            "items": [
                "Programming languages: adoption trends, new releases, performance comparisons",
                "Frameworks: frontend (React, Vue, Svelte, Next.js), backend (Node, Go, Rust, Python)",
                "IDEs and development tools: VS Code extensions, JetBrains, AI coding assistants",
                "Testing: test frameworks, quality engineering, shift-left practices",
                "Developer productivity: pair programming, code review tools, documentation",
            ]
        },
        {
            "name": "AI/ML AND FULL STACK INFRASTRUCTURE",
            "items": [
                "LLM platforms: OpenAI, Anthropic, Google, open-source models (Llama, Mistral)",
                "AI coding assistants: GitHub Copilot, Cursor, Codeium, Tabnine adoption",
                "MLOps tools: model training, deployment, monitoring, vector databases",
                "Cloud platforms: AWS, Azure, GCP innovations, multi-cloud strategies",
                "Edge AI and on-device inference trends",
            ]
        },
        {
            "name": "DEVOPS AND PLATFORM ENGINEERING",
            "items": [
                "Platform engineering: internal developer platforms, golden paths",
                "GitOps and infrastructure as code: Terraform, Pulumi, Crossplane",
                "Containers and orchestration: Kubernetes ecosystem, service mesh",
                "CI/CD innovations: GitHub Actions, GitLab CI, Dagger",
                "Observability: OpenTelemetry, distributed tracing, AIOps",
            ]
        },
        {
            "name": "ENTERPRISE TECH STACK",
            "items": [
                "Security: DevSecOps, zero-trust, SAST/DAST, supply chain security",
                "Databases: NewSQL, time-series, graph databases, serverless databases",
                "APIs: GraphQL adoption, API gateways, API-first development",
                "Data engineering: data mesh, lakehouse, real-time analytics",
                "Microservices: event-driven architecture, distributed systems",
            ]
        },
        {
            "name": "MARKET DYNAMICS",
            "items": [
                "Funding rounds and valuations for developer tools companies",
                "M&A activity and consolidation trends",
                "Developer survey results (Stack Overflow, JetBrains, GitHub)",
                "Enterprise adoption case studies and ROI analysis",
                "Open source project health and governance",
            ]
        },
        {
            "name": "TEMPORAL FOCUS",
            "items": [
                "Include '2025' in searches for current developments",
                "Include '2026 predictions' or 'roadmap 2026' for future trends",
                "Search for 'State of X 2025' reports where relevant",
                "Include analyst predictions and market forecasts",
            ]
        },
    ],
    search_depth_guidance={
        "quick": "4-5 searches on key emerging tech and major trends",
        "standard": "8-10 searches covering all domains with market dynamics",
        "deep": "12+ searches with comprehensive coverage including funding, predictions, and niche areas",
    },

    extraction_intro="You are a technology market analyst extracting key findings for developer tools research. CRITICAL: Use EXACT finding_type values specified below - they map to UI components (Tech Radar).",
    finding_types=[
        FindingTypeConfig(
            name="tech_trend",
            display_name="Tech Trend",
            description="New technologies gaining adoption (for Tech Radar visualization). Emerging patterns in developer tools, frameworks, languages. Technical architecture shifts, new paradigms.",
            extracted_data_schema='{"technology": "...", "maturity": "adopt|trial|assess|hold", "adoption_rate": 40, "momentum": "growing|stable|declining"}',
            analysis_fallback="This technology trend reflects evolving developer preferences and may indicate future adoption patterns.",
        ),
        FindingTypeConfig(
            name="market_trend",
            display_name="Market Trend",
            description="Market size, growth rates, TAM/SAM estimates. Competitive landscape changes, consolidation. Industry-wide shifts and inflection points.",
            extracted_data_schema='{"market_size": "...", "growth_rate": "...", "segment": "...", "trend_direction": "growing|stable|declining"}',
            analysis_fallback="This market trend provides context for understanding the broader technology landscape.",
        ),
        FindingTypeConfig(
            name="adoption_pattern",
            display_name="Adoption Pattern",
            description="Developer adoption rates with specific percentages. Enterprise vs startup adoption differences. Geographic or segment adoption variations.",
            extracted_data_schema='{"tool": "...", "adoption_rate": 40, "segment": "enterprise|startup|all", "growth_yoy": "..."}',
            analysis_fallback="This adoption pattern helps understand real-world technology uptake and usage trends.",
        ),
        FindingTypeConfig(
            name="financial_metric",
            display_name="Financial Metric",
            description="Funding rounds, valuations, revenue figures. M&A activity and deal values. Pricing changes, business model shifts.",
            extracted_data_schema='{"company": "...", "metric": "funding|revenue|valuation", "value": "...", "round": "...", "investors": [...]}',
            analysis_fallback="This financial metric provides insight into market investment and company valuations.",
        ),
        FindingTypeConfig(
            name="prediction",
            display_name="Prediction",
            description="2026 forecasts and roadmaps. Analyst predictions with timelines. Technology evolution predictions.",
            extracted_data_schema='{"prediction": "...", "timeline": "2026", "confidence": 0.8, "source": "...", "prediction_basis": [...]}',
            analysis_fallback="This prediction offers a forward-looking perspective on technology evolution.",
        ),
        FindingTypeConfig(
            name="red_flag",
            display_name="Red Flag",
            description="Declining adoption, negative developer sentiment. Project stagnation, maintainer burnout. Security issues, funding problems.",
            extracted_data_schema='{"issue": "...", "severity": "high|medium|low", "affected_projects": [...], "evidence": "..."}',
            analysis_fallback="This red flag indicates potential concerns that warrant monitoring.",
        ),
    ],
    analysis_instruction="""YOUR EXPERT ANALYTICAL COMMENTARY (REQUIRED - 2-4 sentences) explaining:
  * Why this trend/finding matters for the technology landscape
  * What it implies for developers, enterprises, or the market
  * Any caveats, counter-trends, or nuances to consider""",
    extraction_guidelines="""CRITICAL: The "analysis" field must provide substantive reasoning, not just describe the finding.
Good example: "This adoption rate represents a major inflection point. The 40% threshold typically signals mainstream adoption in developer tools. However, the 'adoption' definition varies - active daily use vs occasional use shows different patterns. Enterprise adoption lags individual developers by 12-18 months."

IMPORTANT:
- Be skeptical of vendor-provided adoption statistics
- Note methodology differences between surveys
- Distinguish between hype and verified adoption""",

    priority_finding_types=["prediction", "tech_trend", "adoption_pattern", "financial_metric", "market_trend", "red_flag"],
    grouping_order=["prediction", "tech_trend", "adoption_pattern", "financial_metric", "market_trend", "red_flag"],
)


class TechMarketTemplate(BaseTemplate):
    """Template for technology market analysis and trend research."""

    template_id = "tech_market"
    template_name = "Tech Market Analysis"
    description = "Technology market trends, 2025 developments, and 2026 predictions"

    # Data-driven configuration
    config = TECH_MARKET_CONFIG

    # Report hints for component-based rendering
    report_hints = ReportHints(
        template_type="tech_market",
        structure="quantitative_first",
        findings_grouping="category",
        tone="analytical",
        decision_format="recommendation",
        emphasis=["adoption_metrics", "market_trends", "technology_comparison"],
        required_components=[
            ComponentType.TECH_RADAR,
            ComponentType.METRIC_CARDS,
            ComponentType.FINDINGS_TABLE,
        ],
        optional_components=[
            ComponentType.TIMELINE,
            ComponentType.COMPARISON_TABLE,
            ComponentType.PREDICTION_CARDS,
            ComponentType.KEY_INSIGHTS,
        ],
        visualization_preference=["tech_radar", "adoption_chart", "comparison_matrix"],
        custom_sections={
            "primary_metric": "adoption_rate",
            "show_funding_rounds": True,
            "prediction_focus": "2026",
        }
    )

    # Expert perspectives: 4 VC/Startup + 4 Developer Community
    default_perspectives = [
        # VC & Startup focused
        "venture_capitalist",
        "startup_founder",
        "product_manager",
        "developer_advocate",
        # Developer Community
        "open_source_maintainer",
        "devrel_engineer",
        "senior_engineer",
        "platform_engineer",
    ]

    default_max_searches = 12

    # Tech market is MOST prone to hype, vendor marketing, and inflated claims
    # Adoption rates vary wildly by definition, predictions are often wrong
    # Needs maximum verification to separate signal from noise
    verification_config = {
        "cross_reference": "thorough",      # Adoption numbers vary wildly
        "bias_detection": "thorough",       # Vendor marketing everywhere
        "expert_sanity_check": "thorough",  # Flag hype and unrealistic claims
        "source_quality": "thorough",       # Distinguish surveys from blogs
    }

    def get_supported_report_variants(self) -> List[str]:
        """Tech market template supports trend_forecast and vc_briefing variants."""
        return ["full_report", "executive_summary", "trend_forecast", "vc_briefing"]

    def generate_trend_forecast(
        self,
        result: Dict[str, Any],
        title: Optional[str] = None,
    ) -> str:
        """Generate trend forecast report - tech market-specific variant."""
        query = result.get("query", "Unknown")
        report_title = title or f"Tech Trend Forecast: {query[:40]}"

        sections = []
        sections.append(f"# {report_title}")
        sections.append("")
        sections.append(f"**Subject:** {query}")
        sections.append(f"**Date:** {datetime.now().strftime('%B %d, %Y')}")
        sections.append("")
        sections.append("---")
        sections.append("")

        findings = result.get("findings", [])
        perspectives = result.get("perspectives", [])

        # 2026 Predictions (most important)
        predictions = [f for f in findings if f.get("finding_type") == "prediction"
                       or f.get("temporal_context") == "predicted"]
        if predictions:
            sections.append("## 2026 Predictions")
            sections.append("")
            for pred in predictions:
                extracted = pred.get("extracted_data", {})
                if extracted and isinstance(extracted, dict):
                    prediction_text = extracted.get("prediction", "")
                    timeframe = extracted.get("timeframe", "2026")
                    confidence = extracted.get("confidence", 0.5)
                    if isinstance(confidence, (int, float)):
                        conf_label = "High" if confidence >= 0.7 else "Medium" if confidence >= 0.4 else "Low"
                    else:
                        conf_label = str(confidence).title()
                    if prediction_text:
                        sections.append(f"### {prediction_text[:80]}")
                        sections.append("")
                        sections.append(f"**Timeframe:** {timeframe} | **Confidence:** {conf_label}")
                        basis = extracted.get("prediction_basis", [])
                        if basis:
                            sections.append("")
                            sections.append("**Supporting Evidence:**")
                            for b in basis[:3]:
                                sections.append(f"- {b}")
                        sections.append("")
                else:
                    sections.append(f"- {pred.get('summary') or pred.get('content', '')[:150]}")
            sections.append("")

        # Perspective Predictions
        all_predictions = []
        for p in perspectives:
            preds = p.get("predictions", [])
            for pred in preds:
                if isinstance(pred, dict):
                    pred["source_perspective"] = p.get("perspective_type", "")
                    all_predictions.append(pred)
        if all_predictions:
            sections.append("## Expert Predictions")
            sections.append("")
            for pred in all_predictions[:8]:
                prediction_text = pred.get("prediction", "")
                timeline = pred.get("timeline", "2026")
                confidence = pred.get("confidence", "medium")
                source = pred.get("source_perspective", "").replace("_", " ").title()
                if prediction_text:
                    sections.append(f"- **{source}**: {prediction_text} (Timeline: {timeline}, Confidence: {confidence})")
            sections.append("")

        # Tech Trends
        tech_trends = [f for f in findings if f.get("finding_type") == "tech_trend"]
        if tech_trends:
            sections.append("## Current Tech Trends")
            sections.append("")
            for t in tech_trends[:6]:
                extracted = t.get("extracted_data", {})
                if extracted and isinstance(extracted, dict):
                    tech = extracted.get("technology", "")
                    maturity = extracted.get("maturity", "")
                    if tech:
                        sections.append(f"- **{tech}**: {maturity} stage")
                else:
                    sections.append(f"- {t.get('summary') or t.get('content', '')[:100]}")
            sections.append("")

        # Adoption Patterns
        adoption = [f for f in findings if f.get("finding_type") == "adoption_pattern"]
        if adoption:
            sections.append("## Adoption Patterns")
            sections.append("")
            for a in adoption[:6]:
                extracted = a.get("extracted_data", {})
                if extracted and isinstance(extracted, dict):
                    tool = extracted.get("tool", "")
                    rate = extracted.get("adoption_rate", "")
                    if tool:
                        sections.append(f"- **{tool}**: {rate}% adoption")
                else:
                    sections.append(f"- {a.get('summary') or a.get('content', '')[:100]}")
            sections.append("")

        return "\n".join(sections)

    def generate_vc_briefing(
        self,
        result: Dict[str, Any],
        title: Optional[str] = None,
    ) -> str:
        """Generate VC briefing report - tech market-specific variant."""
        query = result.get("query", "Unknown")
        report_title = title or f"VC Briefing: {query[:40]}"

        sections = []
        sections.append(f"# {report_title}")
        sections.append("")
        sections.append(f"**Subject:** {query}")
        sections.append(f"**Date:** {datetime.now().strftime('%B %d, %Y')}")
        sections.append("")
        sections.append("---")
        sections.append("")

        findings = result.get("findings", [])
        perspectives = result.get("perspectives", [])

        # Investment Thesis from VC Perspective
        vc_perspective = next((p for p in perspectives if "venture" in p.get("perspective_type", "").lower()
                               or "vc" in p.get("perspective_type", "").lower()), None)
        if vc_perspective:
            sections.append("## Investment Thesis")
            sections.append("")
            sections.append(vc_perspective.get("analysis_text", "")[:600])
            sections.append("")
            insights = vc_perspective.get("key_insights", [])
            if insights:
                sections.append("**Key Investment Insights:**")
                for i in insights[:4]:
                    sections.append(f"- {i}")
            sections.append("")

        # Financial Metrics (Funding)
        financial = [f for f in findings if f.get("finding_type") == "financial_metric"]
        if financial:
            sections.append("## Recent Funding Activity")
            sections.append("")
            for fr in financial[:8]:
                extracted = fr.get("extracted_data", {})
                if extracted and isinstance(extracted, dict):
                    company = extracted.get("company", "Unknown")
                    metric = extracted.get("metric", "")
                    value = extracted.get("value", "")
                    sections.append(f"- **{company}**: {metric} - {value}")
                else:
                    sections.append(f"- {fr.get('summary') or fr.get('content', '')[:100]}")
            sections.append("")

        # Market Trends
        market_trends = [f for f in findings if f.get("finding_type") == "market_trend"]
        if market_trends:
            sections.append("## Market Dynamics")
            sections.append("")
            for m in market_trends[:5]:
                sections.append(f"- {m.get('summary') or m.get('content', '')[:100]}")
            sections.append("")

        # Red Flags
        red_flags = [f for f in findings if f.get("finding_type") == "red_flag"]
        if red_flags:
            sections.append("## Investment Risks")
            sections.append("")
            for rf in red_flags[:5]:
                sections.append(f"- {rf.get('summary') or rf.get('content', '')[:100]}")
            sections.append("")

        # Warnings from perspectives
        all_warnings = []
        for p in perspectives:
            all_warnings.extend(p.get("warnings", []))
        if all_warnings:
            sections.append("## Risk Warnings")
            sections.append("")
            for w in all_warnings[:5]:
                sections.append(f"- {w}")
            sections.append("")

        return "\n".join(sections)

    def _generate_key_sections(self, result: Dict[str, Any]) -> str:
        """Generate tech market-specific key sections: Predictions, Funding Highlights."""
        findings = result.get("findings", [])
        sections = []

        # 2026 Predictions Highlight
        predictions = [f for f in findings if f.get("finding_type") == "prediction"
                       or f.get("temporal_context") == "predicted"]
        if predictions:
            sections.append("## 2026 Outlook Highlights")
            sections.append("")
            for p in predictions[:4]:
                sections.append(f"- {p.get('summary') or p.get('content', '')[:100]}")
            sections.append("")

        # Recent Funding
        funding = [f for f in findings if f.get("finding_type") == "financial_metric"]
        if funding:
            sections.append("## Notable Funding Rounds")
            sections.append("")
            for fr in funding[:4]:
                sections.append(f"- {fr.get('summary') or fr.get('content', '')[:100]}")
            sections.append("")

        return "\n".join(sections)

    def _generate_executive_highlights(self, result: Dict[str, Any]) -> str:
        """Generate tech market-specific executive highlights."""
        findings = result.get("findings", [])
        sections = []

        # Key trends
        tech_trends = [f for f in findings if f.get("finding_type") == "tech_trend"]
        if tech_trends:
            sections.append("## Key Tech Trends")
            sections.append("")
            for t in tech_trends[:3]:
                sections.append(f"- {t.get('summary') or t.get('content', '')[:80]}")
            sections.append("")

        return "\n".join(sections)
