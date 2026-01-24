"""Tech market research template for 2025 developments and 2026 predictions."""

from typing import List, Dict, Any

from .base import BaseTemplate


class TechMarketTemplate(BaseTemplate):
    """Template for technology market analysis and trend research."""

    template_id = "tech_market"
    template_name = "Tech Market Analysis"
    description = "Technology market trends, 2025 developments, and 2026 predictions"

    # Expert perspectives: 4 VC/Startup + 4 Developer Community
    default_perspectives = [
        # VC & Startup focused
        "venture_capitalist",
        "startup_founder",
        "product_manager",
        "developer_advocate",
        # Developer Community
        "open_source_maintainer",
        "devrel_engineer",
        "senior_engineer",
        "platform_engineer",
    ]

    default_max_searches = 12

    # Tech market is MOST prone to hype, vendor marketing, and inflated claims
    # Adoption rates vary wildly by definition, predictions are often wrong
    # Needs maximum verification to separate signal from noise
    verification_config = {
        "cross_reference": "thorough",      # Adoption numbers vary wildly
        "bias_detection": "thorough",       # Vendor marketing everywhere
        "expert_sanity_check": "thorough",  # Flag hype and unrealistic claims
        "source_quality": "thorough",       # Distinguish surveys from blogs
    }

    async def generate_search_queries(
        self,
        query: str,
        max_searches: int,
        granularity: str = "standard",
    ) -> List[str]:
        """Generate tech market research queries with 2025/2026 focus."""
        prompt = f"""
You are a technology market analyst planning comprehensive research on developer tools,
infrastructure, and enterprise technology trends.

Research Topic: {query}

Depth Level: {granularity}

Generate search queries covering these technology domains:

1. SOFTWARE DEVELOPMENT ECOSYSTEM
   - Programming languages: adoption trends, new releases, performance comparisons
   - Frameworks: frontend (React, Vue, Svelte, Next.js), backend (Node, Go, Rust, Python)
   - IDEs and development tools: VS Code extensions, JetBrains, AI coding assistants
   - Testing: test frameworks, quality engineering, shift-left practices
   - Developer productivity: pair programming, code review tools, documentation

2. AI/ML AND FULL STACK INFRASTRUCTURE
   - LLM platforms: OpenAI, Anthropic, Google, open-source models (Llama, Mistral)
   - AI coding assistants: GitHub Copilot, Cursor, Codeium, Tabnine adoption
   - MLOps tools: model training, deployment, monitoring, vector databases
   - Cloud platforms: AWS, Azure, GCP innovations, multi-cloud strategies
   - Edge AI and on-device inference trends

3. DEVOPS AND PLATFORM ENGINEERING
   - Platform engineering: internal developer platforms, golden paths
   - GitOps and infrastructure as code: Terraform, Pulumi, Crossplane
   - Containers and orchestration: Kubernetes ecosystem, service mesh
   - CI/CD innovations: GitHub Actions, GitLab CI, Dagger
   - Observability: OpenTelemetry, distributed tracing, AIOps

4. ENTERPRISE TECH STACK
   - Security: DevSecOps, zero-trust, SAST/DAST, supply chain security
   - Databases: NewSQL, time-series, graph databases, serverless databases
   - APIs: GraphQL adoption, API gateways, API-first development
   - Data engineering: data mesh, lakehouse, real-time analytics
   - Microservices: event-driven architecture, distributed systems

5. MARKET DYNAMICS
   - Funding rounds and valuations for developer tools companies
   - M&A activity and consolidation trends
   - Developer survey results (Stack Overflow, JetBrains, GitHub)
   - Enterprise adoption case studies and ROI analysis
   - Open source project health and governance

6. TEMPORAL FOCUS (CRITICAL)
   - Include "2025" in searches for current developments
   - Include "2026 predictions" or "roadmap 2026" for future trends
   - Search for "State of X 2025" reports where relevant
   - Include analyst predictions and market forecasts

For a "{granularity}" depth level:
- "quick": 4-5 searches on key emerging tech and major trends
- "standard": 8-10 searches covering all domains with market dynamics
- "deep": 12+ searches with comprehensive coverage including funding, predictions, and niche areas

Return a JSON array of exactly {max_searches} search query strings, ordered by importance.
Example: ["AI coding assistants market 2025 adoption GitHub Copilot", "developer tools VC funding 2025", ...]
"""

        result = await self._call_gemini_json(prompt)

        if isinstance(result, list):
            return result[:max_searches]
        return []

    async def extract_findings(
        self,
        query: str,
        sources: List[Dict[str, Any]],
        synthesized_content: str,
        granularity: str = "standard",
    ) -> List[Dict[str, Any]]:
        """Extract tech market findings with prediction support."""
        # Build source context
        source_context = "\n\n".join([
            f"Source: {s.get('title', 'Unknown')} ({s.get('url', '')})\n"
            f"Credibility: {s.get('credibility_score', 'Unknown')}\n"
            f"Domain: {s.get('domain', '')}"
            for s in sources[:20]
        ])

        prompt = f"""
You are a technology market analyst extracting key findings for developer tools and
infrastructure research. Focus on 2025 current state and 2026 predictions.

Research Topic: {query}

Synthesized Research Content:
{synthesized_content[:15000]}

Sources Referenced:
{source_context}

Extract findings in these tech market categories:

1. PRODUCT LAUNCHES (finding_type: "product_launch")
   - New products, features, versions released in 2025
   - Include in extracted_data: product_name, company, launch_date, category, key_features
   - Note: GA releases, betas, and major version upgrades

2. FUNDING ROUNDS (finding_type: "funding_round")
   - VC investments, growth rounds in developer tools space
   - Include in extracted_data: company, amount, round_type (seed/A/B/C/growth), investors, valuation, date
   - Note: strategic implications and market signals

3. ADOPTION TRENDS (finding_type: "adoption_trend")
   - Technology adoption patterns and growth in 2025
   - Include in extracted_data: technology, adoption_rate (%), growth_percentage, timeframe, segment
   - Note: enterprise vs. startup adoption differences

4. MARKET METRICS (finding_type: "market_metric")
   - Market size, growth rates, share data
   - Include in extracted_data: metric_name, value, period, source, methodology
   - Note: TAM/SAM/SOM and growth projections

5. ACQUISITIONS (finding_type: "acquisition")
   - M&A activity in developer tools and infrastructure
   - Include in extracted_data: acquirer, target, amount, date, strategic_rationale
   - Note: consolidation trends and implications

6. PREDICTIONS (finding_type: "prediction") - CRITICAL FOR 2026
   - Future trend forecasts, roadmaps, analyst predictions
   - Include in extracted_data:
     * "prediction": clear statement of what is predicted
     * "timeframe": "2025" or "2026" or specific quarter (Q1/Q2/Q3/Q4)
     * "confidence": 0.0-1.0 based on source credibility
     * "source_type": "analyst_report" | "industry_survey" | "expert_opinion" | "company_roadmap"
     * "prediction_basis": array of supporting evidence points
     * "risk_factors": array of what could invalidate the prediction
   - This is CRITICAL - extract ALL forward-looking statements about 2026

7. DEVELOPER SENTIMENT (finding_type: "developer_sentiment")
   - Survey results, community feedback, satisfaction scores
   - Include in extracted_data: topic, sentiment (positive/neutral/negative), sample_size, source, key_findings
   - Note: Stack Overflow, JetBrains, GitHub surveys

8. OPEN SOURCE EVENTS (finding_type: "open_source_event")
   - Major releases, governance changes, community events
   - Include in extracted_data: project, event_type, date, impact, maintainers
   - Note: licensing changes, foundation moves, fork events

9. ENTERPRISE ADOPTION (finding_type: "enterprise_adoption")
   - Enterprise case studies and adoption patterns
   - Include in extracted_data: company, technology, use_case, scale, outcome
   - Note: ROI claims and implementation challenges

10. GAPS (finding_type: "gap")
    - Missing research areas needed for complete analysis
    - Include in extracted_data: topic, importance (high/medium/low), suggested_research
    - Note: what data would strengthen predictions

For each finding, return:
- finding_type: One of the types above
- content: Detailed finding with specific facts, numbers, dates
- summary: One sentence summary
- confidence_score: 0.0-1.0 (based on source quality and recency)
- temporal_context: 'past', 'present', 'ongoing', or 'predicted' (use 'predicted' for 2026 forecasts)
- event_date: ISO date if applicable (YYYY-MM-DD)
- extracted_data: JSON object with structured data specific to finding type

For "{granularity}" depth:
- quick: 8-10 findings focusing on major trends
- standard: 15-20 findings with balanced coverage
- deep: 25-30 comprehensive findings including niche areas

Return as JSON array. Prioritize extracting ALL predictions with temporal_context: 'predicted'.
"""

        result = await self._call_gemini_json(prompt)

        findings = []
        if isinstance(result, list):
            for f in result:
                if isinstance(f, dict):
                    findings.append({
                        "finding_type": f.get("finding_type", "fact"),
                        "content": f.get("content", ""),
                        "summary": f.get("summary"),
                        "confidence_score": f.get("confidence_score", 0.5),
                        "temporal_context": f.get("temporal_context", "present"),
                        "event_date": f.get("event_date"),
                        "extracted_data": f.get("extracted_data"),
                    })

        return findings
