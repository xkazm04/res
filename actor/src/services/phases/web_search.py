"""Web search phase - executes grounded web searches and collects sources."""

import logging
from dataclasses import dataclass, field
from typing import Dict, Any, List

from .base import Phase, PhaseResult, PhaseError, ResearchContext
from ..transform import extract_source_dict

logger = logging.getLogger(__name__)


@dataclass
class WebSearchResult:
    """Result data from web search phase."""
    sources: List[Dict[str, Any]]
    content_segments: List[str]
    queries_executed: List[str]
    total_tokens: int = 0


class WebSearchPhase(Phase[WebSearchResult]):
    """Phase 2: Execute web searches and collect sources.

    Runs each generated search query through Gemini's grounded search,
    collecting sources and synthesized content for downstream processing.
    """

    @property
    def name(self) -> str:
        return "Web Search"

    def validate_input(self, ctx: ResearchContext) -> List[PhaseError]:
        """Validate search queries exist."""
        errors = []
        if not ctx.search_queries:
            errors.append(PhaseError(
                phase_name=self.name,
                message="No search queries available. Run QueryGenerationPhase first.",
                recoverable=False,
            ))
        if not ctx.gemini_client:
            errors.append(PhaseError(
                phase_name=self.name,
                message="Gemini client is required",
                recoverable=False,
            ))
        return errors

    async def execute(self, ctx: ResearchContext) -> PhaseResult[WebSearchResult]:
        """Execute web searches for all queries.

        Args:
            ctx: Research context with search_queries populated

        Returns:
            PhaseResult containing sources and synthesized content
        """
        validation_errors = self.validate_input(ctx)
        if validation_errors:
            return PhaseResult.failed(validation_errors[0])

        logger.info(f"Executing {len(ctx.search_queries)} searches...")

        all_sources: List[Dict[str, Any]] = []
        all_content: List[str] = []
        queries_executed: List[str] = []
        total_tokens = 0
        total_cost = 0.0
        errors: List[PhaseError] = []

        # Add input context if available
        if ctx.input_context_text:
            all_content.append(f"## Input Context\n\n{ctx.input_context_text}")

        for i, search_query in enumerate(ctx.search_queries):
            try:
                # Emit search started
                if ctx.progress_emitter:
                    await ctx.progress_emitter.search_started(
                        i, search_query, len(ctx.search_queries)
                    )

                logger.debug(f"Search {i+1}/{len(ctx.search_queries)}: {search_query[:50]}...")
                result = await ctx.gemini_client.research(search_query)

                # Track tokens
                tokens_used = 0
                if result.token_usage:
                    input_tokens = result.token_usage.input_tokens
                    output_tokens = result.token_usage.output_tokens
                    tokens_used = input_tokens + output_tokens
                    total_tokens += tokens_used
                    # Update context with detailed token tracking
                    ctx.input_tokens += input_tokens
                    ctx.output_tokens += output_tokens

                # Collect sources using transform pipeline
                sources_this_search = [extract_source_dict(s) for s in result.sources]
                all_sources.extend(sources_this_search)

                # Collect synthesized content
                if result.text:
                    all_content.append(f"## Search: {search_query}\n\n{result.text}")

                queries_executed.append(search_query)

                # Emit search completed
                if ctx.progress_emitter:
                    await ctx.progress_emitter.search_completed(
                        i, len(sources_this_search), 0,  # Findings counted later
                        total=len(ctx.search_queries),
                        tokens_used=tokens_used, cost_usd=ctx.cost_usd
                    )

                # Save query to database if configured
                if ctx.save_to_db and ctx.supabase_client and ctx.session_id:
                    try:
                        await ctx.supabase_client.save_query(
                            session_id=ctx.session_id,
                            query_text=search_query,
                            query_purpose=f"Search query {i+1}",
                            query_round=1,
                            result_count=len(result.sources),
                        )
                    except Exception as e:
                        logger.warning(f"Failed to save query: {e}")

            except Exception as e:
                error_msg = f"Search failed for '{search_query[:30]}...': {str(e)}"
                errors.append(PhaseError(
                    phase_name=self.name,
                    message=error_msg,
                    recoverable=True,
                    exception=e,
                ))
                ctx.warnings.append(error_msg)
                logger.warning(f"Search failed: {e}")

        # Build result
        search_result = WebSearchResult(
            sources=all_sources,
            content_segments=all_content,
            queries_executed=queries_executed,
            total_tokens=total_tokens,
        )

        # Update context
        ctx.all_sources = all_sources
        ctx.synthesized_content = "\n\n---\n\n".join(all_content)

        # Return partial success if some searches failed but we have results
        if errors and all_sources:
            return PhaseResult.partial(
                search_result,
                errors,
                metrics={
                    "sources_collected": len(all_sources),
                    "queries_executed": len(queries_executed),
                    "queries_failed": len(errors),
                    "tokens_used": total_tokens,
                },
            )

        if not all_sources:
            return PhaseResult.failed(PhaseError(
                phase_name=self.name,
                message="No sources collected from any search",
                recoverable=False,
            ))

        logger.info(f"Collected {len(all_sources)} sources from {len(queries_executed)} searches")
        return PhaseResult.completed(
            search_result,
            metrics={
                "sources_collected": len(all_sources),
                "queries_executed": len(queries_executed),
                "tokens_used": total_tokens,
            },
        )
