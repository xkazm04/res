/**
 * Due Diligence Template Configuration
 *
 * Migrated from: actor/src/templates/due_diligence.py
 *
 * Template for vetting companies, vendors, and partners including:
 * - Business verification and risk assessment
 * - Legal history, financial health, reputation signals
 * - Red flags and key person background checks
 */

import { TemplateConfig } from '../types';

export const dueDiligenceConfig: TemplateConfig = {
  // ---- Identity ----
  templateId: 'due_diligence',
  templateName: 'Due Diligence',
  description:
    'Vet companies, vendors, and partners before signing contracts or making commitments',

  // ---- Search Phase Configuration ----
  searchIntro:
    'You are a professional due diligence researcher helping someone vet a business entity.',

  searchAngles: [
    {
      name: 'COMPANY BASICS',
      items: [
        'Official registration, founding date, headquarters',
        'Business model, products/services, market position',
        'Company size, employee count, growth trajectory',
      ],
    },
    {
      name: 'LEADERSHIP & KEY PEOPLE',
      items: [
        'Founders, executives, board members',
        'Their backgrounds, previous companies, track records',
        'Any controversies or notable achievements',
      ],
    },
    {
      name: 'FINANCIAL HEALTH',
      items: [
        'Funding history, investors, revenue signals',
        'Profitability indicators, growth metrics',
        'Any signs of financial distress',
      ],
    },
    {
      name: 'LEGAL & REGULATORY',
      items: [
        'Lawsuits (plaintiff and defendant)',
        'Regulatory actions, fines, settlements',
        'Compliance issues, license status',
      ],
    },
    {
      name: 'REPUTATION & REVIEWS',
      items: [
        'Customer reviews and complaints (BBB, Trustpilot, G2, etc.)',
        'Employee reviews (Glassdoor, Indeed)',
        'Industry reputation, awards, recognition',
      ],
    },
    {
      name: 'RED FLAGS',
      items: [
        'Scam reports, fraud allegations',
        'High-profile failures or scandals',
        'Pattern of complaints or issues',
      ],
    },
  ],

  searchDepthGuidance: {
    quick: 'Focus on 3-4 most critical angles (legal, reviews, red flags)',
    standard: 'Cover 5-6 angles with balanced depth',
    deep: 'Comprehensive coverage of all angles',
  },

  // ---- Extraction Phase Configuration ----
  extractionIntro:
    'You are a due diligence analyst extracting findings to help someone make a business decision.',

  findingTypes: [
    {
      name: 'company_profile',
      displayName: 'Company Profile',
      description: 'Basic facts about the entity',
      extractedDataSchema:
        '{"name": "", "founded": "", "headquarters": "", "size": "", "industry": "", "business_model": ""}',
      analysisFallback:
        'This profile information provides essential context for evaluating the entity.',
    },
    {
      name: 'financial_health',
      displayName: 'Financial Health',
      description: 'Financial stability indicators',
      extractedDataSchema:
        '{"indicator": "", "status": "healthy/concerning/unknown", "evidence": "", "trend": ""}',
      analysisFallback:
        "This financial indicator helps assess the entity's stability and viability.",
    },
    {
      name: 'legal_history',
      displayName: 'Legal History',
      description: 'Lawsuits, regulatory actions, legal issues',
      extractedDataSchema:
        '{"case_type": "", "status": "", "outcome": "", "amount": "", "date": "", "significance": ""}',
      analysisFallback:
        'This legal matter is relevant for assessing potential risks and liabilities.',
    },
    {
      name: 'red_flag',
      displayName: 'Red Flag',
      description:
        'Warning signs that should concern the user. Be specific about WHY this is a red flag.',
      extractedDataSchema:
        '{"flag_type": "", "severity": "high/medium/low", "evidence": "", "recommendation": ""}',
      analysisFallback:
        'This red flag warrants careful attention and may indicate significant risk.',
    },
    {
      name: 'reputation_signal',
      displayName: 'Reputation Signal',
      description: 'Reviews, testimonials, industry standing',
      extractedDataSchema:
        '{"source": "", "sentiment": "positive/negative/mixed", "rating": "", "common_themes": []}',
      analysisFallback:
        'This reputation indicator helps gauge how the entity is perceived by stakeholders.',
    },
    {
      name: 'key_person',
      displayName: 'Key Person',
      description: 'Leadership background and track record',
      extractedDataSchema:
        '{"name": "", "role": "", "background": "", "track_record": "", "concerns": ""}',
      analysisFallback:
        'Understanding this persons background helps assess leadership quality and risk.',
    },
  ],

  extractionGuidelines: `CRITICAL: The "analysis" field must provide substantive reasoning, not just describe the finding.
Good example: "This pattern of multiple lawsuits from former employees alleging wage theft is a significant red flag. In our experience, companies with 3+ wage-related lawsuits in a 2-year period have a 70% likelihood of ongoing compliance issues. This also suggests potential labor law violations that could expose acquirers to successor liability. Recommend thorough review of payroll practices and settlement terms."

IMPORTANT:
- Prioritize RED FLAGS - users need to know risks first
- Be specific with dates, amounts, and names when available
- Distinguish between verified facts and allegations
- Note when information is outdated or unverifiable`,

  analysisInstruction: `YOUR EXPERT DUE DILIGENCE ANALYSIS (REQUIRED - 2-4 sentences) explaining:
  * WHY this finding matters for the business decision at hand
  * What RISK or OPPORTUNITY this represents and how significant it is
  * How this COMPARES to industry norms or similar entities
  * What ADDITIONAL INVESTIGATION or verification this warrants`,

  // ---- Ordering & Grouping ----
  priorityFindingTypes: [
    'red_flag',
    'legal_history',
    'financial_health',
    'reputation_signal',
    'key_person',
    'company_profile',
  ],
  groupingOrder: [
    'red_flag',
    'legal_history',
    'financial_health',
    'reputation_signal',
    'key_person',
    'company_profile',
  ],

  // ---- Perspectives ----
  // Expert perspectives for due diligence
  perspectives: [
    'due_diligence_analyst', // Professional vetting
    'forensic_financial', // Follow the money
    'legal_liability', // Legal exposure
    'industry_insider', // Operational reality
  ],

  // ---- Verification ----
  // Due diligence requires thorough verification
  verificationConfig: {
    crossReference: 'thorough', // Verify claims across multiple sources
    biasDetection: 'standard', // Watch for PR spin
    expertSanityCheck: 'thorough', // Flag unrealistic claims
    sourceQuality: 'thorough', // Distinguish verified vs alleged
  },

  // ---- Resource Limits ----
  defaultMaxSearches: 8,
};

export default dueDiligenceConfig;
