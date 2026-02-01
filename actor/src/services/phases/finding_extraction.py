"""Finding extraction phase - extracts structured findings from content."""

import logging
from dataclasses import dataclass
from typing import Dict, Any, List

from .base import Phase, PhaseResult, PhaseError, ResearchContext
from ..transform import enrich_findings_with_ids_and_sources

logger = logging.getLogger(__name__)


@dataclass
class FindingExtractionResult:
    """Result data from finding extraction phase."""
    findings: List[Dict[str, Any]]
    verified_count: int
    high_confidence_count: int


class FindingExtractionPhase(Phase[FindingExtractionResult]):
    """Phase 4: Extract and verify structured findings from content.

    Extracts findings using the template's finding extraction logic,
    then verifies them (bias detection, sanity checks, cross-reference).
    """

    @property
    def name(self) -> str:
        return "Finding Extraction"

    def validate_input(self, ctx: ResearchContext) -> List[PhaseError]:
        """Validate required data is available."""
        errors = []
        if not ctx.unique_sources:
            errors.append(PhaseError(
                phase_name=self.name,
                message="No sources available. Run CredibilityAssessmentPhase first.",
                recoverable=False,
            ))
        if not ctx.template:
            errors.append(PhaseError(
                phase_name=self.name,
                message="Template is required",
                recoverable=False,
            ))
        return errors

    async def execute(self, ctx: ResearchContext) -> PhaseResult[FindingExtractionResult]:
        """Extract and verify findings from synthesized content.

        Args:
            ctx: Research context with sources and synthesized content

        Returns:
            PhaseResult containing extracted and verified findings
        """
        validation_errors = self.validate_input(ctx)
        if validation_errors:
            return PhaseResult.failed(validation_errors[0])

        logger.info("Extracting findings...")

        try:
            # Extract findings using template
            findings = await ctx.template.extract_findings(
                query=ctx.query,
                sources=ctx.unique_sources,
                synthesized_content=ctx.synthesized_content,
                granularity=ctx.granularity,
            )

            if not findings:
                findings = []
                logger.warning("No findings extracted")

            # Enrich findings with IDs and supporting sources
            findings = enrich_findings_with_ids_and_sources(findings, ctx.unique_sources)

            # Verify findings
            logger.info("Verifying findings...")
            if ctx.progress_emitter:
                await ctx.progress_emitter.verification_started()

            try:
                findings = await ctx.template.verify_findings(
                    findings=findings,
                    sources=ctx.unique_sources,
                    original_query=ctx.query,
                )
                logger.info(f"Verified {len(findings)} findings")
            except Exception as e:
                ctx.warnings.append(f"Finding verification failed: {str(e)}")
                logger.warning(f"Verification failed: {e}")

            # Emit verification completed
            if ctx.progress_emitter:
                await ctx.progress_emitter.verification_completed(len(findings))

            # Count high confidence findings
            high_confidence_count = sum(
                1 for f in findings if f.get("confidence_score", 0) >= 0.7
            )

            # Update context
            ctx.findings = findings

            # Save findings to database if configured
            if ctx.save_to_db and ctx.supabase_client and ctx.session_id:
                try:
                    await ctx.supabase_client.save_findings(ctx.session_id, findings)
                    logger.info(f"Saved {len(findings)} findings to database")
                except Exception as e:
                    ctx.warnings.append(f"Failed to save findings: {str(e)}")
                    logger.warning(f"Failed to save findings: {e}")

            result = FindingExtractionResult(
                findings=findings,
                verified_count=len(findings),
                high_confidence_count=high_confidence_count,
            )

            logger.info(
                f"Finding extraction complete: {len(findings)} findings, "
                f"{high_confidence_count} high confidence"
            )

            return PhaseResult.completed(
                result,
                metrics={
                    "findings_count": len(findings),
                    "high_confidence_count": high_confidence_count,
                },
            )

        except Exception as e:
            logger.error(f"Finding extraction failed: {e}")
            return await self.handle_error(e, ctx)
