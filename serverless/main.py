"""Deep Research Cloud Run Service.

FastAPI application that handles long-running research tasks.
Called by the Apify Actor as a thin dispatcher.
"""

import os
import base64
import logging
import asyncio
import httpx
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import uuid4

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from src.clients.gemini import GeminiClient
from src.clients.supabase import SupabaseClient
from src.clients.openrouter import OpenRouterClient
from src.clients.r2 import R2Client
from src.clients.resend import ResendClient
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


class AsyncResearchRequest(BaseModel):
    """Input schema for async research requests (fire-and-forget)."""
    query: str = Field(..., description="Research query")
    template: str = Field(default="investigative", description="Research template")
    granularity: str = Field(default="standard", description="Research depth")
    max_searches: int = Field(default=5, ge=1, le=20)
    perspectives: Optional[List[str]] = Field(default=None)
    input_file_url: Optional[str] = Field(default=None)
    input_text: Optional[str] = Field(default=None)
    workspace_id: str = Field(default="apify")

    # API Keys
    gemini_api_key: Optional[str] = Field(default=None)
    supabase_url: Optional[str] = Field(default=None)
    supabase_key: Optional[str] = Field(default=None)
    resend_api_key: Optional[str] = Field(default=None)

    # Report options
    generate_report: bool = Field(default=True)
    report_format: str = Field(default="html")
    report_variant: str = Field(default="full_report")
    report_title: Optional[str] = Field(default=None)

    # Email options
    send_email: bool = Field(default=False)
    email_to: Optional[str] = Field(default=None)
    email_subject: Optional[str] = Field(default=None)

    # Callback
    callback_url: Optional[str] = Field(default=None)

    # R2 storage options
    r2_job_id: Optional[str] = Field(default=None)
    r2_account_id: Optional[str] = Field(default=None)
    r2_access_key_id: Optional[str] = Field(default=None)
    r2_secret_access_key: Optional[str] = Field(default=None)
    r2_bucket_name: Optional[str] = Field(default=None)
    r2_public_url: Optional[str] = Field(default=None)

    # Flags
    use_cache: bool = Field(default=True)
    extend_cache: bool = Field(default=True)
    save_to_db: bool = Field(default=True)
    async_mode: bool = Field(default=True)


class AsyncResearchResponse(BaseModel):
    """Response for async research dispatch."""
    job_id: str
    status: str
    message: str


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
            openrouter_client = OpenRouterClient(api_key=openrouter_key)
            ocr_service = OCRService(openrouter_client=openrouter_client)

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


async def run_async_research(request: AsyncResearchRequest, job_id: str):
    """Background task for async research execution."""
    logger.info(f"[{job_id}] Starting async research: {request.query[:50]}...")

    try:
        # Get API keys
        gemini_key = request.gemini_api_key or os.getenv("GEMINI_API_KEY")
        if not gemini_key:
            logger.error(f"[{job_id}] GEMINI_API_KEY required")
            return

        # Initialize clients
        gemini_client = GeminiClient(api_key=gemini_key)

        supabase_client = None
        supabase_url = request.supabase_url or os.getenv("SUPABASE_URL")
        supabase_key = request.supabase_key or os.getenv("SUPABASE_KEY")
        if supabase_url and supabase_key:
            supabase_client = SupabaseClient(url=supabase_url, key=supabase_key)

        ocr_service = None
        openrouter_key = os.getenv("OPENROUTER_API_KEY")
        if openrouter_key:
            openrouter_client = OpenRouterClient(api_key=openrouter_key)
            ocr_service = OCRService(openrouter_client=openrouter_client)

        # Execute research
        research_service = ResearchService(
            gemini_client=gemini_client,
            supabase_client=supabase_client,
            ocr_service=ocr_service,
        )

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

        logger.info(f"[{job_id}] Research completed: {len(result.get('findings', []))} findings")

        # Generate report if requested
        report_html = None
        report_markdown = None

        if request.generate_report:
            report_service = ReportService()
            report_markdown = report_service.generate_markdown(
                research_result=result,
                variant=request.report_variant,
                title=request.report_title,
            )

            if request.report_format == "html":
                report_html = report_service.generate_html(
                    markdown_content=report_markdown,
                    title=request.report_title or f"Research: {request.query[:40]}",
                    research_result=result,
                )

            logger.info(f"[{job_id}] Report generated")

        # Upload to R2 if configured
        if report_html and request.r2_job_id and request.r2_account_id:
            try:
                r2_client = R2Client(
                    account_id=request.r2_account_id,
                    access_key_id=request.r2_access_key_id,
                    secret_access_key=request.r2_secret_access_key,
                    bucket_name=request.r2_bucket_name or "research-reports",
                    public_url_base=request.r2_public_url,
                )
                report_url = r2_client.upload_report(
                    job_id=request.r2_job_id,
                    html_content=report_html,
                    query=request.query,
                    template=request.template,
                )
                logger.info(f"[{job_id}] Report uploaded to R2: {report_url}")
            except Exception as e:
                logger.warning(f"[{job_id}] R2 upload failed: {e}")

        # Send email if requested
        if request.send_email and request.email_to:
            resend_key = request.resend_api_key or os.getenv("RESEND_API_KEY")
            if resend_key:
                try:
                    resend_client = ResendClient(api_key=resend_key)

                    # Build executive summary for email
                    findings = result.get("findings", [])
                    sources = result.get("sources", [])
                    perspectives = result.get("perspectives", [])

                    high_conf = [f for f in findings if f.get("confidence_score", 0) >= 0.8]
                    high_cred = [s for s in sources if s.get("credibility_score", 0) >= 0.8]

                    exec_summary = {
                        "findings_count": len(findings),
                        "high_confidence_findings": len(high_conf),
                        "sources_count": len(sources),
                        "high_credibility_sources": len(high_cred),
                        "perspectives_count": len(perspectives),
                        "total_cost_usd": result.get("cost_summary", {}).get("total_cost_usd", 0),
                        "execution_time_seconds": result.get("execution_time_seconds", 0),
                        "top_findings": [f.get("summary", f.get("content", "")[:100]) for f in findings[:5]],
                        "expert_recommendations": [],
                        "expert_warnings": [],
                        "key_insights": [],
                    }

                    # Collect from perspectives
                    for p in perspectives:
                        exec_summary["expert_recommendations"].extend(p.get("recommendations", [])[:2])
                        exec_summary["expert_warnings"].extend(p.get("warnings", [])[:1])
                        exec_summary["key_insights"].extend(p.get("key_insights", [])[:2])

                    email_content = resend_client.build_report_email(
                        query=request.query,
                        template=request.template,
                        executive_summary=exec_summary,
                        report_html=report_html,
                        report_markdown=report_markdown,
                    )

                    # Prepare attachments
                    attachments = []
                    if report_markdown:
                        attachments.append({
                            "filename": "research_report.md",
                            "content": base64.b64encode(report_markdown.encode()).decode(),
                        })
                    if report_html:
                        attachments.append({
                            "filename": "research_report.html",
                            "content": base64.b64encode(report_html.encode()).decode(),
                        })

                    email_result = await resend_client.send_report(
                        to_email=request.email_to,
                        subject=request.email_subject or email_content["subject"],
                        html_content=email_content["html"],
                        text_content=email_content["text"],
                        attachments=attachments if attachments else None,
                    )

                    if email_result["success"]:
                        logger.info(f"[{job_id}] Email sent to {request.email_to}")
                    else:
                        logger.warning(f"[{job_id}] Email failed: {email_result.get('error')}")

                except Exception as e:
                    logger.warning(f"[{job_id}] Email delivery failed: {e}")

        # Post to callback URL if provided
        if request.callback_url:
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    callback_data = {
                        "job_id": job_id,
                        "status": result.get("status", "completed"),
                        "session_id": result.get("session_id"),
                        "findings_count": len(result.get("findings", [])),
                        "sources_count": len(result.get("sources", [])),
                        "execution_time_seconds": result.get("execution_time_seconds", 0),
                    }
                    await client.post(request.callback_url, json=callback_data)
                    logger.info(f"[{job_id}] Callback posted to {request.callback_url}")
            except Exception as e:
                logger.warning(f"[{job_id}] Callback failed: {e}")

        logger.info(f"[{job_id}] Async research complete")

    except Exception as e:
        logger.error(f"[{job_id}] Async research failed: {e}", exc_info=True)


@app.post("/research/async", response_model=AsyncResearchResponse)
async def dispatch_async_research(
    request: AsyncResearchRequest,
    background_tasks: BackgroundTasks,
):
    """
    Fire-and-forget research dispatch.

    Accepts the request, acknowledges immediately, and processes in background.
    Results are delivered via R2 upload, email, and/or callback URL.
    """
    # Generate job ID
    job_id = request.r2_job_id or str(uuid4())[:12]

    logger.info(f"Dispatching async research job: {job_id}")

    # Add to background tasks
    background_tasks.add_task(run_async_research, request, job_id)

    return AsyncResearchResponse(
        job_id=job_id,
        status="processing",
        message="Research job dispatched. Results will be delivered via configured channels.",
    )


@app.get("/")
async def root():
    """Root endpoint with service info."""
    return {
        "service": "Deep Research Engine",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "research": "/research",
            "research_async": "/research/async",
            "report": "/report",
        }
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
