"""Generate example reports with sidebar navigation layout."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'actor', 'src', 'services'))

from report_components import ComponentType, ComponentConfig, render_component
from report_component_renderer import prepare_component_data
from report_component_styles import get_component_styles


SAMPLE_DATA = {
    'tech_market': {
        'query': 'AI Coding Assistants Market Analysis 2025-2026',
        'findings': [
            {'finding_type': 'tech_trend', 'summary': 'GitHub Copilot dominates with 1.5M+ subscribers', 'content': 'Market leader with 85% Fortune 500 adoption.', 'confidence_score': 0.92, 'date_referenced': 'Jan 2026'},
            {'finding_type': 'market_trend', 'summary': 'Enterprise adoption up 40% YoY', 'content': 'Companies report 25-40% reduction in code review time.', 'confidence_score': 0.88, 'date_referenced': 'Q4 2025'},
            {'finding_type': 'tech_trend', 'summary': 'Claude Code emerges as competitor', 'content': 'Strength in complex reasoning tasks.', 'confidence_score': 0.85, 'date_referenced': 'Dec 2025'},
            {'finding_type': 'adoption_pattern', 'summary': 'Mid-market companies driving growth', 'content': '65% YoY increase in adoption.', 'confidence_score': 0.82},
            {'finding_type': 'red_flag', 'summary': 'Security concerns persist', 'content': 'Proprietary code exposure concerns.', 'confidence_score': 0.78},
            {'finding_type': 'prediction', 'summary': 'Market to reach $15B by 2027', 'content': '45% CAGR from 2025.', 'confidence_score': 0.75, 'date_range': '2026-2027'},
        ],
        'perspectives': [{'perspective_type': 'venture_capitalist', 'analysis_text': 'Compelling investment in enterprise software with 3-4x revenue growth.', 'key_insights': ['Market consolidation', 'Enterprise deals $2-5M'], 'predictions': [{'prediction': 'Major acquisition in 12 months', 'confidence': 0.75, 'timeline': 'Q3 2026', 'rationale': 'Tech acquiring capabilities.'}], 'warnings': ['Unsustainable valuations']}],
        'sources': [{'title': 'GitHub State of AI Coding 2025', 'url': 'https://github.blog', 'credibility_score': 0.95, 'source_type': 'primary'}, {'title': 'Gartner AI Tools Report', 'url': 'https://gartner.com', 'credibility_score': 0.92, 'source_type': 'analyst'}],
    },
    'financial': {
        'query': 'NVIDIA Q4 2025 Earnings Analysis',
        'findings': [
            {'finding_type': 'bullish_signal', 'summary': 'Data center revenue up 150% YoY', 'content': 'Record $28.5B in Q4 2025.', 'confidence_score': 0.95, 'date_referenced': 'Q4 2025'},
            {'finding_type': 'financial_metric', 'summary': 'Gross margin expanded to 78%', 'content': 'Up from 72% prior year.', 'confidence_score': 0.94, 'date_referenced': 'Q4 2025'},
            {'finding_type': 'bearish_signal', 'summary': 'China revenue down 35%', 'content': 'Export restrictions impact.', 'confidence_score': 0.92, 'date_referenced': 'Q4 2025'},
            {'finding_type': 'risk', 'summary': 'Customer concentration risk', 'content': 'Top 4 cloud customers = 55%.', 'confidence_score': 0.85},
            {'finding_type': 'positive', 'summary': 'Automotive segment emerging', 'content': 'Revenue $1.2B with 15 automaker wins.', 'confidence_score': 0.80, 'date_referenced': 'Q4 2025'},
        ],
        'perspectives': [{'perspective_type': 'institutional_investor', 'analysis_text': 'Picks-and-shovels play on AI infrastructure buildout.', 'key_insights': ['90%+ AI training share', 'CUDA switching costs'], 'predictions': [{'prediction': 'Stock to $180 in 12 months', 'confidence': 0.70, 'timeline': 'Q4 2026', 'rationale': 'AI spending continues.'}], 'warnings': ['Little room for missteps']}],
        'sources': [{'title': 'NVIDIA Q4 Earnings Call', 'url': 'https://nvidia.com', 'credibility_score': 0.98, 'source_type': 'primary'}, {'title': 'SEC 10-Q Filing', 'url': 'https://sec.gov', 'credibility_score': 0.99, 'source_type': 'regulatory'}],
    },
    'reputation': {
        'query': 'Is Temu Legitimate? Safety Analysis',
        'findings': [
            {'finding_type': 'trust_signal', 'summary': 'Subsidiary of PDD Holdings (NASDAQ)', 'content': '$35B market cap, SEC reporting.', 'confidence_score': 0.95},
            {'finding_type': 'warning_sign', 'summary': 'Numerous BBB complaints', 'content': '2,500+ complaints in 2025.', 'confidence_score': 0.88},
            {'finding_type': 'trust_signal', 'summary': 'Secure payment processing', 'content': 'Uses Stripe and PayPal.', 'confidence_score': 0.85},
            {'finding_type': 'warning_sign', 'summary': 'Product quality concerns', 'content': 'Reviews report quality issues.', 'confidence_score': 0.82},
            {'finding_type': 'warning_sign', 'summary': 'Data privacy concerns', 'content': 'Extensive data collection flagged.', 'confidence_score': 0.78},
            {'finding_type': 'positive', 'summary': 'Refund policy honored', 'content': 'Most refunds within 90 days.', 'confidence_score': 0.75},
        ],
        'perspectives': [{'perspective_type': 'consumer_protection', 'analysis_text': 'Legitimate business but approach with caution for low-stakes purchases.', 'key_insights': ['Standard buyer protections', 'Quality issues common', 'Best for low-stakes'], 'predictions': [], 'warnings': ['Avoid electronics', 'Expect quality issues']}],
        'sources': [{'title': 'BBB Temu Profile', 'url': 'https://bbb.org', 'credibility_score': 0.90, 'source_type': 'regulatory'}, {'title': 'SEC PDD Filings', 'url': 'https://sec.gov', 'credibility_score': 0.98, 'source_type': 'regulatory'}],
    },
    'purchase_decision': {
        'query': 'MacBook Pro vs Dell XPS vs ThinkPad for Development',
        'findings': [
            {'finding_type': 'product_strength', 'summary': 'MacBook Pro best battery (18+ hrs)', 'content': 'Real-world 18-22 hours.', 'confidence_score': 0.92},
            {'finding_type': 'product_strength', 'summary': 'ThinkPad X1 Carbon lightest (2.48 lbs)', 'content': 'Most portable for travel.', 'confidence_score': 0.90},
            {'finding_type': 'product_weakness', 'summary': 'MacBook Pro costs 50-70% more', 'content': '$3,499 vs $2,000-2,500.', 'confidence_score': 0.95},
            {'finding_type': 'product_strength', 'summary': 'Dell XPS 15 best display', 'content': '100% DCI-P3 OLED option.', 'confidence_score': 0.85},
            {'finding_type': 'product_weakness', 'summary': 'Windows laptops shorter battery', 'content': 'Average 8-10 hours.', 'confidence_score': 0.88},
        ],
        'perspectives': [{'perspective_type': 'technical_expert', 'analysis_text': 'MacBook Pro M3 Max clear performance winner for development.', 'key_insights': ['M3 Max 30-40% faster compile', 'ThinkPad best keyboard', 'Dell XPS best mid-range'], 'predictions': [], 'warnings': ['macOS adjustment needed']}],
        'sources': [{'title': 'Toms Hardware Benchmarks', 'url': 'https://tomshardware.com', 'credibility_score': 0.88, 'source_type': 'benchmark'}, {'title': 'r/programming Megathread', 'url': 'https://reddit.com', 'credibility_score': 0.72, 'source_type': 'community'}],
    },
    'investigative': {
        'query': 'OpenAI Leadership Crisis Investigation',
        'findings': [
            {'finding_type': 'event', 'summary': 'Board fired Altman Nov 17, 2023', 'content': 'Cited loss of confidence.', 'confidence_score': 0.98, 'date_referenced': 'Nov 17, 2023'},
            {'finding_type': 'revelation', 'summary': 'Microsoft notified minutes before', 'content': 'Despite $13B investment.', 'confidence_score': 0.90, 'date_referenced': 'Nov 17, 2023'},
            {'finding_type': 'evidence', 'summary': '700+ employees threatened resignation', 'content': 'Letter to join Microsoft.', 'confidence_score': 0.95, 'date_referenced': 'Nov 20, 2023'},
            {'finding_type': 'event', 'summary': 'Altman reinstated Nov 21, 2023', 'content': 'Following pressure from all sides.', 'confidence_score': 0.98, 'date_referenced': 'Nov 21, 2023'},
            {'finding_type': 'pattern', 'summary': 'Safety vs commercial tension', 'content': 'Exposed fundamental tensions.', 'confidence_score': 0.88},
        ],
        'perspectives': [{'perspective_type': 'governance_expert', 'analysis_text': 'Catastrophic governance failure with non-profit structure inadequate.', 'key_insights': ['Non-profit inappropriate for scale', 'Lacked due diligence', 'Investor asymmetry'], 'predictions': [{'prediction': 'Governance restructure', 'confidence': 0.80, 'timeline': '2025', 'rationale': 'Structure unsustainable.'}], 'warnings': ['May dilute safety mission']}],
        'sources': [{'title': 'NYT Investigation', 'url': 'https://nytimes.com', 'credibility_score': 0.92, 'source_type': 'news'}, {'title': 'OpenAI Statements', 'url': 'https://openai.com', 'credibility_score': 0.85, 'source_type': 'primary'}],
    },
}

VIEW_CONFIG = {
    'tech_market': [{'id': 'radar', 'label': 'Tech Radar', 'icon': '&#9881;'}],
    'financial': [{'id': 'thesis', 'label': 'Thesis', 'icon': '&#9875;'}],
    'reputation': [{'id': 'trust', 'label': 'Trust', 'icon': '&#9745;'}],
    'purchase_decision': [{'id': 'matrix', 'label': 'Decision', 'icon': '&#9635;'}],
    'investigative': [{'id': 'timeline', 'label': 'Timeline', 'icon': '&#9201;'}],
}

BASE_VIEWS = [
    {'id': 'overview', 'label': 'Overview', 'icon': '&#9673;'},
    {'id': 'findings', 'label': 'Findings', 'icon': '&#9678;'},
    {'id': 'analysis', 'label': 'Analysis', 'icon': '&#9672;'},
    {'id': 'sources', 'label': 'Sources', 'icon': '&#9671;'},
]


def get_views(template_type):
    return VIEW_CONFIG.get(template_type, []) + BASE_VIEWS


def render_view(view_id, component_data, template_type):
    components = []

    def safe_render(comp_type, data_key, title=None):
        if data_key in component_data:
            cfg = ComponentConfig(component_type=comp_type, title=title)
            try:
                return render_component(comp_type, component_data[data_key], cfg)
            except:
                return ''
        return ''

    if view_id == 'overview':
        components.append(safe_render(ComponentType.VERDICT_HERO, 'verdict_hero'))
        components.append(safe_render(ComponentType.METRIC_CARDS, 'metric_cards', 'Key Metrics'))
        components.append(safe_render(ComponentType.KEY_INSIGHTS, 'key_insights'))
    elif view_id == 'findings':
        components.append(safe_render(ComponentType.FINDINGS_TABLE, 'findings_table'))
        components.append(safe_render(ComponentType.RISK_MATRIX, 'risk_matrix'))
        components.append(safe_render(ComponentType.CHECKLIST, 'checklist'))
    elif view_id == 'analysis':
        components.append(safe_render(ComponentType.EXECUTIVE_SUMMARY, 'executive_summary'))
        components.append(safe_render(ComponentType.PROS_CONS, 'pros_cons'))
        components.append(safe_render(ComponentType.PREDICTION_CARDS, 'prediction_cards'))
        components.append(safe_render(ComponentType.QUOTE_CAROUSEL, 'quote_carousel'))
    elif view_id == 'sources':
        components.append(safe_render(ComponentType.SOURCE_LIST, 'source_list'))
        components.append(safe_render(ComponentType.CONFIDENCE_GAUGE, 'confidence_gauge'))
    elif view_id == 'radar':
        components.append(safe_render(ComponentType.TECH_RADAR, 'tech_radar'))
        components.append(safe_render(ComponentType.COMPARISON_TABLE, 'comparison_table'))
    elif view_id == 'thesis':
        components.append(safe_render(ComponentType.INVESTMENT_THESIS, 'investment_thesis'))
        components.append(safe_render(ComponentType.ACTION_ITEMS, 'action_items'))
    elif view_id == 'trust':
        components.append(safe_render(ComponentType.TRUST_DASHBOARD, 'trust_dashboard'))
    elif view_id == 'matrix':
        components.append(safe_render(ComponentType.DECISION_MATRIX, 'decision_matrix'))
        components.append(safe_render(ComponentType.PROS_CONS, 'pros_cons'))
    elif view_id == 'timeline':
        if 'investigation_timeline' in component_data:
            components.append(safe_render(ComponentType.INVESTIGATION_TIMELINE, 'investigation_timeline'))
        else:
            components.append(safe_render(ComponentType.TIMELINE, 'timeline'))

    content = '\n'.join([c for c in components if c])
    return content if content else '<div class="empty-view">No data available</div>'


def generate_html(template_type, data):
    result = {'template': template_type, **data}
    component_data = prepare_component_data(result)
    css = get_component_styles()
    views = get_views(template_type)

    findings_count = len(data.get('findings', []))
    sources_count = len(data.get('sources', []))
    avg_conf = sum(f.get('confidence_score', 0.5) for f in data.get('findings', [])) / max(findings_count, 1)
    query = data.get('query', 'Research Report')
    first_view = views[0]['id']

    nav_items = []
    for v in views:
        nav_items.append(f'''<div class="nav-item" :class="{{'active': currentView === '{v['id']}'}}" @click="currentView = '{v['id']}'">
            <span class="nav-icon">{v['icon']}</span><span class="nav-label">{v['label']}</span></div>''')

    view_panels = []
    for v in views:
        content = render_view(v['id'], component_data, template_type)
        view_panels.append(f'''<div class="view-panel" x-show="currentView === '{v['id']}'" x-cloak>{content}</div>''')

    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{query}</title>
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
<style>
{css}
[x-cloak] {{ display: none !important; }}
.empty-view {{ padding: var(--s-8); text-align: center; color: var(--c-muted); font-size: var(--text-sm); }}
.sidebar-badge {{ display: inline-block; padding: var(--s-2) var(--s-4); background: var(--c-accent); color: #fff; border-radius: var(--r-md); font-size: var(--text-xs); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }}
.report-header-compact {{ padding: var(--s-4) 0; margin-bottom: var(--s-6); border-bottom: 1px solid var(--c-border); }}
.report-title-compact {{ font-size: var(--text-lg); font-weight: 600; margin: 0; }}
</style>
</head>
<body>
<div class="report-shell" x-data="{{ currentView: '{first_view}' }}">
<aside class="report-sidebar">
<div class="sidebar-header">
<span class="sidebar-badge">{template_type.replace('_', ' ').upper()}</span>
</div>
<nav class="sidebar-nav">
{chr(10).join(nav_items)}
</nav>
<div class="sidebar-stats">
<div class="stat-row"><span class="stat-label">Findings</span><span class="stat-value">{findings_count}</span></div>
<div class="stat-row"><span class="stat-label">Sources</span><span class="stat-value">{sources_count}</span></div>
<div class="stat-row"><span class="stat-label">Confidence</span><span class="stat-value">{avg_conf:.0%}</span></div>
</div>
</aside>
<main class="report-main">
<header class="report-header-compact">
<h1 class="report-title-compact">{query}</h1>
</header>
<div class="report-content">
{chr(10).join(view_panels)}
</div>
</main>
</div>
</body>
</html>'''


def main():
    output_dir = os.path.join(os.path.dirname(__file__), '..', 'component_examples')
    os.makedirs(output_dir, exist_ok=True)

    print("Generating sidebar example reports...")
    print(f"Output: {output_dir}\n")

    for template_type, data in SAMPLE_DATA.items():
        print(f"  {template_type}...")
        html = generate_html(template_type, data)
        output_file = os.path.join(output_dir, f'example_{template_type}.html')
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html)

    print(f"\nGenerated {len(SAMPLE_DATA)} reports with sidebar navigation!")


if __name__ == '__main__':
    main()
