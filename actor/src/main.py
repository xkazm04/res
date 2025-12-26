"""Deep Research Actor - Main entry point.

This actor performs AI-powered deep research using Gemini with Google Search grounding.
"""

import asyncio
import logging
from datetime import datetime
from typing import Optional

from .config import override_settings
from .schemas import ActorInput, ActorOutput, Finding, Source, Perspective, CostSummary
from .clients import GeminiClient, OpenRouterClient, SupabaseClient
from .services import OCRService, ResearchService, ReportService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)


async def run_actor(actor_input: ActorInput) -> ActorOutput:
    """
    Execute the Deep Research Actor.

    Args:
        actor_input: Validated input parameters

    Returns:
        ActorOutput with research results
    """
    started_at = datetime.utcnow()
    logger.info(f"Starting research: {actor_input.query[:50]}...")

    # Get settings with overrides
    settings = override_settings(
        google_api_key=actor_input.google_api_key,
        openrouter_api_key=actor_input.openrouter_api_key,
        supabase_url=actor_input.supabase_url,
        supabase_key=actor_input.supabase_key,
    )

    # Validate required API key
    if not settings.google_api_key:
        return ActorOutput(
            session_id="error",
            query=actor_input.query,
            template=actor_input.template,
            status="failed",
            errors=["Google API key is required. Set GOOGLE_API_KEY env var or provide in input."],
            started_at=started_at,
            completed_at=datetime.utcnow(),
        )

    # Initialize clients
    try:
        gemini_client = GeminiClient(
            api_key=settings.google_api_key,
            model=settings.gemini_model,
        )
    except Exception as e:
        return ActorOutput(
            session_id="error",
            query=actor_input.query,
            template=actor_input.template,
            status="failed",
            errors=[f"Failed to initialize Gemini client: {str(e)}"],
            started_at=started_at,
            completed_at=datetime.utcnow(),
        )

    # Optional: OpenRouter for OCR
    ocr_service = None
    if settings.openrouter_api_key:
        try:
            openrouter_client = OpenRouterClient(
                api_key=settings.openrouter_api_key,
                base_url=settings.openrouter_base_url,
                model=settings.openrouter_ocr_model,
            )
            ocr_service = OCRService(openrouter_client)
        except Exception as e:
            logger.warning(f"Failed to initialize OCR service: {e}")

    # Optional: Supabase for persistence
    supabase_client = None
    if actor_input.save_to_supabase and settings.supabase_url and settings.supabase_key:
        try:
            supabase_client = SupabaseClient(
                url=settings.supabase_url,
                key=settings.supabase_key,
                workspace_id=actor_input.workspace_id,
            )
        except Exception as e:
            logger.warning(f"Failed to initialize Supabase client: {e}")

    # Initialize research service
    research_service = ResearchService(
        gemini_client=gemini_client,
        supabase_client=supabase_client,
        ocr_service=ocr_service,
    )

    # Execute research
    try:
        result = await research_service.execute_research(
            query=actor_input.query,
            template_type=actor_input.template,
            granularity=actor_input.granularity,
            max_searches=actor_input.max_searches,
            perspectives=actor_input.perspectives,
            input_file_url=actor_input.input_file_url,
            input_text=actor_input.input_text,
            save_to_db=actor_input.save_to_supabase and supabase_client is not None,
            workspace_id=actor_input.workspace_id,
        )
    except Exception as e:
        logger.error(f"Research failed: {e}")
        return ActorOutput(
            session_id="error",
            query=actor_input.query,
            template=actor_input.template,
            status="failed",
            errors=[f"Research execution failed: {str(e)}"],
            started_at=started_at,
            completed_at=datetime.utcnow(),
        )

    # Generate report if requested
    report_markdown = None
    report_html = None

    if actor_input.generate_report:
        try:
            report_service = ReportService()
            report_markdown = report_service.generate_markdown(
                research_result=result,
                variant=actor_input.report_variant,
                title=actor_input.report_title,
            )

            if actor_input.report_format == "html":
                report_html = report_service.generate_html(
                    markdown_content=report_markdown,
                    title=actor_input.report_title or f"Research: {actor_input.query[:40]}",
                )
        except Exception as e:
            logger.warning(f"Report generation failed: {e}")
            result.setdefault("warnings", []).append(f"Report generation failed: {str(e)}")

    # Build output
    completed_at = datetime.utcnow()

    # Convert findings
    findings = [
        Finding(
            finding_id=f.get("finding_id", f"f{i}"),
            finding_type=f.get("finding_type", "fact"),
            content=f.get("content", ""),
            summary=f.get("summary"),
            confidence_score=f.get("confidence_score", 0.5),
            temporal_context=f.get("temporal_context", "present"),
            extracted_data=f.get("extracted_data"),
            supporting_sources=f.get("supporting_sources", []),
        )
        for i, f in enumerate(result.get("findings", []))
    ]

    # Convert sources
    sources = [
        Source(
            url=s.get("url", ""),
            title=s.get("title", ""),
            domain=s.get("domain", ""),
            snippet=s.get("snippet", ""),
            source_type=s.get("source_type", "web"),
            credibility_score=s.get("credibility_score"),
            credibility_label=s.get("credibility_label"),
        )
        for s in result.get("sources", [])
    ]

    # Convert perspectives
    perspectives = [
        Perspective(
            perspective_type=p.get("perspective_type", "unknown"),
            analysis_text=p.get("analysis_text", ""),
            key_insights=p.get("key_insights", []),
            recommendations=p.get("recommendations", []),
            warnings=p.get("warnings", []),
            confidence=p.get("confidence", 0.5),
        )
        for p in result.get("perspectives", [])
    ]

    # Convert cost summary
    cost_data = result.get("cost_summary", {})
    cost_summary = CostSummary(
        total_tokens=cost_data.get("total_tokens", 0),
        input_tokens=cost_data.get("input_tokens", 0),
        output_tokens=cost_data.get("output_tokens", 0),
        gemini_cost_usd=cost_data.get("gemini_cost_usd", 0),
        openrouter_cost_usd=cost_data.get("openrouter_cost_usd", 0),
        total_cost_usd=cost_data.get("total_cost_usd", 0),
    )

    return ActorOutput(
        session_id=result.get("session_id", "unknown"),
        query=actor_input.query,
        template=actor_input.template,
        status=result.get("status", "completed"),
        findings=findings,
        perspectives=perspectives,
        sources=sources,
        search_queries_executed=result.get("search_queries_executed", []),
        report_markdown=report_markdown,
        report_html=report_html,
        cost_summary=cost_summary,
        execution_time_seconds=result.get("execution_time_seconds", 0),
        supabase_session_id=result.get("supabase_session_id"),
        errors=result.get("errors", []),
        warnings=result.get("warnings", []),
        started_at=started_at,
        completed_at=completed_at,
    )


async def main():
    """Main entry point for Apify actor."""
    try:
        from apify import Actor
        APIFY_AVAILABLE = True
    except ImportError:
        APIFY_AVAILABLE = False
        Actor = None

    if APIFY_AVAILABLE:
        async with Actor:
            # Get input from Apify
            actor_input_raw = await Actor.get_input() or {}
            actor_input = ActorInput(**actor_input_raw)

            # Run research
            output = await run_actor(actor_input)

            # Store output
            await Actor.set_value("OUTPUT", output.model_dump())

            # Store report if generated
            if output.report_markdown:
                await Actor.set_value("REPORT.md", output.report_markdown)
            if output.report_html:
                await Actor.set_value("REPORT.html", output.report_html)

            # Push findings to dataset
            for finding in output.findings:
                await Actor.push_data({
                    "session_id": output.session_id,
                    **finding.model_dump()
                })

            logger.info(f"Research completed: {len(output.findings)} findings")

    else:
        # Local execution for testing
        logger.info("Running in local mode (Apify SDK not available)")

        # Example input for testing
        test_input = ActorInput(
            query="What is Apple's current financial position and stock outlook?",
            template="financial",
            granularity="quick",
            max_searches=3,
            generate_report=True,
            save_to_supabase=False,
        )

        output = await run_actor(test_input)
        print(f"\nResults: {len(output.findings)} findings, {len(output.sources)} sources")
        print(f"Status: {output.status}")
        print(f"Execution time: {output.execution_time_seconds:.1f}s")

        if output.errors:
            print(f"Errors: {output.errors}")

        if output.report_markdown:
            print("\n" + "="*50)
            print(output.report_markdown[:2000])


if __name__ == "__main__":
    asyncio.run(main())
