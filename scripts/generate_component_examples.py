"""
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
                {'finding_type': 'tech_trend', 'summary': 'GitHub Copilot dominates with 1.5M+ paid subscribers', 'content': 'GitHub Copilot has emerged as the market leader in AI coding assistants, with over 1.5 million paid subscribers as of Q4 2025. Enterprise adoption has accelerated significantly, with 85% of Fortune 500 companies now using some form of AI coding assistance.', 'confidence_score': 0.92, 'date_referenced': 'January 2026'},
                {'finding_type': 'market_trend', 'summary': 'Enterprise adoption accelerated 40% YoY', 'content': 'Enterprise adoption of AI coding tools grew 40% year-over-year in 2025, driven by productivity gains and developer satisfaction. Companies report 25-40% reduction in code review time.', 'confidence_score': 0.88, 'date_referenced': 'Q4 2025'},
                {'finding_type': 'tech_trend', 'summary': 'Claude Code emerges as strong competitor', 'content': 'Anthropic\'s Claude Code has rapidly gained market share in the AI coding assistant space, with particular strength in complex reasoning tasks and long-context understanding.', 'confidence_score': 0.85, 'date_referenced': 'December 2025'},
                {'finding_type': 'adoption_pattern', 'summary': 'Mid-market companies driving growth', 'content': 'Mid-market companies (500-5000 employees) are the fastest-growing segment, with 65% YoY increase in AI coding tool adoption.', 'confidence_score': 0.82},
                {'finding_type': 'red_flag', 'summary': 'Security concerns persist around code exposure', 'content': 'Enterprise security teams remain concerned about proprietary code being sent to cloud-based AI services. On-premise and air-gapped solutions seeing increased demand.', 'confidence_score': 0.78},
                {'finding_type': 'prediction', 'summary': 'Market expected to reach $15B by 2027', 'content': 'Analysts project the AI coding assistant market to reach $15 billion by 2027, representing a 45% CAGR from 2025 levels.', 'confidence_score': 0.75, 'date_range': '2026-2027'},
            ],
            'perspectives': [
                {
                    'perspective_type': 'venture_capitalist',
                    'analysis_text': 'The AI coding assistant market represents one of the most compelling investment opportunities in enterprise software. We\'re seeing 3-4x revenue growth in portfolio companies focused on developer productivity. The market is consolidating around a few major players, but there\'s still significant opportunity in specialized niches like security-focused AI coding and domain-specific assistants.',
                    'key_insights': [
                        'Market consolidation accelerating around top 3 players',
                        'Enterprise deals averaging $2-5M annually',
                        'Developer satisfaction scores above 80% driving adoption'
                    ],
                    'predictions': [
                        {'prediction': 'Major acquisition in AI coding space within 12 months', 'confidence': 0.75, 'timeline': 'Q3 2026', 'rationale': 'Large tech companies looking to acquire specialized AI coding capabilities rather than build from scratch.'},
                        {'prediction': 'On-premise AI coding solutions to capture 30% of enterprise market', 'confidence': 0.70, 'timeline': 'Q4 2026', 'rationale': 'Security-conscious enterprises demanding air-gapped solutions for sensitive codebases.'}
                    ],
                    'warnings': ['Valuation multiples may be unsustainable at current levels']
                },
                {
                    'perspective_type': 'developer_community',
                    'analysis_text': 'Developer reception has been overwhelmingly positive, with most reporting significant productivity gains. However, there are concerns about over-reliance on AI suggestions and potential skill atrophy among junior developers. The community is also actively debating the implications for open source contributions and code ownership.',
                    'key_insights': [
                        'Average productivity increase of 30-50% reported',
                        'Junior developers benefit most from AI assistance',
                        'Quality of suggestions improving rapidly with each update'
                    ],
                    'predictions': [
                        {'prediction': 'AI pair programming becomes standard practice by 2027', 'confidence': 0.85, 'timeline': '2027', 'rationale': 'Current adoption trends and productivity benefits point to widespread adoption.'}
                    ],
                    'warnings': ['Risk of skill atrophy in junior developers who rely too heavily on AI']
                }
            ],
            'sources': [
                {'title': 'GitHub State of AI Coding 2025', 'url': 'https://github.blog/ai-coding-2025', 'credibility_score': 0.95, 'domain': 'github.blog', 'source_type': 'primary'},
                {'title': 'Gartner AI Development Tools Report', 'url': 'https://gartner.com/ai-dev-tools', 'credibility_score': 0.92, 'domain': 'gartner.com', 'source_type': 'analyst'},
                {'title': 'Stack Overflow Developer Survey 2025', 'url': 'https://stackoverflow.com/survey/2025', 'credibility_score': 0.90, 'domain': 'stackoverflow.com', 'source_type': 'survey'},
                {'title': 'TechCrunch: AI Coding Market Analysis', 'url': 'https://techcrunch.com/ai-coding', 'credibility_score': 0.75, 'domain': 'techcrunch.com', 'source_type': 'news'},
            ],
        }

    elif template_type == 'financial':
        return {
            **base_data,
            'query': 'NVIDIA Q4 2025 Earnings Analysis and Investment Outlook',
            'findings': [
                {'finding_type': 'bullish_signal', 'summary': 'Data center revenue up 150% YoY', 'content': 'NVIDIA\'s data center segment posted record revenue of $28.5B in Q4 2025, representing 150% year-over-year growth driven by continued AI infrastructure buildout.', 'confidence_score': 0.95, 'date_referenced': 'Q4 2025'},
                {'finding_type': 'financial_metric', 'summary': 'Gross margin expanded to 78%', 'content': 'Gross margin improved to 78.2% in Q4, up from 72% in the prior year period, demonstrating pricing power and supply normalization.', 'confidence_score': 0.94, 'date_referenced': 'Q4 2025'},
                {'finding_type': 'bullish_signal', 'summary': 'Blackwell architecture demand exceeds supply', 'content': 'CEO Jensen Huang confirmed that demand for next-generation Blackwell GPUs continues to exceed supply, with backlog extending into late 2026.', 'confidence_score': 0.88},
                {'finding_type': 'bearish_signal', 'summary': 'China revenue down 35% on export restrictions', 'content': 'Revenue from China declined 35% due to ongoing US export restrictions on advanced AI chips. The company expects this headwind to persist.', 'confidence_score': 0.92, 'date_referenced': 'Q4 2025'},
                {'finding_type': 'risk', 'summary': 'Customer concentration risk with hyperscalers', 'content': 'Top 4 cloud customers now represent 55% of data center revenue, creating significant customer concentration risk.', 'confidence_score': 0.85},
                {'finding_type': 'positive', 'summary': 'Automotive segment emerging as growth driver', 'content': 'Automotive revenue reached $1.2B in Q4, with design wins for autonomous driving systems across 15 major automakers.', 'confidence_score': 0.80, 'date_referenced': 'Q4 2025'},
            ],
            'perspectives': [
                {
                    'perspective_type': 'institutional_investor',
                    'analysis_text': 'NVIDIA remains the picks-and-shovels play on the AI infrastructure buildout. While valuation is stretched at 35x forward earnings, the company\'s dominant market position and continued execution justify a premium. We\'re maintaining our overweight position with a $180 price target.',
                    'key_insights': [
                        'Market share in AI training chips exceeds 90%',
                        'CUDA ecosystem creates high switching costs',
                        'R&D investment of $12B annually maintains tech lead'
                    ],
                    'predictions': [
                        {'prediction': 'Stock reaches $180 within 12 months', 'confidence': 0.70, 'timeline': 'Q4 2026', 'rationale': 'Continued AI infrastructure spending and margin expansion support higher multiples.'},
                        {'prediction': 'Data center revenue doubles again in FY2026', 'confidence': 0.65, 'timeline': 'FY2026', 'rationale': 'Backlog visibility and hyperscaler CapEx commitments support continued growth.'}
                    ],
                    'warnings': ['Valuation leaves little room for execution missteps']
                },
                {
                    'perspective_type': 'short_seller',
                    'analysis_text': 'The stock is pricing in perfection at current levels. We see significant downside risk from China revenue loss, potential hyperscaler insourcing, and AMD competitive threats. The 35x forward P/E assumes continued 50%+ growth that is mathematically unsustainable.',
                    'key_insights': [
                        'AMD gaining share in inference market',
                        'Custom AI chips from hyperscalers pose long-term threat',
                        'China revenue loss not fully reflected in guidance'
                    ],
                    'predictions': [
                        {'prediction': 'Multiple compression to 25x by end of 2026', 'confidence': 0.55, 'timeline': '2026', 'rationale': 'Growth deceleration typically leads to significant multiple compression for high-growth stocks.'}
                    ],
                    'warnings': ['Momentum can persist longer than fundamentals justify']
                }
            ],
            'sources': [
                {'title': 'NVIDIA Q4 2025 Earnings Call Transcript', 'url': 'https://nvidia.com/earnings', 'credibility_score': 0.98, 'domain': 'nvidia.com', 'source_type': 'primary'},
                {'title': 'SEC 10-Q Filing', 'url': 'https://sec.gov/nvidia-10q', 'credibility_score': 0.99, 'domain': 'sec.gov', 'source_type': 'regulatory'},
                {'title': 'Morgan Stanley Semiconductor Research', 'url': 'https://morganstanley.com/research', 'credibility_score': 0.85, 'domain': 'morganstanley.com', 'source_type': 'analyst'},
            ],
        }

    elif template_type == 'reputation':
        return {
            **base_data,
            'query': 'Is Temu Legitimate? Safety and Trustworthiness Analysis',
            'findings': [
                {'finding_type': 'trust_signal', 'summary': 'Legitimate subsidiary of PDD Holdings (NASDAQ: PDD)', 'content': 'Temu is operated by PDD Holdings, a publicly traded company on NASDAQ with $35B market cap. The company is subject to SEC reporting requirements and financial audits.', 'confidence_score': 0.95},
                {'finding_type': 'warning_sign', 'summary': 'Numerous BBB complaints about shipping and refunds', 'content': 'The Better Business Bureau shows 2,500+ complaints in 2025, primarily regarding delayed shipments, incorrect items, and difficulty obtaining refunds for defective products.', 'confidence_score': 0.88},
                {'finding_type': 'trust_signal', 'summary': 'Payment processing through secure providers', 'content': 'Temu uses established payment processors including Stripe and PayPal, with standard encryption and buyer protection policies.', 'confidence_score': 0.85},
                {'finding_type': 'warning_sign', 'summary': 'Product quality concerns widespread in reviews', 'content': 'Consumer reviews across multiple platforms consistently report issues with product quality, sizing accuracy, and items not matching descriptions.', 'confidence_score': 0.82},
                {'finding_type': 'warning_sign', 'summary': 'Data privacy concerns flagged by security researchers', 'content': 'Security researchers have raised concerns about the app\'s extensive data collection practices, including access to device information beyond typical e-commerce needs.', 'confidence_score': 0.78},
                {'finding_type': 'positive', 'summary': 'Refund policy generally honored within 90 days', 'content': 'Most users report successful refunds when requested within the 90-day window, though the process can take 7-14 business days.', 'confidence_score': 0.75},
            ],
            'perspectives': [
                {
                    'perspective_type': 'consumer_protection',
                    'analysis_text': 'While Temu is a legitimate business, consumers should approach with appropriate caution. The platform is best suited for low-cost, low-stakes purchases where quality concerns are acceptable. High-value or safety-critical items should be purchased elsewhere.',
                    'key_insights': [
                        'Legitimate company with standard buyer protections',
                        'Quality control issues are common and well-documented',
                        'Best for experimental or disposable purchases'
                    ],
                    'predictions': [],
                    'warnings': [
                        'Avoid purchasing electronics or items requiring safety certification',
                        'Be prepared for potential quality issues',
                        'Review data privacy settings carefully'
                    ]
                },
                {
                    'perspective_type': 'reputation_analyst',
                    'analysis_text': 'Temu follows the typical ultra-low-cost retail model where price comes at the expense of quality and customer service. The company is not a scam but operates on thin margins that limit quality control and support capabilities.',
                    'key_insights': [
                        'Business model prioritizes volume over quality',
                        'Customer service capacity lags user base growth',
                        'Comparison: Similar complaint rates to early Wish.com'
                    ],
                    'predictions': [
                        {'prediction': 'Customer service improvements expected by mid-2026', 'confidence': 0.60, 'timeline': 'Q2 2026', 'rationale': 'Regulatory pressure and competition forcing improvements.'}
                    ],
                    'warnings': []
                }
            ],
            'sources': [
                {'title': 'BBB Temu Business Profile', 'url': 'https://bbb.org/temu', 'credibility_score': 0.90, 'domain': 'bbb.org', 'source_type': 'regulatory'},
                {'title': 'SEC PDD Holdings Filings', 'url': 'https://sec.gov/pdd', 'credibility_score': 0.98, 'domain': 'sec.gov', 'source_type': 'regulatory'},
                {'title': 'Consumer Reports Temu Analysis', 'url': 'https://consumerreports.org/temu', 'credibility_score': 0.88, 'domain': 'consumerreports.org', 'source_type': 'analyst'},
                {'title': 'Trustpilot Temu Reviews', 'url': 'https://trustpilot.com/temu', 'credibility_score': 0.70, 'domain': 'trustpilot.com', 'source_type': 'reviews'},
            ],
        }

    elif template_type == 'purchase_decision':
        return {
            **base_data,
            'query': 'MacBook Pro M3 Max vs Dell XPS 15 vs ThinkPad X1 Carbon for Software Development',
            'findings': [
                {'finding_type': 'product_strength', 'summary': 'MacBook Pro offers best battery life at 18+ hours', 'content': 'The MacBook Pro M3 Max delivers exceptional battery life of 18-22 hours in real-world development use, significantly outpacing Windows alternatives.', 'confidence_score': 0.92},
                {'finding_type': 'product_strength', 'summary': 'ThinkPad X1 Carbon is lightest at 2.48 lbs', 'content': 'At just 2.48 pounds, the ThinkPad X1 Carbon is the most portable option, ideal for developers who travel frequently.', 'confidence_score': 0.90},
                {'finding_type': 'product_weakness', 'summary': 'MacBook Pro costs 50-70% more than alternatives', 'content': 'The MacBook Pro M3 Max starts at $3,499, while comparable Dell XPS 15 and ThinkPad configurations are $2,000-2,500, representing a significant premium.', 'confidence_score': 0.95},
                {'finding_type': 'product_strength', 'summary': 'Dell XPS 15 offers best display for color work', 'content': 'The Dell XPS 15 OLED option provides 100% DCI-P3 coverage and superior color accuracy, ideal for developers doing design work.', 'confidence_score': 0.85},
                {'finding_type': 'product_weakness', 'summary': 'Windows laptops have shorter battery life (8-10 hrs)', 'content': 'Both Dell XPS 15 and ThinkPad X1 Carbon average 8-10 hours of battery life under development workloads, requiring more frequent charging.', 'confidence_score': 0.88},
                {'finding_type': 'alternative_option', 'summary': 'Framework Laptop offers best repairability', 'content': 'For developers prioritizing sustainability and repairability, the Framework Laptop 16 offers modular design with user-replaceable components.', 'confidence_score': 0.80, 'extracted_data': {'product': 'Framework Laptop 16', 'price_comparison': '$1,799 base', 'key_advantage': 'User-repairable and upgradeable', 'key_disadvantage': 'Shorter battery life, less polished'}},
                {'finding_type': 'real_user_experience', 'summary': 'Reddit developers praise MacBook for Docker performance', 'content': 'Long-term user reports on r/programming and r/webdev consistently highlight the MacBook M3\'s superior performance with Docker containers and local development environments.', 'confidence_score': 0.82, 'extracted_data': {'source_type': 'reddit', 'ownership_duration': '6+ months', 'overall_sentiment': 'positive'}},
            ],
            'perspectives': [
                {
                    'perspective_type': 'technical_expert',
                    'analysis_text': 'For pure software development performance, the MacBook Pro M3 Max is the clear winner. The Apple Silicon architecture excels at compilation, Docker workloads, and provides best-in-class energy efficiency. However, developers needing Windows-specific tools or tight budgets should consider the ThinkPad X1 Carbon for its reliability and keyboard quality.',
                    'key_insights': [
                        'M3 Max compiles code 30-40% faster than Intel competitors',
                        'ThinkPad keyboard rated best by developers in surveys',
                        'Dell XPS offers best value in mid-range configurations'
                    ],
                    'predictions': [],
                    'warnings': ['macOS may require adjustments for developers used to Windows/Linux']
                },
                {
                    'perspective_type': 'value_analyst',
                    'analysis_text': 'The total cost of ownership favors the MacBook despite higher upfront cost. Superior build quality, longer software support (7+ years), and better resale value offset the premium. Budget-conscious developers should consider the base M3 Pro model or a previous-generation refurbished unit.',
                    'key_insights': [
                        'MacBook resale value: 60-70% after 3 years vs 40-50% for Windows',
                        'AppleCare extends support at reasonable cost',
                        'Windows laptop warranties often require costly extensions'
                    ],
                    'predictions': [],
                    'warnings': []
                }
            ],
            'sources': [
                {'title': 'Tom\'s Hardware Laptop Benchmarks 2025', 'url': 'https://tomshardware.com/laptops', 'credibility_score': 0.88, 'domain': 'tomshardware.com', 'source_type': 'benchmark'},
                {'title': 'r/programming Laptop Megathread', 'url': 'https://reddit.com/r/programming', 'credibility_score': 0.72, 'domain': 'reddit.com', 'source_type': 'community'},
                {'title': 'Notebookcheck Review Compilation', 'url': 'https://notebookcheck.com', 'credibility_score': 0.85, 'domain': 'notebookcheck.com', 'source_type': 'review'},
            ],
        }

    elif template_type == 'investigative':
        return {
            **base_data,
            'query': 'OpenAI Leadership Crisis Investigation: Causes and Implications',
            'findings': [
                {'finding_type': 'event', 'summary': 'Board fired Sam Altman on November 17, 2023', 'content': 'The OpenAI board abruptly terminated CEO Sam Altman, citing a loss of confidence in his leadership. No specific misconduct was initially disclosed.', 'confidence_score': 0.98, 'date_referenced': 'November 17, 2023'},
                {'finding_type': 'revelation', 'summary': 'Microsoft was notified minutes before announcement', 'content': 'Microsoft CEO Satya Nadella reportedly received only a few minutes\' notice before the public announcement, despite Microsoft\'s $13B investment in OpenAI.', 'confidence_score': 0.90, 'date_referenced': 'November 17, 2023'},
                {'finding_type': 'actor', 'summary': 'Board member Helen Toner co-authored critical paper', 'content': 'Board member Helen Toner had co-authored an academic paper that appeared critical of OpenAI\'s safety practices, contributing to tensions with Altman.', 'confidence_score': 0.85, 'extracted_data': {'name': 'Helen Toner', 'role': 'Board Member', 'action': 'Co-authored critical paper'}},
                {'finding_type': 'evidence', 'summary': '700+ employees threatened to resign', 'content': 'Over 700 of OpenAI\'s approximately 770 employees signed a letter threatening to resign and join Microsoft unless the board reinstated Altman and resigned.', 'confidence_score': 0.95, 'date_referenced': 'November 20, 2023'},
                {'finding_type': 'event', 'summary': 'Altman reinstated as CEO on November 21, 2023', 'content': 'Following intense pressure from employees, investors, and Microsoft, Sam Altman was reinstated as CEO with a reconstituted board.', 'confidence_score': 0.98, 'date_referenced': 'November 21, 2023'},
                {'finding_type': 'pattern', 'summary': 'Conflict between safety mission and commercial growth', 'content': 'The crisis exposed fundamental tensions between OpenAI\'s original non-profit safety mission and its evolution into a commercial AI powerhouse.', 'confidence_score': 0.88},
            ],
            'perspectives': [
                {
                    'perspective_type': 'governance_expert',
                    'analysis_text': 'The OpenAI board crisis represents a catastrophic governance failure. The unique non-profit controlling for-profit structure proved inadequate for managing a company of OpenAI\'s scale and importance. The board lacked the expertise and resources to properly oversee a technology company with billions in revenue.',
                    'key_insights': [
                        'Non-profit board structure inappropriate for commercial scale',
                        'Lack of investor representation created information asymmetry',
                        'Board decision-making process lacked proper due diligence'
                    ],
                    'predictions': [
                        {'prediction': 'OpenAI will restructure to conventional corporate governance', 'confidence': 0.80, 'timeline': '2025', 'rationale': 'Current structure unsustainable for continued growth and fundraising.'}
                    ],
                    'warnings': ['Governance reforms may dilute safety-focused mission']
                },
                {
                    'perspective_type': 'tech_industry_analyst',
                    'analysis_text': 'The crisis revealed Microsoft\'s extraordinary influence over OpenAI despite minority ownership. The speed of Altman\'s reinstatement demonstrated that commercial interests and employee loyalty trumped board authority, raising questions about accountability in AI governance.',
                    'key_insights': [
                        'Microsoft effectively has veto power over major decisions',
                        'Employee leverage unprecedented in tech industry',
                        'Event accelerated AI governance policy discussions'
                    ],
                    'predictions': [],
                    'warnings': []
                }
            ],
            'sources': [
                {'title': 'New York Times Investigation', 'url': 'https://nytimes.com/openai-crisis', 'credibility_score': 0.92, 'domain': 'nytimes.com', 'source_type': 'news'},
                {'title': 'OpenAI Official Statements', 'url': 'https://openai.com/blog', 'credibility_score': 0.85, 'domain': 'openai.com', 'source_type': 'primary'},
                {'title': 'The Information Exclusive', 'url': 'https://theinformation.com/openai', 'credibility_score': 0.88, 'domain': 'theinformation.com', 'source_type': 'news'},
            ],
        }

    else:
        # Generic fallback
        return {
            **base_data,
            'query': f'Sample {template_type.replace("_", " ").title()} Analysis',
            'findings': [
                {'finding_type': 'fact', 'summary': 'Sample finding 1', 'content': 'Detailed content for sample finding 1.', 'confidence_score': 0.85},
                {'finding_type': 'fact', 'summary': 'Sample finding 2', 'content': 'Detailed content for sample finding 2.', 'confidence_score': 0.75},
            ],
            'perspectives': [
                {'perspective_type': 'analyst', 'analysis_text': 'Sample analysis text.', 'key_insights': ['Insight 1'], 'predictions': [], 'warnings': []}
            ],
            'sources': [
                {'title': 'Sample Source', 'url': 'https://example.com', 'credibility_score': 0.80, 'domain': 'example.com', 'source_type': 'web'}
            ],
        }


def generate_html_report(template_type: str, result: dict) -> str:
    """Generate a complete HTML report for the given template type."""

    # Get template-specific hints
    hints = TEMPLATE_REPORT_HINTS.get(template_type)

    # Prepare component data
    component_data = prepare_component_data(result)

    # Render components based on template hints
    components_html = render_template_components(result, hints)

    # Get component CSS
    css = get_component_styles()

    # Build the full HTML document
    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{result.get("query", "Research Report")}</title>
    <style>
        * {{ box-sizing: border-box; margin: 0; padding: 0; }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            background: #f1f5f9;
            min-height: 100vh;
            padding: 2rem;
        }}
        .report-container {{
            max-width: 1200px;
            margin: 0 auto;
        }}
        .report-header {{
            background: white;
            border-radius: 12px;
            padding: 2rem;
            margin-bottom: 2rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }}
        .report-title {{
            font-size: 1.75rem;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 0.5rem;
        }}
        .report-meta {{
            display: flex;
            gap: 2rem;
            font-size: 0.875rem;
            color: #64748b;
        }}
        .report-meta-item {{
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }}
        .template-badge {{
            display: inline-block;
            padding: 0.25rem 0.75rem;
            background: linear-gradient(135deg, #6366f1, #4f46e5);
            color: white;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
        }}
        .components-grid {{
            display: grid;
            gap: 1.5rem;
        }}
        .section-divider {{
            text-align: center;
            padding: 1rem 0;
            color: #94a3b8;
            font-size: 0.875rem;
        }}

        {css}
    </style>
</head>
<body>
    <div class="report-container">
        <header class="report-header">
            <h1 class="report-title">{result.get("query", "Research Report")}</h1>
            <div class="report-meta">
                <div class="report-meta-item">
                    <span class="template-badge">{template_type.replace("_", " ")}</span>
                </div>
                <div class="report-meta-item">
                    <strong>Findings:</strong> {len(result.get("findings", []))}
                </div>
                <div class="report-meta-item">
                    <strong>Sources:</strong> {len(result.get("sources", []))}
                </div>
                <div class="report-meta-item">
                    <strong>Perspectives:</strong> {len(result.get("perspectives", []))}
                </div>
            </div>
        </header>

        <div class="components-grid">
            {components_html}
        </div>
    </div>
</body>
</html>'''

    return html


def main():
    """Generate example reports for multiple template types."""

    output_dir = os.path.join(os.path.dirname(__file__), '..', 'component_examples')
    os.makedirs(output_dir, exist_ok=True)

    # Templates to generate examples for
    templates = [
        'tech_market',
        'financial',
        'reputation',
        'purchase_decision',
        'investigative',
    ]

    print("Generating component example reports...")
    print(f"Output directory: {output_dir}\n")

    for template_type in templates:
        print(f"Generating {template_type} example...")

        # Generate sample data
        result = generate_sample_data(template_type)

        # Generate HTML
        html = generate_html_report(template_type, result)

        # Write to file
        output_file = os.path.join(output_dir, f'example_{template_type}.html')
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html)

        print(f"  -> Saved to {output_file}")

    print(f"\nGenerated {len(templates)} example reports!")
    print(f"Open the HTML files in a browser to view the component variations.")


if __name__ == '__main__':
    main()
