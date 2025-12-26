"""Actor output schemas."""

from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


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


class Perspective(BaseModel):
    """A perspective analysis result."""

    perspective_type: str
    analysis_text: str
    key_insights: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
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
