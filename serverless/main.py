"""Deep Research Cloud Run Service.

FastAPI application that handles long-running research tasks.
Called by the Apify Actor as a thin dispatcher.
"""

import os
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from src.clients.gemini import GeminiClient
from src.clients.supabase import SupabaseClient
from src.services.research import ResearchService
from src.services.report import ReportService
from src.services.ocr import OCRService
from src.services.cost_tracker import CostTracker

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="Deep Research Engine",
    description="Long-running research service for Apify Actor",
    version="1.0.0",
)


class ResearchRequest(BaseModel):
    """Input schema for research requests."""
    query: str = Field(..., description="Research query")
    template: str = Field(default="investigative", description="Research template")
    granularity: str = Field(default="standard", description="Research depth")
    max_searches: int = Field(default=5, ge=1, le=20)
    perspectives: Optional[List[str]] = Field(default=None)
    input_file_url: Optional[str] = Field(default=None)
    input_text: Optional[str] = Field(default=None)
    save_to_db: bool = Field(default=True)
    workspace_id: str = Field(default="apify")
    use_cache: bool = Field(default=True)
    extend_cache: bool = Field(default=True)

    # API Keys (passed from Actor)
    gemini_api_key: Optional[str] = Field(default=None)
    supabase_url: Optional[str] = Field(default=None)
    supabase_key: Optional[str] = Field(default=None)
    langsmith_api_key: Optional[str] = Field(default=None)


class ResearchResponse(BaseModel):
    """Output schema for research responses."""
    session_id: str
    query: str
    template: str
    status: str
    findings: List[Dict[str, Any]]
    perspectives: List[Dict[str, Any]]
    sources: List[Dict[str, Any]]
    search_queries_executed: List[str]
    cost_summary: Dict[str, Any]
    execution_time_seconds: float
    cache_hit: bool = False
    cache_extended: bool = False
    original_cached_at: Optional[str] = None
    errors: List[str] = []
    warnings: List[str] = []


class ReportRequest(BaseModel):
    """Input schema for report generation."""
    research_result: Dict[str, Any]
    title: Optional[str] = None
    variant: str = Field(default="full_report")
    include_html: bool = Field(default=True)


class ReportResponse(BaseModel):
    """Output schema for report generation."""
    markdown: str
    html: Optional[str] = None


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    timestamp: str
    version: str


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint for Cloud Run."""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow().isoformat(),
        version="1.0.0"
    )


@app.post("/research", response_model=ResearchResponse)
async def execute_research(request: ResearchRequest):
    """
    Execute deep research on a query.

    This is the main endpoint called by the Apify Actor.
    Handles the long-running research process (5-20 minutes).
    """
    logger.info(f"Starting research: {request.query[:50]}...")

    try:
        # Get API keys from request or environment
        gemini_key = request.gemini_api_key or os.getenv("GEMINI_API_KEY")
        if not gemini_key:
            raise HTTPException(status_code=400, detail="GEMINI_API_KEY required")

        # Initialize clients
        gemini_client = GeminiClient(api_key=gemini_key)

        # Optional Supabase client
        supabase_client = None
        supabase_url = request.supabase_url or os.getenv("SUPABASE_URL")
        supabase_key = request.supabase_key or os.getenv("SUPABASE_KEY")
        if supabase_url and supabase_key:
            supabase_client = SupabaseClient(url=supabase_url, key=supabase_key)

        # Optional OCR service for file processing
        ocr_service = None
        openrouter_key = os.getenv("OPENROUTER_API_KEY")
        if openrouter_key:
            ocr_service = OCRService(openrouter_api_key=openrouter_key)

        # Initialize research service
        research_service = ResearchService(
            gemini_client=gemini_client,
            supabase_client=supabase_client,
            ocr_service=ocr_service,
        )

        # Execute research
        result = await research_service.execute_research(
            query=request.query,
            template_type=request.template,
            granularity=request.granularity,
            max_searches=request.max_searches,
            perspectives=request.perspectives,
            input_file_url=request.input_file_url,
            input_text=request.input_text,
            save_to_db=request.save_to_db,
            workspace_id=request.workspace_id,
            use_cache=request.use_cache,
            extend_cache=request.extend_cache,
        )

        logger.info(f"Research completed: {result.get('session_id')}")

        return ResearchResponse(
            session_id=result.get("session_id", ""),
            query=result.get("query", ""),
            template=result.get("template", ""),
            status=result.get("status", "unknown"),
            findings=result.get("findings", []),
            perspectives=result.get("perspectives", []),
            sources=result.get("sources", []),
            search_queries_executed=result.get("search_queries_executed", []),
            cost_summary=result.get("cost_summary", {}),
            execution_time_seconds=result.get("execution_time_seconds", 0),
            cache_hit=result.get("cache_hit", False),
            cache_extended=result.get("cache_extended", False),
            original_cached_at=result.get("original_cached_at"),
            errors=result.get("errors", []),
            warnings=result.get("warnings", []),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Research failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/report", response_model=ReportResponse)
async def generate_report(request: ReportRequest):
    """
    Generate markdown and HTML reports from research results.

    Can be called separately after research completes.
    """
    logger.info("Generating report...")

    try:
        report_service = ReportService()

        # Generate markdown
        markdown = report_service.generate_markdown(
            research_result=request.research_result,
            variant=request.variant,
            title=request.title,
        )

        # Generate HTML if requested
        html = None
        if request.include_html:
            html = report_service.generate_html(
                markdown_content=markdown,
                title=request.title or "Research Report",
                research_result=request.research_result,
            )

        return ReportResponse(markdown=markdown, html=html)

    except Exception as e:
        logger.error(f"Report generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
async def root():
    """Root endpoint with service info."""
    return {
        "service": "Deep Research Engine",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "research": "/research",
            "report": "/report",
        }
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
