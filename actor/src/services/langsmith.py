"""Langsmith integration for LLM monitoring and tracing."""

import logging
import time
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, field
from contextlib import contextmanager
from functools import wraps

logger = logging.getLogger(__name__)

# Try to import langsmith
try:
    from langsmith import Client, traceable
    from langsmith.run_trees import RunTree
    LANGSMITH_AVAILABLE = True
except ImportError:
    LANGSMITH_AVAILABLE = False
    Client = None
    traceable = lambda *args, **kwargs: lambda f: f
    RunTree = None


@dataclass
class TokenUsage:
    """Token usage tracking."""
    input_tokens: int = 0
    output_tokens: int = 0
    total_tokens: int = 0

    def add(self, input_tokens: int = 0, output_tokens: int = 0):
        self.input_tokens += input_tokens
        self.output_tokens += output_tokens
        self.total_tokens = self.input_tokens + self.output_tokens


@dataclass
class CostEstimate:
    """Cost estimate based on token usage."""
    gemini_cost: float = 0.0
    openrouter_cost: float = 0.0
    total_cost: float = 0.0

    def add_gemini(self, input_tokens: int, output_tokens: int,
                   input_rate: float = 0.10, output_rate: float = 0.40):
        """Add Gemini cost (rates per 1M tokens)."""
        cost = (input_tokens / 1_000_000) * input_rate + (output_tokens / 1_000_000) * output_rate
        self.gemini_cost += cost
        self.total_cost += cost

    def add_openrouter(self, tokens: int, rate: float = 0.50):
        """Add OpenRouter cost (rate per 1M tokens)."""
        cost = (tokens / 1_000_000) * rate
        self.openrouter_cost += cost
        self.total_cost += cost


@dataclass
class MonitoringSession:
    """Session for tracking research execution."""
    session_id: str
    project: str
    tokens: TokenUsage = field(default_factory=TokenUsage)
    costs: CostEstimate = field(default_factory=CostEstimate)
    start_time: float = field(default_factory=time.time)
    events: List[Dict[str, Any]] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def add_event(self, event_type: str, data: Dict[str, Any]):
        """Add an event to the session."""
        self.events.append({
            "type": event_type,
            "timestamp": time.time(),
            "data": data
        })

    def get_duration(self) -> float:
        """Get session duration in seconds."""
        return time.time() - self.start_time

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "session_id": self.session_id,
            "project": self.project,
            "duration_seconds": self.get_duration(),
            "tokens": {
                "input": self.tokens.input_tokens,
                "output": self.tokens.output_tokens,
                "total": self.tokens.total_tokens,
            },
            "costs": {
                "gemini_usd": self.costs.gemini_cost,
                "openrouter_usd": self.costs.openrouter_cost,
                "total_usd": self.costs.total_cost,
            },
            "events_count": len(self.events),
            "metadata": self.metadata,
        }


class LangsmithMonitor:
    """Langsmith-based monitoring for the research actor."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        project: str = "deep-research-actor",
        enabled: bool = True,
    ):
        self.api_key = api_key
        self.project = project
        self.enabled = enabled and LANGSMITH_AVAILABLE and bool(api_key)
        self.client: Optional[Client] = None
        self.sessions: Dict[str, MonitoringSession] = {}

        if self.enabled:
            try:
                self.client = Client(api_key=api_key)
                logger.info("Langsmith monitoring initialized for project: %s", project)
            except Exception as e:
                logger.warning("Failed to initialize Langsmith client: %s", e)
                self.enabled = False

    def is_available(self) -> bool:
        """Check if monitoring is available."""
        return self.enabled and self.client is not None

    def create_session(self, session_id: str, metadata: Optional[Dict[str, Any]] = None) -> MonitoringSession:
        """Create a new monitoring session."""
        session = MonitoringSession(
            session_id=session_id,
            project=self.project,
            metadata=metadata or {}
        )
        self.sessions[session_id] = session

        if self.enabled:
            session.add_event("session_started", {"metadata": metadata})

        return session

    def get_session(self, session_id: str) -> Optional[MonitoringSession]:
        """Get an existing session."""
        return self.sessions.get(session_id)

    def track_llm_call(
        self,
        session_id: str,
        model: str,
        input_tokens: int,
        output_tokens: int,
        operation: str = "generate",
        metadata: Optional[Dict[str, Any]] = None,
    ):
        """Track an LLM call."""
        session = self.sessions.get(session_id)
        if not session:
            return

        # Update token counts
        session.tokens.add(input_tokens, output_tokens)

        # Calculate costs based on model
        if "gemini" in model.lower():
            session.costs.add_gemini(input_tokens, output_tokens)
        else:
            session.costs.add_openrouter(input_tokens + output_tokens)

        # Log event
        session.add_event("llm_call", {
            "model": model,
            "operation": operation,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "metadata": metadata or {},
        })

        # Send to Langsmith if enabled
        if self.enabled and self.client:
            try:
                self._log_to_langsmith(session_id, "llm_call", {
                    "model": model,
                    "operation": operation,
                    "tokens": {"input": input_tokens, "output": output_tokens},
                })
            except Exception as e:
                logger.debug("Failed to log to Langsmith: %s", e)

    def track_search(
        self,
        session_id: str,
        query: str,
        sources_count: int,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        """Track a search operation."""
        session = self.sessions.get(session_id)
        if not session:
            return

        session.add_event("search", {
            "query": query,
            "sources_count": sources_count,
            "metadata": metadata or {},
        })

    def track_extraction(
        self,
        session_id: str,
        findings_count: int,
        finding_types: Dict[str, int],
        metadata: Optional[Dict[str, Any]] = None,
    ):
        """Track finding extraction."""
        session = self.sessions.get(session_id)
        if not session:
            return

        session.add_event("extraction", {
            "findings_count": findings_count,
            "finding_types": finding_types,
            "metadata": metadata or {},
        })

    def track_perspective_analysis(
        self,
        session_id: str,
        perspective: str,
        insights_count: int,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        """Track perspective analysis."""
        session = self.sessions.get(session_id)
        if not session:
            return

        session.add_event("perspective_analysis", {
            "perspective": perspective,
            "insights_count": insights_count,
            "metadata": metadata or {},
        })

    def complete_session(
        self,
        session_id: str,
        status: str = "completed",
        result_summary: Optional[Dict[str, Any]] = None,
    ) -> Optional[Dict[str, Any]]:
        """Complete a monitoring session and return summary."""
        session = self.sessions.get(session_id)
        if not session:
            return None

        session.add_event("session_completed", {
            "status": status,
            "result_summary": result_summary or {},
        })

        summary = session.to_dict()

        # Send final summary to Langsmith
        if self.enabled and self.client:
            try:
                self._log_to_langsmith(session_id, "session_complete", summary)
            except Exception as e:
                logger.debug("Failed to log session completion: %s", e)

        return summary

    def _log_to_langsmith(self, session_id: str, event_type: str, data: Dict[str, Any]):
        """Internal method to log to Langsmith."""
        if not self.client:
            return

        try:
            # Create a run for tracking
            self.client.create_run(
                name=f"{event_type}_{session_id[:8]}",
                run_type="chain",
                inputs={"event_type": event_type, "session_id": session_id},
                outputs=data,
                project_name=self.project,
            )
        except Exception as e:
            logger.debug("Langsmith logging error: %s", e)

    @contextmanager
    def trace_operation(self, session_id: str, operation_name: str):
        """Context manager for tracing an operation."""
        start_time = time.time()
        session = self.sessions.get(session_id)

        try:
            yield
        finally:
            duration = time.time() - start_time
            if session:
                session.add_event("operation", {
                    "name": operation_name,
                    "duration_seconds": duration,
                })


def create_monitor(
    api_key: Optional[str] = None,
    project: str = "deep-research-actor",
    enabled: bool = True,
) -> LangsmithMonitor:
    """Factory function to create a monitor."""
    return LangsmithMonitor(api_key=api_key, project=project, enabled=enabled)


# Decorator for tracing functions
def traced(name: Optional[str] = None):
    """Decorator to trace a function with Langsmith."""
    def decorator(func):
        if LANGSMITH_AVAILABLE:
            return traceable(name=name or func.__name__)(func)
        return func
    return decorator
