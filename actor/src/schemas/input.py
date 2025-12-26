"""Actor input schema with validation."""

from typing import List, Optional
from pydantic import BaseModel, Field


class ActorInput(BaseModel):
    """Input parameters for the Deep Research Actor."""

    # Core research
    query: str = Field(..., description="Research question (required)")
    template: str = Field(
        default="investigative",
        description="Research template: investigative | financial | competitive | legal"
    )
    granularity: str = Field(
        default="standard",
        description="Research depth: quick | standard | deep"
    )
    perspectives: Optional[List[str]] = Field(
        default=None,
        description="Override default perspectives for analysis"
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
        default=False,
        description="Whether to generate formatted report"
    )
    report_variant: str = Field(
        default="full_report",
        description="Report type: executive_summary | full_report | investment_thesis"
    )
    report_format: str = Field(
        default="markdown",
        description="Report format: markdown | html | json"
    )
    report_title: Optional[str] = Field(
        default=None,
        description="Custom report title"
    )

    # Database options
    save_to_supabase: bool = Field(
        default=True,
        description="Whether to save results to Supabase"
    )
    workspace_id: str = Field(
        default="apify",
        description="Workspace identifier for storage"
    )

    # API keys (use env vars if not provided)
    google_api_key: Optional[str] = Field(
        default=None,
        description="Google API key for Gemini"
    )
    openrouter_api_key: Optional[str] = Field(
        default=None,
        description="OpenRouter API key for OCR"
    )
    supabase_url: Optional[str] = Field(
        default=None,
        description="Supabase project URL"
    )
    supabase_key: Optional[str] = Field(
        default=None,
        description="Supabase anon key"
    )

    # Limits
    max_searches: int = Field(
        default=5,
        ge=1,
        le=15,
        description="Maximum web searches (1-15)"
    )
    max_sources_per_search: int = Field(
        default=10,
        ge=1,
        le=20,
        description="Max sources per search (1-20)"
    )

    class Config:
        extra = "ignore"
