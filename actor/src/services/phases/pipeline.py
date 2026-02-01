"""Research pipeline orchestrator - chains phases with dependency injection."""

import time
import logging
from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional, TYPE_CHECKING
from uuid import uuid4

from .base import Phase, PhaseResult, PhaseStatus, PhaseError, ResearchContext
from .query_generation import QueryGenerationPhase
from .web_search import WebSearchPhase
from .credibility_assessment import CredibilityAssessmentPhase
from .finding_extraction import FindingExtractionPhase
from .perspective_analysis import PerspectiveAnalysisPhase
from .intelligence_analysis import IntelligenceAnalysisPhase

if TYPE_CHECKING:
    from ..progress import ProgressEmitter
    from ...clients.gemini import GeminiClient
    from ...clients.supabase import SupabaseClient
    from ...templates.base import BaseTemplate

logger = logging.getLogger(__name__)


@dataclass
class PipelineMetrics:
    """Accumulated metrics from pipeline execution."""
    total_duration_seconds: float = 0.0
    phase_durations: Dict[str, float] = field(default_factory=dict)
    total_tokens: int = 0
    total_cost_usd: float = 0.0
    phases_completed: int = 0
    phases_failed: int = 0
    phases_skipped: int = 0


@dataclass
class PipelineResult:
    """Result from complete pipeline execution."""
    success: bool
    context: ResearchContext
    metrics: PipelineMetrics
    phase_results: Dict[str, PhaseResult] = field(default_factory=dict)


class ResearchPipeline:
    """Orchestrates research phase execution with progress callbacks.

    The pipeline:
    1. Creates a ResearchContext with injected dependencies
    2. Executes phases in sequence (or parallel where possible)
    3. Tracks metrics and progress
    4. Handles phase failures gracefully

    Example:
        pipeline = ResearchPipeline(
            gemini_client=gemini,
            supabase_client=supabase,
            progress_emitter=progress,
        )
        result = await pipeline.execute(
            query="What is the AI landscape?",
            template_type="tech_market",
        )
    """

    def __init__(
        self,
        gemini_client: "GeminiClient",
        supabase_client: Optional["SupabaseClient"] = None,
        progress_emitter: Optional["ProgressEmitter"] = None,
    ):
        self.gemini_client = gemini_client
        self.supabase_client = supabase_client
        self.progress_emitter = progress_emitter

        # Initialize phases
        self._phases: List[Phase] = [
            QueryGenerationPhase(),
            WebSearchPhase(),
            CredibilityAssessmentPhase(),
            FindingExtractionPhase(),
            PerspectiveAnalysisPhase(),
            IntelligenceAnalysisPhase(),
        ]

    async def execute(
        self,
        query: str,
        template_type: str = "investigative",
        granularity: str = "standard",
        max_searches: int = 5,
        perspectives: Optional[List[str]] = None,
        input_context_text: str = "",
        save_to_db: bool = True,
        session_id: Optional[str] = None,
    ) -> PipelineResult:
        """Execute the complete research pipeline.

        Args:
            query: The research query
            template_type: Template to use (e.g., "tech_market", "financial")
            granularity: Research depth ("quick", "standard", "deep")
            max_searches: Maximum number of web searches
            perspectives: List of perspective types to analyze
            input_context_text: Additional context text
            save_to_db: Whether to save results to database
            session_id: Optional session ID (generated if not provided)

        Returns:
            PipelineResult with success status, context, and metrics
        """
        start_time = time.time()
        session_id = session_id or str(uuid4())

        # Initialize template
        from ...templates import get_template
        template = get_template(template_type)
        template.set_client(self.gemini_client)

        # Create context
        ctx = ResearchContext(
            query=query,
            template_type=template_type,
            granularity=granularity,
            max_searches=max_searches,
            perspectives=perspectives,
            session_id=session_id,
            input_context_text=input_context_text,
            gemini_client=self.gemini_client,
            supabase_client=self.supabase_client,
            progress_emitter=self.progress_emitter,
            template=template,
            save_to_db=save_to_db,
        )

        # Emit initialization
        if self.progress_emitter:
            await self.progress_emitter.initialized(
                query, template_type, granularity, max_searches
            )

        # Execute phases
        metrics = PipelineMetrics()
        phase_results: Dict[str, PhaseResult] = {}
        pipeline_success = True

        for phase in self._phases:
            phase_start = time.time()
            phase_name = phase.name

            logger.info(f"Starting phase: {phase_name}")

            try:
                result = await phase.execute(ctx)
                phase_results[phase_name] = result

                # Update metrics
                phase_duration = time.time() - phase_start
                metrics.phase_durations[phase_name] = phase_duration

                if result.status == PhaseStatus.COMPLETED:
                    metrics.phases_completed += 1
                    if result.metrics:
                        metrics.total_tokens += result.metrics.get("tokens_used", 0)
                elif result.status == PhaseStatus.FAILED:
                    metrics.phases_failed += 1
                    pipeline_success = False

                    # Check if failure is fatal
                    if not self._is_recoverable_failure(phase_name, result):
                        logger.error(f"Fatal phase failure: {phase_name}")
                        break
                elif result.status == PhaseStatus.SKIPPED:
                    metrics.phases_skipped += 1

                # Log phase completion
                status_str = result.status.value
                logger.info(f"Phase {phase_name} completed: {status_str} ({phase_duration:.2f}s)")

            except Exception as e:
                logger.error(f"Unexpected error in phase {phase_name}: {e}")
                phase_results[phase_name] = PhaseResult.failed(PhaseError(
                    phase_name=phase_name,
                    message=str(e),
                    recoverable=False,
                    exception=e,
                ))
                metrics.phases_failed += 1
                metrics.phase_durations[phase_name] = time.time() - phase_start

                if not self._is_recoverable_failure(phase_name, phase_results[phase_name]):
                    pipeline_success = False
                    break

        # Finalize metrics
        metrics.total_duration_seconds = time.time() - start_time
        metrics.total_cost_usd = ctx.cost_usd

        return PipelineResult(
            success=pipeline_success,
            context=ctx,
            metrics=metrics,
            phase_results=phase_results,
        )

    def _is_recoverable_failure(self, phase_name: str, result: PhaseResult) -> bool:
        """Determine if a phase failure allows pipeline to continue."""
        # Critical phases that must succeed
        critical_phases = {
            "Query Generation",
            "Web Search",
        }

        if phase_name in critical_phases:
            return False

        # Check if error is marked recoverable
        if result.errors:
            return all(e.recoverable for e in result.errors)

        return True

    def build_result_dict(
        self,
        pipeline_result: PipelineResult,
        cache_hit: bool = False,
        cache_extended: bool = False,
        original_cached_at: Optional[str] = None,
        intent: Optional[str] = None,
        intent_config: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Build the final result dictionary from pipeline execution.

        This method converts the pipeline result into the same format
        as the original execute_research method for backward compatibility.
        """
        ctx = pipeline_result.context
        metrics = pipeline_result.metrics

        # Build cost summary compatible with CostTracker.get_summary()
        cost_summary = {
            "total_tokens": ctx.tokens_used,
            "input_tokens": ctx.input_tokens,
            "output_tokens": ctx.output_tokens,
            "gemini_cost_usd": round(ctx.cost_usd, 6),
            "openrouter_cost_usd": 0.0,  # OCR handled separately
            "total_cost_usd": round(ctx.cost_usd, 6),
        }

        return {
            "session_id": ctx.session_id,
            "query": ctx.query,
            "template": ctx.template_type,
            "status": "completed" if pipeline_result.success else "partial",
            "findings": ctx.findings,
            "perspectives": ctx.perspectives_results,
            "sources": ctx.unique_sources,
            "search_queries_executed": ctx.search_queries,
            "cost_summary": cost_summary,
            "execution_time_seconds": round(metrics.total_duration_seconds, 2),
            "supabase_session_id": ctx.session_id if ctx.save_to_db and ctx.supabase_client else None,
            "errors": ctx.errors,
            "warnings": ctx.warnings,
            "cache_hit": cache_hit,
            "cache_extended": cache_extended,
            "original_cached_at": original_cached_at,
            # Intelligence analysis results
            "contradictions": ctx.intelligence_results.get("contradictions", []),
            "knowledge_gaps": ctx.intelligence_results.get("knowledge_gaps", []),
            "role_summaries": ctx.intelligence_results.get("role_summaries", {}),
            # Intent configuration for report generation
            "intent": intent,
            "intent_config": intent_config or {},
            # Pipeline metrics
            "pipeline_metrics": {
                "phases_completed": metrics.phases_completed,
                "phases_failed": metrics.phases_failed,
                "phases_skipped": metrics.phases_skipped,
                "phase_durations": metrics.phase_durations,
            },
        }
