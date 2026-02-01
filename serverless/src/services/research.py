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

if TYPE_CHECKING:
    from .status import StatusReporter
    from .events import EventEmitter

logger = logging.getLogger(__name__)


class ResearchService:
    """Orchestrates the research process."""

    def __init__(
        self,
        gemini_client: GeminiClient,
        supabase_client: Optional[SupabaseClient] = None,
        ocr_service: Optional[OCRService] = None,
        status_reporter: Optional["StatusReporter"] = None,
        event_emitter: Optional["EventEmitter"] = None,
    ):
        self.gemini = gemini_client
        self.supabase = supabase_client
        self.ocr = ocr_service
        self.cost_tracker = CostTracker()
        self.status = status_reporter
        self.events = event_emitter

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

        # Emit initialization status/event
        if self.status:
            await self.status.initialized(query, template_type, granularity, max_searches)
        if self.events:
            await self.events.initialized(query, template_type, granularity)

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

        # Phase 0.5: Topic detection and linking
        primary_topic_id = None
        if save_to_db and self.supabase:
            try:
                # Extract topic from query
                topic_info = await self._extract_topic(query, template_type)
                if topic_info:
                    topic = await self.supabase.find_or_create_topic(
                        name=topic_info.get("name", query[:50]),
                        topic_type=topic_info.get("type", "concept"),
                        description=topic_info.get("description"),
                    )
                    primary_topic_id = topic.get("id")
                    await self.supabase.link_session_to_topic(
                        session_id=session_id,
                        topic_id=primary_topic_id,
                        is_primary=True,
                    )
                    logger.info(f"Linked session to topic: {topic.get('name')}")
            except Exception as e:
                logger.warning(f"Topic detection failed: {e}")

        # Phase 1: Generate search queries
        logger.info("Generating search queries...")
        search_queries = await template.generate_search_queries(
            query=query,
            max_searches=max_searches,
            granularity=granularity,
        )

        if not search_queries:
            errors.append("Failed to generate search queries")
            if self.status:
                await self.status.failed("Failed to generate search queries", "query_generation")
            if self.events:
                await self.events.failed("Failed to generate search queries", "QUERY_GENERATION_FAILED", "query_generation")
            return self._build_error_result(session_id, query, template_type, errors, start_time)

        # Emit query generation status/event
        if self.status:
            await self.status.queries_generated(len(search_queries), search_queries)
        if self.events:
            await self.events.queries_generated(search_queries)

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
                if self.status:
                    await self.status.search_started(i, search_query)
                if self.events:
                    await self.events.search_started(i, search_query, len(search_queries))

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

                # Collect sources
                sources_this_search = []
                for source in result.sources:
                    source_dict = {
                        "url": source.url,
                        "title": source.title,
                        "domain": source.domain,
                        "snippet": source.snippet,
                        "source_type": source.source_type,
                    }
                    all_sources.append(source_dict)
                    sources_this_search.append(source_dict)

                # Collect synthesized content
                if result.text:
                    all_content.append(f"## Search: {search_query}\n\n{result.text}")

                # Emit search completed
                if self.status:
                    await self.status.search_completed(i, len(sources_this_search), 0)  # Findings counted later
                if self.events:
                    await self.events.search_completed(
                        i, len(search_queries), len(sources_this_search), 0,
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

        # Phase 3: Assess credibility (simple heuristic)
        for source in unique_sources:
            source["credibility_score"] = self._assess_credibility(source)
            source["credibility_label"] = self._credibility_label(source["credibility_score"])

        # Save sources and get URL->UUID mapping for linking
        source_id_map: dict = {}
        if save_to_db and self.supabase:
            try:
                _, source_id_map = await self.supabase.save_sources_and_get_mapping(session_id, unique_sources)
                logger.info(f"Saved {len(source_id_map)} sources with UUID mapping")
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

        # Phase 4.5: Verify findings (bias detection, sanity check, cross-reference)
        logger.info("Verifying findings...")
        if self.status:
            await self.status.verification_started()
        try:
            findings = await template.verify_findings(
                findings=findings,
                sources=unique_sources,
                original_query=query,
            )
            logger.info(f"Verified {len(findings)} findings")
            if self.status:
                await self.status.verification_completed(len(findings))
            if self.events:
                await self.events.verification_completed(len(findings))
        except Exception as e:
            warnings.append(f"Finding verification failed: {str(e)}")
            logger.warning(f"Verification failed: {e}")

        # Save findings with proper source linking
        saved_findings = []
        if save_to_db and self.supabase:
            try:
                saved_findings = await self.supabase.save_findings_with_sources(
                    session_id, findings, source_id_map
                )
                logger.info(f"Saved {len(saved_findings)} findings with source links")
            except Exception as e:
                logger.warning(f"Failed to save findings: {e}")

        # Phase 4.25: Entity extraction and knowledge claim creation
        if save_to_db and self.supabase and findings:
            try:
                entities_data = await self._extract_entities(findings, query)
                if entities_data:
                    saved_entities = await self.supabase.save_entities_batch(entities_data)
                    logger.info(f"Extracted and saved {len(saved_entities)} entities")

                    # Create knowledge claims from high-confidence findings
                    for i, finding in enumerate(findings):
                        if finding.get("confidence_score", 0) >= 0.6:
                            try:
                                claim = await self.supabase.create_knowledge_claim(
                                    content=finding.get("content", ""),
                                    claim_type=self._map_finding_to_claim_type(finding.get("finding_type", "fact")),
                                    topic_id=primary_topic_id,
                                    session_id=session_id,
                                    confidence_score=finding.get("confidence_score", 0.5),
                                    summary=finding.get("summary"),
                                    temporal_context=finding.get("temporal_context"),
                                    extracted_data=finding.get("extracted_data"),
                                )

                                # Link finding to claim
                                if saved_findings and i < len(saved_findings):
                                    await self.supabase.client.table("research_findings").update({
                                        "knowledge_claim_id": claim.get("id"),
                                        "is_promoted": True,
                                        "promotion_type": "created",
                                    }).eq("id", saved_findings[i].get("id")).execute()

                                # Link entities to claim
                                for entity in saved_entities:
                                    entity_name = entity.get("canonical_name", "").lower()
                                    if entity_name in finding.get("content", "").lower():
                                        await self.supabase.link_claim_to_entity(
                                            claim_id=claim.get("id"),
                                            entity_id=entity.get("id"),
                                            role="mentioned",
                                        )
                            except Exception as e:
                                logger.debug(f"Failed to create claim from finding: {e}")
            except Exception as e:
                logger.warning(f"Entity extraction failed: {e}")

        # Phase 5: Multi-perspective analysis
        logger.info("Running perspective analysis...")
        perspectives_to_run = perspectives or template.default_perspectives

        # Emit perspectives started
        if self.status:
            await self.status.perspectives_started(perspectives_to_run)
        if self.events:
            await self.events.perspectives_started(perspectives_to_run)

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
        if self.status:
            await self.status.perspectives_completed(len(perspective_results), total_insights)
        if self.events:
            await self.events.perspectives_completed(len(perspective_results), total_insights)

        # Save perspectives
        if save_to_db and self.supabase:
            try:
                await self.supabase.save_perspectives(session_id, perspective_results)
            except Exception as e:
                logger.warning(f"Failed to save perspectives: {e}")

        # Phase 5.5: Detect gaps and contradictions
        gaps_detected = []
        contradictions_detected = []
        if save_to_db and self.supabase and findings:
            try:
                analysis = await self._analyze_gaps_and_contradictions(findings, query)

                # Save gaps
                for gap in analysis.get("gaps", []):
                    saved_gap = await self.supabase.save_gap(
                        session_id=session_id,
                        description=gap.get("description", ""),
                        gap_type=gap.get("type", "information"),
                        priority=gap.get("priority", 2),
                        suggested_queries=gap.get("suggested_queries", []),
                    )
                    gaps_detected.append(saved_gap)

                # Save contradictions (would need finding IDs)
                for contradiction in analysis.get("contradictions", []):
                    contradictions_detected.append(contradiction)
                    # Note: Full contradiction linking requires finding IDs

                logger.info(f"Detected {len(gaps_detected)} gaps and {len(contradictions_detected)} contradictions")
            except Exception as e:
                logger.warning(f"Gap/contradiction analysis failed: {e}")

        # Complete session
        if save_to_db and self.supabase:
            try:
                await self.supabase.complete_session(
                    session_id,
                    cost_summary=self.cost_tracker.get_summary(),
                    findings_count=len(findings),
                    sources_count=len(unique_sources),
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
            "primary_topic_id": primary_topic_id,
            "gaps": gaps_detected,
            "contradictions": contradictions_detected,
            "errors": errors,
            "warnings": warnings,
            "cache_hit": False,
            "cache_extended": False,
            "original_cached_at": None,
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

    async def _extract_topic(
        self,
        query: str,
        template_type: str,
    ) -> Optional[Dict[str, Any]]:
        """Extract topic information from query using LLM."""
        prompt = f"""Analyze this research query and extract the main topic.

QUERY: {query}
TEMPLATE TYPE: {template_type}

Return JSON with:
- name: Short topic name (2-5 words, like "Tesla Financial Health" or "AI Code Assistants")
- type: One of: domain, event, entity, concept, region, timeperiod
- description: One sentence describing the topic

Example output:
{{"name": "OpenAI Corporate Strategy", "type": "entity", "description": "Analysis of OpenAI's business decisions and strategic direction"}}
"""
        try:
            result, _ = await self.gemini.generate_json(prompt, temperature=0.2)
            if isinstance(result, dict) and result.get("name"):
                return result
        except Exception as e:
            logger.warning(f"Topic extraction failed: {e}")
        return None

    async def _extract_entities(
        self,
        findings: List[Dict[str, Any]],
        query: str,
    ) -> List[Dict[str, Any]]:
        """Extract named entities from findings."""
        # Combine findings content
        findings_text = "\n".join([
            f"- {f.get('content', '')[:300]}"
            for f in findings[:15]
        ])

        prompt = f"""Extract key named entities from these research findings.

RESEARCH QUERY: {query}

FINDINGS:
{findings_text}

Extract people, organizations, locations, products, and key concepts.
Return JSON array of entities:
[
  {{"name": "Entity Name", "type": "person|organization|location|product|concept|event", "description": "Brief description"}},
  ...
]

Only include clearly identifiable entities. Limit to 15 most important entities.
"""
        try:
            result, _ = await self.gemini.generate_json(prompt, temperature=0.2)
            if isinstance(result, list):
                return result
        except Exception as e:
            logger.warning(f"Entity extraction failed: {e}")
        return []

    def _map_finding_to_claim_type(self, finding_type: str) -> str:
        """Map finding type to knowledge claim type."""
        mapping = {
            "fact": "fact",
            "claim": "fact",
            "event": "event",
            "actor": "actor",
            "relationship": "relationship",
            "pattern": "pattern",
            "gap": "gap",
            "evidence": "evidence",
        }
        return mapping.get(finding_type, "fact")

    async def _analyze_gaps_and_contradictions(
        self,
        findings: List[Dict[str, Any]],
        query: str,
    ) -> Dict[str, Any]:
        """Analyze findings for gaps and contradictions."""
        findings_text = "\n".join([
            f"{i+1}. [{f.get('finding_type', 'fact')}] {f.get('summary', f.get('content', '')[:200])}"
            for i, f in enumerate(findings[:20])
        ])

        prompt = f"""Analyze these research findings for gaps and contradictions.

RESEARCH QUERY: {query}

FINDINGS:
{findings_text}

Identify:
1. GAPS: What important questions remain unanswered? What information is missing?
2. CONTRADICTIONS: Do any findings conflict with each other?

Return JSON:
{{
  "gaps": [
    {{
      "description": "What's missing",
      "type": "information|verification|perspective|temporal",
      "priority": 1-3 (1=high),
      "suggested_queries": ["search query to fill gap"]
    }}
  ],
  "contradictions": [
    {{
      "finding_indices": [1, 5],
      "description": "How they contradict",
      "severity": "high|medium|low"
    }}
  ]
}}

Limit to 5 most important gaps and 3 most significant contradictions.
"""
        try:
            result, _ = await self.gemini.generate_json(prompt, temperature=0.3)
            if isinstance(result, dict):
                return result
        except Exception as e:
            logger.warning(f"Gap/contradiction analysis failed: {e}")
        return {"gaps": [], "contradictions": []}
