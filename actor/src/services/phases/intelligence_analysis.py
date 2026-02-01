"""Intelligence analysis phase - detects contradictions, gaps, and generates role summaries."""

import logging
from dataclasses import dataclass
from typing import Dict, Any, List

from .base import Phase, PhaseResult, PhaseError, ResearchContext

logger = logging.getLogger(__name__)


@dataclass
class IntelligenceAnalysisResult:
    """Result data from intelligence analysis phase."""
    contradictions: List[Dict[str, Any]]
    knowledge_gaps: List[Dict[str, Any]]
    role_summaries: Dict[str, Dict[str, Any]]


class IntelligenceAnalysisPhase(Phase[IntelligenceAnalysisResult]):
    """Phase 6: Intelligence analysis for enhanced insights.

    Provides:
    - Contradiction detection across findings
    - Knowledge gaps analysis ("What We Don't Know")
    - Role-specific executive summaries (CTO, CFO, CEO views)
    """

    @property
    def name(self) -> str:
        return "Intelligence Analysis"

    def validate_input(self, ctx: ResearchContext) -> List[PhaseError]:
        """Validate required data is available."""
        errors = []
        if not ctx.findings:
            # Allow but warn - intelligence analysis can work with limited data
            logger.warning("No findings available for intelligence analysis")
        if not ctx.gemini_client:
            errors.append(PhaseError(
                phase_name=self.name,
                message="Gemini client required for intelligence analysis",
                recoverable=False,
            ))
        return errors

    async def execute(self, ctx: ResearchContext) -> PhaseResult[IntelligenceAnalysisResult]:
        """Run intelligence analysis on findings and perspectives.

        Args:
            ctx: Research context with findings and perspectives

        Returns:
            PhaseResult containing contradictions, gaps, and role summaries
        """
        validation_errors = self.validate_input(ctx)
        if validation_errors:
            return PhaseResult.failed(validation_errors[0])

        logger.info("Running intelligence analysis...")

        try:
            from ..intelligence import IntelligenceAnalyzer

            analyzer = IntelligenceAnalyzer(gemini_client=ctx.gemini_client)
            results = await analyzer.analyze(
                findings=ctx.findings,
                perspectives=ctx.perspectives_results,
                sources=ctx.unique_sources,
                query=ctx.query,
                template=ctx.template_type,
            )

            contradictions = results.get("contradictions", [])
            knowledge_gaps = results.get("knowledge_gaps", [])
            role_summaries = results.get("role_summaries", {})

            logger.info(
                f"Intelligence analysis complete: "
                f"{len(contradictions)} contradictions, "
                f"{len(knowledge_gaps)} gaps, "
                f"{len(role_summaries)} role summaries"
            )

            # Update context
            ctx.intelligence_results = results

            result = IntelligenceAnalysisResult(
                contradictions=contradictions,
                knowledge_gaps=knowledge_gaps,
                role_summaries=role_summaries,
            )

            return PhaseResult.completed(
                result,
                metrics={
                    "contradictions_count": len(contradictions),
                    "knowledge_gaps_count": len(knowledge_gaps),
                    "role_summaries_count": len(role_summaries),
                },
            )

        except Exception as e:
            # Intelligence analysis is optional, so return partial success
            logger.warning(f"Intelligence analysis failed: {e}")
            ctx.warnings.append(f"Intelligence analysis failed: {str(e)}")

            result = IntelligenceAnalysisResult(
                contradictions=[],
                knowledge_gaps=[],
                role_summaries={},
            )

            return PhaseResult.partial(
                result,
                [PhaseError(
                    phase_name=self.name,
                    message=str(e),
                    recoverable=True,
                    exception=e,
                )],
                metrics={"error": str(e)},
            )
