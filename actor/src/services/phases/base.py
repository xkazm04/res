"""Base types for the phase-based research pipeline.

Defines the Phase interface, PhaseResult container, and ResearchContext
for state management between phases.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, Generic, List, Optional, TypeVar, TYPE_CHECKING

if TYPE_CHECKING:
    from ..progress import ProgressEmitter
    from ...clients.gemini import GeminiClient
    from ...clients.supabase import SupabaseClient
    from ...templates.base import BaseTemplate


class PhaseStatus(str, Enum):
    """Status of a phase execution."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


@dataclass
class PhaseError:
    """Represents an error during phase execution."""
    phase_name: str
    message: str
    recoverable: bool = True
    exception: Optional[Exception] = None


T = TypeVar("T")


@dataclass
class PhaseResult(Generic[T]):
    """Result container for phase execution.

    Attributes:
        status: The execution status
        data: The output data from the phase (type varies by phase)
        errors: List of errors encountered (may still have data if partially successful)
        metrics: Performance metrics (tokens used, duration, etc.)
    """
    status: PhaseStatus
    data: Optional[T] = None
    errors: List[PhaseError] = field(default_factory=list)
    metrics: Dict[str, Any] = field(default_factory=dict)

    @property
    def success(self) -> bool:
        """True if phase completed successfully (may have warnings)."""
        return self.status == PhaseStatus.COMPLETED and self.data is not None

    @property
    def has_errors(self) -> bool:
        """True if any errors occurred."""
        return len(self.errors) > 0

    @classmethod
    def completed(cls, data: T, metrics: Optional[Dict[str, Any]] = None) -> "PhaseResult[T]":
        """Factory for successful completion."""
        return cls(status=PhaseStatus.COMPLETED, data=data, metrics=metrics or {})

    @classmethod
    def failed(cls, error: PhaseError, metrics: Optional[Dict[str, Any]] = None) -> "PhaseResult[T]":
        """Factory for failed execution."""
        return cls(status=PhaseStatus.FAILED, errors=[error], metrics=metrics or {})

    @classmethod
    def partial(cls, data: T, errors: List[PhaseError], metrics: Optional[Dict[str, Any]] = None) -> "PhaseResult[T]":
        """Factory for partial success with errors."""
        return cls(status=PhaseStatus.COMPLETED, data=data, errors=errors, metrics=metrics or {})


@dataclass
class ResearchContext:
    """Shared context passed between phases.

    This object carries state through the pipeline, accumulating results
    from each phase and providing access to shared dependencies.
    """
    # Core parameters
    query: str
    template_type: str
    granularity: str = "standard"
    max_searches: int = 5
    perspectives: Optional[List[str]] = None
    session_id: str = ""

    # Input context
    input_context_text: str = ""

    # Dependencies (injected)
    gemini_client: Optional["GeminiClient"] = None
    supabase_client: Optional["SupabaseClient"] = None
    progress_emitter: Optional["ProgressEmitter"] = None
    template: Optional["BaseTemplate"] = None

    # Configuration
    save_to_db: bool = True

    # Accumulated results (populated by phases)
    search_queries: List[str] = field(default_factory=list)
    all_sources: List[Dict[str, Any]] = field(default_factory=list)
    unique_sources: List[Dict[str, Any]] = field(default_factory=list)
    synthesized_content: str = ""
    findings: List[Dict[str, Any]] = field(default_factory=list)
    perspectives_results: List[Dict[str, Any]] = field(default_factory=list)
    intelligence_results: Dict[str, Any] = field(default_factory=dict)

    # Error tracking
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)

    # Cost tracking (simplified - detailed tracking via CostTracker)
    input_tokens: int = 0
    output_tokens: int = 0

    @property
    def tokens_used(self) -> int:
        """Total tokens used."""
        return self.input_tokens + self.output_tokens

    @property
    def cost_usd(self) -> float:
        """Approximate cost based on Gemini rates."""
        gemini_input_rate = 0.075  # per 1M tokens
        gemini_output_rate = 0.30  # per 1M tokens
        input_cost = (self.input_tokens / 1_000_000) * gemini_input_rate
        output_cost = (self.output_tokens / 1_000_000) * gemini_output_rate
        return input_cost + output_cost


class Phase(ABC, Generic[T]):
    """Abstract base class for research phases.

    Each phase:
    - Receives the ResearchContext
    - Performs a single responsibility
    - Returns a PhaseResult with typed output
    - Can emit progress events

    Example:
        class QueryGenerationPhase(Phase[List[str]]):
            async def execute(self, ctx: ResearchContext) -> PhaseResult[List[str]]:
                queries = await self._generate_queries(ctx)
                return PhaseResult.completed(queries)
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """Human-readable name for this phase."""
        pass

    def validate_input(self, ctx: ResearchContext) -> List[PhaseError]:
        """Validate that context has required data for this phase.

        Override in subclasses to add phase-specific validation.
        Returns list of errors (empty if valid).
        """
        return []

    @abstractmethod
    async def execute(self, ctx: ResearchContext) -> PhaseResult[T]:
        """Execute this phase.

        Args:
            ctx: The research context with accumulated state

        Returns:
            PhaseResult containing the phase output or errors
        """
        pass

    async def handle_error(self, error: Exception, ctx: ResearchContext) -> PhaseResult[T]:
        """Handle an exception during execution.

        Override to provide phase-specific error recovery.
        Default implementation returns a failed result.
        """
        return PhaseResult.failed(
            PhaseError(
                phase_name=self.name,
                message=str(error),
                recoverable=False,
                exception=error,
            )
        )
