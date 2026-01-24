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
        description="Research template: investigative | financial | competitive | legal | tech_market"
    )
    granularity: str = Field(
        default="standard",
        description="Research depth: quick | standard | deep"
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
        description="Report type: executive_summary | full_report | investment_thesis"
    )
    report_format: str = Field(
        default="markdown",
        description="Report format: markdown | html"
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

    class Config:
        extra = "ignore"
