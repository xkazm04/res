/**
 * Unified Schema Types - Single Source of Truth
 *
 * This file defines all enum types that map to Supabase database schema constraints.
 * All other files should import from here rather than defining their own type lists.
 *
 * When the database schema changes, update this file and TypeScript will catch
 * all places that need updates.
 */

// ============================================
// SCHEMA ENUMS - Match Supabase CHECK constraints
// ============================================

/**
 * Perspective types allowed by research_perspectives.perspective_type column.
 * These are the ONLY values that can be stored in the database.
 */
export const SCHEMA_PERSPECTIVE_TYPES = [
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
] as const;

export type SchemaPerspectiveType = typeof SCHEMA_PERSPECTIVE_TYPES[number];

/**
 * Finding types allowed by research_findings.finding_type column.
 */
export const SCHEMA_FINDING_TYPES = [
  'fact',
  'claim',
  'event',
  'actor',
  'relationship',
  'pattern',
  'gap',
  'evidence',
] as const;

export type SchemaFindingType = typeof SCHEMA_FINDING_TYPES[number];

/**
 * Session status values allowed by research_sessions.status column.
 */
export const SCHEMA_SESSION_STATUSES = [
  'active',
  'searching',
  'analyzing',
  'completed',
  'paused',
  'failed',
] as const;

export type SchemaSessionStatus = typeof SCHEMA_SESSION_STATUSES[number];

/**
 * Temporal context values allowed by research_findings.temporal_context column.
 */
export const SCHEMA_TEMPORAL_CONTEXTS = [
  'past',
  'present',
  'ongoing',
  'prediction',
] as const;

export type SchemaTemporalContext = typeof SCHEMA_TEMPORAL_CONTEXTS[number];

/**
 * Verification status values allowed by knowledge_claims.verification_status column.
 */
export const SCHEMA_VERIFICATION_STATUSES = [
  'unverified',
  'corroborated',
  'disputed',
  'verified',
  'retracted',
] as const;

export type SchemaVerificationStatus = typeof SCHEMA_VERIFICATION_STATUSES[number];

/**
 * Entity types allowed by knowledge_entities.entity_type column.
 */
export const SCHEMA_ENTITY_TYPES = [
  'person',
  'organization',
  'location',
  'product',
  'concept',
  'event',
] as const;

export type SchemaEntityType = typeof SCHEMA_ENTITY_TYPES[number];

/**
 * Relationship types for claim_relationships and finding_relationships.
 */
export const SCHEMA_RELATIONSHIP_TYPES = [
  'causes',
  'supports',
  'contradicts',
  'expands',
  'supersedes',
  'related_to',
  'part_of',
  'precedes',
  'follows',
  'enables',
  'prevents',
  'involves',
] as const;

export type SchemaRelationshipType = typeof SCHEMA_RELATIONSHIP_TYPES[number];

/**
 * Source types allowed by research_sources.source_type column.
 */
export const SCHEMA_SOURCE_TYPES = [
  'news',
  'academic',
  'government',
  'corporate',
  'blog',
  'social',
  'wiki',
  'unknown',
] as const;

export type SchemaSourceType = typeof SCHEMA_SOURCE_TYPES[number];

/**
 * Topic types allowed by knowledge_topics.topic_type column.
 */
export const SCHEMA_TOPIC_TYPES = [
  'domain',
  'event',
  'entity',
  'concept',
  'region',
  'timeperiod',
] as const;

export type SchemaTopicType = typeof SCHEMA_TOPIC_TYPES[number];

/**
 * Research topic statuses allowed by research_topics.status column.
 */
export const SCHEMA_TOPIC_STATUSES = [
  'new',
  'queued',
  'researching',
  'completed',
  'failed',
  'deleted',
] as const;

export type SchemaTopicStatus = typeof SCHEMA_TOPIC_STATUSES[number];

// ============================================
// TYPE MAPPING UTILITIES
// ============================================

/**
 * Maps template-specific perspective types to schema-allowed values.
 * All custom perspective types must have an entry here.
 *
 * When adding a new template perspective:
 * 1. Add the mapping here
 * 2. The original type is preserved in specialized_data.original_type
 */
export const PERSPECTIVE_TYPE_MAP: Record<string, SchemaPerspectiveType> = {
  // Investigative perspectives
  forensic_financial: 'financial',
  power_network: 'network',
  psychological_behavioral: 'psychological',
  geopolitical_strategic: 'political',
  legal_liability: 'political',

  // Financial/Investment perspectives
  institutional_investor: 'financial',
  short_seller: 'financial',
  quantitative_risk: 'financial',
  activist_investor: 'financial',
  macro_strategist: 'economic',

  // Competitive analysis
  strategy_consultant: 'economic',
  industry_insider: 'economic',

  // Legal perspectives
  regulatory_expert: 'political',
  litigation_strategist: 'political',
  contract_analyst: 'political',
  employment_specialist: 'political',

  // Tech market perspectives
  venture_capitalist: 'financial',
  startup_founder: 'technological',
  product_manager: 'technological',
  developer_advocate: 'technological',
  open_source_maintainer: 'technological',
  devrel_engineer: 'technological',
  senior_engineer: 'technological',
  platform_engineer: 'technological',

  // Contract analysis
  contract_auditor: 'financial',
  procurement_investigator: 'political',
  forensic_accountant: 'financial',
  regulatory_compliance: 'political',
  industry_benchmarker: 'economic',

  // Due diligence
  due_diligence_analyst: 'financial',
  competitive_analyst: 'economic',
  risk_analyst: 'financial',

  // Reputation
  crisis_communicator: 'social',
  media_analyst: 'journalist',
  stakeholder_analyst: 'social',
  brand_strategist: 'social',
  consumer_protection: 'social',
  reputation_analyst: 'social',

  // Consumer experts
  consumer_advocate: 'social',
  quality_tester: 'technological',
  value_analyst: 'economic',
  ux_researcher: 'social',
  technical_expert: 'technological',
  long_term_owner: 'social',

  // Investigation experts
  historical_pattern: 'historical',
  incentive_mapper: 'financial',
  omission_detective: 'journalist',
  intelligence_analyst: 'military',
  fact_checker: 'journalist',
  historian: 'historical',
  narrative_analyst: 'journalist',

  // Additional legacy mappings
  market_analyst: 'economic',
  compliance_officer: 'political',
  security_researcher: 'technological',
  data_scientist: 'technological',
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
  sociologist: 'social',
  psychologist: 'psychological',
  legal_scholar: 'political',
  defense_analyst: 'military',
  conspiracy_theorist: 'conspirator',
  whistleblower: 'journalist',
  insider: 'network',
  connected_source: 'network',
  contrarian_synthesizer: 'financial',
};

/**
 * Maps template-specific finding types to schema-allowed values.
 */
export const FINDING_TYPE_MAP: Record<string, SchemaFindingType> = {
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
  narrative_vs_reality: 'evidence',
  smart_money_signal: 'evidence',

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
  narrative_frame: 'pattern',
  coverage_asymmetry: 'evidence',
  incentive_alignment: 'relationship',
  suspicious_timing: 'event',
  historical_parallel: 'pattern',
  network_inference: 'relationship',

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

  // Meta-analytical finding types
  omission: 'gap',
  talking_point_origin: 'evidence',
  funding_trace: 'fact',
  regulatory_capture: 'relationship',
  hype_reality_gap: 'evidence',

  // Passthrough types (already schema-compliant)
  fact: 'fact',
  claim: 'claim',
};

/**
 * Maps temporal context variations to schema values.
 */
export const TEMPORAL_CONTEXT_MAP: Record<string, SchemaTemporalContext> = {
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

// ============================================
// MAPPING FUNCTIONS
// ============================================

/**
 * Check if a value is a valid schema perspective type.
 */
export function isValidPerspectiveType(value: string): value is SchemaPerspectiveType {
  return SCHEMA_PERSPECTIVE_TYPES.includes(value as SchemaPerspectiveType);
}

/**
 * Maps a template perspective type to a schema-allowed type.
 * Returns the original type if already valid, or looks up in the mapping.
 *
 * @param originalType - The perspective type from template output
 * @returns Object with schemaType for database and originalType for tracking
 */
export function mapPerspectiveType(originalType: string): {
  schemaType: SchemaPerspectiveType;
  originalType: string;
} {
  if (isValidPerspectiveType(originalType)) {
    return { schemaType: originalType, originalType };
  }
  const schemaType = PERSPECTIVE_TYPE_MAP[originalType] || 'economic';
  return { schemaType, originalType };
}

/**
 * Check if a value is a valid schema finding type.
 */
export function isValidFindingType(value: string): value is SchemaFindingType {
  return SCHEMA_FINDING_TYPES.includes(value as SchemaFindingType);
}

/**
 * Maps a template finding type to a schema-allowed type.
 *
 * @param originalType - The finding type from template output
 * @returns Object with schemaType for database and originalType for tracking
 */
export function mapFindingType(originalType: string): {
  schemaType: SchemaFindingType;
  originalType: string;
} {
  if (isValidFindingType(originalType)) {
    return { schemaType: originalType, originalType };
  }
  const schemaType = FINDING_TYPE_MAP[originalType] || 'fact';
  return { schemaType, originalType };
}

/**
 * Maps temporal context to schema-allowed values.
 *
 * @param context - The temporal context from template output
 * @returns Schema-allowed temporal context string
 */
export function mapTemporalContext(context: string | undefined): SchemaTemporalContext {
  if (!context) return 'present';
  return TEMPORAL_CONTEXT_MAP[context] || 'present';
}

// ============================================
// SET UTILITIES (for quick lookups)
// ============================================

export const VALID_PERSPECTIVE_TYPES = new Set(SCHEMA_PERSPECTIVE_TYPES);
export const VALID_FINDING_TYPES = new Set(SCHEMA_FINDING_TYPES);
export const VALID_SESSION_STATUSES = new Set(SCHEMA_SESSION_STATUSES);
export const VALID_TEMPORAL_CONTEXTS = new Set(SCHEMA_TEMPORAL_CONTEXTS);
