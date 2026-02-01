"""Credibility assessment phase - scores and labels source credibility."""

import logging
from dataclasses import dataclass
from typing import Dict, Any, List

from .base import Phase, PhaseResult, PhaseError, ResearchContext
from ..transform import enrich_source_credibility

logger = logging.getLogger(__name__)


@dataclass
class CredibilityResult:
    """Result data from credibility assessment phase."""
    unique_sources: List[Dict[str, Any]]
    duplicates_removed: int
    high_credibility_count: int
    medium_credibility_count: int
    low_credibility_count: int


class CredibilityAssessmentPhase(Phase[CredibilityResult]):
    """Phase 3: Assess credibility of collected sources.

    Deduplicates sources by URL and enriches each with:
    - Credibility score (0-1)
    - Credibility label (high/medium/low)

    Uses Bayesian probability inference based on domain authority.
    """

    @property
    def name(self) -> str:
        return "Credibility Assessment"

    def validate_input(self, ctx: ResearchContext) -> List[PhaseError]:
        """Validate sources are available."""
        errors = []
        if not ctx.all_sources:
            errors.append(PhaseError(
                phase_name=self.name,
                message="No sources available. Run WebSearchPhase first.",
                recoverable=False,
            ))
        return errors

    async def execute(self, ctx: ResearchContext) -> PhaseResult[CredibilityResult]:
        """Deduplicate and assess source credibility.

        Args:
            ctx: Research context with all_sources populated

        Returns:
            PhaseResult containing deduplicated, credibility-enriched sources
        """
        validation_errors = self.validate_input(ctx)
        if validation_errors:
            return PhaseResult.failed(validation_errors[0])

        logger.info(f"Assessing credibility for {len(ctx.all_sources)} sources...")

        # Deduplicate sources by URL
        seen_urls = set()
        unique_sources = []
        for source in ctx.all_sources:
            url = source.get("url", "")
            if url and url not in seen_urls:
                seen_urls.add(url)
                unique_sources.append(source)

        duplicates_removed = len(ctx.all_sources) - len(unique_sources)

        # Assess credibility for each source
        high_count = 0
        medium_count = 0
        low_count = 0

        for source in unique_sources:
            enrich_source_credibility(source)
            label = source.get("credibility_label", "low")
            if label == "high":
                high_count += 1
            elif label == "medium":
                medium_count += 1
            else:
                low_count += 1

        # Update context
        ctx.unique_sources = unique_sources

        # Save sources to database if configured
        if ctx.save_to_db and ctx.supabase_client and ctx.session_id:
            try:
                await ctx.supabase_client.save_sources(ctx.session_id, unique_sources)
                logger.info(f"Saved {len(unique_sources)} sources to database")
            except Exception as e:
                ctx.warnings.append(f"Failed to save sources: {str(e)}")
                logger.warning(f"Failed to save sources: {e}")

        result = CredibilityResult(
            unique_sources=unique_sources,
            duplicates_removed=duplicates_removed,
            high_credibility_count=high_count,
            medium_credibility_count=medium_count,
            low_credibility_count=low_count,
        )

        logger.info(
            f"Credibility assessment complete: {len(unique_sources)} unique sources "
            f"(high: {high_count}, medium: {medium_count}, low: {low_count}), "
            f"{duplicates_removed} duplicates removed"
        )

        return PhaseResult.completed(
            result,
            metrics={
                "unique_sources": len(unique_sources),
                "duplicates_removed": duplicates_removed,
                "high_credibility": high_count,
                "medium_credibility": medium_count,
                "low_credibility": low_count,
            },
        )
