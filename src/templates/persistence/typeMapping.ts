/**
 * Type Mapping Utilities
 *
 * Maps template-specific finding and perspective types to Supabase schema types.
 * Preserves original types in extracted_data/specialized_data for template context.
 */

// ============================================
// FINDING TYPE MAPPING
// ============================================

/**
 * Maps template-specific finding types to Supabase schema-allowed types.
 *
 * Schema allows: 'fact', 'claim', 'event', 'actor', 'relationship', 'pattern', 'gap', 'evidence'
 */
export const FINDING_TYPE_MAP: Record<string, string> = {
  // Tech market template types
  tech_trend: 'pattern',
  market_trend: 'pattern',
  adoption_pattern: 'pattern',
  financial_metric: 'fact',
  prediction: 'claim',
  red_flag: 'evidence',

  // Financial template types
  bullish_signal: 'evidence',
  bearish_signal: 'evidence',
  risk: 'pattern',
  opportunity: 'pattern',
  catalyst: 'event',
  valuation_metric: 'fact',

  // Competitive template types
  competitive_advantage: 'pattern',
  market_position: 'fact',
  strategic_move: 'event',
  weakness: 'gap',
  threat: 'evidence',

  // Investigative template types
  actor: 'actor',
  event: 'event',
  relationship: 'relationship',
  financial: 'fact',
  evidence: 'evidence',
  pattern: 'pattern',
  gap: 'gap',
  connection: 'relationship',
  transaction: 'event',
  allegation: 'claim',

  // Due diligence template types
  risk_factor: 'evidence',
  compliance_issue: 'evidence',
  financial_health: 'fact',
  management_concern: 'evidence',
  legal_issue: 'evidence',
  operational_risk: 'pattern',

  // Legal template types
  legal_precedent: 'fact',
  ruling: 'event',
  legal_risk: 'evidence',
  regulatory_change: 'event',
  compliance_requirement: 'fact',
  liability: 'evidence',

  // Contract template types
  contract_term: 'fact',
  obligation: 'fact',
  risk_clause: 'evidence',
  favorable_term: 'fact',
  unfavorable_term: 'evidence',
  missing_protection: 'gap',

  // Reputation template types
  sentiment: 'pattern',
  controversy: 'event',
  positive_coverage: 'evidence',
  negative_coverage: 'evidence',
  brand_perception: 'pattern',

  // Purchase decision template types
  product_feature: 'fact',
  user_review: 'evidence',
  price_comparison: 'fact',
  alternative: 'fact',
  deal_breaker: 'evidence',
  recommendation: 'claim',

  // Understanding template types
  concept: 'fact',
  explanation: 'fact',
  example: 'evidence',
  misconception: 'gap',
  nuance: 'pattern',

  // Passthrough types (already schema-compliant)
  fact: 'fact',
  claim: 'claim',

  // Meta-analytical finding types (deep analysis)
  narrative_frame: 'pattern', // Framing patterns map to pattern
  coverage_asymmetry: 'evidence', // Differential coverage is evidence
  incentive_alignment: 'relationship', // Incentives reveal relationships
  suspicious_timing: 'event', // Timing is event-related
  historical_parallel: 'pattern', // Historical patterns
  network_inference: 'relationship', // Inferred relationships
  omission: 'gap', // What's NOT reported is a gap
  talking_point_origin: 'evidence', // First appearance of narratives
  funding_trace: 'fact', // Money behind research/reports (financial)
  regulatory_capture: 'relationship', // Regulatory relationships
  narrative_vs_reality: 'evidence', // Discrepancy between narrative and data
  smart_money_signal: 'evidence', // Sophisticated investor actions
  hype_reality_gap: 'evidence', // Marketing vs technical substance
};

/**
 * Maps a template-specific finding type to schema-allowed type.
 *
 * @param originalType - The original finding type from template output
 * @returns Object with schemaType for database and originalType for tracking
 */
export function mapFindingType(originalType: string): {
  schemaType: string;
  originalType: string;
} {
  const schemaType = FINDING_TYPE_MAP[originalType] || 'fact';
  return { schemaType, originalType };
}

// ============================================
// PERSPECTIVE TYPE MAPPING
// ============================================

/**
 * Maps custom perspective types to Supabase schema-allowed values.
 *
 * Schema allows: 'historical', 'political', 'economic', 'psychological', 'military',
 *                'social', 'technological', 'financial', 'journalist', 'conspirator', 'network'
 */
export const PERSPECTIVE_TYPE_MAP: Record<string, string> = {
  // Investigative perspectives (from Python)
  forensic_financial: 'financial',
  power_network: 'network',
  psychological_behavioral: 'psychological',
  geopolitical_strategic: 'political',
  legal_liability: 'political',

  // Financial/Investment perspectives (from Python)
  institutional_investor: 'financial',
  short_seller: 'financial',
  quantitative_risk: 'financial',
  activist_investor: 'financial',
  macro_strategist: 'economic',

  // Competitive analysis (from Python)
  strategy_consultant: 'economic',
  industry_insider: 'economic',

  // Legal perspectives (from Python)
  regulatory_expert: 'political',
  litigation_strategist: 'political',

  // Tech market perspectives (from Python)
  venture_capitalist: 'financial',
  startup_founder: 'technological',
  product_manager: 'technological',
  developer_advocate: 'technological',
  open_source_maintainer: 'technological',
  devrel_engineer: 'technological',
  senior_engineer: 'technological',
  platform_engineer: 'technological',

  // Contract analysis (from Python)
  contract_auditor: 'financial',
  procurement_investigator: 'political',
  forensic_accountant: 'financial',
  regulatory_compliance: 'political',
  industry_benchmarker: 'economic',

  // Additional perspectives for other templates
  market_analyst: 'economic',
  risk_analyst: 'financial',
  compliance_officer: 'political',
  consumer_advocate: 'social',
  industry_expert: 'economic',
  technical_reviewer: 'technological',
  security_researcher: 'technological',
  data_scientist: 'technological',
  ux_researcher: 'social',
  business_analyst: 'economic',
  investment_banker: 'financial',
  hedge_fund_manager: 'financial',
  retail_investor: 'financial',
  financial_journalist: 'journalist',
  investigative_journalist: 'journalist',
  academic_researcher: 'historical',
  policy_analyst: 'political',
  government_official: 'political',
  labor_economist: 'economic',
  environmental_analyst: 'social',
  ethics_researcher: 'social',
  historian: 'historical',
  sociologist: 'social',
  psychologist: 'psychological',
  legal_scholar: 'political',
  defense_analyst: 'military',
  intelligence_analyst: 'military',
  conspiracy_theorist: 'conspirator',
  whistleblower: 'journalist',
  insider: 'network',
  connected_source: 'network',

  // New analytical perspectives (deep analysis)
  narrative_analyst: 'journalist', // Narrative analysis is journalism-adjacent
  incentive_mapper: 'financial', // Incentive mapping is financial analysis
  historical_pattern: 'historical', // Historical pattern recognition
  omission_detective: 'journalist', // Omission detection is investigative journalism
  contrarian_synthesizer: 'financial', // Contrarian views (like short_seller)
};

/**
 * Valid perspective types allowed by the Supabase schema.
 */
export const VALID_PERSPECTIVE_TYPES = new Set([
  'historical',
  'political',
  'economic',
  'psychological',
  'military',
  'social',
  'technological',
  'financial',
  'journalist',
  'conspirator',
  'network',
]);

/**
 * Maps a template-specific perspective type to schema-allowed type.
 *
 * @param originalType - The original perspective type from template output
 * @returns Object with schemaType for database and originalType for tracking
 */
export function mapPerspectiveType(originalType: string): {
  schemaType: string;
  originalType: string;
} {
  // If already a valid schema type, use it directly
  if (VALID_PERSPECTIVE_TYPES.has(originalType)) {
    return { schemaType: originalType, originalType };
  }

  const schemaType = PERSPECTIVE_TYPE_MAP[originalType] || 'economic';
  return { schemaType, originalType };
}

// ============================================
// TEMPORAL CONTEXT MAPPING
// ============================================

/**
 * Maps template temporal contexts to Supabase schema-allowed values.
 *
 * Schema allows: 'past', 'present', 'ongoing', 'prediction'
 */
const TEMPORAL_CONTEXT_MAP: Record<string, string> = {
  historical: 'past',
  current: 'present',
  predicted: 'prediction',
  future: 'prediction',
  recent: 'present',
  // Passthrough values
  past: 'past',
  present: 'present',
  ongoing: 'ongoing',
  prediction: 'prediction',
};

/**
 * Maps temporal context to schema-allowed values.
 *
 * @param context - The original temporal context from template output
 * @returns Schema-allowed temporal context string
 */
export function mapTemporalContext(context: string | undefined): string {
  if (!context) return 'present';
  return TEMPORAL_CONTEXT_MAP[context] || context || 'present';
}
