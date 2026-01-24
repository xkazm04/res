"""
Component CSS Styles - Swiss Design System (Compact)
Styles matched to actual component output class names.
"""

def get_component_styles() -> str:
    return """
:root {
    --c-primary: #1a1a2e; --c-accent: #0f4c75; --c-success: #059669; --c-warning: #d97706; --c-danger: #dc2626;
    --c-bg: #fafafa; --c-surface: #fff; --c-border: #e5e5e5; --c-border-light: #f0f0f0;
    --c-text: #171717; --c-text-secondary: #525252; --c-muted: #737373; --c-text-faint: #a3a3a3;
    --s-1: 2px; --s-2: 4px; --s-3: 6px; --s-4: 8px; --s-5: 10px; --s-6: 12px; --s-8: 16px;
    --font-sans: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
    --font-mono: 'SF Mono', 'Consolas', 'Monaco', monospace;
    --text-xs: 10px; --text-sm: 11px; --text-base: 12px; --text-md: 13px; --text-lg: 14px; --text-xl: 16px;
    --r-sm: 2px; --r-md: 3px; --r-lg: 4px;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--font-sans); font-size: var(--text-base); line-height: 1.4; color: var(--c-text); background: var(--c-bg); }

/* Layout */
.report-shell { display: grid; grid-template-columns: 200px 1fr; min-height: 100vh; max-width: 1400px; margin: 0 auto; }
.report-sidebar { background: var(--c-primary); color: #fff; padding: var(--s-8); position: sticky; top: 0; height: 100vh; overflow-y: auto; display: flex; flex-direction: column; }
.sidebar-header { padding-bottom: var(--s-6); border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: var(--s-6); }
.sidebar-badge { display: inline-block; padding: 2px 8px; background: var(--c-accent); border-radius: var(--r-md); font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
.sidebar-nav { display: flex; flex-direction: column; gap: var(--s-1); }
.nav-item { display: flex; align-items: center; gap: var(--s-3); padding: var(--s-3) var(--s-4); border-radius: var(--r-md); font-size: var(--text-sm); cursor: pointer; color: rgba(255,255,255,0.7); border: none; background: transparent; width: 100%; text-align: left; transition: all 0.15s; }
.nav-item:hover { background: rgba(255,255,255,0.1); color: #fff; }
.nav-item.active { background: var(--c-accent); color: #fff; }
.nav-icon { width: 16px; text-align: center; }
.sidebar-stats { margin-top: auto; padding-top: var(--s-6); border-top: 1px solid rgba(255,255,255,0.1); }
.stat-row { display: flex; justify-content: space-between; font-size: var(--text-xs); padding: var(--s-2) 0; color: rgba(255,255,255,0.6); }
.stat-value { font-weight: 600; color: #fff; font-family: var(--font-mono); }
.report-main { padding: var(--s-8); background: var(--c-bg); overflow-y: auto; }
.report-header-compact { padding: var(--s-4) 0; margin-bottom: var(--s-6); border-bottom: 1px solid var(--c-border); }
.report-title-compact { font-size: var(--text-lg); font-weight: 600; margin: 0; }
.generated-meta { font-size: var(--text-xs); color: var(--c-muted); margin-top: var(--s-2); }

/* Base Component */
.component { background: var(--c-surface); border: 1px solid var(--c-border); border-radius: var(--r-lg); margin-bottom: var(--s-6); overflow: hidden; }
.component-title { font-size: var(--text-sm); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 var(--s-4) 0; padding: var(--s-4) var(--s-6); border-bottom: 1px solid var(--c-border-light); background: var(--c-bg); }

/* Verdict Hero */
.verdict-hero { display: flex; align-items: center; gap: var(--s-6); padding: var(--s-6); color: #fff; border: none; }
.verdict-hero.verdict-green { background: linear-gradient(135deg, #059669, #047857); }
.verdict-hero.verdict-yellow { background: linear-gradient(135deg, #d97706, #b45309); }
.verdict-hero.verdict-red { background: linear-gradient(135deg, #dc2626, #b91c1c); }
.verdict-hero.verdict-blue { background: linear-gradient(135deg, #0284c7, #0369a1); }
.verdict-score-ring { width: 64px; height: 64px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.verdict-score { font-size: var(--text-xl); font-weight: 700; font-family: var(--font-mono); }
.verdict-content { flex: 1; }
.verdict-headline { font-size: var(--text-lg); font-weight: 600; margin-bottom: var(--s-1); }
.verdict-subtext { font-size: var(--text-sm); opacity: 0.9; margin: 0; }
.verdict-detail { font-size: var(--text-xs); opacity: 0.8; margin-top: var(--s-2); }

/* Metric Cards */
.metric-cards-container { padding: var(--s-4); }
.metric-cards-container .component-title { margin: 0 0 var(--s-4) 0; padding: 0; border: none; background: none; }
.metric-cards-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: var(--s-3); }
.metric-card { padding: var(--s-4); background: var(--c-bg); border-radius: var(--r-md); text-align: center; border: 1px solid var(--c-border-light); }
.metric-value { font-size: var(--text-lg); font-weight: 700; font-family: var(--font-mono); color: var(--c-text); }
.metric-label { font-size: 9px; color: var(--c-muted); text-transform: uppercase; margin-top: var(--s-1); }
.trend-up { color: var(--c-success); }
.trend-down { color: var(--c-danger); }

/* Findings List - Card Layout with Analysis */
.findings-container { padding: var(--s-4); }
.findings-list { display: flex; flex-direction: column; gap: 0; }
.finding-item { padding: var(--s-4); border-bottom: 1px solid var(--c-border); }
.finding-item:last-child { border-bottom: none; }
.finding-header { display: flex; align-items: center; gap: var(--s-3); margin-bottom: var(--s-2); flex-wrap: wrap; }
.finding-type-badge { display: inline-block; padding: 2px 6px; border-radius: 2px; font-size: 9px; font-weight: 600; text-transform: uppercase; background: var(--c-border); color: var(--c-text-secondary); }
.finding-type-badge.market_trend { background: #dbeafe; color: #1e40af; }
.finding-type-badge.tech_trend { background: #cffafe; color: #0e7490; }
.finding-type-badge.adoption_pattern { background: #d1fae5; color: #047857; }
.finding-type-badge.financial_metric { background: #fef3c7; color: #92400e; }
.finding-type-badge.prediction { background: #fce7f3; color: #9d174d; }
.finding-type-badge.red_flag { background: #fee2e2; color: #991b1b; }
.finding-type-badge.warning_sign { background: #fef3c7; color: #b45309; }
.finding-type-badge.trust_signal { background: #dcfce7; color: #166534; }
.finding-type-badge.bullish_signal { background: #dcfce7; color: #15803d; }
.finding-type-badge.bearish_signal { background: #fee2e2; color: #b91c1c; }
.finding-type-badge.risk { background: #fee2e2; color: #991b1b; }
.finding-type-badge.event { background: #e0e7ff; color: #4338ca; }
.finding-type-badge.revelation { background: #fae8ff; color: #a21caf; }
.finding-type-badge.evidence { background: #ccfbf1; color: #0f766e; }
.finding-type-badge.product_strength { background: #dcfce7; color: #166534; }
.finding-type-badge.recommendation { background: #dbeafe; color: #1d4ed8; }
.finding-type-badge.comparison { background: #f3e8ff; color: #7c3aed; }
.finding-date { font-size: var(--text-xs); color: var(--c-muted); }
.confidence-badge { display: inline-block; padding: 2px 6px; border-radius: 2px; font-size: 9px; font-weight: 600; font-family: var(--font-mono); margin-left: auto; }
.confidence-badge.high { background: #dcfce7; color: #166534; }
.confidence-badge.medium { background: #fef3c7; color: #92400e; }
.confidence-badge.low { background: #fee2e2; color: #991b1b; }
.finding-summary { font-size: var(--text-sm); font-weight: 500; color: var(--c-text); line-height: 1.4; margin-bottom: var(--s-2); }
.finding-analysis { font-size: var(--text-sm); color: var(--c-text); line-height: 1.5; padding-top: var(--s-2); border-top: 1px solid var(--c-border-light); margin-top: var(--s-2); }

/* Timeline */
.timeline-container { padding: var(--s-4); }
.timeline { position: relative; padding-left: 20px; }
.timeline::before { content: ''; position: absolute; left: 4px; top: 0; bottom: 0; width: 2px; background: var(--c-border); }
.timeline-event { position: relative; padding-bottom: var(--s-5); }
.timeline-marker { position: absolute; left: -20px; top: 4px; width: 10px; height: 10px; border-radius: 50%; background: var(--c-accent); border: 2px solid var(--c-surface); }
.timeline-event.timeline-critical .timeline-marker { background: var(--c-danger); }
.timeline-date { font-size: var(--text-xs); color: var(--c-text-faint); margin-bottom: 2px; }
.timeline-title { font-size: var(--text-sm); font-weight: 500; color: var(--c-text); }
.timeline-desc { font-size: var(--text-xs); color: var(--c-muted); margin-top: 2px; line-height: 1.4; }

/* Quote Carousel */
.quote-carousel-container { padding: var(--s-4); }
.quote-carousel { position: relative; }
.quote-slide { display: none; padding: var(--s-4); background: var(--c-bg); border-radius: var(--r-md); border-left: 3px solid var(--c-accent); }
.quote-slide.active { display: block; }
.quote-text { font-size: var(--text-sm); line-height: 1.5; color: var(--c-text); font-style: italic; margin-bottom: var(--s-3); }
.quote-source { font-size: var(--text-xs); color: var(--c-muted); }
.carousel-controls { display: flex; align-items: center; justify-content: center; gap: var(--s-4); margin-top: var(--s-4); }
.carousel-btn { width: 28px; height: 28px; border-radius: 50%; border: 1px solid var(--c-border); background: var(--c-surface); cursor: pointer; font-size: var(--text-lg); display: flex; align-items: center; justify-content: center; }
.carousel-btn:hover { background: var(--c-bg); }
.carousel-dots { display: flex; gap: var(--s-2); }
.carousel-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--c-border); cursor: pointer; }
.carousel-dot.active { background: var(--c-accent); }

/* Risk Matrix */
.risk-matrix-container { padding: var(--s-4); }
.risk-matrix { position: relative; }
.risk-y-axis { position: absolute; left: 0; top: 0; bottom: 30px; width: 30px; display: flex; flex-direction: column; align-items: center; justify-content: space-between; font-size: 8px; color: var(--c-muted); }
.risk-grid { margin-left: 35px; margin-bottom: 25px; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; height: 200px; border: 1px solid var(--c-border); position: relative; }
.risk-quadrant { display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 600; text-transform: uppercase; }
.risk-quadrant.risk-critical { background: #fee2e2; color: #991b1b; }
.risk-quadrant.risk-high { background: #fef3c7; color: #92400e; }
.risk-quadrant.risk-medium { background: #fef9c3; color: #a16207; }
.risk-quadrant.risk-low { background: #dcfce7; color: #166534; }
.risk-x-axis { margin-left: 35px; display: flex; justify-content: space-between; font-size: 8px; color: var(--c-muted); }
.axis-label { font-weight: 600; }
.risk-item { position: absolute; transform: translate(-50%, -50%); z-index: 1; }
.risk-dot { width: 12px; height: 12px; border-radius: 50%; background: var(--c-danger); border: 2px solid var(--c-surface); box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
.risk-label { display: none; position: absolute; top: 100%; left: 50%; transform: translateX(-50%); font-size: 8px; white-space: nowrap; background: var(--c-surface); padding: 2px 4px; border-radius: 2px; }
.risk-item:hover .risk-label { display: block; }

/* Checklist */
.checklist-container { padding: var(--s-4); }
.checklist { list-style: none; }
.checklist-item { display: flex; align-items: flex-start; gap: var(--s-3); padding: var(--s-3); border-bottom: 1px solid var(--c-border-light); }
.checklist-item:last-child { border-bottom: none; }
.checklist-icon { width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; font-size: var(--text-sm); flex-shrink: 0; }
.checklist-item.checklist-checked .checklist-icon { color: var(--c-success); }
.checklist-item.checklist-critical .checklist-icon { color: var(--c-danger); }
.checklist-text { flex: 1; font-size: var(--text-sm); color: var(--c-text); }
.checklist-detail { display: block; font-size: var(--text-xs); color: var(--c-muted); margin-top: 2px; }

/* Source List */
.source-list-container { padding: var(--s-4); }
.source-list { list-style: none; }
.source-item { display: flex; align-items: center; gap: var(--s-3); padding: var(--s-2) 0; border-bottom: 1px solid var(--c-border-light); font-size: var(--text-xs); }
.source-item:last-child { border-bottom: none; }
.source-credibility-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.source-item.source-high .source-credibility-dot { background: var(--c-success); }
.source-item.source-medium .source-credibility-dot { background: var(--c-warning); }
.source-item.source-low .source-credibility-dot { background: var(--c-danger); }
.source-link { flex: 1; color: var(--c-accent); text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.source-link:hover { text-decoration: underline; }
.source-meta { display: flex; gap: var(--s-3); color: var(--c-muted); }
.source-type { text-transform: uppercase; font-size: 8px; padding: 1px 4px; background: var(--c-border); border-radius: 2px; }

/* Prediction Cards */
.prediction-cards-container { padding: var(--s-4); }
.prediction-cards { display: flex; flex-direction: column; gap: var(--s-3); }
.prediction-card { padding: var(--s-4); background: var(--c-bg); border-radius: var(--r-md); border-left: 3px solid var(--c-border); }
.prediction-card.prediction-high { border-left-color: var(--c-success); }
.prediction-card.prediction-medium { border-left-color: var(--c-warning); }
.prediction-card.prediction-low { border-left-color: var(--c-danger); }
.prediction-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--s-2); }
.prediction-confidence { font-size: 9px; font-weight: 600; padding: 2px 6px; border-radius: 2px; background: var(--c-border); }
.prediction-card.prediction-high .prediction-confidence { background: #dcfce7; color: #166534; }
.prediction-card.prediction-medium .prediction-confidence { background: #fef3c7; color: #92400e; }
.prediction-card.prediction-low .prediction-confidence { background: #fee2e2; color: #991b1b; }
.prediction-timeline { font-size: var(--text-xs); color: var(--c-muted); }
.prediction-text { font-size: var(--text-sm); font-weight: 500; margin-bottom: var(--s-2); }
.prediction-rationale { font-size: var(--text-xs); color: var(--c-muted); line-height: 1.4; }
.prediction-footer { font-size: 9px; color: var(--c-text-faint); margin-top: var(--s-2); }

/* Key Insights */
.key-insights-container { padding: var(--s-4); }
.insights-list { display: flex; flex-direction: column; gap: 0; }
.insight-item { padding: var(--s-4); border-bottom: 1px solid var(--c-border); }
.insight-item:last-child { border-bottom: none; }
.insight-item.insight-high { background: #fffbeb; }
.insight-header { display: flex; align-items: flex-start; gap: var(--s-3); }
.insight-text { flex: 1; font-size: var(--text-sm); font-weight: 500; color: var(--c-text); line-height: 1.4; }
.insight-category { font-size: 9px; padding: 2px 6px; background: var(--c-border); border-radius: 2px; white-space: nowrap; flex-shrink: 0; }
.insight-description { font-size: var(--text-sm); color: var(--c-text); line-height: 1.5; padding-top: var(--s-2); border-top: 1px solid var(--c-border-light); margin-top: var(--s-3); }

/* Executive Summary */
.executive-summary-container { padding: var(--s-4); }
.summary-content { }
.summary-text { font-size: var(--text-sm); line-height: 1.6; color: var(--c-text); margin-bottom: var(--s-4); }
.summary-points { margin: var(--s-4) 0; padding-left: var(--s-8); }
.summary-points li { font-size: var(--text-sm); margin-bottom: var(--s-2); line-height: 1.4; }

/* Confidence Gauge */
.confidence-gauge-container { padding: var(--s-4); }
.gauge-wrapper { display: flex; justify-content: center; margin-bottom: var(--s-4); }
.gauge-circle { position: relative; width: 100px; height: 100px; }
.gauge-circle svg { transform: rotate(-90deg); width: 100%; height: 100%; }
.gauge-bg { fill: none; stroke: var(--c-border); stroke-width: 8; }
.gauge-fill { fill: none; stroke-width: 8; stroke-linecap: round; }
.gauge-circle.gauge-green .gauge-fill { stroke: var(--c-success); }
.gauge-circle.gauge-yellow .gauge-fill { stroke: var(--c-warning); }
.gauge-circle.gauge-red .gauge-fill { stroke: var(--c-danger); }
.gauge-value { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: var(--text-xl); font-weight: 700; font-family: var(--font-mono); }
.gauge-factors { display: flex; flex-direction: column; gap: var(--s-2); }
.gauge-factor { display: flex; align-items: center; gap: var(--s-3); font-size: var(--text-xs); }
.factor-name { flex: 1; color: var(--c-text-secondary); }
.factor-bar { flex: 2; height: 6px; background: var(--c-border); border-radius: 3px; overflow: hidden; }
.factor-fill { height: 100%; background: var(--c-accent); border-radius: 3px; }
.factor-score { width: 35px; text-align: right; font-family: var(--font-mono); font-weight: 500; }

/* Pros & Cons */
.pros-cons-container { padding: var(--s-4); }
.pros-cons-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--s-4); }
.pros-column { padding: var(--s-4); border-radius: var(--r-md); background: #f0fdf4; }
.cons-column { padding: var(--s-4); border-radius: var(--r-md); background: #fef2f2; }
.column-header { font-size: var(--text-xs); font-weight: 600; text-transform: uppercase; margin-bottom: var(--s-3); }
.pros-header { color: #166534; }
.cons-header { color: #991b1b; }
.pros-list, .cons-list { list-style: none; }
.pro-item, .con-item { display: flex; align-items: flex-start; gap: var(--s-2); font-size: var(--text-xs); padding: var(--s-1) 0; line-height: 1.4; }

/* Comparison Table */
.comparison-table-container { overflow: hidden; }
.table-wrapper { overflow-x: auto; }
.comparison-table { width: 100%; border-collapse: collapse; font-size: var(--text-xs); }
.comparison-table th, .comparison-table td { padding: var(--s-2) var(--s-3); border: 1px solid var(--c-border); text-align: left; }
.comparison-table th { background: var(--c-bg); font-weight: 600; text-transform: uppercase; font-size: 9px; }

/* Tech Radar */
.tech-radar-container { padding: var(--s-4); }
.tech-radar { position: relative; width: 100%; max-width: 400px; margin: 0 auto; aspect-ratio: 1; }
.radar-rings { position: absolute; inset: 0; }
.radar-ring { position: absolute; border-radius: 50%; border: 1px solid var(--c-border); display: flex; align-items: flex-start; justify-content: center; padding-top: 8px; }
.radar-ring span { font-size: 8px; color: var(--c-muted); text-transform: uppercase; background: var(--c-surface); padding: 0 4px; }
.radar-ring.ring-hold { inset: 0%; background: #fef2f2; }
.radar-ring.ring-assess { inset: 12.5%; background: #fef9c3; }
.radar-ring.ring-trial { inset: 25%; background: #ecfdf5; }
.radar-ring.ring-adopt { inset: 37.5%; background: #dcfce7; }
.radar-quadrants { position: absolute; inset: 0; pointer-events: none; }
.quadrant-label { position: absolute; font-size: 9px; color: var(--c-muted); text-transform: uppercase; }
.quadrant-label.q-techniques { top: 50%; left: 5px; transform: translateY(-50%); }
.quadrant-label.q-tools { top: 5px; left: 50%; transform: translateX(-50%); }
.quadrant-label.q-platforms { top: 50%; right: 5px; transform: translateY(-50%); }
.quadrant-label.q-languages { bottom: 5px; left: 50%; transform: translateX(-50%); }
.radar-blips { position: absolute; inset: 0; }
.radar-blip { position: absolute; top: 50%; left: 50%; font-size: 8px; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%) rotate(var(--angle)) translateY(calc(-1 * var(--radius))) rotate(calc(-1 * var(--angle))); }
.blip-label { background: var(--c-surface); padding: 1px 4px; border-radius: 2px; white-space: nowrap; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.radar-legend { display: flex; justify-content: center; gap: var(--s-4); margin-top: var(--s-4); font-size: var(--text-xs); }
.legend-item { display: flex; align-items: center; gap: 4px; }
.legend-dot { width: 10px; height: 10px; border-radius: 50%; }
.legend-dot.ring-adopt { background: #10b981; }
.legend-dot.ring-trial { background: #22c55e; }
.legend-dot.ring-assess { background: #eab308; }
.legend-dot.ring-hold { background: #ef4444; }

/* Investment Thesis */
.investment-thesis-container { padding: var(--s-4); }
.thesis-panel { display: flex; flex-direction: column; gap: var(--s-4); }
.thesis-header { display: flex; align-items: center; justify-content: space-between; padding: var(--s-4); border-radius: var(--r-md); color: #fff; }
.thesis-header.thesis-buy { background: linear-gradient(135deg, #059669, #047857); }
.thesis-header.thesis-hold { background: linear-gradient(135deg, #d97706, #b45309); }
.thesis-header.thesis-sell { background: linear-gradient(135deg, #dc2626, #b91c1c); }
.thesis-verdict-label { font-size: var(--text-lg); font-weight: 700; letter-spacing: 0.5px; }
.thesis-target { font-size: var(--text-sm); opacity: 0.9; }
.thesis-cases { display: grid; grid-template-columns: 1fr 1fr; gap: var(--s-4); }
.bull-case, .bear-case { padding: var(--s-4); border-radius: var(--r-md); font-size: var(--text-sm); line-height: 1.5; }
.bull-case { background: #f0fdf4; border-left: 3px solid var(--c-success); }
.bear-case { background: #fef2f2; border-left: 3px solid var(--c-danger); }
.bull-case h4, .bear-case h4 { font-size: var(--text-sm); font-weight: 600; margin-bottom: var(--s-2); color: var(--c-text); }
.bull-case p, .bear-case p { color: var(--c-text); margin: 0; }
.thesis-factors { display: grid; grid-template-columns: 1fr 1fr; gap: var(--s-4); margin-top: var(--s-2); }
.thesis-factors h4 { font-size: var(--text-sm); font-weight: 600; margin-bottom: var(--s-2); color: var(--c-text); }
.thesis-factors ul { list-style: none; font-size: var(--text-sm); color: var(--c-text); line-height: 1.5; }
.thesis-factors li { padding: var(--s-1) 0; border-bottom: 1px solid var(--c-border-light); }
.thesis-factors li:last-child { border-bottom: none; }
.catalysts li::before { content: '→ '; color: var(--c-success); }
.risks li::before { content: '⚠ '; color: var(--c-danger); }

/* Investigation Timeline */
.investigation-timeline-container { padding: var(--s-4); }
.investigation-timeline { position: relative; padding-left: 24px; }
.investigation-timeline::before { content: ''; position: absolute; left: 8px; top: 0; bottom: 0; width: 2px; background: var(--c-border); }
.investigation-event { position: relative; padding-bottom: var(--s-5); }
.event-timeline-marker { position: absolute; left: -24px; top: 0; width: 20px; height: 20px; border-radius: 50%; background: var(--c-bg); border: 2px solid var(--c-border); display: flex; align-items: center; justify-content: center; font-size: 10px; }
.investigation-event.severity-high .event-timeline-marker { border-color: var(--c-danger); background: #fee2e2; }
.event-card { background: var(--c-bg); border-radius: var(--r-md); padding: var(--s-4); border-left: 3px solid var(--c-border); }
.investigation-event.severity-high .event-card { border-left-color: var(--c-danger); }
.event-header { display: flex; flex-wrap: wrap; align-items: center; gap: var(--s-2); margin-bottom: var(--s-2); }
.event-date { font-size: var(--text-xs); color: var(--c-muted); }
.event-type-badge { font-size: 8px; padding: 1px 4px; background: var(--c-border); border-radius: 2px; text-transform: uppercase; }
.event-severity { font-size: 8px; padding: 1px 4px; border-radius: 2px; font-weight: 600; }
.event-severity.severity-high { background: #fee2e2; color: #991b1b; }
.event-title { font-size: var(--text-sm); font-weight: 600; margin-bottom: var(--s-2); }
.event-description { font-size: var(--text-xs); color: var(--c-text-secondary); line-height: 1.5; }

/* Trust Dashboard */
.trust-dashboard-container { padding: var(--s-4); }
.trust-dashboard { display: grid; grid-template-columns: auto 1fr; gap: var(--s-6); }
.trust-score-panel { text-align: center; padding: var(--s-6); border-radius: var(--r-md); color: #fff; min-width: 120px; }
.trust-score-panel.score-trusted { background: linear-gradient(135deg, #059669, #047857); }
.trust-score-panel.score-caution { background: linear-gradient(135deg, #d97706, #b45309); }
.trust-score-panel.score-untrusted { background: linear-gradient(135deg, #dc2626, #b91c1c); }
.trust-score-circle { font-size: 32px; font-weight: 700; font-family: var(--font-mono); }
.trust-verdict { font-size: var(--text-sm); margin-top: var(--s-2); font-weight: 500; }
.trust-factors-panel h4 { font-size: var(--text-xs); font-weight: 600; text-transform: uppercase; margin-bottom: var(--s-3); }
.trust-factor { display: flex; align-items: center; gap: var(--s-3); padding: var(--s-2) 0; border-bottom: 1px solid var(--c-border-light); font-size: var(--text-xs); }
.sentiment-panel { margin-top: var(--s-4); }
.sentiment-panel h4 { font-size: var(--text-xs); font-weight: 600; text-transform: uppercase; margin-bottom: var(--s-2); }
.sentiment-bar { height: 16px; display: flex; border-radius: 8px; overflow: hidden; background: var(--c-border); }
.sentiment-positive { background: var(--c-success); }
.sentiment-negative { background: var(--c-danger); }
.flags-panel { display: grid; grid-template-columns: 1fr 1fr; gap: var(--s-4); margin-top: var(--s-4); }
.red-flags h4, .green-flags h4 { font-size: var(--text-xs); font-weight: 600; text-transform: uppercase; margin-bottom: var(--s-2); }
.red-flags h4 { color: #991b1b; }
.green-flags h4 { color: #166534; }
.flags-panel ul { list-style: none; font-size: var(--text-xs); }

/* Decision Matrix */
.decision-matrix-container { overflow: hidden; }
.decision-matrix { width: 100%; border-collapse: collapse; font-size: var(--text-xs); }
.decision-matrix th, .decision-matrix td { padding: var(--s-2) var(--s-3); text-align: center; border: 1px solid var(--c-border); }
.decision-matrix th { background: var(--c-bg); font-weight: 600; font-size: 9px; text-transform: uppercase; }
.decision-matrix th.winner, .decision-matrix td.winner-col { background: #fef9c3; }

/* Alpine x-cloak */
[x-cloak] { display: none !important; }
.empty-view { padding: var(--s-8); text-align: center; color: var(--c-muted); font-size: var(--text-sm); }

@media (max-width: 768px) {
    .report-shell { grid-template-columns: 1fr; }
    .report-sidebar { position: fixed; left: -220px; width: 220px; transition: left 0.2s; z-index: 100; }
    .report-sidebar.open { left: 0; }
    .trust-dashboard { grid-template-columns: 1fr; }
    .thesis-metrics { grid-template-columns: repeat(2, 1fr); }
    .thesis-cases, .pros-cons-grid { grid-template-columns: 1fr; }
}
"""
