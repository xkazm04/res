"""Transform pipeline for typed data transformations.

This module provides a declarative pipeline architecture for converting raw dicts
to typed Pydantic models with validation and enrichment stages.
"""

from typing import Any, Callable, Dict, Generic, List, Optional, Type, TypeVar, Union
from dataclasses import dataclass, field
from pydantic import BaseModel
import logging

from ..schemas import Finding, Source, Perspective, Prediction, CostSummary

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)
InputType = Dict[str, Any]


@dataclass
class TransformError:
    """Represents an error during transformation."""

    stage: str  # converter, validator, enricher
    field: Optional[str] = None
    message: str = ""
    original_value: Any = None


@dataclass
class TransformResult(Generic[T]):
    """Result of a transformation pipeline."""

    value: Optional[T] = None
    errors: List[TransformError] = field(default_factory=list)

    @property
    def success(self) -> bool:
        return self.value is not None and not self.errors

    @property
    def has_warnings(self) -> bool:
        return len(self.errors) > 0 and self.value is not None


# Type aliases for pipeline stages
Converter = Callable[[InputType], Dict[str, Any]]
Validator = Callable[[Dict[str, Any]], List[TransformError]]
Enricher = Callable[[Dict[str, Any], Optional[Any]], Dict[str, Any]]


class TransformPipeline(Generic[T]):
    """
    A composable transformation pipeline that converts raw dicts to typed models.

    The pipeline processes data through three stages:
    1. Converters: Map raw field names/values to model-compatible format
    2. Validators: Check data integrity and business rules
    3. Enrichers: Add computed fields or defaults

    Example:
        pipeline = TransformPipeline(Finding)
        pipeline.add_converter(finding_converter)
        pipeline.add_validator(confidence_validator)
        pipeline.add_enricher(add_finding_id)

        result = pipeline.transform(raw_dict, context={"index": 0})
    """

    def __init__(self, model_class: Type[T]):
        self.model_class = model_class
        self._converters: List[Converter] = []
        self._validators: List[Validator] = []
        self._enrichers: List[Enricher] = []

    def add_converter(self, converter: Converter) -> "TransformPipeline[T]":
        """Add a converter stage. Converters are applied in order."""
        self._converters.append(converter)
        return self

    def add_validator(self, validator: Validator) -> "TransformPipeline[T]":
        """Add a validator stage. All validators are run, errors collected."""
        self._validators.append(validator)
        return self

    def add_enricher(self, enricher: Enricher) -> "TransformPipeline[T]":
        """Add an enricher stage. Enrichers are applied in order."""
        self._enrichers.append(enricher)
        return self

    def transform(self, data: InputType, context: Optional[Any] = None) -> TransformResult[T]:
        """
        Transform a raw dict through the pipeline.

        Args:
            data: Raw dictionary to transform
            context: Optional context passed to enrichers (e.g., index, sources list)

        Returns:
            TransformResult with the typed model or errors
        """
        errors: List[TransformError] = []
        current_data = dict(data)  # Copy to avoid mutation

        # Stage 1: Apply converters
        for converter in self._converters:
            try:
                current_data = converter(current_data)
            except Exception as e:
                errors.append(TransformError(
                    stage="converter",
                    message=str(e),
                    original_value=data,
                ))
                return TransformResult(value=None, errors=errors)

        # Stage 2: Run validators
        for validator in self._validators:
            try:
                validation_errors = validator(current_data)
                errors.extend(validation_errors)
            except Exception as e:
                errors.append(TransformError(
                    stage="validator",
                    message=str(e),
                ))

        # If validation errors are critical, stop here
        critical_errors = [e for e in errors if e.stage == "validator"]
        if critical_errors:
            return TransformResult(value=None, errors=errors)

        # Stage 3: Apply enrichers
        for enricher in self._enrichers:
            try:
                current_data = enricher(current_data, context)
            except Exception as e:
                errors.append(TransformError(
                    stage="enricher",
                    message=str(e),
                ))

        # Stage 4: Create model instance
        try:
            model_instance = self.model_class(**current_data)
            return TransformResult(value=model_instance, errors=errors)
        except Exception as e:
            errors.append(TransformError(
                stage="model_creation",
                message=str(e),
                original_value=current_data,
            ))
            return TransformResult(value=None, errors=errors)

    def transform_many(
        self,
        items: List[InputType],
        context_factory: Optional[Callable[[int, InputType], Any]] = None,
    ) -> List[T]:
        """
        Transform a list of items, returning only successful transformations.

        Args:
            items: List of raw dictionaries
            context_factory: Optional function to create context for each item (index, item) -> context

        Returns:
            List of successfully transformed models
        """
        results = []
        for i, item in enumerate(items):
            context = context_factory(i, item) if context_factory else {"index": i}
            result = self.transform(item, context)
            if result.success:
                results.append(result.value)
            elif result.has_warnings:
                results.append(result.value)
                for error in result.errors:
                    logger.warning(f"Transform warning for item {i}: {error.message}")
            else:
                for error in result.errors:
                    logger.error(f"Transform error for item {i}: {error.message}")
        return results


# ============================================================================
# Pre-built converters for common transformations
# ============================================================================

def finding_converter(data: InputType) -> Dict[str, Any]:
    """Convert raw finding dict to Finding-compatible format."""
    return {
        "finding_id": data.get("finding_id", f"f{data.get('_index', 0)}"),
        "finding_type": data.get("finding_type", "fact"),
        "content": data.get("content", ""),
        "summary": data.get("summary"),
        "confidence_score": data.get("confidence_score", 0.5),
        "temporal_context": data.get("temporal_context", "present"),
        "extracted_data": data.get("extracted_data"),
        "supporting_sources": data.get("supporting_sources", []),
        "date_referenced": data.get("date_referenced"),
        "date_range": data.get("date_range"),
    }


def source_converter(data: InputType) -> Dict[str, Any]:
    """Convert raw source dict to Source-compatible format."""
    return {
        "url": data.get("url", ""),
        "title": data.get("title", ""),
        "domain": data.get("domain", ""),
        "snippet": data.get("snippet", ""),
        "source_type": data.get("source_type", "web"),
        "credibility_score": data.get("credibility_score"),
        "credibility_label": data.get("credibility_label"),
    }


def prediction_converter(data: InputType) -> Dict[str, Any]:
    """Convert raw prediction dict or string to Prediction-compatible format."""
    if isinstance(data, str):
        # Handle old-style string predictions
        return {
            "prediction": data,
            "rationale": "Based on research findings",
            "confidence": "medium",
            "timeline": "2025-2026",
            "supporting_sources": [],
        }
    return {
        "prediction": data.get("prediction", ""),
        "rationale": data.get("rationale", ""),
        "confidence": data.get("confidence", "medium"),
        "timeline": data.get("timeline", ""),
        "supporting_sources": data.get("supporting_sources", []),
    }


def perspective_converter(data: InputType) -> Dict[str, Any]:
    """Convert raw perspective dict to Perspective-compatible format (without predictions)."""
    return {
        "perspective_type": data.get("perspective_type", "unknown"),
        "analysis_text": data.get("analysis_text", ""),
        "key_insights": data.get("key_insights", []),
        "recommendations": data.get("recommendations", []),
        "warnings": data.get("warnings", []),
        "confidence": data.get("confidence", 0.5),
        # predictions handled separately by enricher
    }


def cost_summary_converter(data: InputType) -> Dict[str, Any]:
    """Convert raw cost dict to CostSummary-compatible format."""
    return {
        "total_tokens": data.get("total_tokens", 0),
        "input_tokens": data.get("input_tokens", 0),
        "output_tokens": data.get("output_tokens", 0),
        "gemini_cost_usd": data.get("gemini_cost_usd", 0),
        "openrouter_cost_usd": data.get("openrouter_cost_usd", 0),
        "total_cost_usd": data.get("total_cost_usd", 0),
    }


# ============================================================================
# Pre-built enrichers
# ============================================================================

def add_finding_id_enricher(data: Dict[str, Any], context: Optional[Any]) -> Dict[str, Any]:
    """Add finding ID based on index from context."""
    if context and isinstance(context, dict) and "index" in context:
        if not data.get("finding_id") or data["finding_id"].startswith("f0"):
            data["finding_id"] = f"f{context['index']}"
    return data


def add_supporting_sources_enricher(data: Dict[str, Any], context: Optional[Any]) -> Dict[str, Any]:
    """Add supporting sources from context."""
    if context and isinstance(context, dict) and "sources" in context:
        sources = context["sources"]
        if not data.get("supporting_sources") and sources:
            data["supporting_sources"] = [
                {"url": s.get("url", s.url if hasattr(s, "url") else ""),
                 "title": s.get("title", s.title if hasattr(s, "title") else "")}
                for s in sources[:3]
            ]
    return data


def convert_predictions_enricher(data: Dict[str, Any], context: Optional[Any]) -> Dict[str, Any]:
    """Convert raw predictions list to Prediction objects."""
    raw_predictions = data.get("_raw_predictions", data.get("predictions", []))

    if not raw_predictions:
        data["predictions"] = []
        return data

    prediction_pipeline = create_prediction_pipeline()
    converted = []

    for pred in raw_predictions:
        if isinstance(pred, Prediction):
            converted.append(pred)
        elif isinstance(pred, dict):
            result = prediction_pipeline.transform(pred)
            if result.success:
                converted.append(result.value)
        elif isinstance(pred, str):
            result = prediction_pipeline.transform(pred)
            if result.success:
                converted.append(result.value)

    data["predictions"] = converted
    # Remove temporary key
    data.pop("_raw_predictions", None)
    return data


# ============================================================================
# Pre-built pipelines
# ============================================================================

def create_finding_pipeline() -> TransformPipeline[Finding]:
    """Create a pipeline for Finding transformations."""
    return (
        TransformPipeline(Finding)
        .add_converter(finding_converter)
        .add_enricher(add_finding_id_enricher)
    )


def create_source_pipeline() -> TransformPipeline[Source]:
    """Create a pipeline for Source transformations."""
    return (
        TransformPipeline(Source)
        .add_converter(source_converter)
    )


def create_prediction_pipeline() -> TransformPipeline[Prediction]:
    """Create a pipeline for Prediction transformations."""
    return (
        TransformPipeline(Prediction)
        .add_converter(prediction_converter)
    )


def create_perspective_pipeline() -> TransformPipeline[Perspective]:
    """Create a pipeline for Perspective transformations (including predictions)."""

    def perspective_with_raw_predictions(data: InputType) -> Dict[str, Any]:
        """Converter that preserves raw predictions for enricher."""
        result = perspective_converter(data)
        result["_raw_predictions"] = data.get("predictions", [])
        return result

    return (
        TransformPipeline(Perspective)
        .add_converter(perspective_with_raw_predictions)
        .add_enricher(convert_predictions_enricher)
    )


def create_cost_summary_pipeline() -> TransformPipeline[CostSummary]:
    """Create a pipeline for CostSummary transformations."""
    return (
        TransformPipeline(CostSummary)
        .add_converter(cost_summary_converter)
    )


# ============================================================================
# High-level transformation functions
# ============================================================================

def transform_findings(
    raw_findings: List[Dict[str, Any]],
    sources: Optional[List[Dict[str, Any]]] = None,
) -> List[Finding]:
    """
    Transform a list of raw finding dicts to Finding objects.

    Args:
        raw_findings: List of raw finding dictionaries
        sources: Optional list of sources to attach as supporting sources

    Returns:
        List of Finding objects
    """
    pipeline = create_finding_pipeline()
    if sources:
        pipeline.add_enricher(add_supporting_sources_enricher)

    def context_factory(index: int, item: Dict[str, Any]) -> Dict[str, Any]:
        ctx = {"index": index}
        if sources:
            ctx["sources"] = sources
        return ctx

    return pipeline.transform_many(raw_findings, context_factory)


def transform_sources(raw_sources: List[Dict[str, Any]]) -> List[Source]:
    """Transform a list of raw source dicts to Source objects."""
    pipeline = create_source_pipeline()
    return pipeline.transform_many(raw_sources)


def transform_perspectives(raw_perspectives: List[Dict[str, Any]]) -> List[Perspective]:
    """Transform a list of raw perspective dicts to Perspective objects."""
    pipeline = create_perspective_pipeline()
    return pipeline.transform_many(raw_perspectives)


def transform_cost_summary(raw_cost: Dict[str, Any]) -> CostSummary:
    """Transform a raw cost dict to CostSummary object."""
    pipeline = create_cost_summary_pipeline()
    result = pipeline.transform(raw_cost)
    if result.success:
        return result.value
    # Return default on failure
    return CostSummary()


# ============================================================================
# Source extraction and credibility assessment
# ============================================================================

def extract_source_dict(gemini_source: Any) -> Dict[str, Any]:
    """
    Extract a dict from a GeminiSource or similar source object.

    Args:
        gemini_source: A source object with url, title, domain, snippet, source_type attributes

    Returns:
        Dictionary representation of the source
    """
    return {
        "url": getattr(gemini_source, "url", ""),
        "title": getattr(gemini_source, "title", ""),
        "domain": getattr(gemini_source, "domain", ""),
        "snippet": getattr(gemini_source, "snippet", ""),
        "source_type": getattr(gemini_source, "source_type", "web"),
    }


def assess_credibility(source: Dict[str, Any]) -> float:
    """
    Assess source credibility using Bayesian probability inference.

    This uses a proper probabilistic model where:
    - P(source is credible) depends on P(domain is authoritative)
    - Domain authority is based on known authoritative sources
    - Content signals can adjust the probability

    Returns:
        Credibility score between 0 and 1 (probability of credibility)
    """
    from .bayesian_confidence import calculate_source_credibility

    score, _ = calculate_source_credibility(source)
    return score


def credibility_label(score: float) -> str:
    """Get credibility label from score."""
    if score >= 0.8:
        return "high"
    elif score >= 0.6:
        return "medium"
    else:
        return "low"


def enrich_source_credibility(source: Dict[str, Any]) -> Dict[str, Any]:
    """Add credibility score and label to a source dict."""
    source["credibility_score"] = assess_credibility(source)
    source["credibility_label"] = credibility_label(source["credibility_score"])
    return source


def extract_and_deduplicate_sources(
    gemini_sources: List[Any],
    enrich_credibility: bool = True,
) -> List[Dict[str, Any]]:
    """
    Extract sources from Gemini results, deduplicate, and optionally assess credibility.

    Args:
        gemini_sources: List of GeminiSource objects
        enrich_credibility: Whether to add credibility scores

    Returns:
        List of deduplicated source dicts
    """
    seen_urls = set()
    unique_sources = []

    for gs in gemini_sources:
        source_dict = extract_source_dict(gs)
        if source_dict["url"] not in seen_urls:
            seen_urls.add(source_dict["url"])
            if enrich_credibility:
                source_dict = enrich_source_credibility(source_dict)
            unique_sources.append(source_dict)

    return unique_sources


def enrich_findings_with_ids_and_sources(
    findings: List[Dict[str, Any]],
    sources: List[Dict[str, Any]],
    max_sources_per_finding: int = 3,
) -> List[Dict[str, Any]]:
    """
    Enrich findings with IDs and supporting sources.

    Args:
        findings: List of raw finding dicts
        sources: List of source dicts to attach
        max_sources_per_finding: Maximum sources to attach per finding

    Returns:
        Enriched findings list
    """
    for i, finding in enumerate(findings):
        finding["finding_id"] = f"f{i+1}"
        finding["supporting_sources"] = [
            {"url": s["url"], "title": s["title"]}
            for s in sources[:max_sources_per_finding]
        ]
    return findings


# ============================================================================
# Batch transformation for complete research results
# ============================================================================

@dataclass
class TransformedResult:
    """Container for all transformed research result components."""

    findings: List[Finding]
    sources: List[Source]
    perspectives: List[Perspective]
    cost_summary: CostSummary


def transform_research_result(result: Dict[str, Any]) -> TransformedResult:
    """
    Transform a complete research result dict into typed components.

    This is the main entry point for converting Cloud Run / research service
    results into typed Pydantic models.

    Args:
        result: Raw research result dictionary

    Returns:
        TransformedResult with all typed components
    """
    sources = transform_sources(result.get("sources", []))

    # Transform findings with sources context
    findings = transform_findings(
        result.get("findings", []),
        sources=[{"url": s.url, "title": s.title} for s in sources],
    )

    perspectives = transform_perspectives(result.get("perspectives", []))
    cost_summary = transform_cost_summary(result.get("cost_summary", {}))

    return TransformedResult(
        findings=findings,
        sources=sources,
        perspectives=perspectives,
        cost_summary=cost_summary,
    )
