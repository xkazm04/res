"""Research orchestration service."""

import time
import logging
from typing import List, Dict, Any, Optional, TYPE_CHECKING
from uuid import uuid4

from ..clients.gemini import GeminiClient, Source as GeminiSource
from ..clients.supabase import SupabaseClient
from ..templates import get_template, BaseTemplate
from .cost_tracker import CostTracker
from .ocr import OCRService
from .cache import CacheService
from .transform import (
    extract_source_dict,
    enrich_source_credibility,
    enrich_findings_with_ids_and_sources,
)

if TYPE_CHECKING:
    from .progress import ProgressEmitter

logger = logging.getLogger(__name__)


class ResearchService:
    """Orchestrates the research process."""

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
    ) -> Dict[str, Any]:
        """
        Execute a complete research session.

        Args:
            use_cache: Check for and return cached results for identical queries
            extend_cache: If cache hit, extend with new research in background

        Returns:
            Dict with session_id, findings, perspectives, sources, etc.
        """
        start_time = time.time()
        session_id = str(uuid4())
        errors = []
        warnings = []

        # Initialize cache service
        cache_service = CacheService()
        cache_key = cache_service.get_cache_key(query, template_type, granularity)
        cache_hit = False
        original_cached_at = None

        # Check cache if enabled
        if use_cache and cache_service.is_available():
            cached = await cache_service.get_cached(cache_key)
            if cached:
                logger.info(f"Cache hit for query: {query[:50]}...")
                cache_hit = True
                original_cached_at = cached.get("cached_at")

                # Update access count
                await cache_service.update_access(cache_key)

                # Return cached result with cache metadata
                cached_result = cached.get("result", {})
                cached_result["cache_hit"] = True
                cached_result["cache_extended"] = False
                cached_result["original_cached_at"] = original_cached_at
                cached_result["execution_time_seconds"] = round(time.time() - start_time, 2)

                # Log cache hit (event emitter doesn't have cache_hit method)
                logger.info(f"Cache hit for query: {query[:50]}...")

                return cached_result

        # Initialize template
        template = get_template(template_type)
        template.set_client(self.gemini)

        # Emit initialization
        if self.progress:
            await self.progress.initialized(query, template_type, granularity, max_searches)

        # Build context from input file/text
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

        # Create session in database
        db_session = None
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

        # Phase 1: Generate search queries
        logger.info("Generating search queries...")
        search_queries = await template.generate_search_queries(
            query=query,
            max_searches=max_searches,
            granularity=granularity,
        )

        if not search_queries:
            errors.append("Failed to generate search queries")
            if self.progress:
                await self.progress.failed("Failed to generate search queries", "QUERY_GENERATION_FAILED", "query_generation")
            return self._build_error_result(session_id, query, template_type, errors, start_time)

        # Emit query generation
        if self.progress:
            await self.progress.queries_generated(len(search_queries), search_queries)

        # Phase 2: Execute searches
        logger.info(f"Executing {len(search_queries)} searches...")
        all_sources: List[Dict[str, Any]] = []
        all_content: List[str] = []

        # Add context if available
        if context_text:
            all_content.append(f"## Input Context\n\n{context_text}")

        for i, search_query in enumerate(search_queries):
            try:
                # Emit search started
                if self.progress:
                    await self.progress.search_started(i, search_query, len(search_queries))

                logger.debug(f"Search {i+1}/{len(search_queries)}: {search_query[:50]}...")
                result = await self.gemini.research(search_query)

                # Track tokens and cost
                tokens_used = 0
                cost_usd = 0.0
                if result.token_usage:
                    tokens_used = result.token_usage.input_tokens + result.token_usage.output_tokens
                    self.cost_tracker.add_gemini_usage(
                        result.token_usage.input_tokens,
                        result.token_usage.output_tokens,
                    )
                    cost_usd = self.cost_tracker.get_summary().get("total_cost_usd", 0.0) - (
                        self.cost_tracker.get_summary().get("total_cost_usd", 0.0) if i == 0 else 0
                    )

                # Collect sources using transform pipeline
                sources_this_search = [extract_source_dict(s) for s in result.sources]
                all_sources.extend(sources_this_search)

                # Collect synthesized content
                if result.text:
                    all_content.append(f"## Search: {search_query}\n\n{result.text}")

                # Emit search completed
                if self.progress:
                    await self.progress.search_completed(
                        i, len(sources_this_search), 0,  # Findings counted later
                        total=len(search_queries),
                        tokens_used=tokens_used, cost_usd=cost_usd
                    )

                # Save query to database
                if save_to_db and self.supabase:
                    try:
                        await self.supabase.save_query(
                            session_id=session_id,
                            query_text=search_query,
                            query_purpose=f"Search query {i+1}",
                            query_round=1,
                            result_count=len(result.sources),
                        )
                    except Exception as e:
                        logger.warning(f"Failed to save query: {e}")

            except Exception as e:
                warnings.append(f"Search failed for '{search_query[:30]}...': {str(e)}")
                logger.warning(f"Search failed: {e}")

        # Deduplicate sources
        seen_urls = set()
        unique_sources = []
        for source in all_sources:
            if source["url"] not in seen_urls:
                seen_urls.add(source["url"])
                unique_sources.append(source)

        # Phase 3: Assess credibility using transform pipeline
        for source in unique_sources:
            enrich_source_credibility(source)

        # Save sources
        if save_to_db and self.supabase:
            try:
                await self.supabase.save_sources(session_id, unique_sources)
            except Exception as e:
                logger.warning(f"Failed to save sources: {e}")

        # Phase 4: Extract findings
        logger.info("Extracting findings...")
        synthesized_content = "\n\n---\n\n".join(all_content)
        findings = await template.extract_findings(
            query=query,
            sources=unique_sources,
            synthesized_content=synthesized_content,
            granularity=granularity,
        )

        # Enrich findings with IDs and supporting sources using transform pipeline
        findings = enrich_findings_with_ids_and_sources(findings, unique_sources)

        # Phase 4.5: Verify findings (bias detection, sanity check, cross-reference)
        logger.info("Verifying findings...")
        if self.progress:
            await self.progress.verification_started()
        try:
            findings = await template.verify_findings(
                findings=findings,
                sources=unique_sources,
                original_query=query,
            )
            logger.info(f"Verified {len(findings)} findings")
            if self.progress:
                await self.progress.verification_completed(len(findings))
        except Exception as e:
            warnings.append(f"Finding verification failed: {str(e)}")
            logger.warning(f"Verification failed: {e}")

        # Save findings
        if save_to_db and self.supabase:
            try:
                await self.supabase.save_findings(session_id, findings)
            except Exception as e:
                logger.warning(f"Failed to save findings: {e}")

        # Phase 5: Multi-perspective analysis
        logger.info("Running perspective analysis...")
        perspectives_to_run = perspectives or template.default_perspectives

        # Emit perspectives started
        if self.progress:
            await self.progress.perspectives_started(perspectives_to_run)

        perspective_results = []
        total_insights = 0

        for perspective_type in perspectives_to_run:
            try:
                analysis = await template.analyze_perspective(
                    perspective_type=perspective_type,
                    findings=findings,
                    sources=unique_sources,
                    original_query=query,
                )
                perspective_results.append(analysis)
                # Count insights from this perspective
                total_insights += len(analysis.get("key_insights", []))

            except Exception as e:
                warnings.append(f"Perspective analysis failed for '{perspective_type}': {str(e)}")
                logger.warning(f"Perspective failed: {e}")

        # Emit perspectives completed
        if self.progress:
            await self.progress.perspectives_completed(len(perspective_results), total_insights)

        # Save perspectives
        if save_to_db and self.supabase:
            try:
                await self.supabase.save_perspectives(session_id, perspective_results)
            except Exception as e:
                logger.warning(f"Failed to save perspectives: {e}")

        # Phase 6: Intelligence analysis (contradictions, gaps, role summaries)
        logger.info("Running intelligence analysis...")
        intelligence_results = {}
        try:
            from .intelligence import IntelligenceAnalyzer
            analyzer = IntelligenceAnalyzer(gemini_client=self.gemini)
            intelligence_results = await analyzer.analyze(
                findings=findings,
                perspectives=perspective_results,
                sources=unique_sources,
                query=query,
                template=template_type,
            )
            logger.info(
                f"Intelligence analysis complete: "
                f"{len(intelligence_results.get('contradictions', []))} contradictions, "
                f"{len(intelligence_results.get('knowledge_gaps', []))} gaps, "
                f"{len(intelligence_results.get('role_summaries', {}))} role summaries"
            )
        except Exception as e:
            warnings.append(f"Intelligence analysis failed: {str(e)}")
            logger.warning(f"Intelligence analysis failed: {e}")

        # Complete session
        if save_to_db and self.supabase:
            try:
                await self.supabase.complete_session(
                    session_id,
                    cost_summary=self.cost_tracker.get_summary(),
                )
            except Exception as e:
                logger.warning(f"Failed to complete session: {e}")

        execution_time = time.time() - start_time

        # Build result
        result = {
            "session_id": session_id,
            "query": query,
            "template": template_type,
            "status": "completed" if not errors else "partial",
            "findings": findings,
            "perspectives": perspective_results,
            "sources": unique_sources,
            "search_queries_executed": search_queries,
            "cost_summary": self.cost_tracker.get_summary(),
            "execution_time_seconds": round(execution_time, 2),
            "supabase_session_id": session_id if save_to_db and self.supabase else None,
            "errors": errors,
            "warnings": warnings,
            "cache_hit": False,
            "cache_extended": False,
            "original_cached_at": None,
            # Intelligence analysis results
            "contradictions": intelligence_results.get("contradictions", []),
            "knowledge_gaps": intelligence_results.get("knowledge_gaps", []),
            "role_summaries": intelligence_results.get("role_summaries", {}),
        }

        # Cache the result if caching is enabled
        if use_cache and cache_service.is_available() and not errors:
            try:
                await cache_service.set_cached(
                    cache_key=cache_key,
                    result=result,
                    findings_count=len(findings),
                    sources_count=len(unique_sources),
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
