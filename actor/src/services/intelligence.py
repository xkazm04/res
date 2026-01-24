"""Intelligence analysis service for enhanced insights.

Provides:
- Contradiction detection across findings
- Knowledge gaps analysis ("What We Don't Know")
- Role-specific executive summaries (CTO, CFO, CEO views)
"""

import logging
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, asdict

logger = logging.getLogger(__name__)


@dataclass
class Contradiction:
    """A detected contradiction between findings."""
    finding_a_id: str
    finding_a_summary: str
    finding_b_id: str
    finding_b_summary: str
    contradiction_type: str  # factual, temporal, quantitative, interpretive
    description: str
    severity: str  # high, medium, low
    resolution_hint: str


@dataclass
class KnowledgeGap:
    """A gap in the research that affects conclusions."""
    gap_id: str
    topic: str
    description: str
    importance: str  # critical, important, nice_to_have
    impact_on_conclusions: str
    suggested_query: str
    related_findings: List[str]


@dataclass
class RoleSummary:
    """Role-specific summary for a stakeholder type."""
    role: str  # cto, cfo, ceo, legal, product
    role_title: str
    headline: str
    key_points: List[str]
    action_items: List[str]
    risks_to_watch: List[str]
    metrics_of_interest: List[Dict[str, Any]]
    confidence_level: str  # high, medium, low


class IntelligenceAnalyzer:
    """Analyzes findings for deeper insights."""

    def __init__(self, gemini_client=None):
        self.gemini_client = gemini_client

    async def analyze(
        self,
        findings: List[Dict[str, Any]],
        perspectives: List[Dict[str, Any]],
        sources: List[Dict[str, Any]],
        query: str,
        template: str,
    ) -> Dict[str, Any]:
        """
        Run full intelligence analysis on research results.

        Returns:
            Dict with 'contradictions', 'knowledge_gaps', 'role_summaries'
        """
        results = {
            "contradictions": [],
            "knowledge_gaps": [],
            "role_summaries": {},
        }

        # Run analyses
        try:
            contradictions = await self.detect_contradictions(findings)
            results["contradictions"] = [asdict(c) for c in contradictions]
        except Exception as e:
            logger.warning(f"Contradiction detection failed: {e}")

        try:
            gaps = await self.identify_knowledge_gaps(findings, perspectives, query, template)
            results["knowledge_gaps"] = [asdict(g) for g in gaps]
        except Exception as e:
            logger.warning(f"Knowledge gap analysis failed: {e}")

        try:
            summaries = await self.generate_role_summaries(findings, perspectives, query, template)
            results["role_summaries"] = {s.role: asdict(s) for s in summaries}
        except Exception as e:
            logger.warning(f"Role summary generation failed: {e}")

        return results

    async def detect_contradictions(
        self,
        findings: List[Dict[str, Any]],
    ) -> List[Contradiction]:
        """
        Detect contradictions between findings.

        Looks for:
        - Conflicting facts (A says X, B says not-X)
        - Quantitative disagreements (A says 40%, B says 77%)
        - Temporal inconsistencies (A says happened in 2024, B says 2023)
        - Interpretive conflicts (A says bullish, B says bearish on same data)
        """
        if len(findings) < 2:
            return []

        contradictions = []

        # Group findings by topic for efficient comparison
        # Compare findings pairwise for contradictions
        for i, finding_a in enumerate(findings):
            for j, finding_b in enumerate(findings[i + 1:], i + 1):
                contradiction = self._check_contradiction(finding_a, finding_b)
                if contradiction:
                    contradictions.append(contradiction)

        return contradictions

    def _check_contradiction(
        self,
        finding_a: Dict[str, Any],
        finding_b: Dict[str, Any],
    ) -> Optional[Contradiction]:
        """Check if two findings contradict each other."""
        # Extract content and data
        content_a = finding_a.get("content", "").lower()
        content_b = finding_b.get("content", "").lower()
        data_a = finding_a.get("extracted_data", {}) or {}
        data_b = finding_b.get("extracted_data", {}) or {}

        id_a = finding_a.get("finding_id", "f?")
        id_b = finding_b.get("finding_id", "f?")
        summary_a = finding_a.get("summary", content_a[:100])
        summary_b = finding_b.get("summary", content_b[:100])

        # Check for quantitative contradictions
        quant_contradiction = self._check_quantitative_contradiction(data_a, data_b, finding_a, finding_b)
        if quant_contradiction:
            return Contradiction(
                finding_a_id=id_a,
                finding_a_summary=summary_a,
                finding_b_id=id_b,
                finding_b_summary=summary_b,
                contradiction_type="quantitative",
                description=quant_contradiction[0],
                severity=quant_contradiction[1],
                resolution_hint=quant_contradiction[2],
            )

        # Check for temporal contradictions
        temporal_contradiction = self._check_temporal_contradiction(finding_a, finding_b)
        if temporal_contradiction:
            return Contradiction(
                finding_a_id=id_a,
                finding_a_summary=summary_a,
                finding_b_id=id_b,
                finding_b_summary=summary_b,
                contradiction_type="temporal",
                description=temporal_contradiction[0],
                severity=temporal_contradiction[1],
                resolution_hint=temporal_contradiction[2],
            )

        # Check for semantic contradictions (opposing sentiment on same topic)
        semantic_contradiction = self._check_semantic_contradiction(content_a, content_b, data_a, data_b)
        if semantic_contradiction:
            return Contradiction(
                finding_a_id=id_a,
                finding_a_summary=summary_a,
                finding_b_id=id_b,
                finding_b_summary=summary_b,
                contradiction_type="interpretive",
                description=semantic_contradiction[0],
                severity=semantic_contradiction[1],
                resolution_hint=semantic_contradiction[2],
            )

        return None

    def _check_quantitative_contradiction(
        self,
        data_a: Dict,
        data_b: Dict,
        finding_a: Dict,
        finding_b: Dict,
    ) -> Optional[Tuple[str, str, str]]:
        """Check for conflicting numbers about the same metric."""
        # Common metrics to check
        metric_keys = [
            "adoption_rate", "growth_percentage", "market_share",
            "revenue", "subscribers", "users", "amount", "value",
            "growth", "rate", "percentage"
        ]

        for key in metric_keys:
            val_a = data_a.get(key)
            val_b = data_b.get(key)

            if val_a and val_b:
                # Extract numeric values
                num_a = self._extract_number(str(val_a))
                num_b = self._extract_number(str(val_b))

                if num_a is not None and num_b is not None:
                    # Check if they're about the same entity
                    entity_a = data_a.get("technology") or data_a.get("company") or data_a.get("product")
                    entity_b = data_b.get("technology") or data_b.get("company") or data_b.get("product")

                    if entity_a and entity_b and entity_a.lower() == entity_b.lower():
                        # Calculate difference
                        diff = abs(num_a - num_b)
                        avg = (num_a + num_b) / 2 if (num_a + num_b) > 0 else 1
                        pct_diff = (diff / avg) * 100

                        if pct_diff > 30:  # Significant difference
                            severity = "high" if pct_diff > 50 else "medium"
                            return (
                                f"Conflicting {key} for {entity_a}: {val_a} vs {val_b} ({pct_diff:.0f}% difference)",
                                severity,
                                f"Check source dates and methodologies. The difference may be due to different time periods or measurement criteria."
                            )

        return None

    def _check_temporal_contradiction(
        self,
        finding_a: Dict,
        finding_b: Dict,
    ) -> Optional[Tuple[str, str, str]]:
        """Check for conflicting dates about the same event."""
        date_a = finding_a.get("date_referenced") or finding_a.get("event_date")
        date_b = finding_b.get("date_referenced") or finding_b.get("event_date")

        if not date_a or not date_b:
            return None

        # Check if findings are about the same event/topic
        type_a = finding_a.get("finding_type", "")
        type_b = finding_b.get("finding_type", "")

        data_a = finding_a.get("extracted_data", {}) or {}
        data_b = finding_b.get("extracted_data", {}) or {}

        # Same type and same entity suggests same topic
        if type_a == type_b:
            entity_a = data_a.get("company") or data_a.get("technology") or data_a.get("product")
            entity_b = data_b.get("company") or data_b.get("technology") or data_b.get("product")

            if entity_a and entity_b and entity_a.lower() == entity_b.lower():
                if date_a != date_b:
                    return (
                        f"Conflicting dates for {entity_a}: {date_a} vs {date_b}",
                        "medium",
                        f"The sources may be referring to different events or updates. Check context."
                    )

        return None

    def _check_semantic_contradiction(
        self,
        content_a: str,
        content_b: str,
        data_a: Dict,
        data_b: Dict,
    ) -> Optional[Tuple[str, str, str]]:
        """Check for opposing interpretations of the same topic."""
        # Look for opposing sentiment indicators
        bullish_terms = ["growth", "surge", "boom", "accelerat", "outperform", "strong", "positive", "bullish"]
        bearish_terms = ["decline", "drop", "fall", "slow", "underperform", "weak", "negative", "bearish"]

        # Check if about same topic
        entity_a = data_a.get("technology") or data_a.get("company") or ""
        entity_b = data_b.get("technology") or data_b.get("company") or ""

        if entity_a and entity_b and entity_a.lower() == entity_b.lower():
            has_bullish_a = any(term in content_a for term in bullish_terms)
            has_bearish_a = any(term in content_a for term in bearish_terms)
            has_bullish_b = any(term in content_b for term in bullish_terms)
            has_bearish_b = any(term in content_b for term in bearish_terms)

            # Check for opposing sentiment
            if (has_bullish_a and has_bearish_b) or (has_bearish_a and has_bullish_b):
                return (
                    f"Conflicting assessments of {entity_a}: one source is optimistic, another pessimistic",
                    "medium",
                    f"Consider both perspectives. The truth may depend on timeframe, market segment, or use case."
                )

        return None

    def _extract_number(self, text: str) -> Optional[float]:
        """Extract a number from text like '77%' or '$1.8M' or '1,000'."""
        import re

        # Remove common formatting
        text = text.replace(",", "").replace("$", "").replace("%", "")

        # Handle M/B/K suffixes
        multipliers = {"m": 1_000_000, "b": 1_000_000_000, "k": 1_000}
        for suffix, mult in multipliers.items():
            if text.lower().endswith(suffix):
                text = text[:-1]
                try:
                    return float(text) * mult
                except ValueError:
                    pass

        # Try direct parse
        match = re.search(r'[\d.]+', text)
        if match:
            try:
                return float(match.group())
            except ValueError:
                pass

        return None

    async def identify_knowledge_gaps(
        self,
        findings: List[Dict[str, Any]],
        perspectives: List[Dict[str, Any]],
        query: str,
        template: str,
    ) -> List[KnowledgeGap]:
        """
        Identify what we don't know that would affect conclusions.

        Analyzes:
        - Low-confidence findings that need more data
        - Topics mentioned but not fully explored
        - Missing data for key decisions
        - Unanswered questions from perspectives
        """
        gaps = []
        gap_id = 1

        # 1. Find low-confidence findings with high importance
        for finding in findings:
            confidence = finding.get("adjusted_confidence") or finding.get("confidence_score", 0.5)
            finding_type = finding.get("finding_type", "")

            # Important types that need high confidence
            critical_types = ["prediction", "risk_factor", "red_flag", "earnings_metric", "valuation_signal"]

            if confidence < 0.6 and finding_type in critical_types:
                summary = finding.get("summary", "")[:100]
                gaps.append(KnowledgeGap(
                    gap_id=f"g{gap_id}",
                    topic=f"Uncertain: {finding_type.replace('_', ' ').title()}",
                    description=f"Low confidence ({confidence:.0%}) on critical finding: {summary}",
                    importance="important" if finding_type in ["prediction", "earnings_metric"] else "critical",
                    impact_on_conclusions="This uncertainty directly affects key conclusions and recommendations",
                    suggested_query=f"Additional sources for: {summary}",
                    related_findings=[finding.get("finding_id", "")],
                ))
                gap_id += 1

        # 2. Identify gaps from perspective warnings
        for perspective in perspectives:
            warnings = perspective.get("warnings", [])
            perspective_type = perspective.get("perspective_type", "")

            for warning in warnings:
                if any(term in warning.lower() for term in ["unknown", "unclear", "missing", "need more", "no data"]):
                    gaps.append(KnowledgeGap(
                        gap_id=f"g{gap_id}",
                        topic=f"Expert Concern: {perspective_type.replace('_', ' ').title()}",
                        description=warning,
                        importance="important",
                        impact_on_conclusions=f"The {perspective_type.replace('_', ' ')} perspective flagged this uncertainty",
                        suggested_query=f"Research to address: {warning[:80]}",
                        related_findings=[],
                    ))
                    gap_id += 1

        # 3. Template-specific gap detection
        template_gaps = self._get_template_specific_gaps(findings, template, query)
        for gap_info in template_gaps:
            gaps.append(KnowledgeGap(
                gap_id=f"g{gap_id}",
                **gap_info
            ))
            gap_id += 1

        # 4. Check for missing finding types
        if template == "financial":
            expected_types = {"earnings_metric", "valuation_signal", "risk_factor", "guidance"}
            found_types = {f.get("finding_type") for f in findings}
            missing = expected_types - found_types

            if missing:
                gaps.append(KnowledgeGap(
                    gap_id=f"g{gap_id}",
                    topic="Missing Financial Data",
                    description=f"No findings for: {', '.join(t.replace('_', ' ') for t in missing)}",
                    importance="critical",
                    impact_on_conclusions="Investment analysis requires these data points for completeness",
                    suggested_query=f"{query} {' '.join(missing)}",
                    related_findings=[],
                ))
                gap_id += 1

        elif template == "tech_market":
            expected_types = {"adoption_trend", "prediction", "market_metric"}
            found_types = {f.get("finding_type") for f in findings}
            missing = expected_types - found_types

            if missing:
                gaps.append(KnowledgeGap(
                    gap_id=f"g{gap_id}",
                    topic="Missing Market Data",
                    description=f"No findings for: {', '.join(t.replace('_', ' ') for t in missing)}",
                    importance="important",
                    impact_on_conclusions="Market analysis benefits from trend and adoption data",
                    suggested_query=f"{query} market data statistics trends",
                    related_findings=[],
                ))
                gap_id += 1

        return gaps[:10]  # Limit to top 10 gaps

    def _get_template_specific_gaps(
        self,
        findings: List[Dict[str, Any]],
        template: str,
        query: str,
    ) -> List[Dict[str, Any]]:
        """Get template-specific knowledge gaps."""
        gaps = []

        # Check for common gaps based on template
        if template == "investigative":
            # Check for missing actor relationships
            has_relationships = any(f.get("finding_type") == "relationship" for f in findings)
            if not has_relationships:
                gaps.append({
                    "topic": "Missing Relationship Mapping",
                    "description": "No relationship network data found between key actors",
                    "importance": "critical",
                    "impact_on_conclusions": "Understanding connections is crucial for investigative analysis",
                    "suggested_query": f"{query} relationships connections network",
                    "related_findings": [],
                })

        elif template == "competitive":
            # Check for pricing data
            has_pricing = any("pricing" in str(f.get("extracted_data", {})).lower() for f in findings)
            if not has_pricing:
                gaps.append({
                    "topic": "Missing Pricing Comparison",
                    "description": "No competitive pricing data available",
                    "importance": "important",
                    "impact_on_conclusions": "Pricing is key for competitive positioning analysis",
                    "suggested_query": f"{query} pricing plans cost comparison",
                    "related_findings": [],
                })

        return gaps

    async def generate_role_summaries(
        self,
        findings: List[Dict[str, Any]],
        perspectives: List[Dict[str, Any]],
        query: str,
        template: str,
    ) -> List[RoleSummary]:
        """
        Generate role-specific summaries for different stakeholders.

        Roles:
        - CTO: Technical depth, integration effort, team readiness
        - CFO: Cost analysis, ROI, budget impact
        - CEO: Strategic fit, competitive position, market timing
        """
        summaries = []

        # Gather relevant data
        all_insights = []
        all_warnings = []
        all_recommendations = []

        for p in perspectives:
            all_insights.extend(p.get("key_insights", []))
            all_warnings.extend(p.get("warnings", []))
            all_recommendations.extend(p.get("recommendations", []))

        # Calculate overall confidence
        confidences = [f.get("adjusted_confidence") or f.get("confidence_score", 0.5) for f in findings]
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.5
        confidence_level = "high" if avg_confidence >= 0.75 else "medium" if avg_confidence >= 0.5 else "low"

        # Generate CTO Summary
        cto_summary = self._generate_cto_summary(findings, all_insights, all_warnings, all_recommendations, template, confidence_level)
        summaries.append(cto_summary)

        # Generate CFO Summary
        cfo_summary = self._generate_cfo_summary(findings, all_insights, all_warnings, all_recommendations, template, confidence_level)
        summaries.append(cfo_summary)

        # Generate CEO Summary
        ceo_summary = self._generate_ceo_summary(findings, all_insights, all_warnings, all_recommendations, template, confidence_level)
        summaries.append(ceo_summary)

        return summaries

    def _generate_cto_summary(
        self,
        findings: List[Dict],
        insights: List[str],
        warnings: List[str],
        recommendations: List[str],
        template: str,
        confidence_level: str,
    ) -> RoleSummary:
        """Generate CTO-focused summary."""
        # Filter for technical insights
        tech_keywords = ["architecture", "integration", "api", "sdk", "developer", "engineering", "technical",
                         "performance", "scalability", "security", "infrastructure", "code", "implementation"]

        tech_insights = [i for i in insights if any(kw in i.lower() for kw in tech_keywords)]
        tech_warnings = [w for w in warnings if any(kw in w.lower() for kw in tech_keywords)]
        tech_recs = [r for r in recommendations if any(kw in r.lower() for kw in tech_keywords)]

        # Extract technical metrics
        tech_metrics = []
        for f in findings:
            data = f.get("extracted_data", {}) or {}
            finding_type = f.get("finding_type", "")

            if finding_type in ["product_launch", "adoption_trend", "enterprise_adoption"]:
                if data.get("technology") or data.get("product"):
                    tech_metrics.append({
                        "metric": data.get("technology") or data.get("product"),
                        "value": data.get("adoption_rate") or data.get("growth_percentage") or "N/A",
                        "context": f.get("summary", "")[:80],
                    })

        # Generate headline
        headline = self._generate_headline(findings, "technical", template)

        return RoleSummary(
            role="cto",
            role_title="Chief Technology Officer",
            headline=headline,
            key_points=tech_insights[:5] if tech_insights else ["No specific technical insights extracted"],
            action_items=[
                "Evaluate technical integration requirements",
                "Assess team readiness and skill gaps",
                "Review security and compliance implications",
            ] + tech_recs[:2],
            risks_to_watch=tech_warnings[:3] if tech_warnings else ["Monitor for breaking changes"],
            metrics_of_interest=tech_metrics[:5],
            confidence_level=confidence_level,
        )

    def _generate_cfo_summary(
        self,
        findings: List[Dict],
        insights: List[str],
        warnings: List[str],
        recommendations: List[str],
        template: str,
        confidence_level: str,
    ) -> RoleSummary:
        """Generate CFO-focused summary."""
        # Filter for financial insights
        fin_keywords = ["cost", "price", "revenue", "profit", "margin", "budget", "roi", "investment",
                        "valuation", "earnings", "growth", "market", "funding", "capital"]

        fin_insights = [i for i in insights if any(kw in i.lower() for kw in fin_keywords)]
        fin_warnings = [w for w in warnings if any(kw in w.lower() for kw in fin_keywords)]
        fin_recs = [r for r in recommendations if any(kw in r.lower() for kw in fin_keywords)]

        # Extract financial metrics
        fin_metrics = []
        for f in findings:
            data = f.get("extracted_data", {}) or {}
            finding_type = f.get("finding_type", "")

            if finding_type in ["funding_round", "earnings_metric", "market_metric", "valuation_signal"]:
                metric_name = data.get("company") or data.get("metric_name") or finding_type
                metric_value = data.get("amount") or data.get("revenue") or data.get("value")
                if metric_value:
                    fin_metrics.append({
                        "metric": metric_name,
                        "value": str(metric_value),
                        "context": f.get("summary", "")[:80],
                    })

        # Generate headline
        headline = self._generate_headline(findings, "financial", template)

        return RoleSummary(
            role="cfo",
            role_title="Chief Financial Officer",
            headline=headline,
            key_points=fin_insights[:5] if fin_insights else ["No specific financial insights extracted"],
            action_items=[
                "Evaluate budget implications",
                "Assess ROI and payback period",
                "Review vendor pricing and contracts",
            ] + fin_recs[:2],
            risks_to_watch=fin_warnings[:3] if fin_warnings else ["Monitor market pricing trends"],
            metrics_of_interest=fin_metrics[:5],
            confidence_level=confidence_level,
        )

    def _generate_ceo_summary(
        self,
        findings: List[Dict],
        insights: List[str],
        warnings: List[str],
        recommendations: List[str],
        template: str,
        confidence_level: str,
    ) -> RoleSummary:
        """Generate CEO-focused summary."""
        # Filter for strategic insights
        strat_keywords = ["strategy", "competitive", "market", "position", "opportunity", "threat",
                          "acquisition", "partnership", "leadership", "trend", "industry", "future"]

        strat_insights = [i for i in insights if any(kw in i.lower() for kw in strat_keywords)]
        strat_warnings = [w for w in warnings if any(kw in w.lower() for kw in strat_keywords)]
        strat_recs = [r for r in recommendations if any(kw in r.lower() for kw in strat_keywords)]

        # Extract strategic metrics
        strat_metrics = []
        for f in findings:
            data = f.get("extracted_data", {}) or {}
            finding_type = f.get("finding_type", "")

            if finding_type in ["acquisition", "prediction", "market_metric", "adoption_trend"]:
                metric_name = data.get("company") or data.get("technology") or finding_type
                metric_value = data.get("market_share") or data.get("adoption_rate") or data.get("growth_percentage")
                if metric_value:
                    strat_metrics.append({
                        "metric": metric_name,
                        "value": str(metric_value),
                        "context": f.get("summary", "")[:80],
                    })

        # Generate headline
        headline = self._generate_headline(findings, "strategic", template)

        return RoleSummary(
            role="ceo",
            role_title="Chief Executive Officer",
            headline=headline,
            key_points=strat_insights[:5] if strat_insights else ["No specific strategic insights extracted"],
            action_items=[
                "Evaluate strategic fit with company direction",
                "Assess competitive implications",
                "Consider market timing for action",
            ] + strat_recs[:2],
            risks_to_watch=strat_warnings[:3] if strat_warnings else ["Monitor competitive landscape changes"],
            metrics_of_interest=strat_metrics[:5],
            confidence_level=confidence_level,
        )

    def _generate_headline(
        self,
        findings: List[Dict],
        focus: str,
        template: str,
    ) -> str:
        """Generate a headline for the role summary."""
        # Count finding types
        prediction_count = sum(1 for f in findings if f.get("finding_type") == "prediction")
        high_conf_count = sum(1 for f in findings if (f.get("adjusted_confidence") or f.get("confidence_score", 0)) >= 0.8)

        if focus == "technical":
            if template == "tech_market":
                return f"Technology landscape analysis with {len(findings)} key findings, {high_conf_count} high-confidence"
            return f"Technical assessment across {len(findings)} findings"

        elif focus == "financial":
            if template == "financial":
                return f"Financial analysis: {len(findings)} data points, {high_conf_count} verified"
            return f"Budget and ROI considerations from {len(findings)} findings"

        else:  # strategic
            if prediction_count > 0:
                return f"Strategic outlook with {prediction_count} predictions across {len(findings)} findings"
            return f"Strategic assessment: {len(findings)} findings, {high_conf_count} high-confidence"
