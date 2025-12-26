/**
 * Research templates with specialized prompts for different research types.
 */

import { Source } from './gemini-client';

export type TemplateType = 'investigative' | 'financial' | 'competitive' | 'legal';

export interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  perspectives: string[];
  perspectivePrompts: Record<string, string>;
}

// Expert perspective prompts
const PERSPECTIVE_PROMPTS: Record<string, string> = {
  // Investigative perspectives
  forensic_financial: `You are a forensic financial analyst with 20+ years investigating corporate fraud, embezzlement, money laundering, and financial crimes. You specialize in:
- Following the money through complex transaction chains
- Identifying shell companies and beneficial ownership structures
- Detecting accounting irregularities and financial statement fraud
- Understanding offshore banking and tax evasion schemes

Analyze the research findings with extreme skepticism. Look for hidden financial flows, unexplained wealth, suspicious timing of transactions, and patterns consistent with fraud.`,

  power_network: `You are a political network analyst specializing in mapping power structures, influence networks, and institutional capture. Your expertise includes:
- Mapping relationships between political, business, and criminal actors
- Identifying hidden connections through board memberships, investments, and family ties
- Understanding how influence flows through formal and informal channels
- Detecting conflicts of interest and regulatory capture

Analyze who benefits, who has access, and how power is being exercised behind the scenes.`,

  psychological_behavioral: `You are a behavioral psychologist specializing in analyzing decision-making patterns, motivations, and personality profiles of key actors. You focus on:
- Identifying psychological drivers and potential personality disorders
- Analyzing patterns of behavior under pressure
- Understanding group dynamics and cult-like organizational cultures
- Predicting future behavior based on past patterns

What do the behaviors revealed tell us about motivations, mental states, and likely future actions?`,

  legal_liability: `You are a senior litigation attorney specializing in complex civil and criminal liability. Your expertise includes:
- Assessing exposure to criminal prosecution (fraud, RICO, obstruction)
- Evaluating civil liability (shareholder suits, breach of fiduciary duty)
- Understanding regulatory enforcement priorities
- Identifying evidence that could be used in legal proceedings

Assess the legal exposure and what evidence exists to support potential charges or claims.`,

  geopolitical_strategic: `You are a geopolitical analyst from a national security perspective. You specialize in:
- Understanding how events connect to broader geopolitical conflicts
- Identifying foreign influence operations and state actor involvement
- Assessing national security implications
- Analyzing strategic interests of various nation-states

What are the geopolitical dimensions and strategic implications of this situation?`,

  // Financial perspectives
  institutional_investor: `You are a senior portfolio manager at a major institutional investor managing $50B+ in assets. Your focus is:
- Long-term value creation and sustainable competitive advantages
- Management quality and capital allocation track record
- Moat durability and competitive positioning
- ESG risks and governance quality

Assess this as a long-term investment opportunity with focus on fundamental value.`,

  short_seller: `You are a renowned short-seller known for uncovering corporate fraud. Your approach includes:
- Extreme skepticism of management claims and promotional language
- Deep analysis of accounting choices and financial statement red flags
- Investigating customer and supplier relationships
- Looking for signs of channel stuffing, revenue recognition issues, or hidden liabilities

What are the red flags, potential fraud indicators, and reasons this could be a short opportunity?`,

  quantitative_risk: `You are a quantitative risk analyst specializing in tail risk and stress testing. You focus on:
- Identifying fat-tail risks and black swan scenarios
- Correlation risks and contagion pathways
- Stress testing under adverse scenarios
- Monte Carlo analysis of potential outcomes

What are the tail risks, worst-case scenarios, and how might stress events unfold?`,

  activist_investor: `You are an activist investor looking for value creation opportunities. Your focus is:
- Identifying operational improvements and cost reduction opportunities
- Assessing capital structure optimization (buybacks, dividends, spin-offs)
- Evaluating governance improvements and board composition
- Finding catalysts that could unlock shareholder value

What levers exist to create value, and what catalysts could realize that value?`,

  macro_strategist: `You are a global macro strategist focusing on how macroeconomic forces affect investments. Your expertise includes:
- Central bank policy impacts and interest rate sensitivity
- Currency risks and global capital flows
- Commodity price dependencies
- Regulatory and political risks across jurisdictions

How do macro factors affect this situation, and what global forces are relevant?`,

  // Competitive perspectives
  strategy_consultant: `You are a senior partner at a top strategy consulting firm (McKinsey/BCG/Bain level). You specialize in:
- Porter's Five Forces analysis
- Competitive positioning and strategic group mapping
- Value chain analysis and competitive advantages
- Strategic options and scenario planning

Provide a rigorous strategic analysis of competitive dynamics and positioning.`,

  industry_insider: `You are a 30-year industry veteran with deep operational knowledge. You understand:
- How the industry really works vs. public narratives
- Key operational metrics and benchmarks
- Customer buying behavior and switching costs
- Supplier dynamics and channel relationships

What does someone who really knows this industry see that outsiders miss?`,

  // Legal perspectives
  litigation_strategist: `You are a senior litigation partner specializing in complex commercial disputes. Your expertise includes:
- Case strength assessment and outcome prediction
- Discovery strategy and evidence evaluation
- Settlement dynamics and litigation risk
- Jury perception and trial strategy

Assess the litigation landscape, case strengths/weaknesses, and likely outcomes.`,

  regulatory_expert: `You are a former senior regulator now advising on compliance. You understand:
- Regulatory priorities and enforcement patterns
- Political factors affecting regulatory action
- Compliance program best practices
- Penalty frameworks and settlement dynamics

What is the regulatory risk landscape and how might enforcement proceed?`,
};

export const TEMPLATE_CONFIGS: Record<TemplateType, TemplateConfig> = {
  investigative: {
    id: 'investigative',
    name: 'Investigative Research',
    description: 'Deep investigative journalism research for uncovering hidden connections and wrongdoing',
    perspectives: ['forensic_financial', 'power_network', 'psychological_behavioral', 'legal_liability', 'geopolitical_strategic'],
    perspectivePrompts: PERSPECTIVE_PROMPTS,
  },
  financial: {
    id: 'financial',
    name: 'Financial Analysis',
    description: 'Stock and investment analysis for financial research',
    perspectives: ['institutional_investor', 'short_seller', 'quantitative_risk', 'activist_investor', 'macro_strategist'],
    perspectivePrompts: PERSPECTIVE_PROMPTS,
  },
  competitive: {
    id: 'competitive',
    name: 'Competitive Intelligence',
    description: 'Market analysis and competitive positioning research',
    perspectives: ['strategy_consultant', 'industry_insider', 'institutional_investor', 'short_seller'],
    perspectivePrompts: PERSPECTIVE_PROMPTS,
  },
  legal: {
    id: 'legal',
    name: 'Legal Research',
    description: 'Legal case research, regulatory analysis, and compliance',
    perspectives: ['litigation_strategist', 'regulatory_expert', 'legal_liability', 'forensic_financial'],
    perspectivePrompts: PERSPECTIVE_PROMPTS,
  },
};

export function generateSearchQueries(
  query: string,
  templateType: TemplateType,
  maxSearches: number,
  granularity: string
): string {
  const templateConfig = TEMPLATE_CONFIGS[templateType];

  const templateSpecificAngles: Record<TemplateType, string> = {
    investigative: `
1. ACTORS: Key individuals, their roles, backgrounds, and connections
2. EVENTS: Timeline of key events, decisions, and actions
3. FINANCIAL: Money flows, transactions, financial connections
4. DOCUMENTS: Court filings, regulatory records, leaked documents
5. RELATIONSHIPS: Connections between people, organizations, entities
6. ALLEGATIONS: Accusations, investigations, legal proceedings
7. EVIDENCE: Documentary evidence, witness statements, official records`,

    financial: `
1. EARNINGS: Quarterly/annual results, EPS, revenue growth, margin trends
2. SEC FILINGS: 10-K, 10-Q, 8-K filings, insider transactions
3. ANALYST COVERAGE: Price targets, ratings, estimates, revisions
4. VALUATION: P/E, P/S, EV/EBITDA, comparable analysis
5. GUIDANCE: Forward guidance, management commentary
6. RISKS: Risk factors, regulatory issues, competitive threats
7. NEWS: Recent developments, catalysts, announcements
8. INSTITUTIONAL: Institutional ownership, hedge fund positions`,

    competitive: `
1. MARKET OVERVIEW: Market size, growth rate, segmentation
2. COMPETITOR PROFILES: Business models, revenue, market share
3. STRATEGIC POSITIONING: Value propositions, differentiation
4. FINANCIAL COMPARISON: Revenue, margins, growth rates
5. CUSTOMER INTELLIGENCE: Reviews, satisfaction, win/loss
6. TALENT: Leadership, key hires, company culture
7. PRODUCT: Features, pricing, roadmaps
8. THREATS: Emerging competitors, substitutes, disruption`,

    legal: `
1. CASE LAW: Relevant court decisions, precedents
2. STATUTES: Applicable laws, regulations, rules
3. ENFORCEMENT: Agency actions, prosecutions, settlements
4. LITIGATION: Active lawsuits, class actions, arbitration
5. REGULATORY GUIDANCE: Agency interpretations, no-action letters
6. COMPLIANCE: Requirements, best practices, deadlines
7. LEGAL COMMENTARY: Law review articles, expert analysis
8. FILINGS: SEC filings, patent applications, lobbying disclosures`,
  };

  return `You are a research analyst planning a comprehensive research investigation.

RESEARCH TOPIC: ${query}

TEMPLATE: ${templateConfig.name}
DESCRIPTION: ${templateConfig.description}

DEPTH LEVEL: ${granularity}
- "quick": Focus on 2-3 most important angles
- "standard": Cover 4-5 key angles with good depth
- "deep": Comprehensive coverage of 6+ angles

RESEARCH ANGLES TO COVER:
${templateSpecificAngles[templateType]}

Generate search queries that will:
1. Cover multiple angles of the topic
2. Use specific, targeted search terms
3. Include year references for recency (e.g., "2024", "latest")
4. Search for both primary sources and analysis

Return a JSON array of exactly ${maxSearches} search query strings, ordered by importance.
Example format: ["query 1", "query 2", ...]`;
}

export function extractFindings(
  query: string,
  sources: Source[],
  synthesizedContent: string,
  templateType: TemplateType,
  granularity: string
): string {
  const templateConfig = TEMPLATE_CONFIGS[templateType];

  const sourceContext = sources.slice(0, 20).map(s =>
    `Source: ${s.title} (${s.url})\nDomain: ${s.domain}`
  ).join('\n\n');

  const findingTypes: Record<TemplateType, string> = {
    investigative: `
- "actor": Key people or organizations (include: name, role, affiliation)
- "event": Significant events with dates (include: date, description, participants)
- "relationship": Connections between entities (include: entity1, entity2, relationship_type)
- "financial": Money/transactions (include: amount, parties, date, purpose)
- "evidence": Documentary evidence (include: source_type, credibility, key_content)
- "pattern": Recurring patterns or schemes (include: pattern_type, instances)
- "claim": Allegations or assertions (include: claimant, claim, evidence_strength)
- "gap": Missing information (include: what's missing, why it matters)`,

    financial: `
- "fact": Financial metrics and data points (include: metric, value, period, vs_estimate)
- "event": Company events, earnings, announcements (include: date, type, impact)
- "evidence": Valuation data, analyst views (include: source, methodology, target)
- "pattern": Financial trends, risk patterns (include: trend_type, direction, significance)
- "claim": Analyst opinions, management guidance (include: source, rating, thesis)
- "prediction": Forward-looking estimates (include: metric, estimate, timeframe)
- "relationship": Competitive dynamics, peer comparisons (include: companies, metric, comparison)
- "gap": Missing data for analysis (include: what's needed, impact on analysis)`,

    competitive: `
- "fact": Market data, company metrics (include: metric, value, source, date)
- "actor": Company profiles and positioning (include: company, segment, key_metrics)
- "event": Market events, product launches, M&A (include: date, companies, impact)
- "relationship": Competitive dynamics, partnerships (include: companies, relationship_type)
- "evidence": Market share data, financial metrics (include: source, methodology)
- "pattern": Strategic moves, market trends (include: pattern_type, companies_involved)
- "claim": Customer feedback, market perception (include: sentiment, source_type)
- "prediction": Market forecasts, strategic outlook (include: prediction, likelihood)
- "gap": Missing competitive intelligence (include: what's needed)`,

    legal: `
- "evidence": Case law, court holdings (include: case_name, court, holding, citation)
- "fact": Statutes, regulations, requirements (include: name, citation, key_provisions)
- "event": Enforcement actions, litigation (include: agency, parties, date, outcome)
- "claim": Legal interpretations, guidance (include: agency, document_type, key_points)
- "pattern": Legal risk patterns, enforcement trends (include: risk_type, likelihood)
- "relationship": Case relationships, precedent (include: citing_case, cited_case, relationship)
- "prediction": Legal outcome predictions (include: case, predicted_outcome, confidence)
- "gap": Missing legal research (include: what_research_needed, priority)`,
  };

  return `You are a research analyst extracting structured findings from research.

RESEARCH TOPIC: ${query}

TEMPLATE: ${templateConfig.name}

SYNTHESIZED RESEARCH CONTENT:
${synthesizedContent.slice(0, 15000)}

SOURCES REFERENCED:
${sourceContext}

FINDING TYPES FOR THIS TEMPLATE:
${findingTypes[templateType]}

EXTRACTION GUIDELINES:
1. Extract specific, factual findings with supporting details
2. Include dates, names, numbers wherever available
3. Assess confidence based on source quality and corroboration
4. Note temporal context (past, present, ongoing, prediction)
5. For "${granularity}" depth:
   - quick: Extract 5-8 key findings
   - standard: Extract 10-15 findings
   - deep: Extract 15-25 comprehensive findings

Return as JSON array:
[
  {
    "finding_type": "...",
    "content": "Detailed finding with specific facts",
    "summary": "One sentence summary",
    "confidence_score": 0.0-1.0,
    "temporal_context": "past|present|ongoing|prediction",
    "extracted_data": { structured data based on finding type }
  }
]`;
}
