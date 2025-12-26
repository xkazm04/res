"""Research orchestration service."""

import time
import logging
from typing import List, Dict, Any, Optional
from uuid import uuid4

from ..clients.gemini import GeminiClient, Source as GeminiSource
from ..clients.supabase import SupabaseClient
from ..templates import get_template, BaseTemplate
from .cost_tracker import CostTracker
from .ocr import OCRService

logger = logging.getLogger(__name__)


class ResearchService:
    """Orchestrates the research process."""

    def __init__(
        self,
        gemini_client: GeminiClient,
        supabase_client: Optional[SupabaseClient] = None,
        ocr_service: Optional[OCRService] = None,
    ):
        self.gemini = gemini_client
        self.supabase = supabase_client
        self.ocr = ocr_service
        self.cost_tracker = CostTracker()

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
    ) -> Dict[str, Any]:
        """
        Execute a complete research session.

        Returns:
            Dict with session_id, findings, perspectives, sources, etc.
        """
        start_time = time.time()
        session_id = str(uuid4())
        errors = []
        warnings = []

        # Initialize template
        template = get_template(template_type)
        template.set_client(self.gemini)

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
            return self._build_error_result(session_id, query, template_type, errors, start_time)

        # Phase 2: Execute searches
        logger.info(f"Executing {len(search_queries)} searches...")
        all_sources: List[Dict[str, Any]] = []
        all_content: List[str] = []

        # Add context if available
        if context_text:
            all_content.append(f"## Input Context\n\n{context_text}")

        for i, search_query in enumerate(search_queries):
            try:
                logger.debug(f"Search {i+1}/{len(search_queries)}: {search_query[:50]}...")
                result = await self.gemini.research(search_query)

                # Track tokens
                if result.token_usage:
                    self.cost_tracker.add_gemini_usage(
                        result.token_usage.input_tokens,
                        result.token_usage.output_tokens,
                    )

                # Collect sources
                for source in result.sources:
                    all_sources.append({
                        "url": source.url,
                        "title": source.title,
                        "domain": source.domain,
                        "snippet": source.snippet,
                        "source_type": source.source_type,
                    })

                # Collect synthesized content
                if result.text:
                    all_content.append(f"## Search: {search_query}\n\n{result.text}")

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

        # Phase 3: Assess credibility (simple heuristic)
        for source in unique_sources:
            source["credibility_score"] = self._assess_credibility(source)
            source["credibility_label"] = self._credibility_label(source["credibility_score"])

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

        # Add IDs to findings
        for i, finding in enumerate(findings):
            finding["finding_id"] = f"f{i+1}"
            finding["supporting_sources"] = [
                {"url": s["url"], "title": s["title"]}
                for s in unique_sources[:3]
            ]

        # Save findings
        if save_to_db and self.supabase:
            try:
                await self.supabase.save_findings(session_id, findings)
            except Exception as e:
                logger.warning(f"Failed to save findings: {e}")

        # Phase 5: Multi-perspective analysis
        logger.info("Running perspective analysis...")
        perspectives_to_run = perspectives or template.default_perspectives
        perspective_results = []

        for perspective_type in perspectives_to_run:
            try:
                analysis = await template.analyze_perspective(
                    perspective_type=perspective_type,
                    findings=findings,
                    sources=unique_sources,
                    original_query=query,
                )
                perspective_results.append(analysis)

            except Exception as e:
                warnings.append(f"Perspective analysis failed for '{perspective_type}': {str(e)}")
                logger.warning(f"Perspective failed: {e}")

        # Save perspectives
        if save_to_db and self.supabase:
            try:
                await self.supabase.save_perspectives(session_id, perspective_results)
            except Exception as e:
                logger.warning(f"Failed to save perspectives: {e}")

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

        return {
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
        }

    def _assess_credibility(self, source: Dict[str, Any]) -> float:
        """Simple credibility assessment based on domain."""
        domain = source.get("domain", "").lower()

        # High credibility domains
        if any(d in domain for d in [
            "gov", "edu", "reuters", "ap", "bbc", "nytimes",
            "wsj", "ft.com", "bloomberg", "sec.gov"
        ]):
            return 0.85

        # Medium-high credibility
        if any(d in domain for d in [
            "forbes", "businessinsider", "cnbc", "marketwatch",
            "yahoo", "cnn", "washingtonpost"
        ]):
            return 0.70

        # Default medium credibility
        return 0.55

    def _credibility_label(self, score: float) -> str:
        """Get credibility label from score."""
        if score >= 0.8:
            return "high"
        elif score >= 0.6:
            return "medium"
        else:
            return "low"

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
