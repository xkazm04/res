"""Services for research operations."""

from .ocr import OCRService
from .cost_tracker import CostTracker
from .research import ResearchService
from .report import ReportService
from .progress import ProgressEmitter, ResearchPhase, ResearchEvent, CostSnapshot
from .state import StateManager, ResearchState
from .cache import CacheService
from .report_components import (
    ComponentType,
    ComponentConfig,
    ReportHints,
    render_component,
    render_components,
    get_report_hints,
    get_default_components,
    TEMPLATE_REPORT_HINTS,
)
from .report_component_renderer import (
    prepare_component_data,
    render_template_components,
    render_component_section,
    get_component_css,
)
from .report_component_styles import get_component_styles
from .exporters import (
    get_exporter,
    get_supported_formats,
    BaseExporter,
    ExportResult,
    PDFExporter,
    DOCXExporter,
    JSONLDExporter,
    ObsidianExporter,
    SlackExporter,
)
from .transform import (
    TransformPipeline,
    TransformResult,
    TransformError,
    TransformedResult,
    # High-level transform functions
    transform_research_result,
    transform_findings,
    transform_sources,
    transform_perspectives,
    transform_cost_summary,
    # Pipeline factories
    create_finding_pipeline,
    create_source_pipeline,
    create_perspective_pipeline,
    create_prediction_pipeline,
    create_cost_summary_pipeline,
    # Source utilities
    extract_source_dict,
    assess_credibility,
    credibility_label,
    enrich_source_credibility,
    extract_and_deduplicate_sources,
    enrich_findings_with_ids_and_sources,
)
from .bayesian_confidence import (
    BayesianConfidenceCalculator,
    ConfidenceExplanation,
    EvidenceNode,
    EvidenceType,
    calculate_bayesian_confidence,
    calculate_source_credibility,
)
from .phases import (
    Phase,
    PhaseResult,
    PhaseStatus,
    PhaseError,
    ResearchContext,
    ResearchPipeline,
    QueryGenerationPhase,
    WebSearchPhase,
    CredibilityAssessmentPhase,
    FindingExtractionPhase,
    PerspectiveAnalysisPhase,
    IntelligenceAnalysisPhase,
)

__all__ = [
    "OCRService",
    "CostTracker",
    "ResearchService",
    "ReportService",
    "ProgressEmitter",
    "ResearchPhase",
    "ResearchEvent",
    "CostSnapshot",
    "StateManager",
    "ResearchState",
    "CacheService",
    # Report Components
    "ComponentType",
    "ComponentConfig",
    "ReportHints",
    "render_component",
    "render_components",
    "get_report_hints",
    "get_default_components",
    "TEMPLATE_REPORT_HINTS",
    "prepare_component_data",
    "render_template_components",
    "render_component_section",
    "get_component_css",
    "get_component_styles",
    # Exporters
    "get_exporter",
    "get_supported_formats",
    "BaseExporter",
    "ExportResult",
    "PDFExporter",
    "DOCXExporter",
    "JSONLDExporter",
    "ObsidianExporter",
    "SlackExporter",
    # Transform Pipeline
    "TransformPipeline",
    "TransformResult",
    "TransformError",
    "TransformedResult",
    "transform_research_result",
    "transform_findings",
    "transform_sources",
    "transform_perspectives",
    "transform_cost_summary",
    "create_finding_pipeline",
    "create_source_pipeline",
    "create_perspective_pipeline",
    "create_prediction_pipeline",
    "create_cost_summary_pipeline",
    "extract_source_dict",
    "assess_credibility",
    "credibility_label",
    "enrich_source_credibility",
    "extract_and_deduplicate_sources",
    "enrich_findings_with_ids_and_sources",
    # Bayesian Confidence
    "BayesianConfidenceCalculator",
    "ConfidenceExplanation",
    "EvidenceNode",
    "EvidenceType",
    "calculate_bayesian_confidence",
    "calculate_source_credibility",
    # Phase-based Pipeline
    "Phase",
    "PhaseResult",
    "PhaseStatus",
    "PhaseError",
    "ResearchContext",
    "ResearchPipeline",
    "QueryGenerationPhase",
    "WebSearchPhase",
    "CredibilityAssessmentPhase",
    "FindingExtractionPhase",
    "PerspectiveAnalysisPhase",
    "IntelligenceAnalysisPhase",
]
