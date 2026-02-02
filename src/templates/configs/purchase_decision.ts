/**
 * Purchase Decision Template Configuration
 *
 * Migrated from: actor/src/templates/purchase_decision.py
 *
 * Template for evaluating products and services before buying:
 * - Real user experiences from forums and reviews
 * - Hidden costs and unexpected expenses
 * - Alternatives and comparisons
 * - Value assessment and timing
 */

import { TemplateConfig } from '../types';

export const purchaseDecisionConfig: TemplateConfig = {
  // ---- Identity ----
  templateId: 'purchase_decision',
  templateName: 'Purchase Decision',
  description:
    'Research products and services before buying - real reviews, hidden costs, and alternatives',

  // ---- Search Phase Configuration ----
  searchIntro:
    'You are a consumer research expert helping someone make an informed purchase decision.',

  searchAngles: [
    {
      name: 'REAL USER EXPERIENCES',
      items: [
        'Long-term owner reviews (6+ months of use)',
        'Reddit, forums, and community discussions',
        'Verified purchaser reviews on retail sites',
      ],
    },
    {
      name: 'PROFESSIONAL REVIEWS',
      items: [
        'Expert reviews from reputable sources',
        'Comparison tests and benchmarks',
        'Industry publication assessments',
      ],
    },
    {
      name: 'PROBLEMS & ISSUES',
      items: [
        'Common complaints and failure points',
        'Recall notices, safety issues',
        'Customer service experiences',
      ],
    },
    {
      name: 'HIDDEN COSTS',
      items: [
        'Maintenance, repairs, consumables',
        'Required accessories or add-ons',
        'Subscription fees, licensing costs',
      ],
    },
    {
      name: 'ALTERNATIVES & COMPARISONS',
      items: [
        'Direct competitors',
        'Better value options',
        'Different approaches to same need',
      ],
    },
    {
      name: 'VALUE & TIMING',
      items: [
        'Price history and trends',
        'Best time to buy, sales cycles',
        'Refurbished/used market options',
      ],
    },
  ],

  searchDepthGuidance: {
    quick: 'Focus on 3-4 angles (user reviews, problems, alternatives)',
    standard: 'Cover 5-6 angles with balanced depth',
    deep: 'Comprehensive coverage of all angles',
  },

  // ---- Extraction Phase Configuration ----
  extractionIntro:
    'You are a consumer research analyst helping someone make a purchase decision.',

  findingTypes: [
    {
      name: 'product_strength',
      displayName: 'Product Strength',
      description:
        'What the product genuinely does well. Must be backed by multiple user reports, not just marketing.',
      extractedDataSchema:
        '{"strength": "", "evidence_type": "user_reports/expert_review/benchmark", "frequency": "commonly mentioned/sometimes mentioned"}',
      analysisFallback:
        'This strength is consistently noted by users and may be a key buying factor.',
    },
    {
      name: 'product_weakness',
      displayName: 'Product Weakness',
      description:
        'Known issues, limitations, failure points. Be specific about how common and how serious.',
      extractedDataSchema:
        '{"weakness": "", "severity": "deal_breaker/annoying/minor", "frequency": "widespread/occasional/rare", "workaround": ""}',
      analysisFallback:
        'This weakness should be considered in the context of your specific use case and priorities.',
    },
    {
      name: 'real_user_experience',
      displayName: 'Real User Experience',
      description:
        'Actual owner feedback from forums, Reddit, reviews. Focus on long-term use experiences.',
      extractedDataSchema:
        '{"source_type": "reddit/forum/verified_review", "ownership_duration": "", "overall_sentiment": "positive/negative/mixed", "key_points": []}',
      analysisFallback:
        'Real user feedback provides ground-truth insight into ownership experience.',
    },
    {
      name: 'hidden_cost',
      displayName: 'Hidden Cost',
      description: 'Unexpected expenses the user should know about',
      extractedDataSchema:
        '{"cost_type": "", "estimated_amount": "", "frequency": "one_time/recurring/occasional", "avoidable": true}',
      analysisFallback:
        'This hidden cost affects total ownership cost and should be factored into the purchase decision.',
    },
    {
      name: 'alternative_option',
      displayName: 'Alternative Option',
      description: 'Competitors or alternatives worth considering',
      extractedDataSchema:
        '{"product": "", "price_comparison": "", "key_advantage": "", "key_disadvantage": "", "best_for": ""}',
      analysisFallback:
        'This alternative may be worth considering depending on your priorities and budget.',
    },
    {
      name: 'value_assessment',
      displayName: 'Value Assessment',
      description: 'Price vs. value analysis',
      extractedDataSchema:
        '{"verdict": "good_value/fair_value/overpriced/budget_option", "reasoning": "", "price_range": "", "best_time_to_buy": ""}',
      analysisFallback:
        'This value assessment helps contextualize whether the price is justified for what you get.',
    },
  ],

  extractionGuidelines: `CRITICAL: The "analysis" field must provide substantive consumer guidance, not just describe the finding.
Good example: "This battery degradation issue is a significant concern for buyers planning to keep the product 3+ years. Based on 47 forum reports, this affects approximately 30% of units after 2 years of daily use. However, users who follow the 20-80% charging guideline report much better longevity. For lease/upgrade buyers who cycle every 2 years, this is less relevant."

IMPORTANT:
- Prioritize WEAKNESSES - users need to know problems before buying
- Distinguish between widespread issues and isolated complaints
- Be skeptical of reviews that sound like marketing
- Include specific prices, timeframes, and quantities when available`,

  analysisInstruction: `YOUR EXPERT CONSUMER ANALYSIS (REQUIRED - 2-4 sentences) explaining:
  * WHY this matters for someone making this purchase decision
  * How COMMON this experience is based on the evidence pattern
  * What TYPE OF BUYER this affects most (or doesn't affect)
  * What ALTERNATIVES or WORKAROUNDS exist for this issue`,

  // ---- Ordering & Grouping ----
  priorityFindingTypes: [
    'product_weakness',
    'hidden_cost',
    'alternative_option',
    'real_user_experience',
    'product_strength',
    'value_assessment',
  ],
  groupingOrder: [
    'product_weakness',
    'hidden_cost',
    'product_strength',
    'alternative_option',
    'real_user_experience',
    'value_assessment',
  ],

  // ---- Perspectives ----
  // 4 expert perspectives for purchase decisions
  perspectives: [
    'consumer_advocate', // Protect buyer interests
    'technical_expert', // Technical evaluation
    'value_analyst', // Cost-benefit analysis
    'long_term_owner', // Experience over time
  ],

  // ---- Verification ----
  // Purchase decisions need good source quality but less legal rigor
  verificationConfig: {
    crossReference: 'standard',
    biasDetection: 'thorough', // Important to detect fake reviews
    expertSanityCheck: 'standard',
    sourceQuality: 'standard',
  },

  // ---- Resource Limits ----
  defaultMaxSearches: 7,
};

export default purchaseDecisionConfig;
