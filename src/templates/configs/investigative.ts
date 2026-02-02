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
  ],
  groupingOrder: [
    'financial',
    'actor',
    'relationship',
    'evidence',
    'event',
    'pattern',
    'gap',
  ],

  // ---- Perspectives ----
  // 5 expert perspectives for deep investigative analysis
  perspectives: [
    'forensic_financial', // Follow the money, fraud detection
    'power_network', // Map influence networks and institutional capture
    'psychological_behavioral', // Analyze motivations and credibility
    'legal_liability', // Assess legal exposure and enforcement risk
    'geopolitical_strategic', // Strategic interests and power dynamics
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
