"""
Report Components Library

A hybrid component system for template-specific report rendering.
Defines common reusable components and template-specific components.
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from enum import Enum


class ComponentType(Enum):
    """Types of visual components available for reports."""
    # Common Components
    VERDICT_HERO = "verdict_hero"
    METRIC_CARDS = "metric_cards"
    FINDINGS_TABLE = "findings_table"
    TIMELINE = "timeline"
    QUOTE_CAROUSEL = "quote_carousel"
    RISK_MATRIX = "risk_matrix"
    CHECKLIST = "checklist"
    SOURCE_LIST = "source_list"
    PREDICTION_CARDS = "prediction_cards"
    KEY_INSIGHTS = "key_insights"
    EXECUTIVE_SUMMARY = "executive_summary"
    CONFIDENCE_GAUGE = "confidence_gauge"
    ACTION_ITEMS = "action_items"
    PROS_CONS = "pros_cons"
    COMPARISON_TABLE = "comparison_table"

    # Template-Specific Components
    TECH_RADAR = "tech_radar"                    # tech_market
    INVESTMENT_THESIS = "investment_thesis"      # financial
    COMPETITOR_MATRIX = "competitor_matrix"      # competitive
    INVESTIGATION_TIMELINE = "investigation_timeline"  # investigative
    LEGAL_CASE_TRACKER = "legal_case_tracker"    # legal
    CONTRACT_ANALYSIS = "contract_analysis"      # contract
    DUE_DILIGENCE_SCORECARD = "due_diligence_scorecard"  # due_diligence
    DECISION_MATRIX = "decision_matrix"          # purchase_decision
    TRUST_DASHBOARD = "trust_dashboard"          # reputation
    EVENT_EXPLAINER = "event_explainer"          # understanding


@dataclass
class ComponentConfig:
    """Configuration for a report component."""
    component_type: ComponentType
    title: Optional[str] = None
    position: str = "main"  # main, sidebar, hero
    priority: int = 50  # 0-100, higher = rendered first
    max_items: Optional[int] = None
    collapsible: bool = False
    default_collapsed: bool = False
    css_class: str = ""
    options: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ReportHints:
    """Hints for report generation passed to LLM and renderer."""
    template_type: str
    structure: str = "balanced"  # balanced, quantitative_first, narrative_first, verdict_first
    findings_grouping: str = "chronological"  # chronological, sentiment, category, impact
    tone: str = "professional"  # professional, analytical, advisory, investigative
    decision_format: str = "recommendation"  # recommendation, matrix, checklist, thesis
    emphasis: List[str] = field(default_factory=list)  # what to highlight
    required_components: List[ComponentType] = field(default_factory=list)
    optional_components: List[ComponentType] = field(default_factory=list)
    visualization_preference: List[str] = field(default_factory=list)
    custom_sections: Dict[str, Any] = field(default_factory=dict)


# =============================================================================
# COMMON COMPONENT RENDERERS
# =============================================================================

def render_verdict_hero(data: Dict[str, Any], config: ComponentConfig) -> str:
    """
    Hero section with prominent verdict/score display.
    data: {verdict: str, score: float, headline: str, subtext: str, color: str}
    """
    verdict = data.get("verdict", "Analysis Complete")
    score = data.get("score", 0)
    headline = data.get("headline", "")
    subtext = data.get("subtext", "")
    color = data.get("color", "blue")

    score_display = f"{score:.0%}" if isinstance(score, float) and score <= 1 else str(score)

    return f'''
    <div class="component verdict-hero verdict-{color} {config.css_class}">
        <div class="verdict-score-ring">
            <span class="verdict-score">{score_display}</span>
        </div>
        <div class="verdict-content">
            <h2 class="verdict-headline">{verdict}</h2>
            <p class="verdict-subtext">{headline}</p>
            {f'<p class="verdict-detail">{subtext}</p>' if subtext else ''}
        </div>
    </div>
    '''


def render_metric_cards(data: Dict[str, Any], config: ComponentConfig) -> str:
    """
    Grid of metric cards with labels and values.
    data: {metrics: [{label: str, value: str, trend: str, description: str}]}
    """
    metrics = data.get("metrics", [])[:config.max_items or 6]

    cards_html = ""
    for metric in metrics:
        trend_icon = ""
        if metric.get("trend") == "up":
            trend_icon = '<span class="trend-up">↑</span>'
        elif metric.get("trend") == "down":
            trend_icon = '<span class="trend-down">↓</span>'

        cards_html += f'''
        <div class="metric-card">
            <div class="metric-value">{metric.get("value", "N/A")} {trend_icon}</div>
            <div class="metric-label">{metric.get("label", "")}</div>
            {f'<div class="metric-desc">{metric.get("description", "")}</div>' if metric.get("description") else ''}
        </div>
        '''

    title = f'<h3 class="component-title">{config.title}</h3>' if config.title else ''
    return f'''
    <div class="component metric-cards-container {config.css_class}">
        {title}
        <div class="metric-cards-grid">
            {cards_html}
        </div>
    </div>
    '''


def render_findings_table(data: Dict[str, Any], config: ComponentConfig) -> str:
    """
    Findings display with analysis commentary.
    data: {findings: [{type: str, summary: str, content: str, analysis: str, date: str, confidence: float}]}
    """
    findings = data.get("findings", [])[:config.max_items or 12]

    items_html = ""
    for finding in findings:
        conf = finding.get("confidence", 0)
        conf_class = "high" if conf >= 0.8 else "medium" if conf >= 0.6 else "low"
        finding_type = finding.get("type", "general")
        analysis = finding.get("analysis", "")

        items_html += f'''
        <div class="finding-item">
            <div class="finding-header">
                <span class="finding-type-badge {finding_type}">{finding_type.replace("_", " ")}</span>
                <span class="finding-date">{finding.get("date", "")}</span>
                <span class="confidence-badge {conf_class}">{conf:.0%}</span>
            </div>
            <div class="finding-summary">{finding.get("summary", "")}</div>
            {f'<div class="finding-analysis">{analysis}</div>' if analysis else ''}
        </div>
        '''

    title = f'<h3 class="component-title">{config.title or "Key Findings"}</h3>'
    return f'''
    <div class="component findings-container {config.css_class}">
        {title}
        <div class="findings-list">
            {items_html}
        </div>
    </div>
    '''


def render_timeline(data: Dict[str, Any], config: ComponentConfig) -> str:
    """
    Vertical timeline of events.
    data: {events: [{date: str, title: str, description: str, type: str, importance: str}]}
    """
    events = data.get("events", [])[:config.max_items or 8]

    events_html = ""
    for event in events:
        importance = event.get("importance", "normal")
        events_html += f'''
        <div class="timeline-event timeline-{importance}">
            <div class="timeline-marker"></div>
            <div class="timeline-date">{event.get("date", "")}</div>
            <div class="timeline-content">
                <h4 class="timeline-title">{event.get("title", "")}</h4>
                <p class="timeline-desc">{event.get("description", "")}</p>
                {f'<span class="timeline-type">{event.get("type", "")}</span>' if event.get("type") else ''}
            </div>
        </div>
        '''

    title = f'<h3 class="component-title">{config.title or "Timeline"}</h3>' if config.title else '<h3 class="component-title">Timeline</h3>'
    return f'''
    <div class="component timeline-container {config.css_class}">
        {title}
        <div class="timeline">
            {events_html}
        </div>
    </div>
    '''


def render_quote_carousel(data: Dict[str, Any], config: ComponentConfig) -> str:
    """
    Carousel of quotes/testimonials.
    data: {quotes: [{text: str, source: str, date: str, sentiment: str}]}
    """
    quotes = data.get("quotes", [])[:config.max_items or 5]

    quotes_html = ""
    for i, quote in enumerate(quotes):
        sentiment = quote.get("sentiment", "neutral")
        active = "active" if i == 0 else ""
        quotes_html += f'''
        <div class="quote-slide {active}" data-index="{i}">
            <blockquote class="quote-text quote-{sentiment}">"{quote.get("text", "")}"</blockquote>
            <cite class="quote-source">— {quote.get("source", "Unknown")} {f'({quote.get("date", "")})' if quote.get("date") else ''}</cite>
        </div>
        '''

    dots_html = "".join([f'<span class="carousel-dot {"active" if i == 0 else ""}" data-index="{i}"></span>' for i in range(len(quotes))])

    title = f'<h3 class="component-title">{config.title or "Expert Perspectives"}</h3>'
    return f'''
    <div class="component quote-carousel-container {config.css_class}" x-data="{{currentSlide: 0, totalSlides: {len(quotes)}}}">
        {title}
        <div class="quote-carousel">
            {quotes_html}
        </div>
        <div class="carousel-controls">
            <button class="carousel-btn prev" @click="currentSlide = (currentSlide - 1 + totalSlides) % totalSlides">‹</button>
            <div class="carousel-dots">{dots_html}</div>
            <button class="carousel-btn next" @click="currentSlide = (currentSlide + 1) % totalSlides">›</button>
        </div>
    </div>
    '''


def render_risk_matrix(data: Dict[str, Any], config: ComponentConfig) -> str:
    """
    2D risk assessment matrix.
    data: {risks: [{name: str, likelihood: float, impact: float, category: str}], x_label: str, y_label: str}
    """
    risks = data.get("risks", [])[:config.max_items or 10]
    x_label = data.get("x_label", "Likelihood")
    y_label = data.get("y_label", "Impact")

    # Position risks on grid
    risk_items = ""
    for risk in risks:
        x_pos = risk.get("likelihood", 0.5) * 100
        y_pos = (1 - risk.get("impact", 0.5)) * 100  # Invert Y axis
        category = risk.get("category", "general")
        risk_items += f'''
        <div class="risk-item risk-{category}" style="left: {x_pos}%; top: {y_pos}%;" title="{risk.get("name", "")}">
            <span class="risk-dot"></span>
            <span class="risk-label">{risk.get("name", "")[:20]}</span>
        </div>
        '''

    title = f'<h3 class="component-title">{config.title or "Risk Assessment Matrix"}</h3>'
    return f'''
    <div class="component risk-matrix-container {config.css_class}">
        {title}
        <div class="risk-matrix">
            <div class="risk-y-axis">
                <span class="axis-label">{y_label}</span>
                <span class="axis-high">High</span>
                <span class="axis-low">Low</span>
            </div>
            <div class="risk-grid">
                <div class="risk-quadrant risk-critical">Critical</div>
                <div class="risk-quadrant risk-high">High</div>
                <div class="risk-quadrant risk-medium">Medium</div>
                <div class="risk-quadrant risk-low">Low</div>
                {risk_items}
            </div>
            <div class="risk-x-axis">
                <span class="axis-low">Low</span>
                <span class="axis-label">{x_label}</span>
                <span class="axis-high">High</span>
            </div>
        </div>
    </div>
    '''


def render_checklist(data: Dict[str, Any], config: ComponentConfig) -> str:
    """
    Interactive checklist with status indicators.
    data: {items: [{text: str, status: str, severity: str, detail: str}], title: str}
    """
    items = data.get("items", [])[:config.max_items or 12]

    items_html = ""
    for item in items:
        status = item.get("status", "unchecked")  # checked, unchecked, warning, critical
        severity = item.get("severity", "info")
        icon = "✓" if status == "checked" else "✗" if status == "critical" else "⚠" if status == "warning" else "○"

        items_html += f'''
        <li class="checklist-item checklist-{status} severity-{severity}">
            <span class="checklist-icon">{icon}</span>
            <span class="checklist-text">{item.get("text", "")}</span>
            {f'<span class="checklist-detail">{item.get("detail", "")}</span>' if item.get("detail") else ''}
        </li>
        '''

    title = f'<h3 class="component-title">{config.title or "Checklist"}</h3>'
    return f'''
    <div class="component checklist-container {config.css_class}">
        {title}
        <ul class="checklist">
            {items_html}
        </ul>
    </div>
    '''


def render_source_list(data: Dict[str, Any], config: ComponentConfig) -> str:
    """
    List of sources with credibility indicators.
    data: {sources: [{title: str, url: str, credibility: str, type: str, date: str}]}
    """
    sources = data.get("sources", [])[:config.max_items or 15]

    sources_html = ""
    for source in sources:
        credibility = source.get("credibility", "medium")
        sources_html += f'''
        <li class="source-item source-{credibility}">
            <span class="source-credibility-dot"></span>
            <a href="{source.get("url", "#")}" target="_blank" class="source-link">{source.get("title", "Unknown Source")}</a>
            <span class="source-meta">
                <span class="source-type">{source.get("type", "")}</span>
                <span class="source-date">{source.get("date", "")}</span>
            </span>
        </li>
        '''

    title = f'<h3 class="component-title">{config.title or "Sources"}</h3>'
    return f'''
    <div class="component source-list-container {config.css_class}">
        {title}
        <ul class="source-list">
            {sources_html}
        </ul>
    </div>
    '''


def render_prediction_cards(data: Dict[str, Any], config: ComponentConfig) -> str:
    """
    Cards displaying predictions with confidence and timeline.
    data: {predictions: [{prediction: str, rationale: str, confidence: str, timeline: str, source_perspective: str}]}
    """
    predictions = data.get("predictions", [])[:config.max_items or 5]

    cards_html = ""
    for pred in predictions:
        conf = pred.get("confidence", "medium")
        # Handle both string and float confidence values
        if isinstance(conf, (int, float)):
            conf_label = "high" if conf >= 0.7 else "medium" if conf >= 0.4 else "low"
            conf_display = f"{int(conf * 100)}%"
        else:
            conf_label = str(conf).lower()
            conf_display = str(conf).upper()
        cards_html += f'''
        <div class="prediction-card prediction-{conf_label}">
            <div class="prediction-header">
                <span class="prediction-confidence">{conf_display}</span>
                <span class="prediction-timeline">{pred.get("timeline", "")}</span>
            </div>
            <h4 class="prediction-text">{pred.get("prediction", "")}</h4>
            <p class="prediction-rationale">{pred.get("rationale", "")}</p>
            <div class="prediction-footer">
                <span class="prediction-source">Based on: {pred.get("source_perspective", "Analysis")}</span>
            </div>
        </div>
        '''

    title = f'<h3 class="component-title">{config.title or "Predictions & Outlook"}</h3>'
    return f'''
    <div class="component prediction-cards-container {config.css_class}">
        {title}
        <div class="prediction-cards">
            {cards_html}
        </div>
    </div>
    '''


def render_key_insights(data: Dict[str, Any], config: ComponentConfig) -> str:
    """
    Highlighted key insights with descriptions.
    data: {insights: [{insight: str, description: str, category: str, importance: str}]}
    """
    insights = data.get("insights", [])[:config.max_items or 6]

    insights_html = ""
    for insight in insights:
        importance = insight.get("importance", "normal")
        description = insight.get("description", "")
        category = insight.get("category", "")

        insights_html += f'''
        <div class="insight-item insight-{importance}">
            <div class="insight-header">
                <span class="insight-text">{insight.get("insight", "")}</span>
                {f'<span class="insight-category">{category}</span>' if category else ''}
            </div>
            {f'<div class="insight-description">{description}</div>' if description else ''}
        </div>
        '''

    title = f'<h3 class="component-title">{config.title or "Key Insights"}</h3>'
    return f'''
    <div class="component key-insights-container {config.css_class}">
        {title}
        <div class="insights-list">
            {insights_html}
        </div>
    </div>
    '''


def render_executive_summary(data: Dict[str, Any], config: ComponentConfig) -> str:
    """
    Executive summary section.
    data: {summary: str, key_points: [str], recommendation: str}
    """
    summary = data.get("summary", "")
    key_points = data.get("key_points", [])[:5]
    recommendation = data.get("recommendation", "")

    points_html = "".join([f'<li>{point}</li>' for point in key_points])

    title = f'<h3 class="component-title">{config.title or "Executive Summary"}</h3>'
    return f'''
    <div class="component executive-summary-container {config.css_class}">
        {title}
        <div class="summary-content">
            <p class="summary-text">{summary}</p>
            {f'<ul class="summary-points">{points_html}</ul>' if key_points else ''}
            {f'<div class="summary-recommendation"><strong>Recommendation:</strong> {recommendation}</div>' if recommendation else ''}
        </div>
    </div>
    '''


def render_confidence_gauge(data: Dict[str, Any], config: ComponentConfig) -> str:
    """
    Visual confidence gauge.
    data: {score: float, label: str, factors: [{name: str, score: float}]}
    """
    score = data.get("score", 0.5)
    label = data.get("label", "Confidence")
    factors = data.get("factors", [])[:5]

    percentage = score * 100
    color = "green" if score >= 0.7 else "yellow" if score >= 0.4 else "red"

    factors_html = ""
    for factor in factors:
        f_pct = factor.get("score", 0.5) * 100
        factors_html += f'''
        <div class="gauge-factor">
            <span class="factor-name">{factor.get("name", "")}</span>
            <div class="factor-bar"><div class="factor-fill" style="width: {f_pct}%"></div></div>
            <span class="factor-score">{f_pct:.0f}%</span>
        </div>
        '''

    title = f'<h3 class="component-title">{config.title or label}</h3>'
    return f'''
    <div class="component confidence-gauge-container {config.css_class}">
        {title}
        <div class="gauge-wrapper">
            <div class="gauge-circle gauge-{color}">
                <svg viewBox="0 0 100 100">
                    <circle class="gauge-bg" cx="50" cy="50" r="45"/>
                    <circle class="gauge-fill" cx="50" cy="50" r="45" stroke-dasharray="{percentage * 2.83} 283"/>
                </svg>
                <span class="gauge-value">{percentage:.0f}%</span>
            </div>
        </div>
        {f'<div class="gauge-factors">{factors_html}</div>' if factors else ''}
    </div>
    '''


def render_action_items(data: Dict[str, Any], config: ComponentConfig) -> str:
    """
    Actionable next steps.
    data: {actions: [{action: str, priority: str, owner: str, deadline: str}]}
    """
    actions = data.get("actions", [])[:config.max_items or 6]

    actions_html = ""
    for action in actions:
        priority = action.get("priority", "medium")
        actions_html += f'''
        <div class="action-item action-{priority}">
            <span class="action-priority">{priority.upper()}</span>
            <span class="action-text">{action.get("action", "")}</span>
            <div class="action-meta">
                {f'<span class="action-owner">{action.get("owner", "")}</span>' if action.get("owner") else ''}
                {f'<span class="action-deadline">{action.get("deadline", "")}</span>' if action.get("deadline") else ''}
            </div>
        </div>
        '''

    title = f'<h3 class="component-title">{config.title or "Recommended Actions"}</h3>'
    return f'''
    <div class="component action-items-container {config.css_class}">
        {title}
        <div class="actions-list">
            {actions_html}
        </div>
    </div>
    '''


def render_pros_cons(data: Dict[str, Any], config: ComponentConfig) -> str:
    """
    Pros and cons comparison.
    data: {pros: [{text: str, weight: str}], cons: [{text: str, weight: str}]}
    """
    pros = data.get("pros", [])[:config.max_items or 6]
    cons = data.get("cons", [])[:config.max_items or 6]

    pros_html = "".join([f'<li class="pro-item weight-{p.get("weight", "normal")}"><span class="pro-icon">✓</span>{p.get("text", "")}</li>' for p in pros])
    cons_html = "".join([f'<li class="con-item weight-{c.get("weight", "normal")}"><span class="con-icon">✗</span>{c.get("text", "")}</li>' for c in cons])

    title = f'<h3 class="component-title">{config.title or "Pros & Cons"}</h3>'
    return f'''
    <div class="component pros-cons-container {config.css_class}">
        {title}
        <div class="pros-cons-grid">
            <div class="pros-column">
                <h4 class="column-header pros-header">Advantages</h4>
                <ul class="pros-list">{pros_html}</ul>
            </div>
            <div class="cons-column">
                <h4 class="column-header cons-header">Disadvantages</h4>
                <ul class="cons-list">{cons_html}</ul>
            </div>
        </div>
    </div>
    '''


def render_comparison_table(data: Dict[str, Any], config: ComponentConfig) -> str:
    """
    Generic comparison table.
    data: {headers: [str], rows: [[str]], highlight_column: int}
    """
    headers = data.get("headers", [])
    rows = data.get("rows", [])
    highlight_col = data.get("highlight_column", -1)

    header_html = "".join([f'<th class="{"highlight" if i == highlight_col else ""}">{h}</th>' for i, h in enumerate(headers)])

    rows_html = ""
    for row in rows:
        cells = "".join([f'<td class="{"highlight" if i == highlight_col else ""}">{cell}</td>' for i, cell in enumerate(row)])
        rows_html += f'<tr>{cells}</tr>'

    title = f'<h3 class="component-title">{config.title or "Comparison"}</h3>'
    return f'''
    <div class="component comparison-table-container {config.css_class}">
        {title}
        <div class="table-wrapper">
            <table class="comparison-table">
                <thead><tr>{header_html}</tr></thead>
                <tbody>{rows_html}</tbody>
            </table>
        </div>
    </div>
    '''


# =============================================================================
# TEMPLATE-SPECIFIC COMPONENT RENDERERS
# =============================================================================

def render_tech_radar(data: Dict[str, Any], config: ComponentConfig) -> str:
    """
    Technology radar visualization for tech_market template.
    data: {technologies: [{name: str, ring: str, quadrant: str, moved: str, description: str}]}
    Rings: adopt, trial, assess, hold
    Quadrants: techniques, tools, platforms, languages
    """
    technologies = data.get("technologies", [])

    # Group by quadrant
    quadrants = {"techniques": [], "tools": [], "platforms": [], "languages": []}
    for tech in technologies:
        q = tech.get("quadrant", "tools")
        if q in quadrants:
            quadrants[q].append(tech)

    ring_radius = {"adopt": 25, "trial": 45, "assess": 65, "hold": 85}

    blips_html = ""
    for q_idx, (quadrant, techs) in enumerate(quadrants.items()):
        angle_start = q_idx * 90
        for i, tech in enumerate(techs[:8]):
            ring = tech.get("ring", "assess")
            radius = ring_radius.get(ring, 65)
            angle = angle_start + 10 + (i * 10)
            moved = tech.get("moved", "none")
            moved_icon = "↑" if moved == "up" else "↓" if moved == "down" else ""

            blips_html += f'''
            <div class="radar-blip ring-{ring} quadrant-{quadrant}"
                 style="--angle: {angle}deg; --radius: {radius}%;"
                 title="{tech.get("name", "")}: {tech.get("description", "")}">
                <span class="blip-label">{tech.get("name", "")[:12]}</span>
                {f'<span class="blip-moved">{moved_icon}</span>' if moved_icon else ''}
            </div>
            '''

    title = f'<h3 class="component-title">{config.title or "Technology Radar"}</h3>'
    return f'''
    <div class="component tech-radar-container {config.css_class}">
        {title}
        <div class="tech-radar">
            <div class="radar-rings">
                <div class="radar-ring ring-hold"><span>Hold</span></div>
                <div class="radar-ring ring-assess"><span>Assess</span></div>
                <div class="radar-ring ring-trial"><span>Trial</span></div>
                <div class="radar-ring ring-adopt"><span>Adopt</span></div>
            </div>
            <div class="radar-quadrants">
                <div class="quadrant-label q-techniques">Techniques</div>
                <div class="quadrant-label q-tools">Tools</div>
                <div class="quadrant-label q-platforms">Platforms</div>
                <div class="quadrant-label q-languages">Languages</div>
            </div>
            <div class="radar-blips">
                {blips_html}
            </div>
        </div>
        <div class="radar-legend">
            <span class="legend-item"><span class="legend-dot ring-adopt"></span>Adopt</span>
            <span class="legend-item"><span class="legend-dot ring-trial"></span>Trial</span>
            <span class="legend-item"><span class="legend-dot ring-assess"></span>Assess</span>
            <span class="legend-item"><span class="legend-dot ring-hold"></span>Hold</span>
        </div>
    </div>
    '''


def render_investment_thesis(data: Dict[str, Any], config: ComponentConfig) -> str:
    """
    Investment thesis panel for financial template.
    data: {verdict: str, target_price: str, risk_level: str,
           bull_case: str, bear_case: str, key_catalysts: [str], key_risks: [str]}
    """
    verdict = data.get("verdict", "Hold")
    verdict_class = "buy" if verdict.lower() in ["buy", "strong buy"] else "sell" if verdict.lower() in ["sell", "strong sell"] else "hold"
    target_price = data.get("target_price", "")

    # Build compact header with verdict + optional target
    header_extra = f'<span class="thesis-target">Target: {target_price}</span>' if target_price and target_price != "N/A" else ""

    catalysts_html = "".join([f'<li>{c}</li>' for c in data.get("key_catalysts", [])[:5]])
    risks_html = "".join([f'<li>{r}</li>' for r in data.get("key_risks", [])[:5]])

    title = f'<h3 class="component-title">{config.title or "Investment Thesis"}</h3>'
    return f'''
    <div class="component investment-thesis-container {config.css_class}">
        {title}
        <div class="thesis-panel">
            <div class="thesis-header thesis-{verdict_class}">
                <span class="thesis-verdict-label">{verdict.upper()}</span>
                {header_extra}
            </div>
            <div class="thesis-cases">
                <div class="bull-case">
                    <h4>Bull Case</h4>
                    <p>{data.get("bull_case", "No bull case identified.")}</p>
                </div>
                <div class="bear-case">
                    <h4>Bear Case</h4>
                    <p>{data.get("bear_case", "No bear case identified.")}</p>
                </div>
            </div>
            <div class="thesis-factors">
                <div class="catalysts">
                    <h4>Key Catalysts</h4>
                    <ul>{catalysts_html if catalysts_html else '<li>None identified</li>'}</ul>
                </div>
                <div class="risks">
                    <h4>Key Risks</h4>
                    <ul>{risks_html if risks_html else '<li>None identified</li>'}</ul>
                </div>
            </div>
        </div>
    </div>
    '''


def render_competitor_matrix(data: Dict[str, Any], config: ComponentConfig) -> str:
    """
    Competitive analysis matrix for competitive template.
    data: {competitors: [{name: str, scores: {category: score}}], categories: [str], leader: str}
    """
    competitors = data.get("competitors", [])[:6]
    categories = data.get("categories", ["Market Share", "Product", "Price", "Support"])
    leader = data.get("leader", "")

    # Header row
    header_html = '<th class="category-header">Competitor</th>'
    header_html += "".join([f'<th class="category-header">{cat}</th>' for cat in categories])
    header_html += '<th class="category-header">Overall</th>'

    # Data rows
    rows_html = ""
    for comp in competitors:
        is_leader = comp.get("name", "") == leader
        scores = comp.get("scores", {})
        overall = sum(scores.values()) / len(scores) if scores else 0

        cells = f'<td class="competitor-name {"leader" if is_leader else ""}">{comp.get("name", "")} {"👑" if is_leader else ""}</td>'
        for cat in categories:
            score = scores.get(cat, 0)
            score_class = "high" if score >= 8 else "medium" if score >= 5 else "low"
            cells += f'<td class="score-cell score-{score_class}">{score:.1f}</td>'

        overall_class = "high" if overall >= 8 else "medium" if overall >= 5 else "low"
        cells += f'<td class="score-cell overall score-{overall_class}">{overall:.1f}</td>'
        rows_html += f'<tr class="{"leader-row" if is_leader else ""}">{cells}</tr>'

    title = f'<h3 class="component-title">{config.title or "Competitive Matrix"}</h3>'
    return f'''
    <div class="component competitor-matrix-container {config.css_class}">
        {title}
        <div class="matrix-wrapper">
            <table class="competitor-matrix">
                <thead><tr>{header_html}</tr></thead>
                <tbody>{rows_html}</tbody>
            </table>
        </div>
        <div class="matrix-legend">
            <span class="legend-item"><span class="score-dot score-high"></span>Strong (8-10)</span>
            <span class="legend-item"><span class="score-dot score-medium"></span>Average (5-7)</span>
            <span class="legend-item"><span class="score-dot score-low"></span>Weak (0-4)</span>
        </div>
    </div>
    '''


def render_investigation_timeline(data: Dict[str, Any], config: ComponentConfig) -> str:
    """
    Detailed investigation timeline for investigative template.
    data: {events: [{date: str, title: str, description: str, type: str,
                    severity: str, sources: [str], key_actors: [str]}]}
    Types: revelation, development, response, legal, financial
    """
    events = data.get("events", [])[:config.max_items or 12]

    events_html = ""
    for event in events:
        event_type = event.get("type", "development")
        severity = event.get("severity", "medium")
        sources = event.get("sources", [])[:2]
        actors = event.get("key_actors", [])[:3]

        sources_html = "".join([f'<span class="event-source">{s}</span>' for s in sources])
        actors_html = "".join([f'<span class="event-actor">{a}</span>' for a in actors])

        events_html += f'''
        <div class="investigation-event event-{event_type} severity-{severity}">
            <div class="event-timeline-marker">
                <span class="event-type-icon">{get_investigation_icon(event_type)}</span>
            </div>
            <div class="event-card">
                <div class="event-header">
                    <span class="event-date">{event.get("date", "")}</span>
                    <span class="event-type-badge">{event_type.replace("_", " ").title()}</span>
                    <span class="event-severity severity-{severity}">{severity.upper()}</span>
                </div>
                <h4 class="event-title">{event.get("title", "")}</h4>
                <p class="event-description">{event.get("description", "")}</p>
                <div class="event-footer">
                    <div class="event-actors">{actors_html}</div>
                    <div class="event-sources">{sources_html}</div>
                </div>
            </div>
        </div>
        '''

    title = f'<h3 class="component-title">{config.title or "Investigation Timeline"}</h3>'
    return f'''
    <div class="component investigation-timeline-container {config.css_class}">
        {title}
        <div class="investigation-timeline">
            {events_html}
        </div>
    </div>
    '''


def get_investigation_icon(event_type: str) -> str:
    """Get icon for investigation event type."""
    icons = {
        "revelation": "🔍",
        "development": "📰",
        "response": "💬",
        "legal": "⚖️",
        "financial": "💰",
        "regulatory": "🏛️",
        "whistleblower": "🚨",
    }
    return icons.get(event_type, "📌")


def render_legal_case_tracker(data: Dict[str, Any], config: ComponentConfig) -> str:
    """
    Legal case tracking panel for legal template.
    data: {cases: [{name: str, jurisdiction: str, status: str, parties: [str],
                   key_dates: [{date: str, event: str}], implications: str, ruling: str}]}
    """
    cases = data.get("cases", [])[:config.max_items or 5]

    cases_html = ""
    for case in cases:
        status = case.get("status", "pending")
        parties = " vs ".join(case.get("parties", [])[:2])

        dates_html = ""
        for kd in case.get("key_dates", [])[:3]:
            dates_html += f'<div class="case-date"><span class="date">{kd.get("date", "")}</span><span class="event">{kd.get("event", "")}</span></div>'

        cases_html += f'''
        <div class="legal-case case-{status}">
            <div class="case-header">
                <h4 class="case-name">{case.get("name", "")}</h4>
                <span class="case-status status-{status}">{status.upper()}</span>
            </div>
            <div class="case-parties">{parties}</div>
            <div class="case-jurisdiction">📍 {case.get("jurisdiction", "")}</div>
            <div class="case-dates">{dates_html}</div>
            {f'<div class="case-ruling"><strong>Ruling:</strong> {case.get("ruling", "")}</div>' if case.get("ruling") else ''}
            <div class="case-implications"><strong>Implications:</strong> {case.get("implications", "")}</div>
        </div>
        '''

    title = f'<h3 class="component-title">{config.title or "Legal Case Tracker"}</h3>'
    return f'''
    <div class="component legal-case-tracker-container {config.css_class}">
        {title}
        <div class="legal-cases">
            {cases_html}
        </div>
    </div>
    '''


def render_contract_analysis(data: Dict[str, Any], config: ComponentConfig) -> str:
    """
    Contract analysis panel for contract template.
    data: {contract: {name: str, value: str, duration: str, parties: [str], type: str},
           key_terms: [{term: str, details: str, risk_level: str}],
           obligations: [{party: str, obligation: str, deadline: str}],
           red_flags: [str], opportunities: [str]}
    """
    contract = data.get("contract", {})
    key_terms = data.get("key_terms", [])[:6]
    obligations = data.get("obligations", [])[:6]
    red_flags = data.get("red_flags", [])[:4]
    opportunities = data.get("opportunities", [])[:4]

    terms_html = ""
    for term in key_terms:
        risk = term.get("risk_level", "low")
        terms_html += f'''
        <div class="contract-term risk-{risk}">
            <span class="term-name">{term.get("term", "")}</span>
            <span class="term-details">{term.get("details", "")}</span>
            <span class="term-risk">{risk.upper()}</span>
        </div>
        '''

    obligations_html = ""
    for ob in obligations:
        obligations_html += f'''
        <div class="contract-obligation">
            <span class="obligation-party">{ob.get("party", "")}</span>
            <span class="obligation-text">{ob.get("obligation", "")}</span>
            <span class="obligation-deadline">{ob.get("deadline", "")}</span>
        </div>
        '''

    flags_html = "".join([f'<li class="red-flag">🚩 {f}</li>' for f in red_flags])
    opps_html = "".join([f'<li class="opportunity">✨ {o}</li>' for o in opportunities])

    title = f'<h3 class="component-title">{config.title or "Contract Analysis"}</h3>'
    return f'''
    <div class="component contract-analysis-container {config.css_class}">
        {title}
        <div class="contract-overview">
            <div class="contract-header">
                <h4 class="contract-name">{contract.get("name", "Contract")}</h4>
                <span class="contract-type">{contract.get("type", "")}</span>
            </div>
            <div class="contract-meta">
                <span class="contract-value">💰 {contract.get("value", "N/A")}</span>
                <span class="contract-duration">📅 {contract.get("duration", "N/A")}</span>
            </div>
        </div>
        <div class="contract-sections">
            <div class="key-terms-section">
                <h4>Key Terms</h4>
                <div class="terms-list">{terms_html}</div>
            </div>
            <div class="obligations-section">
                <h4>Obligations</h4>
                <div class="obligations-list">{obligations_html}</div>
            </div>
        </div>
        <div class="contract-assessment">
            <div class="red-flags-section">
                <h4>🚩 Red Flags</h4>
                <ul>{flags_html}</ul>
            </div>
            <div class="opportunities-section">
                <h4>✨ Opportunities</h4>
                <ul>{opps_html}</ul>
            </div>
        </div>
    </div>
    '''


def render_due_diligence_scorecard(data: Dict[str, Any], config: ComponentConfig) -> str:
    """
    Due diligence scorecard for due_diligence template.
    data: {overall_score: float, recommendation: str,
           categories: [{name: str, score: float, findings: [str], weight: float}],
           red_flags: [{issue: str, severity: str, details: str}],
           strengths: [str]}
    """
    overall = data.get("overall_score", 0)
    recommendation = data.get("recommendation", "Further Review Needed")
    categories = data.get("categories", [])
    red_flags = data.get("red_flags", [])[:5]
    strengths = data.get("strengths", [])[:5]

    overall_class = "pass" if overall >= 70 else "caution" if overall >= 50 else "fail"

    categories_html = ""
    for cat in categories:
        score = cat.get("score", 0)
        score_class = "pass" if score >= 70 else "caution" if score >= 50 else "fail"
        findings_html = "".join([f'<li>{f}</li>' for f in cat.get("findings", [])[:3]])

        categories_html += f'''
        <div class="dd-category">
            <div class="dd-category-header">
                <span class="category-name">{cat.get("name", "")}</span>
                <span class="category-score score-{score_class}">{score:.0f}</span>
            </div>
            <div class="category-bar">
                <div class="category-fill score-{score_class}" style="width: {score}%"></div>
            </div>
            <ul class="category-findings">{findings_html}</ul>
        </div>
        '''

    red_flags_html = ""
    for rf in red_flags:
        severity = rf.get("severity", "medium")
        red_flags_html += f'''
        <div class="dd-red-flag severity-{severity}">
            <span class="flag-icon">🚩</span>
            <span class="flag-issue">{rf.get("issue", "")}</span>
            <span class="flag-severity">{severity.upper()}</span>
        </div>
        '''

    strengths_html = "".join([f'<li class="dd-strength">✓ {s}</li>' for s in strengths])

    title = f'<h3 class="component-title">{config.title or "Due Diligence Scorecard"}</h3>'
    return f'''
    <div class="component due-diligence-scorecard-container {config.css_class}">
        {title}
        <div class="dd-scorecard">
            <div class="dd-overall score-{overall_class}">
                <div class="overall-score-circle">
                    <span class="overall-value">{overall:.0f}</span>
                    <span class="overall-label">/ 100</span>
                </div>
                <div class="overall-recommendation">{recommendation}</div>
            </div>
            <div class="dd-categories">
                <h4>Category Scores</h4>
                {categories_html}
            </div>
            <div class="dd-assessment">
                <div class="dd-red-flags">
                    <h4>Red Flags</h4>
                    {red_flags_html}
                </div>
                <div class="dd-strengths">
                    <h4>Strengths</h4>
                    <ul>{strengths_html}</ul>
                </div>
            </div>
        </div>
    </div>
    '''


def render_decision_matrix(data: Dict[str, Any], config: ComponentConfig) -> str:
    """
    Purchase decision matrix for purchase_decision template.
    data: {options: [{name: str, scores: {criterion: score}, price: str, recommendation: bool}],
           criteria: [{name: str, weight: float}], winner: str}
    """
    options = data.get("options", [])[:5]
    criteria = data.get("criteria", [])
    winner = data.get("winner", "")

    # Header
    header_html = '<th class="option-header">Criteria</th><th class="weight-header">Weight</th>'
    for opt in options:
        is_winner = opt.get("name", "") == winner
        header_html += f'<th class="option-name {"winner" if is_winner else ""}">{opt.get("name", "")} {"🏆" if is_winner else ""}</th>'

    # Criteria rows
    rows_html = ""
    for crit in criteria:
        crit_name = crit.get("name", "")
        weight = crit.get("weight", 1)
        row = f'<td class="criterion-name">{crit_name}</td><td class="criterion-weight">{weight:.1f}x</td>'

        for opt in options:
            score = opt.get("scores", {}).get(crit_name, 0)
            weighted = score * weight
            score_class = "high" if score >= 8 else "medium" if score >= 5 else "low"
            is_winner = opt.get("name", "") == winner
            row += f'<td class="score-cell {"winner-col" if is_winner else ""} score-{score_class}">{score:.1f}</td>'

        rows_html += f'<tr>{row}</tr>'

    # Total row
    total_row = '<td class="total-label"><strong>Weighted Total</strong></td><td></td>'
    for opt in options:
        total = sum(opt.get("scores", {}).get(c.get("name", ""), 0) * c.get("weight", 1) for c in criteria)
        is_winner = opt.get("name", "") == winner
        total_row += f'<td class="total-score {"winner-col" if is_winner else ""}"><strong>{total:.1f}</strong></td>'
    rows_html += f'<tr class="total-row">{total_row}</tr>'

    # Price row
    price_row = '<td class="price-label">Price</td><td></td>'
    for opt in options:
        is_winner = opt.get("name", "") == winner
        price_row += f'<td class="price-cell {"winner-col" if is_winner else ""}">{opt.get("price", "N/A")}</td>'
    rows_html += f'<tr class="price-row">{price_row}</tr>'

    title = f'<h3 class="component-title">{config.title or "Decision Matrix"}</h3>'
    return f'''
    <div class="component decision-matrix-container {config.css_class}">
        {title}
        <div class="matrix-wrapper">
            <table class="decision-matrix">
                <thead><tr>{header_html}</tr></thead>
                <tbody>{rows_html}</tbody>
            </table>
        </div>
        <div class="matrix-recommendation">
            <span class="recommendation-label">Recommended Choice:</span>
            <span class="recommendation-winner">🏆 {winner}</span>
        </div>
    </div>
    '''


def render_trust_dashboard(data: Dict[str, Any], config: ComponentConfig) -> str:
    """
    Trust/reputation dashboard for reputation template.
    data: {trust_score: float, verdict: str, verification_status: str,
           trust_factors: [{name: str, score: float, status: str}],
           user_sentiment: {positive: int, neutral: int, negative: int},
           red_flags: [str], green_flags: [str]}
    """
    trust_score = data.get("trust_score", 0)
    verdict = data.get("verdict", "Unknown")
    verification = data.get("verification_status", "unverified")
    factors = data.get("trust_factors", [])
    sentiment = data.get("user_sentiment", {})
    red_flags = data.get("red_flags", [])[:5]
    green_flags = data.get("green_flags", [])[:5]

    score_class = "trusted" if trust_score >= 70 else "caution" if trust_score >= 40 else "untrusted"

    factors_html = ""
    for factor in factors:
        status = factor.get("status", "neutral")
        factors_html += f'''
        <div class="trust-factor factor-{status}">
            <span class="factor-icon">{get_trust_icon(status)}</span>
            <span class="factor-name">{factor.get("name", "")}</span>
            <span class="factor-score">{factor.get("score", 0):.0f}%</span>
        </div>
        '''

    total_sentiment = sentiment.get("positive", 0) + sentiment.get("neutral", 0) + sentiment.get("negative", 0)
    pos_pct = (sentiment.get("positive", 0) / total_sentiment * 100) if total_sentiment > 0 else 0
    neu_pct = (sentiment.get("neutral", 0) / total_sentiment * 100) if total_sentiment > 0 else 0
    neg_pct = (sentiment.get("negative", 0) / total_sentiment * 100) if total_sentiment > 0 else 0

    red_html = "".join([f'<li class="flag-item red">🚩 {f}</li>' for f in red_flags])
    green_html = "".join([f'<li class="flag-item green">✓ {f}</li>' for f in green_flags])

    title = f'<h3 class="component-title">{config.title or "Trust Assessment"}</h3>'
    return f'''
    <div class="component trust-dashboard-container {config.css_class}">
        {title}
        <div class="trust-dashboard">
            <div class="trust-score-panel score-{score_class}">
                <div class="trust-score-circle">
                    <span class="trust-value">{trust_score:.0f}</span>
                </div>
                <div class="trust-verdict">{verdict}</div>
                <div class="trust-verification verification-{verification}">{verification.replace("_", " ").title()}</div>
            </div>
            <div class="trust-factors-panel">
                <h4>Trust Factors</h4>
                {factors_html}
            </div>
            <div class="sentiment-panel">
                <h4>User Sentiment</h4>
                <div class="sentiment-bar">
                    <div class="sentiment-positive" style="width: {pos_pct}%"></div>
                    <div class="sentiment-neutral" style="width: {neu_pct}%"></div>
                    <div class="sentiment-negative" style="width: {neg_pct}%"></div>
                </div>
                <div class="sentiment-labels">
                    <span class="positive">👍 {sentiment.get("positive", 0)}</span>
                    <span class="neutral">😐 {sentiment.get("neutral", 0)}</span>
                    <span class="negative">👎 {sentiment.get("negative", 0)}</span>
                </div>
            </div>
            <div class="flags-panel">
                <div class="red-flags">
                    <h4>Concerns</h4>
                    <ul>{red_html}</ul>
                </div>
                <div class="green-flags">
                    <h4>Positives</h4>
                    <ul>{green_html}</ul>
                </div>
            </div>
        </div>
    </div>
    '''


def get_trust_icon(status: str) -> str:
    """Get icon for trust factor status."""
    icons = {"positive": "✓", "negative": "✗", "neutral": "○", "warning": "⚠"}
    return icons.get(status, "○")


def render_event_explainer(data: Dict[str, Any], config: ComponentConfig) -> str:
    """
    Event explanation panel for understanding template.
    data: {event: {title: str, date: str, summary: str},
           what_happened: str, why_it_matters: str,
           key_players: [{name: str, role: str, action: str}],
           timeline: [{date: str, event: str}],
           implications: [{area: str, impact: str}],
           different_perspectives: [{perspective: str, view: str}]}
    """
    event = data.get("event", {})
    what = data.get("what_happened", "")
    why = data.get("why_it_matters", "")
    players = data.get("key_players", [])[:5]
    timeline = data.get("timeline", [])[:6]
    implications = data.get("implications", [])[:4]
    perspectives = data.get("different_perspectives", [])[:3]

    players_html = ""
    for player in players:
        players_html += f'''
        <div class="key-player">
            <span class="player-name">{player.get("name", "")}</span>
            <span class="player-role">{player.get("role", "")}</span>
            <span class="player-action">{player.get("action", "")}</span>
        </div>
        '''

    timeline_html = ""
    for item in timeline:
        timeline_html += f'''
        <div class="timeline-item">
            <span class="timeline-date">{item.get("date", "")}</span>
            <span class="timeline-event">{item.get("event", "")}</span>
        </div>
        '''

    implications_html = ""
    for imp in implications:
        implications_html += f'''
        <div class="implication-item">
            <span class="implication-area">{imp.get("area", "")}</span>
            <span class="implication-impact">{imp.get("impact", "")}</span>
        </div>
        '''

    perspectives_html = ""
    for persp in perspectives:
        perspectives_html += f'''
        <div class="perspective-item">
            <span class="perspective-name">{persp.get("perspective", "")}</span>
            <p class="perspective-view">{persp.get("view", "")}</p>
        </div>
        '''

    title = f'<h3 class="component-title">{config.title or "Event Explained"}</h3>'
    return f'''
    <div class="component event-explainer-container {config.css_class}">
        {title}
        <div class="event-explainer">
            <div class="event-header">
                <h2 class="event-title">{event.get("title", "")}</h2>
                <span class="event-date">{event.get("date", "")}</span>
            </div>
            <div class="event-summary">{event.get("summary", "")}</div>

            <div class="explainer-sections">
                <div class="what-happened">
                    <h4>📖 What Happened</h4>
                    <p>{what}</p>
                </div>
                <div class="why-matters">
                    <h4>💡 Why It Matters</h4>
                    <p>{why}</p>
                </div>
            </div>

            <div class="key-players-section">
                <h4>👥 Key Players</h4>
                <div class="players-grid">{players_html}</div>
            </div>

            <div class="event-timeline-section">
                <h4>📅 Timeline</h4>
                <div class="mini-timeline">{timeline_html}</div>
            </div>

            <div class="implications-section">
                <h4>🎯 Implications</h4>
                <div class="implications-grid">{implications_html}</div>
            </div>

            <div class="perspectives-section">
                <h4>🔍 Different Perspectives</h4>
                <div class="perspectives-list">{perspectives_html}</div>
            </div>
        </div>
    </div>
    '''


# =============================================================================
# COMPONENT REGISTRY AND RENDERER
# =============================================================================

COMPONENT_RENDERERS = {
    # Common components
    ComponentType.VERDICT_HERO: render_verdict_hero,
    ComponentType.METRIC_CARDS: render_metric_cards,
    ComponentType.FINDINGS_TABLE: render_findings_table,
    ComponentType.TIMELINE: render_timeline,
    ComponentType.QUOTE_CAROUSEL: render_quote_carousel,
    ComponentType.RISK_MATRIX: render_risk_matrix,
    ComponentType.CHECKLIST: render_checklist,
    ComponentType.SOURCE_LIST: render_source_list,
    ComponentType.PREDICTION_CARDS: render_prediction_cards,
    ComponentType.KEY_INSIGHTS: render_key_insights,
    ComponentType.EXECUTIVE_SUMMARY: render_executive_summary,
    ComponentType.CONFIDENCE_GAUGE: render_confidence_gauge,
    ComponentType.ACTION_ITEMS: render_action_items,
    ComponentType.PROS_CONS: render_pros_cons,
    ComponentType.COMPARISON_TABLE: render_comparison_table,

    # Template-specific components
    ComponentType.TECH_RADAR: render_tech_radar,
    ComponentType.INVESTMENT_THESIS: render_investment_thesis,
    ComponentType.COMPETITOR_MATRIX: render_competitor_matrix,
    ComponentType.INVESTIGATION_TIMELINE: render_investigation_timeline,
    ComponentType.LEGAL_CASE_TRACKER: render_legal_case_tracker,
    ComponentType.CONTRACT_ANALYSIS: render_contract_analysis,
    ComponentType.DUE_DILIGENCE_SCORECARD: render_due_diligence_scorecard,
    ComponentType.DECISION_MATRIX: render_decision_matrix,
    ComponentType.TRUST_DASHBOARD: render_trust_dashboard,
    ComponentType.EVENT_EXPLAINER: render_event_explainer,
}


def render_component(component_type: ComponentType, data: Dict[str, Any], config: ComponentConfig = None) -> str:
    """Render a single component."""
    if config is None:
        config = ComponentConfig(component_type=component_type)

    renderer = COMPONENT_RENDERERS.get(component_type)
    if renderer:
        return renderer(data, config)
    return f'<!-- Unknown component: {component_type} -->'


def render_components(components: List[tuple], report_data: Dict[str, Any]) -> Dict[str, str]:
    """
    Render multiple components and return organized by position.
    components: [(ComponentType, ComponentConfig)]
    Returns: {position: html_string}
    """
    rendered = {"hero": "", "main": "", "sidebar": ""}

    # Sort by priority
    sorted_components = sorted(components, key=lambda x: x[1].priority if x[1] else 50, reverse=True)

    for comp_type, config in sorted_components:
        if config is None:
            config = ComponentConfig(component_type=comp_type)

        # Get data for this component from report_data
        data_key = comp_type.value
        component_data = report_data.get(data_key, {})

        html = render_component(comp_type, component_data, config)
        position = config.position
        rendered[position] = rendered.get(position, "") + html

    return rendered


# =============================================================================
# TEMPLATE REPORT HINTS DEFINITIONS
# =============================================================================

TEMPLATE_REPORT_HINTS = {
    "tech_market": ReportHints(
        template_type="tech_market",
        structure="quantitative_first",
        findings_grouping="category",
        tone="analytical",
        decision_format="recommendation",
        emphasis=["adoption_metrics", "market_trends", "technology_comparison"],
        required_components=[
            ComponentType.TECH_RADAR,
            ComponentType.METRIC_CARDS,
            ComponentType.FINDINGS_TABLE,
        ],
        optional_components=[
            ComponentType.TIMELINE,
            ComponentType.COMPARISON_TABLE,
            ComponentType.PREDICTION_CARDS,
            ComponentType.KEY_INSIGHTS,
        ],
        visualization_preference=["tech_radar", "adoption_chart", "comparison_matrix"],
    ),

    "financial": ReportHints(
        template_type="financial",
        structure="quantitative_first",
        findings_grouping="sentiment",
        tone="analytical",
        decision_format="thesis",
        emphasis=["valuation", "risk_assessment", "financial_metrics"],
        required_components=[
            ComponentType.INVESTMENT_THESIS,
            ComponentType.METRIC_CARDS,
            ComponentType.RISK_MATRIX,
        ],
        optional_components=[
            ComponentType.FINDINGS_TABLE,
            ComponentType.PREDICTION_CARDS,
            ComponentType.COMPARISON_TABLE,
            ComponentType.CONFIDENCE_GAUGE,
        ],
        visualization_preference=["financial_metrics", "risk_matrix", "peer_comparison"],
    ),

    "competitive": ReportHints(
        template_type="competitive",
        structure="balanced",
        findings_grouping="category",
        tone="analytical",
        decision_format="matrix",
        emphasis=["market_position", "competitive_advantages", "strategic_gaps"],
        required_components=[
            ComponentType.COMPETITOR_MATRIX,
            ComponentType.COMPARISON_TABLE,
            ComponentType.METRIC_CARDS,
        ],
        optional_components=[
            ComponentType.FINDINGS_TABLE,
            ComponentType.PROS_CONS,
            ComponentType.KEY_INSIGHTS,
            ComponentType.ACTION_ITEMS,
        ],
        visualization_preference=["competitor_matrix", "market_share_chart", "swot_grid"],
    ),

    "investigative": ReportHints(
        template_type="investigative",
        structure="narrative_first",
        findings_grouping="chronological",
        tone="investigative",
        decision_format="recommendation",
        emphasis=["evidence", "timeline", "key_actors", "implications"],
        required_components=[
            ComponentType.INVESTIGATION_TIMELINE,
            ComponentType.FINDINGS_TABLE,
            ComponentType.QUOTE_CAROUSEL,
        ],
        optional_components=[
            ComponentType.KEY_INSIGHTS,
            ComponentType.RISK_MATRIX,
            ComponentType.CHECKLIST,
            ComponentType.SOURCE_LIST,
        ],
        visualization_preference=["investigation_timeline", "evidence_network", "actor_map"],
    ),

    "legal": ReportHints(
        template_type="legal",
        structure="narrative_first",
        findings_grouping="category",
        tone="professional",
        decision_format="recommendation",
        emphasis=["legal_precedents", "regulatory_implications", "compliance_requirements"],
        required_components=[
            ComponentType.LEGAL_CASE_TRACKER,
            ComponentType.FINDINGS_TABLE,
            ComponentType.TIMELINE,
        ],
        optional_components=[
            ComponentType.KEY_INSIGHTS,
            ComponentType.CHECKLIST,
            ComponentType.RISK_MATRIX,
            ComponentType.ACTION_ITEMS,
        ],
        visualization_preference=["case_timeline", "jurisdiction_map", "precedent_chain"],
    ),

    "contract": ReportHints(
        template_type="contract",
        structure="balanced",
        findings_grouping="category",
        tone="professional",
        decision_format="checklist",
        emphasis=["key_terms", "obligations", "risks", "opportunities"],
        required_components=[
            ComponentType.CONTRACT_ANALYSIS,
            ComponentType.CHECKLIST,
            ComponentType.RISK_MATRIX,
        ],
        optional_components=[
            ComponentType.FINDINGS_TABLE,
            ComponentType.ACTION_ITEMS,
            ComponentType.COMPARISON_TABLE,
            ComponentType.KEY_INSIGHTS,
        ],
        visualization_preference=["contract_structure", "obligation_timeline", "risk_assessment"],
    ),

    "due_diligence": ReportHints(
        template_type="due_diligence",
        structure="verdict_first",
        findings_grouping="category",
        tone="professional",
        decision_format="scorecard",
        emphasis=["overall_assessment", "red_flags", "strengths", "category_scores"],
        required_components=[
            ComponentType.DUE_DILIGENCE_SCORECARD,
            ComponentType.CHECKLIST,
            ComponentType.FINDINGS_TABLE,
        ],
        optional_components=[
            ComponentType.RISK_MATRIX,
            ComponentType.KEY_INSIGHTS,
            ComponentType.ACTION_ITEMS,
            ComponentType.TIMELINE,
        ],
        visualization_preference=["scorecard", "category_radar", "red_flag_matrix"],
    ),

    "purchase_decision": ReportHints(
        template_type="purchase_decision",
        structure="verdict_first",
        findings_grouping="category",
        tone="advisory",
        decision_format="matrix",
        emphasis=["recommendation", "comparison", "value_assessment", "user_fit"],
        required_components=[
            ComponentType.DECISION_MATRIX,
            ComponentType.VERDICT_HERO,
            ComponentType.PROS_CONS,
        ],
        optional_components=[
            ComponentType.COMPARISON_TABLE,
            ComponentType.METRIC_CARDS,
            ComponentType.CHECKLIST,
            ComponentType.QUOTE_CAROUSEL,
        ],
        visualization_preference=["decision_matrix", "comparison_chart", "value_radar"],
    ),

    "reputation": ReportHints(
        template_type="reputation",
        structure="verdict_first",
        findings_grouping="sentiment",
        tone="advisory",
        decision_format="checklist",
        emphasis=["trust_score", "red_flags", "user_sentiment", "verification"],
        required_components=[
            ComponentType.TRUST_DASHBOARD,
            ComponentType.CHECKLIST,
            ComponentType.FINDINGS_TABLE,
        ],
        optional_components=[
            ComponentType.QUOTE_CAROUSEL,
            ComponentType.TIMELINE,
            ComponentType.KEY_INSIGHTS,
            ComponentType.SOURCE_LIST,
        ],
        visualization_preference=["trust_gauge", "sentiment_chart", "verification_checklist"],
    ),

    "understanding": ReportHints(
        template_type="understanding",
        structure="narrative_first",
        findings_grouping="chronological",
        tone="educational",
        decision_format="recommendation",
        emphasis=["context", "explanation", "implications", "perspectives"],
        required_components=[
            ComponentType.EVENT_EXPLAINER,
            ComponentType.TIMELINE,
            ComponentType.KEY_INSIGHTS,
        ],
        optional_components=[
            ComponentType.FINDINGS_TABLE,
            ComponentType.QUOTE_CAROUSEL,
            ComponentType.PREDICTION_CARDS,
            ComponentType.SOURCE_LIST,
        ],
        visualization_preference=["event_timeline", "stakeholder_map", "impact_diagram"],
    ),
}


def get_report_hints(template_type: str) -> ReportHints:
    """Get report hints for a template type."""
    return TEMPLATE_REPORT_HINTS.get(template_type, ReportHints(template_type=template_type))


def get_default_components(template_type: str) -> List[tuple]:
    """Get default component configuration for a template type."""
    hints = get_report_hints(template_type)
    components = []

    # Add required components with high priority
    for i, comp in enumerate(hints.required_components):
        config = ComponentConfig(
            component_type=comp,
            priority=90 - i * 5,
            position="main" if comp not in [ComponentType.VERDICT_HERO] else "hero"
        )
        components.append((comp, config))

    # Add optional components with lower priority
    for i, comp in enumerate(hints.optional_components):
        config = ComponentConfig(
            component_type=comp,
            priority=50 - i * 5,
            position="main"
        )
        components.append((comp, config))

    return components
