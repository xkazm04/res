/**
 * Financial Analysis Template Configuration
 *
 * Migrated from: actor/src/templates/financial.py
 *
 * Template for investment analysis including:
 * - Stock and financial analysis for investment research
 * - Earnings, fundamentals, analyst coverage, valuations
 * - Bull/bear case construction with risk analysis
 */

import { TemplateConfig } from '../types';

export const financialConfig: TemplateConfig = {
  // ---- Identity ----
  templateId: 'financial',
  templateName: 'Financial Analysis',
  description: 'Stock and financial analysis for investment research',

  // ---- Search Phase Configuration ----
  searchIntro:
    'You are a financial analyst planning comprehensive research for investment analysis.',

  searchAngles: [
    {
      name: 'EARNINGS AND FUNDAMENTALS',
      items: [
        'Recent quarterly and annual earnings reports',
        'Revenue trends, margins, profitability metrics',
        'Earnings beats/misses, guidance changes',
        'Balance sheet strength, cash flow analysis',
      ],
    },
    {
      name: 'ANALYST COVERAGE',
      items: [
        'Wall Street analyst ratings and price targets',
        'Buy/hold/sell recommendations',
        'Earnings estimates and revisions',
        'Recent analyst upgrades/downgrades',
      ],
    },
    {
      name: 'MARKET POSITION',
      items: [
        'Competitive landscape and market share',
        'Industry trends and tailwinds/headwinds',
        'Customer concentration and diversification',
        'Geographic revenue breakdown',
      ],
    },
    {
      name: 'RISK FACTORS',
      items: [
        'Regulatory and compliance risks',
        'Macro economic exposure',
        'Supply chain dependencies',
        'Legal and litigation issues',
      ],
    },
    {
      name: 'VALUATION',
      items: [
        'Current valuation multiples (P/E, EV/EBITDA, P/S)',
        'Historical valuation ranges',
        'Peer comparison valuations',
        'DCF and fair value estimates',
      ],
    },
    {
      name: 'NEWS AND CATALYSTS',
      items: [
        'Recent company announcements',
        'Product launches, partnerships, M&A',
        'Management changes, insider transactions',
        'Upcoming events (earnings, conferences)',
      ],
    },
    {
      name: 'ECOSYSTEM ANALYSIS',
      items: [
        'Top customers: revenue concentration',
        'Competitors: market share comparison',
        'For AI/chip companies: hyperscaler capex spending',
        'Supplier dependencies: supply chain risks',
      ],
    },
    {
      name: 'BEAR CASE RESEARCH',
      items: [
        'Short seller thesis and bear case risks',
        'Stock overvalued concerns',
        'Contrarian analysis and critiques',
      ],
    },
  ],

  searchDepthGuidance: {
    quick: '4-5 searches on key fundamentals and analyst sentiment',
    standard: '8-10 searches covering all areas INCLUDING ecosystem and bear case',
    deep: '12+ searches with comprehensive coverage including technicals',
  },

  // ---- Extraction Phase Configuration ----
  extractionIntro:
    'You are a financial analyst extracting key findings for investment research. CRITICAL: Use EXACT finding_type values specified below - they map to UI components.',

  findingTypes: [
    {
      name: 'bullish_signal',
      displayName: 'Bullish Signal',
      description:
        'Positive earnings surprises, revenue beats, margin expansion. Analyst upgrades, price target increases. Growth acceleration, market share gains. Strong guidance, positive management commentary.',
      extractedDataSchema:
        '{"metric": "...", "value": "...", "change": "...", "source": "...", "significance": "high/medium/low"}',
      analysisFallback:
        'This positive indicator suggests favorable conditions for the investment thesis.',
    },
    {
      name: 'bearish_signal',
      displayName: 'Bearish Signal',
      description:
        'Earnings misses, revenue declines, margin compression. Analyst downgrades, price target cuts. Growth deceleration, market share losses. Weak guidance, negative management tone.',
      extractedDataSchema:
        '{"metric": "...", "value": "...", "change": "...", "source": "...", "significance": "high/medium/low"}',
      analysisFallback:
        'This concerning signal warrants caution and may indicate downside risk.',
    },
    {
      name: 'risk',
      displayName: 'Risk Factor',
      description:
        'Business, market, regulatory, competitive risks. Debt concerns, liquidity issues, concentration risks. Key person dependencies, governance issues.',
      extractedDataSchema:
        '{"risk_type": "...", "severity": "high/medium/low", "likelihood": "high/medium/low", "mitigation": "..."}',
      analysisFallback:
        'This risk factor should be monitored as part of ongoing position management.',
    },
    {
      name: 'red_flag',
      displayName: 'Red Flag',
      description:
        'Accounting irregularities, restatements. Insider selling, executive departures. SEC investigations, legal issues, guidance cuts.',
      extractedDataSchema:
        '{"issue": "...", "severity": "critical/high/medium", "evidence": "...", "implications": "..."}',
      analysisFallback:
        'This red flag requires careful attention and may warrant reducing position size.',
    },
    {
      name: 'financial_metric',
      displayName: 'Financial Metric',
      description:
        'Revenue, EPS, margins with specific numbers. Valuation multiples (P/E, EV/EBITDA). Price targets with analyst attribution.',
      extractedDataSchema:
        '{"metric": "...", "value": "...", "period": "...", "analyst": "...", "rating": "...", "target_price": "..."}',
      analysisFallback:
        "This metric provides insight into the company's financial health and trajectory.",
    },
    {
      name: 'prediction',
      displayName: 'Prediction',
      description: 'Forward guidance, analyst forecasts. Industry trend predictions.',
      extractedDataSchema:
        '{"prediction": "...", "source": "...", "timeline": "...", "confidence": "high/medium/low"}',
      analysisFallback:
        'This forward-looking indicator may help inform investment timing decisions.',
    },
  ],

  extractionGuidelines: `CRITICAL: The "analysis" field must provide substantive reasoning, not just describe the finding.
Good example: "This exceptional growth rate significantly outpaces the broader semiconductor industry. The data center segment now represents 78% of total revenue, validating the AI infrastructure investment thesis. However, maintaining such growth rates will be increasingly difficult as the base grows larger."

IMPORTANT:
- Prioritize verified financial data from SEC filings
- Note analyst conflicts and investment banking relationships
- Be skeptical of overly optimistic projections`,

  analysisInstruction: `YOUR EXPERT FINANCIAL ANALYSIS (REQUIRED - 2-4 sentences) explaining:
  * Why this finding matters for the investment thesis
  * What it implies for the future
  * Any caveats or nuances investors should consider`,

  // ---- Ordering & Grouping ----
  priorityFindingTypes: [
    'bullish_signal',
    'bearish_signal',
    'risk',
    'red_flag',
    'financial_metric',
    'prediction',
  ],
  groupingOrder: [
    'bullish_signal',
    'bearish_signal',
    'financial_metric',
    'risk',
    'red_flag',
    'prediction',
  ],

  // ---- Perspectives ----
  // Expert perspectives for deep financial analysis
  perspectives: [
    'institutional_investor', // Long-term value creation, moats, management
    'short_seller', // Red flags, fraud detection, skeptical analysis
    'quantitative_risk', // Tail risks, stress testing, correlations
    'activist_investor', // Value creation levers, governance, catalysts
    'macro_strategist', // Economic cycles, policy risks, global context
  ],

  // ---- Verification ----
  // Financial analysis needs rigorous verification
  // Analysts have conflicts, numbers must be verified, projections questioned
  verificationConfig: {
    crossReference: 'thorough', // Verify financial numbers across sources
    biasDetection: 'thorough', // Analyst conflicts, investment banking ties
    expertSanityCheck: 'thorough', // Flag unrealistic valuations/projections
    sourceQuality: 'standard', // SEC filings are reliable, analyst reports vary
  },

  // ---- Resource Limits ----
  defaultMaxSearches: 8,
};

export default financialConfig;
