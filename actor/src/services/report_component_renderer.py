"""
Report Component Renderer

Bridge between report data and the component system.
Transforms research results into component-ready data structures.
"""

from typing import Dict, Any, List, Optional

try:
    from .report_components import (
        ComponentType, ComponentConfig, ReportHints,
        render_component, get_report_hints, get_default_components,
        TEMPLATE_REPORT_HINTS
    )
    from .report_component_styles import get_component_styles
except ImportError:
    from report_components import (
        ComponentType, ComponentConfig, ReportHints,
        render_component, get_report_hints, get_default_components,
        TEMPLATE_REPORT_HINTS
    )
    from report_component_styles import get_component_styles


def prepare_component_data(result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transform research results into component-ready data structures.

    Args:
        result: The research result dictionary

    Returns:
        Dictionary with data ready for each component type
    """
    findings = result.get("findings", [])
    perspectives = result.get("perspectives", [])
    sources = result.get("sources", [])
    template = result.get("template", "unknown")
    query = result.get("query", "")

    component_data = {}

    # Verdict Hero data
    avg_conf = sum(f.get("confidence_score", 0.5) for f in findings) / max(len(findings), 1)
    red_flags = [f for f in findings if f.get("finding_type") in ["red_flag", "warning_sign", "suspicious_element"]]

    verdict = "Analysis Complete"
    color = "blue"
    if len(red_flags) > 3:
        verdict = "Significant Concerns"
        color = "red"
    elif len(red_flags) > 0:
        verdict = "Proceed with Caution"
        color = "yellow"
    elif avg_conf >= 0.7:
        verdict = "Strong Analysis"
        color = "green"

    component_data["verdict_hero"] = {
        "verdict": verdict,
        "score": avg_conf,
        "headline": f"{len(findings)} findings analyzed across {len(sources)} sources",
        "subtext": f"{len(red_flags)} concerns identified" if red_flags else "No major concerns detected",
        "color": color,
    }

    # Metric Cards data
    high_conf = len([f for f in findings if f.get("confidence_score", 0) >= 0.8])
    high_cred_sources = len([s for s in sources if s.get("credibility_score", 0) >= 0.8])

    component_data["metric_cards"] = {
        "metrics": [
            {"label": "Total Findings", "value": str(len(findings)), "trend": "flat"},
            {"label": "High Confidence", "value": str(high_conf), "trend": "up" if high_conf > len(findings) * 0.5 else "flat"},
            {"label": "Sources", "value": str(len(sources)), "trend": "flat"},
            {"label": "High Credibility", "value": str(high_cred_sources), "trend": "up" if high_cred_sources > len(sources) * 0.5 else "flat"},
            {"label": "Perspectives", "value": str(len(perspectives)), "trend": "flat"},
            {"label": "Red Flags", "value": str(len(red_flags)), "trend": "down" if red_flags else "flat"},
        ]
    }

    # Findings Table data - now includes analysis field
    component_data["findings_table"] = {
        "findings": [
            {
                "type": f.get("finding_type", "other"),
                "summary": f.get("summary", ""),
                "content": f.get("content", "")[:200],
                "analysis": f.get("analysis", ""),  # LLM's analytical commentary
                "date": f.get("date_referenced", "") or f.get("date_range", ""),
                "confidence": f.get("confidence_score", 0.5),
            }
            for f in findings[:15]
        ]
    }

    # Timeline data
    timeline_events = []
    for f in findings:
        if f.get("date_referenced") or f.get("date_range"):
            importance = "high" if f.get("confidence_score", 0.5) >= 0.8 else "normal"
            if f.get("finding_type") in ["red_flag", "warning_sign"]:
                importance = "critical"
            timeline_events.append({
                "date": f.get("date_referenced", "") or f.get("date_range", ""),
                "title": f.get("summary", "")[:60],
                "description": f.get("content", "")[:150],
                "type": f.get("finding_type", ""),
                "importance": importance,
            })
    component_data["timeline"] = {"events": timeline_events[:10]}

    # Quote Carousel data - from perspective analyses
    quotes = []
    for p in perspectives:
        analysis = p.get("analysis_text", "")
        if analysis and len(analysis) > 50:
            quotes.append({
                "text": analysis[:200] + "..." if len(analysis) > 200 else analysis,
                "source": p.get("perspective_type", "Expert").replace("_", " ").title(),
                "date": "",
                "sentiment": "neutral",
            })
    component_data["quote_carousel"] = {"quotes": quotes[:5]}

    # Risk Matrix data
    risks = []
    for f in findings:
        if f.get("finding_type") in ["red_flag", "warning_sign", "risk", "concern"]:
            conf = f.get("confidence_score", 0.5)
            risks.append({
                "name": f.get("summary", "")[:30],
                "likelihood": conf,
                "impact": 0.8 if f.get("finding_type") == "red_flag" else 0.5,
                "category": f.get("finding_type", "general"),
            })
    component_data["risk_matrix"] = {
        "risks": risks[:10],
        "x_label": "Likelihood",
        "y_label": "Impact",
    }

    # Checklist data
    checklist_items = []
    for f in findings[:12]:
        ftype = f.get("finding_type", "other")
        status = "checked" if f.get("confidence_score", 0.5) >= 0.8 else "unchecked"
        if ftype in ["red_flag", "warning_sign"]:
            status = "critical"
        elif ftype in ["concern", "risk"]:
            status = "warning"
        checklist_items.append({
            "text": f.get("summary", "")[:80],
            "status": status,
            "severity": "critical" if status == "critical" else "info",
            "detail": f.get("content", "")[:100],
        })
    component_data["checklist"] = {"items": checklist_items}

    # Source List data
    component_data["source_list"] = {
        "sources": [
            {
                "title": s.get("title", "Unknown")[:60],
                "url": s.get("url", "#"),
                "credibility": "high" if s.get("credibility_score", 0.5) >= 0.8 else "medium" if s.get("credibility_score", 0.5) >= 0.6 else "low",
                "type": s.get("source_type", "web"),
                "date": "",
            }
            for s in sources[:15]
        ]
    }

    # Prediction Cards data
    all_predictions = []
    for p in perspectives:
        for pred in p.get("predictions", []):
            if isinstance(pred, dict):
                all_predictions.append({
                    "prediction": pred.get("prediction", ""),
                    "rationale": pred.get("rationale", ""),
                    "confidence": pred.get("confidence", "medium"),
                    "timeline": pred.get("timeline", ""),
                    "source_perspective": p.get("perspective_type", "analyst"),
                })
    component_data["prediction_cards"] = {"predictions": all_predictions[:8]}

    # Key Insights data - now includes descriptions from findings analysis
    insights = []
    # First pull top findings with analysis as insights
    for f in findings[:5]:
        if f.get("analysis"):
            insights.append({
                "insight": f.get("summary", ""),
                "description": f.get("analysis", ""),
                "category": f.get("finding_type", "").replace("_", " ").title(),
                "importance": "high" if f.get("confidence_score", 0) >= 0.85 else "normal",
            })
    # Fill remaining from perspectives if needed
    for p in perspectives:
        if len(insights) >= 6:
            break
        for insight in p.get("key_insights", [])[:1]:
            insights.append({
                "insight": insight,
                "description": "",  # Perspective insights don't have separate description
                "category": p.get("perspective_type", "").replace("_", " ").title(),
                "importance": "normal",
            })
    component_data["key_insights"] = {"insights": insights[:6]}

    # Executive Summary data
    summary_text = ""
    key_points = []
    for p in perspectives[:1]:
        summary_text = p.get("analysis_text", "")[:500]
        key_points = p.get("key_insights", [])[:5]
    component_data["executive_summary"] = {
        "summary": summary_text,
        "key_points": key_points,
        "recommendation": "",
    }

    # Confidence Gauge data
    confidence_factors = []
    finding_types = {}
    for f in findings:
        ft = f.get("finding_type", "other")
        if ft not in finding_types:
            finding_types[ft] = []
        finding_types[ft].append(f.get("confidence_score", 0.5))

    for ft, scores in list(finding_types.items())[:5]:
        avg = sum(scores) / len(scores)
        confidence_factors.append({
            "name": ft.replace("_", " ").title(),
            "score": avg,
        })
    component_data["confidence_gauge"] = {
        "score": avg_conf,
        "label": "Overall Confidence",
        "factors": confidence_factors,
    }

    # Action Items data (from warnings and recommendations)
    actions = []
    for p in perspectives:
        for warning in p.get("warnings", [])[:2]:
            actions.append({
                "action": f"Address: {warning}",
                "priority": "high",
                "owner": "",
                "deadline": "",
            })
    for f in findings:
        if f.get("finding_type") == "recommendation":
            actions.append({
                "action": f.get("summary", "")[:80],
                "priority": "medium",
                "owner": "",
                "deadline": "",
            })
    component_data["action_items"] = {"actions": actions[:6]}

    # Pros & Cons data
    pros = []
    cons = []
    for f in findings:
        if f.get("finding_type") in ["strength", "positive", "opportunity", "product_strength"]:
            pros.append({"text": f.get("summary", "")[:80], "weight": "normal"})
        elif f.get("finding_type") in ["weakness", "negative", "risk", "red_flag", "product_weakness"]:
            cons.append({"text": f.get("summary", "")[:80], "weight": "normal"})
    component_data["pros_cons"] = {"pros": pros[:6], "cons": cons[:6]}

    # Comparison Table data (generic)
    component_data["comparison_table"] = {
        "headers": ["Aspect", "Finding", "Confidence"],
        "rows": [
            [f.get("finding_type", "").replace("_", " ").title(),
             f.get("summary", "")[:50],
             f"{int(f.get('confidence_score', 0.5) * 100)}%"]
            for f in findings[:8]
        ],
        "highlight_column": -1,
    }

    # Template-specific component data
    component_data = _prepare_template_specific_data(component_data, result, template)

    return component_data


def _prepare_template_specific_data(data: Dict[str, Any], result: Dict[str, Any], template: str) -> Dict[str, Any]:
    """Prepare template-specific component data with fallback handling for legacy finding types."""
    findings = result.get("findings", [])
    perspectives = result.get("perspectives", [])

    if template == "tech_market":
        # Tech Radar data - accept both new and legacy finding types
        # New types: tech_trend, market_trend, adoption_pattern
        # Legacy types: product_launch, funding_round, adoption_trend, market_metric
        tech_types = ["tech_trend", "adoption_pattern", "market_trend",
                      "product_launch", "adoption_trend", "market_metric"]
        technologies = []
        for f in findings:
            if f.get("finding_type") in tech_types:
                # Try to get maturity from extracted_data, fallback to confidence-based
                extracted = f.get("extracted_data", {}) or {}
                ring = extracted.get("maturity", "")
                if ring not in ["adopt", "trial", "assess", "hold"]:
                    conf = f.get("confidence_score", 0.5)
                    ring = "adopt" if conf >= 0.8 else "trial" if conf >= 0.6 else "assess" if conf >= 0.4 else "hold"

                tech_name = extracted.get("technology", "") or f.get("summary", "")[:25]
                technologies.append({
                    "name": tech_name,
                    "ring": ring,
                    "quadrant": "tools",
                    "moved": "none",
                    "description": f.get("content", "")[:100],
                })
        data["tech_radar"] = {"technologies": technologies[:16]}

    elif template == "financial":
        # Investment Thesis data - accept both new and legacy finding types
        # New types: bullish_signal, bearish_signal, risk, red_flag, financial_metric
        # Legacy types: fact, event, evidence, pattern, claim, prediction
        bull_points = []
        bear_points = []
        metrics_data = []

        for f in findings:
            ftype = f.get("finding_type", "")
            summary = f.get("summary", "") or f.get("content", "")[:100]
            conf = f.get("confidence_score", 0.5)

            # Direct mappings for new types
            if ftype in ["bullish_signal", "positive", "strength"]:
                bull_points.append(summary)
            elif ftype in ["bearish_signal", "negative", "risk", "red_flag"]:
                bear_points.append(summary)
            elif ftype == "financial_metric":
                extracted = f.get("extracted_data", {}) or {}
                if extracted.get("target_price"):
                    metrics_data.append(extracted)
                # High confidence metrics are bullish, low are bearish
                if conf >= 0.7:
                    bull_points.append(summary)
                elif conf < 0.5:
                    bear_points.append(summary)
            # Legacy type fallbacks - analyze content/confidence
            elif ftype in ["fact", "event", "evidence"]:
                if conf >= 0.7:
                    bull_points.append(summary)
            elif ftype in ["pattern", "gap"]:
                bear_points.append(summary)  # Patterns/gaps often indicate risks
            elif ftype == "prediction":
                if conf >= 0.6:
                    bull_points.append(summary)

        # Extract price targets from metrics if available
        target_price = "N/A"
        for m in metrics_data:
            if m.get("target_price"):
                target_price = m.get("target_price")
                break

        # Determine verdict based on bull/bear balance
        verdict = "Hold"
        if len(bull_points) > len(bear_points) * 1.5:
            verdict = "Buy"
        elif len(bear_points) > len(bull_points) * 1.5:
            verdict = "Sell"

        data["investment_thesis"] = {
            "verdict": verdict,
            "target_price": target_price,
            "current_price": "N/A",
            "upside": "N/A",
            "risk_level": "High" if len(bear_points) > 5 else "Medium" if len(bear_points) > 2 else "Low",
            "time_horizon": "12 months",
            "bull_case": " ".join(bull_points[:2]) if bull_points else "Limited upside catalysts identified",
            "bear_case": " ".join(bear_points[:2]) if bear_points else "Limited downside risks identified",
            "key_catalysts": bull_points[:4] if bull_points else ["Strong fundamentals"],
            "key_risks": bear_points[:4] if bear_points else ["Market volatility"],
        }

    elif template == "competitive":
        # Competitor Matrix data
        competitors = []
        for f in findings:
            if f.get("finding_type") in ["competitor_analysis", "market_position"]:
                extracted = f.get("extracted_data", {}) or {}
                competitors.append({
                    "name": extracted.get("company", f.get("summary", "")[:20]),
                    "scores": {
                        "Market Share": extracted.get("market_share_score", 5),
                        "Product": extracted.get("product_score", 5),
                        "Price": extracted.get("price_score", 5),
                        "Support": extracted.get("support_score", 5),
                    }
                })
        data["competitor_matrix"] = {
            "competitors": competitors[:6] if competitors else [
                {"name": "Company A", "scores": {"Market Share": 7, "Product": 8, "Price": 6, "Support": 7}},
                {"name": "Company B", "scores": {"Market Share": 6, "Product": 7, "Price": 8, "Support": 6}},
            ],
            "categories": ["Market Share", "Product", "Price", "Support"],
            "leader": competitors[0]["name"] if competitors else "Company A",
        }

    elif template == "investigative":
        # Investigation Timeline data
        events = []
        for f in findings:
            if f.get("date_referenced") or f.get("date_range"):
                event_type = "development"
                if f.get("finding_type") in ["evidence", "revelation"]:
                    event_type = "revelation"
                elif f.get("finding_type") in ["legal_action", "court_ruling"]:
                    event_type = "legal"
                elif f.get("finding_type") in ["financial_event", "transaction"]:
                    event_type = "financial"

                events.append({
                    "date": f.get("date_referenced", "") or f.get("date_range", ""),
                    "title": f.get("summary", "")[:60],
                    "description": f.get("content", "")[:200],
                    "type": event_type,
                    "severity": "high" if f.get("confidence_score", 0.5) >= 0.8 else "medium",
                    "sources": [],
                    "key_actors": [],
                })
        data["investigation_timeline"] = {"events": events[:12]}

    elif template == "legal":
        # Legal Case Tracker data
        cases = []
        for f in findings:
            if f.get("finding_type") in ["case_analysis", "ruling", "precedent", "legal_action"]:
                extracted = f.get("extracted_data", {}) or {}
                cases.append({
                    "name": extracted.get("case_name", f.get("summary", "")[:40]),
                    "jurisdiction": extracted.get("jurisdiction", ""),
                    "status": extracted.get("status", "pending"),
                    "parties": extracted.get("parties", []),
                    "key_dates": [],
                    "implications": f.get("content", "")[:150],
                    "ruling": extracted.get("ruling", ""),
                })
        data["legal_case_tracker"] = {"cases": cases[:5]}

    elif template == "contract":
        # Contract Analysis data
        red_flags = [f.get("summary", "") for f in findings if f.get("finding_type") in ["red_flag", "suspicious_element"]]
        opportunities = [f.get("summary", "") for f in findings if f.get("finding_type") in ["opportunity", "positive"]]

        data["contract_analysis"] = {
            "contract": {
                "name": result.get("query", "Contract")[:50],
                "value": "TBD",
                "duration": "TBD",
                "parties": [],
                "type": "Government Contract",
            },
            "key_terms": [],
            "obligations": [],
            "red_flags": red_flags[:4],
            "opportunities": opportunities[:4],
        }

    elif template == "due_diligence":
        # Due Diligence Scorecard data
        red_flags = [f for f in findings if f.get("finding_type") in ["red_flag", "warning_sign"]]
        strengths = [f.get("summary", "") for f in findings if f.get("finding_type") in ["strength", "positive"]]

        # Calculate overall score
        avg_conf = sum(f.get("confidence_score", 0.5) for f in findings) / max(len(findings), 1)
        red_flag_penalty = len(red_flags) * 10
        overall_score = max(0, min(100, int(avg_conf * 100) - red_flag_penalty))

        recommendation = "Proceed with Caution"
        if overall_score >= 70:
            recommendation = "Recommended"
        elif overall_score < 50:
            recommendation = "Not Recommended"

        data["due_diligence_scorecard"] = {
            "overall_score": overall_score,
            "recommendation": recommendation,
            "categories": [
                {"name": "Financial Health", "score": 60, "findings": [], "weight": 1.0},
                {"name": "Legal Standing", "score": 70, "findings": [], "weight": 1.0},
                {"name": "Reputation", "score": 65, "findings": [], "weight": 1.0},
            ],
            "red_flags": [
                {"issue": rf.get("summary", ""), "severity": "high", "details": rf.get("content", "")[:100]}
                for rf in red_flags[:5]
            ],
            "strengths": strengths[:5],
        }

    elif template == "purchase_decision":
        # Decision Matrix data
        options = []
        criteria = [
            {"name": "Quality", "weight": 1.0},
            {"name": "Price", "weight": 1.0},
            {"name": "Features", "weight": 0.8},
            {"name": "Support", "weight": 0.6},
        ]

        # Extract options from findings
        for f in findings:
            if f.get("finding_type") in ["alternative_option", "product_comparison"]:
                extracted = f.get("extracted_data", {}) or {}
                options.append({
                    "name": extracted.get("product", f.get("summary", "")[:20]),
                    "scores": {
                        "Quality": extracted.get("quality_score", 5),
                        "Price": extracted.get("price_score", 5),
                        "Features": extracted.get("features_score", 5),
                        "Support": extracted.get("support_score", 5),
                    },
                    "price": extracted.get("price", "N/A"),
                    "recommendation": False,
                })

        if not options:
            options = [
                {"name": "Option A", "scores": {"Quality": 8, "Price": 6, "Features": 7, "Support": 8}, "price": "$$$", "recommendation": True},
                {"name": "Option B", "scores": {"Quality": 7, "Price": 8, "Features": 6, "Support": 7}, "price": "$$", "recommendation": False},
            ]

        # Determine winner
        winner = max(options, key=lambda x: sum(x["scores"].values())) if options else None

        data["decision_matrix"] = {
            "options": options[:5],
            "criteria": criteria,
            "winner": winner["name"] if winner else "",
        }

    elif template == "reputation":
        # Trust Dashboard data
        warnings = [f for f in findings if f.get("finding_type") in ["warning_sign", "red_flag"]]
        trust_signals = [f for f in findings if f.get("finding_type") in ["trust_signal", "positive"]]

        trust_score = 50  # Start at neutral
        trust_score += len(trust_signals) * 10
        trust_score -= len(warnings) * 15
        trust_score = max(0, min(100, trust_score))

        verdict = "Unknown"
        if trust_score >= 70:
            verdict = "Appears Legitimate"
        elif trust_score >= 40:
            verdict = "Proceed with Caution"
        else:
            verdict = "Not Recommended"

        data["trust_dashboard"] = {
            "trust_score": trust_score,
            "verdict": verdict,
            "verification_status": "partially_verified",
            "trust_factors": [
                {"name": "Business Registration", "score": 70, "status": "positive"},
                {"name": "Customer Reviews", "score": 60, "status": "neutral"},
                {"name": "Online Presence", "score": 55, "status": "neutral"},
            ],
            "user_sentiment": {"positive": 45, "neutral": 30, "negative": 25},
            "red_flags": [f.get("summary", "") for f in warnings[:5]],
            "green_flags": [f.get("summary", "") for f in trust_signals[:5]],
        }

    elif template == "understanding":
        # Event Explainer data
        query = result.get("query", "Event")

        # Get key players from findings
        key_players = []
        for f in findings:
            if f.get("finding_type") in ["actor", "stakeholder"]:
                extracted = f.get("extracted_data", {}) or {}
                key_players.append({
                    "name": extracted.get("name", f.get("summary", "")[:30]),
                    "role": extracted.get("role", ""),
                    "action": extracted.get("action", ""),
                })

        # Build timeline from dated findings
        timeline = []
        for f in findings:
            if f.get("date_referenced") or f.get("date_range"):
                timeline.append({
                    "date": f.get("date_referenced", "") or f.get("date_range", ""),
                    "event": f.get("summary", ""),
                })

        # Get implications
        implications = []
        for f in findings:
            if f.get("finding_type") in ["implication", "impact", "consequence"]:
                implications.append({
                    "area": f.get("extracted_data", {}).get("area", "General"),
                    "impact": f.get("summary", ""),
                })

        data["event_explainer"] = {
            "event": {
                "title": query[:60],
                "date": "",
                "summary": perspectives[0].get("analysis_text", "")[:200] if perspectives else "",
            },
            "what_happened": perspectives[0].get("analysis_text", "")[:300] if perspectives else "",
            "why_it_matters": "",
            "key_players": key_players[:5],
            "timeline": timeline[:6],
            "implications": implications[:4],
            "different_perspectives": [
                {"perspective": p.get("perspective_type", "").replace("_", " ").title(),
                 "view": p.get("analysis_text", "")[:150]}
                for p in perspectives[:3]
            ],
        }

    return data


def render_template_components(result: Dict[str, Any], hints: Optional[ReportHints] = None) -> str:
    """
    Render all components for a report based on template hints.

    Args:
        result: Research result dictionary
        hints: Optional ReportHints override

    Returns:
        HTML string with rendered components
    """
    template = result.get("template", "unknown")

    # Get hints from template or use default
    if hints is None:
        hints = TEMPLATE_REPORT_HINTS.get(template, ReportHints(template_type=template))

    # Prepare component data
    component_data = prepare_component_data(result)

    # Get components to render
    components = []

    # Add required components
    for comp_type in hints.required_components:
        config = ComponentConfig(
            component_type=comp_type,
            priority=90,
            position="main"
        )
        components.append((comp_type, config))

    # Add optional components
    for comp_type in hints.optional_components:
        config = ComponentConfig(
            component_type=comp_type,
            priority=50,
            position="main"
        )
        components.append((comp_type, config))

    # Render components
    html_parts = []
    for comp_type, config in components:
        data_key = comp_type.value
        if data_key in component_data:
            try:
                rendered = render_component(comp_type, component_data[data_key], config)
                html_parts.append(rendered)
            except Exception as e:
                html_parts.append(f'<!-- Component {comp_type.value} error: {e} -->')

    return "\n".join(html_parts)


def get_component_css() -> str:
    """Get all component CSS styles."""
    return get_component_styles()


def render_component_section(result: Dict[str, Any], component_type: ComponentType,
                             title: Optional[str] = None) -> str:
    """
    Render a single component section.

    Args:
        result: Research result dictionary
        component_type: The component type to render
        title: Optional title override

    Returns:
        HTML string for the component section
    """
    component_data = prepare_component_data(result)
    data_key = component_type.value

    if data_key not in component_data:
        return f'<!-- No data for component {component_type.value} -->'

    config = ComponentConfig(
        component_type=component_type,
        title=title,
        position="main"
    )

    return render_component(component_type, component_data[data_key], config)
