/**
 * Investigative Template Configuration
 *
 * Migrated from: actor/src/templates/investigative.py
 *
 * Template for investigative journalism research including:
 * - Key actors and relationships
 * - Timeline and events
 * - Financial trails
 * - Evidence and patterns
 */

import { TemplateConfig } from '../types';

export const investigativeConfig: TemplateConfig = {
  // ---- Identity ----
  templateId: 'investigative',
  templateName: 'Investigative Research',
  description:
    'Deep investigative journalism with actor and relationship analysis',

  // ---- Search Phase Configuration ----
  searchIntro:
    'You are an investigative journalist planning research queries for a deep investigation.',

  searchAngles: [
    {
      name: 'KEY ACTORS',
      items: [
        'Who are the main people/organizations involved?',
        'Backgrounds and histories of key individuals',
        'Corporate structures and ownership',
      ],
    },
    {
      name: 'TIMELINE',
      items: [
        'What events happened and when?',
        'Sequence of key decisions and actions',
        'Historical context and precedents',
      ],
    },
    {
      name: 'LOCATIONS',
      items: [
        'Where did key events occur?',
        'What jurisdictions are involved?',
        'Geographic patterns and connections',
      ],
    },
    {
      name: 'MOTIVATIONS',
      items: [
        'What are the underlying interests?',
        'Relationships and alliances',
        'Conflicts of interest',
      ],
    },
    {
      name: 'METHODS',
      items: [
        'How were things done?',
        'What mechanisms were used?',
        'Patterns of behavior or action',
      ],
    },
    {
      name: 'MONEY TRAIL',
      items: [
        'Financial connections and transactions',
        'Funding sources and flows',
        'Property and asset movements',
      ],
    },
    {
      name: 'OFFICIAL RECORDS',
      items: [
        'Government filings and registrations',
        'Court documents and legal proceedings',
        'Regulatory actions and investigations',
      ],
    },
    {
      name: 'MEDIA COVERAGE',
      items: [
        'News reports and investigations',
        'Interviews and public statements',
        'Coverage patterns and omissions',
      ],
    },
    {
      name: 'NARRATIVE ARCHAEOLOGY',
      items: [
        'First appearance of key talking points and claims - trace to origin',
        'Evolution of story framing over time across different outlets',
        'Sources that covered vs systematically ignored this story',
        'Fact-checks: who funded them, what methodology, any conflicts',
        'PR firms and communications consultants involved',
      ],
    },
    {
      name: 'INCENTIVE MAPPING',
      items: [
        'Financial beneficiaries of current dominant narrative',
        'Career incentives and revolving doors for key spokespeople',
        'Funding sources for research, think tanks, and experts cited',
        'Regulatory capture indicators and agency-industry relationships',
        'Political donations and lobbying by involved parties',
      ],
    },
    {
      name: 'TEMPORAL ANALYSIS',
      items: [
        'What else happened on the same day that received less coverage',
        'Timing of announcements relative to other events (Friday news dumps)',
        'Long-term patterns that short-term coverage obscures',
        'Seasonal or cyclical patterns in similar events',
      ],
    },
    {
      name: 'NETWORK INFERENCE',
      items: [
        'Board memberships, advisory roles shared between actors',
        'Conference co-appearances, co-authorships, joint ventures',
        'Funding flows through foundations, NGOs, and intermediaries',
        'Social connections: school ties, club memberships, family',
      ],
    },
  ],

  searchDepthGuidance: {
    quick: 'Focus on 1-3 most critical angles',
    standard: 'Cover 4-5 key angles with balanced depth',
    deep: 'Comprehensive coverage of all angles with follow-up queries',
  },

  // ---- Extraction Phase Configuration ----
  extractionIntro:
    'You are an investigative analyst extracting key findings for a deep investigation.',

  findingTypes: [
    {
      name: 'actor',
      displayName: 'Actor',
      description:
        'People, organizations, entities involved. Include: name, role, affiliations, significance. Note any aliases or connections.',
      extractedDataSchema:
        '{"name": "...", "role": "...", "affiliations": [...], "significance": "...", "aliases": [...]}',
      analysisFallback:
        "This actor's role and connections warrant further investigation to understand their influence on events.",
    },
    {
      name: 'event',
      displayName: 'Event',
      description:
        'Key incidents, actions, decisions. Include: date (if known), location, participants, outcome. Note sequence and causation.',
      extractedDataSchema:
        '{"date": "...", "location": "...", "participants": [...], "outcome": "...", "causation": "..."}',
      analysisFallback:
        'This event is significant in the investigative timeline and may have causal links to other developments.',
    },
    {
      name: 'relationship',
      displayName: 'Relationship',
      description:
        'Connections between actors. Types: personal, professional, political, criminal. Include strength of evidence.',
      extractedDataSchema:
        '{"actor_a": "...", "actor_b": "...", "relationship_type": "...", "evidence_strength": "strong/moderate/weak"}',
      analysisFallback:
        'This connection reveals potential coordination or influence that could be relevant to the investigation.',
    },
    {
      name: 'financial',
      displayName: 'Financial Transaction',
      description:
        'ANY money movement: payments, gifts, loans, wire transfers, settlements, property purchases, investments, donations. This is CRITICAL - extract ALL financial amounts mentioned.',
      extractedDataSchema:
        '{"amount": 0, "currency": "USD", "payer": "...", "payee": "...", "transaction_date": "YYYY-MM-DD", "transaction_type": "payment/gift/loan/wire_transfer/property/settlement/investment", "purpose": "..."}',
      analysisFallback:
        'This financial transaction may indicate underlying arrangements that require further scrutiny.',
    },
    {
      name: 'evidence',
      displayName: 'Evidence',
      description:
        'Documents, statements, data points. Include: type, source, significance. Note verification status.',
      extractedDataSchema:
        '{"evidence_type": "document/statement/data", "source": "...", "significance": "...", "verified": true}',
      analysisFallback:
        'This evidence supports key aspects of the investigation and strengthens the evidentiary foundation.',
    },
    {
      name: 'pattern',
      displayName: 'Pattern',
      description:
        'Recurring behaviors, methods, structures. Include: description, frequency, participants.',
      extractedDataSchema:
        '{"description": "...", "frequency": "...", "participants": [...], "time_span": "..."}',
      analysisFallback:
        'This recurring pattern suggests systematic behavior that may indicate intentional coordination.',
    },
    {
      name: 'gap',
      displayName: 'Gap',
      description:
        "Missing information, unanswered questions. What we don't know and why it matters. Suggested follow-up.",
      extractedDataSchema:
        '{"question": "...", "importance": "high/medium/low", "suggested_followup": [...]}',
      analysisFallback:
        'This information gap limits our ability to draw complete conclusions and should be addressed.',
    },
    {
      name: 'narrative_frame',
      displayName: 'Narrative Frame',
      description:
        'How the story is being framed and told. Includes: dominant narrative, framing choices, language patterns (passive voice, euphemisms), emotional appeals, what is emphasized vs minimized.',
      extractedDataSchema:
        '{"dominant_frame": "...", "framing_techniques": [...], "language_patterns": [...], "emphasized": [...], "minimized": [...]}',
      analysisFallback:
        'This framing choice shapes how audiences interpret events and may obscure alternative interpretations.',
    },
    {
      name: 'incentive_alignment',
      displayName: 'Incentive Alignment',
      description:
        'Who benefits from this claim or narrative being believed. Follow the money and career incentives. Note conflicts of interest.',
      extractedDataSchema:
        '{"beneficiaries": [...], "incentive_type": "financial/career/political/reputational", "conflicts_of_interest": [...], "cui_bono": "..."}',
      analysisFallback:
        'Understanding who benefits from a narrative reveals potential bias and motivation.',
    },
    {
      name: 'historical_parallel',
      displayName: 'Historical Parallel',
      description:
        'Similar past events or patterns. Playbook recognition - has this type of situation played out before? What happened then?',
      extractedDataSchema:
        '{"historical_event": "...", "date": "...", "similarity_score": 0.8, "key_parallels": [...], "key_differences": [...], "outcome_then": "..."}',
      analysisFallback:
        'Historical patterns often repeat; understanding precedents illuminates likely trajectories.',
    },
    {
      name: 'suspicious_timing',
      displayName: 'Suspicious Timing',
      description:
        'Events with convenient timing. What else happened simultaneously? Friday news dumps, holiday releases, distraction events.',
      extractedDataSchema:
        '{"event": "...", "timing": "...", "concurrent_events": [...], "potential_distraction_from": "...", "pattern_type": "news_dump/distraction/preemption"}',
      analysisFallback:
        'Timing of disclosures and events often reveals strategic intent.',
    },
    {
      name: 'coverage_asymmetry',
      displayName: 'Coverage Asymmetry',
      description:
        'Same event covered very differently by different sources. What do some sources include that others omit? Systematic patterns.',
      extractedDataSchema:
        '{"event": "...", "source_a": "...", "source_b": "...", "included_by_a_only": [...], "included_by_b_only": [...], "framing_difference": "..."}',
      analysisFallback:
        'Differential coverage reveals editorial biases and potentially coordinated narratives.',
    },
    {
      name: 'network_inference',
      displayName: 'Network Inference',
      description:
        'Implied relationships not explicitly documented. Shared board seats, funding connections, social ties, professional networks.',
      extractedDataSchema:
        '{"actor_a": "...", "actor_b": "...", "connection_type": "board/funding/social/professional", "intermediaries": [...], "strength": "strong/moderate/weak"}',
      analysisFallback:
        'Informal networks often explain coordinated behavior that formal relationships cannot.',
    },
  ],

  extractionGuidelines: `CRITICAL: The "analysis" field must provide substantive reasoning, not just restate the finding.
Bad example: "This is an important financial transaction."
Good example: "This payment pattern suggests a quid pro quo arrangement because the timing coincides with the policy change. The use of intermediary accounts indicates awareness that direct payment would raise red flags. This connects to the earlier lobbying activity and raises questions about who authorized the payment structure."

IMPORTANT:
- Prioritize extracting ALL financial transactions with specific dollar amounts
- Note corroboration status for key claims
- Flag connections that warrant further investigation`,

  analysisInstruction: `YOUR EXPERT ANALYTICAL COMMENTARY (REQUIRED - 2-4 sentences) explaining:
  * WHY this finding is significant for the investigation
  * What it IMPLIES about the broader situation
  * How it CONNECTS to other findings or patterns
  * What questions it RAISES or answers`,

  // ---- Ordering & Grouping ----
  priorityFindingTypes: [
    'financial',
    'evidence',
    'actor',
    'relationship',
    'pattern',
    'narrative_frame',
    'incentive_alignment',
    'network_inference',
  ],
  groupingOrder: [
    'financial',
    'actor',
    'relationship',
    'evidence',
    'event',
    'pattern',
    'narrative_frame',
    'incentive_alignment',
    'historical_parallel',
    'suspicious_timing',
    'coverage_asymmetry',
    'network_inference',
    'gap',
  ],

  // ---- Perspectives ----
  // 9 expert perspectives for deep investigative analysis
  perspectives: [
    'forensic_financial', // Follow the money, fraud detection
    'power_network', // Map influence networks and institutional capture
    'psychological_behavioral', // Analyze motivations and credibility
    'legal_liability', // Assess legal exposure and enforcement risk
    'geopolitical_strategic', // Strategic interests and power dynamics
    'narrative_analyst', // How stories are framed, meta-narrative analysis
    'incentive_mapper', // Cui bono analysis, follow the money
    'historical_pattern', // Pattern recognition across time
    'omission_detective', // What's NOT being reported and why
  ],

  // ---- Verification ----
  // Investigative requires thorough verification on all dimensions
  // Critical to verify claims, detect cover-ups, and identify spin
  verificationConfig: {
    crossReference: 'thorough', // Must corroborate claims
    biasDetection: 'thorough', // Detect PR spin, cover-ups
    expertSanityCheck: 'thorough', // Flag implausible claims
    sourceQuality: 'thorough', // Primary sources critical
  },

  // ---- Resource Limits ----
  defaultMaxSearches: 8,
};

export default investigativeConfig;
