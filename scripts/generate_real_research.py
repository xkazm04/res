"""
Generate realistic HTML reports based on actual web research.
This replicates the cloud function research flow using real data gathered via web search.
"""
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'actor', 'src', 'services'))

from report_components import ComponentType, ComponentConfig, render_component
from report_component_renderer import prepare_component_data
from report_component_styles import get_component_styles


# =============================================================================
# REAL RESEARCH DATA (gathered via web search January 2025)
# =============================================================================

REAL_RESEARCH = {
    'tech_market': {
        'query': 'AI Code Assistants Market Analysis 2025: GitHub Copilot, Cursor, Claude Code',
        'template': 'tech_market',
        'findings': [
            {
                'finding_id': 'f0',
                'finding_type': 'market_trend',
                'summary': 'AI code assistant market reaches $4.8B in 2025, projected to hit $17.2B by 2030',
                'content': 'The global AI coding tools market reached $4.8 billion in 2025. Analysts project explosive growth to $17.2 billion by 2030, representing a compound annual growth rate exceeding 35%. The top 3 players now capture over 70% market share.',
                'confidence_score': 0.94,
                'date_referenced': 'January 2025',
                'supporting_sources': ['https://www.cbinsights.com/research/report/coding-ai-market-share-2025/']
            },
            {
                'finding_id': 'f1',
                'finding_type': 'tech_trend',
                'summary': 'GitHub Copilot maintains 42% market share with 20M users and 77K enterprise clients',
                'content': 'GitHub Copilot maintains approximately 42% market share among paid AI coding tools. GitHub serves 77,000 enterprises globally with 20 million GitHub Copilot users. 90% of Fortune 100 companies have adopted GitHub Copilot.',
                'confidence_score': 0.95,
                'date_referenced': 'Q4 2025',
                'supporting_sources': ['https://www.secondtalent.com/resources/github-copilot-statistics/']
            },
            {
                'finding_id': 'f2',
                'finding_type': 'tech_trend',
                'summary': 'Cursor captures 18% market share, overtakes Copilot in organizational adoption (43% vs 37%)',
                'content': 'Cursor has emerged as GitHub Copilot\'s strongest competitor, generating over $500M ARR. The tool captured approximately 18% market share, up from near zero 18 months ago. An August 2025 developer survey found Cursor overtook Copilot in organizational adoption rates with 43% versus 37%.',
                'confidence_score': 0.91,
                'date_referenced': 'August 2025',
                'supporting_sources': ['https://www.cbinsights.com/research/report/coding-ai-market-share-december-2025/']
            },
            {
                'finding_id': 'f3',
                'finding_type': 'tech_trend',
                'summary': 'Claude Code scaled from $0 to $400M ARR in just 5 months, crosses $1B ARR threshold',
                'content': 'Anthropic scaled its Claude Code from 0 to $400M ARR in just 5 months. GitHub Copilot, Claude Code, and Anysphere (Cursor) have all crossed the $1B ARR threshold. Claude Code ranks as the second most popular coding assistant after Copilot.',
                'confidence_score': 0.89,
                'date_referenced': 'Q4 2025',
                'supporting_sources': ['https://jellyfish.co/blog/2025-ai-metrics-in-review/']
            },
            {
                'finding_id': 'f4',
                'finding_type': 'adoption_pattern',
                'summary': '82% of developers use AI coding assistants weekly, 41% of global code is now AI-generated',
                'content': 'Stack Overflow\'s 2025 Developer Survey found that 82% of developers now use AI coding assistants at least weekly. GitHub reports that 41% of all code globally is now AI-generated. 90% of teams now use AI in workflows, up from 61% one year ago.',
                'confidence_score': 0.92,
                'date_referenced': '2025',
                'supporting_sources': ['https://www.index.dev/blog/ai-pair-programming-statistics']
            },
            {
                'finding_id': 'f5',
                'finding_type': 'financial_metric',
                'summary': 'Copilot Business costs $19/user/month, Cursor $20/month, enterprise scaling to $114K-$192K annually for 500 devs',
                'content': 'GitHub Copilot Business costs $19/user/month, Enterprise $39/user/month. Cursor costs $20-60/month. A 500-developer team on Copilot Business faces $114K annually; on Cursor Business, $192K annually. Seven companies have crossed $100M ARR threshold.',
                'confidence_score': 0.93,
                'date_referenced': 'January 2025',
                'supporting_sources': ['https://getdx.com/blog/ai-coding-assistant-pricing/']
            },
            {
                'finding_id': 'f6',
                'finding_type': 'prediction',
                'summary': 'Gartner forecasts near-universal enterprise AI coding assistant adoption by 2028',
                'content': 'Gartner\'s Magic Quadrant for AI Code Assistants shows GitHub Copilot leading the market while forecasting near-universal enterprise adoption of AI coding assistants by 2028. Market estimated at $3.0-3.5B in 2025.',
                'confidence_score': 0.88,
                'date_range': '2025-2028',
                'supporting_sources': ['https://visualstudiomagazine.com/articles/2025/09/17/report-github-tops-ai-coding-assistants-with-microsoft-related-cautions.aspx']
            },
            {
                'finding_id': 'f7',
                'finding_type': 'red_flag',
                'summary': 'Tool retention shows Claude Code lags at 81% vs 89% for Copilot/Cursor after 20 weeks',
                'content': '89% of engineers who started using Copilot or Cursor in April 2025 were still using the tool 20 weeks later, compared to 81% for Claude Code. Copilot\'s share of AI-assisted PRs dropped from 80% to 60% while Cursor rose from 20% to 40%.',
                'confidence_score': 0.86,
                'date_referenced': 'October 2025',
                'supporting_sources': ['https://jellyfish.co/blog/2025-ai-metrics-in-review/']
            },
        ],
        'perspectives': [
            {
                'perspective_type': 'venture_capitalist',
                'analysis_text': 'The AI code assistant market represents one of the fastest-growing segments in enterprise software, with multiple companies achieving unprecedented revenue growth. The $1B+ ARR club now includes three players (Copilot, Claude Code, Cursor), with seven companies crossing $100M ARR. Market consolidation around the top 3 players capturing 70%+ share suggests a maturing but still rapidly evolving market.',
                'key_insights': [
                    'Three players have crossed $1B ARR threshold in record time',
                    'Claude Code achieved $400M ARR in just 5 months - fastest ramp in history',
                    'Market consolidation accelerating with top 3 capturing 70%+ share',
                    'Enterprise deals at scale: $114K-192K annually for 500-dev teams'
                ],
                'predictions': [
                    {'prediction': 'Major consolidation via M&A within 18 months', 'confidence': 0.75, 'timeline': 'Q2 2026', 'rationale': 'Multiple well-funded players competing for same enterprise customers'},
                    {'prediction': 'At least one more player will cross $1B ARR by end of 2025', 'confidence': 0.70, 'timeline': 'Q4 2025', 'rationale': 'Seven companies already at $100M+ with strong growth trajectories'}
                ],
                'warnings': ['Valuation multiples may compress as market matures', 'Customer acquisition costs rising as competition intensifies']
            },
            {
                'perspective_type': 'developer_community',
                'analysis_text': 'Developer adoption has reached critical mass with 82% using AI assistants weekly and 41% of code now AI-generated. The shift from Copilot to Cursor in organizational adoption (43% vs 37%) signals developers prioritizing agentic capabilities over pure autocomplete. High retention rates (89%) indicate these tools have become essential to daily workflows.',
                'key_insights': [
                    '82% of developers use AI coding assistants at least weekly',
                    '41% of global code is now AI-generated according to GitHub',
                    'Cursor overtook Copilot in organizational adoption rates',
                    '89% retention after 20 weeks shows tools are sticky'
                ],
                'predictions': [
                    {'prediction': 'AI pair programming becomes standard practice by 2027', 'confidence': 0.90, 'timeline': '2027', 'rationale': 'Already at 82% weekly usage with accelerating adoption'}
                ],
                'warnings': ['Skill atrophy concerns for junior developers', 'Over-reliance on AI suggestions may reduce code understanding']
            }
        ],
        'sources': [
            {'title': 'CB Insights: Coding AI Market Share 2025', 'url': 'https://www.cbinsights.com/research/report/coding-ai-market-share-2025/', 'credibility_score': 0.92, 'source_type': 'analyst'},
            {'title': 'GitHub Copilot Statistics & Adoption Trends', 'url': 'https://www.secondtalent.com/resources/github-copilot-statistics/', 'credibility_score': 0.88, 'source_type': 'analyst'},
            {'title': 'Jellyfish: 2025 AI Metrics in Review', 'url': 'https://jellyfish.co/blog/2025-ai-metrics-in-review/', 'credibility_score': 0.90, 'source_type': 'research'},
            {'title': 'AI Pair Programming Statistics 2025', 'url': 'https://www.index.dev/blog/ai-pair-programming-statistics', 'credibility_score': 0.85, 'source_type': 'research'},
            {'title': 'AI Coding Assistant Pricing Comparison', 'url': 'https://getdx.com/blog/ai-coding-assistant-pricing/', 'credibility_score': 0.87, 'source_type': 'comparison'},
            {'title': 'Visual Studio Magazine: Gartner Magic Quadrant', 'url': 'https://visualstudiomagazine.com/articles/2025/09/17/report-github-tops-ai-coding-assistants-with-microsoft-related-cautions.aspx', 'credibility_score': 0.90, 'source_type': 'news'},
        ],
    },

    'financial': {
        'query': 'NVIDIA Q4 FY2025 Earnings Analysis: AI Chip Dominance and Investment Outlook',
        'template': 'financial',
        'findings': [
            {
                'finding_id': 'f0',
                'finding_type': 'bullish_signal',
                'summary': 'Q4 FY2025 revenue of $39.33B beats estimates, up 78% YoY with full-year at $130.5B (+114%)',
                'content': 'NVIDIA reported Q4 revenue of $39.33 billion versus analyst estimates of $38.05 billion. Revenue rose 78% year-over-year from $35.1B. Full fiscal-year revenue rose 114% to $130.5 billion.',
                'confidence_score': 0.98,
                'date_referenced': 'February 26, 2025',
                'supporting_sources': ['https://nvidianews.nvidia.com/news/nvidia-announces-financial-results-for-fourth-quarter-and-fiscal-2025']
            },
            {
                'finding_id': 'f1',
                'finding_type': 'bullish_signal',
                'summary': 'Data center revenue hits $35.6B (+93% YoY), now represents 91% of total sales',
                'content': 'Data center revenue reached $35.6 billion in Q4, up 93% year-over-year, surpassing expectations of $33.65B. Data center now represents 91% of total sales, up from 83% a year ago and 60% in 2023.',
                'confidence_score': 0.97,
                'date_referenced': 'Q4 FY2025',
                'supporting_sources': ['https://www.cnbc.com/2025/02/26/nvidia-nvda-earnings-report-q4-2025.html']
            },
            {
                'finding_id': 'f2',
                'finding_type': 'bullish_signal',
                'summary': 'Blackwell contributes $11B in first quarter - fastest product ramp in NVIDIA history',
                'content': 'Blackwell contributed $11 billion in its first quarter, marking the fastest product ramp-up in NVIDIA history. CEO Jensen Huang stated "Demand for Blackwell is amazing" with "billions of dollars in sales in its first quarter."',
                'confidence_score': 0.96,
                'date_referenced': 'Q4 FY2025',
                'supporting_sources': ['https://nvidianews.nvidia.com/news/nvidia-announces-financial-results-for-fourth-quarter-and-fiscal-2025']
            },
            {
                'finding_id': 'f3',
                'finding_type': 'financial_metric',
                'summary': 'EPS of $0.89 GAAP ($2.99 non-GAAP), net income $22.09B - up from $12.29B YoY',
                'content': 'Net income rose to $22.09 billion, or $0.89 per diluted share, versus $12.29B ($0.49/share) in the year-ago period. Non-GAAP EPS was $2.99, up 130% from a year ago.',
                'confidence_score': 0.98,
                'date_referenced': 'Q4 FY2025',
                'supporting_sources': ['https://www.nasdaq.com/articles/nvidia-q4-fy2025-earnings-detailed-analysis']
            },
            {
                'finding_id': 'f4',
                'finding_type': 'bearish_signal',
                'summary': 'Gross margin compressed to 73%, down 3 points YoY due to Blackwell production costs',
                'content': 'NVIDIA reported 73% gross margin in Q4, down 3 points year-over-year. The decline is attributed to newer data center products (Blackwell) being more complicated and expensive to produce.',
                'confidence_score': 0.94,
                'date_referenced': 'Q4 FY2025',
                'supporting_sources': ['https://futurumgroup.com/insights/nvidia-q4-fy-2025-ai-momentum-strengthens-despite-margin-pressures/']
            },
            {
                'finding_id': 'f5',
                'finding_type': 'bearish_signal',
                'summary': 'China market share collapsed from 95% (2022) to ~0% for advanced AI chips due to export controls',
                'content': 'CEO Jensen Huang confirmed NVIDIA holds "zero share in China\'s highly competitive market for data center compute" for advanced AI chips, down from 95% in 2022. China represented 17% of fiscal 2025 revenue. Lost opportunity estimated at $8B-$50B.',
                'confidence_score': 0.93,
                'date_referenced': 'November 2025',
                'supporting_sources': ['https://www.insiderfinance.io/news/nvidia-china-export-controls-keep-blackwell-chips-out']
            },
            {
                'finding_id': 'f6',
                'finding_type': 'prediction',
                'summary': 'Q1 FY2026 guidance of ~$43B (+2%) beats analyst expectations of $41.78B',
                'content': 'NVIDIA expects Q1 FY2026 revenue of approximately $43 billion (±2%), versus analyst expectations of $41.78B. Gross margins projected at 70.6% (GAAP) and 71.0% (non-GAAP).',
                'confidence_score': 0.95,
                'date_referenced': 'Q1 FY2026 Guidance',
                'supporting_sources': ['https://nvidianews.nvidia.com/news/nvidia-announces-financial-results-for-fourth-quarter-and-fiscal-2025']
            },
            {
                'finding_id': 'f7',
                'finding_type': 'risk',
                'summary': 'Stock dropped 8.5% post-earnings despite beat; DeepSeek concerns caused 11% drop earlier',
                'content': 'Concerns over tightening margins, supply constraints, and high expectations contributed to 8.5% stock decline post-earnings. Earlier, DeepSeek (Chinese lab training competitive models with less compute) caused 11% drop from January 2025 high.',
                'confidence_score': 0.91,
                'date_referenced': 'February 2025',
                'supporting_sources': ['https://get.ycharts.com/resources/blog/nvidias-strong-q4-2025-earnings-what-it-means-for-investors-financial-advisors/']
            },
            {
                'finding_id': 'f8',
                'finding_type': 'bullish_signal',
                'summary': 'Hyperscaler CapEx commitments massive: Meta $65B, Alphabet $75B, Amazon $100B+ in 2025',
                'content': 'Major clients are significantly increasing AI infrastructure spending: Meta plans up to $65 billion on AI data centers in 2025, Alphabet forecasts $75 billion, and Amazon could spend over $100 billion.',
                'confidence_score': 0.92,
                'date_referenced': '2025',
                'supporting_sources': ['https://www.cnbc.com/2025/02/26/nvidia-nvda-earnings-report-q4-2025.html']
            },
        ],
        'perspectives': [
            {
                'perspective_type': 'institutional_investor',
                'analysis_text': 'NVIDIA delivered exceptional Q4 results with $39.33B revenue beating estimates and $11B Blackwell contribution in its first quarter. The 91% data center revenue concentration and hyperscaler CapEx commitments ($240B+ combined from Meta, Alphabet, Amazon) provide strong visibility. However, margin compression to 73% and China export restrictions ($8-50B lost opportunity) warrant attention. With 17/18 analysts at buy and $175 price target, the stock remains attractive despite 8.5% post-earnings pullback.',
                'key_insights': [
                    'Data center revenue up 93% YoY to $35.6B, representing 91% of total sales',
                    'Blackwell ramped to $11B in first quarter - fastest product launch ever',
                    'Hyperscaler commitments of $240B+ provide multi-year demand visibility',
                    '17 of 18 analysts maintain buy rating with ~$175 price target'
                ],
                'predictions': [
                    {'prediction': 'NVIDIA reaches $175 stock price within 12 months', 'confidence': 0.70, 'timeline': 'Q1 2026', 'rationale': 'Strong fundamentals and hyperscaler spending support valuation'},
                    {'prediction': 'Data center revenue exceeds $150B in FY2026', 'confidence': 0.75, 'timeline': 'FY2026', 'rationale': 'Blackwell ramp and backlog visibility support continued growth'}
                ],
                'warnings': ['Margin compression trend may continue as Blackwell scales', 'China opportunity ($50B) remains locked out']
            },
            {
                'perspective_type': 'quantitative_risk',
                'analysis_text': 'Risk metrics show elevated but manageable concerns. Gross margin decline of 300bps YoY signals production cost pressures. China exposure created $8-50B revenue gap. DeepSeek emergence demonstrates potential for efficient AI training to disrupt compute demand assumptions. Stock volatility (8.5% post-earnings, 11% on DeepSeek) suggests market sensitivity to any growth deceleration.',
                'key_insights': [
                    'Gross margin compressed 300bps YoY to 73%',
                    'China market share collapsed from 95% to ~0%',
                    'DeepSeek showed competitive AI training possible with less compute',
                    'Stock shows high volatility to any negative news'
                ],
                'predictions': [
                    {'prediction': 'Gross margins stabilize at 71-73% range through 2025', 'confidence': 0.65, 'timeline': '2025', 'rationale': 'Blackwell production efficiencies will improve over time'}
                ],
                'warnings': ['DeepSeek-style efficiency breakthroughs could reduce compute demand', 'Huawei capturing China market with Ascend chips']
            }
        ],
        'sources': [
            {'title': 'NVIDIA Q4 FY2025 Earnings Press Release', 'url': 'https://nvidianews.nvidia.com/news/nvidia-announces-financial-results-for-fourth-quarter-and-fiscal-2025', 'credibility_score': 0.99, 'source_type': 'primary'},
            {'title': 'CNBC: NVIDIA Earnings Report Q4 2025', 'url': 'https://www.cnbc.com/2025/02/26/nvidia-nvda-earnings-report-q4-2025.html', 'credibility_score': 0.94, 'source_type': 'news'},
            {'title': 'Nasdaq: NVIDIA Q4 FY2025 Detailed Analysis', 'url': 'https://www.nasdaq.com/articles/nvidia-q4-fy2025-earnings-detailed-analysis', 'credibility_score': 0.93, 'source_type': 'analyst'},
            {'title': 'Futurum: NVIDIA Q4 AI Momentum Analysis', 'url': 'https://futurumgroup.com/insights/nvidia-q4-fy-2025-ai-momentum-strengthens-despite-margin-pressures/', 'credibility_score': 0.88, 'source_type': 'analyst'},
            {'title': 'InsiderFinance: NVIDIA China Export Controls', 'url': 'https://www.insiderfinance.io/news/nvidia-china-export-controls-keep-blackwell-chips-out', 'credibility_score': 0.85, 'source_type': 'news'},
            {'title': 'YCharts: NVIDIA Earnings Investment Insights', 'url': 'https://get.ycharts.com/resources/blog/nvidias-strong-q4-2025-earnings-what-it-means-for-investors-financial-advisors/', 'credibility_score': 0.87, 'source_type': 'analyst'},
        ],
    },

    'reputation': {
        'query': 'Is Temu Legitimate and Safe? Comprehensive Trust Analysis 2025',
        'template': 'reputation',
        'findings': [
            {
                'finding_id': 'f0',
                'finding_type': 'trust_signal',
                'summary': 'Temu is legitimate subsidiary of PDD Holdings - $128.79B public company on NASDAQ subject to SEC oversight',
                'content': 'Temu is a legitimate company from a corporate standpoint, with a $128.79 billion parent company (PDD Holdings) that is publicly traded on NASDAQ and subject to SEC oversight and financial audits.',
                'confidence_score': 0.96,
                'supporting_sources': ['https://www.security.org/digital-safety/is-temu-safe/']
            },
            {
                'finding_id': 'f1',
                'finding_type': 'warning_sign',
                'summary': 'BBB rates Temu C+ with 1,748 complaints closed in past year; not BBB accredited',
                'content': 'The Better Business Bureau has assigned Temu a C+ rating, with 1,748 customer complaints closed in the past year. Temu lacks BBB accreditation, which is the standard for major retailers.',
                'confidence_score': 0.93,
                'supporting_sources': ['https://www.bbb.org/us/ma/boston/profile/online-shopping/temucom-0021-553943/customer-reviews']
            },
            {
                'finding_id': 'f2',
                'finding_type': 'warning_sign',
                'summary': 'Trustpilot score of 2.2/5 significantly below competitors (Shein 4.0, Amazon 1.7)',
                'content': 'As of October 2025, Temu\'s Trustpilot score is 2.2 out of 5. For comparison, Shein holds 4.0 and Amazon has 1.7. Common complaints include delivery issues, product quality discrepancies, and misleading promotions.',
                'confidence_score': 0.91,
                'date_referenced': 'October 2025',
                'supporting_sources': ['https://www.trustpilot.com/review/temu.com']
            },
            {
                'finding_id': 'f3',
                'finding_type': 'warning_sign',
                'summary': '$2M federal penalty in 2025 for INFORM Act violations; multiple state AG lawsuits filed',
                'content': 'In 2025, Temu\'s U.S. operator agreed to a $2 million federal penalty for transparency failures related to the INFORM Consumers Act. Multiple U.S. state attorneys general filed lawsuits alleging data privacy breaches, deceptive trade practices, and forced labor products.',
                'confidence_score': 0.94,
                'date_referenced': '2025',
                'supporting_sources': ['https://nordvpn.com/blog/is-temu-safe/']
            },
            {
                'finding_id': 'f4',
                'finding_type': 'red_flag',
                'summary': 'Product safety failures: Seoul found toxic chemicals in children\'s items; EU found 18/19 toys broke safety rules',
                'content': 'Seoul authorities found children\'s hats, toys and shoes with toxic chemicals (lead, phthalates) above legal limits. EU researchers discovered 18 of 19 toys purchased on Temu broke safety rules. March 2025 experts identified fake car seats failing U.S. safety standards.',
                'confidence_score': 0.92,
                'date_referenced': '2024-2025',
                'supporting_sources': ['https://adguard.com/en/blog/is-temu-legit.html']
            },
            {
                'finding_id': 'f5',
                'finding_type': 'warning_sign',
                'summary': 'Data privacy concerns: Chinese ownership raises security risks; extensive personal data collection',
                'content': 'Temu is owned by PDD Holdings, a Shanghai-based Chinese company. This ownership has raised concerns about data privacy, security risks, and possible government influence. The platform collects personal information including names, emails, and payment details, sharing with third parties.',
                'confidence_score': 0.88,
                'supporting_sources': ['https://cyberguy.com/security/is-temu-safe-to-use-what-you-need-to-know/']
            },
            {
                'finding_id': 'f6',
                'finding_type': 'trust_signal',
                'summary': 'Purchase Protection Program offers refunds for damaged, misrepresented, or undelivered items',
                'content': 'Temu offers a Purchase Protection Program that can refund customers if items are damaged, not as pictured, or never delivered. Most users report successful refunds within the 90-day window, though customer service can be unhelpful.',
                'confidence_score': 0.85,
                'supporting_sources': ['https://www.avast.com/c-is-temu-legit']
            },
        ],
        'perspectives': [
            {
                'perspective_type': 'consumer_protection',
                'analysis_text': 'While Temu is a legally legitimate business backed by a $128B public company, consumers face significant risks. The $2M federal penalty, multiple state AG lawsuits, and product safety failures (toxic chemicals, fake car seats) indicate systemic compliance issues. The C+ BBB rating and 2.2 Trustpilot score reflect widespread customer dissatisfaction. Recommendation: Use only for low-cost, low-risk purchases where quality failures are acceptable.',
                'key_insights': [
                    'Legitimate company but lacks BBB accreditation standard for major retailers',
                    '$2M federal penalty and state AG lawsuits show regulatory non-compliance',
                    'Product safety failures documented by Seoul and EU authorities',
                    'Purchase Protection provides some buyer coverage'
                ],
                'predictions': [],
                'warnings': [
                    'Avoid electronics, safety items (car seats, children\'s products)',
                    'Do not purchase items requiring safety certification',
                    'Review data privacy settings carefully - Chinese ownership raises concerns',
                    'Expect potential quality issues and be prepared for disputes'
                ]
            },
            {
                'perspective_type': 'reputation_analyst',
                'analysis_text': 'Temu follows the ultra-low-cost retail model where price comes at the expense of quality and compliance. The pattern matches early Wish.com with similar complaint rates. The aggressive legal actions (multiple state AGs, federal penalty) signal U.S. regulators taking enforcement action. Chinese ownership and data practices create additional reputational headwinds.',
                'key_insights': [
                    'Business model prioritizes volume and price over quality control',
                    'Regulatory enforcement accelerating with federal and state actions',
                    'Similar complaint patterns to early Wish.com trajectory',
                    'Chinese ownership creates ongoing reputational challenges'
                ],
                'predictions': [
                    {'prediction': 'Additional regulatory actions in 2025', 'confidence': 0.75, 'timeline': '2025', 'rationale': 'Pattern of violations and state AG attention suggests more enforcement'},
                    {'prediction': 'Improved compliance processes within 18 months', 'confidence': 0.60, 'timeline': 'Q3 2026', 'rationale': 'Financial penalties and legal pressure will force improvements'}
                ],
                'warnings': ['Data privacy risks from Chinese ownership', 'Product safety compliance remains inconsistent']
            }
        ],
        'sources': [
            {'title': 'Security.org: Is Temu Safe?', 'url': 'https://www.security.org/digital-safety/is-temu-safe/', 'credibility_score': 0.90, 'source_type': 'analysis'},
            {'title': 'BBB: Temu Customer Reviews', 'url': 'https://www.bbb.org/us/ma/boston/profile/online-shopping/temucom-0021-553943/customer-reviews', 'credibility_score': 0.92, 'source_type': 'regulatory'},
            {'title': 'Trustpilot: Temu Reviews', 'url': 'https://www.trustpilot.com/review/temu.com', 'credibility_score': 0.85, 'source_type': 'reviews'},
            {'title': 'NordVPN: Is Temu Safe?', 'url': 'https://nordvpn.com/blog/is-temu-safe/', 'credibility_score': 0.87, 'source_type': 'analysis'},
            {'title': 'AdGuard: Is Temu Legit?', 'url': 'https://adguard.com/en/blog/is-temu-legit.html', 'credibility_score': 0.86, 'source_type': 'analysis'},
            {'title': 'CyberGuy: Temu Security Analysis', 'url': 'https://cyberguy.com/security/is-temu-safe-to-use-what-you-need-to-know/', 'credibility_score': 0.84, 'source_type': 'analysis'},
            {'title': 'Avast: Is Temu Legit?', 'url': 'https://www.avast.com/c-is-temu-legit', 'credibility_score': 0.85, 'source_type': 'security'},
        ],
    },

    'purchase_decision': {
        'query': 'Best Laptop for Software Development 2025: MacBook Pro M4 vs Dell XPS vs ThinkPad',
        'template': 'purchase_decision',
        'findings': [
            {
                'finding_id': 'f0',
                'finding_type': 'product_strength',
                'summary': 'MacBook Pro 14 M4 Pro is top pick for 2025: exceptional performance, 30+ hour battery, silent operation',
                'content': 'The MacBook Pro 14 with M4 Pro remains the top choice in 2025 for developers who want performance, portability, and battery life. The M4 Pro chip delivers blazing compile speeds, seamless multitasking, and efficient power use while staying silent. Battery life exceeds 30 hours in video tests.',
                'confidence_score': 0.94,
                'date_referenced': '2025',
                'supporting_sources': ['https://www.techradar.com/news/best-laptop-for-programming']
            },
            {
                'finding_id': 'f1',
                'finding_type': 'product_strength',
                'summary': 'ThinkPad X1 Carbon: legendary keyboard, 19.5hr battery, 2.47lbs - best for portable Linux development',
                'content': 'The Lenovo ThinkPad X1 Carbon offers one of the best typing experiences for developers with its legendary keyboard. Lunar Lake processor delivers up to 19.5 hours battery life. At 2.47 pounds, it\'s highly portable. Perfect for Python developers and backend engineers who value typing comfort and Linux flexibility.',
                'confidence_score': 0.92,
                'date_referenced': '2025',
                'supporting_sources': ['https://blog.stackademic.com/macbook-m4-vs-thinkpad-dev-edition-213cb11659f4']
            },
            {
                'finding_id': 'f2',
                'finding_type': 'product_strength',
                'summary': 'Dell XPS 14/16: Ultra-sleek design, excellent Intel Core Ultra performance, edge-to-edge tall display',
                'content': 'The Dell XPS 14 remains one of the best laptops for professional programming. Ultra-portable and ultra-sleek with Intel Core Ultra 7 155H chip. The XPS 16 offers edge-to-edge screen with tall aspect ratio for ample vertical IDE space. Best for C#/.NET and full-stack developers.',
                'confidence_score': 0.90,
                'date_referenced': '2025',
                'supporting_sources': ['https://www.simplymac.com/tech/best-laptops-for-programmers']
            },
            {
                'finding_id': 'f3',
                'finding_type': 'recommendation',
                'summary': '32GB RAM is new baseline for professional developers - 16GB is "the new 8GB" trap',
                'content': '16GB of RAM is described as a "trap" - the "new 8GB." For running multiple IDEs, browser tabs, containers, and local dev servers, 32GB RAM is the new practical baseline for any professional developer in late 2025.',
                'confidence_score': 0.91,
                'date_referenced': 'Late 2025',
                'supporting_sources': ['https://jakcomputer.com/blogs/news/best-laptop-for-developers-2025-powering-your-code-to-perfection']
            },
            {
                'finding_id': 'f4',
                'finding_type': 'product_strength',
                'summary': 'MacBook M4 Pro beats Intel/AMD competitors in Geekbench 6.3 benchmarks for compilation speed',
                'content': 'The M4 Pro chip delivers exceptional performance, surpassing many Intel and AMD competitors in benchmarks like Geekbench 6.3. M4 Pro compiles code 30-40% faster than Intel competitors. Best for iOS development (required), web development, and DevOps.',
                'confidence_score': 0.93,
                'date_referenced': '2025',
                'supporting_sources': ['https://www.rtings.com/laptop/reviews/best/by-usage/programming']
            },
            {
                'finding_id': 'f5',
                'finding_type': 'comparison',
                'summary': 'Linux flexibility best on ThinkPads and Dell XPS; macOS required for iOS development',
                'content': 'Linux flexibility is best on ThinkPads and Dell XPS models. ThinkPads are particularly well-suited for Python workflows, Linux setups, and backend development. macOS is required for iOS app development, making MacBook the only choice for iOS developers.',
                'confidence_score': 0.89,
                'supporting_sources': ['https://devstreaks.com/top-rated-laptops-for-developers-what-to-buy-in-2025/']
            },
        ],
        'perspectives': [
            {
                'perspective_type': 'technical_expert',
                'analysis_text': 'For pure development performance, the MacBook Pro M4 Pro is the clear winner with 30-40% faster compilation than Intel competitors and 30+ hour battery life. However, the choice depends on your stack: iOS developers must use Mac, .NET/C# developers may prefer Dell XPS with Windows, and Linux/backend developers will appreciate ThinkPad\'s keyboard and compatibility. The 32GB RAM minimum is non-negotiable for modern development workflows.',
                'key_insights': [
                    'M4 Pro compiles 30-40% faster than Intel competitors',
                    'MacBook Pro leads in battery life at 30+ hours',
                    'ThinkPad X1 Carbon has best keyboard for heavy typing',
                    '32GB RAM is minimum for professional development in 2025',
                    'Dell XPS offers best Windows/.NET development experience'
                ],
                'predictions': [],
                'warnings': ['16GB RAM is inadequate for modern dev workflows with containers', 'macOS adjustment needed for Windows/Linux developers']
            },
            {
                'perspective_type': 'value_analyst',
                'analysis_text': 'While MacBook Pro commands a premium, the total cost of ownership may favor it due to superior build quality, longer software support (7+ years), and better resale value (60-70% after 3 years vs 40-50% for Windows). Budget-conscious developers should consider base M4 (not M4 Pro) or previous-generation refurbished units.',
                'key_insights': [
                    'MacBook resale value: 60-70% after 3 years vs 40-50% Windows',
                    'Apple provides 7+ years software support',
                    'ThinkPads offer best value with upgradeability',
                    'Dell XPS provides premium build at mid-range price point'
                ],
                'predictions': [],
                'warnings': []
            }
        ],
        'sources': [
            {'title': 'TechRadar: Best Laptop for Programming 2025', 'url': 'https://www.techradar.com/news/best-laptop-for-programming', 'credibility_score': 0.91, 'source_type': 'review'},
            {'title': 'Stackademic: MacBook M4 vs ThinkPad Dev Edition', 'url': 'https://blog.stackademic.com/macbook-m4-vs-thinkpad-dev-edition-213cb11659f4', 'credibility_score': 0.85, 'source_type': 'comparison'},
            {'title': 'SimplyMac: Best Laptops for Programmers 2025', 'url': 'https://www.simplymac.com/tech/best-laptops-for-programmers', 'credibility_score': 0.86, 'source_type': 'review'},
            {'title': 'RTINGS: Best Laptops for Programming 2026', 'url': 'https://www.rtings.com/laptop/reviews/best/by-usage/programming', 'credibility_score': 0.92, 'source_type': 'benchmark'},
            {'title': 'JakComputer: Best Laptop for Developers 2025', 'url': 'https://jakcomputer.com/blogs/news/best-laptop-for-developers-2025-powering-your-code-to-perfection', 'credibility_score': 0.83, 'source_type': 'guide'},
            {'title': 'DevStreaks: Top-Rated Laptops for Developers 2025', 'url': 'https://devstreaks.com/top-rated-laptops-for-developers-what-to-buy-in-2025/', 'credibility_score': 0.82, 'source_type': 'guide'},
        ],
    },

    'investigative': {
        'query': 'OpenAI Leadership Crisis Investigation: Sam Altman Firing and Return (November 2023)',
        'template': 'investigative',
        'findings': [
            {
                'finding_id': 'f0',
                'finding_type': 'event',
                'summary': 'November 17, 2023: OpenAI board fires Sam Altman citing "not consistently candid" communications',
                'content': 'On November 17, 2023, OpenAI\'s board of directors ousted Sam Altman. Official statement: "the board no longer has confidence in his ability to continue leading OpenAI." The board said Altman "was not consistently candid in his communications with the board." Altman received notice via Google Meet text the night before.',
                'confidence_score': 0.98,
                'date_referenced': 'November 17, 2023',
                'supporting_sources': ['https://en.wikipedia.org/wiki/Removal_of_Sam_Altman_from_OpenAI']
            },
            {
                'finding_id': 'f1',
                'finding_type': 'revelation',
                'summary': 'Microsoft learned of firing "a minute" before public announcement despite $13B investment',
                'content': 'Microsoft CEO Satya Nadella and Microsoft learned of Altman\'s firing "a minute" before the world did, despite Microsoft\'s $13 billion investment in OpenAI. This blindsiding of the largest investor caused significant tension.',
                'confidence_score': 0.95,
                'date_referenced': 'November 17, 2023',
                'supporting_sources': ['https://www.axios.com/2023/11/22/openai-microsoft-sam-altman-ceo-chaos-timeline']
            },
            {
                'finding_id': 'f2',
                'finding_type': 'event',
                'summary': 'Greg Brockman resigns same evening; Mira Murati named interim CEO, then Emmett Shear on Nov 20',
                'content': 'Late November 17 evening, co-founder Greg Brockman announced he was quitting. OpenAI named CTO Mira Murati as interim CEO. On November 20, OpenAI announced Twitch co-founder Emmett Shear as another interim CEO.',
                'confidence_score': 0.97,
                'date_referenced': 'November 17-20, 2023',
                'supporting_sources': ['https://abcnews.go.com/Business/sam-altman-reaches-deal-return-ceo-openai/story?id=105091534']
            },
            {
                'finding_id': 'f3',
                'finding_type': 'event',
                'summary': 'November 20: Microsoft hires Altman and Brockman to lead new AI division',
                'content': 'On November 20, Microsoft CEO Satya Nadella announced they had hired Altman to lead a new artificial intelligence department, alongside Brockman and several other recently departed OpenAI employees.',
                'confidence_score': 0.97,
                'date_referenced': 'November 20, 2023',
                'supporting_sources': ['https://www.cnbc.com/video/2023/11/20/watch-a-timeline-of-the-drama-between-sam-altman-openai-and-microsoft.html']
            },
            {
                'finding_id': 'f4',
                'finding_type': 'evidence',
                'summary': '667 of ~770 employees (87%) signed letter demanding board resign or they join Altman at Microsoft',
                'content': 'About 667 of OpenAI\'s approximately 770 employees signed a letter demanding board members resign or employees would join Altman\'s new Microsoft venture. The letter stated: "Your actions have made it obvious that you are incapable of overseeing OpenAI." Microsoft had "assured" employees they would have jobs.',
                'confidence_score': 0.96,
                'date_referenced': 'November 20, 2023',
                'supporting_sources': ['https://www.cnbc.com/2023/11/20/hundreds-of-openai-employees-threaten-to-follow-altman-to-microsoft-unless-board-resigns-reports-say.html']
            },
            {
                'finding_id': 'f5',
                'finding_type': 'actor',
                'summary': 'Ilya Sutskever (chief scientist, board member) publicly regretted his role in firing within days',
                'content': 'OpenAI chief scientist Ilya Sutskever, who was on the board and initially supported the firing, publicly said he deeply regretted his role in Altman\'s ouster. He was among the 667 employees who signed the letter demanding board resignation.',
                'confidence_score': 0.94,
                'date_referenced': 'November 20, 2023',
                'supporting_sources': ['https://www.cnbc.com/2023/11/20/hundreds-of-openai-employees-threaten-to-follow-altman-to-microsoft-unless-board-resigns-reports-say.html']
            },
            {
                'finding_id': 'f6',
                'finding_type': 'event',
                'summary': 'November 21: Altman returns as CEO with new board; Microsoft gets non-voting observer seat',
                'content': 'On November 21, OpenAI announced a "deal in principle" for Altman to return as CEO with a new board chaired by former Salesforce co-CEO Bret Taylor. On November 29, OpenAI officially reinstated Altman as CEO, Brockman as president, and Microsoft received a non-voting observer seat.',
                'confidence_score': 0.98,
                'date_referenced': 'November 21-29, 2023',
                'supporting_sources': ['https://en.wikipedia.org/wiki/Removal_of_Sam_Altman_from_OpenAI']
            },
            {
                'finding_id': 'f7',
                'finding_type': 'evidence',
                'summary': 'WilmerHale investigation (March 2024) found Altman\'s conduct "did not mandate removal"',
                'content': 'Law firm WilmerHale conducted an investigation into the circumstances and found in March 2024 that Altman\'s "conduct did not mandate removal." The investigation cleared Altman of the vague allegations that led to his firing.',
                'confidence_score': 0.93,
                'date_referenced': 'March 2024',
                'supporting_sources': ['https://en.wikipedia.org/wiki/Removal_of_Sam_Altman_from_OpenAI']
            },
            {
                'finding_id': 'f8',
                'finding_type': 'revelation',
                'summary': 'Former board members Toner and McCauley accused Altman of "lying" and "psychological abuse" (May 2024)',
                'content': 'In May 2024, former board members Helen Toner and Tasha McCauley published an op-ed in The Economist accusing Altman of "lying" and "psychological abuse" against employees. Toner claimed Altman withheld information about ChatGPT release and his ownership of OpenAI\'s startup fund, and provided "inaccurate information about safety processes."',
                'confidence_score': 0.91,
                'date_referenced': 'May 26, 2024',
                'supporting_sources': ['https://time.com/6986711/openai-sam-altman-accusations-controversies-timeline/']
            },
        ],
        'perspectives': [
            {
                'perspective_type': 'governance_expert',
                'analysis_text': 'The OpenAI crisis represents a catastrophic governance failure of the nonprofit-controlling-for-profit structure. The board\'s inability to execute its decision (87% employee revolt, Microsoft leverage) exposed that the unique structure was inadequate for a company of OpenAI\'s scale. Key failures: no investor representation, inadequate due diligence before firing, and complete blindsiding of the $13B strategic partner.',
                'key_insights': [
                    'Non-profit board structure inappropriate for $100B+ commercial scale',
                    'Board blindsided Microsoft despite $13B investment - governance failure',
                    '87% employee revolt (667/770) demonstrated board powerlessness',
                    'WilmerHale investigation found removal "not mandated" - suggests board overreach',
                    'Microsoft\'s instant hiring showed leverage over board decisions'
                ],
                'predictions': [
                    {'prediction': 'OpenAI will restructure to conventional corporate governance', 'confidence': 0.85, 'timeline': '2025', 'rationale': 'Current structure unsustainable; nonprofit board cannot govern $100B entity effectively'},
                    {'prediction': 'Microsoft will gain formal board representation', 'confidence': 0.75, 'timeline': '2025', 'rationale': 'Non-voting observer status inadequate given investment and demonstrated leverage'}
                ],
                'warnings': ['Governance reforms may dilute safety-focused mission', 'Board independence compromised by employee/investor pressure']
            },
            {
                'perspective_type': 'tech_industry_analyst',
                'analysis_text': 'The 106-hour drama revealed Microsoft\'s extraordinary influence over OpenAI despite minority ownership. The speed of resolution (4 days from firing to reinstatement) demonstrated that commercial interests and employee loyalty trump board authority. The SEC investigation into investor communications suggests ongoing regulatory scrutiny.',
                'key_insights': [
                    'Microsoft effectively has veto power through employment alternative',
                    'Employee leverage (87% signing letter) unprecedented in tech history',
                    'SEC reportedly investigating investor communications',
                    'Event accelerated AI governance policy discussions globally',
                    'Toner/McCauley accusations suggest unresolved internal conflicts'
                ],
                'predictions': [
                    {'prediction': 'Additional board-level conflicts likely within 24 months', 'confidence': 0.65, 'timeline': '2025-2026', 'rationale': 'Underlying tensions (safety vs commercial) unresolved'}
                ],
                'warnings': ['Safety mission may be subordinated to commercial interests', 'Ongoing SEC investigation creates regulatory overhang']
            }
        ],
        'sources': [
            {'title': 'Wikipedia: Removal of Sam Altman from OpenAI', 'url': 'https://en.wikipedia.org/wiki/Removal_of_Sam_Altman_from_OpenAI', 'credibility_score': 0.90, 'source_type': 'encyclopedia'},
            {'title': 'Axios: OpenAI Chaos Timeline', 'url': 'https://www.axios.com/2023/11/22/openai-microsoft-sam-altman-ceo-chaos-timeline', 'credibility_score': 0.92, 'source_type': 'news'},
            {'title': 'ABC News: Sam Altman Firing Timeline', 'url': 'https://abcnews.go.com/Business/sam-altman-reaches-deal-return-ceo-openai/story?id=105091534', 'credibility_score': 0.93, 'source_type': 'news'},
            {'title': 'CNBC: OpenAI Employee Letter', 'url': 'https://www.cnbc.com/2023/11/20/hundreds-of-openai-employees-threaten-to-follow-altman-to-microsoft-unless-board-resigns-reports-say.html', 'credibility_score': 0.94, 'source_type': 'news'},
            {'title': 'TIME: OpenAI Accusations Timeline', 'url': 'https://time.com/6986711/openai-sam-altman-accusations-controversies-timeline/', 'credibility_score': 0.91, 'source_type': 'news'},
            {'title': 'CNBC Video: OpenAI Drama Timeline', 'url': 'https://www.cnbc.com/video/2023/11/20/watch-a-timeline-of-the-drama-between-sam-altman-openai-and-microsoft.html', 'credibility_score': 0.93, 'source_type': 'news'},
        ],
    },
}


# =============================================================================
# VIEW CONFIGURATION
# =============================================================================

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
            except Exception as e:
                print(f"  Warning: Failed to render {data_key}: {e}")
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
    return content if content else '<div class="empty-view">No data available for this view</div>'


def generate_html(template_type, data):
    result = {'template': template_type, 'status': 'completed', **data}
    component_data = prepare_component_data(result)
    css = get_component_styles()
    views = get_views(template_type)

    findings = data.get('findings', [])
    sources = data.get('sources', [])
    findings_count = len(findings)
    sources_count = len(sources)
    avg_conf = sum(f.get('confidence_score', 0.5) for f in findings) / max(findings_count, 1)
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

    generated_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

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
.generated-meta {{ font-size: var(--text-xs); color: var(--c-muted); margin-top: var(--s-2); }}
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
<div class="generated-meta">Generated: {generated_at} | Real web research data</div>
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

    print("=" * 60)
    print("GENERATING REALISTIC RESEARCH REPORTS")
    print("Based on actual web research data (January 2025)")
    print("=" * 60)
    print(f"\nOutput: {output_dir}\n")

    for template_type, data in REAL_RESEARCH.items():
        print(f"[{template_type.upper()}]")
        print(f"  Query: {data['query'][:60]}...")
        print(f"  Findings: {len(data['findings'])}")
        print(f"  Sources: {len(data['sources'])}")
        print(f"  Perspectives: {len(data['perspectives'])}")

        html = generate_html(template_type, data)
        output_file = os.path.join(output_dir, f'real_research_{template_type}.html')
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html)
        print(f"  -> Saved: {output_file}\n")

    print("=" * 60)
    print(f"Generated {len(REAL_RESEARCH)} realistic research reports!")
    print("Open the HTML files in a browser to view.")
    print("=" * 60)


if __name__ == '__main__':
    main()
