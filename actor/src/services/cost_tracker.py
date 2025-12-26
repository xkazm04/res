"""Cost and token tracking service."""

from typing import Dict, Any, Optional
from dataclasses import dataclass, field


@dataclass
class CostTracker:
    """Tracks token usage and costs across API calls."""

    # Gemini usage
    gemini_input_tokens: int = 0
    gemini_output_tokens: int = 0

    # OpenRouter usage (OCR)
    openrouter_tokens: int = 0

    # Cost rates per 1M tokens
    gemini_input_rate: float = 0.075
    gemini_output_rate: float = 0.30
    openrouter_rate: float = 0.50

    def add_gemini_usage(
        self,
        input_tokens: int = 0,
        output_tokens: int = 0,
    ) -> None:
        """Add Gemini API usage."""
        self.gemini_input_tokens += input_tokens
        self.gemini_output_tokens += output_tokens

    def add_openrouter_usage(
        self,
        tokens: int = 0,
    ) -> None:
        """Add OpenRouter API usage."""
        self.openrouter_tokens += tokens

    @property
    def total_tokens(self) -> int:
        """Get total tokens across all services."""
        return (
            self.gemini_input_tokens +
            self.gemini_output_tokens +
            self.openrouter_tokens
        )

    @property
    def gemini_cost_usd(self) -> float:
        """Calculate Gemini cost in USD."""
        input_cost = (self.gemini_input_tokens / 1_000_000) * self.gemini_input_rate
        output_cost = (self.gemini_output_tokens / 1_000_000) * self.gemini_output_rate
        return input_cost + output_cost

    @property
    def openrouter_cost_usd(self) -> float:
        """Calculate OpenRouter cost in USD."""
        return (self.openrouter_tokens / 1_000_000) * self.openrouter_rate

    @property
    def total_cost_usd(self) -> float:
        """Calculate total cost in USD."""
        return self.gemini_cost_usd + self.openrouter_cost_usd

    def get_summary(self) -> Dict[str, Any]:
        """Get cost summary as dictionary."""
        return {
            "total_tokens": self.total_tokens,
            "input_tokens": self.gemini_input_tokens,
            "output_tokens": self.gemini_output_tokens,
            "gemini_cost_usd": round(self.gemini_cost_usd, 6),
            "openrouter_cost_usd": round(self.openrouter_cost_usd, 6),
            "total_cost_usd": round(self.total_cost_usd, 6),
        }

    def reset(self) -> None:
        """Reset all counters."""
        self.gemini_input_tokens = 0
        self.gemini_output_tokens = 0
        self.openrouter_tokens = 0
