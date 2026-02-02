/**
 * Legal Research Template Configuration
 *
 * Migrated from: actor/src/templates/legal.py
 *
 * Template for legal research and regulatory analysis including:
 * - Case law, statutes, and regulations
 * - Enforcement actions and litigation history
 * - Legal commentary and compliance requirements
 */

import { TemplateConfig } from '../types';

export const legalConfig: TemplateConfig = {
  // ---- Identity ----
  templateId: 'legal',
  templateName: 'Legal Research',
  description: 'Legal case research, regulatory analysis, and compliance assessment',

  // ---- Search Phase Configuration ----
  searchIntro:
    'You are a legal researcher planning comprehensive legal research for a law firm or legal department.',

  searchAngles: [
    {
      name: 'CASE LAW',
      items: [
        'Relevant federal and state court decisions',
        'Appellate decisions and precedents',
        'Recent rulings in this area',
        'Landmark cases that shaped the law',
      ],
    },
    {
      name: 'STATUTES AND REGULATIONS',
      items: [
        'Applicable federal statutes (U.S. Code)',
        'State statutes and laws',
        'Federal regulations (CFR, Federal Register)',
        'State and local regulations',
      ],
    },
    {
      name: 'REGULATORY GUIDANCE',
      items: [
        'Agency interpretive guidance',
        'No-action letters, advisory opinions',
        'Enforcement policy statements',
        'FAQ and compliance bulletins',
      ],
    },
    {
      name: 'ENFORCEMENT ACTIONS',
      items: [
        'SEC, DOJ, FTC enforcement actions',
        'State AG actions',
        'Consent decrees and settlements',
        'Criminal prosecutions',
      ],
    },
    {
      name: 'LITIGATION HISTORY',
      items: [
        'Active lawsuits and proceedings',
        'Class action filings',
        'Qui tam and whistleblower cases',
        'Arbitration and alternative dispute resolution',
      ],
    },
    {
      name: 'LEGAL COMMENTARY',
      items: [
        'Law review articles and legal scholarship',
        'Bar association publications',
        'Legal blog analysis',
        'Expert commentary',
      ],
    },
    {
      name: 'REGULATORY FILINGS',
      items: [
        'SEC filings (8-K, 10-K risk factors)',
        'Lobbying disclosures',
        'Comment letters on proposed rules',
        'Patent and trademark filings',
      ],
    },
    {
      name: 'CONTRACTUAL ANALYSIS',
      items: [
        'Standard contract terms in this area',
        'Key contractual provisions',
        'Industry standard agreements',
        'Licensing and IP arrangements',
      ],
    },
    {
      name: 'COMPLIANCE REQUIREMENTS',
      items: [
        'Regulatory compliance checklists',
        'Industry standards and best practices',
        'Self-regulatory organization rules',
        'International compliance requirements',
      ],
    },
    {
      name: 'LEGAL TRENDS',
      items: [
        'Proposed legislation',
        'Regulatory reform initiatives',
        'Emerging legal theories',
        'Judicial appointment impacts',
      ],
    },
  ],

  searchDepthGuidance: {
    quick: 'Focus on most relevant cases and current regulations',
    standard: 'Balanced coverage of cases, regulations, and enforcement',
    deep: 'Comprehensive legal research including commentary and trends',
  },

  // ---- Extraction Phase Configuration ----
  extractionIntro:
    'You are a legal research analyst extracting key findings for legal analysis. CRITICAL: Use EXACT finding_type values specified below - they map to UI components.',

  findingTypes: [
    {
      name: 'evidence',
      displayName: 'Case Law',
      description:
        'Court decisions and holdings. Include: case name, court, date, holding. Note precedential value and applicability.',
      extractedDataSchema:
        '{"case_name": "...", "court": "...", "date": "...", "citation": "...", "holding": "...", "precedential_value": "binding/persuasive"}',
      analysisFallback:
        'This case law finding is relevant for establishing legal precedent in the matter at hand.',
    },
    {
      name: 'fact',
      displayName: 'Statutes and Regulations',
      description:
        'Applicable laws and regulations. Include: statute/regulation name, citation, key provisions. Note effective date and amendments.',
      extractedDataSchema:
        '{"name": "...", "citation": "...", "key_provisions": [...], "effective_date": "..."}',
      analysisFallback:
        'This statutory or regulatory finding establishes the legal framework applicable to the matter.',
    },
    {
      name: 'event',
      displayName: 'Enforcement/Litigation',
      description:
        'Regulatory enforcement, prosecutions, and active lawsuits. Include: agency/parties, date, allegations, outcome. Note penalties, injunctions, and remedies.',
      extractedDataSchema:
        '{"case_type": "enforcement/litigation", "parties": "...", "date": "...", "allegations": [...], "outcome": "...", "penalty": "..."}',
      analysisFallback:
        'This enforcement or litigation event provides context for understanding regulatory risk and legal exposure.',
    },
    {
      name: 'claim',
      displayName: 'Regulatory Guidance',
      description:
        'Agency interpretations and guidance. Include: agency, date, topic, key points. Note legal weight and binding nature.',
      extractedDataSchema:
        '{"agency": "...", "document_type": "...", "date": "...", "topic": "...", "key_points": [...]}',
      analysisFallback:
        'This regulatory guidance helps interpret how agencies apply the law in practice.',
    },
    {
      name: 'pattern',
      displayName: 'Legal Risk',
      description:
        'Identified legal exposure patterns. Include: risk type, likelihood, severity. Note mitigation strategies if mentioned.',
      extractedDataSchema:
        '{"risk_type": "...", "likelihood": "high/medium/low", "severity": "high/medium/low", "mitigation": [...]}',
      analysisFallback:
        'This legal risk pattern should be considered in risk assessment and mitigation planning.',
    },
    {
      name: 'relationship',
      displayName: 'Legal Precedent',
      description:
        'How cases relate to each other. Include: cases involved, relationship type. Note whether overruled or distinguished.',
      extractedDataSchema:
        '{"citing_case": "...", "cited_case": "...", "relationship": "follows/distinguishes/overrules/questions"}',
      analysisFallback:
        'This precedent relationship helps understand the evolution and current state of the law.',
    },
    {
      name: 'gap',
      displayName: 'Knowledge Gap',
      description:
        'Missing legal research. What additional research is needed. Suggested follow-up sources.',
      extractedDataSchema:
        '{"information_needed": "...", "importance": "high/medium/low", "suggested_sources": [...]}',
      analysisFallback:
        'This gap in legal research should be addressed before reaching final conclusions.',
    },
  ],

  extractionGuidelines: `CRITICAL: The "analysis" field must provide substantive legal reasoning, not just describe the finding.
Good example: "This Supreme Court holding is controlling precedent that directly applies to the current matter. The Court's reasoning suggests a broad interpretation that would likely cover the conduct at issue. However, the concurrence's narrower reading has been adopted by some circuit courts, creating potential for distinguishing arguments."

IMPORTANT:
- Prioritize primary sources (court filings, statutes) over secondary commentary
- Include specific citations where available
- Distinguish between established law and emerging interpretations
- Note jurisdictional limitations of precedents`,

  analysisInstruction: `YOUR EXPERT LEGAL ANALYSIS (REQUIRED - 2-4 sentences) explaining:
  * The LEGAL SIGNIFICANCE of this finding and how it affects the matter at hand
  * How this PRECEDENT or REGULATION applies to the specific situation
  * What RISKS or OPPORTUNITIES this creates from a legal perspective
  * How this COMPARES to similar cases or regulatory interpretations`,

  // ---- Ordering & Grouping ----
  priorityFindingTypes: ['evidence', 'fact', 'event', 'pattern', 'claim'],
  groupingOrder: ['evidence', 'fact', 'event', 'claim', 'pattern', 'relationship', 'gap'],

  // ---- Perspectives ----
  perspectives: [
    'litigation_strategist', // Case strength, discovery, outcomes
    'regulatory_expert', // Compliance, enforcement, political factors
    'legal_liability', // Liability exposure, evidence strength
    'forensic_financial', // Financial crimes, fraud patterns
  ],

  // ---- Verification ----
  // Legal research is more factual - court citations are verifiable
  // Focus on source quality (primary legal sources) over bias detection
  verificationConfig: {
    crossReference: 'light', // Legal citations are specific
    biasDetection: 'light', // Less bias in case law
    expertSanityCheck: 'light', // Legal findings are factual
    sourceQuality: 'thorough', // Primary sources (court filings) critical
  },

  // ---- Resource Limits ----
  defaultMaxSearches: 10,
};

export default legalConfig;
