"""State manager for migration recovery and checkpointing.

Handles Apify actor migrations by persisting state to KV store
and recovering on restart.
"""

import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field, asdict

logger = logging.getLogger(__name__)


@dataclass
class ResearchState:
    """Serializable research state for migration recovery."""

    # Phase tracking
    current_phase: str = "initialization"
    phase_completed: List[str] = field(default_factory=list)

    # Search progress
    search_queries: List[str] = field(default_factory=list)
    searches_completed: List[str] = field(default_factory=list)
    total_searches: int = 0

    # Results accumulation
    findings: List[Dict[str, Any]] = field(default_factory=list)
    sources: List[Dict[str, Any]] = field(default_factory=list)
    perspectives: List[Dict[str, Any]] = field(default_factory=list)

    # Cost tracking
    tokens_used: int = 0
    api_cost_usd: float = 0.0

    # Timing
    started_at: Optional[str] = None
    last_checkpoint: Optional[str] = None

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Optional[dict]) -> "ResearchState":
        """Create state from dict, handling missing fields gracefully."""
        if not data:
            return cls()

        # Filter to only known fields
        known_fields = {f.name for f in cls.__dataclass_fields__.values()}
        filtered_data = {k: v for k, v in data.items() if k in known_fields}
        return cls(**filtered_data)


class StateManager:
    """Manages state persistence and recovery for long-running research.

    Usage:
        state_manager = StateManager(session_id)
        await state_manager.initialize()

        # Load any existing state (after migration)
        state = await state_manager.load()

        # Update state during processing
        state_manager.state.current_phase = "web_search"
        state_manager.state.findings.append(new_finding)

        # Checkpoint periodically
        await state_manager.checkpoint()

        # On completion
        await state_manager.clear()
    """

    STATE_KEY = "STATE"

    def __init__(self, session_id: str):
        self.session_id = session_id
        self.state: Optional[ResearchState] = None
        self._actor = None
        self._store = None
        self._initialized = False

    async def initialize(self):
        """Initialize with Apify Actor context and register migration handlers."""
        try:
            from apify import Actor, Event

            self._actor = Actor
            self._store = await Actor.open_key_value_store()

            # Register migration handlers
            Actor.on(Event.MIGRATING, self._on_migrating)
            Actor.on(Event.ABORTING, self._on_aborting)
            Actor.on(Event.PERSIST_STATE, self._on_persist_state)

            self._initialized = True
            logger.info(f"[{self.session_id}] State manager initialized with migration handlers")

        except ImportError:
            logger.warning("Apify SDK not available, state persistence disabled")
            self.state = ResearchState(started_at=datetime.utcnow().isoformat())

    async def _on_migrating(self, event_data):
        """Handle migration event - save state immediately."""
        logger.warning(f"[{self.session_id}] Migration event received, saving state...")
        await self.checkpoint()

    async def _on_aborting(self, event_data):
        """Handle abort event - save state for potential resurrection."""
        logger.warning(f"[{self.session_id}] Abort event received, saving state...")
        await self.checkpoint()

    async def _on_persist_state(self, event_data):
        """Handle periodic persist state event."""
        logger.debug(f"[{self.session_id}] Persist state event, checkpointing...")
        await self.checkpoint()

    async def load(self) -> ResearchState:
        """Load state from KV store (for recovery after migration).

        Returns:
            ResearchState - either recovered state or fresh state
        """
        if self._store:
            try:
                saved_state = await self._store.get_value(self.STATE_KEY)
                if saved_state:
                    self.state = ResearchState.from_dict(saved_state)
                    logger.info(
                        f"[{self.session_id}] Recovered state from phase: {self.state.current_phase}, "
                        f"searches: {len(self.state.searches_completed)}/{self.state.total_searches}"
                    )
                    return self.state
            except Exception as e:
                logger.warning(f"Failed to load state: {e}")

        # Fresh state
        self.state = ResearchState(started_at=datetime.utcnow().isoformat())
        logger.info(f"[{self.session_id}] Starting with fresh state")
        return self.state

    async def checkpoint(self):
        """Persist current state to KV store.

        Call this periodically during long operations and after phase transitions.
        """
        if not self.state:
            return

        self.state.last_checkpoint = datetime.utcnow().isoformat()

        if self._store:
            try:
                await self._store.set_value(self.STATE_KEY, self.state.to_dict())
                logger.debug(
                    f"[{self.session_id}] State checkpointed at phase: {self.state.current_phase}"
                )
            except Exception as e:
                logger.warning(f"Failed to checkpoint state: {e}")

    async def clear(self):
        """Clear saved state after successful completion."""
        if self._store:
            try:
                await self._store.set_value(self.STATE_KEY, None)
                logger.info(f"[{self.session_id}] State cleared after completion")
            except Exception as e:
                logger.warning(f"Failed to clear state: {e}")

    # ─────────────────────────────────────────────────────────────────
    # Convenience methods for common state updates
    # ─────────────────────────────────────────────────────────────────

    def set_phase(self, phase: str):
        """Update current phase."""
        if self.state:
            if self.state.current_phase and self.state.current_phase not in self.state.phase_completed:
                self.state.phase_completed.append(self.state.current_phase)
            self.state.current_phase = phase

    def set_search_queries(self, queries: List[str]):
        """Set search queries to execute."""
        if self.state:
            self.state.search_queries = queries
            self.state.total_searches = len(queries)

    def mark_search_completed(self, query: str):
        """Mark a search query as completed."""
        if self.state and query not in self.state.searches_completed:
            self.state.searches_completed.append(query)

    def add_finding(self, finding: Dict[str, Any]):
        """Add a finding to accumulated results."""
        if self.state:
            self.state.findings.append(finding)

    def add_source(self, source: Dict[str, Any]):
        """Add a source to accumulated results."""
        if self.state:
            self.state.sources.append(source)

    def add_perspective(self, perspective: Dict[str, Any]):
        """Add a perspective to accumulated results."""
        if self.state:
            self.state.perspectives.append(perspective)

    def add_cost(self, tokens: int = 0, cost_usd: float = 0.0):
        """Add to cumulative cost tracking."""
        if self.state:
            self.state.tokens_used += tokens
            self.state.api_cost_usd += cost_usd

    def get_pending_searches(self) -> List[str]:
        """Get search queries not yet completed (for resumption)."""
        if self.state:
            completed_set = set(self.state.searches_completed)
            return [q for q in self.state.search_queries if q not in completed_set]
        return []

    def is_phase_completed(self, phase: str) -> bool:
        """Check if a phase was already completed (for resumption)."""
        if self.state:
            return phase in self.state.phase_completed
        return False
