/**
 * Reputation Check Template Configuration
 *
 * Migrated from: actor/src/templates/reputation.py
 *
 * Template for verifying legitimacy and trustworthiness including:
 * - Scam and fraud reports, complaints
 * - Business registration and verification
 * - Online presence and industry reputation
 */

import { TemplateConfig } from '../types';

export const reputationConfig: TemplateConfig = {
  // ---- Identity ----
  templateId: 'reputation',
  templateName: 'Reputation Check',
  description:
    'Verify legitimacy and trustworthiness - scam detection, reviews, and trust signals',

  // ---- Search Phase Configuration ----
  searchIntro:
    'You are a consumer protection researcher helping someone verify if an entity is trustworthy.',

  searchAngles: [
    {
      name: 'SCAM & FRAUD REPORTS',
      items: [
        'Scam reports, fraud allegations',
        'BBB complaints, FTC reports',
        'Consumer protection warnings',
      ],
    },
    {
      name: 'REVIEWS & COMPLAINTS',
      items: [
        'Customer reviews across multiple platforms',
        'Complaint patterns and common issues',
        'Response to complaints',
      ],
    },
    {
      name: 'LEGITIMACY VERIFICATION',
      items: [
        'Business registration, licenses',
        'Physical address verification',
        'Contact information validity',
      ],
    },
    {
      name: 'ONLINE PRESENCE',
      items: [
        'Website age, domain history',
        'Social media presence and engagement',
        'Professional profiles (LinkedIn, industry directories)',
      ],
    },
    {
      name: 'INDUSTRY REPUTATION',
      items: [
        'Industry association membership',
        'Awards, certifications',
        'Peer recognition',
      ],
    },
    {
      name: 'NEWS & MEDIA',
      items: [
        'News coverage (positive and negative)',
        'Investigations or exposes',
        'Press releases vs. independent coverage',
      ],
    },
  ],

  searchDepthGuidance: {
    quick: 'Focus on 3-4 angles (scam reports, reviews, legitimacy)',
    standard: 'Cover 5-6 angles',
    deep: 'Comprehensive coverage',
  },

  // ---- Extraction Phase Configuration ----
  extractionIntro:
    'You are a consumer protection analyst checking if an entity is trustworthy. CRITICAL: Use EXACT finding_type values specified below.',

  findingTypes: [
    {
      name: 'trust_signal',
      displayName: 'Trust Signal',
      description:
        'Positive indicators of legitimacy. Must be verifiable, not self-reported.',
      extractedDataSchema:
        '{"signal_type": "", "verification_status": "verified/unverified/self_reported", "source": "", "strength": "strong/moderate/weak"}',
      analysisFallback:
        'This trust signal provides evidence of legitimacy that can be verified.',
    },
    {
      name: 'warning_sign',
      displayName: 'Warning Sign',
      description:
        "Red flags and concerns. Be specific about what's concerning and why.",
      extractedDataSchema:
        '{"warning_type": "", "severity": "critical/significant/minor", "evidence": "", "recommendation": ""}',
      analysisFallback:
        'This warning sign warrants caution and further investigation.',
    },
    {
      name: 'complaint_pattern',
      displayName: 'Complaint Pattern',
      description: 'Recurring issues reported by multiple people',
      extractedDataSchema:
        '{"complaint_type": "", "frequency": "many/several/few", "resolution": "resolved/unresolved/mixed", "sources": []}',
      analysisFallback:
        'This complaint pattern indicates systemic issues that affect multiple customers.',
    },
    {
      name: 'verification_status',
      displayName: 'Verification Status',
      description: 'Credentials, licenses, certifications',
      extractedDataSchema:
        '{"credential": "", "issuer": "", "status": "valid/expired/unverifiable/fake", "verification_url": ""}',
      analysisFallback:
        'This verification status helps establish whether claims are legitimate.',
    },
    {
      name: 'sentiment_trend',
      displayName: 'Sentiment Trend',
      description: 'How perception has changed over time',
      extractedDataSchema:
        '{"direction": "improving/declining/stable", "timeframe": "", "key_events": [], "current_sentiment": "positive/negative/mixed"}',
      analysisFallback:
        "This sentiment trend indicates how the entity's reputation has evolved.",
    },
    {
      name: 'comparison_benchmark',
      displayName: 'Comparison Benchmark',
      description: 'How they compare to similar entities',
      extractedDataSchema:
        '{"benchmark": "", "rating": "above_average/average/below_average", "comparison_basis": ""}',
      analysisFallback:
        "This comparison helps contextualize the entity's performance relative to peers.",
    },
  ],

  extractionGuidelines: `CRITICAL: The "analysis" field must provide substantive assessment reasoning, not just describe the finding.
Good example: "This pattern of unresolved complaints is a major red flag because legitimate companies typically respond to BBB complaints within 14 days. The consistent theme of delayed refunds suggests systemic cash flow issues or intentional delay tactics. Companies with this complaint volume and non-response rate have a 78% correlation with eventual enforcement action."

IMPORTANT:
- WARNING SIGNS are the most important - surface these first
- Be skeptical of self-reported credentials
- Note if reviews appear fake or manipulated
- Distinguish between isolated incidents and patterns`,

  analysisInstruction: `YOUR EXPERT REPUTATION ANALYSIS (REQUIRED - 2-4 sentences) explaining:
  * WHY this signal matters for assessing trustworthiness
  * What this PATTERN indicates about the entity's practices
  * How this COMPARES to typical behavior of legitimate vs problematic actors
  * What SPECIFIC RISKS or assurances this provides`,

  // ---- Ordering & Grouping ----
  priorityFindingTypes: [
    'warning_sign',
    'complaint_pattern',
    'verification_status',
    'trust_signal',
    'sentiment_trend',
    'comparison_benchmark',
  ],
  groupingOrder: [
    'warning_sign',
    'complaint_pattern',
    'trust_signal',
    'verification_status',
    'sentiment_trend',
    'comparison_benchmark',
  ],

  // ---- Perspectives ----
  perspectives: [
    'consumer_protection', // Scam detection focus
    'reputation_analyst', // Pattern analysis
    'fact_checker', // Verification specialist
    'industry_benchmarker', // Comparative assessment
  ],

  // ---- Verification ----
  // Reputation checks need thorough bias detection (fake reviews are common)
  verificationConfig: {
    crossReference: 'thorough',
    biasDetection: 'thorough',
    expertSanityCheck: 'standard',
    sourceQuality: 'thorough',
  },

  // ---- Resource Limits ----
  defaultMaxSearches: 6,
};

export default reputationConfig;
