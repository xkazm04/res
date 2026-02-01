"""Query generation phase - generates search queries from user query + template."""

import logging
from typing import List

from .base import Phase, PhaseResult, PhaseError, ResearchContext

logger = logging.getLogger(__name__)


class QueryGenerationPhase(Phase[List[str]]):
    """Phase 1: Generate search queries based on user query and template.

    Uses the template's search query generation logic to create
    focused, diverse search queries for web research.
    """

    @property
    def name(self) -> str:
        return "Query Generation"

    def validate_input(self, ctx: ResearchContext) -> List[PhaseError]:
        """Validate that we have required inputs."""
        errors = []
        if not ctx.query:
            errors.append(PhaseError(
                phase_name=self.name,
                message="Query is required",
                recoverable=False,
            ))
        if not ctx.template:
            errors.append(PhaseError(
                phase_name=self.name,
                message="Template is required",
                recoverable=False,
            ))
        return errors

    async def execute(self, ctx: ResearchContext) -> PhaseResult[List[str]]:
        """Generate search queries using the template.

        Args:
            ctx: Research context with query, template, and parameters

        Returns:
            PhaseResult containing list of search queries
        """
        validation_errors = self.validate_input(ctx)
        if validation_errors:
            return PhaseResult.failed(validation_errors[0])

        logger.info(f"Generating search queries for: {ctx.query[:50]}...")

        try:
            # Generate queries via template
            queries = await ctx.template.generate_search_queries(
                query=ctx.query,
                max_searches=ctx.max_searches,
                granularity=ctx.granularity,
            )

            if not queries:
                return PhaseResult.failed(PhaseError(
                    phase_name=self.name,
                    message="Failed to generate search queries",
                    recoverable=False,
                ))

            # Store in context for subsequent phases
            ctx.search_queries = queries

            # Emit progress event
            if ctx.progress_emitter:
                await ctx.progress_emitter.queries_generated(len(queries), queries)

            logger.info(f"Generated {len(queries)} search queries")
            return PhaseResult.completed(
                queries,
                metrics={"query_count": len(queries)},
            )

        except Exception as e:
            logger.error(f"Query generation failed: {e}")
            return await self.handle_error(e, ctx)
