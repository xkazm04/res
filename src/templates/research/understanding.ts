/**
 * Understanding Template Configuration
 *
 * Migrated from: actor/src/templates/understanding.py
 *
 * Template for deep analysis of major world events:
 * - Event chronology and predecessor events
 * - Media coverage analysis and source credibility
 * - Financial motivations and beneficiaries
 * - Misinformation patterns and fact-checking
 */

import { TemplateConfig } from '../types';
import { PERSPECTIVE_SETS } from '../prompts/experts';

export const understandingConfig: TemplateConfig = {
  // ---- Identity ----
  templateId: 'understanding',
  templateName: 'Event Understanding',
  description:
    'Deep analysis of major world events: causes, media credibility, financial motivations, and misinformation',

  // ---- Search Phase Configuration ----
  searchIntro:
    'You are an investigative researcher analyzing a major world event to understand its true causes, context, and implications.',

  searchAngles: [
    {
      name: 'EVENT CHRONOLOGY & PREDECESSOR EVENTS',
      items: [
        'What events led up to this? Timeline of precursor incidents',
        'Historical context and buildup',
        'Key decisions and turning points before the main event',
      ],
    },
    {
      name: 'MEDIA COVERAGE ANALYSIS',
      items: [
        'How did major outlets cover related events before this?',
        'Compare coverage across different media ecosystems (Western, local, alternative)',
        'Historical accuracy of these sources on similar topics',
      ],
    },
    {
      name: 'FINANCIAL MOTIVATIONS & BENEFICIARIES',
      items: [
        'Who benefits financially? (defense contractors, corporations, governments)',
        'Market movements before and after related events',
        'Economic interests at stake',
        'Follow the money: funding, contracts, investments',
      ],
    },
    {
      name: 'ACTOR INTERESTS & STATED vs HIDDEN AGENDAS',
      items: [
        'Official positions vs revealed actions',
        'Stakeholder analysis (governments, corporations, NGOs)',
        'Declared objectives vs strategic interests',
      ],
    },
    {
      name: 'FACT-CHECKING & MISINFORMATION',
      items: [
        'Debunked claims about this topic',
        'Known propaganda narratives',
        'Corrections and retractions by media',
        'Primary source verification',
      ],
    },
    {
      name: 'ALTERNATIVE PERSPECTIVES',
      items: [
        'Non-mainstream analysis and commentary',
        'Local/regional reporting vs international coverage',
        'Academic and expert analysis',
        'Dissenting viewpoints',
      ],
    },
    {
      name: 'HISTORICAL PARALLELS',
      items: [
        'Similar events in history',
        'Pattern recognition across comparable situations',
        'Lessons from past events',
      ],
    },
  ],

  searchDepthGuidance: {
    quick:
      'Focus on 4-5 most critical angles (chronology, media, financial, fact-check)',
    standard: 'Cover 6-7 angles with balanced depth',
    deep: 'Comprehensive coverage of all angles with follow-up queries',
  },

  // ---- Extraction Phase Configuration ----
  extractionIntro:
    'You are an investigative analyst extracting findings to understand a major world event.',

  findingTypes: [
    {
      name: 'event_chain',
      displayName: 'Event Chain',
      description:
        'Chronological events leading to the main event. Include: date, description, causal link to main event.',
      extractedDataSchema:
        '{"event_date": "YYYY-MM-DD", "event_description": "", "causal_link": "", "established_fact": true}',
      analysisFallback:
        'This event in the causal chain helps explain how the situation developed over time.',
    },
    {
      name: 'media_narrative',
      displayName: 'Media Narrative',
      description:
        'How specific outlets/media types covered this or predecessor events. Note any significant omissions or spin.',
      extractedDataSchema:
        '{"outlet": "", "narrative_frame": "", "historical_accuracy": "high/medium/low", "noted_bias": "", "omissions": ""}',
      analysisFallback:
        'This media framing reveals how different outlets are shaping public perception of the event.',
    },
    {
      name: 'financial_motivation',
      displayName: 'Financial Motivation',
      description:
        'Money flows, beneficiaries, economic interests. Be specific about HOW they benefit.',
      extractedDataSchema:
        '{"actor": "", "benefit_type": "", "amount": "", "mechanism": "", "timing": ""}',
      analysisFallback:
        "This financial interest helps explain the underlying motivations behind key actors' positions.",
    },
    {
      name: 'misinformation_pattern',
      displayName: 'Misinformation Pattern',
      description:
        'Detected false claims, propaganda techniques, debunked narratives.',
      extractedDataSchema:
        '{"claim": "", "debunking_evidence": "", "propagators": [], "technique": "", "spread_level": "high/medium/low"}',
      analysisFallback:
        'This misinformation pattern demonstrates active narrative manipulation that affects public understanding.',
    },
    {
      name: 'source_credibility',
      displayName: 'Source Credibility',
      description:
        'Assessment of source reliability based on historical coverage.',
      extractedDataSchema:
        '{"source_name": "", "track_record": "good/mixed/poor", "notable_errors": [], "notable_successes": [], "ownership_bias": ""}',
      analysisFallback:
        'This credibility assessment helps calibrate how much weight to give different sources.',
    },
    {
      name: 'actor_interest',
      displayName: 'Actor Interest',
      description: 'Stakeholders and their stated vs hidden interests.',
      extractedDataSchema:
        '{"actor": "", "stated_position": "", "likely_interest": "", "evidence_for_hidden_interest": ""}',
      analysisFallback:
        "Understanding this actor's interests reveals the gap between stated positions and likely motivations.",
    },
    {
      name: 'counter_narrative',
      displayName: 'Counter Narrative',
      description: 'Alternative explanations and dissenting views.',
      extractedDataSchema:
        '{"alternative_view": "", "proponents": [], "evidence": "", "credibility_assessment": ""}',
      analysisFallback:
        'This alternative perspective challenges mainstream assumptions and deserves consideration.',
    },
    {
      name: 'historical_parallel',
      displayName: 'Historical Parallel',
      description: 'Similar events in history that provide context.',
      extractedDataSchema:
        '{"parallel_event": "", "date": "", "similarities": [], "differences": [], "lesson": ""}',
      analysisFallback:
        'This historical comparison provides context for understanding likely outcomes and patterns.',
    },
  ],

  extractionGuidelines: `CRITICAL: The "analysis" field must provide substantive reasoning, not just restate the finding.
Bad example: "This is an important media narrative."
Good example: "This narrative framing emerged specifically after the policy announcement, suggesting coordinated messaging. The choice to emphasize economic impacts while omitting human costs reflects the outlet's historical pattern of pro-business coverage. This contrasts sharply with local media reporting, which prioritized community impacts."

IMPORTANT GUIDELINES:
- Be skeptical - flag claims that lack corroboration
- Distinguish between established facts and analysis/opinion
- Note conflicting narratives rather than choosing one
- Prioritize primary sources over secondary reporting
- Flag propaganda techniques (emotional manipulation, false equivalence, strawmen, etc.)`,

  analysisInstruction: `YOUR EXPERT ANALYTICAL COMMENTARY (REQUIRED - 2-4 sentences) explaining:
  * WHY this finding matters for understanding the event/topic
  * What CONTEXT or BACKGROUND helps interpret this
  * How this RELATES to other findings or the broader narrative
  * What this REVEALS about hidden motivations, biases, or dynamics`,

  // ---- Ordering & Grouping ----
  priorityFindingTypes: [
    'event_chain',
    'financial_motivation',
    'misinformation_pattern',
    'actor_interest',
    'media_narrative',
    'source_credibility',
  ],
  groupingOrder: [
    'event_chain',
    'financial_motivation',
    'misinformation_pattern',
    'actor_interest',
    'media_narrative',
    'source_credibility',
    'counter_narrative',
    'historical_parallel',
  ],

  // ---- Perspectives ----
  // 6 expert perspectives for understanding complex events
  perspectives: [...PERSPECTIVE_SETS.understanding],

  // ---- Verification ----
  // Understanding requires thorough verification on all dimensions
  verificationConfig: {
    crossReference: 'thorough',
    biasDetection: 'thorough',
    expertSanityCheck: 'thorough',
    sourceQuality: 'thorough',
  },

  // ---- Resource Limits ----
  defaultMaxSearches: 10,
};

export default understandingConfig;
