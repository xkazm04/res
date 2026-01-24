"""
E2E Integration Test for Complete Research-to-Report Flow.

Tests the critical user journey:
input query -> search -> findings extraction -> perspective analysis -> report generation -> output

Uses a mock Gemini client for deterministic testing.
"""

import pytest
import asyncio
import sys
from pathlib import Path
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.schemas.input import ActorInput
from src.schemas.output import ActorOutput, Finding, Perspective, Source, CostSummary
from src.services.research import ResearchService
from src.services.report import ReportService
from src.clients.gemini import (
    GeminiClient,
    ResearchResponse,
    TokenUsage,
    Source as GeminiSource,
    SearchMode,
)


# ============================================================================
# MOCK GEMINI CLIENT
# ============================================================================


class MockGeminiClient:
    """
    Mock Gemini client that returns deterministic responses for testing.

    Simulates the behavior of the real GeminiClient without making API calls.
    """

    DEFAULT_MODEL = "gemini-mock-test"

    def __init__(self):
        self.api_key = "mock-api-key"
        self.model = self.DEFAULT_MODEL
        self.search_mode = SearchMode.GROUNDED
        self._call_count = 0

    def is_available(self) -> bool:
        return True

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> ResearchResponse:
        """Generate response without web search."""
        self._call_count += 1
        return ResearchResponse(
            text="Mock generated response for testing.",
            token_usage=TokenUsage(input_tokens=100, output_tokens=50, total_tokens=150),
            cost_usd=0.0001,
            search_mode=SearchMode.NONE,
            model=self.model,
        )

    async def generate_json(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
    ) -> tuple[Any, ResearchResponse]:
        """Generate JSON response with deterministic mock data."""
        self._call_count += 1

        token_usage = TokenUsage(input_tokens=200, output_tokens=100, total_tokens=300)
        response = ResearchResponse(
            text="{}",
            token_usage=token_usage,
            cost_usd=0.0002,
            search_mode=SearchMode.NONE,
            model=self.model,
        )

        # Determine response type based on prompt content
        prompt_lower = prompt.lower()

        # Query generation
        if "search queries" in prompt_lower or "generate" in prompt_lower and "queries" in prompt_lower:
            return self._mock_search_queries(), response

        # Findings extraction
        if "extract" in prompt_lower and "findings" in prompt_lower:
            return self._mock_findings(), response

        # Bias detection
        if "bias" in prompt_lower and "detect" in prompt_lower:
            return self._mock_bias_detection(), response

        # Expert sanity check
        if "expert" in prompt_lower and ("sanity" in prompt_lower or "plausibility" in prompt_lower):
            return self._mock_expert_check(), response

        # Cross-reference
        if "cross-reference" in prompt_lower or "cross reference" in prompt_lower:
            return self._mock_cross_reference(), response

        # Perspective analysis
        if "perspective" in prompt_lower or any(p in prompt_lower for p in [
            "analyst", "investor", "strategist", "expert", "forensic"
        ]):
            return self._mock_perspective_analysis(), response

        # Default empty response
        return {}, response

    async def research(
        self,
        query: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 4096,
        mode: Optional[SearchMode] = None,
    ) -> ResearchResponse:
        """Research query with mock Google Search results."""
        self._call_count += 1

        # Generate mock sources
        sources = [
            GeminiSource(
                url=f"https://example{i}.com/article-{i}",
                title=f"Mock Source {i}: Research on AI Technology",
                domain=f"example{i}.com",
                snippet=f"This is a snippet from mock source {i} about the research topic.",
            )
            for i in range(1, 6)
        ]

        # Generate mock synthesized content
        text = f"""## Research Results for: {query}

Based on comprehensive analysis of available sources, here are the key findings:

1. **Key Finding 1**: The AI technology market is experiencing rapid growth with an estimated 35% CAGR through 2028.

2. **Key Finding 2**: Major players include established tech companies and emerging startups, with significant venture capital investment.

3. **Key Finding 3**: Regulatory frameworks are evolving, with new policies expected in 2025.

4. **Key Finding 4**: Developer adoption rates are accelerating, particularly in enterprise settings.

5. **Key Finding 5**: Security and privacy concerns remain top priorities for organizations implementing AI solutions.

Sources consulted include industry reports, news articles, and expert analyses from leading research firms.
"""

        return ResearchResponse(
            text=text,
            sources=sources,
            search_queries=[query],
            token_usage=TokenUsage(input_tokens=500, output_tokens=300, total_tokens=800),
            cost_usd=0.001,
            search_mode=mode or self.search_mode,
            model=self.model,
        )

    def _mock_search_queries(self) -> List[str]:
        """Return mock search queries."""
        return [
            "AI technology market trends 2024",
            "AI adoption rates enterprise 2024",
            "AI regulation policy developments",
            "AI startup investment landscape",
        ]

    def _mock_findings(self) -> List[Dict[str, Any]]:
        """Return mock extracted findings."""
        return [
            {
                "finding_type": "market_trend",
                "content": "The AI technology market is projected to reach $500B by 2028 with a 35% CAGR.",
                "summary": "AI market growth to $500B by 2028",
                "confidence_score": 0.85,
                "temporal_context": "prediction",
                "extracted_data": {"market_size": "$500B", "cagr": "35%", "year": 2028},
            },
            {
                "finding_type": "adoption_metric",
                "content": "Enterprise AI adoption has increased from 30% to 65% since 2022.",
                "summary": "Enterprise AI adoption doubled since 2022",
                "confidence_score": 0.78,
                "temporal_context": "present",
                "extracted_data": {"adoption_2022": "30%", "adoption_current": "65%"},
            },
            {
                "finding_type": "regulatory_development",
                "content": "New AI regulations are expected to be enacted in the EU and US by Q2 2025.",
                "summary": "AI regulations expected Q2 2025",
                "confidence_score": 0.72,
                "temporal_context": "prediction",
                "extracted_data": {"regions": ["EU", "US"], "timeline": "Q2 2025"},
            },
            {
                "finding_type": "investment",
                "content": "VC investment in AI startups reached $50B in 2024, up 40% from 2023.",
                "summary": "AI VC investment $50B in 2024",
                "confidence_score": 0.88,
                "temporal_context": "past",
                "extracted_data": {"investment": "$50B", "year": 2024, "growth": "40%"},
            },
            {
                "finding_type": "technology_trend",
                "content": "Generative AI and LLMs are the fastest-growing segments, representing 60% of new deployments.",
                "summary": "GenAI represents 60% of new deployments",
                "confidence_score": 0.82,
                "temporal_context": "present",
                "extracted_data": {"segment": "Generative AI", "share": "60%"},
            },
        ]

    def _mock_bias_detection(self) -> Dict[str, Any]:
        """Return mock bias detection result."""
        return {
            "bias_detected": False,
            "bias_score": 0.15,
            "bias_type": "none",
            "skin_in_the_game": None,
            "red_flags": [],
            "confidence_adjustment": 0.0,
        }

    def _mock_expert_check(self) -> Dict[str, Any]:
        """Return mock expert sanity check result."""
        return {
            "plausibility": "plausible",
            "plausibility_score": 0.85,
            "expert_reasoning": "The claims align with known market trends and historical patterns.",
            "historical_precedent": "Similar growth patterns observed in cloud computing adoption.",
            "missing_context": ["Specific methodology details"],
            "adjusted_estimate": None,
            "extraordinary_claim": False,
            "confidence_adjustment": 0.0,
        }

    def _mock_cross_reference(self) -> List[Dict[str, Any]]:
        """Return mock cross-reference results."""
        return [
            {
                "finding_index": i,
                "corroboration_level": "moderate",
                "supporting_findings": [],
                "contradicting_findings": [],
                "likely_source_diversity": "multiple",
                "verification_notes": "Finding appears consistent with other sources.",
                "confidence_adjustment": 0.0,
            }
            for i in range(5)
        ]

    def _mock_perspective_analysis(self) -> Dict[str, Any]:
        """Return mock perspective analysis result."""
        return {
            "analysis_text": "Based on the research findings, this represents a significant market opportunity with strong growth fundamentals. The adoption trends suggest sustainable long-term growth potential.",
            "key_insights": [
                "Strong market growth trajectory with enterprise adoption",
                "Regulatory environment becoming more defined",
                "Investment continues at healthy levels",
            ],
            "recommendations": [
                "Focus on enterprise-ready solutions",
                "Prepare for upcoming regulatory requirements",
                "Consider strategic partnerships",
            ],
            "predictions": [
                {
                    "prediction": "Market consolidation expected in next 18 months",
                    "rationale": "High investment levels and competition will drive M&A activity",
                    "confidence": "medium",
                    "timeline": "Q1 2026",
                    "supporting_sources": [],
                }
            ],
            "warnings": [
                "Regulatory uncertainty may slow adoption",
                "Market volatility could impact investment",
            ],
            "knowledge_gaps": [
                "Regional adoption differences",
                "Long-term sustainability metrics",
            ],
            "contrarian_view": "The market may be overheated with valuations that don't reflect fundamental value.",
            "confidence": 0.75,
        }


# ============================================================================
# FIXTURES
# ============================================================================


@pytest.fixture
def mock_gemini_client():
    """Provide mock Gemini client for testing."""
    return MockGeminiClient()


@pytest.fixture
def research_service(mock_gemini_client):
    """Provide ResearchService with mock client."""
    return ResearchService(
        gemini_client=mock_gemini_client,
        supabase_client=None,
        ocr_service=None,
    )


@pytest.fixture
def report_service():
    """Provide ReportService for testing."""
    return ReportService()


@pytest.fixture
def sample_actor_input():
    """Provide sample ActorInput for testing."""
    return ActorInput(
        query="What are the key trends in AI technology for 2024?",
        template="investigative",
        granularity="standard",
        generate_report=True,
        report_variant="full_report",
        report_format="markdown",
        save_to_supabase=False,
        use_cache=False,
    )


@pytest.fixture
def sample_actor_input_quick():
    """Provide sample ActorInput for quick research testing."""
    return ActorInput(
        query="AI market overview 2024",
        template="investigative",
        granularity="quick",
        generate_report=True,
        report_variant="executive_summary",
        report_format="markdown",
        save_to_supabase=False,
        use_cache=False,
    )


# ============================================================================
# TESTS
# ============================================================================


class TestActorInputValidation:
    """Test ActorInput schema validation."""

    def test_valid_input_minimal(self):
        """Test minimal valid input with just query."""
        actor_input = ActorInput(query="Test query")
        assert actor_input.query == "Test query"
        assert actor_input.template == "tech_market"  # default
        assert actor_input.granularity == "standard"  # default

    def test_valid_input_full(self, sample_actor_input):
        """Test full valid input."""
        assert sample_actor_input.query == "What are the key trends in AI technology for 2024?"
        assert sample_actor_input.template == "investigative"
        assert sample_actor_input.granularity == "standard"
        assert sample_actor_input.generate_report is True

    def test_get_max_searches(self):
        """Test max_searches based on granularity."""
        quick = ActorInput(query="test", granularity="quick")
        assert quick.get_max_searches() == 4

        standard = ActorInput(query="test", granularity="standard")
        assert standard.get_max_searches() == 8

        deep = ActorInput(query="test", granularity="deep")
        assert deep.get_max_searches() == 12

    def test_get_max_searches_explicit(self):
        """Test explicit max_searches override."""
        actor_input = ActorInput(query="test", granularity="quick", max_searches=10)
        assert actor_input.get_max_searches() == 10

    def test_get_report_title(self):
        """Test auto-generated report title."""
        actor_input = ActorInput(query="Short query")
        assert "Short query" in actor_input.get_report_title()

        long_query = "A" * 100
        actor_input_long = ActorInput(query=long_query)
        title = actor_input_long.get_report_title()
        assert len(title) < 100
        assert "..." in title

    def test_input_validation_invalid_granularity(self):
        """Test input accepts any granularity (no enum validation)."""
        # Pydantic doesn't enforce enum, just uses default logic
        actor_input = ActorInput(query="test", granularity="invalid")
        # get_max_searches falls back to 8 for unknown granularity
        assert actor_input.get_max_searches() == 8


class TestResearchServiceIntegration:
    """Test ResearchService with mock client."""

    @pytest.mark.asyncio
    async def test_execute_research_basic(self, research_service, sample_actor_input):
        """Test basic research execution."""
        result = await research_service.execute_research(
            query=sample_actor_input.query,
            template_type=sample_actor_input.template,
            granularity=sample_actor_input.granularity,
            max_searches=4,
            save_to_db=False,
            use_cache=False,
        )

        # Verify result structure
        assert "session_id" in result
        assert "query" in result
        assert "template" in result
        assert "status" in result
        assert "findings" in result
        assert "perspectives" in result
        assert "sources" in result
        assert "search_queries_executed" in result
        assert "cost_summary" in result
        assert "execution_time_seconds" in result

    @pytest.mark.asyncio
    async def test_execute_research_status(self, research_service, sample_actor_input):
        """Test research execution completes successfully."""
        result = await research_service.execute_research(
            query=sample_actor_input.query,
            template_type=sample_actor_input.template,
            granularity="quick",
            max_searches=3,
            save_to_db=False,
            use_cache=False,
        )

        assert result["status"] in ["completed", "partial"]
        assert len(result["errors"]) == 0 or result["status"] == "partial"

    @pytest.mark.asyncio
    async def test_execute_research_has_findings(self, research_service, sample_actor_input):
        """Test research execution produces findings."""
        result = await research_service.execute_research(
            query=sample_actor_input.query,
            template_type=sample_actor_input.template,
            granularity="quick",
            max_searches=3,
            save_to_db=False,
            use_cache=False,
        )

        assert len(result["findings"]) > 0

        # Verify finding structure
        for finding in result["findings"]:
            assert "finding_type" in finding
            assert "content" in finding
            assert "confidence_score" in finding

    @pytest.mark.asyncio
    async def test_execute_research_has_sources(self, research_service, sample_actor_input):
        """Test research execution collects sources."""
        result = await research_service.execute_research(
            query=sample_actor_input.query,
            template_type=sample_actor_input.template,
            granularity="quick",
            max_searches=3,
            save_to_db=False,
            use_cache=False,
        )

        assert len(result["sources"]) > 0

        # Verify source structure
        for source in result["sources"]:
            assert "url" in source
            assert "title" in source

    @pytest.mark.asyncio
    async def test_execute_research_has_perspectives(self, research_service, sample_actor_input):
        """Test research execution runs perspective analysis."""
        result = await research_service.execute_research(
            query=sample_actor_input.query,
            template_type=sample_actor_input.template,
            granularity="quick",
            max_searches=3,
            save_to_db=False,
            use_cache=False,
        )

        assert len(result["perspectives"]) > 0

        # Verify perspective structure
        for perspective in result["perspectives"]:
            assert "perspective_type" in perspective
            assert "analysis_text" in perspective

    @pytest.mark.asyncio
    async def test_execute_research_tracks_cost(self, research_service, sample_actor_input):
        """Test research execution tracks cost."""
        result = await research_service.execute_research(
            query=sample_actor_input.query,
            template_type=sample_actor_input.template,
            granularity="quick",
            max_searches=3,
            save_to_db=False,
            use_cache=False,
        )

        cost_summary = result["cost_summary"]
        assert "total_tokens" in cost_summary
        assert "total_cost_usd" in cost_summary
        assert cost_summary["total_tokens"] >= 0


class TestReportServiceIntegration:
    """Test ReportService with research results."""

    @pytest.fixture
    def mock_research_result(self):
        """Provide mock research result for testing."""
        return {
            "session_id": "test-session-123",
            "query": "AI technology trends 2024",
            "template": "investigative",
            "status": "completed",
            "findings": [
                {
                    "finding_id": "f1",
                    "finding_type": "market_trend",
                    "content": "AI market projected to reach $500B by 2028.",
                    "summary": "AI market growth projection",
                    "confidence_score": 0.85,
                    "temporal_context": "prediction",
                },
                {
                    "finding_id": "f2",
                    "finding_type": "adoption_metric",
                    "content": "Enterprise adoption increased 35% in 2024.",
                    "summary": "Enterprise adoption growth",
                    "confidence_score": 0.78,
                    "temporal_context": "present",
                },
            ],
            "perspectives": [
                {
                    "perspective_type": "institutional_investor",
                    "analysis_text": "Strong market fundamentals suggest continued growth.",
                    "key_insights": ["Market is well-positioned", "Growth trajectory stable"],
                    "recommendations": ["Monitor regulatory developments"],
                    "warnings": ["Valuation concerns in some segments"],
                    "confidence": 0.75,
                }
            ],
            "sources": [
                {
                    "url": "https://example.com/report",
                    "title": "AI Market Analysis 2024",
                    "domain": "example.com",
                    "credibility_score": 0.85,
                }
            ],
            "search_queries_executed": ["AI trends 2024", "AI market size"],
            "cost_summary": {
                "total_tokens": 5000,
                "total_cost_usd": 0.05,
            },
            "execution_time_seconds": 30.5,
            "errors": [],
            "warnings": [],
        }

    def test_generate_markdown_full_report(self, report_service, mock_research_result):
        """Test markdown full report generation."""
        markdown = report_service.generate_markdown(
            mock_research_result,
            variant="full_report",
            title="Test Report",
        )

        assert isinstance(markdown, str)
        assert len(markdown) > 500
        assert "# Test Report" in markdown or "# Research Report" in markdown
        assert "Detailed Findings" in markdown
        assert "Sources" in markdown

    def test_generate_markdown_executive_summary(self, report_service, mock_research_result):
        """Test markdown executive summary generation."""
        markdown = report_service.generate_markdown(
            mock_research_result,
            variant="executive_summary",
            title="Executive Summary Test",
        )

        assert isinstance(markdown, str)
        assert len(markdown) > 200
        assert "Executive Summary" in markdown or "Key Findings" in markdown

    def test_generate_html(self, report_service, mock_research_result):
        """Test HTML report generation."""
        markdown = report_service.generate_markdown(mock_research_result)
        html = report_service.generate_html(markdown, title="Test Report")

        assert isinstance(html, str)
        assert "<html" in html
        assert "</html>" in html
        assert "Test Report" in html

    def test_generate_html_interactive(self, report_service, mock_research_result):
        """Test interactive HTML generation with research result."""
        markdown = report_service.generate_markdown(mock_research_result)
        html = report_service.generate_html(
            markdown,
            title="Interactive Report",
            research_result=mock_research_result,
        )

        assert isinstance(html, str)
        assert "<html" in html
        assert len(html) > 1000  # Interactive HTML should be substantial

    def test_report_contains_findings(self, report_service, mock_research_result):
        """Test report includes all findings."""
        markdown = report_service.generate_markdown(mock_research_result, variant="full_report")

        # Check findings are included
        assert "market_trend" in markdown.lower() or "Market Trend" in markdown
        assert "$500B" in markdown or "500B" in markdown

    def test_report_contains_perspectives(self, report_service, mock_research_result):
        """Test report includes perspective analysis."""
        markdown = report_service.generate_markdown(mock_research_result, variant="full_report")

        # Check perspective is included
        assert "Perspective" in markdown or "perspective" in markdown
        assert "market fundamentals" in markdown.lower() or "Key Insights" in markdown

    def test_report_contains_sources(self, report_service, mock_research_result):
        """Test report includes sources."""
        markdown = report_service.generate_markdown(mock_research_result, variant="full_report")

        # Check sources section exists
        assert "Sources" in markdown
        assert "example.com" in markdown

    def test_export_to_format(self, report_service, mock_research_result):
        """Test export functionality."""
        result = report_service.export(
            mock_research_result,
            format="markdown",
            variant="full_report",
        )

        assert "content" in result
        assert "filename" in result
        assert "mime_type" in result
        assert result["mime_type"] == "text/markdown"


class TestActorOutputValidation:
    """Test ActorOutput schema validation."""

    def test_actor_output_structure(self):
        """Test ActorOutput can be constructed."""
        output = ActorOutput(
            session_id="test-123",
            query="Test query",
            template="investigative",
            status="completed",
        )

        assert output.session_id == "test-123"
        assert output.status == "completed"
        assert output.findings == []
        assert output.perspectives == []
        assert output.sources == []

    def test_actor_output_with_findings(self):
        """Test ActorOutput with findings."""
        finding = Finding(
            finding_id="f1",
            finding_type="fact",
            content="Test finding content",
            confidence_score=0.8,
        )

        output = ActorOutput(
            session_id="test-123",
            query="Test query",
            template="investigative",
            status="completed",
            findings=[finding],
        )

        assert len(output.findings) == 1
        assert output.findings[0].finding_type == "fact"

    def test_actor_output_with_report(self):
        """Test ActorOutput with report content."""
        output = ActorOutput(
            session_id="test-123",
            query="Test query",
            template="investigative",
            status="completed",
            report_markdown="# Test Report\n\nContent here.",
            report_html="<html><body>Test</body></html>",
        )

        assert output.report_markdown is not None
        assert output.report_html is not None


class TestE2EResearchToReportFlow:
    """End-to-end tests for the complete research-to-report flow."""

    @pytest.mark.asyncio
    async def test_complete_flow_standard(
        self,
        research_service,
        report_service,
        sample_actor_input,
    ):
        """Test complete standard research-to-report flow."""
        # Phase 1: Validate input
        actor_input = sample_actor_input
        assert actor_input.query is not None
        assert len(actor_input.query) > 0

        # Phase 2: Execute research
        research_result = await research_service.execute_research(
            query=actor_input.query,
            template_type=actor_input.template,
            granularity=actor_input.granularity,
            max_searches=4,
            save_to_db=False,
            use_cache=False,
        )

        # Verify research completed
        assert research_result["status"] in ["completed", "partial"]
        assert len(research_result["findings"]) > 0
        assert len(research_result["sources"]) > 0
        assert len(research_result["perspectives"]) > 0

        # Phase 3: Generate report
        markdown_report = report_service.generate_markdown(
            research_result,
            variant=actor_input.report_variant,
        )

        # Verify report generated
        assert isinstance(markdown_report, str)
        assert len(markdown_report) > 500

        # Phase 4: Generate HTML
        html_report = report_service.generate_html(
            markdown_report,
            title=actor_input.get_report_title(),
            research_result=research_result,
        )

        # Verify HTML generated
        assert "<html" in html_report

        # Phase 5: Construct ActorOutput
        actor_output = ActorOutput(
            session_id=research_result["session_id"],
            query=research_result["query"],
            template=research_result["template"],
            status=research_result["status"],
            findings=[
                Finding(
                    finding_id=f.get("finding_id", str(i)),
                    finding_type=f.get("finding_type", "fact"),
                    content=f.get("content", ""),
                    summary=f.get("summary"),
                    confidence_score=f.get("confidence_score", 0.5),
                    temporal_context=f.get("temporal_context", "present"),
                )
                for i, f in enumerate(research_result["findings"])
            ],
            perspectives=[
                Perspective(
                    perspective_type=p.get("perspective_type", "unknown"),
                    analysis_text=p.get("analysis_text", ""),
                    key_insights=p.get("key_insights", []),
                    recommendations=p.get("recommendations", []),
                    warnings=p.get("warnings", []),
                    confidence=p.get("confidence", 0.5),
                )
                for p in research_result["perspectives"]
            ],
            sources=[
                Source(
                    url=s.get("url", ""),
                    title=s.get("title", ""),
                    domain=s.get("domain", ""),
                    snippet=s.get("snippet", ""),
                    credibility_score=s.get("credibility_score"),
                )
                for s in research_result["sources"]
            ],
            search_queries_executed=research_result.get("search_queries_executed", []),
            report_markdown=markdown_report,
            report_html=html_report,
            cost_summary=CostSummary(**research_result.get("cost_summary", {})),
            execution_time_seconds=research_result.get("execution_time_seconds", 0),
            errors=research_result.get("errors", []),
            warnings=research_result.get("warnings", []),
        )

        # Verify ActorOutput
        assert actor_output.session_id is not None
        assert actor_output.status in ["completed", "partial"]
        assert len(actor_output.findings) > 0
        assert len(actor_output.sources) > 0
        assert actor_output.report_markdown is not None
        assert actor_output.report_html is not None

    @pytest.mark.asyncio
    async def test_complete_flow_quick(
        self,
        research_service,
        report_service,
        sample_actor_input_quick,
    ):
        """Test complete quick research-to-report flow."""
        actor_input = sample_actor_input_quick

        # Execute research
        research_result = await research_service.execute_research(
            query=actor_input.query,
            template_type=actor_input.template,
            granularity=actor_input.granularity,
            max_searches=actor_input.get_max_searches(),
            save_to_db=False,
            use_cache=False,
        )

        # Generate executive summary
        markdown_report = report_service.generate_markdown(
            research_result,
            variant="executive_summary",
        )

        # Verify quick flow produces results
        assert research_result["status"] in ["completed", "partial"]
        assert len(markdown_report) > 200

    @pytest.mark.asyncio
    async def test_complete_flow_financial_template(
        self,
        mock_gemini_client,
        report_service,
    ):
        """Test complete flow with financial template."""
        research_service = ResearchService(
            gemini_client=mock_gemini_client,
            supabase_client=None,
            ocr_service=None,
        )

        # Execute with financial template
        research_result = await research_service.execute_research(
            query="NVIDIA stock analysis Q4 2024",
            template_type="financial",
            granularity="quick",
            max_searches=3,
            save_to_db=False,
            use_cache=False,
        )

        # Generate report
        markdown_report = report_service.generate_markdown(
            research_result,
            variant="full_report",
        )

        # Verify
        assert research_result["template"] == "financial"
        assert len(markdown_report) > 500

    @pytest.mark.asyncio
    async def test_complete_flow_with_perspectives(
        self,
        research_service,
        report_service,
        sample_actor_input,
    ):
        """Test complete flow includes perspective analysis."""
        actor_input = sample_actor_input

        research_result = await research_service.execute_research(
            query=actor_input.query,
            template_type=actor_input.template,
            granularity="quick",
            max_searches=3,
            perspectives=["institutional_investor", "short_seller"],
            save_to_db=False,
            use_cache=False,
        )

        # Verify perspectives were run
        assert len(research_result["perspectives"]) >= 1

        # Verify perspective structure
        for p in research_result["perspectives"]:
            assert "perspective_type" in p
            assert "analysis_text" in p or "key_insights" in p

    @pytest.mark.asyncio
    async def test_complete_flow_error_handling(
        self,
        report_service,
    ):
        """Test flow handles errors gracefully."""
        # Create a minimal error result
        error_result = {
            "session_id": "error-test",
            "query": "Test query",
            "template": "investigative",
            "status": "failed",
            "findings": [],
            "perspectives": [],
            "sources": [],
            "search_queries_executed": [],
            "cost_summary": {"total_tokens": 0, "total_cost_usd": 0},
            "execution_time_seconds": 0.5,
            "errors": ["Test error occurred"],
            "warnings": [],
        }

        # Report should still generate for failed research
        markdown = report_service.generate_markdown(error_result)

        assert isinstance(markdown, str)
        assert len(markdown) > 0


class TestMockGeminiClient:
    """Test the mock Gemini client itself."""

    @pytest.mark.asyncio
    async def test_mock_research(self, mock_gemini_client):
        """Test mock research method."""
        response = await mock_gemini_client.research("Test query")

        assert response.text is not None
        assert len(response.sources) > 0
        assert response.token_usage is not None

    @pytest.mark.asyncio
    async def test_mock_generate_json_queries(self, mock_gemini_client):
        """Test mock JSON generation for queries."""
        result, response = await mock_gemini_client.generate_json(
            "Generate search queries for: AI trends"
        )

        assert isinstance(result, list)
        assert len(result) > 0

    @pytest.mark.asyncio
    async def test_mock_generate_json_findings(self, mock_gemini_client):
        """Test mock JSON generation for findings extraction."""
        result, response = await mock_gemini_client.generate_json(
            "Extract findings from the following content..."
        )

        assert isinstance(result, list)

    @pytest.mark.asyncio
    async def test_mock_generate_json_perspective(self, mock_gemini_client):
        """Test mock JSON generation for perspective analysis."""
        result, response = await mock_gemini_client.generate_json(
            "You are an institutional investor analyst..."
        )

        assert isinstance(result, dict)
        assert "analysis_text" in result or "key_insights" in result


# ============================================================================
# RUN TESTS
# ============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
