/**
 * Competitive Analysis Template Configuration
 *
 * Migrated from: actor/src/templates/competitive.py
 *
 * Template for competitive intelligence including:
 * - Deep competitive intelligence, market positioning, strategic analysis
 * - Competitor profiles, market share data, strategic moves
 * - Threats, opportunities, and competitive dynamics
 */

import { TemplateConfig } from '../types';

export const competitiveConfig: TemplateConfig = {
  // ---- Identity ----
  templateId: 'competitive',
  templateName: 'Competitive Analysis',
  description: 'Deep competitive intelligence, market positioning, and strategic analysis',

  // ---- Search Phase Configuration ----
  searchIntro:
    'You are a competitive intelligence analyst planning research for a comprehensive competitive analysis.',

  searchAngles: [
    {
      name: 'MARKET OVERVIEW',
      items: [
        'Total addressable market size and growth rate',
        'Market segmentation and dynamics',
        'Industry value chain analysis',
      ],
    },
    {
      name: 'COMPETITOR IDENTIFICATION',
      items: [
        'Direct competitors by market segment',
        'Indirect and emerging competitors',
        'Potential new entrants and substitutes',
      ],
    },
    {
      name: 'COMPETITOR PROFILES',
      items: [
        'Business model and revenue streams',
        'Product/service offerings and differentiation',
        'Geographic presence and expansion plans',
        'Recent news, announcements, product launches',
      ],
    },
    {
      name: 'FINANCIAL COMPARISON',
      items: [
        'Revenue, growth rates, margins',
        'Market share estimates',
        'Investment and R&D spending',
        'Profitability and unit economics',
      ],
    },
    {
      name: 'STRATEGIC POSITIONING',
      items: [
        'Value propositions and target customers',
        'Pricing strategies and models',
        'Distribution and go-to-market approaches',
        'Partnerships and ecosystem plays',
      ],
    },
    {
      name: 'COMPETITIVE ADVANTAGES',
      items: [
        'Technology and IP advantages',
        'Network effects and switching costs',
        'Scale and cost advantages',
        'Brand and reputation',
      ],
    },
    {
      name: 'CUSTOMER INTELLIGENCE',
      items: [
        'Customer reviews and satisfaction',
        'Win/loss analysis patterns',
        'Customer concentration',
        'Churn and retention data',
      ],
    },
    {
      name: 'TALENT AND CULTURE',
      items: [
        'Leadership team background',
        'Key hires and departures',
        'Glassdoor/Indeed reviews',
        'Engineering talent and culture',
      ],
    },
    {
      name: 'WEAKNESSES AND THREATS',
      items: [
        'Known vulnerabilities',
        'Customer complaints',
        'Regulatory challenges',
        'Strategic missteps',
      ],
    },
    {
      name: 'FUTURE OUTLOOK',
      items: [
        'Stated strategies and roadmaps',
        'M&A activity and rumors',
        'Industry trend positioning',
      ],
    },
  ],

  searchDepthGuidance: {
    quick: 'Focus on top 3 competitors with key metrics only',
    standard: 'Cover 5-7 competitors with balanced analysis',
    deep: 'Comprehensive coverage of 10+ competitors with detailed profiles',
  },

  // ---- Extraction Phase Configuration ----
  extractionIntro:
    'You are a competitive intelligence analyst extracting key findings for strategic decision-making.',

  findingTypes: [
    {
      name: 'fact',
      displayName: 'Market Data',
      description:
        'Market size, growth rates, segments. Include: metric, value, source, date. Note methodology if available.',
      extractedDataSchema:
        '{"metric": "...", "value": "...", "period": "...", "growth": "...", "source": "..."}',
      analysisFallback:
        'This market data provides context for understanding the competitive landscape.',
    },
    {
      name: 'actor',
      displayName: 'Competitor Profile',
      description:
        'Company overview, positioning, strategy. Include: company name, segment, key metrics. Note strengths and weaknesses.',
      extractedDataSchema:
        '{"company": "...", "segment": "...", "revenue": "...", "market_share": "...", "strengths": [...], "weaknesses": [...]}',
      analysisFallback:
        'This competitor profile helps understand their market position and strategic focus.',
    },
    {
      name: 'event',
      displayName: 'Market Event',
      description:
        'Product launches, M&A, leadership changes. Include: date, companies involved, impact. Note strategic implications.',
      extractedDataSchema:
        '{"date": "...", "companies": [...], "event_type": "...", "impact": "..."}',
      analysisFallback:
        'This market event may signal strategic shifts or competitive dynamics changes.',
    },
    {
      name: 'relationship',
      displayName: 'Competitive Dynamics',
      description:
        'Head-to-head competition, partnerships, ecosystems. Include: companies, nature of relationship. Note competitive intensity.',
      extractedDataSchema:
        '{"company_a": "...", "company_b": "...", "relationship_type": "...", "competitive_intensity": "high/medium/low"}',
      analysisFallback:
        'This competitive relationship reveals market dynamics and potential strategic implications.',
    },
    {
      name: 'evidence',
      displayName: 'Market Share Data',
      description:
        'Market share percentages, rankings. Include: source, methodology, time period. Note trends and changes.',
      extractedDataSchema:
        '{"company": "...", "market_share": "...", "ranking": "...", "source": "...", "period": "...", "trend": "..."}',
      analysisFallback: 'This market share data helps quantify competitive positions.',
    },
    {
      name: 'pattern',
      displayName: 'Strategic Move',
      description:
        'Pricing changes, go-to-market shifts, pivots. Include: company, action, timing. Note competitive response.',
      extractedDataSchema:
        '{"company": "...", "action": "...", "timing": "...", "competitive_response": "..."}',
      analysisFallback: 'This strategic move may indicate shifts in competitive strategy.',
    },
    {
      name: 'claim',
      displayName: 'Customer Intelligence',
      description:
        'Customer feedback, satisfaction, preferences. Include: sentiment, specifics, volume. Note credibility of source.',
      extractedDataSchema:
        '{"source": "...", "sentiment": "positive/negative/mixed", "volume": "...", "key_themes": [...]}',
      analysisFallback:
        'This customer intelligence provides insight into market perceptions and preferences.',
    },
    {
      name: 'prediction',
      displayName: 'Threats and Opportunities',
      description:
        'Emerging threats, market opportunities. Include: threat/opportunity, likelihood, timeline. Note strategic implications.',
      extractedDataSchema:
        '{"type": "threat/opportunity", "description": "...", "likelihood": "high/medium/low", "timeline": "...", "implications": "..."}',
      analysisFallback:
        'This forward-looking assessment identifies potential strategic considerations.',
    },
    {
      name: 'gap',
      displayName: 'Gap',
      description:
        'Missing competitive data. Information needed for complete analysis. Suggested intelligence gathering.',
      extractedDataSchema:
        '{"information_needed": "...", "importance": "high/medium/low", "suggested_sources": [...]}',
      analysisFallback:
        'This gap in competitive intelligence should be addressed for a complete analysis.',
    },
  ],

  extractionGuidelines: `CRITICAL: The "analysis" field must provide substantive strategic reasoning, not just restate the finding.
Good example: "This market share gain is significant because it crosses the 30% threshold typically required for pricing power. Historically, companies reaching this level have been able to raise prices 5-10% without significant churn. Competitors will likely respond with aggressive bundling or price cuts within 6 months."

IMPORTANT:
- Be skeptical of vendor-provided market share data
- Note methodology differences between market research sources
- Distinguish between market leadership claims and verified data`,

  analysisInstruction: `YOUR EXPERT ANALYTICAL COMMENTARY (REQUIRED - 2-4 sentences) explaining:
  * WHY this finding matters for competitive positioning
  * What STRATEGIC IMPLICATIONS it has for market players
  * How this COMPARES to historical patterns or industry norms
  * What ACTIONS or responses this might trigger from competitors`,

  // ---- Ordering & Grouping ----
  priorityFindingTypes: ['actor', 'evidence', 'fact', 'relationship', 'pattern'],
  groupingOrder: [
    'actor',
    'evidence',
    'fact',
    'relationship',
    'pattern',
    'event',
    'claim',
    'prediction',
    'gap',
  ],

  // ---- Perspectives ----
  // Expert perspectives for competitive intelligence
  perspectives: [
    'strategy_consultant', // Porter's forces, competitive positioning
    'industry_insider', // Operational realities, customer dynamics
    'institutional_investor', // Long-term value, moat durability
    'short_seller', // Skeptical view, hidden weaknesses
  ],

  // ---- Verification ----
  // Competitive analysis is rife with vendor marketing and inflated claims
  // Market share numbers vary wildly, need to detect promotional content
  verificationConfig: {
    crossReference: 'standard', // Market data varies by methodology
    biasDetection: 'thorough', // Vendors inflate their position
    expertSanityCheck: 'standard', // Flag unrealistic market claims
    sourceQuality: 'standard', // Mix of analyst and vendor sources
  },

  // ---- Resource Limits ----
  defaultMaxSearches: 10,
};

export default competitiveConfig;
