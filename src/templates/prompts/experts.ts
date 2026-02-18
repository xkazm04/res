/**
 * Central Expert Perspectives Library
 *
 * Reusable expert perspective definitions shared across research templates.
 * Templates import from here instead of duplicating perspective strings.
 *
 * Benefits:
 * - Single source of truth for perspective names
 * - Enables A/B testing prompt variations
 * - Easier auditing of what each template uses
 * - Type safety for perspective references
 */

// ============================================
// EXPERT PERSPECTIVE CONSTANTS
// ============================================

/**
 * Cross-domain analysis experts used across multiple template types.
 * These perspectives provide broadly applicable analytical frameworks.
 */
export const CROSS_DOMAIN_EXPERTS = {
  /** Financial forensics and accounting analysis */
  FORENSIC_FINANCIAL: 'forensic_financial',
  /** Legal liability and compliance assessment */
  LEGAL_LIABILITY: 'legal_liability',
  /** Geopolitical and strategic context analysis */
  GEOPOLITICAL_STRATEGIC: 'geopolitical_strategic',
  /** Power structures and relationship networks */
  POWER_NETWORK: 'power_network',
  /** Behavioral and psychological pattern analysis */
  PSYCHOLOGICAL_BEHAVIORAL: 'psychological_behavioral',
  /** Narrative construction and framing analysis */
  NARRATIVE_ANALYST: 'narrative_analyst',
} as const;

/**
 * Investigation-focused experts for deep-dive research.
 */
export const INVESTIGATION_EXPERTS = {
  /** Historical pattern recognition and precedent analysis */
  HISTORICAL_PATTERN: 'historical_pattern',
  /** Incentive structure and motivation mapping */
  INCENTIVE_MAPPER: 'incentive_mapper',
  /** Detection of missing information and gaps */
  OMISSION_DETECTIVE: 'omission_detective',
  /** Intelligence analysis and synthesis */
  INTELLIGENCE_ANALYST: 'intelligence_analyst',
  /** Fact verification and accuracy checking */
  FACT_CHECKER: 'fact_checker',
  /** Historical context and precedent */
  HISTORIAN: 'historian',
} as const;

/**
 * Financial market experts for investment and market analysis.
 */
export const FINANCIAL_EXPERTS = {
  /** Institutional investment perspective */
  INSTITUTIONAL_INVESTOR: 'institutional_investor',
  /** Short-selling and bearish analysis */
  SHORT_SELLER: 'short_seller',
  /** Quantitative risk assessment */
  QUANTITATIVE_RISK: 'quantitative_risk',
  /** Activist shareholder perspective */
  ACTIVIST_INVESTOR: 'activist_investor',
  /** Macroeconomic strategy analysis */
  MACRO_STRATEGIST: 'macro_strategist',
} as const;

/**
 * Legal and regulatory experts for compliance and litigation.
 */
export const LEGAL_EXPERTS = {
  /** Litigation strategy and case assessment */
  LITIGATION_STRATEGIST: 'litigation_strategist',
  /** Regulatory compliance and policy analysis */
  REGULATORY_EXPERT: 'regulatory_expert',
  /** Contract analysis and negotiation */
  CONTRACT_ANALYST: 'contract_analyst',
  /** Employment and labor law specialist */
  EMPLOYMENT_SPECIALIST: 'employment_specialist',
} as const;

/**
 * Due diligence and business analysis experts.
 */
export const DUE_DILIGENCE_EXPERTS = {
  /** Due diligence investigation specialist */
  DUE_DILIGENCE_ANALYST: 'due_diligence_analyst',
  /** Industry insider knowledge and context */
  INDUSTRY_INSIDER: 'industry_insider',
  /** Competitive intelligence and market position */
  COMPETITIVE_ANALYST: 'competitive_analyst',
  /** Strategic risk assessment */
  RISK_ANALYST: 'risk_analyst',
} as const;

/**
 * Reputation and media analysis experts.
 */
export const REPUTATION_EXPERTS = {
  /** Crisis communication and management */
  CRISIS_COMMUNICATOR: 'crisis_communicator',
  /** Media coverage and sentiment analysis */
  MEDIA_ANALYST: 'media_analyst',
  /** Stakeholder perception and relations */
  STAKEHOLDER_ANALYST: 'stakeholder_analyst',
  /** Brand and reputation management */
  BRAND_STRATEGIST: 'brand_strategist',
  /** Consumer protection and scam detection */
  CONSUMER_PROTECTION: 'consumer_protection',
  /** Reputation pattern analysis */
  REPUTATION_ANALYST: 'reputation_analyst',
  /** Industry comparative assessment */
  INDUSTRY_BENCHMARKER: 'industry_benchmarker',
} as const;

/**
 * Technology market analysis experts.
 */
export const TECH_MARKET_EXPERTS = {
  /** Venture capital and startup investment */
  VENTURE_CAPITALIST: 'venture_capitalist',
  /** Startup founding and scaling perspective */
  STARTUP_FOUNDER: 'startup_founder',
  /** Product management and roadmap strategy */
  PRODUCT_MANAGER: 'product_manager',
  /** Developer relations and advocacy */
  DEVELOPER_ADVOCATE: 'developer_advocate',
  /** Open source project maintenance */
  OPEN_SOURCE_MAINTAINER: 'open_source_maintainer',
  /** Developer relations engineering */
  DEVREL_ENGINEER: 'devrel_engineer',
  /** Senior engineering perspective */
  SENIOR_ENGINEER: 'senior_engineer',
  /** Platform engineering and infrastructure */
  PLATFORM_ENGINEER: 'platform_engineer',
} as const;

/**
 * Consumer and purchase decision experts.
 */
export const CONSUMER_EXPERTS = {
  /** Consumer advocacy and protection */
  CONSUMER_ADVOCATE: 'consumer_advocate',
  /** Product quality and testing */
  QUALITY_TESTER: 'quality_tester',
  /** Value analysis and price comparison */
  VALUE_ANALYST: 'value_analyst',
  /** User experience assessment */
  UX_RESEARCHER: 'ux_researcher',
  /** Technical product evaluation */
  TECHNICAL_EXPERT: 'technical_expert',
  /** Long-term ownership experience */
  LONG_TERM_OWNER: 'long_term_owner',
} as const;

/**
 * Contract and government procurement experts.
 */
export const CONTRACT_EXPERTS = {
  /** Pricing and cost analysis */
  CONTRACT_AUDITOR: 'contract_auditor',
  /** Bid process and competition issues */
  PROCUREMENT_INVESTIGATOR: 'procurement_investigator',
  /** Financial red flag detection */
  FORENSIC_ACCOUNTANT: 'forensic_accountant',
  /** Legal requirements compliance */
  REGULATORY_COMPLIANCE: 'regulatory_compliance',
} as const;

/**
 * Competitive intelligence experts.
 */
export const COMPETITIVE_EXPERTS = {
  /** Porter's forces and competitive positioning */
  STRATEGY_CONSULTANT: 'strategy_consultant',
} as const;

// ============================================
// PERSPECTIVE TYPE (Union of all constants)
// ============================================

export type CrossDomainExpert = typeof CROSS_DOMAIN_EXPERTS[keyof typeof CROSS_DOMAIN_EXPERTS];
export type InvestigationExpert = typeof INVESTIGATION_EXPERTS[keyof typeof INVESTIGATION_EXPERTS];
export type FinancialExpert = typeof FINANCIAL_EXPERTS[keyof typeof FINANCIAL_EXPERTS];
export type LegalExpert = typeof LEGAL_EXPERTS[keyof typeof LEGAL_EXPERTS];
export type DueDiligenceExpert = typeof DUE_DILIGENCE_EXPERTS[keyof typeof DUE_DILIGENCE_EXPERTS];
export type ReputationExpert = typeof REPUTATION_EXPERTS[keyof typeof REPUTATION_EXPERTS];
export type TechMarketExpert = typeof TECH_MARKET_EXPERTS[keyof typeof TECH_MARKET_EXPERTS];
export type ConsumerExpert = typeof CONSUMER_EXPERTS[keyof typeof CONSUMER_EXPERTS];

export type ContractExpert = typeof CONTRACT_EXPERTS[keyof typeof CONTRACT_EXPERTS];
export type CompetitiveExpert = typeof COMPETITIVE_EXPERTS[keyof typeof COMPETITIVE_EXPERTS];

export type ExpertPerspective =
  | CrossDomainExpert
  | InvestigationExpert
  | FinancialExpert
  | LegalExpert
  | DueDiligenceExpert
  | ReputationExpert
  | TechMarketExpert
  | ConsumerExpert
  | ContractExpert
  | CompetitiveExpert;

// ============================================
// PRE-COMPOSED PERSPECTIVE SETS
// ============================================

/**
 * Pre-composed perspective arrays for common template configurations.
 * Templates can use these directly or compose their own combinations.
 */
export const PERSPECTIVE_SETS = {
  /** Investigative journalism and deep research */
  investigative: [
    CROSS_DOMAIN_EXPERTS.FORENSIC_FINANCIAL,
    CROSS_DOMAIN_EXPERTS.POWER_NETWORK,
    CROSS_DOMAIN_EXPERTS.PSYCHOLOGICAL_BEHAVIORAL,
    CROSS_DOMAIN_EXPERTS.LEGAL_LIABILITY,
    CROSS_DOMAIN_EXPERTS.GEOPOLITICAL_STRATEGIC,
    CROSS_DOMAIN_EXPERTS.NARRATIVE_ANALYST,
    INVESTIGATION_EXPERTS.INCENTIVE_MAPPER,
    INVESTIGATION_EXPERTS.HISTORICAL_PATTERN,
    INVESTIGATION_EXPERTS.OMISSION_DETECTIVE,
  ],

  /** Due diligence and company research */
  dueDiligence: [
    DUE_DILIGENCE_EXPERTS.DUE_DILIGENCE_ANALYST,
    CROSS_DOMAIN_EXPERTS.FORENSIC_FINANCIAL,
    CROSS_DOMAIN_EXPERTS.LEGAL_LIABILITY,
    DUE_DILIGENCE_EXPERTS.INDUSTRY_INSIDER,
  ],

  /** Financial and investment analysis */
  financial: [
    FINANCIAL_EXPERTS.INSTITUTIONAL_INVESTOR,
    FINANCIAL_EXPERTS.SHORT_SELLER,
    FINANCIAL_EXPERTS.QUANTITATIVE_RISK,
    FINANCIAL_EXPERTS.ACTIVIST_INVESTOR,
    FINANCIAL_EXPERTS.MACRO_STRATEGIST,
    CROSS_DOMAIN_EXPERTS.NARRATIVE_ANALYST,
  ],

  /** Legal and compliance research */
  legal: [
    LEGAL_EXPERTS.LITIGATION_STRATEGIST,
    LEGAL_EXPERTS.REGULATORY_EXPERT,
    CROSS_DOMAIN_EXPERTS.LEGAL_LIABILITY,
    CROSS_DOMAIN_EXPERTS.FORENSIC_FINANCIAL,
  ],

  /** Reputation check - scam detection and trust verification */
  reputation: [
    REPUTATION_EXPERTS.CONSUMER_PROTECTION,
    REPUTATION_EXPERTS.REPUTATION_ANALYST,
    INVESTIGATION_EXPERTS.FACT_CHECKER,
    REPUTATION_EXPERTS.INDUSTRY_BENCHMARKER,
  ],

  /** Understanding and general research */
  understanding: [
    REPUTATION_EXPERTS.MEDIA_ANALYST,
    CROSS_DOMAIN_EXPERTS.FORENSIC_FINANCIAL,
    CROSS_DOMAIN_EXPERTS.GEOPOLITICAL_STRATEGIC,
    INVESTIGATION_EXPERTS.FACT_CHECKER,
    INVESTIGATION_EXPERTS.HISTORIAN,
    INVESTIGATION_EXPERTS.INTELLIGENCE_ANALYST,
  ],

  /** Competitive analysis */
  competitive: [
    COMPETITIVE_EXPERTS.STRATEGY_CONSULTANT,
    DUE_DILIGENCE_EXPERTS.INDUSTRY_INSIDER,
    FINANCIAL_EXPERTS.INSTITUTIONAL_INVESTOR,
    FINANCIAL_EXPERTS.SHORT_SELLER,
  ],

  /** Government contract analysis - fraud and corruption detection */
  contract: [
    CONTRACT_EXPERTS.CONTRACT_AUDITOR,
    CONTRACT_EXPERTS.PROCUREMENT_INVESTIGATOR,
    CONTRACT_EXPERTS.FORENSIC_ACCOUNTANT,
    CONTRACT_EXPERTS.REGULATORY_COMPLIANCE,
    REPUTATION_EXPERTS.INDUSTRY_BENCHMARKER,
  ],

  /** Purchase decision research */
  purchaseDecision: [
    CONSUMER_EXPERTS.CONSUMER_ADVOCATE,
    CONSUMER_EXPERTS.TECHNICAL_EXPERT,
    CONSUMER_EXPERTS.VALUE_ANALYST,
    CONSUMER_EXPERTS.LONG_TERM_OWNER,
  ],

  /** Technology market analysis */
  techMarket: [
    TECH_MARKET_EXPERTS.VENTURE_CAPITALIST,
    TECH_MARKET_EXPERTS.STARTUP_FOUNDER,
    TECH_MARKET_EXPERTS.PRODUCT_MANAGER,
    TECH_MARKET_EXPERTS.DEVELOPER_ADVOCATE,
    TECH_MARKET_EXPERTS.OPEN_SOURCE_MAINTAINER,
    TECH_MARKET_EXPERTS.DEVREL_ENGINEER,
    TECH_MARKET_EXPERTS.SENIOR_ENGINEER,
    TECH_MARKET_EXPERTS.PLATFORM_ENGINEER,
  ],

  /** Claim verification and debunking */
  debunkClaim: [
    INVESTIGATION_EXPERTS.FACT_CHECKER,
    CROSS_DOMAIN_EXPERTS.NARRATIVE_ANALYST,
    INVESTIGATION_EXPERTS.OMISSION_DETECTIVE,
    INVESTIGATION_EXPERTS.INCENTIVE_MAPPER,
    CROSS_DOMAIN_EXPERTS.FORENSIC_FINANCIAL,
    INVESTIGATION_EXPERTS.HISTORICAL_PATTERN,
    REPUTATION_EXPERTS.MEDIA_ANALYST,
    INVESTIGATION_EXPERTS.INTELLIGENCE_ANALYST,
  ],
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get a subset of perspectives from a set.
 * Useful when granularity limits the number of perspectives.
 *
 * @param set - The perspective set key
 * @param count - Maximum number of perspectives to return
 * @returns Array of perspective strings
 */
export function getPerspectives(
  set: keyof typeof PERSPECTIVE_SETS,
  count?: number
): string[] {
  const perspectives = [...PERSPECTIVE_SETS[set]];
  return count ? perspectives.slice(0, count) : perspectives;
}

/**
 * Compose a custom perspective array from multiple expert groups.
 *
 * @param experts - Spread of expert constants
 * @returns Array of perspective strings
 */
export function composePerspectives(...experts: string[]): string[] {
  return experts;
}
