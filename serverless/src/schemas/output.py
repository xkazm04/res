"""Actor output schemas."""

from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class ExecutiveSummary(BaseModel):
    """Condensed summary for quick consumption and email delivery."""

    session_id: str
    query: str
    template: str
    status: str

    # Key metrics
    findings_count: int = 0
    high_confidence_findings: int = 0  # confidence > 0.8
    sources_count: int = 0
    high_credibility_sources: int = 0  # credibility > 0.8
    perspectives_count: int = 0

    # Top findings (summaries only)
    top_findings: List[str] = Field(default_factory=list)

    # Expert consensus (aggregated from all perspectives)
    expert_recommendations: List[str] = Field(default_factory=list)
    expert_warnings: List[str] = Field(default_factory=list)
    key_insights: List[str] = Field(default_factory=list)

    # Report preview
    report_preview: str = ""

    # Cost and timing
    total_cost_usd: float = 0.0
    execution_time_seconds: float = 0.0

    # Timestamps
    completed_at: Optional[datetime] = None


class Source(BaseModel):
    """A source from grounded search."""

    url: str
    title: str
    domain: str
    snippet: str = ""
    source_type: str = "web"
    credibility_score: Optional[float] = None
    credibility_label: Optional[str] = None


class Finding(BaseModel):
    """An extracted finding from research."""

    finding_id: str
    finding_type: str  # fact, event, actor, relationship, financial, evidence, pattern, gap
    content: str
    summary: Optional[str] = None
    confidence_score: float = 0.5
    temporal_context: str = "present"  # past, present, ongoing, prediction
    extracted_data: Optional[Dict[str, Any]] = None
    supporting_sources: List[Dict[str, str]] = Field(default_factory=list)

    # Date information extracted from finding
    date_referenced: Optional[str] = None  # Specific date (e.g., "2024-12-15", "December 2024")
    date_range: Optional[str] = None  # Date range (e.g., "Q4 2024", "2024-2025")


class Prediction(BaseModel):
    """A structured prediction with rationale and evidence."""

    prediction: str  # What will happen
    rationale: str = ""  # Why this is expected
    confidence: str = "medium"  # "high", "medium", "low"
    timeline: str = ""  # When this is expected (e.g., "Q1 2025", "6-12 months")
    supporting_sources: List[str] = Field(default_factory=list)  # URLs or source titles

    @field_validator("confidence", mode="before")
    @classmethod
    def convert_confidence(cls, v):
        """Convert numeric confidence to string label."""
        if isinstance(v, (int, float)):
            if v >= 0.8:
                return "high"
            elif v >= 0.5:
                return "medium"
            else:
                return "low"
        return str(v) if v else "medium"


class Perspective(BaseModel):
    """A perspective analysis result."""

    perspective_type: str
    analysis_text: str
    key_insights: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)  # Kept for backward compatibility
    predictions: List[Prediction] = Field(default_factory=list)  # New structured predictions
    warnings: List[str] = Field(default_factory=list)
    confidence: float = 0.5


class CostSummary(BaseModel):
    """Token and cost tracking summary."""

    total_tokens: int = 0
    input_tokens: int = 0
    output_tokens: int = 0
    gemini_cost_usd: float = 0.0
    openrouter_cost_usd: float = 0.0
    total_cost_usd: float = 0.0


class ActorOutput(BaseModel):
    """Complete output from the Deep Research Actor."""

    # Session info
    session_id: str
    query: str
    template: str
    status: str  # completed, failed, partial

    # Research results
    findings: List[Finding] = Field(default_factory=list)
    perspectives: List[Perspective] = Field(default_factory=list)
    sources: List[Source] = Field(default_factory=list)
    search_queries_executed: List[str] = Field(default_factory=list)

    # Report (if generated)
    report_markdown: Optional[str] = None
    report_html: Optional[str] = None

    # Metadata
    cost_summary: CostSummary = Field(default_factory=CostSummary)
    execution_time_seconds: float = 0.0
    supabase_session_id: Optional[str] = None

    # Errors (if any)
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)

    # Timestamps
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    # Cache information
    cache_hit: bool = False  # Whether result was served from cache
    cache_extended: bool = False  # Whether cached result was extended with new findings
    original_cached_at: Optional[datetime] = None  # When the cached result was originally created
