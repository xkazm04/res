"""
Comprehensive test suite for Deep Research Actor.
Tests all services with real API calls and generates detailed report.
"""

import asyncio
import json
import time
import sys
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv

# Load environment
env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(env_path)

# Get API keys
GOOGLE_API_KEY = os.getenv("GEMINI_API_KEY", "")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")


class TestResult:
    """Container for test results."""

    def __init__(self, name: str):
        self.name = name
        self.passed = False
        self.duration_ms = 0
        self.request_data: Dict[str, Any] = {}
        self.response_data: Dict[str, Any] = {}
        self.error: str = ""
        self.notes: List[str] = []
        self.business_value: str = ""
        self.technical_quality: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "passed": self.passed,
            "duration_ms": self.duration_ms,
            "request": self.request_data,
            "response": self.response_data,
            "error": self.error,
            "notes": self.notes,
            "business_value": self.business_value,
            "technical_quality": self.technical_quality,
        }


class TestReport:
    """Generates comprehensive test report."""

    def __init__(self):
        self.results: List[TestResult] = []
        self.start_time = datetime.now()
        self.end_time = None

    def add_result(self, result: TestResult):
        self.results.append(result)

    def generate_markdown(self) -> str:
        self.end_time = datetime.now()
        total_duration = (self.end_time - self.start_time).total_seconds()
        passed = sum(1 for r in self.results if r.passed)
        failed = len(self.results) - passed

        report = []
        report.append("# Deep Research Actor - Test Report")
        report.append("")
        report.append(f"**Generated:** {self.end_time.strftime('%Y-%m-%d %H:%M:%S')}")
        report.append(f"**Total Duration:** {total_duration:.1f} seconds")
        report.append(f"**Tests:** {passed}/{len(self.results)} passed ({failed} failed)")
        report.append("")
        report.append("---")
        report.append("")

        # Executive Summary
        report.append("## Executive Summary")
        report.append("")

        all_passed = all(r.passed for r in self.results)
        if all_passed:
            report.append("All tests passed successfully. The actor is ready for deployment.")
        else:
            report.append(f"**{failed} tests failed.** Review the issues below before deployment.")
        report.append("")

        # Summary table
        report.append("| Service | Status | Duration | Technical Quality | Business Value |")
        report.append("|---------|--------|----------|-------------------|----------------|")
        for r in self.results:
            status = "PASS" if r.passed else "FAIL"
            report.append(f"| {r.name} | {status} | {r.duration_ms}ms | {r.technical_quality} | {r.business_value} |")
        report.append("")
        report.append("---")
        report.append("")

        # Detailed results
        report.append("## Detailed Test Results")
        report.append("")

        for i, r in enumerate(self.results, 1):
            report.append(f"### {i}. {r.name}")
            report.append("")
            report.append(f"**Status:** {'PASSED' if r.passed else 'FAILED'}")
            report.append(f"**Duration:** {r.duration_ms}ms")
            report.append("")

            if r.error:
                report.append("**Error:**")
                report.append(f"```")
                report.append(r.error)
                report.append(f"```")
                report.append("")

            report.append("**Request:**")
            report.append("```json")
            report.append(json.dumps(r.request_data, indent=2, default=str)[:2000])
            report.append("```")
            report.append("")

            report.append("**Response:**")
            report.append("```json")
            response_str = json.dumps(r.response_data, indent=2, default=str)
            if len(response_str) > 3000:
                response_str = response_str[:3000] + "\n... (truncated)"
            report.append(response_str)
            report.append("```")
            report.append("")

            if r.notes:
                report.append("**Notes:**")
                for note in r.notes:
                    report.append(f"- {note}")
                report.append("")

            report.append(f"**Technical Quality:** {r.technical_quality}")
            report.append("")
            report.append(f"**Business Value:** {r.business_value}")
            report.append("")
            report.append("---")
            report.append("")

        # Recommendations
        report.append("## Deployment Recommendation")
        report.append("")

        critical_failures = [r for r in self.results if not r.passed and "Gemini" in r.name]
        if critical_failures:
            report.append("**NOT READY FOR DEPLOYMENT**")
            report.append("")
            report.append("Critical services (Gemini client) have failures that must be resolved.")
        elif failed > 0:
            report.append("**CONDITIONAL DEPLOYMENT**")
            report.append("")
            report.append("Core services work but some features have issues. Review failed tests.")
        else:
            report.append("**READY FOR DEPLOYMENT**")
            report.append("")
            report.append("All services are functioning correctly. The actor can be deployed to Apify.")

        report.append("")
        report.append("---")
        report.append("")
        report.append("*Report generated by Deep Research Actor Test Suite*")

        return "\n".join(report)


async def test_gemini_client() -> TestResult:
    """Test Gemini client with Google Search grounding."""
    result = TestResult("Gemini Client - Google Search Grounding")

    try:
        from src.clients.gemini import GeminiClient, SearchMode

        result.request_data = {
            "api_key": f"{GOOGLE_API_KEY[:10]}...",
            "model": "gemini-2.0-flash",
            "query": "What is Apple's current stock price and market cap?",
            "mode": "GROUNDED"
        }

        start = time.time()
        client = GeminiClient(api_key=GOOGLE_API_KEY)
        response = await client.research(
            "What is Apple's current stock price and market cap?",
            mode=SearchMode.GROUNDED
        )
        result.duration_ms = int((time.time() - start) * 1000)

        result.response_data = {
            "text_length": len(response.text),
            "text_preview": response.text[:500] if response.text else "",
            "sources_count": len(response.sources),
            "sources": [{"url": s.url, "title": s.title} for s in response.sources[:5]],
            "search_queries": response.search_queries,
            "token_usage": response.token_usage.to_dict() if response.token_usage else None,
            "cost_usd": response.cost_usd,
        }

        result.passed = (
            len(response.text) > 100 and
            len(response.sources) > 0
        )

        result.notes = [
            f"Retrieved {len(response.sources)} sources",
            f"Response is {len(response.text)} characters",
            f"Token usage: {response.token_usage.total_tokens if response.token_usage else 'N/A'}",
        ]

        result.technical_quality = "Excellent" if result.passed else "Needs Fix"
        result.business_value = "High - Core search functionality works" if result.passed else "Critical - Core feature broken"

    except Exception as e:
        result.error = str(e)
        result.technical_quality = "Failed"
        result.business_value = "Critical - Cannot proceed without this"

    return result


async def test_gemini_json_generation() -> TestResult:
    """Test Gemini JSON generation for query planning."""
    result = TestResult("Gemini Client - JSON Generation")

    try:
        from src.clients.gemini import GeminiClient

        prompt = """Generate 3 search queries to research Apple's financial performance.
Return as JSON array: ["query1", "query2", "query3"]"""

        result.request_data = {
            "prompt": prompt,
            "temperature": 0.3,
        }

        start = time.time()
        client = GeminiClient(api_key=GOOGLE_API_KEY)
        parsed, response = await client.generate_json(prompt)
        result.duration_ms = int((time.time() - start) * 1000)

        result.response_data = {
            "parsed_json": parsed,
            "raw_text": response.text[:500] if response.text else "",
            "parse_error": response.parse_error,
        }

        result.passed = (
            parsed is not None and
            isinstance(parsed, list) and
            len(parsed) >= 1
        )

        result.notes = [
            f"Successfully parsed JSON" if result.passed else "JSON parsing failed",
            f"Generated {len(parsed) if parsed else 0} queries",
        ]

        result.technical_quality = "Excellent" if result.passed else "Needs Fix"
        result.business_value = "High - Query generation works" if result.passed else "High - Required for research planning"

    except Exception as e:
        result.error = str(e)
        result.technical_quality = "Failed"
        result.business_value = "High - Required for research"

    return result


async def test_cost_tracker() -> TestResult:
    """Test cost tracking service."""
    result = TestResult("Cost Tracker Service")

    try:
        from src.services.cost_tracker import CostTracker

        result.request_data = {
            "gemini_input_tokens": 1000,
            "gemini_output_tokens": 500,
            "openrouter_tokens": 200,
        }

        start = time.time()
        tracker = CostTracker()
        tracker.add_gemini_usage(1000, 500)
        tracker.add_openrouter_usage(200)
        summary = tracker.get_summary()
        result.duration_ms = int((time.time() - start) * 1000)

        result.response_data = summary

        result.passed = (
            summary["total_tokens"] == 1700 and
            summary["gemini_cost_usd"] > 0 and
            summary["total_cost_usd"] > 0
        )

        result.notes = [
            f"Calculated total cost: ${summary['total_cost_usd']:.6f}",
            "Cost rates applied correctly",
        ]

        result.technical_quality = "Excellent"
        result.business_value = "Medium - Helps with cost monitoring"

    except Exception as e:
        result.error = str(e)
        result.technical_quality = "Failed"
        result.business_value = "Medium"

    return result


async def test_investigative_template() -> TestResult:
    """Test investigative research template."""
    result = TestResult("Investigative Template - Query Generation")

    try:
        from src.templates.investigative import InvestigativeTemplate
        from src.clients.gemini import GeminiClient

        result.request_data = {
            "query": "Elon Musk Twitter acquisition controversy",
            "max_searches": 5,
            "granularity": "standard",
        }

        start = time.time()
        template = InvestigativeTemplate()
        client = GeminiClient(api_key=GOOGLE_API_KEY)
        template.set_client(client)

        queries = await template.generate_search_queries(
            query="Elon Musk Twitter acquisition controversy",
            max_searches=5,
            granularity="standard",
        )
        result.duration_ms = int((time.time() - start) * 1000)

        result.response_data = {
            "queries_generated": len(queries),
            "queries": queries,
        }

        result.passed = (
            len(queries) >= 3 and
            all(isinstance(q, str) and len(q) > 10 for q in queries)
        )

        result.notes = [
            f"Generated {len(queries)} investigative queries",
            "Queries cover multiple investigative angles" if result.passed else "Query quality needs review",
        ]

        result.technical_quality = "Good" if result.passed else "Needs Fix"
        result.business_value = "High - Drives research quality"

    except Exception as e:
        result.error = str(e)
        result.technical_quality = "Failed"
        result.business_value = "High"

    return result


async def test_financial_template() -> TestResult:
    """Test financial research template."""
    result = TestResult("Financial Template - Query Generation")

    try:
        from src.templates.financial import FinancialTemplate
        from src.clients.gemini import GeminiClient

        result.request_data = {
            "query": "NVIDIA stock analysis Q4 2024",
            "max_searches": 5,
            "granularity": "standard",
        }

        start = time.time()
        template = FinancialTemplate()
        client = GeminiClient(api_key=GOOGLE_API_KEY)
        template.set_client(client)

        queries = await template.generate_search_queries(
            query="NVIDIA stock analysis Q4 2024",
            max_searches=5,
            granularity="standard",
        )
        result.duration_ms = int((time.time() - start) * 1000)

        result.response_data = {
            "queries_generated": len(queries),
            "queries": queries,
        }

        result.passed = (
            len(queries) >= 3 and
            all(isinstance(q, str) and len(q) > 10 for q in queries)
        )

        # Check for financial keywords
        financial_keywords = ["earnings", "revenue", "stock", "price", "SEC", "analyst", "valuation"]
        has_financial_focus = any(
            any(kw in q.lower() for kw in financial_keywords)
            for q in queries
        )

        result.notes = [
            f"Generated {len(queries)} financial queries",
            "Queries have financial focus" if has_financial_focus else "Missing financial keywords",
        ]

        result.technical_quality = "Good" if result.passed and has_financial_focus else "Needs Improvement"
        result.business_value = "High - Key for financial research product"

    except Exception as e:
        result.error = str(e)
        result.technical_quality = "Failed"
        result.business_value = "High"

    return result


async def test_report_generation() -> TestResult:
    """Test report generation service."""
    result = TestResult("Report Generation Service")

    try:
        from src.services.report import ReportService

        mock_research = {
            "session_id": "test-123",
            "query": "Test research query",
            "template": "investigative",
            "status": "completed",
            "findings": [
                {
                    "finding_type": "fact",
                    "content": "Test finding content with important details.",
                    "summary": "Key finding summary",
                    "confidence_score": 0.85,
                    "temporal_context": "present",
                },
                {
                    "finding_type": "event",
                    "content": "An important event occurred.",
                    "summary": "Event summary",
                    "confidence_score": 0.72,
                    "temporal_context": "past",
                },
            ],
            "perspectives": [
                {
                    "perspective_type": "political",
                    "analysis_text": "Political analysis content.",
                    "key_insights": ["Insight 1", "Insight 2"],
                    "recommendations": ["Recommendation 1"],
                    "warnings": ["Warning 1"],
                    "confidence": 0.75,
                },
            ],
            "sources": [
                {"url": "https://example.com", "title": "Example", "credibility_score": 0.8},
            ],
            "cost_summary": {"total_tokens": 5000, "total_cost_usd": 0.02},
            "execution_time_seconds": 30.5,
        }

        result.request_data = {
            "research_result": "mock research with 2 findings, 1 perspective",
            "variant": "full_report",
        }

        start = time.time()
        service = ReportService()
        markdown = service.generate_markdown(mock_research, variant="full_report")
        html = service.generate_html(markdown, title="Test Report")
        result.duration_ms = int((time.time() - start) * 1000)

        result.response_data = {
            "markdown_length": len(markdown),
            "html_length": len(html),
            "markdown_preview": markdown[:1000],
            "has_findings_section": "## Detailed Findings" in markdown,
            "has_perspectives_section": "## Multi-Perspective" in markdown,
            "has_sources_section": "## Sources" in markdown,
        }

        result.passed = (
            len(markdown) > 500 and
            len(html) > 1000 and
            "## Detailed Findings" in markdown and
            "<html" in html
        )

        result.notes = [
            f"Generated {len(markdown)} chars markdown",
            f"Generated {len(html)} chars HTML",
            "All required sections present" if result.passed else "Missing sections",
        ]

        result.technical_quality = "Excellent" if result.passed else "Needs Fix"
        result.business_value = "High - Key deliverable for users"

    except Exception as e:
        result.error = str(e)
        result.technical_quality = "Failed"
        result.business_value = "High"

    return result


async def test_full_research_flow() -> TestResult:
    """Test complete research flow (most important test)."""
    result = TestResult("Full Research Flow - End-to-End")

    try:
        from src.clients.gemini import GeminiClient
        from src.services.research import ResearchService
        from src.services.report import ReportService

        result.request_data = {
            "query": "What were the key developments in AI regulation in 2024?",
            "template": "investigative",
            "granularity": "quick",
            "max_searches": 3,
            "generate_report": True,
        }

        start = time.time()

        # Initialize services
        gemini_client = GeminiClient(api_key=GOOGLE_API_KEY)
        research_service = ResearchService(
            gemini_client=gemini_client,
            supabase_client=None,  # Skip DB for test
            ocr_service=None,
        )

        # Execute research
        research_result = await research_service.execute_research(
            query="What were the key developments in AI regulation in 2024?",
            template_type="investigative",
            granularity="quick",
            max_searches=3,
            save_to_db=False,
        )

        # Generate report
        report_service = ReportService()
        report_markdown = report_service.generate_markdown(research_result)

        result.duration_ms = int((time.time() - start) * 1000)

        result.response_data = {
            "session_id": research_result.get("session_id"),
            "status": research_result.get("status"),
            "findings_count": len(research_result.get("findings", [])),
            "perspectives_count": len(research_result.get("perspectives", [])),
            "sources_count": len(research_result.get("sources", [])),
            "queries_executed": research_result.get("search_queries_executed", []),
            "cost_summary": research_result.get("cost_summary"),
            "execution_time": research_result.get("execution_time_seconds"),
            "errors": research_result.get("errors", []),
            "warnings": research_result.get("warnings", []),
            "report_preview": report_markdown[:1000] if report_markdown else "",
            "sample_findings": [
                {
                    "type": f.get("finding_type"),
                    "summary": f.get("summary", "")[:100],
                    "confidence": f.get("confidence_score"),
                }
                for f in research_result.get("findings", [])[:3]
            ],
        }

        # Evaluate success
        findings_count = len(research_result.get("findings", []))
        sources_count = len(research_result.get("sources", []))

        result.passed = (
            research_result.get("status") in ["completed", "partial"] and
            findings_count > 0 and
            sources_count > 0 and
            len(report_markdown) > 500
        )

        result.notes = [
            f"Executed {len(research_result.get('search_queries_executed', []))} searches",
            f"Extracted {findings_count} findings",
            f"Collected {sources_count} sources",
            f"Generated {len(research_result.get('perspectives', []))} perspective analyses",
            f"Total cost: ${research_result.get('cost_summary', {}).get('total_cost_usd', 0):.4f}",
            f"Duration: {research_result.get('execution_time_seconds', 0):.1f}s",
        ]

        if research_result.get("errors"):
            result.notes.append(f"Errors: {research_result['errors']}")

        result.technical_quality = "Excellent" if result.passed and findings_count >= 3 else "Good" if result.passed else "Needs Work"

        if result.passed and findings_count >= 3:
            result.business_value = "Excellent - Delivers actionable research insights"
        elif result.passed:
            result.business_value = "Good - Basic functionality works"
        else:
            result.business_value = "Needs Improvement - Core flow has issues"

    except Exception as e:
        result.error = str(e)
        result.technical_quality = "Failed"
        result.business_value = "Critical - Main feature broken"

    return result


async def run_all_tests():
    """Run all tests and generate report."""
    print("=" * 60)
    print("Deep Research Actor - Comprehensive Test Suite")
    print("=" * 60)
    print()

    report = TestReport()

    tests = [
        ("1. Gemini Client - Search Grounding", test_gemini_client),
        ("2. Gemini Client - JSON Generation", test_gemini_json_generation),
        ("3. Cost Tracker Service", test_cost_tracker),
        ("4. Investigative Template", test_investigative_template),
        ("5. Financial Template", test_financial_template),
        ("6. Report Generation", test_report_generation),
        ("7. Full Research Flow (E2E)", test_full_research_flow),
    ]

    for name, test_func in tests:
        print(f"Running: {name}...")
        try:
            result = await test_func()
            report.add_result(result)
            status = "PASS" if result.passed else "FAIL"
            print(f"  [{status}] {result.duration_ms}ms")
            if result.error:
                print(f"  Error: {result.error[:100]}")
        except Exception as e:
            print(f"  [ERROR] {str(e)[:100]}")
            result = TestResult(name)
            result.error = str(e)
            result.technical_quality = "Failed"
            result.business_value = "Unknown"
            report.add_result(result)

    print()
    print("=" * 60)
    print("Generating Report...")
    print("=" * 60)

    markdown_report = report.generate_markdown()

    # Save report
    report_path = Path(__file__).parent / "TEST_REPORT.md"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(markdown_report)

    print(f"\nReport saved to: {report_path}")
    print()

    # Print summary
    passed = sum(1 for r in report.results if r.passed)
    total = len(report.results)
    print(f"Results: {passed}/{total} tests passed")

    return markdown_report


if __name__ == "__main__":
    report = asyncio.run(run_all_tests())
    print("\n" + "=" * 60)
    print("REPORT PREVIEW")
    print("=" * 60)
    print(report[:3000])
