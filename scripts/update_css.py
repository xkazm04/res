"""Script to update CSS styles with compact Swiss design."""

CSS_CONTENT = '''"""
Component CSS Styles - Swiss Design System (Compact)
"""

def get_component_styles() -> str:
    return """
:root {
    --c-primary: #1a1a2e; --c-accent: #0f4c75; --c-success: #059669; --c-warning: #d97706; --c-danger: #dc2626;
    --c-bg: #fafafa; --c-surface: #fff; --c-border: #e5e5e5; --c-border-light: #f0f0f0;
    --c-text: #171717; --c-text-secondary: #525252; --c-text-muted: #737373; --c-text-faint: #a3a3a3;
    --s-1: 2px; --s-2: 4px; --s-3: 6px; --s-4: 8px; --s-5: 10px; --s-6: 12px; --s-8: 16px;
    --font-sans: -apple-system, BlinkMacSystemFont, Inter, sans-serif; --font-mono: SF Mono, Consolas, monospace;
    --text-xs: 10px; --text-sm: 11px; --text-base: 12px; --text-md: 13px; --text-lg: 14px; --text-xl: 16px;
    --r-sm: 2px; --r-md: 3px; --r-lg: 4px;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--font-sans); font-size: var(--text-base); line-height: 1.4; color: var(--c-text); background: var(--c-bg); }

.report-shell { display: grid; grid-template-columns: 200px 1fr; min-height: 100vh; max-width: 1400px; margin: 0 auto; }
.report-sidebar { background: var(--c-primary); color: #fff; padding: var(--s-8); position: sticky; top: 0; height: 100vh; overflow-y: auto; display: flex; flex-direction: column; }
.sidebar-header { padding-bottom: var(--s-6); border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: var(--s-6); }
.sidebar-title { font-size: var(--text-md); font-weight: 600; line-height: 1.2; }
.sidebar-meta { font-size: var(--text-xs); color: rgba(255,255,255,0.6); }
.sidebar-nav { display: flex; flex-direction: column; gap: var(--s-1); }
.nav-item { display: flex; align-items: center; gap: var(--s-3); padding: var(--s-3) var(--s-4); border-radius: var(--r-md); font-size: var(--text-sm); cursor: pointer; color: rgba(255,255,255,0.7); border: none; background: transparent; width: 100%; text-align: left; }
.nav-item:hover { background: rgba(255,255,255,0.1); color: #fff; }
.nav-item.active { background: var(--c-accent); color: #fff; }
.nav-icon { width: 16px; text-align: center; }
.sidebar-stats { margin-top: auto; padding-top: var(--s-6); border-top: 1px solid rgba(255,255,255,0.1); }
.stat-row { display: flex; justify-content: space-between; font-size: var(--text-xs); padding: var(--s-2) 0; color: rgba(255,255,255,0.6); }
.stat-value { font-weight: 600; color: #fff; font-family: var(--font-mono); }
.report-main { padding: var(--s-8); background: var(--c-bg); overflow-y: auto; }
.view-panel { display: none; }
.view-panel.active { display: block; }

.component { background: var(--c-surface); border: 1px solid var(--c-border); border-radius: var(--r-lg); margin-bottom: var(--s-6); }
.component-header { display: flex; justify-content: space-between; padding: var(--s-4) var(--s-6); border-bottom: 1px solid var(--c-border-light); background: var(--c-bg); }
.component-title { font-size: var(--text-sm); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin: 0; }
.component-body { padding: var(--s-6); }
.component-body.compact { padding: var(--s-4); }
.component-body.flush { padding: 0; }

.verdict-banner { display: flex; align-items: center; gap: var(--s-6); padding: var(--s-6); border-radius: var(--r-lg); color: #fff; }
.verdict-banner.v-green { background: linear-gradient(135deg, #059669, #047857); }
.verdict-banner.v-yellow { background: linear-gradient(135deg, #d97706, #b45309); }
.verdict-banner.v-red { background: linear-gradient(135deg, #dc2626, #b91c1c); }
.verdict-banner.v-blue { background: linear-gradient(135deg, #0284c7, #0369a1); }
.verdict-score-box { width: 52px; height: 52px; border-radius: var(--r-md); background: rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; font-size: var(--text-xl); font-weight: 700; font-family: var(--font-mono); }
.verdict-content h2 { font-size: var(--text-lg); font-weight: 600; margin-bottom: var(--s-1); }
.verdict-content p { font-size: var(--text-sm); opacity: 0.85; margin: 0; }

.metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(90px, 1fr)); gap: var(--s-3); }
.metric-cell { padding: var(--s-4); background: var(--c-bg); border-radius: var(--r-md); text-align: center; }
.metric-cell .value { font-size: var(--text-lg); font-weight: 700; font-family: var(--font-mono); }
.metric-cell .label { font-size: 9px; color: var(--c-text-muted); text-transform: uppercase; }

.data-table { width: 100%; border-collapse: collapse; font-size: var(--text-sm); }
.data-table th { text-align: left; padding: var(--s-3) var(--s-4); background: var(--c-bg); font-size: 9px; font-weight: 600; color: var(--c-text-muted); text-transform: uppercase; border-bottom: 1px solid var(--c-border); }
.data-table td { padding: var(--s-3) var(--s-4); border-bottom: 1px solid var(--c-border-light); vertical-align: top; }
.data-table tr:hover td { background: var(--c-bg); }
.type-badge { display: inline-block; padding: 1px 5px; border-radius: 2px; font-size: 9px; font-weight: 600; text-transform: uppercase; }
.type-badge.fact { background: #dbeafe; color: #1e40af; }
.type-badge.event { background: #fef3c7; color: #92400e; }
.type-badge.evidence { background: #dcfce7; color: #166534; }
.type-badge.prediction { background: #fce7f3; color: #9d174d; }
.type-badge.red_flag { background: #fee2e2; color: #991b1b; }
.type-badge.tech_trend { background: #cffafe; color: #0e7490; }
.type-badge.bullish_signal { background: #dcfce7; color: #15803d; }
.type-badge.bearish_signal { background: #fee2e2; color: #b91c1c; }
.type-badge.actor { background: #fae8ff; color: #86198f; }
.conf-dot { display: inline-flex; align-items: center; gap: 3px; font-size: var(--text-xs); font-family: var(--font-mono); }
.conf-dot.high::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--c-success); }
.conf-dot.med::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--c-warning); }
.conf-dot.low::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--c-danger); }
.finding-text { font-weight: 500; margin-bottom: 1px; }
.finding-detail { font-size: var(--text-xs); color: var(--c-text-muted); }

.timeline-compact { position: relative; padding-left: var(--s-8); }
.timeline-compact::before { content: ''; position: absolute; left: 3px; top: 0; bottom: 0; width: 1px; background: var(--c-border); }
.tl-item { position: relative; padding-bottom: var(--s-5); }
.tl-marker { position: absolute; left: -21px; top: 2px; width: 7px; height: 7px; border-radius: 50%; background: var(--c-accent); }
.tl-item.critical .tl-marker { background: var(--c-danger); }
.tl-date { font-size: var(--text-xs); color: var(--c-text-faint); }
.tl-title { font-size: var(--text-sm); font-weight: 500; }
.tl-desc { font-size: var(--text-xs); color: var(--c-text-muted); margin-top: 2px; }

.quote-stack { display: flex; flex-direction: column; gap: var(--s-3); }
.quote-card { padding: var(--s-4); background: var(--c-bg); border-radius: var(--r-md); border-left: 2px solid var(--c-accent); }
.quote-text { font-size: var(--text-sm); line-height: 1.4; margin-bottom: var(--s-2); }
.quote-source { font-size: var(--text-xs); color: var(--c-text-muted); }

.insights-list { display: flex; flex-direction: column; gap: var(--s-2); }
.insight-row { display: flex; gap: var(--s-3); padding: var(--s-3); background: var(--c-bg); border-radius: var(--r-md); }
.insight-row.highlight { background: #fef9c3; }
.insight-text { flex: 1; font-size: var(--text-sm); }
.insight-cat { font-size: 9px; padding: 1px 4px; background: var(--c-border); border-radius: 2px; }

.sources-compact { display: flex; flex-direction: column; }
.source-row { display: flex; align-items: center; gap: var(--s-3); padding: var(--s-2) var(--s-3); border-bottom: 1px solid var(--c-border-light); font-size: var(--text-xs); }
.source-cred { width: 6px; height: 6px; border-radius: 50%; }
.source-cred.high { background: var(--c-success); }
.source-cred.med { background: var(--c-warning); }
.source-link { flex: 1; color: var(--c-accent); text-decoration: none; }

.pros-cons-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--s-4); }
.pros-col { padding: var(--s-4); border-radius: var(--r-md); background: #f0fdf4; }
.cons-col { padding: var(--s-4); border-radius: var(--r-md); background: #fef2f2; }
.pc-header { font-size: var(--text-xs); font-weight: 600; text-transform: uppercase; margin-bottom: var(--s-3); }
.pros-col .pc-header { color: #166534; }
.cons-col .pc-header { color: #991b1b; }
.pc-list { list-style: none; }
.pc-item { display: flex; gap: var(--s-2); font-size: var(--text-xs); padding: var(--s-1) 0; }

.tech-radar-compact { display: flex; flex-direction: column; gap: var(--s-4); }
.radar-legend-row { display: flex; gap: var(--s-4); font-size: var(--text-xs); color: var(--c-text-muted); padding-bottom: var(--s-3); border-bottom: 1px solid var(--c-border-light); }
.legend-item { display: flex; align-items: center; gap: 4px; }
.legend-dot { width: 8px; height: 8px; border-radius: 50%; }
.legend-dot.adopt { background: #10b981; }
.legend-dot.trial { background: #22c55e; }
.legend-dot.assess { background: #eab308; }
.legend-dot.hold { background: #ef4444; }
.radar-items { display: flex; flex-direction: column; }
.radar-item-row { display: flex; align-items: center; gap: var(--s-3); padding: var(--s-2) 0; border-bottom: 1px solid var(--c-border-light); font-size: var(--text-xs); }
.radar-ring-badge { font-size: 8px; padding: 1px 4px; border-radius: 2px; font-weight: 600; text-transform: uppercase; width: 42px; text-align: center; }
.radar-ring-badge.adopt { background: #dcfce7; color: #166534; }
.radar-ring-badge.trial { background: #d1fae5; color: #047857; }
.radar-ring-badge.assess { background: #fef9c3; color: #854d0e; }
.radar-ring-badge.hold { background: #fee2e2; color: #991b1b; }
.radar-item-name { flex: 1; font-weight: 500; }
.radar-item-desc { flex: 2; color: var(--c-text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.thesis-compact { display: flex; flex-direction: column; gap: var(--s-4); }
.thesis-verdict-bar { display: flex; align-items: center; gap: var(--s-4); padding: var(--s-4) var(--s-6); border-radius: var(--r-md); color: #fff; }
.thesis-verdict-bar.buy { background: linear-gradient(135deg, #059669, #047857); }
.thesis-verdict-bar.hold { background: linear-gradient(135deg, #d97706, #b45309); }
.thesis-verdict-bar.sell { background: linear-gradient(135deg, #dc2626, #b91c1c); }
.thesis-verdict-label { font-size: var(--text-xs); opacity: 0.8; }
.thesis-verdict-value { font-size: var(--text-lg); font-weight: 700; }
.thesis-metrics-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--s-3); }
.thesis-metric { text-align: center; padding: var(--s-3); background: var(--c-bg); border-radius: var(--r-md); }
.thesis-metric .label { font-size: 9px; color: var(--c-text-muted); text-transform: uppercase; }
.thesis-metric .value { font-size: var(--text-md); font-weight: 600; font-family: var(--font-mono); }
.thesis-cases-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--s-3); }
.thesis-case { padding: var(--s-4); border-radius: var(--r-md); font-size: var(--text-xs); }
.thesis-case.bull { background: #f0fdf4; border-left: 2px solid var(--c-success); }
.thesis-case.bear { background: #fef2f2; border-left: 2px solid var(--c-danger); }
.thesis-case h4 { font-size: var(--text-xs); font-weight: 600; margin-bottom: var(--s-2); }
.thesis-factors-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--s-4); }
.thesis-factor-list h4 { font-size: var(--text-xs); font-weight: 600; margin-bottom: var(--s-2); text-transform: uppercase; }
.thesis-factor-list ul { list-style: none; font-size: var(--text-xs); }

.trust-compact { display: grid; grid-template-columns: auto 1fr; gap: var(--s-6); }
.trust-score-box { text-align: center; padding: var(--s-6); border-radius: var(--r-md); color: #fff; min-width: 100px; }
.trust-score-box.trusted { background: linear-gradient(135deg, #059669, #047857); }
.trust-score-box.caution { background: linear-gradient(135deg, #d97706, #b45309); }
.trust-score-box.untrusted { background: linear-gradient(135deg, #dc2626, #b91c1c); }
.trust-score-value { font-size: 28px; font-weight: 700; font-family: var(--font-mono); }
.trust-verdict-text { font-size: var(--text-xs); margin-top: var(--s-2); opacity: 0.9; }
.trust-details { display: flex; flex-direction: column; gap: var(--s-4); }
.trust-factor-row { display: flex; align-items: center; gap: var(--s-3); padding: var(--s-2) 0; border-bottom: 1px solid var(--c-border-light); font-size: var(--text-xs); }
.trust-factor-name { flex: 1; color: var(--c-text-secondary); }
.trust-factor-score { font-weight: 600; font-family: var(--font-mono); }
.trust-sentiment-bar { height: 12px; display: flex; border-radius: 6px; overflow: hidden; background: var(--c-border); }
.trust-sentiment-bar .pos { background: var(--c-success); }
.trust-sentiment-bar .neg { background: var(--c-danger); }
.trust-flags-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--s-4); margin-top: var(--s-3); }
.trust-flags-col h4 { font-size: 9px; font-weight: 600; text-transform: uppercase; margin-bottom: var(--s-2); }
.trust-flags-col.red h4 { color: #991b1b; }
.trust-flags-col.green h4 { color: #166534; }
.trust-flags-col ul { list-style: none; font-size: var(--text-xs); }

.decision-table { width: 100%; border-collapse: collapse; font-size: var(--text-xs); }
.decision-table th, .decision-table td { padding: var(--s-2) var(--s-3); text-align: center; border: 1px solid var(--c-border); }
.decision-table th { background: var(--c-bg); font-weight: 600; font-size: 9px; text-transform: uppercase; }
.decision-table th.winner, .decision-table td.winner { background: #fef9c3; }
.decision-table .criterion { text-align: left; font-weight: 500; }
.decision-winner-bar { margin-top: var(--s-4); padding: var(--s-3) var(--s-4); background: var(--c-success); color: #fff; border-radius: var(--r-md); text-align: center; font-size: var(--text-sm); }

.investigation-tl { position: relative; padding-left: 24px; }
.investigation-tl::before { content: ''; position: absolute; left: 10px; top: 0; bottom: 0; width: 2px; background: var(--c-border); }
.inv-event { position: relative; padding-bottom: var(--s-5); }
.inv-event-marker { position: absolute; left: -20px; top: 0; width: 20px; height: 20px; border-radius: 50%; background: var(--c-bg); border: 2px solid var(--c-border); display: flex; align-items: center; justify-content: center; font-size: 9px; }
.inv-event.sev-high .inv-event-marker { border-color: var(--c-danger); background: #fee2e2; }
.inv-event-content { background: var(--c-bg); border-radius: var(--r-md); padding: var(--s-4); border-left: 2px solid var(--c-border); }
.inv-event.sev-high .inv-event-content { border-left-color: var(--c-danger); }
.inv-event-header { display: flex; align-items: center; gap: var(--s-2); margin-bottom: var(--s-2); }
.inv-event-date { font-size: var(--text-xs); color: var(--c-text-muted); }
.inv-event-type { font-size: 8px; padding: 1px 4px; background: var(--c-border); border-radius: 2px; }
.inv-event-sev { font-size: 8px; padding: 1px 4px; border-radius: 2px; font-weight: 600; }
.inv-event-sev.high { background: #fee2e2; color: #991b1b; }
.inv-event-title { font-size: var(--text-sm); font-weight: 600; margin-bottom: var(--s-1); }
.inv-event-desc { font-size: var(--text-xs); color: var(--c-text-secondary); line-height: 1.4; }

.hidden { display: none; }
@media (max-width: 768px) {
    .report-shell { grid-template-columns: 1fr; }
    .report-sidebar { position: fixed; left: -200px; transition: left 0.2s; z-index: 100; }
    .report-sidebar.open { left: 0; }
}
"""
'''

if __name__ == "__main__":
    import os
    target = os.path.join(os.path.dirname(__file__), "..", "actor", "src", "services", "report_component_styles.py")
    with open(target, "w", encoding="utf-8") as f:
        f.write(CSS_CONTENT)
    print(f"Updated {target}")
