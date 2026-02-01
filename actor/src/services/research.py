"""Research orchestration service.

This module provides the ResearchService class that orchestrates research
using a phase-based pipeline architecture. The pipeline decomposes research
into single-responsibility phases for improved testability and maintainability.
"""

import time
import logging
from typing import List, Dict, Any, Optional, TYPE_CHECKING
from uuid import uuid4

from ..clients.gemini import GeminiClient
from ..clients.supabase import SupabaseClient
from .cost_tracker import CostTracker
from .ocr import OCRService
from .cache import CacheService
from .phases import ResearchPipeline

if TYPE_CHECKING:
    from .progress import ProgressEmitter

logger = logging.getLogger(__name__)


class ResearchService:
    """Orchestrates the research process using a phase-based pipeline.

    The service delegates research execution to a ResearchPipeline that
    handles each phase independently:
    1. Query Generation - Generate search queries from user query + template
    2. Web Search - Execute grounded web searches, collect sources
    3. Credibility Assessment - Score and label source credibility
    4. Finding Extraction - Extract structured findings from content
    5. Perspective Analysis - Run multi-perspective expert analysis
    6. Intelligence Analysis - Detect contradictions, gaps, generate role summaries
    """

    def __init__(
        self,
        gemini_client: GeminiClient,
        supabase_client: Optional[SupabaseClient] = None,
        ocr_service: Optional[OCRService] = None,
        progress_emitter: Optional["ProgressEmitter"] = None,
    ):
        self.gemini = gemini_client
        self.supabase = supabase_client
        self.ocr = ocr_service
        self.cost_tracker = CostTracker()
        self.progress = progress_emitter

    async def execute_research(
        self,
        query: str,
        template_type: str = "investigative",
        granularity: str = "standard",
        max_searches: int = 5,
        perspectives: Optional[List[str]] = None,
        input_file_url: Optional[str] = None,
        input_text: Optional[str] = None,
        save_to_db: bool = True,
        workspace_id: str = "apify",
        use_cache: bool = True,
        extend_cache: bool = True,
        intent: Optional[str] = None,
        intent_config: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Execute a complete research session using the phase-based pipeline.

        Args:
            query: The research query
            template_type: Template to use (e.g., "tech_market", "financial")
            granularity: Research depth ("quick", "standard", "deep")
            max_searches: Maximum number of web searches
            perspectives: List of perspective types to analyze
            input_file_url: URL of file to process with OCR
            input_text: Additional input text context
            save_to_db: Whether to save results to database
            workspace_id: Workspace identifier
            use_cache: Check for and return cached results for identical queries
            extend_cache: If cache hit, extend with new research in background
            intent: Requestor's decision intent (investment_sizing, risk_assessment, etc.)
            intent_config: Configuration dict from ActorInput.get_intent_config()

        Returns:
            Dict with session_id, findings, perspectives, sources, etc.
        """
        start_time = time.time()
        session_id = str(uuid4())
        warnings = []

        # ─────────────────────────────────────────────────────────────────
        # Cache check
        # ─────────────────────────────────────────────────────────────────
        cache_service = CacheService()
        cache_key = cache_service.get_cache_key(query, template_type, granularity)
        cache_hit = False
        original_cached_at = None

        if use_cache and cache_service.is_available():
            cached = await cache_service.get_cached(cache_key)
            if cached:
                logger.info(f"Cache hit for query: {query[:50]}...")
                cache_hit = True
                original_cached_at = cached.get("cached_at")

                await cache_service.update_access(cache_key)

                cached_result = cached.get("result", {})
                cached_result["cache_hit"] = True
                cached_result["cache_extended"] = False
                cached_result["original_cached_at"] = original_cached_at
                cached_result["execution_time_seconds"] = round(time.time() - start_time, 2)

                return cached_result

        # ─────────────────────────────────────────────────────────────────
        # Process input context (OCR, text)
        # ─────────────────────────────────────────────────────────────────
        context_text = ""
        if input_file_url and self.ocr:
            try:
                logger.info(f"Processing input file: {input_file_url}")
                ocr_result = await self.ocr.process_file_url(input_file_url)
                context_text = ocr_result.get("text", "")
                self.cost_tracker.add_openrouter_usage(ocr_result.get("tokens", 0))
            except Exception as e:
                warnings.append(f"Failed to process input file: {str(e)}")
                logger.warning(f"OCR failed: {e}")

        if input_text:
            context_text = f"{context_text}\n\n{input_text}" if context_text else input_text

        # ─────────────────────────────────────────────────────────────────
        # Create database session
        # ─────────────────────────────────────────────────────────────────
        if save_to_db and self.supabase:
            try:
                db_session = await self.supabase.create_session(
                    title=f"Research: {query[:50]}...",
                    query=query,
                    template_type=template_type,
                    parameters={
                        "granularity": granularity,
                        "max_searches": max_searches,
                        "perspectives": perspectives,
                    },
                )
                session_id = db_session.get("id", session_id)
            except Exception as e:
                warnings.append(f"Failed to create database session: {str(e)}")
                logger.warning(f"DB session creation failed: {e}")

        # ─────────────────────────────────────────────────────────────────
        # Execute pipeline
        # ─────────────────────────────────────────────────────────────────
        pipeline = ResearchPipeline(
            gemini_client=self.gemini,
            supabase_client=self.supabase,
            progress_emitter=self.progress,
        )

        pipeline_result = await pipeline.execute(
            query=query,
            template_type=template_type,
            granularity=granularity,
            max_searches=max_searches,
            perspectives=perspectives,
            input_context_text=context_text,
            save_to_db=save_to_db,
            session_id=session_id,
        )

        # ─────────────────────────────────────────────────────────────────
        # Complete database session
        # ─────────────────────────────────────────────────────────────────
        if save_to_db and self.supabase:
            try:
                await self.supabase.complete_session(
                    session_id,
                    cost_summary=self.cost_tracker.get_summary(),
                )
            except Exception as e:
                logger.warning(f"Failed to complete session: {e}")

        # ─────────────────────────────────────────────────────────────────
        # Build result (backward compatible format)
        # ─────────────────────────────────────────────────────────────────
        result = pipeline.build_result_dict(
            pipeline_result,
            cache_hit=False,
            cache_extended=False,
            original_cached_at=None,
            intent=intent,
            intent_config=intent_config,
        )

        # Add any pre-pipeline warnings
        result["warnings"] = warnings + result.get("warnings", [])

        # ─────────────────────────────────────────────────────────────────
        # Cache result
        # ─────────────────────────────────────────────────────────────────
        if use_cache and cache_service.is_available() and pipeline_result.success:
            try:
                await cache_service.set_cached(
                    cache_key=cache_key,
                    result=result,
                    findings_count=len(result.get("findings", [])),
                    sources_count=len(result.get("sources", [])),
                )
                logger.info(f"Cached research result: {cache_key}")
            except Exception as e:
                logger.warning(f"Failed to cache result: {e}")

        return result

    def _build_error_result(
        self,
        session_id: str,
        query: str,
        template: str,
        errors: List[str],
        start_time: float,
    ) -> Dict[str, Any]:
        """Build error result when research fails."""
        return {
            "session_id": session_id,
            "query": query,
            "template": template,
            "status": "failed",
            "findings": [],
            "perspectives": [],
            "sources": [],
            "search_queries_executed": [],
            "cost_summary": self.cost_tracker.get_summary(),
            "execution_time_seconds": round(time.time() - start_time, 2),
            "supabase_session_id": None,
            "errors": errors,
            "warnings": [],
        }
