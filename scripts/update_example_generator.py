"""Update the generate_component_examples.py with sidebar navigation."""
import os

NEW_CONTENT = '''"""
Generate example HTML reports to demonstrate component variations across template types.
"""

import os
import sys

# Add the actor/src/services directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'actor', 'src', 'services'))

from report_components import (
    ComponentType, ComponentConfig, ReportHints,
    render_component, TEMPLATE_REPORT_HINTS
)
from report_component_renderer import prepare_component_data, render_template_components
from report_component_styles import get_component_styles


def generate_sample_data(template_type: str) -> dict:
    """Generate sample research data for a specific template type."""

    base_data = {
        'status': 'completed',
        'template': template_type,
        'session_id': 'example_session_123',
    }

    if template_type == 'tech_market':
        return {
            **base_data,
            'query': 'AI Coding Assistants Market Analysis 2025-2026',
            'findings': [
                {'finding_type': 'tech_trend', 'summary': 'GitHub Copilot dominates with 1.5M+ paid subscribers', 'content': 'GitHub Copilot has emerged as the market leader in AI coding assistants, with over 1.5 million paid subscribers as of Q4 2025.', 'confidence_score': 0.92, 'date_referenced': 'January 2026'},
                {'finding_type': 'market_trend', 'summary': 'Enterprise adoption accelerated 40% YoY', 'content': 'Enterprise adoption of AI coding tools grew 40% year-over-year in 2025.', 'confidence_score': 0.88, 'date_referenced': 'Q4 2025'},
                {'finding_type': 'tech_trend', 'summary': 'Claude Code emerges as strong competitor', 'content': 'Claude Code has rapidly gained market share with strength in complex reasoning.', 'confidence_score': 0.85, 'date_referenced': 'December 2025'},
                {'finding_type': 'adoption_pattern', 'summary': 'Mid-market companies driving growth', 'content': 'Mid-market companies are the fastest-growing segment with 65% YoY increase.', 'confidence_score': 0.82},
                {'finding_type': 'red_flag', 'summary': 'Security concerns persist around code exposure', 'content': 'Enterprise security teams remain concerned about proprietary code.', 'confidence_score': 0.78},
                {'finding_type': 'prediction', 'summary': 'Market expected to reach $15B by 2027', 'content': 'Analysts project the market to reach $15 billion by 2027.', 'confidence_score': 0.75, 'date_range': '2026-2027'},
            ],
            'perspectives': [
                {
                    'perspective_type': 'venture_capitalist',
                    'analysis_text': 'The AI coding assistant market represents compelling investment opportunities.',
                    'key_insights': ['Market consolidation accelerating', 'Enterprise deals averaging $2-5M annually', 'Developer satisfaction above 80%'],
                    'predictions': [{'prediction': 'Major acquisition within 12 months', 'confidence': 0.75, 'timeline': 'Q3 2026', 'rationale': 'Large tech companies looking to acquire.'}],
                    'warnings': ['Valuation multiples may be unsustainable']
                },
            ],
            'sources': [
                {'title': 'GitHub State of AI Coding 2025', 'url': 'https://github.blog/ai-coding-2025', 'credibility_score': 0.95, 'source_type': 'primary'},
                {'title': 'Gartner AI Development Tools', 'url': 'https://gartner.com/ai-dev-tools', 'credibility_score': 0.92, 'source_type': 'analyst'},
            ],
        }

    elif template_type == 'financial':
        return {
            **base_data,
            'query': 'NVIDIA Q4 2025 Earnings Analysis',
            'findings': [
                {'finding_type': 'bullish_signal', 'summary': 'Data center revenue up 150% YoY', 'content': 'Data center segment posted record revenue of $28.5B in Q4 2025.', 'confidence_score': 0.95, 'date_referenced': 'Q4 2025'},
                {'finding_type': 'financial_metric', 'summary': 'Gross margin expanded to 78%', 'content': 'Gross margin improved to 78.2% in Q4.', 'confidence_score': 0.94, 'date_referenced': 'Q4 2025'},
                {'finding_type': 'bearish_signal', 'summary': 'China revenue down 35%', 'content': 'Revenue from China declined 35% due to export restrictions.', 'confidence_score': 0.92, 'date_referenced': 'Q4 2025'},
                {'finding_type': 'risk', 'summary': 'Customer concentration risk', 'content': 'Top 4 cloud customers represent 55% of data center revenue.', 'confidence_score': 0.85},
                {'finding_type': 'positive', 'summary': 'Automotive segment emerging', 'content': 'Automotive revenue reached $1.2B in Q4.', 'confidence_score': 0.80, 'date_referenced': 'Q4 2025'},
            ],
            'perspectives': [
                {
                    'perspective_type': 'institutional_investor',
                    'analysis_text': 'NVIDIA remains the picks-and-shovels play on AI infrastructure buildout.',
                    'key_insights': ['Market share in AI training chips exceeds 90%', 'CUDA ecosystem creates switching costs'],
                    'predictions': [{'prediction': 'Stock reaches $180 within 12 months', 'confidence': 0.70, 'timeline': 'Q4 2026', 'rationale': 'Continued AI infrastructure spending.'}],
                    'warnings': ['Valuation leaves little room for missteps']
                },
            ],
            'sources': [
                {'title': 'NVIDIA Q4 2025 Earnings Call', 'url': 'https://nvidia.com/earnings', 'credibility_score': 0.98, 'source_type': 'primary'},
                {'title': 'SEC 10-Q Filing', 'url': 'https://sec.gov/nvidia-10q', 'credibility_score': 0.99, 'source_type': 'regulatory'},
            ],
        }

    elif template_type == 'reputation':
        return {
            **base_data,
            'query': 'Is Temu Legitimate? Safety Analysis',
            'findings': [
                {'finding_type': 'trust_signal', 'summary': 'Legitimate subsidiary of PDD Holdings', 'content': 'Temu is operated by publicly traded PDD Holdings.', 'confidence_score': 0.95},
                {'finding_type': 'warning_sign', 'summary': 'Numerous BBB complaints', 'content': 'BBB shows 2,500+ complaints in 2025.', 'confidence_score': 0.88},
                {'finding_type': 'trust_signal', 'summary': 'Secure payment processing', 'content': 'Uses Stripe and PayPal with encryption.', 'confidence_score': 0.85},
                {'finding_type': 'warning_sign', 'summary': 'Product quality concerns', 'content': 'Reviews consistently report quality issues.', 'confidence_score': 0.82},
                {'finding_type': 'warning_sign', 'summary': 'Data privacy concerns', 'content': 'Researchers flagged extensive data collection.', 'confidence_score': 0.78},
                {'finding_type': 'positive', 'summary': 'Refund policy honored', 'content': 'Most users report successful refunds within 90 days.', 'confidence_score': 0.75},
            ],
            'perspectives': [
                {
                    'perspective_type': 'consumer_protection',
                    'analysis_text': 'While Temu is legitimate, consumers should approach with caution.',
                    'key_insights': ['Legitimate company with buyer protections', 'Quality control issues common', 'Best for low-stakes purchases'],
                    'predictions': [],
                    'warnings': ['Avoid purchasing electronics', 'Be prepared for quality issues']
                },
            ],
            'sources': [
                {'title': 'BBB Temu Business Profile', 'url': 'https://bbb.org/temu', 'credibility_score': 0.90, 'source_type': 'regulatory'},
                {'title': 'SEC PDD Holdings Filings', 'url': 'https://sec.gov/pdd', 'credibility_score': 0.98, 'source_type': 'regulatory'},
            ],
        }

    elif template_type == 'purchase_decision':
        return {
            **base_data,
            'query': 'MacBook Pro vs Dell XPS vs ThinkPad for Development',
            'findings': [
                {'finding_type': 'product_strength', 'summary': 'MacBook Pro best battery life at 18+ hours', 'content': 'MacBook Pro M3 Max delivers 18-22 hours in development use.', 'confidence_score': 0.92},
                {'finding_type': 'product_strength', 'summary': 'ThinkPad X1 Carbon lightest at 2.48 lbs', 'content': 'Most portable option for traveling developers.', 'confidence_score': 0.90},
                {'finding_type': 'product_weakness', 'summary': 'MacBook Pro costs 50-70% more', 'content': 'MacBook Pro M3 Max starts at $3,499 vs $2,000-2,500 for alternatives.', 'confidence_score': 0.95},
                {'finding_type': 'product_strength', 'summary': 'Dell XPS 15 best display', 'content': 'OLED option provides 100% DCI-P3 coverage.', 'confidence_score': 0.85},
                {'finding_type': 'product_weakness', 'summary': 'Windows laptops shorter battery', 'content': 'Dell and ThinkPad average 8-10 hours.', 'confidence_score': 0.88},
            ],
            'perspectives': [
                {
                    'perspective_type': 'technical_expert',
                    'analysis_text': 'For pure software development performance, MacBook Pro M3 Max is the clear winner.',
                    'key_insights': ['M3 Max compiles 30-40% faster', 'ThinkPad keyboard rated best', 'Dell XPS best value mid-range'],
                    'predictions': [],
                    'warnings': ['macOS may require adjustments for Windows/Linux users']
                },
            ],
            'sources': [
                {'title': 'Tom\\'s Hardware Benchmarks 2025', 'url': 'https://tomshardware.com/laptops', 'credibility_score': 0.88, 'source_type': 'benchmark'},
                {'title': 'r/programming Megathread', 'url': 'https://reddit.com/r/programming', 'credibility_score': 0.72, 'source_type': 'community'},
            ],
        }

    elif template_type == 'investigative':
        return {
            **base_data,
            'query': 'OpenAI Leadership Crisis Investigation',
            'findings': [
                {'finding_type': 'event', 'summary': 'Board fired Sam Altman Nov 17, 2023', 'content': 'OpenAI board terminated CEO citing loss of confidence.', 'confidence_score': 0.98, 'date_referenced': 'November 17, 2023'},
                {'finding_type': 'revelation', 'summary': 'Microsoft notified minutes before', 'content': 'Satya Nadella received only minutes notice despite $13B investment.', 'confidence_score': 0.90, 'date_referenced': 'November 17, 2023'},
                {'finding_type': 'evidence', 'summary': '700+ employees threatened to resign', 'content': 'Over 700 employees signed letter threatening to join Microsoft.', 'confidence_score': 0.95, 'date_referenced': 'November 20, 2023'},
                {'finding_type': 'event', 'summary': 'Altman reinstated Nov 21, 2023', 'content': 'Following intense pressure, Altman was reinstated with new board.', 'confidence_score': 0.98, 'date_referenced': 'November 21, 2023'},
                {'finding_type': 'pattern', 'summary': 'Safety vs commercial tension', 'content': 'Crisis exposed tensions between non-profit mission and commercial growth.', 'confidence_score': 0.88},
            ],
            'perspectives': [
                {
                    'perspective_type': 'governance_expert',
                    'analysis_text': 'The OpenAI board crisis represents a catastrophic governance failure.',
                    'key_insights': ['Non-profit structure inappropriate for scale', 'Lack of investor representation', 'Board lacked due diligence'],
                    'predictions': [{'prediction': 'OpenAI will restructure governance', 'confidence': 0.80, 'timeline': '2025', 'rationale': 'Current structure unsustainable.'}],
                    'warnings': ['Governance reforms may dilute safety mission']
                },
            ],
            'sources': [
                {'title': 'New York Times Investigation', 'url': 'https://nytimes.com/openai-crisis', 'credibility_score': 0.92, 'source_type': 'news'},
                {'title': 'OpenAI Official Statements', 'url': 'https://openai.com/blog', 'credibility_score': 0.85, 'source_type': 'primary'},
            ],
        }

    else:
        return {
            **base_data,
            'query': f'Sample {template_type.replace("_", " ").title()} Analysis',
            'findings': [
                {'finding_type': 'fact', 'summary': 'Sample finding 1', 'content': 'Detailed content.', 'confidence_score': 0.85},
            ],
            'perspectives': [
                {'perspective_type': 'analyst', 'analysis_text': 'Sample analysis.', 'key_insights': ['Insight 1'], 'predictions': [], 'warnings': []}
            ],
            'sources': [
                {'title': 'Sample Source', 'url': 'https://example.com', 'credibility_score': 0.80, 'source_type': 'web'}
            ],
        }


def get_view_config(template_type: str) -> list:
    """Get view configuration for sidebar navigation."""
    base_views = [
        {'id': 'overview', 'label': 'Overview', 'icon': '&#9673;'},
        {'id': 'findings', 'label': 'Findings', 'icon': '&#9678;'},
        {'id': 'analysis', 'label': 'Analysis', 'icon': '&#9672;'},
        {'id': 'sources', 'label': 'Sources', 'icon': '&#9671;'},
    ]
    template_views = {
        'tech_market': [{'id': 'radar', 'label': 'Tech Radar', 'icon': '&#9881;'}],
        'financial': [{'id': 'thesis', 'label': 'Thesis', 'icon': '&#9875;'}],
        'reputation': [{'id': 'trust', 'label': 'Trust', 'icon': '&#9745;'}],
        'purchase_decision': [{'id': 'matrix', 'label': 'Decision', 'icon': '&#9635;'}],
        'investigative': [{'id': 'timeline', 'label': 'Timeline', 'icon': '&#9201;'}],
    }
    if template_type in template_views:
        return template_views[template_type] + base_views
    return base_views


def generate_html_report(template_type: str, result: dict) -> str:
    """Generate a complete HTML report with compact Swiss-style sidebar navigation."""

    component_data = prepare_component_data(result)
    css = get_component_styles()
    views = get_view_config(template_type)

    def render_view_components(view_id: str) -> str:
        components = []
        if view_id == 'overview':
            if 'verdict_hero' in component_data:
                components.append(render_component(ComponentType.VERDICT_HERO, component_data['verdict_hero'],
                    ComponentConfig(component_type=ComponentType.VERDICT_HERO)))
            if 'metric_cards' in component_data:
                components.append(render_component(ComponentType.METRIC_CARDS, component_data['metric_cards'],
                    ComponentConfig(component_type=ComponentType.METRIC_CARDS, title="Key Metrics")))
            if 'key_insights' in component_data:
                components.append(render_component(ComponentType.KEY_INSIGHTS, component_data['key_insights'],
                    ComponentConfig(component_type=ComponentType.KEY_INSIGHTS)))
        elif view_id == 'findings':
            if 'findings_table' in component_data:
                components.append(render_component(ComponentType.FINDINGS_TABLE, component_data['findings_table'],
                    ComponentConfig(component_type=ComponentType.FINDINGS_TABLE)))
            if 'risk_matrix' in component_data:
                components.append(render_component(ComponentType.RISK_MATRIX, component_data['risk_matrix'],
                    ComponentConfig(component_type=ComponentType.RISK_MATRIX)))
            if 'checklist' in component_data:
                components.append(render_component(ComponentType.CHECKLIST, component_data['checklist'],
                    ComponentConfig(component_type=ComponentType.CHECKLIST)))
        elif view_id == 'analysis':
            if 'executive_summary' in component_data:
                components.append(render_component(ComponentType.EXECUTIVE_SUMMARY, component_data['executive_summary'],
                    ComponentConfig(component_type=ComponentType.EXECUTIVE_SUMMARY)))
            if 'pros_cons' in component_data:
                components.append(render_component(ComponentType.PROS_CONS, component_data['pros_cons'],
                    ComponentConfig(component_type=ComponentType.PROS_CONS)))
            if 'prediction_cards' in component_data:
                components.append(render_component(ComponentType.PREDICTION_CARDS, component_data['prediction_cards'],
                    ComponentConfig(component_type=ComponentType.PREDICTION_CARDS)))
            if 'quote_carousel' in component_data:
                components.append(render_component(ComponentType.QUOTE_CAROUSEL, component_data['quote_carousel'],
                    ComponentConfig(component_type=ComponentType.QUOTE_CAROUSEL)))
        elif view_id == 'sources':
            if 'source_list' in component_data:
                components.append(render_component(ComponentType.SOURCE_LIST, component_data['source_list'],
                    ComponentConfig(component_type=ComponentType.SOURCE_LIST)))
            if 'confidence_gauge' in component_data:
                components.append(render_component(ComponentType.CONFIDENCE_GAUGE, component_data['confidence_gauge'],
                    ComponentConfig(component_type=ComponentType.CONFIDENCE_GAUGE)))
        elif view_id == 'radar' and 'tech_radar' in component_data:
            components.append(render_component(ComponentType.TECH_RADAR, component_data['tech_radar'],
                ComponentConfig(component_type=ComponentType.TECH_RADAR)))
        elif view_id == 'thesis' and 'investment_thesis' in component_data:
            components.append(render_component(ComponentType.INVESTMENT_THESIS, component_data['investment_thesis'],
                ComponentConfig(component_type=ComponentType.INVESTMENT_THESIS)))
        elif view_id == 'trust' and 'trust_dashboard' in component_data:
            components.append(render_component(ComponentType.TRUST_DASHBOARD, component_data['trust_dashboard'],
                ComponentConfig(component_type=ComponentType.TRUST_DASHBOARD)))
        elif view_id == 'matrix' and 'decision_matrix' in component_data:
            components.append(render_component(ComponentType.DECISION_MATRIX, component_data['decision_matrix'],
                ComponentConfig(component_type=ComponentType.DECISION_MATRIX)))
        elif view_id == 'timeline':
            if 'investigation_timeline' in component_data:
                components.append(render_component(ComponentType.INVESTIGATION_TIMELINE, component_data['investigation_timeline'],
                    ComponentConfig(component_type=ComponentType.INVESTIGATION_TIMELINE)))
            elif 'timeline' in component_data:
                components.append(render_component(ComponentType.TIMELINE, component_data['timeline'],
                    ComponentConfig(component_type=ComponentType.TIMELINE)))
        return '\\n'.join(components) if components else '<div class="empty-view">No data</div>'

    nav_items = '\\n'.join([
        f'<div class="nav-item" :class="{{\\\'active\\\': currentView === \\\'{v["id"]}\\\'}}" @click="currentView = \\\'{v["id"]}\\\'"><span class="nav-icon">{v["icon"]}</span><span class="nav-label">{v["label"]}</span></div>'
        for v in views
    ])

    view_panels = '\\n'.join([
        f'<div class="view-panel" x-show="currentView === \\\'{v["id"]}\\\'\" x-cloak>{render_view_components(v["id"])}</div>'
        for v in views
    ])

    findings_count = len(result.get("findings", []))
    sources_count = len(result.get("sources", []))
    findings_list = result.get("findings", [])
    avg_conf = sum(f.get("confidence_score", 0.5) for f in findings_list) / max(findings_count, 1)

    query = result.get("query", "Research Report")
    first_view = views[0]["id"]
    template_label = template_type.replace("_", " ").upper()

    return f\\\'\\\'\\\'<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{query}</title>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <style>
        {css}
        [x-cloak] {{ display: none !important; }}
        .empty-view {{ padding: var(--s-6); text-align: center; color: var(--c-muted); font-size: var(--text-sm); }}
    </style>
</head>
<body>
    <div class="report-shell" x-data="{{ currentView: \\'{first_view}\\' }}">
        <aside class="report-sidebar">
            <div class="sidebar-header"><span class="sidebar-badge">{template_label}</span></div>
            <nav class="sidebar-nav">{nav_items}</nav>
            <div class="sidebar-stats">
                <div class="stat-row"><span class="stat-label">Findings</span><span class="stat-value">{findings_count}</span></div>
                <div class="stat-row"><span class="stat-label">Sources</span><span class="stat-value">{sources_count}</span></div>
                <div class="stat-row"><span class="stat-label">Confidence</span><span class="stat-value">{avg_conf:.0%}</span></div>
            </div>
        </aside>
        <main class="report-main">
            <header class="report-header-compact"><h1 class="report-title-compact">{query}</h1></header>
            <div class="report-content">{view_panels}</div>
        </main>
    </div>
</body>
</html>\\\'\\\'\\\'


def main():
    output_dir = os.path.join(os.path.dirname(__file__), '..', 'component_examples')
    os.makedirs(output_dir, exist_ok=True)

    templates = ['tech_market', 'financial', 'reputation', 'purchase_decision', 'investigative']

    print("Generating component example reports...")
    print(f"Output directory: {output_dir}\\n")

    for template_type in templates:
        print(f"Generating {template_type} example...")
        result = generate_sample_data(template_type)
        html = generate_html_report(template_type, result)
        output_file = os.path.join(output_dir, f'example_{template_type}.html')
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html)
        print(f"  -> Saved to {output_file}")

    print(f"\\nGenerated {len(templates)} example reports!")


if __name__ == '__main__':
    main()
'''

# Write to the target file
target_path = os.path.join(os.path.dirname(__file__), 'generate_component_examples.py')
with open(target_path, 'w', encoding='utf-8') as f:
    f.write(NEW_CONTENT)
print(f"Updated {target_path}")
