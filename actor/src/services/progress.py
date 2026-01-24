"""Unified progress emitter for actor status updates and webhook events.

Consolidates StatusReporter and EventEmitter into a single service that handles:
- Apify Actor status updates (console visibility, KV store PROGRESS key)
- Webhook event delivery for real-time client progress tracking
- Cost tracking and phase progression
"""

import logging
import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, field, asdict
from enum import Enum

import httpx

logger = logging.getLogger(__name__)


class ResearchPhase(str, Enum):
    """Research lifecycle phases."""
    INITIALIZATION = "initialization"
    QUERY_GENERATION = "query_generation"
    WEB_SEARCH = "web_search"
    VERIFICATION = "verification"
    PERSPECTIVE_ANALYSIS = "perspective_analysis"
    REPORT_GENERATION = "report_generation"
    DELIVERY = "delivery"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class CostSnapshot:
    """Cumulative cost tracking at event time."""
    tokens_used: int = 0
    searches_completed: int = 0
    api_cost_usd: float = 0.0
    platform_cost_usd: float = 0.0
    total_cost_usd: float = 0.0

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class ResearchEvent:
    """Research event structure for webhook delivery."""
    event_type: str
    session_id: str
    apify_run_id: str
    phase: str
    phase_progress: float
    overall_progress: float
    cost_so_far: CostSnapshot
    data: Dict[str, Any] = field(default_factory=dict)
    event_id: str = field(default_factory=lambda: f"evt_{uuid.uuid4().hex[:12]}")
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")

    def to_dict(self) -> dict:
        return {
            "event_type": self.event_type,
            "event_id": self.event_id,
            "timestamp": self.timestamp,
            "session_id": self.session_id,
            "apify_run_id": self.apify_run_id,
            "phase": self.phase,
            "phase_progress": self.phase_progress,
            "overall_progress": self.overall_progress,
            "cost_so_far": self.cost_so_far.to_dict(),
            "data": self.data,
        }


class ProgressEmitter:
    """Unified progress emitter for status updates and webhook events.

    Combines StatusReporter and EventEmitter functionality:
    - Updates Actor.set_status_message() for console visibility
    - Maintains PROGRESS key in KV store for polling clients
    - Delivers events to client webhook URL
    - Tracks phase progression and costs
    """

    # Phase weights for overall progress calculation
    PHASE_WEIGHTS = {
        ResearchPhase.INITIALIZATION: (0.0, 0.05),
        ResearchPhase.QUERY_GENERATION: (0.05, 0.10),
        ResearchPhase.WEB_SEARCH: (0.10, 0.60),
        ResearchPhase.VERIFICATION: (0.60, 0.65),
        ResearchPhase.PERSPECTIVE_ANALYSIS: (0.65, 0.80),
        ResearchPhase.REPORT_GENERATION: (0.80, 0.95),
        ResearchPhase.DELIVERY: (0.95, 1.0),
        ResearchPhase.COMPLETED: (1.0, 1.0),
        ResearchPhase.FAILED: (0.0, 0.0),
    }

    def __init__(
        self,
        session_id: str,
        apify_run_id: str = "local",
        webhook_url: Optional[str] = None,
    ):
        self.session_id = session_id
        self.apify_run_id = apify_run_id
        self.webhook_url = webhook_url

        # Phase tracking
        self.phase = ResearchPhase.INITIALIZATION
        self.searches_total = 0
        self.searches_completed = 0
        self.findings_count = 0
        self.sources_count = 0
        self.started_at = datetime.utcnow()

        # Cost tracking
        self.cost = CostSnapshot()
        self.events_emitted: List[str] = []

        # Apify SDK references (initialized async)
        self._actor = None
        self._store = None

    async def initialize(self):
        """Initialize with Apify Actor context."""
        try:
            from apify import Actor
            self._actor = Actor
            self._store = await Actor.open_key_value_store()
        except ImportError:
            logger.warning("Apify SDK not available, status updates disabled")

    def update_cost(
        self,
        tokens: int = 0,
        searches: int = 0,
        api_cost: float = 0.0,
        platform_cost: float = 0.0,
    ):
        """Update cumulative cost tracking."""
        self.cost.tokens_used += tokens
        self.cost.searches_completed += searches
        self.cost.api_cost_usd += api_cost
        self.cost.platform_cost_usd += platform_cost
        self.cost.total_cost_usd = self.cost.api_cost_usd + self.cost.platform_cost_usd

    def _calculate_overall_progress(self, phase: ResearchPhase, phase_progress: float) -> float:
        """Calculate overall progress based on phase and phase progress."""
        start, end = self.PHASE_WEIGHTS.get(phase, (0.0, 0.0))
        return start + (end - start) * phase_progress

    # ─────────────────────────────────────────────────────────────────
    # Internal: Status and Event emission
    # ─────────────────────────────────────────────────────────────────

    async def _update_status(self, message: str, is_terminal: bool = False):
        """Update actor status message."""
        if self._actor:
            try:
                await self._actor.set_status_message(message, is_terminal=is_terminal)
            except Exception as e:
                logger.warning(f"Failed to update status: {e}")

    async def _update_progress(
        self,
        phase: ResearchPhase,
        percent: int,
        message: str,
        data: Optional[dict] = None,
    ):
        """Update PROGRESS key in KV store for polling clients."""
        if self._store:
            try:
                progress_data = {
                    "session_id": self.session_id,
                    "stage": phase.value,
                    "phase": phase.value,
                    "percent": percent,
                    "message": message,
                    "searches_completed": self.searches_completed,
                    "searches_total": self.searches_total,
                    "findings_count": self.findings_count,
                    "sources_count": self.sources_count,
                    "updated_at": datetime.utcnow().isoformat(),
                    "elapsed_seconds": (datetime.utcnow() - self.started_at).total_seconds(),
                }
                if data:
                    progress_data.update(data)
                await self._store.set_value("PROGRESS", progress_data)
            except Exception as e:
                logger.warning(f"Failed to update progress: {e}")

    async def _emit_event(
        self,
        event_type: str,
        phase: ResearchPhase,
        phase_progress: float,
        data: Optional[Dict[str, Any]] = None,
    ) -> Optional[ResearchEvent]:
        """Emit a research event to webhook."""
        overall_progress = self._calculate_overall_progress(phase, phase_progress)

        event = ResearchEvent(
            event_type=event_type,
            session_id=self.session_id,
            apify_run_id=self.apify_run_id,
            phase=phase.value,
            phase_progress=phase_progress,
            overall_progress=overall_progress,
            cost_so_far=CostSnapshot(**asdict(self.cost)),
            data=data or {},
        )

        self.events_emitted.append(event.event_id)

        # Deliver to webhook if configured
        if self.webhook_url:
            await self._deliver_webhook(event)

        return event

    async def _deliver_webhook(self, event: ResearchEvent):
        """Deliver event to webhook URL (non-blocking)."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    self.webhook_url,
                    json=event.to_dict(),
                    headers={"Content-Type": "application/json"},
                )
                if response.status_code >= 400:
                    logger.warning(
                        f"Webhook delivery failed: {response.status_code} - {response.text[:100]}"
                    )
                else:
                    logger.debug(f"Event {event.event_id} delivered to webhook")
        except httpx.TimeoutException:
            logger.warning(f"Webhook delivery timed out for event {event.event_id}")
        except Exception as e:
            logger.warning(f"Webhook delivery failed: {e}")

    # ─────────────────────────────────────────────────────────────────
    # Phase-specific progress methods
    # ─────────────────────────────────────────────────────────────────

    async def initialized(
        self,
        query: str,
        template: str,
        granularity: str,
        max_searches: int = 0,
    ) -> Optional[ResearchEvent]:
        """Report initialization complete."""
        self.phase = ResearchPhase.INITIALIZATION
        self.searches_total = max_searches

        message = f"Starting {granularity} {template} research..."
        data = {"query": query, "template": template, "granularity": granularity}

        # Status update
        await self._update_status(message)
        await self._update_progress(self.phase, 0, message, data)
        logger.info(f"[{self.session_id}] {message}")

        # Webhook event
        return await self._emit_event("research.initialized", self.phase, 1.0, data)

    async def queries_generated(
        self,
        count: int,
        queries: List[str],
    ) -> Optional[ResearchEvent]:
        """Report search queries generated."""
        self.phase = ResearchPhase.QUERY_GENERATION
        self.searches_total = count

        message = f"Generated {count} search queries"
        data = {"queries": queries, "query_count": count}

        # Status update
        await self._update_status(f"{message} (5%)")
        await self._update_progress(self.phase, 5, message, {"queries": queries[:5], "query_count": count})
        logger.info(f"[{self.session_id}] {message}")

        # Webhook event
        return await self._emit_event("research.queries_generated", self.phase, 1.0, data)

    async def search_started(
        self,
        index: int,
        query: str,
        total: Optional[int] = None,
    ) -> Optional[ResearchEvent]:
        """Report search starting."""
        self.phase = ResearchPhase.WEB_SEARCH
        total_searches = total or self.searches_total

        progress = 5 + int((index / total_searches) * 50) if total_searches > 0 else 5
        short_query = query[:40] + "..." if len(query) > 40 else query
        message = f"Searching [{index + 1}/{total_searches}]: {short_query}"

        # Status update
        await self._update_status(f"{message} ({progress}%)")
        await self._update_progress(self.phase, progress, message, {
            "current_search_index": index + 1,
            "current_query": query,
        })

        # Webhook event
        return await self._emit_event(
            "research.search_started",
            self.phase,
            index / total_searches if total_searches > 0 else 0,
            {"search_index": index, "query": query, "total_searches": total_searches},
        )

    async def search_completed(
        self,
        index: int,
        sources_found: int,
        findings_extracted: int,
        total: Optional[int] = None,
        tokens_used: int = 0,
        cost_usd: float = 0.0,
    ) -> Optional[ResearchEvent]:
        """Report search completed."""
        total_searches = total or self.searches_total
        self.searches_completed = index + 1
        self.sources_count += sources_found
        self.findings_count += findings_extracted

        # Update cost tracking
        self.update_cost(tokens=tokens_used, searches=1, api_cost=cost_usd)

        progress = 5 + int((self.searches_completed / total_searches) * 50) if total_searches > 0 else 55
        message = f"Search {self.searches_completed}/{total_searches} complete: +{findings_extracted} findings"

        # Status update
        await self._update_status(f"{message} ({progress}%)")
        await self._update_progress(self.phase, progress, message, {
            "last_search_sources": sources_found,
            "last_search_findings": findings_extracted,
        })
        logger.info(f"[{self.session_id}] Search {self.searches_completed}: {sources_found} sources, {findings_extracted} findings")

        # Webhook event
        return await self._emit_event(
            "research.search_completed",
            self.phase,
            self.searches_completed / total_searches if total_searches > 0 else 1.0,
            {
                "search_index": self.searches_completed,
                "total_searches": total_searches,
                "sources_found": sources_found,
                "findings_extracted": findings_extracted,
            },
        )

    async def verification_started(self) -> Optional[ResearchEvent]:
        """Report verification phase starting."""
        self.phase = ResearchPhase.VERIFICATION

        message = "Verifying findings (bias detection, sanity checks)..."

        # Status update
        await self._update_status(f"{message} (58%)")
        await self._update_progress(self.phase, 58, message)
        logger.info(f"[{self.session_id}] {message}")

        # Webhook event
        return await self._emit_event("research.verification_started", self.phase, 0.0, {})

    async def verification_completed(
        self,
        adjusted_count: int,
    ) -> Optional[ResearchEvent]:
        """Report verification complete."""
        message = f"Verification complete: {adjusted_count} findings validated"

        # Status update
        await self._update_status(f"{message} (62%)")
        await self._update_progress(self.phase, 62, message, {"validated_findings": adjusted_count})
        logger.info(f"[{self.session_id}] {message}")

        # Webhook event
        return await self._emit_event(
            "research.verification_completed",
            self.phase,
            1.0,
            {"findings_validated": adjusted_count},
        )

    async def perspectives_started(
        self,
        perspective_types: List[str],
    ) -> Optional[ResearchEvent]:
        """Report perspective analysis starting."""
        self.phase = ResearchPhase.PERSPECTIVE_ANALYSIS
        count = len(perspective_types)

        message = f"Analyzing from {count} expert perspectives..."

        # Status update
        await self._update_status(f"{message} (65%)")
        await self._update_progress(self.phase, 65, message, {
            "perspective_types": perspective_types,
            "perspectives_count": count,
        })
        logger.info(f"[{self.session_id}] {message}")

        # Webhook event
        return await self._emit_event(
            "research.perspectives_started",
            self.phase,
            0.0,
            {"perspective_types": perspective_types, "perspectives_count": count},
        )

    async def perspectives_completed(
        self,
        count: int,
        insights_count: int,
        tokens_used: int = 0,
        cost_usd: float = 0.0,
    ) -> Optional[ResearchEvent]:
        """Report perspective analysis complete."""
        # Update cost tracking
        self.update_cost(tokens=tokens_used, api_cost=cost_usd)

        message = f"Expert analysis complete: {count} perspectives, {insights_count} insights"

        # Status update
        await self._update_status(f"{message} (80%)")
        await self._update_progress(self.phase, 80, message, {
            "perspectives_generated": count,
            "total_insights": insights_count,
        })
        logger.info(f"[{self.session_id}] {message}")

        # Webhook event
        return await self._emit_event(
            "research.perspectives_completed",
            self.phase,
            1.0,
            {"perspectives_count": count, "insights_count": insights_count},
        )

    async def report_started(
        self,
        variant: str,
        format: str,
    ) -> Optional[ResearchEvent]:
        """Report generation starting."""
        self.phase = ResearchPhase.REPORT_GENERATION

        message = f"Generating {variant} report ({format})..."

        # Status update
        await self._update_status(f"{message} (85%)")
        await self._update_progress(self.phase, 85, message, {
            "report_variant": variant,
            "report_format": format,
        })
        logger.info(f"[{self.session_id}] {message}")

        # Webhook event
        return await self._emit_event(
            "research.report_started",
            self.phase,
            0.0,
            {"report_variant": variant, "report_format": format},
        )

    async def report_completed(
        self,
        report_length: int,
        tokens_used: int = 0,
        cost_usd: float = 0.0,
    ) -> Optional[ResearchEvent]:
        """Report generation complete."""
        # Update cost tracking
        self.update_cost(tokens=tokens_used, api_cost=cost_usd)

        message = f"Report generated ({report_length:,} characters)"

        # Status update
        await self._update_status(f"{message} (92%)")
        await self._update_progress(self.phase, 92, message, {"report_length": report_length})
        logger.info(f"[{self.session_id}] {message}")

        # Webhook event
        return await self._emit_event(
            "research.report_completed",
            self.phase,
            1.0,
            {"report_length": report_length},
        )

    async def delivery_started(
        self,
        channels: List[str],
    ) -> Optional[ResearchEvent]:
        """Report delivery starting."""
        self.phase = ResearchPhase.DELIVERY

        message = f"Delivering results to {', '.join(channels)}..."

        # Status update
        await self._update_status(f"{message} (95%)")
        await self._update_progress(self.phase, 95, message, {"delivery_channels": channels})
        logger.info(f"[{self.session_id}] {message}")

        # Webhook event
        return await self._emit_event(
            "research.delivery_started",
            self.phase,
            0.0,
            {"channels": channels},
        )

    async def email_sent(
        self,
        recipient: str,
        success: bool,
    ) -> Optional[ResearchEvent]:
        """Report email sent."""
        return await self._emit_event(
            "research.email_sent",
            ResearchPhase.DELIVERY,
            0.5,
            {"recipient": recipient, "success": success},
        )

    async def completed(
        self,
        findings_count: int,
        sources_count: int,
        total_cost_usd: float,
        perspectives_count: int = 0,
        execution_time_seconds: float = 0.0,
        results_url: str = "",
    ) -> Optional[ResearchEvent]:
        """Report research completed (terminal status)."""
        self.phase = ResearchPhase.COMPLETED

        elapsed = execution_time_seconds or (datetime.utcnow() - self.started_at).total_seconds()
        message = f"Complete: {findings_count} findings, {sources_count} sources (${total_cost_usd:.4f}, {elapsed:.0f}s)"

        # Status update (terminal)
        await self._update_status(message, is_terminal=True)
        await self._update_progress(self.phase, 100, message, {
            "final_findings_count": findings_count,
            "final_sources_count": sources_count,
            "total_cost_usd": total_cost_usd,
            "execution_time_seconds": elapsed,
        })
        logger.info(f"[{self.session_id}] Research completed: {message}")

        # Webhook event
        return await self._emit_event(
            "research.completed",
            self.phase,
            1.0,
            {
                "findings_count": findings_count,
                "perspectives_count": perspectives_count,
                "sources_count": sources_count,
                "execution_time_seconds": elapsed,
                "results_url": results_url,
            },
        )

    async def failed(
        self,
        error: str,
        error_code: str = "RESEARCH_FAILED",
        phase: Optional[str] = None,
    ) -> Optional[ResearchEvent]:
        """Report research failed (terminal status)."""
        failed_phase = phase or self.phase.value if isinstance(self.phase, ResearchPhase) else str(self.phase)
        self.phase = ResearchPhase.FAILED

        message = f"Failed at {failed_phase}: {error[:100]}"

        # Status update (terminal)
        await self._update_status(message, is_terminal=True)
        await self._update_progress(self.phase, -1, message, {
            "error": error,
            "failed_phase": failed_phase,
        })
        logger.error(f"[{self.session_id}] Research failed: {error}")

        # Webhook event
        return await self._emit_event(
            "research.failed",
            self.phase,
            0.0,
            {"error": error, "error_code": error_code, "failed_phase": failed_phase},
        )
