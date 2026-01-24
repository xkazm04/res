"""Deep Research Actor - Main entry point.

This actor performs AI-powered deep research using Gemini with Google Search grounding.
"""

import asyncio
import base64
import logging
import os
from datetime import datetime
from typing import Optional

from .config import override_settings, get_settings
from .schemas import ActorInput, ActorOutput, ExecutiveSummary, Finding, Source, Perspective, Prediction, CostSummary
from .clients import GeminiClient, OpenRouterClient, SupabaseClient, ResendClient, CloudRunClient, R2Client
from .services import OCRService, ResearchService, ReportService, ProgressEmitter, StateManager
from .services.transform import transform_research_result


# Auto-select best report variant for each template
TEMPLATE_REPORT_VARIANTS = {
    "tech_market": "full_report",
    "financial": "investment_thesis",
    "competitive": "full_report",
    "investigative": "full_report",
    "legal": "full_report",
    "contract": "decision_brief",
    "understanding": "credibility_report",
    "due_diligence": "risk_summary",
    "purchase_decision": "buyer_guide",
    "reputation": "trust_report",
}


def get_report_variant_for_template(template: str) -> str:
    """Get the best report variant for a given template."""
    return TEMPLATE_REPORT_VARIANTS.get(template, "full_report")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)


def build_executive_summary(output: ActorOutput) -> ExecutiveSummary:
    """Build executive summary from actor output."""
    # Count high confidence findings
    high_conf_findings = [f for f in output.findings if f.confidence_score >= 0.8]

    # Count high credibility sources
    high_cred_sources = [s for s in output.sources if s.credibility_score and s.credibility_score >= 0.8]

    # Get top 5 findings by confidence
    sorted_findings = sorted(output.findings, key=lambda f: f.confidence_score, reverse=True)
    top_findings = [
        f.summary or f.content[:100] + "..." if len(f.content) > 100 else f.content
        for f in sorted_findings[:5]
    ]

    # Aggregate expert recommendations, warnings, insights
    all_recommendations = []
    all_warnings = []
    all_insights = []

    for p in output.perspectives:
        all_recommendations.extend(p.recommendations[:2])  # Top 2 per perspective
        all_warnings.extend(p.warnings[:1])  # Top 1 per perspective
        all_insights.extend(p.key_insights[:2])  # Top 2 per perspective

    # Deduplicate and limit
    seen_recs = set()
    unique_recommendations = []
    for r in all_recommendations:
        if r.lower() not in seen_recs:
            seen_recs.add(r.lower())
            unique_recommendations.append(r)
            if len(unique_recommendations) >= 5:
                break

    seen_warnings = set()
    unique_warnings = []
    for w in all_warnings:
        if w.lower() not in seen_warnings:
            seen_warnings.add(w.lower())
            unique_warnings.append(w)
            if len(unique_warnings) >= 3:
                break

    seen_insights = set()
    unique_insights = []
    for i in all_insights:
        if i.lower() not in seen_insights:
            seen_insights.add(i.lower())
            unique_insights.append(i)
            if len(unique_insights) >= 5:
                break

    # Report preview
    report_preview = ""
    if output.report_markdown:
        report_preview = output.report_markdown[:500]
        if len(output.report_markdown) > 500:
            report_preview += "..."

    return ExecutiveSummary(
        session_id=output.session_id,
        query=output.query,
        template=output.template,
        status=output.status,
        findings_count=len(output.findings),
        high_confidence_findings=len(high_conf_findings),
        sources_count=len(output.sources),
        high_credibility_sources=len(high_cred_sources),
        perspectives_count=len(output.perspectives),
        top_findings=top_findings,
        expert_recommendations=unique_recommendations,
        expert_warnings=unique_warnings,
        key_insights=unique_insights,
        report_preview=report_preview,
        total_cost_usd=output.cost_summary.total_cost_usd,
        execution_time_seconds=output.execution_time_seconds,
        completed_at=output.completed_at,
    )


async def run_actor(
    actor_input: ActorInput,
    progress_emitter: Optional[ProgressEmitter] = None,
) -> ActorOutput:
    """
    Execute the Deep Research Actor.

    Args:
        actor_input: Validated input parameters
        progress_emitter: Optional unified progress emitter for status and webhook events

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
        resend_api_key=actor_input.resend_api_key,
        cloud_run_url=actor_input.cloud_run_url,
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

    
    # === CLOUD RUN DISPATCH (fire-and-forget mode) ===
    # Dispatch to Cloud Run and return immediately - Cloud Run handles everything
    if settings.cloud_run_url:
        logger.info(f"Dispatching to Cloud Run (fire-and-forget): {settings.cloud_run_url}")

        try:
            # Initialize R2 client for report storage (if configured)
            r2_client = None
            report_url = None
            job_id = None

            if settings.r2_account_id and settings.r2_access_key_id and settings.r2_secret_access_key:
                try:
                    r2_client = R2Client(
                        account_id=settings.r2_account_id,
                        access_key_id=settings.r2_access_key_id,
                        secret_access_key=settings.r2_secret_access_key,
                        bucket_name=settings.r2_bucket_name,
                        public_url_base=settings.r2_public_url or None,
                    )

                    # Generate job_id and upload placeholder
                    job_id = r2_client.generate_job_id(actor_input.query, actor_input.template)
                    report_url = r2_client.upload_placeholder(
                        job_id=job_id,
                        query=actor_input.query,
                        template=actor_input.template,
                    )
                    logger.info(f"Placeholder uploaded to R2: {report_url}")

                except Exception as e:
                    logger.warning(f"R2 placeholder upload failed (continuing without): {e}")
                    r2_client = None

            cloud_run_client = CloudRunClient(
                service_url=settings.cloud_run_url,
                dispatch_timeout=15,  # Short timeout for acknowledgment only
            )

            # Auto-select best report variant for template
            report_variant = get_report_variant_for_template(actor_input.template)

            # Fire-and-forget dispatch - Cloud Run handles research, report, email, R2 upload
            dispatch_result = await cloud_run_client.dispatch_async(
                query=actor_input.query,
                template=actor_input.template,
                granularity=actor_input.granularity,
                max_searches=actor_input.get_max_searches(),
                perspectives=actor_input.perspectives,
                input_file_url=actor_input.input_file_url,
                input_text=actor_input.input_text,
                workspace_id=actor_input.workspace_id,
                gemini_api_key=settings.google_api_key,
                supabase_url=settings.supabase_url,
                supabase_key=settings.supabase_key,
                resend_api_key=settings.resend_api_key,
                # Report options
                generate_report=actor_input.generate_report,
                report_format=actor_input.report_format,
                report_variant=report_variant,
                report_title=actor_input.report_title,
                # Email options
                send_email=actor_input.send_email,
                email_to=actor_input.email_to,
                email_subject=actor_input.email_subject,
                # Progress webhook
                callback_url=actor_input.progress_webhook_url,
                # R2 config for Cloud Run to upload final report
                r2_job_id=job_id,
                r2_account_id=settings.r2_account_id if r2_client else None,
                r2_access_key_id=settings.r2_access_key_id if r2_client else None,
                r2_secret_access_key=settings.r2_secret_access_key if r2_client else None,
                r2_bucket_name=settings.r2_bucket_name if r2_client else None,
                r2_public_url=settings.r2_public_url if r2_client else None,
            )

            await cloud_run_client.close()

            # Use job_id from R2 if available, otherwise from dispatch result
            final_job_id = job_id or dispatch_result.get("job_id", "unknown")
            logger.info(f"Cloud Run job dispatched: {final_job_id}")

            # Return immediately with dispatched status and report URL
            return ActorOutput(
                session_id=final_job_id,
                query=actor_input.query,
                template=actor_input.template,
                status="processing",  # More accurate than "dispatched"
                findings=[],
                perspectives=[],
                sources=[],
                search_queries_executed=[],
                report_markdown=None,
                report_html=None,
                report_url=report_url,  # Pre-generated URL with placeholder
                cost_summary=CostSummary(
                    total_cost_usd=0.005,  # Minimal Apify compute cost
                    gemini_cost_usd=0,
                    gemini_tokens_used=0,
                    searches_performed=0,
                ),
                execution_time_seconds=0,
                errors=[],
                warnings=["Research is processing. Visit report_url to view results when ready." if report_url else "Research dispatched to Cloud Run."],
                started_at=started_at,
                completed_at=datetime.utcnow(),
                cache_hit=False,
                cache_extended=False,
            )

        except Exception as e:
            logger.warning(f"Cloud Run dispatch failed, falling back to local: {e}")
            # Fall through to local execution

    # === LOCAL EXECUTION (fallback or when Cloud Run not configured) ===
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

    # Initialize research service with progress emitter
    research_service = ResearchService(
        gemini_client=gemini_client,
        supabase_client=supabase_client,
        ocr_service=ocr_service,
        progress_emitter=progress_emitter,
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
            use_cache=actor_input.use_cache,
            extend_cache=actor_input.extend_cache,
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
            # Emit report started
            if progress_emitter:
                await progress_emitter.report_started(actor_input.report_variant, actor_input.report_format)

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
                    research_result=result,
                )

            # Emit report completed
            if progress_emitter:
                await progress_emitter.report_completed(len(report_markdown) if report_markdown else 0)
        except Exception as e:
            logger.warning(f"Report generation failed: {e}")
            result.setdefault("warnings", []).append(f"Report generation failed: {str(e)}")

    # Build output using transform pipeline
    completed_at = datetime.utcnow()
    transformed = transform_research_result(result)

    return ActorOutput(
        session_id=result.get("session_id", "unknown"),
        query=actor_input.query,
        template=actor_input.template,
        status=result.get("status", "completed"),
        findings=transformed.findings,
        perspectives=transformed.perspectives,
        sources=transformed.sources,
        search_queries_executed=result.get("search_queries_executed", []),
        report_markdown=report_markdown,
        report_html=report_html,
        cost_summary=transformed.cost_summary,
        execution_time_seconds=result.get("execution_time_seconds", 0),
        supabase_session_id=result.get("supabase_session_id"),
        errors=result.get("errors", []),
        warnings=result.get("warnings", []),
        started_at=started_at,
        completed_at=completed_at,
        cache_hit=result.get("cache_hit", False),
        cache_extended=result.get("cache_extended", False),
        original_cached_at=result.get("original_cached_at"),
        # Intelligence analysis results
        contradictions=result.get("contradictions", []),
        knowledge_gaps=result.get("knowledge_gaps", []),
        role_summaries=result.get("role_summaries", {}),
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
            # Get actor run context
            actor_info = Actor.get_env() or {}
            apify_run_id = actor_info.get("actor_run_id", "unknown")

            # Get input from Apify
            actor_input_raw = await Actor.get_input() or {}
            actor_input = ActorInput(**actor_input_raw)

            # Generate session ID
            session_id = f"session_{apify_run_id[:12]}"

            # Initialize unified progress emitter
            progress_emitter = ProgressEmitter(
                session_id=session_id,
                apify_run_id=apify_run_id,
                webhook_url=actor_input.progress_webhook_url,
            )
            await progress_emitter.initialize()

            # Initialize state manager for migration recovery
            state_manager = StateManager(session_id)
            await state_manager.initialize()

            # Run research with progress emitter
            output = await run_actor(actor_input, progress_emitter)

            # Build executive summary
            exec_summary = build_executive_summary(output)

            # Store full output
            await Actor.set_value("OUTPUT", output.model_dump())

            # Store executive summary
            await Actor.set_value("EXECUTIVE_SUMMARY", exec_summary.model_dump())

            # Store report if generated
            if output.report_markdown:
                await Actor.set_value("REPORT.md", output.report_markdown)
            if output.report_html:
                await Actor.set_value("REPORT.html", output.report_html)

            # === MULTI-RECORD DATASET PUSH ===

            # 1. Summary record (overview)
            await Actor.push_data({
                "record_type": "summary",
                "session_id": output.session_id,
                "query": output.query,
                "template": output.template,
                "status": output.status,
                "total_findings": len(output.findings),
                "total_perspectives": len(output.perspectives),
                "total_sources": len(output.sources),
                "execution_time_seconds": output.execution_time_seconds,
                "total_cost_usd": output.cost_summary.total_cost_usd,
                "report_available": output.report_markdown is not None,
                "high_confidence_findings": exec_summary.high_confidence_findings,
                "high_credibility_sources": exec_summary.high_credibility_sources,
            })

            # 2. Finding records
            for finding in output.findings:
                await Actor.push_data({
                    "record_type": "finding",
                    "session_id": output.session_id,
                    **finding.model_dump()
                })

            # 3. Perspective records
            for perspective in output.perspectives:
                await Actor.push_data({
                    "record_type": "perspective",
                    "session_id": output.session_id,
                    **perspective.model_dump()
                })

            # 4. Source records
            for source in output.sources:
                await Actor.push_data({
                    "record_type": "source",
                    "session_id": output.session_id,
                    **source.model_dump()
                })

            # 5. Metrics record
            await Actor.push_data({
                "record_type": "metrics",
                "session_id": output.session_id,
                **output.cost_summary.model_dump(),
                "execution_time_seconds": output.execution_time_seconds,
                "search_queries_executed": len(output.search_queries_executed),
            })

            logger.info(
                f"Research completed: {len(output.findings)} findings, "
                f"{len(output.perspectives)} perspectives, {len(output.sources)} sources"
            )

            # === EMAIL DELIVERY (optional, non-blocking) ===
            if actor_input.send_email and actor_input.email_to:
                try:
                    # Get settings for resend API key
                    settings = override_settings(resend_api_key=actor_input.resend_api_key)

                    if settings.resend_api_key:
                        resend_client = ResendClient(api_key=settings.resend_api_key)

                        # Prepare findings with sources for email (top 5 with source URLs)
                        findings_with_sources = [
                            {
                                "summary": f.summary,
                                "content": f.content,
                                "supporting_sources": f.supporting_sources,
                                "date_referenced": f.date_referenced,
                                "date_range": f.date_range,
                            }
                            for f in sorted(output.findings, key=lambda x: x.confidence_score, reverse=True)[:5]
                        ]

                        # Collect all predictions from perspectives
                        all_predictions = []
                        for p in output.perspectives:
                            for pred in p.predictions[:2]:  # Top 2 per perspective
                                all_predictions.append(pred.model_dump())
                        # Deduplicate and limit
                        seen_preds = set()
                        unique_predictions = []
                        for pred in all_predictions:
                            pred_key = pred.get("prediction", "")[:50].lower()
                            if pred_key not in seen_preds:
                                seen_preds.add(pred_key)
                                unique_predictions.append(pred)
                                if len(unique_predictions) >= 5:
                                    break

                        # Build email content with new parameters
                        email_content = resend_client.build_report_email(
                            query=output.query,
                            template=output.template,
                            executive_summary=exec_summary.model_dump(),
                            report_html=output.report_html,
                            report_markdown=output.report_markdown,
                            findings_with_sources=findings_with_sources,
                            predictions=unique_predictions,
                        )

                        # Prepare attachments (both markdown and HTML)
                        attachments = []
                        if output.report_markdown:
                            attachments.append({
                                "filename": "research_report.md",
                                "content": base64.b64encode(output.report_markdown.encode()).decode(),
                            })
                        if output.report_html:
                            attachments.append({
                                "filename": "research_report.html",
                                "content": base64.b64encode(output.report_html.encode()).decode(),
                            })

                        # Send email
                        email_result = await resend_client.send_report(
                            to_email=actor_input.email_to,
                            subject=actor_input.email_subject or email_content["subject"],
                            html_content=email_content["html"],
                            text_content=email_content["text"],
                            attachments=attachments if attachments else None,
                        )

                        if email_result["success"]:
                            logger.info(f"Email sent successfully to {actor_input.email_to}")
                        else:
                            logger.warning(f"Email send failed: {email_result.get('error')}")
                    else:
                        logger.warning("Email requested but RESEND_API_KEY not configured")

                except Exception as e:
                    # Non-blocking - log error but don't fail the actor
                    logger.warning(f"Email delivery failed (non-blocking): {str(e)}")

            # === FINAL PROGRESS EMISSION ===
            if output.status == "completed":
                # Emit completion via unified progress emitter
                kv_store = await Actor.open_key_value_store()
                results_url = f"https://api.apify.com/v2/key-value-stores/{kv_store.id}/records/OUTPUT"

                await progress_emitter.completed(
                    findings_count=len(output.findings),
                    sources_count=len(output.sources),
                    total_cost_usd=output.cost_summary.total_cost_usd,
                    perspectives_count=len(output.perspectives),
                    execution_time_seconds=output.execution_time_seconds,
                    results_url=results_url,
                )

                # Clear state after successful completion
                await state_manager.clear()
            else:
                # Emit failure via unified progress emitter
                error_msg = "; ".join(output.errors) if output.errors else "Unknown error"
                await progress_emitter.failed(error_msg, "RESEARCH_FAILED", "execution")

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
        exec_summary = build_executive_summary(output)

        print(f"\nResults: {len(output.findings)} findings, {len(output.sources)} sources")
        print(f"Status: {output.status}")
        print(f"Execution time: {output.execution_time_seconds:.1f}s")
        print(f"High confidence findings: {exec_summary.high_confidence_findings}")

        if output.errors:
            print(f"Errors: {output.errors}")

        if exec_summary.top_findings:
            print("\nTop Findings:")
            for i, f in enumerate(exec_summary.top_findings[:3], 1):
                print(f"  {i}. {f}")

        if output.report_markdown:
            print("\n" + "="*50)
            print(output.report_markdown[:2000])


if __name__ == "__main__":
    asyncio.run(main())
