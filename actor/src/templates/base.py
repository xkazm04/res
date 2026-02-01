"""Base research template with data-driven architecture."""

from abc import ABC
from dataclasses import dataclass, field
from enum import Enum
from typing import List, Dict, Any, Optional, Type, Set, ClassVar
import inspect
import warnings

from ..clients.gemini import GeminiClient


# ========== FINDING TYPE VALIDATION ==========

class FindingType(str, Enum):
    """Base class for template-specific finding type enums.

    Inherits from str to allow seamless string comparison and JSON serialization.
    Each template should define its own FindingType enum inheriting from this.

    Example:
        class DueDiligenceFindingType(FindingType):
            COMPANY_PROFILE = "company_profile"
            FINANCIAL_HEALTH = "financial_health"
            RED_FLAG = "red_flag"
    """

    @classmethod
    def values(cls) -> Set[str]:
        """Get all valid finding type values as strings."""
        return {member.value for member in cls}

    @classmethod
    def from_string(cls, value: str) -> 'FindingType':
        """Convert string to enum member, raising ValueError if invalid."""
        for member in cls:
            if member.value == value:
                return member
        raise ValueError(f"'{value}' is not a valid {cls.__name__}. Valid values: {cls.values()}")

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """Check if a string is a valid finding type."""
        return value in cls.values()


def validate_finding_types(template_class: Type['BaseTemplate']) -> List[str]:
    """Validate that all finding_type references in a template match its config.

    Scans method source code for finding_type string literals and compares
    them against the template's configured finding_types.

    Args:
        template_class: The template class to validate

    Returns:
        List of validation error messages (empty if valid)
    """
    errors = []

    # Get configured finding types
    config = getattr(template_class, 'config', None)
    if config is None:
        return errors  # No config = no validation needed

    configured_types = {ft.name for ft in config.finding_types}

    # Also check priority_finding_types and grouping_order
    for priority_type in config.priority_finding_types:
        if priority_type not in configured_types:
            errors.append(
                f"{template_class.__name__}: priority_finding_types contains '{priority_type}' "
                f"but it's not in finding_types config"
            )

    for group_type in config.grouping_order:
        if group_type not in configured_types:
            errors.append(
                f"{template_class.__name__}: grouping_order contains '{group_type}' "
                f"but it's not in finding_types config"
            )

    # Scan method source for finding_type references
    finding_type_pattern = 'finding_type'
    string_patterns = ['"', "'"]

    for name, method in inspect.getmembers(template_class, predicate=inspect.isfunction):
        if name.startswith('_') and not name.startswith('_generate'):
            continue  # Skip private methods except report generators

        try:
            source = inspect.getsource(method)
        except (OSError, TypeError):
            continue  # Can't get source for built-in methods

        # Look for patterns like: finding_type == "xxx" or get("finding_type") == "xxx"
        # or f.get("finding_type") == "xxx"
        if finding_type_pattern not in source:
            continue

        # Extract string literals that appear near finding_type
        lines = source.split('\n')
        for line_num, line in enumerate(lines, 1):
            if finding_type_pattern not in line:
                continue

            # Find quoted strings in this line
            for quote in string_patterns:
                idx = 0
                while True:
                    start = line.find(quote, idx)
                    if start == -1:
                        break
                    end = line.find(quote, start + 1)
                    if end == -1:
                        break

                    potential_type = line[start + 1:end]
                    idx = end + 1

                    # Skip if it's a key like "finding_type" itself or common patterns
                    if potential_type in ('finding_type', 'content', 'summary', 'extracted_data'):
                        continue

                    # Check if this looks like a finding type reference
                    # Must be lowercase with underscores, reasonable length
                    if (potential_type and
                        potential_type.replace('_', '').isalpha() and
                        len(potential_type) < 30 and
                        potential_type == potential_type.lower()):

                        # Check if it's likely a finding type by context
                        if ('finding_type' in line[:start] or
                            '== "' in line[start-5:start] or
                            "== '" in line[start-5:start] or
                            'in [' in line[:start] or
                            'in ("' in line[:start]):

                            if potential_type not in configured_types:
                                errors.append(
                                    f"{template_class.__name__}.{name}: references finding_type "
                                    f"'{potential_type}' which is not in config. "
                                    f"Valid types: {sorted(configured_types)}"
                                )

    return errors


def validates_finding_types(method):
    """Decorator to mark methods that use finding types (for documentation).

    This is primarily for documentation/IDE hints. Actual validation happens
    at class initialization time via __init_subclass__.
    """
    method._uses_finding_types = True
    return method


# ========== DECLARATIVE REPORT BUILDER ==========

class MarkdownBuilder:
    """Utility class for common markdown generation patterns."""

    @staticmethod
    def header(title: str, level: int = 1) -> str:
        """Generate a markdown header."""
        return f"{'#' * level} {title}"

    @staticmethod
    def metadata(label: str, value: str) -> str:
        """Generate a bold label with value."""
        return f"**{label}:** {value}"

    @staticmethod
    def bullet(text: str, prefix: str = "") -> str:
        """Generate a bullet point with optional prefix."""
        if prefix:
            return f"- **{prefix}** {text}"
        return f"- {text}"

    @staticmethod
    def divider() -> str:
        """Generate a horizontal divider."""
        return "---"

    @staticmethod
    def table(headers: List[str], rows: List[List[str]]) -> str:
        """Generate a markdown table."""
        if not headers or not rows:
            return ""
        lines = []
        lines.append("| " + " | ".join(headers) + " |")
        lines.append("|" + "|".join(["------" for _ in headers]) + "|")
        for row in rows:
            # Pad row to match headers if needed
            padded = row + [""] * (len(headers) - len(row))
            lines.append("| " + " | ".join(str(c) for c in padded[:len(headers)]) + " |")
        return "\n".join(lines)

    @staticmethod
    def format_extracted_field(extracted: Dict[str, Any], field: str, label: str = "") -> str:
        """Format a field from extracted_data with optional label."""
        value = extracted.get(field, "")
        if not value:
            return ""
        if label:
            return f"**{label}:** {value}"
        return str(value)


@dataclass
class SectionSpec:
    """Declarative specification for a report section.

    Defines how to filter, transform, and render findings into a report section.
    """
    title: str
    finding_types: List[str] = field(default_factory=list)  # Filter by these types
    max_items: int = 10
    show_if_empty: bool = False
    empty_message: str = "No items found."
    header_level: int = 2

    # Rendering options
    render_style: str = "bullet"  # "bullet", "detailed", "table", "custom"
    show_confidence: bool = False
    show_extracted_data: bool = False

    # Extracted data formatting
    extracted_fields: List[str] = field(default_factory=list)  # Fields to show from extracted_data
    extracted_format: str = "inline"  # "inline", "list", "prefix"

    # Custom prefix based on extracted_data field
    prefix_field: str = ""  # e.g., "severity" to show [HIGH], [MEDIUM]
    prefix_transform: str = "upper"  # "upper", "title", "none"

    # Filter function name (method on template class)
    custom_filter: str = ""  # e.g., "filter_high_severity_red_flags"

    # Custom renderer function name (method on template class)
    custom_renderer: str = ""  # e.g., "render_connected_entities"


@dataclass
class ReportVariantSpec:
    """Declarative specification for a complete report variant.

    Defines the structure of a report variant (e.g., executive_summary, risk_summary).
    """
    variant_name: str
    title_template: str = "{variant}: {query}"  # e.g., "Risk Summary: {query}"
    show_divider: bool = True
    show_date: bool = True
    query_label: str = "Subject"

    # Sections to include in order
    sections: List[SectionSpec] = field(default_factory=list)

    # Optional assessment section at the top
    assessment_section: Optional['AssessmentSpec'] = None

    # Include perspective warnings/recommendations
    include_perspective_warnings: bool = False
    include_perspective_recommendations: bool = False
    max_warnings: int = 8
    max_recommendations: int = 6


@dataclass
class AssessmentSpec:
    """Specification for a risk/status assessment section."""
    title: str = "Assessment"
    assessment_type: str = "risk"  # "risk", "verdict", "score"

    # For risk assessment
    high_threshold: int = 1  # Number of high-severity items to trigger HIGH risk
    medium_threshold: int = 1  # Number of any items to trigger MEDIUM risk
    finding_type: str = "red_flag"  # Finding type to count
    severity_field: str = "severity"  # Field in extracted_data for severity

    # Labels
    high_label: str = "**RISK LEVEL: HIGH** - Significant concerns identified"
    medium_label: str = "**RISK LEVEL: MEDIUM** - Some concerns warrant attention"
    low_label: str = "**RISK LEVEL: LOW** - No major red flags detected"


class ReportBuilder:
    """Declarative report builder that renders reports from specifications.

    Eliminates ~80% of duplicated report generation code by providing
    a declarative way to define report structure.

    Usage:
        # Define sections declaratively
        RISK_SUMMARY_SPEC = ReportVariantSpec(
            variant_name="risk_summary",
            title_template="Due Diligence: {query}",
            assessment_section=AssessmentSpec(finding_type="red_flag"),
            sections=[
                SectionSpec(
                    title="Red Flags",
                    finding_types=["red_flag"],
                    max_items=6,
                    prefix_field="severity",
                ),
                SectionSpec(
                    title="Legal History",
                    finding_types=["legal_history"],
                    max_items=5,
                ),
            ],
        )

        # Generate report
        builder = ReportBuilder(result, template)
        markdown = builder.render(RISK_SUMMARY_SPEC)
    """

    def __init__(
        self,
        result: Dict[str, Any],
        template: Optional['BaseTemplate'] = None,
    ):
        self.result = result
        self.template = template
        self.findings = result.get("findings", [])
        self.perspectives = result.get("perspectives", [])
        self.query = result.get("query", "Unknown")

    def render(self, spec: ReportVariantSpec, title: Optional[str] = None) -> str:
        """Render a complete report from a variant specification."""
        from datetime import datetime

        sections: List[str] = []

        # Header
        report_title = title or spec.title_template.format(
            variant=spec.variant_name.replace("_", " ").title(),
            query=self.query[:50]
        )
        sections.append(MarkdownBuilder.header(report_title, 1))
        sections.append("")

        # Metadata
        sections.append(MarkdownBuilder.metadata(spec.query_label, self.query))
        if spec.show_date:
            sections.append(MarkdownBuilder.metadata("Date", datetime.now().strftime('%B %d, %Y')))
        sections.append("")

        if spec.show_divider:
            sections.append(MarkdownBuilder.divider())
            sections.append("")

        # Assessment section (if defined)
        if spec.assessment_section:
            assessment_content = self._render_assessment(spec.assessment_section)
            if assessment_content:
                sections.append(assessment_content)
                sections.append("")

        # Render each section
        for section_spec in spec.sections:
            section_content = self._render_section(section_spec)
            if section_content:
                sections.append(section_content)
                sections.append("")

        # Perspective warnings
        if spec.include_perspective_warnings:
            warnings_content = self._render_perspective_warnings(spec.max_warnings)
            if warnings_content:
                sections.append(warnings_content)
                sections.append("")

        # Perspective recommendations
        if spec.include_perspective_recommendations:
            recs_content = self._render_perspective_recommendations(spec.max_recommendations)
            if recs_content:
                sections.append(recs_content)
                sections.append("")

        return "\n".join(sections)

    def _render_assessment(self, spec: AssessmentSpec) -> str:
        """Render an assessment section."""
        lines: List[str] = []
        lines.append(MarkdownBuilder.header(spec.title, 2))
        lines.append("")

        # Filter findings by type
        typed_findings = [f for f in self.findings if f.get("finding_type") == spec.finding_type]

        # Count high severity items
        high_severity_count = 0
        for f in typed_findings:
            extracted = f.get("extracted_data", {})
            if isinstance(extracted, dict):
                severity = extracted.get(spec.severity_field, "").lower()
                if severity == "high" or severity == "critical":
                    high_severity_count += 1

        # Determine risk level
        if high_severity_count >= spec.high_threshold:
            lines.append(spec.high_label)
        elif len(typed_findings) >= spec.medium_threshold:
            lines.append(spec.medium_label)
        else:
            lines.append(spec.low_label)

        return "\n".join(lines)

    def _render_section(self, spec: SectionSpec) -> str:
        """Render a single section from specification."""
        # Filter findings
        if spec.finding_types:
            section_findings = [
                f for f in self.findings
                if f.get("finding_type") in spec.finding_types
            ]
        else:
            section_findings = self.findings.copy()

        # Apply custom filter if specified
        if spec.custom_filter and self.template:
            filter_method = getattr(self.template, spec.custom_filter, None)
            if filter_method and callable(filter_method):
                section_findings = filter_method(section_findings)

        # Limit items
        section_findings = section_findings[:spec.max_items]

        # Check if we should render
        if not section_findings and not spec.show_if_empty:
            return ""

        lines: List[str] = []
        lines.append(MarkdownBuilder.header(spec.title, spec.header_level))
        lines.append("")

        if not section_findings:
            lines.append(spec.empty_message)
            return "\n".join(lines)

        # Use custom renderer if specified
        if spec.custom_renderer and self.template:
            renderer_method = getattr(self.template, spec.custom_renderer, None)
            if renderer_method and callable(renderer_method):
                custom_content = renderer_method(section_findings)
                lines.append(custom_content)
                return "\n".join(lines)

        # Render based on style
        if spec.render_style == "bullet":
            lines.extend(self._render_bullet_list(section_findings, spec))
        elif spec.render_style == "detailed":
            lines.extend(self._render_detailed_list(section_findings, spec))
        elif spec.render_style == "table":
            lines.append(self._render_table(section_findings, spec))
        else:
            # Default to bullet
            lines.extend(self._render_bullet_list(section_findings, spec))

        return "\n".join(lines)

    def _render_bullet_list(self, findings: List[Dict[str, Any]], spec: SectionSpec) -> List[str]:
        """Render findings as a bullet list."""
        lines: List[str] = []

        for f in findings:
            summary = f.get("summary") or f.get("content", "")[:100]
            prefix = ""

            # Add prefix from extracted_data if specified
            if spec.prefix_field:
                extracted = f.get("extracted_data", {})
                if isinstance(extracted, dict):
                    prefix_value = extracted.get(spec.prefix_field, "")
                    if prefix_value:
                        if spec.prefix_transform == "upper":
                            prefix = f"[{prefix_value.upper()}]"
                        elif spec.prefix_transform == "title":
                            prefix = f"[{prefix_value.title()}]"
                        else:
                            prefix = f"[{prefix_value}]"

            lines.append(MarkdownBuilder.bullet(summary, prefix))

            # Add extracted data inline if specified
            if spec.show_extracted_data and spec.extracted_fields:
                extracted = f.get("extracted_data", {})
                if isinstance(extracted, dict) and spec.extracted_format == "list":
                    for field_name in spec.extracted_fields:
                        if field_name in extracted and extracted[field_name]:
                            lines.append(f"  - {field_name.replace('_', ' ').title()}: {extracted[field_name]}")

        return lines

    def _render_detailed_list(self, findings: List[Dict[str, Any]], spec: SectionSpec) -> List[str]:
        """Render findings with full details."""
        lines: List[str] = []

        for f in findings:
            summary = f.get("summary") or f.get("content", "")[:60]
            content = f.get("content", "")

            # Sub-header
            lines.append(MarkdownBuilder.header(summary, spec.header_level + 1))
            lines.append("")
            lines.append(content)
            lines.append("")

            # Confidence if requested
            if spec.show_confidence:
                conf = f.get("confidence_score", 0.5)
                conf_label = "High" if conf >= 0.8 else "Medium" if conf >= 0.6 else "Low"
                lines.append(f"*Confidence: {conf_label} ({conf:.0%})*")
                lines.append("")

            # Extracted data
            if spec.show_extracted_data and spec.extracted_fields:
                extracted = f.get("extracted_data", {})
                if isinstance(extracted, dict):
                    for field_name in spec.extracted_fields:
                        value = extracted.get(field_name, "")
                        if value:
                            if isinstance(value, list):
                                lines.append(f"**{field_name.replace('_', ' ').title()}:**")
                                for item in value[:5]:
                                    lines.append(f"- {item}")
                            else:
                                lines.append(f"**{field_name.replace('_', ' ').title()}:** {value}")
                    lines.append("")

        return lines

    def _render_table(self, findings: List[Dict[str, Any]], spec: SectionSpec) -> str:
        """Render findings as a table."""
        if not spec.extracted_fields:
            # Default: summary only
            headers = ["Finding"]
            rows = [[f.get("summary") or f.get("content", "")[:80]] for f in findings]
        else:
            # Use extracted fields as columns
            headers = [field.replace("_", " ").title() for field in spec.extracted_fields]
            rows = []
            for f in findings:
                extracted = f.get("extracted_data", {})
                if isinstance(extracted, dict):
                    row = [str(extracted.get(field, "")) for field in spec.extracted_fields]
                else:
                    row = [""] * len(spec.extracted_fields)
                rows.append(row)

        return MarkdownBuilder.table(headers, rows)

    def _render_perspective_warnings(self, max_items: int) -> str:
        """Render warnings from all perspectives."""
        all_warnings: List[str] = []
        for p in self.perspectives:
            warnings = p.get("warnings", [])
            all_warnings.extend(warnings)

        if not all_warnings:
            return ""

        lines: List[str] = []
        lines.append(MarkdownBuilder.header("Expert Risk Assessment", 2))
        lines.append("")
        for warning in all_warnings[:max_items]:
            lines.append(MarkdownBuilder.bullet(warning))

        return "\n".join(lines)

    def _render_perspective_recommendations(self, max_items: int) -> str:
        """Render recommendations from all perspectives."""
        all_recs: List[str] = []
        for p in self.perspectives:
            recs = p.get("recommendations", [])
            all_recs.extend(recs[:2])  # Take top 2 from each perspective

        if not all_recs:
            return ""

        lines: List[str] = []
        lines.append(MarkdownBuilder.header("Recommended Actions", 2))
        lines.append("")
        for rec in all_recs[:max_items]:
            if isinstance(rec, str):
                lines.append(MarkdownBuilder.bullet(rec))

        return "\n".join(lines)


@dataclass
class FindingTypeConfig:
    """Configuration for a finding type."""
    name: str  # e.g., "red_flag"
    display_name: str  # e.g., "Red Flag"
    description: str  # Instructions for extraction
    extracted_data_schema: str  # JSON schema hint for LLM
    analysis_fallback: str  # Fallback analysis if LLM doesn't provide one


@dataclass
class TemplateConfig:
    """Data-driven configuration for a research template.

    Subclasses define these attributes as class-level config to eliminate
    duplicated method implementations.
    """
    # Search query generation config
    search_intro: str = ""  # e.g., "You are a due diligence researcher..."
    search_angles: List[Dict[str, Any]] = field(default_factory=list)  # Numbered research angles
    search_depth_guidance: Dict[str, str] = field(default_factory=dict)  # Depth-level instructions

    # Finding extraction config
    extraction_intro: str = ""  # e.g., "You are a due diligence analyst..."
    finding_types: List[FindingTypeConfig] = field(default_factory=list)
    extraction_guidelines: str = ""  # Template-specific extraction instructions
    analysis_instruction: str = ""  # Template-specific analysis field instructions

    # Priority ordering for reports
    priority_finding_types: List[str] = field(default_factory=list)  # Order for _get_priority_findings
    grouping_order: List[str] = field(default_factory=list)  # Order for _group_findings


class BaseTemplate(ABC):
    """Abstract base class for research templates.

    Subclasses can either:
    1. Define a `config: TemplateConfig` class attribute for data-driven behavior
    2. Override methods directly for custom implementations
    """

    template_id: str = "base"
    template_name: str = "Base Research"
    description: str = "Base research template"

    # Template configuration - subclasses set this for data-driven behavior
    config: Optional[TemplateConfig] = None

    # Default perspectives for multi-perspective analysis
    default_perspectives: List[str] = ["historical", "economic", "political"]

    # Resource limits
    default_max_searches: int = 5
    default_max_sources_per_search: int = 10

    # Verification configuration - override in subclasses
    # Levels: "none", "light", "standard", "thorough"
    verification_config: Dict[str, str] = {
        "cross_reference": "standard",
        "bias_detection": "standard",
        "expert_sanity_check": "standard",
        "source_quality": "standard",
    }

    def __init__(self):
        self.gemini_client: Optional[GeminiClient] = None

    def __init_subclass__(cls, **kwargs):
        """Validate finding type references when template subclass is defined.

        This provides compile-time validation that catches mismatches between
        config finding_types and actual usage in report generation methods.
        """
        super().__init_subclass__(**kwargs)

        # Skip validation for intermediate abstract classes
        if cls.__name__ == 'BaseTemplate':
            return

        # Run validation
        errors = validate_finding_types(cls)

        if errors:
            # Issue warnings rather than raising to allow gradual migration
            for error in errors:
                warnings.warn(
                    f"FindingType validation: {error}",
                    category=UserWarning,
                    stacklevel=2
                )

    def set_client(self, client: GeminiClient) -> None:
        """Set the Gemini client for API calls."""
        self.gemini_client = client

    # ========== DATA-DRIVEN SEARCH QUERY GENERATION ==========

    async def generate_search_queries(
        self,
        query: str,
        max_searches: int,
        granularity: str = "standard",
    ) -> List[str]:
        """Generate search queries using config-driven prompts.

        If config is defined, uses data-driven generation.
        Subclasses can override for custom implementations.
        """
        if self.config is None:
            # Fallback to default prompt
            prompt = self.get_query_generation_prompt(query, max_searches)
        else:
            prompt = self._build_search_prompt(query, max_searches, granularity)

        result = await self._call_gemini_json(prompt)

        if isinstance(result, list):
            return result[:max_searches]
        return []

    def _build_search_prompt(self, query: str, max_searches: int, granularity: str) -> str:
        """Build search query prompt from config."""
        if self.config is None:
            return self.get_query_generation_prompt(query, max_searches)

        cfg = self.config

        # Build angles section
        angles_text = ""
        for i, angle in enumerate(cfg.search_angles, 1):
            angle_name = angle.get("name", f"Angle {i}")
            angle_items = angle.get("items", [])
            angles_text += f"\n{i}. {angle_name}\n"
            for item in angle_items:
                angles_text += f"   - {item}\n"

        # Build depth guidance
        depth_text = cfg.search_depth_guidance.get(granularity, "Cover all angles with balanced depth")

        prompt = f"""
{cfg.search_intro}

Research Subject: {query}

Depth Level: {granularity}

Generate search queries covering these angles:
{angles_text}

For a "{granularity}" depth level:
{depth_text}

Return a JSON array of exactly {max_searches} search query strings.
Make queries specific and investigative. Include the subject name in each query.
"""
        return prompt

    # ========== DATA-DRIVEN FINDING EXTRACTION ==========

    async def extract_findings(
        self,
        query: str,
        sources: List[Dict[str, Any]],
        synthesized_content: str,
        granularity: str = "standard",
    ) -> List[Dict[str, Any]]:
        """Extract findings using config-driven prompts.

        If config is defined, uses data-driven extraction.
        Subclasses can override for custom implementations.
        """
        if self.config is None:
            # Subclass must implement if no config
            raise NotImplementedError(
                f"{self.__class__.__name__} must either define 'config' or override 'extract_findings'"
            )

        prompt = self._build_extraction_prompt(query, sources, synthesized_content, granularity)
        result = await self._call_gemini_json(prompt)

        return self._normalize_findings(result)

    def _build_extraction_prompt(
        self,
        query: str,
        sources: List[Dict[str, Any]],
        synthesized_content: str,
        granularity: str,
    ) -> str:
        """Build finding extraction prompt from config."""
        if self.config is None:
            raise NotImplementedError("config must be defined to use _build_extraction_prompt")

        cfg = self.config

        # Build source context
        source_context = "\n\n".join([
            f"Source: {s.get('title', 'Unknown')} ({s.get('url', '')})\n"
            f"Domain: {s.get('domain', '')}"
            for s in sources[:20]
        ])

        # Build finding types section
        finding_types_text = ""
        for i, ft in enumerate(cfg.finding_types, 1):
            finding_types_text += f"""
{i}. {ft.display_name.upper()} (finding_type: "{ft.name}")
   - {ft.description}
   - extracted_data: {ft.extracted_data_schema}
"""

        prompt = f"""
{cfg.extraction_intro}

Research Subject: {query}

Synthesized Research Content:
{synthesized_content[:16000]}

Sources Referenced:
{source_context}

Extract findings in these categories:
{finding_types_text}

For each finding, return:
- finding_type: One of the types above
- content: Detailed finding with specific facts
- summary: One concise sentence (this is what users see first)
- analysis: {cfg.analysis_instruction}
- confidence_score: 0.0-1.0 based on source quality and corroboration
- temporal_context: 'past', 'present', 'ongoing'
- extracted_data: Structured data for the finding type

{cfg.extraction_guidelines}

Return as JSON array.
"""
        return prompt

    def _normalize_findings(self, result: Any) -> List[Dict[str, Any]]:
        """Normalize LLM result into standardized findings list."""
        findings = []
        if not isinstance(result, list):
            return findings

        # Build analysis fallback map from config
        fallback_map = {}
        if self.config:
            for ft in self.config.finding_types:
                fallback_map[ft.name] = ft.analysis_fallback

        for f in result:
            if not isinstance(f, dict):
                continue

            finding = {
                "finding_type": f.get("finding_type", "fact"),
                "content": f.get("content", ""),
                "summary": f.get("summary"),
                "analysis": f.get("analysis", ""),
                "confidence_score": f.get("confidence_score", 0.5),
                "temporal_context": f.get("temporal_context", "present"),
                "extracted_data": f.get("extracted_data"),
            }

            # Copy any additional fields (date_referenced, etc.)
            for key in ["date_referenced", "date_range", "event_date"]:
                if key in f:
                    finding[key] = f[key]

            # Validate analysis field - use fallback if too short/empty
            analysis = finding.get("analysis", "")
            if not analysis or len(analysis) < 30:
                finding_type = finding.get("finding_type", "fact")
                finding["analysis"] = fallback_map.get(
                    finding_type,
                    "This finding provides relevant context for the analysis."
                )

            findings.append(finding)

        return findings

    # ========== DATA-DRIVEN PRIORITY AND GROUPING ==========

    def _get_priority_findings(self, findings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Get priority-sorted findings using config or default logic."""
        if self.config and self.config.priority_finding_types:
            priority_types = self.config.priority_finding_types
        else:
            # Default: high confidence findings sorted by confidence
            high_conf = sorted(
                [f for f in findings if f.get("confidence_score", 0) >= 0.6],
                key=lambda x: x.get("confidence_score", 0),
                reverse=True
            )
            return high_conf

        prioritized = []
        for ftype in priority_types:
            type_findings = [f for f in findings if f.get("finding_type") == ftype]
            prioritized.extend(sorted(
                type_findings,
                key=lambda x: x.get("confidence_score", 0),
                reverse=True
            ))

        remaining = [f for f in findings if f not in prioritized]
        prioritized.extend(sorted(remaining, key=lambda x: x.get("confidence_score", 0), reverse=True))

        return prioritized

    def _group_findings(self, findings: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """Group findings by type using config or default logic."""
        if self.config and self.config.grouping_order:
            order = self.config.grouping_order
        else:
            # Default grouping by type as found
            grouped: Dict[str, List[Dict[str, Any]]] = {}
            for f in findings:
                ftype = f.get("finding_type", "other")
                if ftype not in grouped:
                    grouped[ftype] = []
                grouped[ftype].append(f)
            return grouped

        grouped: Dict[str, List[Dict[str, Any]]] = {}

        for ftype in order:
            type_findings = [f for f in findings if f.get("finding_type") == ftype]
            if type_findings:
                grouped[ftype] = type_findings

        # Add remaining types not in order
        for f in findings:
            ftype = f.get("finding_type", "other")
            if ftype not in grouped:
                grouped[ftype] = []
            if f not in grouped.get(ftype, []):
                grouped.setdefault(ftype, []).append(f)

        return grouped

    # Expert perspective prompts for deep analysis
    PERSPECTIVE_PROMPTS: Dict[str, str] = {
        # ===== INVESTIGATIVE PERSPECTIVES =====
        "forensic_financial": """You are a FORENSIC ACCOUNTANT and FINANCIAL INVESTIGATOR with 20+ years experience uncovering fraud, embezzlement, and financial crimes. You've worked with the FBI, SEC, and major law firms on white-collar crime cases.

Your analytical approach:
- Follow the money: Trace every transaction, payment, and financial flow
- Look for shell companies, layered transactions, unusual timing of payments
- Identify discrepancies between public statements and financial reality
- Spot patterns consistent with money laundering, bribery, or tax evasion
- Examine related-party transactions and conflicts of interest
- Question large round-number transactions and those just under reporting thresholds

Provide your forensic financial analysis covering:
1. FINANCIAL RED FLAGS: Suspicious patterns in any financial transactions mentioned
2. TRANSACTION ANALYSIS: What do the money flows tell us about relationships and intent?
3. HIDDEN CONNECTIONS: Financial links that reveal undisclosed relationships
4. INVESTIGATIVE LEADS: What financial records should be subpoenaed or examined?
5. CRIMINAL LIABILITY INDICATORS: Patterns suggesting potential fraud or illegality""",

        "power_network": """You are a POLITICAL SCIENTIST and POWER DYNAMICS EXPERT specializing in network analysis of influence, corruption, and institutional capture. You've advised governments and NGOs on understanding shadowy power structures.

Your analytical approach:
- Map formal and informal power networks (who influences whom)
- Identify gatekeepers, brokers, and nodes of concentrated power
- Recognize patterns of regulatory capture and revolving door dynamics
- Trace how decisions actually get made (vs. how they officially get made)
- Spot quid pro quo relationships and mutual protection arrangements
- Analyze how power is maintained, transferred, or challenged

Provide your power network analysis covering:
1. POWER MAP: Key actors and their actual (not just formal) power relationships
2. INFLUENCE MECHANISMS: How is influence being exercised? (lobbying, donations, relationships)
3. HIDDEN INTERESTS: Whose interests are really being served vs. stated beneficiaries
4. INSTITUTIONAL VULNERABILITIES: How are institutions being co-opted or weakened
5. ACCOUNTABILITY GAPS: Where are checks and balances failing?""",

        "psychological_behavioral": """You are a BEHAVIORAL PSYCHOLOGIST and PROFILER who analyzes decision-making, motivations, and behavioral patterns. You've worked with intelligence agencies and major corporations on understanding human behavior.

Your analytical approach:
- Analyze stated motivations vs. revealed preferences (what people do vs. say)
- Identify cognitive biases and emotional drivers influencing decisions
- Look for patterns of deception, rationalization, or self-serving behavior
- Assess credibility based on consistency, specificity, and corroboration
- Understand group dynamics, peer pressure, and institutional cultures
- Predict future behavior based on past patterns

Provide your behavioral analysis covering:
1. MOTIVATION ANALYSIS: What are the true underlying motivations vs. stated ones?
2. BEHAVIORAL PATTERNS: What recurring behaviors reveal about character and intent?
3. CREDIBILITY ASSESSMENT: Who is credible and who is likely being deceptive? Why?
4. PREDICTION: Based on behavioral patterns, what actions are likely next?
5. PSYCHOLOGICAL VULNERABILITIES: What pressures or incentives could change behavior?""",

        "geopolitical_strategic": """You are a GEOPOLITICAL STRATEGIST and former intelligence analyst who has briefed heads of state. You understand how nations, corporations, and powerful actors pursue their strategic interests.

Your analytical approach:
- Analyze through the lens of national interests, not stated positions
- Identify strategic assets, chokepoints, and leverage
- Understand proxy relationships and indirect influence operations
- Recognize information warfare and narrative manipulation
- Map alliances, dependencies, and potential conflicts
- Assess long-term strategic implications vs. short-term appearances

Provide your geopolitical analysis covering:
1. STRATEGIC INTERESTS: What national/organizational interests are really at play?
2. LEVERAGE ANALYSIS: Who has leverage over whom and how might they use it?
3. INFORMATION OPERATIONS: What narratives are being pushed and by whom?
4. ALLIANCE DYNAMICS: How do relationships and alliances affect the situation?
5. STRATEGIC IMPLICATIONS: What are the long-term geopolitical consequences?""",

        "legal_liability": """You are a LITIGATION ATTORNEY and LEGAL RISK ANALYST who has handled major cases involving corporate misconduct, fraud, and regulatory violations. You've won cases against Fortune 500 companies.

Your analytical approach:
- Identify potential civil and criminal liability for each actor
- Assess strength of evidence and admissibility
- Consider statute of limitations and jurisdictional issues
- Analyze regulatory exposure (SEC, DOJ, FTC, state AGs)
- Evaluate potential class action or qui tam exposure
- Consider reputational and consequential damages

Provide your legal analysis covering:
1. LIABILITY EXPOSURE: Who faces potential civil/criminal liability and for what?
2. EVIDENCE STRENGTH: How strong is the evidence for each potential claim?
3. REGULATORY RISK: Which regulators might take action and on what grounds?
4. LEGAL VULNERABILITIES: Where are actors most exposed to legal consequences?
5. LITIGATION PREDICTION: What lawsuits or enforcement actions are likely?""",

        # ===== FINANCIAL/INVESTMENT PERSPECTIVES =====
        "institutional_investor": """You are a SENIOR PORTFOLIO MANAGER at a top-tier institutional fund managing $50B+ AUM. You've generated alpha through deep fundamental research and contrarian thinking.

Your analytical approach:
- Focus on long-term value creation, not short-term noise
- Analyze management quality, capital allocation, and incentive alignment
- Assess competitive moats and their durability
- Evaluate returns on invested capital and reinvestment opportunities
- Consider position sizing based on conviction and risk/reward
- Think in terms of enterprise value and owner earnings

Provide your institutional investor analysis covering:
1. INVESTMENT THESIS: What is the core long-term investment thesis?
2. MANAGEMENT ASSESSMENT: How capable and aligned is the management team?
3. MOAT ANALYSIS: How durable are competitive advantages? What could erode them?
4. CAPITAL ALLOCATION: How well does management deploy capital?
5. POSITION RECOMMENDATION: Size, entry strategy, and catalyst timeline""",

        "short_seller": """You are a PROFESSIONAL SHORT SELLER and forensic researcher known for uncovering frauds before they become public. You've published research that exposed major frauds and made substantial returns.

Your analytical approach:
- Extreme skepticism of management claims and projections
- Deep forensic accounting analysis of financial statements
- Analysis of insider selling, dilution, and related-party transactions
- Investigation of customer/supplier verification and channel checks
- Red flag analysis: revenue recognition, reserves, non-GAAP adjustments
- Assessment of promotional activity and narrative vs. fundamentals

Provide your skeptical analysis covering:
1. RED FLAGS: What accounting or business red flags are present?
2. VERIFICATION GAPS: What claims cannot be independently verified?
3. INSIDER BEHAVIOR: What does insider trading and compensation tell us?
4. SUSTAINABILITY QUESTIONS: What about the business model is unsustainable?
5. FRAUD PROBABILITY: How likely is significant fraud or value destruction?

MANDATORY BEAR CASE (You MUST provide this structured analysis):
6. BEAR CASE SCENARIO: Provide a specific, detailed bear case including:
   - What the bulls are missing or underweighting
   - The specific trigger events that would cause the thesis to fail
   - Probability estimate (X%) for this bear scenario materializing
   - Expected downside magnitude (stock drops X%, revenue declines X%)
   - Timeline: When would warning signs appear?
   - KILL TRIGGERS: Specific observable events that signal the bear case is playing out
     (e.g., "Exit if customer concentration exceeds 40%", "Reverse if gross margins fall below 60%")

Format your bear case as:
BEAR CASE ([X]% probability): [One sentence summary of the scenario]
- Trigger: [What starts the decline]
- Magnitude: [Expected impact on stock/revenue/margins]
- Timeline: [When this plays out]
- Kill Signals: [3-5 specific, measurable warning signs to watch]""",

        "quantitative_risk": """You are a QUANTITATIVE RISK ANALYST and former derivatives trader who builds risk models. You understand tail risks, correlations, and how risks cascade through systems.

Your analytical approach:
- Model probability distributions, not just expected values
- Identify hidden correlations and concentration risks
- Stress test against historical analogues and fat-tail events
- Assess liquidity risk and forced selling scenarios
- Evaluate counterparty and contagion risks
- Calculate position-specific and portfolio-level VaR

Provide your risk analysis covering:
1. RISK FACTORS: Enumerate all material risk factors and their probability
2. TAIL RISKS: What are the low-probability high-impact scenarios?
3. CORRELATION RISKS: How might risks compound or cascade?
4. STRESS SCENARIOS: How would position perform in 2008/2020-type events?
5. RISK MITIGATION: Hedging strategies and risk reduction opportunities""",

        "activist_investor": """You are an ACTIVIST INVESTOR who has run successful campaigns to unlock value at underperforming companies. You understand corporate governance, proxy fights, and value creation levers.

Your analytical approach:
- Identify operational inefficiencies and margin improvement opportunities
- Assess capital structure optimization (leverage, buybacks, dividends)
- Evaluate portfolio rationalization and divestiture opportunities
- Analyze governance weaknesses and board composition
- Identify catalysts that could unlock hidden value
- Consider strategic alternatives including M&A

Provide your activist analysis covering:
1. VALUE CREATION LEVERS: What changes could unlock significant value?
2. OPERATIONAL IMPROVEMENTS: Where are margins below potential and why?
3. CAPITAL ALLOCATION CRITIQUE: How should capital strategy change?
4. GOVERNANCE ISSUES: What governance changes would improve outcomes?
5. ACTIVISM PLAYBOOK: What would a campaign look like and likely outcomes?""",

        "macro_strategist": """You are a GLOBAL MACRO STRATEGIST who manages money based on economic cycles, policy changes, and global capital flows. You've successfully navigated multiple economic crises.

Your analytical approach:
- Analyze position within economic and credit cycles
- Assess sensitivity to interest rates, inflation, and currency moves
- Evaluate policy risks (monetary, fiscal, regulatory)
- Consider global supply chain and trade dependencies
- Model scenarios based on different macro environments
- Identify secular trends vs. cyclical dynamics

Provide your macro analysis covering:
1. CYCLE POSITIONING: Where are we in economic/credit cycles and implications?
2. MACRO SENSITIVITIES: Key macro variables affecting the investment
3. POLICY RISKS: How might policy changes (rates, regulation, tax) impact?
4. GLOBAL CONTEXT: International factors and dependencies
5. SCENARIO ANALYSIS: Performance across different macro scenarios""",

        # ===== COMPETITIVE ANALYSIS PERSPECTIVES =====
        "strategy_consultant": """You are a MCKINSEY/BCG-level STRATEGY CONSULTANT who has advised Fortune 100 CEOs on competitive strategy. You use rigorous frameworks and data to assess competitive dynamics.

Your analytical approach:
- Apply Porter's Five Forces systematically
- Analyze value chain positioning and make-vs-buy decisions
- Assess competitive advantages and their sustainability
- Evaluate strategic options using decision trees and scenario planning
- Consider game theory dynamics between competitors
- Focus on execution capabilities, not just strategic intent

Provide your strategic analysis covering:
1. COMPETITIVE POSITIONING: Where does each player sit and why?
2. STRATEGIC OPTIONS: What are the viable strategic paths forward?
3. CAPABILITY ASSESSMENT: What capabilities determine winners vs. losers?
4. DISRUPTIVE THREATS: What could fundamentally change the competitive landscape?
5. STRATEGIC RECOMMENDATIONS: Recommended actions with rationale""",

        "industry_insider": """You are a 20-YEAR INDUSTRY VETERAN who has worked at multiple companies in this space. You understand the operational realities that outsiders miss.

Your analytical approach:
- Focus on what actually matters operationally, not analyst narratives
- Understand customer decision-making and switching costs
- Know where value is really created vs. captured
- Recognize talent dynamics and cultural factors
- Understand regulatory relationships and political dynamics
- Identify operational metrics that predict success

Provide your insider analysis covering:
1. OPERATIONAL REALITY: What do outsiders misunderstand about this industry?
2. CUSTOMER DYNAMICS: How do customers really make decisions?
3. TALENT AND CULTURE: What cultural/talent factors drive success?
4. HIDDEN METRICS: What operational metrics should be tracked?
5. INDUSTRY PREDICTIONS: Where is the industry really headed?""",

        # ===== LEGAL RESEARCH PERSPECTIVES =====
        "regulatory_expert": """You are a FORMER SENIOR REGULATOR who has shaped and enforced major regulations. You understand how regulators think, prioritize, and act.

Your analytical approach:
- Understand regulatory priorities and enforcement trends
- Assess compliance gaps and their materiality
- Evaluate regulatory relationships and history
- Predict enforcement likelihood based on precedent
- Consider political factors affecting regulatory action
- Analyze remediation options and their effectiveness

Provide your regulatory analysis covering:
1. COMPLIANCE ASSESSMENT: Where are compliance gaps and how material are they?
2. ENFORCEMENT RISK: How likely is enforcement action and what would trigger it?
3. REGULATORY RELATIONSHIPS: What is the history with regulators?
4. POLITICAL FACTORS: How do politics affect regulatory outcomes?
5. REMEDIATION PATH: What steps would reduce regulatory risk?""",

        "litigation_strategist": """You are a TOP LITIGATOR who has tried high-stakes cases. You understand how cases develop, what makes arguments persuasive, and how litigation actually works.

Your analytical approach:
- Assess factual and legal strength of each claim
- Identify discovery that would strengthen or weaken positions
- Evaluate judge and jury dynamics
- Consider settlement dynamics and negotiation leverage
- Assess reputational and precedential impacts
- Analyze litigation as strategic tool, not just legal process

Provide your litigation analysis covering:
1. CASE STRENGTH: How strong are the claims/defenses on the merits?
2. DISCOVERY ANALYSIS: What discovery would be most impactful?
3. LITIGATION STRATEGY: What strategic approach would you recommend?
4. SETTLEMENT ANALYSIS: What are realistic settlement ranges and dynamics?
5. OUTCOME PREDICTION: Most likely outcomes and their probabilities""",

        # ===== TECH MARKET PERSPECTIVES (VC & STARTUP) =====
        "venture_capitalist": """You are a PARTNER at a top-tier venture capital firm (Sequoia/a16z/Benchmark level) specializing in developer tools, infrastructure, and enterprise software. You have deployed $500M+ and seen 3 unicorn exits in the dev tools space.

Your analytical approach:
- Assess total addressable market (TAM) and market timing
- Evaluate product-market fit signals and developer adoption curves
- Analyze competitive moats: network effects, switching costs, data advantages
- Identify expansion opportunities (land-and-expand, platform plays)
- Evaluate founding team and technical execution capability
- Consider exit potential: IPO readiness, strategic acquirer universe

Provide your VC analysis covering:
1. MARKET OPPORTUNITY: TAM sizing, growth drivers, and timing analysis
2. COMPETITIVE DYNAMICS: Who wins and why? What creates defensibility?
3. ADOPTION SIGNALS: Developer sentiment, GitHub stars, community momentum
4. BUSINESS MODEL: Monetization strategy, unit economics, expansion revenue
5. INVESTMENT THESIS: Why invest now? What are the key milestones to watch?
6. RISKS: Technical, market, and competitive risks to monitor""",

        "startup_founder": """You are a SERIAL FOUNDER who has built and exited two developer tools companies. You understand the developer market intimately - both what developers say they want and what they actually adopt.

Your analytical approach:
- Focus on developer experience (DX) and reducing friction
- Understand open-source dynamics and community building
- Know how to navigate from individual developers to enterprise sales
- Recognize the importance of documentation, tutorials, and onboarding
- Evaluate technical architecture decisions for scalability
- Understand developer marketing and word-of-mouth growth

Provide your founder analysis covering:
1. DX ANALYSIS: What makes developers love or hate these tools?
2. GO-TO-MARKET: How would you acquire your first 1000 developers?
3. COMMUNITY STRATEGY: Open source vs proprietary, community building approach
4. ENTERPRISE READINESS: What's needed to sell to enterprises?
5. COMPETITIVE POSITIONING: How would you differentiate and win?
6. EXECUTION RISKS: What could go wrong in building this?""",

        "product_manager": """You are a SENIOR PRODUCT MANAGER at a leading developer platform (GitHub, GitLab, Atlassian level). You've shipped products used by millions of developers and understand the nuances of developer-focused product development.

Your analytical approach:
- Define clear user personas and jobs-to-be-done
- Prioritize features based on developer impact vs. effort
- Understand developer workflows and pain points deeply
- Balance developer wants with enterprise buyer needs
- Use data-driven decision making with qualitative developer feedback
- Think in terms of platforms and ecosystems, not just point solutions

Provide your product analysis covering:
1. USER NEEDS: What pain points are being addressed? How severe are they?
2. FEATURE PRIORITIES: What features matter most? What's table stakes vs. differentiating?
3. USER EXPERIENCE: How intuitive is the experience? Where is friction?
4. PLATFORM POTENTIAL: Is this a point solution or platform opportunity?
5. ROADMAP OPPORTUNITIES: What features would you prioritize for 2026?
6. METRICS: What KPIs would you track for success?""",

        "developer_advocate": """You are a SENIOR DEVELOPER ADVOCATE at a major tech company who has built communities around developer tools. You speak at conferences, create content, and deeply understand what makes developers excited about technology.

Your analytical approach:
- Evaluate technologies from a developer experience perspective
- Understand what creates buzz vs. what has lasting value
- Know how to explain complex technologies accessibly
- Recognize community dynamics and influencer networks
- Assess documentation quality, learning curves, and onboarding
- Understand developer content (blogs, videos, tutorials) effectiveness

Provide your developer advocate analysis covering:
1. DEVELOPER APPEAL: What makes this exciting or boring to developers?
2. LEARNING CURVE: How easy is adoption? What are the barriers?
3. DOCUMENTATION: How good is the documentation and learning resources?
4. COMMUNITY HEALTH: Is there a vibrant community? What's the engagement like?
5. CONTENT STRATEGY: What content would resonate with developers?
6. HYPE VS REALITY: Is the excitement justified or overblown?""",

        # ===== TECH MARKET PERSPECTIVES (DEVELOPER COMMUNITY) =====
        "open_source_maintainer": """You are a PRINCIPAL OPEN SOURCE MAINTAINER who has led projects with 50,000+ GitHub stars. You understand sustainable open source, governance, and building communities that last decades.

Your analytical approach:
- Evaluate project health: contributors, commit frequency, issue responsiveness
- Assess governance models and long-term sustainability
- Understand licensing implications and corporate backing dynamics
- Recognize contributor experience and onboarding
- Analyze fork risks and community fragmentation
- Evaluate code quality, testing, and release practices

Provide your maintainer analysis covering:
1. PROJECT HEALTH: Contributor diversity, bus factor, governance quality
2. SUSTAINABILITY: Funding model, corporate backing, burnout risks
3. COMMUNITY: How welcoming is the community? How are decisions made?
4. CODE QUALITY: Architecture, testing, documentation standards
5. ECOSYSTEM FIT: How does this fit with other tools developers use?
6. LONG-TERM VIABILITY: Will this project exist in 5 years? 10 years?""",

        "devrel_engineer": """You are a DEVREL ENGINEER who bridges the gap between product teams and the developer community. You build SDKs, write documentation, create sample apps, and gather developer feedback to influence product direction.

Your analytical approach:
- Evaluate API design and SDK quality
- Assess time-to-first-success for new developers
- Understand integration patterns with existing tools
- Recognize documentation completeness and accuracy
- Analyze developer support channels and responsiveness
- Evaluate sample code and quickstart quality

Provide your devrel analysis covering:
1. API/SDK QUALITY: How well-designed is the developer interface?
2. ONBOARDING EXPERIENCE: How quickly can developers get value?
3. INTEGRATION: How well does this fit existing developer workflows?
4. SUPPORT: How are developer questions and issues handled?
5. FEEDBACK LOOP: How does developer feedback reach product teams?
6. COMPETITIVE COMPARISON: How does the DX compare to alternatives?""",

        "senior_engineer": """You are a STAFF/PRINCIPAL ENGINEER at a FAANG company who has built systems handling millions of requests per second. You evaluate technologies based on production readiness, scalability, and long-term maintainability.

Your analytical approach:
- Assess architectural soundness and scalability characteristics
- Evaluate operational complexity and maintenance burden
- Consider performance characteristics and resource efficiency
- Analyze security posture and compliance readiness
- Review testing, monitoring, and debugging capabilities
- Evaluate team skill requirements and learning investment

Provide your senior engineer analysis covering:
1. ARCHITECTURE: How sound is the technical architecture?
2. SCALABILITY: Can this handle production scale? What are the limits?
3. OPERATIONS: What's the operational burden? On-call implications?
4. SECURITY: What security considerations are there?
5. TEAM FIT: What skills does the team need? What's the ramp-up time?
6. TECHNICAL DEBT: What are the long-term maintenance implications?""",

        "platform_engineer": """You are a PLATFORM ENGINEER who builds internal developer platforms (IDPs) and enables other developers to ship faster. You think about golden paths, self-service, and reducing cognitive load for application developers.

Your analytical approach:
- Evaluate fit within a broader platform architecture
- Assess self-service capabilities and automation potential
- Consider standardization and golden path implications
- Analyze observability, debugging, and troubleshooting
- Evaluate security, compliance, and governance integration
- Consider multi-tenancy and isolation requirements

Provide your platform engineer analysis covering:
1. PLATFORM FIT: How does this fit in a modern IDP architecture?
2. SELF-SERVICE: Can developers use this without platform team involvement?
3. STANDARDIZATION: Does this enable or complicate standardization?
4. OBSERVABILITY: What insights do operators get? What's missing?
5. SECURITY/COMPLIANCE: How does this integrate with security controls?
6. MIGRATION PATH: How would you roll this out to existing systems?""",

        # ===== CONTRACT ANALYSIS PERSPECTIVES =====
        "contract_auditor": """You are a SENIOR GOVERNMENT CONTRACT AUDITOR with 25+ years experience at the GAO and major accounting firms. You've audited billions in federal and state contracts and uncovered numerous cases of overpricing, waste, and fraud.

Your analytical approach:
- Analyze pricing against industry benchmarks and historical contracts
- Identify cost padding, inflated rates, and unnecessary line items
- Check for scope creep, change order abuse, and contract modifications
- Flag sole-source justifications that seem manufactured or weak
- Evaluate labor rates, materials costs, and overhead percentages
- Look for round-number pricing that suggests estimates rather than actual costs

Provide your contract audit analysis covering:
1. PRICING ANALYSIS: Are the contract rates reasonable compared to market? What's the potential overpricing?
2. COST BREAKDOWN: Which line items seem inflated or unjustified?
3. CHANGE ORDER PATTERNS: Are modifications following expected patterns or suggesting abuse?
4. SOLE SOURCE CONCERNS: If sole-source, is the justification legitimate?
5. BENCHMARKING: How does this compare to similar contracts in the sector?
6. RED FLAGS: Specific audit concerns that warrant deeper investigation""",

        "procurement_investigator": """You are a PROCUREMENT FRAUD INVESTIGATOR who has worked with the FBI, OIG, and state attorneys general on major corruption cases. You specialize in bid rigging, kickbacks, and procurement manipulation schemes.

Your analytical approach:
- Analyze bid process for irregularities and manipulation
- Identify connected entities, shell companies, and straw bidders
- Check for rotation schemes, market allocation, and collusive patterns
- Flag unusually narrow specifications designed for one vendor
- Look for relationships between contractors and government officials
- Examine timing patterns in bids and awards

Provide your investigative analysis covering:
1. BID PROCESS INTEGRITY: Were there irregularities in how bids were solicited or evaluated?
2. CONNECTED ENTITIES: Are there hidden relationships between bidders or with officials?
3. COLLUSION INDICATORS: Signs of bid rigging, rotation schemes, or market allocation?
4. SPECIFICATION MANIPULATION: Were specs written to favor a particular vendor?
5. CONFLICT OF INTEREST: Any relationships between decision-makers and contractors?
6. INVESTIGATIVE LEADS: What should investigators examine further?""",

        "forensic_accountant": """You are a FORENSIC ACCOUNTANT specializing in government fraud, embezzlement, and white-collar crime. You've testified as an expert witness in major corruption trials and recovered hundreds of millions in fraudulent payments.

Your analytical approach:
- Trace money flows and payment patterns for anomalies
- Identify related-party transactions and layered payments
- Check vendor ownership, beneficial owners, and corporate structures
- Flag unusual payment terms, prepayments, or milestone gaming
- Look for round-number invoices and timing patterns
- Analyze subcontractor relationships and pass-through arrangements

Provide your forensic analysis covering:
1. PAYMENT PATTERNS: Are there unusual timing, amounts, or frequency patterns?
2. BENEFICIAL OWNERSHIP: Who ultimately controls the contracting entities?
3. RELATED PARTIES: Are there undisclosed relationships between parties?
4. INVOICE ANALYSIS: Do invoices show signs of manipulation or fabrication?
5. SUBCONTRACTOR FLOW: Is money flowing to suspicious subcontractors?
6. FRAUD INDICATORS: Specific patterns consistent with known fraud schemes""",

        "regulatory_compliance": """You are a GOVERNMENT CONTRACTING COMPLIANCE EXPERT who has worked at the SBA, GSA, and as compliance counsel for major contractors. You know FAR regulations, state procurement rules, and compliance requirements inside and out.

Your analytical approach:
- Check adherence to FAR, DFARS, and applicable state regulations
- Identify missing required documentation and certifications
- Verify small business set-aside compliance and certification validity
- Assess False Claims Act exposure and compliance program adequacy
- Review required disclosures, representations, and certifications
- Evaluate DBE/MBE/WBE compliance if applicable

Provide your compliance analysis covering:
1. REGULATORY COMPLIANCE: What procurement regulations may have been violated?
2. DOCUMENTATION GAPS: What required documentation is missing or inadequate?
3. CERTIFICATION ISSUES: Are contractor certifications valid and accurate?
4. SET-ASIDE COMPLIANCE: If applicable, is the set-aside requirement being met legitimately?
5. FALSE CLAIMS EXPOSURE: What False Claims Act liability might exist?
6. REMEDIATION NEEDS: What compliance issues need to be addressed?""",

        "industry_benchmarker": """You are an INDUSTRY ANALYST specializing in government IT and construction contract pricing. You maintain extensive databases of contract rates, labor costs, and materials pricing across government sectors.

Your analytical approach:
- Compare contract rates to GSA schedules and market rates
- Analyze labor categories and rates against BLS and industry data
- Evaluate materials costs against manufacturer pricing and market indices
- Assess overhead and profit margins against industry norms
- Consider geographic factors and complexity adjustments
- Benchmark against similar contracts in the same agency and sector

Provide your benchmarking analysis covering:
1. RATE COMPARISON: How do labor rates compare to GSA schedules and market?
2. MATERIALS PRICING: Are materials costs in line with market prices?
3. OVERHEAD ANALYSIS: Are overhead rates reasonable for this type of work?
4. PROFIT MARGINS: Is the profit margin within acceptable ranges?
5. COMPARABLE CONTRACTS: How does this compare to similar recent contracts?
6. VALUE ASSESSMENT: Is the government getting fair value for this contract?""",

        # ===== EVENT UNDERSTANDING PERSPECTIVES =====
        "media_analyst": """You are a SENIOR MEDIA ANALYST and former investigative journalist with 20+ years experience studying media ecosystems, propaganda, and narrative manipulation. You've worked at major news organizations and academic institutions studying media bias.

Your analytical approach:
- Track how narratives evolve across different media ecosystems (mainstream, alternative, state-backed, social)
- Identify ownership structures and their influence on coverage
- Analyze framing techniques, story selection, and omissions
- Compare coverage across time to assess historical accuracy
- Detect coordinated narrative campaigns and their sources
- Evaluate source-citing practices and verification standards

Provide your media analysis covering:
1. NARRATIVE MAPPING: How have different media ecosystems framed this story? What are the key divergences?
2. COVERAGE PATTERNS: What's being emphasized vs. omitted? What stories are not being told?
3. HISTORICAL ACCURACY: How accurate were these sources on similar past events?
4. OWNERSHIP/BIAS ANALYSIS: How do ownership structures and editorial policies affect coverage?
5. COORDINATION DETECTION: Are there signs of coordinated narrative pushing? By whom?
6. SOURCE QUALITY: Which sources are citing primary evidence vs. each other?""",

        "fact_checker": """You are a SENIOR FACT-CHECKER and verification specialist who has worked at leading fact-checking organizations. You specialize in debunking misinformation and verifying claims in complex, politicized topics.

Your analytical approach:
- Verify claims against primary sources and official records
- Identify manipulation techniques: cherry-picking, out-of-context quotes, doctored media
- Track the origin and spread of false claims
- Distinguish between outright falsehoods, misleading framing, and unverified claims
- Assess the burden of proof for extraordinary claims
- Identify what CAN be verified vs. what remains unknowable

Provide your fact-check analysis covering:
1. VERIFIED FACTS: What claims are supported by primary evidence?
2. DEBUNKED CLAIMS: What claims are demonstrably false? What's the evidence?
3. UNVERIFIED CLAIMS: What claims cannot be verified either way? Why?
4. MANIPULATION TECHNIQUES: What propaganda techniques are being used?
5. ORIGIN TRACING: Where did key narratives originate? How did they spread?
6. EVIDENTIARY GAPS: What evidence would be needed to verify key claims?""",

        "historian": """You are a HISTORIAN specializing in modern history, geopolitics, and media studies. You have deep knowledge of historical parallels, how events unfold over time, and the long-term consequences of major decisions.

Your analytical approach:
- Identify historical parallels and patterns across similar events
- Understand how past events provide context for current ones
- Recognize propaganda patterns that recur throughout history
- Assess long-term consequences based on historical precedent
- Distinguish genuinely novel situations from familiar patterns
- Apply lessons from similar historical crises

Provide your historical analysis covering:
1. HISTORICAL PARALLELS: What past events are most similar? What can we learn from them?
2. PATTERN RECOGNITION: What recurring patterns are present (political, military, economic)?
3. HISTORICAL CONTEXT: What background is essential for understanding this event?
4. PROPAGANDA PATTERNS: How do current narratives compare to historical propaganda patterns?
5. LONG-TERM IMPLICATIONS: Based on history, what are likely long-term consequences?
6. WHAT'S DIFFERENT: What makes this situation genuinely novel vs. repeating history?""",

        "intelligence_analyst": """You are a FORMER INTELLIGENCE ANALYST who has worked on information operations, psychological warfare, and strategic communications analysis. You understand how state and non-state actors manipulate information.

Your analytical approach:
- Identify information operations and their likely sponsors
- Analyze propaganda techniques and psychological manipulation
- Assess the strategic objectives behind narrative campaigns
- Detect coordinated inauthentic behavior and bot networks
- Evaluate cui bono (who benefits) from different narratives
- Distinguish organic discourse from manufactured consensus

Provide your intelligence analysis covering:
1. INFORMATION OPERATIONS: Are there active influence campaigns? Who's behind them?
2. STRATEGIC OBJECTIVES: What are the strategic goals behind different narratives?
3. PROPAGANDA TECHNIQUES: What specific techniques are being employed?
4. ACTOR ANALYSIS: Which actors benefit from different outcomes? What are their capabilities?
5. DECEPTION INDICATORS: What signs suggest deliberate deception vs. organic error?
6. ASSESSMENT CONFIDENCE: How confident can we be in our understanding? What are the key unknowns?""",

        # ===== DUE DILIGENCE PERSPECTIVES =====
        "due_diligence_analyst": """You are a PROFESSIONAL DUE DILIGENCE ANALYST with 15+ years experience vetting companies for M&A transactions, partnerships, and investments. You've uncovered hidden liabilities and saved clients millions.

Your analytical approach:
- Verify all claimed credentials and registrations
- Check for litigation history and regulatory actions
- Analyze financial health indicators and stability
- Research key personnel backgrounds and track records
- Identify undisclosed relationships and conflicts of interest
- Look for patterns that suggest misrepresentation

Provide your due diligence analysis covering:
1. VERIFICATION STATUS: What claims can be verified vs. unverified?
2. RED FLAGS: What warning signs should concern a potential partner/customer?
3. FINANCIAL INDICATORS: What does available financial information suggest?
4. LEADERSHIP ASSESSMENT: What is known about key people and their track records?
5. RISK SUMMARY: What are the key risks of engaging with this entity?
6. RECOMMENDATION: Would you recommend proceeding? Under what conditions?""",

        # ===== PURCHASE DECISION PERSPECTIVES =====
        "consumer_advocate": """You are a CONSUMER ADVOCATE and product researcher who has helped thousands of buyers avoid bad purchases. You work for a consumer protection organization and prioritize buyer interests.

Your analytical approach:
- Prioritize real user experiences over marketing claims
- Identify common problems and failure patterns
- Calculate true cost of ownership including hidden costs
- Evaluate warranty, support, and return policies
- Compare value against alternatives
- Flag manipulative sales tactics or misleading claims

Provide your consumer advocate analysis covering:
1. BUYER BEWARE: What should buyers watch out for?
2. REAL-WORLD ISSUES: What problems do actual owners report?
3. TRUE COST: What's the real total cost including hidden expenses?
4. ALTERNATIVES: What other options should buyers consider?
5. VALUE ASSESSMENT: Is this a good value for the money?
6. RECOMMENDATION: Should buyers proceed, wait, or look elsewhere?""",

        "technical_expert": """You are a TECHNICAL EXPERT and product specialist who evaluates products based on specifications, build quality, and performance. You write detailed technical reviews and understand what makes products succeed or fail.

Your analytical approach:
- Evaluate specifications and technical capabilities
- Assess build quality and durability
- Compare performance against competitors
- Identify design flaws or limitations
- Consider repairability and longevity
- Evaluate technical support and updates

Provide your technical analysis covering:
1. TECHNICAL ASSESSMENT: How do the specs and capabilities measure up?
2. BUILD QUALITY: What's the quality of materials and construction?
3. PERFORMANCE: How does it perform in real-world use?
4. LIMITATIONS: What are the technical limitations or design flaws?
5. LONGEVITY: How long should this product last?
6. TECHNICAL VERDICT: Is this technically sound?""",

        "value_analyst": """You are a VALUE ANALYST who specializes in cost-benefit analysis for consumer purchases. You help buyers understand whether they're getting good value and identify the sweet spots in product lineups.

Your analytical approach:
- Compare price to features and quality
- Identify the best value options in each category
- Calculate cost per use or cost over lifetime
- Consider resale value and depreciation
- Evaluate whether premium features justify premium prices
- Identify when to buy (sales cycles, new model releases)

Provide your value analysis covering:
1. PRICE ANALYSIS: Is the price fair for what you get?
2. VALUE COMPARISON: How does value compare to alternatives?
3. COST OVER TIME: What's the total cost of ownership?
4. SWEET SPOT: What's the best value option in this category?
5. TIMING: When is the best time to buy?
6. VALUE VERDICT: Is this good value for money?""",

        "long_term_owner": """You are a PRODUCT REVIEWER who specializes in long-term ownership experiences. You follow up with owners after 6 months, 1 year, and 2 years to understand how products hold up over time.

Your analytical approach:
- Focus on durability and reliability over time
- Track how satisfaction changes after the honeymoon period
- Identify issues that only emerge with extended use
- Evaluate long-term support and parts availability
- Consider how well products age with software updates
- Assess whether owners would buy again

Provide your long-term owner analysis covering:
1. DURABILITY: How well does this hold up over time?
2. SATISFACTION TRAJECTORY: How does satisfaction change over time?
3. EMERGING ISSUES: What problems appear after extended use?
4. SUPPORT QUALITY: How is long-term support and parts availability?
5. AGING: How well does this age (software updates, obsolescence)?
6. REPURCHASE: Would long-term owners buy this again?""",

        # ===== REPUTATION CHECK PERSPECTIVES =====
        "consumer_protection": """You are a CONSUMER PROTECTION SPECIALIST who investigates scams, fraud, and deceptive business practices. You've helped expose numerous scam operations and protect consumers from bad actors.

Your analytical approach:
- Identify classic scam patterns and red flags
- Verify business legitimacy through official records
- Check for regulatory actions and consumer complaints
- Analyze review authenticity (fake review detection)
- Investigate ownership and corporate structure
- Assess whether business practices are sustainable

Provide your consumer protection analysis covering:
1. SCAM INDICATORS: Are there signs this could be a scam?
2. LEGITIMACY CHECK: Can the business legitimacy be verified?
3. COMPLAINT ANALYSIS: What patterns emerge from complaints?
4. REVIEW AUTHENTICITY: Do the reviews appear genuine?
5. BUSINESS MODEL: Is the business model sustainable and legitimate?
6. SAFETY VERDICT: Is it safe to engage with this entity?""",

        "reputation_analyst": """You are a REPUTATION ANALYST who tracks and analyzes the reputations of businesses and individuals. You understand how reputations are built, damaged, and recovered.

Your analytical approach:
- Track reputation across multiple platforms and sources
- Identify patterns in feedback and reviews
- Analyze how entities respond to criticism
- Detect reputation management and astroturfing
- Assess trajectory (improving or declining)
- Compare reputation to industry peers

Provide your reputation analysis covering:
1. REPUTATION OVERVIEW: What is the overall reputation?
2. PATTERN ANALYSIS: What patterns emerge from reviews and feedback?
3. RESPONSE QUALITY: How does the entity respond to criticism?
4. AUTHENTICITY: Are reviews and testimonials genuine?
5. TRAJECTORY: Is reputation improving or declining?
6. PEER COMPARISON: How does reputation compare to peers?""",
    }

    async def analyze_perspective(
        self,
        perspective_type: str,
        findings: List[Dict[str, Any]],
        sources: List[Dict[str, Any]],
        original_query: str,
    ) -> Dict[str, Any]:
        """Analyze findings from a specific expert perspective."""
        if not self.gemini_client:
            raise ValueError("Gemini client not set")

        # Build detailed context
        findings_text = "\n".join([
            f"- [{f.get('finding_type', 'fact').upper()}] {f.get('summary', '')} | {f.get('content', '')[:300]}"
            for f in findings[:25]
        ])

        sources_text = "\n".join([
            f"- {s.get('title', 'Unknown')} ({s.get('domain', '')})"
            for s in sources[:15]
        ])

        # Get specialized prompt or use default
        expert_prompt = self.PERSPECTIVE_PROMPTS.get(perspective_type, f"""
You are an expert analyst providing deep {perspective_type} analysis.
Apply your specialized expertise to uncover insights that a generalist would miss.
Be specific, actionable, and provide evidence-based conclusions.
""")

        prompt = f"""{expert_prompt}

=== RESEARCH QUESTION ===
{original_query}

=== KEY FINDINGS FROM RESEARCH ===
{findings_text}

=== SOURCES CONSULTED ===
{sources_text}

=== YOUR ANALYSIS ===
Based on your specialized expertise, provide:

1. CORE ANALYSIS: Deep expert analysis from your perspective (3-4 detailed paragraphs)
   - Explain the reasoning behind each major point
   - Connect observations to broader patterns or trends
   - Reference specific findings that support your analysis

2. HIDDEN INSIGHTS: 5-7 insights that only someone with your expertise would notice
   Each insight MUST include:
   - The insight itself
   - WHY this matters (the "so what?")
   - EVIDENCE from the findings that supports this
   Example: "Customer concentration risk is higher than it appears because [evidence]. This matters because [implication]."

3. ACTIONABLE RECOMMENDATIONS: 3-5 specific, actionable recommendations
   Each recommendation MUST explain:
   - WHAT to do
   - WHY this action is warranted (the reasoning)
   - WHAT EVIDENCE supports this recommendation

4. PREDICTIONS: 2-4 predictions about future developments, each with DETAILED rationale:
   - prediction: What will likely happen (specific and measurable)
   - rationale: DETAILED explanation (3-5 sentences) of WHY you predict this, including:
     * The causal mechanism or logic chain
     * Historical precedents or patterns that inform this
     * Key assumptions underlying the prediction
     * What would need to be true for this to occur
   - confidence: high/medium/low with EXPLANATION of confidence level
   - timeline: When this is expected (e.g., "Q1 2025", "6-12 months")
   - supporting_evidence: Specific findings or data points that support this
   - what_could_change_this: Factors that could invalidate the prediction

5. CRITICAL WARNINGS: Important risks or red flags from your perspective
   Each warning MUST include:
   - The risk/warning
   - WHY this is concerning (the mechanism of harm)
   - What to watch for (leading indicators)

6. KNOWLEDGE GAPS: What additional information would strengthen this analysis?
   For each gap, explain WHY this information matters and HOW it would change conclusions.

7. CONTRARIAN VIEW: What is the opposite view and why might it be right?
   Provide genuine steel-man argument with supporting logic.

CRITICAL: Every statement must have supporting reasoning. No unsupported assertions.
Be specific and cite evidence from the findings. Avoid generic statements.

Return as JSON with keys:
- analysis_text (string)
- key_insights (array of strings - each insight should include reasoning)
- recommendations (array of strings - each with reasoning)
- predictions (array of objects with: prediction, rationale, confidence, timeline, supporting_evidence, what_could_change_this)
- warnings (array of strings - each with reasoning)
- knowledge_gaps (array of strings - each explaining why it matters)
- contrarian_view (string - with supporting logic)
- confidence (0.0-1.0)
- bear_case (object, REQUIRED for short_seller perspective): {{
    "probability": 0.25,
    "summary": "One sentence summary of bear scenario",
    "trigger": "What event/condition would cause the negative outcome",
    "magnitude": "Expected impact (e.g., 'stock drops 40%', 'revenue declines 30%')",
    "timeline": "When this could materialize (e.g., 'H2 2025', '12-18 months')",
    "kill_signals": ["Signal 1 to watch", "Signal 2 to watch", "Signal 3 to watch"]
  }}
"""

        result, _ = await self.gemini_client.generate_json(prompt, temperature=0.4)

        # Ensure result is a dict (LLM might return a list or other type)
        if not isinstance(result, dict):
            result = {
                "analysis_text": "Analysis not available",
                "key_insights": [],
                "recommendations": [],
                "predictions": [],
                "warnings": [],
                "knowledge_gaps": [],
                "contrarian_view": "",
                "confidence": 0.3,
                "bear_case": None,
            }

        # Ensure predictions field exists and is properly structured
        if "predictions" not in result:
            result["predictions"] = []
        # Convert old-style string predictions to structured format if needed
        elif isinstance(result["predictions"], list) and result["predictions"]:
            if isinstance(result["predictions"][0], str):
                result["predictions"] = [
                    {
                        "prediction": p,
                        "rationale": "Based on research findings",
                        "confidence": "medium",
                        "timeline": "2025-2026",
                        "supporting_sources": []
                    }
                    for p in result["predictions"]
                ]

        # Ensure bear_case is properly structured for short_seller perspective
        if perspective_type == "short_seller":
            if "bear_case" not in result or not isinstance(result.get("bear_case"), dict):
                # Try to extract bear case summary from analysis_text
                analysis_text = result.get("analysis_text", "")
                contrarian_view = result.get("contrarian_view", "")
                warnings = result.get("warnings", [])

                # Build a meaningful summary from available data
                summary = ""
                if contrarian_view:
                    summary = contrarian_view[:200]
                elif warnings:
                    summary = f"Key risks: {'; '.join(warnings[:2])}"
                elif analysis_text:
                    # Extract first substantive sentence
                    sentences = analysis_text.split(". ")
                    summary = sentences[0][:200] if sentences else "See analysis for bear case details"

                result["bear_case"] = {
                    "probability": 0.25,
                    "summary": summary,
                    "trigger": warnings[0] if warnings else "Multiple risk factors could materialize",
                    "magnitude": "Significant downside potential - see analysis",
                    "timeline": "6-18 months",
                    "kill_signals": warnings[:5] if warnings else ["Monitor key risk factors"]
                }
            else:
                # Ensure all fields exist with meaningful defaults
                bear_case = result["bear_case"]
                warnings = result.get("warnings", [])

                if not bear_case.get("probability"):
                    bear_case["probability"] = 0.25
                if not bear_case.get("summary"):
                    bear_case["summary"] = result.get("contrarian_view", "")[:200] or "See analysis"
                if not bear_case.get("trigger"):
                    bear_case["trigger"] = warnings[0] if warnings else ""
                if not bear_case.get("magnitude"):
                    bear_case["magnitude"] = ""
                if not bear_case.get("timeline"):
                    bear_case["timeline"] = "6-18 months"
                if not bear_case.get("kill_signals"):
                    bear_case["kill_signals"] = warnings[:5] if warnings else []

        result["perspective_type"] = perspective_type
        return result

    async def _call_gemini_json(self, prompt: str) -> Any:
        """Call Gemini with JSON response format."""
        if not self.gemini_client:
            raise ValueError("Gemini client not set")

        result, response = await self.gemini_client.generate_json(prompt)
        return result

    def get_query_generation_prompt(self, query: str, max_searches: int) -> str:
        """Get default prompt for query generation."""
        return f"""
You are a research strategist. Generate {max_searches} search queries for comprehensive research.

Research Question: {query}

Guidelines:
1. Start broad to understand the landscape
2. Include specific queries for key entities/events
3. Include queries for different perspectives
4. Include queries for recent news/developments
5. Include queries for authoritative sources

Return a JSON array of search query strings.
Example: ["query 1", "query 2", "query 3"]
"""

    # ========== SOURCE VERIFICATION METHODS ==========

    async def verify_findings(
        self,
        findings: List[Dict[str, Any]],
        sources: List[Dict[str, Any]],
        original_query: str,
    ) -> List[Dict[str, Any]]:
        """
        Run verification layer on extracted findings.
        Returns findings enriched with verification metadata and Bayesian confidence.

        The confidence calculation uses a proper Bayesian network where:
        - P(finding is true) depends on P(sources are credible)
        - P(source is credible) depends on P(domain is authoritative)
        - Multiple sources are combined using proper probability theory
        - Bias detection and expert checks provide likelihood ratios

        This makes confidence scores interpretable and explainable:
        'This finding has 73% confidence because source A (85% credible)
        corroborates source B (60% credible) but contradicts source C.'
        """
        if not self.gemini_client:
            return findings

        from ..services.bayesian_confidence import calculate_bayesian_confidence

        config = self.verification_config
        verified_findings = []

        for finding in findings:
            verification = {}

            # Run applicable verification checks based on config
            if config.get("bias_detection") != "none":
                bias_result = await self._detect_bias(finding, sources)
                verification["bias"] = bias_result

            if config.get("expert_sanity_check") != "none":
                sanity_result = await self._expert_sanity_check(finding, original_query)
                verification["expert_check"] = sanity_result

            # Calculate Bayesian confidence with full context
            # This uses proper probability inference instead of additive adjustments
            adjusted_confidence, confidence_explanation = calculate_bayesian_confidence(
                finding=finding,
                sources=sources,
                verification=verification,
            )

            # Enrich finding with verification and Bayesian confidence
            verified_finding = {**finding}
            verified_finding["verification"] = verification
            verified_finding["adjusted_confidence"] = adjusted_confidence

            # Add confidence explanation for interpretability
            verified_finding["confidence_explanation"] = confidence_explanation.to_dict()
            verified_finding["confidence_narrative"] = confidence_explanation.generate_narrative()

            verified_findings.append(verified_finding)

        # Run cross-reference analysis on all findings together
        if config.get("cross_reference") != "none" and len(verified_findings) > 1:
            cross_ref_results = await self._cross_reference_findings(verified_findings, sources)
            for i, finding in enumerate(verified_findings):
                if i < len(cross_ref_results):
                    finding["verification"]["cross_reference"] = cross_ref_results[i]

                    # Recalculate confidence with cross-reference data
                    # This updates the Bayesian network with corroboration evidence
                    updated_confidence, updated_explanation = calculate_bayesian_confidence(
                        finding=finding,
                        sources=sources,
                        verification=finding["verification"],
                    )
                    finding["adjusted_confidence"] = updated_confidence
                    finding["confidence_explanation"] = updated_explanation.to_dict()
                    finding["confidence_narrative"] = updated_explanation.generate_narrative()

        return verified_findings

    async def _detect_bias(
        self,
        finding: Dict[str, Any],
        sources: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Detect bias and 'skin in the game' for a finding."""
        # Find sources that might support this finding
        finding_content = finding.get("content", "")[:500]

        prompt = f"""You are an investigative analyst detecting bias and conflicts of interest.

FINDING TO ANALYZE:
{finding_content}

FINDING TYPE: {finding.get("finding_type", "unknown")}

Perform BIAS DETECTION:

1. SKIN IN THE GAME
   Who benefits if this claim is believed?
   - VENDOR SELF-PROMOTION: Is this a company praising their own product?
   - ANALYST CONFLICTS: Could the source have financial relationships?
   - COMPETITIVE POSITIONING: Is someone trashing a competitor?
   - INVESTMENT TALKING BOOK: Is source long/short a related stock?

2. LINGUISTIC RED FLAGS
   Check for weasel words and marketing language:
   - "Up to X%" (cherry-picked best case)
   - "Studies show" without citation
   - "Industry-leading" (unmeasured claim)
   - "Revolutionary" (marketing hyperbole)
   - Lack of specific numbers

3. METHODOLOGY CONCERNS
   - Is sample size mentioned? Is it adequate?
   - Is the methodology transparent?
   - Could there be selection/survivorship bias?
   - Are definitions clear (e.g., "adoption" = trial or daily use)?

Return JSON:
{{
  "bias_detected": true/false,
  "bias_score": 0.0-1.0 (0=unbiased, 1=heavily biased),
  "bias_type": "vendor_marketing" | "analyst_conflict" | "competitive_attack" | "selection_bias" | "none",
  "skin_in_the_game": "Brief description of who benefits" or null,
  "red_flags": ["list of specific red flags found"],
  "confidence_adjustment": -0.3 to 0.0 (suggested adjustment to confidence)
}}
"""

        try:
            result = await self._call_gemini_json(prompt)
            if isinstance(result, dict):
                return result
        except Exception:
            pass

        return {
            "bias_detected": False,
            "bias_score": 0.0,
            "bias_type": "none",
            "skin_in_the_game": None,
            "red_flags": [],
            "confidence_adjustment": 0.0
        }

    async def _expert_sanity_check(
        self,
        finding: Dict[str, Any],
        original_query: str,
    ) -> Dict[str, Any]:
        """Use LLM expertise to sanity-check claims."""
        finding_content = finding.get("content", "")[:800]
        finding_type = finding.get("finding_type", "unknown")
        extracted_data = finding.get("extracted_data", {})

        prompt = f"""You are a senior analyst with 20+ years of domain expertise. Apply your knowledge to evaluate this claim.

RESEARCH CONTEXT: {original_query[:200]}

FINDING TO EVALUATE:
Type: {finding_type}
Content: {finding_content}
Data: {extracted_data}

Apply EXPERT JUDGMENT:

1. PLAUSIBILITY CHECK
   Based on your knowledge:
   - Does this claim seem reasonable?
   - Are the numbers/percentages realistic?
   - Does it align with known market dynamics?

   Common implausible patterns:
   - "40% adoption" for products launched recently
   - Productivity gains >50% (realistic is 10-30%)
   - "100% of X" claims (nothing is 100%)
   - Growth rates >200% in mature markets

2. HISTORICAL PATTERN
   - Does this match how similar situations played out?
   - What's the typical timeline for such claims?
   - Are there precedents that support or contradict this?

3. MISSING CONTEXT
   - What important context is missing?
   - "Grew 200%" - from what base?
   - "Faster than X" - by what measure?

4. EXTRAORDINARY CLAIMS FLAG
   Flag if this requires extraordinary evidence:
   - >50% productivity improvement
   - >80% adoption rate
   - "First ever" or "only solution" claims

Return JSON:
{{
  "plausibility": "plausible" | "questionable" | "implausible",
  "plausibility_score": 0.0-1.0 (1=highly plausible),
  "expert_reasoning": "2-3 sentence explanation",
  "historical_precedent": "How does this compare to similar claims historically?",
  "missing_context": ["list of missing context that would help evaluate"],
  "adjusted_estimate": "What's a more realistic interpretation?" or null,
  "extraordinary_claim": true/false,
  "confidence_adjustment": -0.3 to 0.1 (negative if questionable, small positive if strongly supported)
}}
"""

        try:
            result = await self._call_gemini_json(prompt)
            if isinstance(result, dict):
                return result
        except Exception:
            pass

        return {
            "plausibility": "plausible",
            "plausibility_score": 0.7,
            "expert_reasoning": "Unable to perform detailed sanity check",
            "historical_precedent": None,
            "missing_context": [],
            "adjusted_estimate": None,
            "extraordinary_claim": False,
            "confidence_adjustment": 0.0
        }

    async def _cross_reference_findings(
        self,
        findings: List[Dict[str, Any]],
        sources: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """Cross-reference findings to identify agreements and contradictions."""
        # Build findings summary for cross-reference
        findings_summary = []
        for i, f in enumerate(findings[:15]):  # Limit to avoid token overflow
            findings_summary.append({
                "index": i,
                "type": f.get("finding_type"),
                "summary": f.get("summary", "")[:100],
                "content": f.get("content", "")[:200],
                "confidence": f.get("confidence_score", 0.5)
            })

        prompt = f"""You are a research verification analyst cross-referencing findings.

FINDINGS TO CROSS-REFERENCE:
{findings_summary}

NUMBER OF SOURCES: {len(sources)}

For each finding, analyze:

1. CORROBORATION
   - Do other findings support or contradict this one?
   - Would multiple sources logically cover this claim?

2. INTERNAL CONSISTENCY
   - Do any findings contradict each other?
   - Are there logical inconsistencies?

3. SOURCE DIVERSITY
   - Is this claim likely from a single source or multiple?
   - Primary data vs secondary citation?

Return JSON array with one object per finding (same order as input):
[
  {{
    "finding_index": 0,
    "corroboration_level": "strong" | "moderate" | "weak" | "uncorroborated",
    "supporting_findings": [list of finding indices that support this],
    "contradicting_findings": [list of finding indices that contradict this],
    "likely_source_diversity": "single" | "few" | "multiple",
    "verification_notes": "Brief note on verification status",
    "confidence_adjustment": -0.2 to 0.1
  }}
]
"""

        try:
            result = await self._call_gemini_json(prompt)
            if isinstance(result, list):
                return result
        except Exception:
            pass

        # Return empty cross-reference for each finding
        return [{"corroboration_level": "unknown", "confidence_adjustment": 0.0} for _ in findings]

    def _calculate_adjusted_confidence(
        self,
        original_confidence: float,
        verification: Dict[str, Any],
        finding: Optional[Dict[str, Any]] = None,
        sources: Optional[List[Dict[str, Any]]] = None,
    ) -> float:
        """Calculate adjusted confidence score using Bayesian inference.

        This replaces the additive adjustment model with proper probabilistic
        inference. Instead of summing adjustments (which can violate probability
        rules), we use Bayes' theorem to properly combine evidence.

        The Bayesian approach provides:
        1. Interpretable confidence scores (true probabilities)
        2. Explainable reasoning chain (why confidence changed)
        3. Proper handling of corroborating/contradicting evidence
        4. Insights into what would change the conclusion

        Args:
            original_confidence: Base confidence from finding extraction
            verification: Verification results (bias, expert_check, cross_reference)
            finding: Optional finding dict for full Bayesian calculation
            sources: Optional sources list for credibility assessment

        Returns:
            Adjusted confidence score (probability) between 0.1 and 0.95
        """
        from ..services.bayesian_confidence import calculate_bayesian_confidence

        # If we have the full context, use the comprehensive Bayesian model
        if finding is not None and sources is not None:
            # Create a finding dict with the original confidence
            finding_with_conf = {**finding, "confidence_score": original_confidence}
            adjusted, _ = calculate_bayesian_confidence(
                finding_with_conf, sources, verification
            )
            return adjusted

        # Fallback: Use simplified Bayesian update for just verification data
        return self._calculate_adjusted_confidence_legacy(
            original_confidence, verification
        )

    def _calculate_adjusted_confidence_legacy(
        self,
        original_confidence: float,
        verification: Dict[str, Any],
    ) -> float:
        """Legacy additive confidence calculation (for backwards compatibility).

        Note: This is a fallback when full Bayesian calculation isn't possible.
        The additive model doesn't properly handle probability combination,
        but is kept for cases where we don't have full source data.
        """
        adjusted = original_confidence

        # Apply bias adjustment
        if "bias" in verification:
            bias_adj = verification["bias"].get("confidence_adjustment", 0.0)
            adjusted += bias_adj

        # Apply expert sanity check adjustment
        if "expert_check" in verification:
            expert_adj = verification["expert_check"].get("confidence_adjustment", 0.0)
            adjusted += expert_adj

        # Apply cross-reference adjustment
        if "cross_reference" in verification:
            cross_adj = verification["cross_reference"].get("confidence_adjustment", 0.0)
            adjusted += cross_adj

        # Clamp to valid range
        return max(0.1, min(1.0, adjusted))

    # ========== REPORT GENERATION METHODS ==========

    def get_supported_report_variants(self) -> List[str]:
        """Get list of report variants supported by this template.

        Subclasses can override to add domain-specific variants.
        """
        return ["full_report", "executive_summary", "decision_brief"]

    def generate_report(
        self,
        result: Dict[str, Any],
        variant: str = "full_report",
        title: Optional[str] = None,
    ) -> str:
        """Generate a report in the specified variant.

        This is the main entry point for report generation.
        Templates can override specific variant methods for domain-specific rendering.

        Args:
            result: Research result dictionary
            variant: Report variant (full_report, executive_summary, or template-specific)
            title: Optional custom title

        Returns:
            Formatted markdown string
        """
        if variant == "executive_summary":
            return self.generate_executive_summary(result, title)
        elif variant == "full_report":
            return self.generate_full_report(result, title)
        elif variant == "decision_brief":
            return self.generate_decision_brief(result, title)
        else:
            # Check for template-specific variants
            method_name = f"generate_{variant}"
            if hasattr(self, method_name):
                return getattr(self, method_name)(result, title)
            # Fall back to full report for unknown variants
            return self.generate_full_report(result, title)

    def generate_full_report(
        self,
        result: Dict[str, Any],
        title: Optional[str] = None,
    ) -> str:
        """Generate full detailed report.

        This provides a default implementation. Subclasses can override
        for domain-specific full report formatting.
        """
        from datetime import datetime

        query = result.get("query", "Unknown Query")
        template = result.get("template", self.template_id)
        report_title = title or f"Research Report: {query[:50]}"

        sections = []

        # Header
        sections.append(f"# {report_title}")
        sections.append("")
        sections.append(f"**Research Query:** {query}")
        sections.append(f"**Template:** {template.replace('_', ' ').title()} Research")
        sections.append(f"**Generated:** {datetime.now().strftime('%B %d, %Y at %H:%M')}")
        sections.append(f"**Status:** {result.get('status', 'unknown').title()}")
        sections.append("")
        sections.append("---")
        sections.append("")

        # Template-specific header content
        header_content = self._generate_report_header(result)
        if header_content:
            sections.append(header_content)
            sections.append("")
            sections.append("---")
            sections.append("")

        # Executive Summary section
        sections.append("## Executive Summary")
        sections.append("")
        findings = result.get("findings", [])
        if findings:
            high_conf = [f for f in findings if f.get("confidence_score", 0) >= 0.7]
            sections.append(f"This research identified **{len(findings)}** key findings across multiple categories.")
            sections.append(f"**{len(high_conf)}** findings have high confidence (>70%).")
            sections.append("")

            # Key findings summary (template can customize via _get_priority_findings)
            priority_findings = self._get_priority_findings(findings)
            for finding in priority_findings[:5]:
                ftype = finding.get("finding_type", "fact").upper()
                summary = finding.get("summary") or finding.get("content", "")[:100]
                sections.append(f"- **[{ftype}]** {summary}")
            sections.append("")
        else:
            sections.append("No significant findings were extracted.")
            sections.append("")

        sections.append("---")
        sections.append("")

        # Template-specific key sections
        key_sections = self._generate_key_sections(result)
        if key_sections:
            sections.append(key_sections)
            sections.append("")
            sections.append("---")
            sections.append("")

        # Detailed Findings
        sections.append("## Detailed Findings")
        sections.append("")

        # Group by type (template can customize grouping)
        grouped_findings = self._group_findings(findings)

        for ftype, type_findings in grouped_findings.items():
            sections.append(f"### {ftype.replace('_', ' ').title()} ({len(type_findings)})")
            sections.append("")

            for finding in type_findings:
                conf = finding.get("confidence_score", 0.5)
                conf_label = "High" if conf >= 0.8 else "Medium" if conf >= 0.6 else "Low"
                sections.append(f"#### {finding.get('summary', finding.get('content', '')[:60])}")
                sections.append("")
                sections.append(finding.get("content", ""))
                sections.append("")
                sections.append(f"*Confidence: {conf_label} ({conf:.0%})*")
                sections.append("")

        sections.append("---")
        sections.append("")

        # Perspectives
        perspectives = result.get("perspectives", [])
        if perspectives:
            sections.append("## Multi-Perspective Analysis")
            sections.append("")

            for perspective in perspectives:
                ptype = perspective.get("perspective_type", "unknown").replace("_", " ").title()
                sections.append(f"### {ptype} Perspective")
                sections.append("")
                sections.append(perspective.get("analysis_text", ""))
                sections.append("")

                insights = perspective.get("key_insights", [])
                if insights:
                    sections.append("**Key Insights:**")
                    for insight in insights:
                        sections.append(f"- {insight}")
                    sections.append("")

                recs = perspective.get("recommendations", [])
                if recs:
                    sections.append("**Recommendations:**")
                    for rec in recs:
                        sections.append(f"- {rec}")
                    sections.append("")

                warnings = perspective.get("warnings", [])
                if warnings:
                    sections.append("**Warnings:**")
                    for warning in warnings:
                        sections.append(f"- {warning}")
                    sections.append("")

            sections.append("---")
            sections.append("")

        # Template-specific additional sections
        additional = self._generate_additional_sections(result)
        if additional:
            sections.append(additional)
            sections.append("")
            sections.append("---")
            sections.append("")

        # Sources
        sources = result.get("sources", [])
        if sources:
            sections.append("## Sources")
            sections.append("")

            for source in sources[:20]:
                title_text = source.get("title", source.get("url", "Unknown"))
                url = source.get("url", "#")
                cred = source.get("credibility_score", 0.5)
                sections.append(f"- [{title_text}]({url}) - Credibility: {cred:.0%}")

            sections.append("")
            sections.append("---")
            sections.append("")

        # Metadata
        sections.append("## Research Metadata")
        sections.append("")
        sections.append(f"- **Session ID:** {result.get('session_id', 'N/A')}")
        sections.append(f"- **Execution Time:** {result.get('execution_time_seconds', 0):.1f} seconds")

        cost = result.get("cost_summary", {})
        if cost:
            sections.append(f"- **Total Tokens:** {cost.get('total_tokens', 0):,}")
            sections.append(f"- **Total Cost:** ${cost.get('total_cost_usd', 0):.4f}")

        queries = result.get("search_queries_executed", [])
        if queries:
            sections.append(f"- **Searches Executed:** {len(queries)}")

        return "\n".join(sections)

    def generate_executive_summary(
        self,
        result: Dict[str, Any],
        title: Optional[str] = None,
    ) -> str:
        """Generate brief executive summary.

        This provides a default implementation. Subclasses can override
        for domain-specific executive summary formatting.
        """
        from datetime import datetime

        query = result.get("query", "Unknown Query")
        report_title = title or f"Executive Summary: {query[:40]}"

        sections = []
        sections.append(f"# {report_title}")
        sections.append("")
        sections.append(f"**Research Query:** {query}")
        sections.append(f"**Generated:** {datetime.now().strftime('%B %d, %Y')}")
        sections.append("")
        sections.append("---")
        sections.append("")

        # Key findings
        sections.append("## Key Findings")
        sections.append("")

        findings = result.get("findings", [])
        priority_findings = self._get_priority_findings(findings)

        for finding in priority_findings[:7]:
            ftype = finding.get("finding_type", "fact").upper()
            summary = finding.get("summary") or finding.get("content", "")[:150]
            sections.append(f"- **[{ftype}]** {summary}")

        sections.append("")

        # Template-specific executive highlights
        highlights = self._generate_executive_highlights(result)
        if highlights:
            sections.append(highlights)
            sections.append("")

        # Key perspectives
        perspectives = result.get("perspectives", [])
        if perspectives:
            sections.append("## Expert Perspectives")
            sections.append("")

            for p in perspectives:
                ptype = p.get("perspective_type", "").replace("_", " ").title()
                insights = p.get("key_insights", [])
                if insights:
                    sections.append(f"**{ptype}:** {insights[0]}")

            sections.append("")

        sections.append("---")
        sections.append("")
        sections.append(f"*Full report contains {len(findings)} findings from {len(result.get('sources', []))} sources.*")

        return "\n".join(sections)

    def generate_decision_brief(
        self,
        result: Dict[str, Any],
        title: Optional[str] = None,
    ) -> str:
        """Generate focused one-page decision brief.

        This is a highly condensed format focused on actionable insights
        for busy executives. Maximum one page when printed.
        """
        from datetime import datetime

        query = result.get("query", "Unknown Query")
        report_title = title or f"Decision Brief: {query[:35]}"
        findings = result.get("findings", [])
        perspectives = result.get("perspectives", [])

        sections = []

        # Header - compact
        sections.append(f"# {report_title}")
        sections.append(f"*{datetime.now().strftime('%B %d, %Y')} | {len(findings)} findings | Confidence: {self._calculate_avg_confidence(findings):.0%}*")
        sections.append("")
        sections.append("---")
        sections.append("")

        # Bottom Line Up Front (BLUF)
        sections.append("## Bottom Line")
        sections.append("")
        priority = self._get_priority_findings(findings)
        if priority:
            top_finding = priority[0]
            sections.append(f"> {top_finding.get('summary') or top_finding.get('content', '')[:200]}")
        sections.append("")

        # Key Facts (3-5 bullets max)
        sections.append("## Key Facts")
        sections.append("")
        facts = [f for f in findings if f.get("finding_type") == "fact"][:5]
        if not facts:
            facts = priority[:5]
        for f in facts:
            conf = f.get("confidence_score", 0.5)
            conf_icon = "" if conf >= 0.8 else "" if conf >= 0.6 else ""
            sections.append(f"- {conf_icon} {f.get('summary') or f.get('content', '')[:100]}")
        sections.append("")

        # Risk Callout Box
        red_flags = [f for f in findings if f.get("finding_type") in ["red_flag", "suspicious_element", "risk"]]
        if red_flags:
            sections.append("## Risks & Red Flags")
            sections.append("")
            for rf in red_flags[:3]:
                sections.append(f"- {rf.get('summary') or rf.get('content', '')[:80]}")
            sections.append("")

        # Recommendations (from perspectives)
        all_recs = []
        for p in perspectives:
            recs = p.get("recommendations", [])
            all_recs.extend(recs[:2])
        if all_recs:
            sections.append("## Recommended Actions")
            sections.append("")
            for rec in all_recs[:4]:
                if isinstance(rec, str):
                    sections.append(f"- {rec[:100]}")
            sections.append("")

        # Knowledge Gaps (brief)
        gaps = [f for f in findings if f.get("finding_type") == "gap"]
        if gaps:
            sections.append("## Open Questions")
            sections.append("")
            for g in gaps[:2]:
                sections.append(f"- {g.get('summary') or g.get('content', '')[:80]}")
            sections.append("")

        # Footer
        sections.append("---")
        sections.append(f"*Based on {len(result.get('sources', []))} sources. See full report for details.*")

        return "\n".join(sections)

    def _calculate_avg_confidence(self, findings: List[Dict[str, Any]]) -> float:
        """Calculate average confidence across findings."""
        if not findings:
            return 0.0
        total = sum(f.get("confidence_score", 0.5) for f in findings)
        return total / len(findings)

    # ========== TEMPLATE HOOKS FOR CUSTOMIZATION ==========

    def _generate_report_header(self, result: Dict[str, Any]) -> str:
        """Generate template-specific header content.

        Override in subclasses to add domain-specific header sections.
        """
        return ""

    def _get_priority_findings(self, findings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Get priority-sorted findings for summary sections.

        Override in subclasses to customize finding priority for domain.
        Default: high confidence findings sorted by confidence.
        """
        high_conf = sorted(
            [f for f in findings if f.get("confidence_score", 0) >= 0.6],
            key=lambda x: x.get("confidence_score", 0),
            reverse=True
        )
        return high_conf

    def _group_findings(self, findings: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """Group findings by type for detailed sections.

        Override in subclasses to customize grouping for domain.
        """
        grouped: Dict[str, List[Dict[str, Any]]] = {}
        for f in findings:
            ftype = f.get("finding_type", "other")
            if ftype not in grouped:
                grouped[ftype] = []
            grouped[ftype].append(f)
        return grouped

    def _generate_key_sections(self, result: Dict[str, Any]) -> str:
        """Generate template-specific key sections.

        Override in subclasses for domain-specific sections like:
        - Financial: Bull/Bear case, Valuation summary
        - Investigative: Risk assessment, Actor map
        - Contract: Red flags summary, Pricing analysis
        """
        return ""

    def _generate_additional_sections(self, result: Dict[str, Any]) -> str:
        """Generate additional template-specific sections.

        Override in subclasses for sections that come after perspectives.
        """
        return ""

    def _generate_executive_highlights(self, result: Dict[str, Any]) -> str:
        """Generate template-specific executive summary highlights.

        Override in subclasses for domain-specific executive highlights.
        """
        return ""
