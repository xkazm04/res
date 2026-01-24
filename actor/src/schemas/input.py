"""Actor input schema with validation."""

from typing import List, Optional
from pydantic import BaseModel, Field


class ActorInput(BaseModel):
    """Input parameters for the Deep Research Actor."""

    # === USER-FACING PARAMETERS ===

    # Core research
    query: str = Field(..., description="Research question (required)")
    template: str = Field(
        default="tech_market",
        description="Research template: competitive | contract | due_diligence | financial | investigative | legal | purchase_decision | reputation | tech_market | understanding"
    )
    granularity: str = Field(
        default="standard",
        description="Research depth: quick | standard | deep"
    )
    intent: Optional[str] = Field(
        default=None,
        description="Requestor's decision intent: investment_sizing | entry_exit_timing | risk_assessment | due_diligence | education. When specified, research depth and focus are tailored to the decision context. Investment_sizing requires full bull/bear cases with position recommendations. Entry_exit_timing focuses on catalysts and timing signals. Risk_assessment emphasizes downside scenarios and kill criteria. Due_diligence prioritizes verification and red flags. Education provides broader context without action recommendations."
    )

    # Document input (optional)
    input_file_url: Optional[str] = Field(
        default=None,
        description="URL to PDF/text file for context"
    )
    input_text: Optional[str] = Field(
        default=None,
        description="Direct text context"
    )

    # Report generation
    generate_report: bool = Field(
        default=True,
        description="Whether to generate formatted report"
    )
    report_variant: str = Field(
        default="full_report",
        description="Report type (auto-selected based on template): full_report | executive_summary | investment_thesis | risk_summary | buyer_guide | trust_report | credibility_report"
    )
    report_format: str = Field(
        default="html",
        description="Report format: html | markdown | pdf | docx"
    )

    # Export options (for extended formats)
    export_options: Optional[dict] = Field(
        default=None,
        description="Format-specific export options (company_name, logo_url, colors, etc.)"
    )

    # === INTERNAL PARAMETERS (not exposed in UI) ===

    # Expert perspectives - uses template defaults if not specified
    perspectives: Optional[List[str]] = Field(
        default=None,
        description="Override default perspectives for analysis"
    )

    # Report title - auto-generated from query if not specified
    report_title: Optional[str] = Field(
        default=None,
        description="Custom report title (auto-generated if not provided)"
    )

    # Database options - disabled by default for Apify
    save_to_supabase: bool = Field(
        default=False,
        description="Whether to save results to Supabase"
    )
    workspace_id: str = Field(
        default="apify",
        description="Workspace identifier for storage"
    )

    # Email delivery (optional, non-blocking)
    send_email: bool = Field(
        default=False,
        description="Send research report via email when complete"
    )
    email_to: Optional[str] = Field(
        default=None,
        description="Recipient email address"
    )
    email_subject: Optional[str] = Field(
        default=None,
        description="Custom email subject (auto-generated if not provided)"
    )

    # Webhook for real-time progress events
    progress_webhook_url: Optional[str] = Field(
        default=None,
        description="URL to receive real-time progress events via HTTP POST"
    )

    # Cache control
    use_cache: bool = Field(
        default=True,
        description="Use cached results for identical queries (saves cost)"
    )
    extend_cache: bool = Field(
        default=True,
        description="Extend cached results with new findings in background"
    )

    # Cloud Run dispatch (cost optimization)
    use_cloud_run: bool = Field(
        default=True,
        description="Use Cloud Run for research (reduces Apify compute costs)"
    )
    cloud_run_url: Optional[str] = Field(
        default=None,
        description="Cloud Run service URL (from env var CLOUD_RUN_URL)"
    )

    # API keys - always from environment variables
    google_api_key: Optional[str] = Field(
        default=None,
        description="Google API key for Gemini (from env var GOOGLE_API_KEY)"
    )
    openrouter_api_key: Optional[str] = Field(
        default=None,
        description="OpenRouter API key for OCR (from env var OPENROUTER_API_KEY)"
    )
    resend_api_key: Optional[str] = Field(
        default=None,
        description="Resend API key for email delivery (from env var RESEND_API_KEY)"
    )
    supabase_url: Optional[str] = Field(
        default=None,
        description="Supabase project URL (from env var SUPABASE_URL)"
    )
    supabase_key: Optional[str] = Field(
        default=None,
        description="Supabase anon key (from env var SUPABASE_KEY)"
    )

    # Limits - set based on granularity
    max_searches: Optional[int] = Field(
        default=None,
        ge=1,
        le=15,
        description="Maximum web searches (auto-set based on granularity)"
    )
    max_sources_per_search: int = Field(
        default=10,
        ge=1,
        le=20,
        description="Max sources per search"
    )

    def get_max_searches(self) -> int:
        """Get max searches based on granularity if not explicitly set."""
        if self.max_searches is not None:
            return self.max_searches

        granularity_defaults = {
            "quick": 4,
            "standard": 8,
            "deep": 12,
        }
        return granularity_defaults.get(self.granularity, 8)

    def get_report_title(self) -> str:
        """Get report title, auto-generating from query if not set."""
        if self.report_title:
            return self.report_title

        # Auto-generate from query
        title = self.query[:80]
        if len(self.query) > 80:
            title += "..."
        return f"Research: {title}"

    def get_intent_config(self) -> dict:
        """Get research configuration based on requestor's decision intent.

        Returns dict with:
        - emphasis: List of aspects to emphasize in research
        - require_bear_case: Whether bear case is mandatory
        - require_kill_criteria: Whether kill criteria section is mandatory
        - require_ecosystem_analysis: Whether upstream/downstream analysis needed
        - action_oriented: Whether to include specific action recommendations
        """
        intent_configs = {
            "investment_sizing": {
                "emphasis": ["valuation", "bull_bear_cases", "position_sizing", "risk_reward"],
                "require_bear_case": True,
                "require_kill_criteria": True,
                "require_ecosystem_analysis": True,
                "action_oriented": True,
                "description": "Full investment analysis for position sizing decision"
            },
            "entry_exit_timing": {
                "emphasis": ["catalysts", "technical_levels", "event_calendar", "momentum"],
                "require_bear_case": True,
                "require_kill_criteria": True,
                "require_ecosystem_analysis": False,
                "action_oriented": True,
                "description": "Timing-focused analysis for entry/exit decisions"
            },
            "risk_assessment": {
                "emphasis": ["downside_scenarios", "tail_risks", "correlation_risks", "liquidity"],
                "require_bear_case": True,
                "require_kill_criteria": True,
                "require_ecosystem_analysis": True,
                "action_oriented": True,
                "description": "Risk-focused analysis emphasizing downside scenarios"
            },
            "due_diligence": {
                "emphasis": ["verification", "red_flags", "management_quality", "financial_health"],
                "require_bear_case": True,
                "require_kill_criteria": True,
                "require_ecosystem_analysis": True,
                "action_oriented": True,
                "description": "Verification-focused analysis for partnership/acquisition decisions"
            },
            "education": {
                "emphasis": ["context", "history", "market_structure", "key_players"],
                "require_bear_case": False,
                "require_kill_criteria": False,
                "require_ecosystem_analysis": False,
                "action_oriented": False,
                "description": "Educational overview without specific action recommendations"
            }
        }

        # Default config when intent not specified (assume investment decision)
        default_config = {
            "emphasis": ["comprehensive"],
            "require_bear_case": True,
            "require_kill_criteria": True,
            "require_ecosystem_analysis": True,
            "action_oriented": True,
            "description": "Comprehensive analysis (intent not specified)"
        }

        return intent_configs.get(self.intent, default_config)

    class Config:
        extra = "ignore"
