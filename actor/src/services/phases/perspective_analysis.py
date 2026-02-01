"""Perspective analysis phase - runs multi-perspective expert analysis."""

import logging
from dataclasses import dataclass
from typing import Dict, Any, List

from .base import Phase, PhaseResult, PhaseError, ResearchContext

logger = logging.getLogger(__name__)


@dataclass
class PerspectiveAnalysisResult:
    """Result data from perspective analysis phase."""
    perspectives: List[Dict[str, Any]]
    total_insights: int
    perspectives_completed: int
    perspectives_failed: int


class PerspectiveAnalysisPhase(Phase[PerspectiveAnalysisResult]):
    """Phase 5: Run multi-perspective expert analysis.

    Analyzes findings from multiple expert perspectives defined
    by the template, generating insights and recommendations.
    """

    @property
    def name(self) -> str:
        return "Perspective Analysis"

    def validate_input(self, ctx: ResearchContext) -> List[PhaseError]:
        """Validate required data is available."""
        errors = []
        if not ctx.findings:
            # Allow empty findings but warn
            logger.warning("No findings available for perspective analysis")
        if not ctx.template:
            errors.append(PhaseError(
                phase_name=self.name,
                message="Template is required",
                recoverable=False,
            ))
        return errors

    async def execute(self, ctx: ResearchContext) -> PhaseResult[PerspectiveAnalysisResult]:
        """Run perspective analysis on findings.

        Args:
            ctx: Research context with findings populated

        Returns:
            PhaseResult containing perspective analysis results
        """
        validation_errors = self.validate_input(ctx)
        if validation_errors:
            return PhaseResult.failed(validation_errors[0])

        logger.info("Running perspective analysis...")

        # Determine which perspectives to run
        perspectives_to_run = ctx.perspectives or ctx.template.default_perspectives

        # Emit perspectives started
        if ctx.progress_emitter:
            await ctx.progress_emitter.perspectives_started(perspectives_to_run)

        perspective_results = []
        total_insights = 0
        errors: List[PhaseError] = []

        for perspective_type in perspectives_to_run:
            try:
                analysis = await ctx.template.analyze_perspective(
                    perspective_type=perspective_type,
                    findings=ctx.findings,
                    sources=ctx.unique_sources,
                    original_query=ctx.query,
                )
                perspective_results.append(analysis)

                # Count insights from this perspective
                insights_count = len(analysis.get("key_insights", []))
                total_insights += insights_count

                logger.debug(
                    f"Perspective '{perspective_type}' complete: {insights_count} insights"
                )

            except Exception as e:
                error_msg = f"Perspective analysis failed for '{perspective_type}': {str(e)}"
                errors.append(PhaseError(
                    phase_name=self.name,
                    message=error_msg,
                    recoverable=True,
                    exception=e,
                ))
                ctx.warnings.append(error_msg)
                logger.warning(f"Perspective failed: {e}")

        # Emit perspectives completed
        if ctx.progress_emitter:
            await ctx.progress_emitter.perspectives_completed(
                len(perspective_results), total_insights
            )

        # Update context
        ctx.perspectives_results = perspective_results

        # Save perspectives to database if configured
        if ctx.save_to_db and ctx.supabase_client and ctx.session_id:
            try:
                await ctx.supabase_client.save_perspectives(ctx.session_id, perspective_results)
                logger.info(f"Saved {len(perspective_results)} perspectives to database")
            except Exception as e:
                ctx.warnings.append(f"Failed to save perspectives: {str(e)}")
                logger.warning(f"Failed to save perspectives: {e}")

        result = PerspectiveAnalysisResult(
            perspectives=perspective_results,
            total_insights=total_insights,
            perspectives_completed=len(perspective_results),
            perspectives_failed=len(errors),
        )

        logger.info(
            f"Perspective analysis complete: {len(perspective_results)} perspectives, "
            f"{total_insights} insights"
        )

        # Return partial success if some perspectives failed
        if errors and perspective_results:
            return PhaseResult.partial(
                result,
                errors,
                metrics={
                    "perspectives_completed": len(perspective_results),
                    "perspectives_failed": len(errors),
                    "total_insights": total_insights,
                },
            )

        return PhaseResult.completed(
            result,
            metrics={
                "perspectives_completed": len(perspective_results),
                "total_insights": total_insights,
            },
        )
