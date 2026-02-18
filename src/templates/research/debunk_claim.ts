/**
 * Debunk Claim Template Configuration
 *
 * Template for fact-checking and claim verification research including:
 * - Source credibility assessment
 * - Evidence verification and cross-referencing
 * - Claim origin tracing
 * - Logical fallacy detection
 * - Counter-evidence discovery
 */

import { TemplateConfig } from '../types';
import { PERSPECTIVE_SETS } from '../prompts/experts';

export const debunkClaimConfig: TemplateConfig = {
  // ---- Identity ----
  templateId: 'debunk_claim',
  templateName: 'Claim Verification & Debunking',
  description:
    'Systematic fact-checking and claim verification with evidence-based analysis',

  // ---- Search Phase Configuration ----
  searchIntro:
    'You are a professional fact-checker investigating a specific claim. Your goal is to verify or debunk the claim using publicly available evidence, primary sources, and expert analysis.',

  searchAngles: [
    {
      name: 'CLAIM ORIGIN',
      items: [
        'Where did this claim first appear? Trace to original source',
        'Who made the claim and what are their credentials/affiliations?',
        'How has the claim evolved as it spread across media?',
        'What context was the claim originally made in?',
      ],
    },
    {
      name: 'PRIMARY EVIDENCE',
      items: [
        'Official data, statistics, and government records relevant to the claim',
        'Peer-reviewed research and academic papers',
        'Court documents, regulatory filings, and legal records',
        'Raw data sources that can independently verify or refute the claim',
      ],
    },
    {
      name: 'EXISTING FACT-CHECKS',
      items: [
        'Has this claim been fact-checked by established organizations?',
        'What rating did major fact-checkers give (true/false/misleading)?',
        'Are there conflicting fact-check conclusions? Why?',
        'Who funded the fact-checks and are there conflicts of interest?',
      ],
    },
    {
      name: 'COUNTER-EVIDENCE',
      items: [
        'What evidence contradicts the claim?',
        'Are there alternative explanations for the data cited?',
        'What do critics and skeptics of the claim argue?',
        'What information is the claim omitting or misrepresenting?',
      ],
    },
    {
      name: 'SUPPORTING EVIDENCE',
      items: [
        'What evidence supports the claim?',
        'Are the cited sources credible and correctly represented?',
        'Do independent sources corroborate the key assertions?',
        'Is the supporting evidence current or outdated?',
      ],
    },
    {
      name: 'EXPERT OPINION',
      items: [
        'What do domain experts say about this claim?',
        'Is there scientific or professional consensus?',
        'Are cited experts actually qualified in the relevant field?',
        'Do experts with no conflicts of interest agree or disagree?',
      ],
    },
    {
      name: 'CONTEXT & FRAMING',
      items: [
        'Is the claim presented with full context or selectively?',
        'Are statistics being used correctly or misleadingly?',
        'What logical fallacies or rhetorical techniques are employed?',
        'How does the framing change the perception of underlying facts?',
      ],
    },
    {
      name: 'MOTIVATION ANALYSIS',
      items: [
        'Who benefits from this claim being believed or disbelieved?',
        'Is there a financial, political, or ideological motive?',
        'Is this claim part of a larger coordinated narrative campaign?',
        'What is the track record of the claim maker on similar topics?',
      ],
    },
  ],

  searchDepthGuidance: {
    quick: 'Check 1-2 fact-check databases and the primary source',
    standard: 'Verify against 3-4 independent sources, check existing fact-checks, trace claim origin',
    deep: 'Comprehensive verification including primary data, expert opinions, historical context, and motivation analysis',
  },

  // ---- Extraction Phase Configuration ----
  extractionIntro:
    'You are a fact-checking analyst extracting verification evidence. For each piece of evidence, clearly indicate whether it supports, refutes, or complicates the claim.',

  findingTypes: [
    {
      name: 'claim_component',
      displayName: 'Claim Component',
      description:
        'Break the main claim into individual verifiable sub-claims. Each component should be independently assessable. Include: the specific assertion, its verifiability (high/medium/low), and current verification status.',
      extractedDataSchema:
        '{"assertion": "...", "verifiability": "high/medium/low", "verdict": "true/false/misleading/unverified/partly_true", "confidence": 0.8}',
      analysisFallback:
        'This component of the claim needs to be assessed against available evidence.',
    },
    {
      name: 'verification_evidence',
      displayName: 'Verification Evidence',
      description:
        'Evidence that directly supports or refutes the claim. Include: the evidence type, source, what it proves/disproves, and its reliability.',
      extractedDataSchema:
        '{"evidence_type": "data/document/expert_opinion/study", "source": "...", "supports_claim": true, "reliability": "high/medium/low", "what_it_proves": "..."}',
      analysisFallback:
        'This evidence is relevant to determining the veracity of the claim.',
    },
    {
      name: 'source_credibility',
      displayName: 'Source Credibility',
      description:
        'Assessment of a source cited in or about the claim. Include: source name, type, known biases, funding, track record, and credibility rating.',
      extractedDataSchema:
        '{"source_name": "...", "source_type": "media/academic/government/think_tank/individual", "known_biases": [...], "funding": "...", "credibility_rating": "high/medium/low", "track_record": "..."}',
      analysisFallback:
        'The credibility of this source affects the weight we should give to claims derived from it.',
    },
    {
      name: 'logical_fallacy',
      displayName: 'Logical Fallacy',
      description:
        'Logical errors or rhetorical manipulation in the claim or its defense. Include: fallacy type, where it appears, and how it distorts the argument.',
      extractedDataSchema:
        '{"fallacy_type": "...", "example": "...", "how_it_distorts": "...", "appears_in": "claim/defense/criticism"}',
      analysisFallback:
        'This logical error weakens the argument and should be considered when evaluating the claim.',
    },
    {
      name: 'missing_context',
      displayName: 'Missing Context',
      description:
        'Important context omitted from the claim that changes its meaning. Include: what was left out, why it matters, and how it changes the interpretation.',
      extractedDataSchema:
        '{"omitted_info": "...", "importance": "high/medium/low", "how_it_changes_interpretation": "...", "likely_reason_omitted": "..."}',
      analysisFallback:
        'This missing context is essential for a complete understanding of the claim.',
    },
    {
      name: 'statistical_issue',
      displayName: 'Statistical Issue',
      description:
        'Problems with data or statistics cited in the claim. Include: the statistic cited, what is wrong with it, the correct interpretation, and the actual data.',
      extractedDataSchema:
        '{"cited_statistic": "...", "issue_type": "cherry_picked/outdated/misrepresented/decontextualized/fabricated", "correct_interpretation": "...", "actual_data": "..."}',
      analysisFallback:
        'This statistical issue undermines the evidence basis for the claim.',
    },
    {
      name: 'fact_check_result',
      displayName: 'Fact Check Result',
      description:
        'Existing fact-check from an established organization. Include: organization, their verdict, methodology, and any noted limitations.',
      extractedDataSchema:
        '{"organization": "...", "verdict": "true/false/misleading/partly_true/unproven", "methodology": "...", "date": "...", "limitations": "..."}',
      analysisFallback:
        'This prior fact-check provides a reference point for our own verification.',
    },
    {
      name: 'narrative_frame',
      displayName: 'Narrative Frame',
      description:
        'How the claim is being framed to influence perception. Includes: framing techniques, emotional appeals, language choices, and what is emphasized vs minimized.',
      extractedDataSchema:
        '{"framing_technique": "...", "emotional_appeals": [...], "language_patterns": [...], "emphasized": [...], "minimized": [...]}',
      analysisFallback:
        'This framing shapes how audiences interpret the claim and may obscure the factual basis.',
    },
    {
      name: 'incentive_alignment',
      displayName: 'Incentive Alignment',
      description:
        'Who benefits from this claim being believed or disbelieved. Follow the money and career incentives.',
      extractedDataSchema:
        '{"beneficiaries": [...], "incentive_type": "financial/career/political/ideological", "conflicts_of_interest": [...], "cui_bono": "..."}',
      analysisFallback:
        'Understanding who benefits reveals potential bias and motivation behind the claim.',
    },
    {
      name: 'historical_parallel',
      displayName: 'Historical Parallel',
      description:
        'Similar claims or debunking patterns from the past. Has this type of claim been made before? What happened then?',
      extractedDataSchema:
        '{"historical_claim": "...", "date": "...", "outcome": "...", "similarity": "high/medium/low", "lessons": "..."}',
      analysisFallback:
        'Historical patterns of similar claims provide context for evaluating this one.',
    },
  ],

  extractionGuidelines: `CRITICAL: For each finding, clearly state whether it SUPPORTS, REFUTES, or COMPLICATES the claim.

IMPORTANT:
- Break the main claim into individually verifiable components
- For each data point cited, verify against primary sources
- Note when evidence is circumstantial vs direct
- Flag any circular sourcing (sources citing each other)
- Distinguish between "not proven" and "disproven"
- Rate confidence levels honestly — uncertainty is valuable information`,

  analysisInstruction: `YOUR VERDICT ANALYSIS (REQUIRED - 2-4 sentences) explaining:
  * Whether this evidence SUPPORTS or REFUTES the claim (or parts of it)
  * The STRENGTH of this evidence (direct proof, circumstantial, suggestive)
  * How it CONNECTS to other evidence found
  * What CONFIDENCE LEVEL is appropriate given this evidence`,

  // ---- Ordering & Grouping ----
  priorityFindingTypes: [
    'claim_component',
    'verification_evidence',
    'statistical_issue',
    'source_credibility',
    'missing_context',
    'logical_fallacy',
    'fact_check_result',
    'incentive_alignment',
  ],
  groupingOrder: [
    'claim_component',
    'verification_evidence',
    'fact_check_result',
    'statistical_issue',
    'source_credibility',
    'logical_fallacy',
    'missing_context',
    'narrative_frame',
    'incentive_alignment',
    'historical_parallel',
  ],

  // ---- Perspectives ----
  perspectives: [...PERSPECTIVE_SETS.debunkClaim],

  // ---- Verification ----
  verificationConfig: {
    crossReference: 'thorough',
    biasDetection: 'thorough',
    expertSanityCheck: 'thorough',
    sourceQuality: 'thorough',
  },

  // ---- Resource Limits ----
  defaultMaxSearches: 10,
};

export default debunkClaimConfig;
