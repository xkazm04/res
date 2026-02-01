"""Phase-based pipeline architecture for research orchestration.

This module decomposes the monolithic executeResearch method into single-responsibility
phase handlers, improving testability, maintainability, and enabling parallel execution.
"""

from .base import (
    Phase,
    PhaseResult,
    PhaseStatus,
    ResearchContext,
    PhaseError,
)
from .query_generation import QueryGenerationPhase
from .web_search import WebSearchPhase
from .credibility_assessment import CredibilityAssessmentPhase
from .finding_extraction import FindingExtractionPhase
from .perspective_analysis import PerspectiveAnalysisPhase
from .intelligence_analysis import IntelligenceAnalysisPhase
from .pipeline import ResearchPipeline

__all__ = [
    # Base types
    "Phase",
    "PhaseResult",
    "PhaseStatus",
    "ResearchContext",
    "PhaseError",
    # Phase implementations
    "QueryGenerationPhase",
    "WebSearchPhase",
    "CredibilityAssessmentPhase",
    "FindingExtractionPhase",
    "PerspectiveAnalysisPhase",
    "IntelligenceAnalysisPhase",
    # Orchestrator
    "ResearchPipeline",
]
