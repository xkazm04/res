/**
 * Contract Analysis Template Configuration
 *
 * Migrated from: actor/src/templates/contract.py
 *
 * Template for government contract analysis and fraud investigation including:
 * - Vendor/contractor background and pricing benchmarks
 * - Bid process analysis and competition levels
 * - Red flags, suspicious elements, and corruption indicators
 */

import { TemplateConfig } from '../types';

export const contractConfig: TemplateConfig = {
  // ---- Identity ----
  templateId: 'contract',
  templateName: 'Government Contract Analysis',
  description:
    'Analyze state/government contracts for overpricing, corruption, and suspicious elements',

  // ---- Search Phase Configuration ----
  searchIntro:
    'You are a government contract analyst and fraud investigator planning research queries to analyze contracts for overpricing, corruption risks, and suspicious elements.',

  searchAngles: [
    {
      name: 'VENDOR/CONTRACTOR BACKGROUND',
      items: [
        'Company registration, incorporation date, ownership history',
        'Key executives and beneficial owners',
        'Prior government contracts with this vendor',
        'Complaints, lawsuits, debarment history',
        'Related companies, subsidiaries, DBAs',
        'Political donations by company or executives',
      ],
    },
    {
      name: 'PRICING BENCHMARK RESEARCH',
      items: [
        'Industry standard rates for similar work/services',
        'Government rate schedules (GSA schedules for federal)',
        'Comparable contracts in same sector/region',
        'Unit pricing for common line items',
        'Labor rate comparisons (prevailing wage data)',
        'Material cost benchmarks',
      ],
    },
    {
      name: 'BID PROCESS AND COMPETITION',
      items: [
        'Other bidders on this contract (if public)',
        'Similar recent solicitations for comparison',
        'Sole-source justification patterns',
        'Bid protest history',
        'Procurement officer history and patterns',
      ],
    },
    {
      name: 'CONTRACT MODIFICATIONS AND OVERRUNS',
      items: [
        'Change order patterns on similar contracts',
        'Amendment and modification history',
        'Cost overrun statistics in sector',
        'Schedule extension patterns',
        'Scope creep indicators',
      ],
    },
    {
      name: 'VENDOR PERFORMANCE HISTORY',
      items: [
        'Past performance evaluations (PPIRS for federal)',
        'Completed projects: on-time, on-budget?',
        'Quality issues, defects, rework',
        'Customer complaints and disputes',
        'Warranty claims and callbacks',
      ],
    },
    {
      name: 'CONNECTED ENTITIES AND CONFLICTS',
      items: [
        'Subcontractor relationships',
        'Joint venture partners',
        'Related party transactions',
        'Revolving door: former officials now at vendor',
        'Family connections to agency staff',
        'Shell company indicators',
      ],
    },
    {
      name: 'REGULATORY AND COMPLIANCE',
      items: [
        'Required certifications/licenses',
        'Small business set-aside compliance',
        'DBE/MBE/WBE certification verification',
        'Insurance and bonding requirements',
        'DCAA audit findings (federal)',
      ],
    },
    {
      name: 'NEWS AND INVESTIGATIONS',
      items: [
        'Media coverage of vendor or contract',
        'Inspector General reports',
        'GAO/state auditor findings',
        'Whistleblower complaints',
        'FBI/DOJ investigations in sector',
      ],
    },
  ],

  searchDepthGuidance: {
    quick: 'Focus on vendor background + pricing benchmark + news/issues',
    standard: 'Add bid process + performance + connected entities',
    deep: 'All angles with multiple queries per angle, deep ownership research',
  },

  // ---- Extraction Phase Configuration ----
  extractionIntro:
    'You are a government contract auditor and fraud investigator extracting findings from research on a contract or contractor. Your goal is to identify red flags, pricing anomalies, and corruption indicators. CRITICAL: Use EXACT finding_type values specified below.',

  findingTypes: [
    {
      name: 'contract_entity',
      displayName: 'Contract Entity',
      description:
        'Key parties: vendor, agency, contracting officer, subcontractors. Note: ownership structure, key personnel.',
      extractedDataSchema:
        '{"entity_name": "...", "entity_type": "...", "role": "...", "registration_info": "..."}',
      analysisFallback:
        'This entity information provides context for understanding the contract relationships.',
    },
    {
      name: 'contract_terms',
      displayName: 'Contract Terms',
      description:
        'Value, duration, payment schedule, key rates. Note: unusual terms, milestone payments.',
      extractedDataSchema:
        '{"total_value": "...", "duration": "...", "payment_terms": "...", "key_rates": "...", "type": "fixed/cost-plus"}',
      analysisFallback:
        'These contract terms should be evaluated against industry standards and benchmarks.',
    },
    {
      name: 'pricing_analysis',
      displayName: 'Pricing Analysis',
      description:
        'Cost breakdown, unit rates, comparison to market. Note: overhead, profit margins, labor vs. materials.',
      extractedDataSchema:
        '{"item": "...", "proposed_rate": "...", "market_rate": "...", "variance_percent": "...", "benchmark_source": "..."}',
      analysisFallback:
        'This pricing analysis helps assess whether contract rates are reasonable and competitive.',
    },
    {
      name: 'bid_process',
      displayName: 'Bid Process Finding',
      description:
        'Competition level, bidders, evaluation criteria. Note: sole-source justifications, bid rotation patterns.',
      extractedDataSchema:
        '{"bid_count": "...", "bidder_names": [...], "award_basis": "...", "competition_type": "..."}',
      analysisFallback:
        'The bid process findings reveal the level of competition and potential procurement concerns.',
    },
    {
      name: 'suspicious_element',
      displayName: 'Suspicious Element',
      description:
        'Unusual terms, sweetheart deals, conflict indicators. Examples: related party transactions, revolving door, bid steering.',
      extractedDataSchema:
        '{"element_type": "...", "description": "...", "severity": "high/medium/low", "related_parties": [...], "evidence": "..."}',
      analysisFallback:
        'This suspicious element warrants further investigation to assess potential impropriety.',
    },
    {
      name: 'connected_entity',
      displayName: 'Connected Entity',
      description:
        'Related parties, shell companies, family businesses. Note: ownership overlaps, shared addresses, common executives.',
      extractedDataSchema:
        '{"primary_entity": "...", "connected_entity": "...", "relationship_type": "...", "evidence": "..."}',
      analysisFallback:
        'This connection between entities may indicate conflicts of interest or coordinated activity.',
    },
    {
      name: 'compliance_issue',
      displayName: 'Compliance Issue',
      description:
        'Regulatory violations, missing documentation. Note: licensing, certifications, insurance, bonding.',
      extractedDataSchema:
        '{"requirement": "...", "status": "...", "violation_type": "...", "consequence": "..."}',
      analysisFallback:
        'This compliance issue may affect contract validity or create legal exposure.',
    },
    {
      name: 'performance_issue',
      displayName: 'Performance Issue',
      description:
        'Delays, cost overruns, quality problems. Note: pattern across multiple contracts.',
      extractedDataSchema:
        '{"issue_type": "...", "original_value": "...", "actual_value": "...", "variance": "...", "cause": "..."}',
      analysisFallback:
        'This performance issue indicates potential problems with contractor capability or management.',
    },
    {
      name: 'comparable_contract',
      displayName: 'Comparable Contract',
      description:
        'Similar contracts for benchmarking. Note: price per unit/sq ft/hour comparisons.',
      extractedDataSchema:
        '{"contract_id": "...", "agency": "...", "vendor": "...", "value": "...", "scope": "...", "outcome": "..."}',
      analysisFallback:
        'This comparable contract provides a benchmark for evaluating pricing and terms.',
    },
    {
      name: 'red_flag',
      displayName: 'Red Flag',
      description:
        'Strong corruption or fraud indicators. Examples: phantom vendors, kickbacks, bid rigging, overbilling.',
      extractedDataSchema:
        '{"flag_type": "...", "description": "...", "risk_level": "high/critical", "supporting_evidence": [...], "recommended_investigation": "..."}',
      analysisFallback:
        'This red flag indicates potential fraud or corruption that requires immediate attention.',
    },
    {
      name: 'gap',
      displayName: 'Gap',
      description:
        'Missing critical information needed. Note: what documents/data would help investigation.',
      extractedDataSchema:
        '{"information_needed": "...", "importance": "high/medium/low", "impact_on_analysis": "..."}',
      analysisFallback:
        'This information gap limits the completeness of the analysis and should be addressed.',
    },
    {
      name: 'date_timeline',
      displayName: 'Date/Timeline',
      description:
        'Important dates and timeline inconsistencies. Note: contract award before bid deadline, rushed timelines.',
      extractedDataSchema:
        '{"event": "...", "date": "...", "significance": "...", "related_events": [...]}',
      analysisFallback:
        'This timeline information helps understand the sequence of events and identify anomalies.',
    },
  ],

  extractionGuidelines: `CRITICAL: The "analysis" field must provide substantive investigative reasoning, not just describe the finding.
Good example: "This 40% price premium over market rate is a significant red flag in competitive bid environments. In similar cases, inflated pricing of this magnitude has been associated with kickback schemes where the excess margin funds illicit payments. The fact that this vendor has previously worked with the contracting officer warrants examination of their relationship and any campaign contributions or post-employment arrangements."

CRITICAL: Prioritize RED_FLAG and SUSPICIOUS_ELEMENT findings. If you identify
potential fraud indicators, ensure they are captured even if confidence is moderate.
False negatives (missing fraud) are worse than false positives (flagging non-issues).`,

  analysisInstruction: `YOUR EXPERT INVESTIGATIVE ANALYSIS (REQUIRED - 2-4 sentences) explaining:
  * WHY this finding is significant for contract oversight or fraud detection
  * What PATTERN or RED FLAG this represents in government contracting
  * How this COMPARES to normal contracting practices or known fraud schemes
  * What FURTHER INVESTIGATION or action this finding warrants`,

  // ---- Ordering & Grouping ----
  priorityFindingTypes: [
    'red_flag',
    'suspicious_element',
    'compliance_issue',
    'pricing_analysis',
    'connected_entity',
  ],
  groupingOrder: [
    'red_flag',
    'suspicious_element',
    'connected_entity',
    'compliance_issue',
    'pricing_analysis',
    'bid_process',
    'contract_terms',
    'performance_issue',
    'comparable_contract',
    'contract_entity',
    'date_timeline',
    'gap',
  ],

  // ---- Perspectives ----
  perspectives: [
    'contract_auditor', // Pricing and cost analysis
    'procurement_investigator', // Bid process, competition issues
    'forensic_accountant', // Financial red flags
    'regulatory_compliance', // Legal requirements
    'industry_benchmarker', // Market rate comparison
  ],

  // ---- Verification ----
  // Thorough verification for fraud detection
  verificationConfig: {
    crossReference: 'thorough',
    biasDetection: 'thorough',
    expertSanityCheck: 'thorough',
    sourceQuality: 'thorough',
  },

  // ---- Resource Limits ----
  defaultMaxSearches: 12,
};

export default contractConfig;
