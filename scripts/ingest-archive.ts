#!/usr/bin/env npx tsx
/**
 * Epstein Archive Ingestion Script
 *
 * Processes documents from the epstein-archive into the research database.
 * Groups documents into thematic research sessions, extracts investigative
 * findings via Claude CLI, and persists to Supabase.
 *
 * Usage:
 *   npx tsx scripts/ingest-archive.ts [--dry-run] [--group <name>] [--list]
 *
 * Options:
 *   --dry-run     Show what would be processed without actually running
 *   --group <n>   Only process a specific group (by name or index)
 *   --list        List all document groups and exit
 *   --skip <n>    Skip the first N groups
 *   --limit <n>   Process at most N groups
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { spawn } from 'child_process';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

const uuid = () => crypto.randomUUID();

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// ============================================
// CONFIG
// ============================================

const ARCHIVE_BASE = 'C:/Users/mkdol/dolla/epstein-archive/data';
const TEXT_DIR = path.join(ARCHIVE_BASE, 'text');
const OCR_DIR = path.join(ARCHIVE_BASE, 'ocr_clean', 'text');
const THEMATIC_GROUP = 'Jeffrey Epstein Investigation';
const TEMPLATE_ID = 'investigative';
const MAX_CHUNK_CHARS = 300_000; // ~75K tokens, leaves room for instructions + output
const WORKSPACE_ID = 'epstein-investigation';

// ============================================
// SUPABASE CLIENT
// ============================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ============================================
// TYPE MAPPINGS (from src/types/schema.ts)
// ============================================

const SCHEMA_FINDING_TYPES = [
  'fact', 'claim', 'event', 'actor', 'relationship', 'pattern', 'gap', 'evidence',
] as const;

const SCHEMA_PERSPECTIVE_TYPES = [
  'historical', 'political', 'economic', 'psychological', 'military',
  'social', 'technological', 'financial', 'journalist', 'conspirator', 'network',
] as const;

type SchemaFindingType = typeof SCHEMA_FINDING_TYPES[number];
type SchemaPerspectiveType = typeof SCHEMA_PERSPECTIVE_TYPES[number];

const FINDING_TYPE_MAP: Record<string, SchemaFindingType> = {
  actor: 'actor', event: 'event', relationship: 'relationship',
  financial: 'fact', evidence: 'evidence', pattern: 'pattern', gap: 'gap',
  narrative_frame: 'pattern', incentive_alignment: 'relationship',
  historical_parallel: 'pattern', suspicious_timing: 'event',
  coverage_asymmetry: 'evidence', network_inference: 'relationship',
  connection: 'relationship', transaction: 'event', allegation: 'claim',
  fact: 'fact', claim: 'claim',
};

const PERSPECTIVE_TYPE_MAP: Record<string, SchemaPerspectiveType> = {
  forensic_financial: 'financial', power_network: 'network',
  psychological_behavioral: 'psychological', legal_liability: 'political',
  geopolitical_strategic: 'political', narrative_analyst: 'journalist',
  incentive_mapper: 'financial', historical_pattern: 'historical',
  omission_detective: 'journalist', investigative_journalist: 'journalist',
  intelligence_analyst: 'military', fact_checker: 'journalist',
};

function mapFindingType(t: string): { schemaType: SchemaFindingType; originalType: string } {
  if ((SCHEMA_FINDING_TYPES as readonly string[]).includes(t)) {
    return { schemaType: t as SchemaFindingType, originalType: t };
  }
  return { schemaType: FINDING_TYPE_MAP[t] || 'fact', originalType: t };
}

function mapPerspectiveType(t: string): { schemaType: SchemaPerspectiveType; originalType: string } {
  if ((SCHEMA_PERSPECTIVE_TYPES as readonly string[]).includes(t)) {
    return { schemaType: t as SchemaPerspectiveType, originalType: t };
  }
  return { schemaType: PERSPECTIVE_TYPE_MAP[t] || 'journalist', originalType: t };
}

const TEMPORAL_MAP: Record<string, string> = {
  historical: 'past', current: 'present', predicted: 'prediction',
  future: 'prediction', recent: 'present',
  past: 'past', present: 'present', ongoing: 'ongoing', prediction: 'prediction',
};

function mapTemporal(t?: string): string {
  return t ? (TEMPORAL_MAP[t] || 'present') : 'present';
}

function generateUrlHash(url: string): string {
  return crypto.createHash('sha256').update(url).digest('hex').slice(0, 32);
}

// ============================================
// DOCUMENT GROUPS
// ============================================

interface DocGroup {
  name: string;
  query: string;
  files: string[];
  /** 'text' or 'ocr' base directory */
  baseDir: 'text' | 'ocr';
}

const DOCUMENT_GROUPS: DocGroup[] = [
  {
    name: 'DOJ Investigation Report',
    query: 'Jeffrey Epstein DOJ investigation report - key findings, failures of justice, and institutional accountability',
    files: [
      '1#Epstein DOJ Report - 2020 11 14 - DOJ full report.txt',
    ],
    baseDir: 'text',
  },
  {
    name: 'Ghislaine Maxwell Depositions & Indictment',
    query: 'Ghislaine Maxwell depositions, indictment, and role in Epstein trafficking network',
    files: [
      '2# Ghislaine Indictment & Deposition - 2015 09 21 - ghislaine dep.txt',
      '2# Ghislaine Indictment & Deposition - 2020 07 02 - Ghislaine Indictment.txt',
      '2# Ghislaine Indictment & Deposition - 2020 07 30 - bill clinton mentioned.txt',
      '2# Ghislaine Indictment & Deposition - 2019 07 03 - 416045095-Jeffrey-Epstein-Records-Unsealed.txt',
    ],
    baseDir: 'text',
  },
  {
    name: 'Les Wexner Connections',
    query: 'Les Wexner relationship with Jeffrey Epstein - financial ties, mob connections, Shapiro murder file, foundation report',
    files: [
      '4# Les Wexner assorted documents - 1991 06 06 - 00# Les Wexner Mob Ties Shapiro Murder File.txt',
      '4# Les Wexner assorted documents - 2020 02 24 - 448792139-Wexner-Foundation-Report-Following-Independent-Review.txt',
      '4# Les Wexner assorted documents - 2020 07 20 - 472133212-Wexner-Letter-to-Dershowitz.txt',
      '4# Les Wexner assorted documents - 2020 07 28 - 472133211-Wexner-Letter-to-Judge-Preska.txt',
    ],
    baseDir: 'text',
  },
  {
    name: 'FBI Investigation Report',
    query: 'Jeffrey Epstein FBI investigation - evidence, interviews, and intelligence gathered',
    files: [
      '6# Epstein FBI report - 2017 05 25 - Epstein FBI_merged232.txt',
    ],
    baseDir: 'text',
  },
  {
    name: 'Flight Logs & Travel Records',
    query: 'Jeffrey Epstein flight logs - passengers, destinations, frequency patterns, notable individuals',
    files: [
      '7# Epstein Flight Logs(Clinton Lied) - 2019 06 06 - 01# Epstein Flight Logs.txt',
    ],
    baseDir: 'text',
  },
  {
    name: 'Financial Assets & Property',
    query: 'Jeffrey Epstein financial assets, property holdings, and wealth sources',
    files: [
      '8# Epstein assets - 2019 07 12 - 0000# Epstein assets.txt',
      "Epstein's Assets (Financial).txt",
    ],
    baseDir: 'text',
  },
  {
    name: 'Victim Lawsuits - Jane Doe & Virginia Roberts Giuffre',
    query: 'Jeffrey Epstein victim lawsuits - Jane Doe cases, Virginia Roberts Giuffre civil actions, sex trafficking claims',
    files: [
      '9# Epstein and related persons lawsuits(Trump included - 1# Jane Doe vs Epstein 2008.txt',
      '9# Epstein and related persons lawsuits(Trump included - 7# Jane Doe vs Epstein 2018.txt',
      '9# Epstein and related persons lawsuits(Trump included - 16# Virginia Roberts Guiffre 2019.txt',
      '9# Epstein and related persons lawsuits(Trump included - 8# giuffre-v-maxwell 2018.txt',
      '9# Epstein and related persons lawsuits(Trump included - 10# Giuffre-v.-Dershowitz 2019.txt',
      '9# Epstein and related persons lawsuits(Trump included - 15# Affidavit-of-Maria-Farmer 2019.txt',
    ],
    baseDir: 'text',
  },
  {
    name: 'Political & Media Lawsuits',
    query: 'Epstein-related political lawsuits - Trump allegations, Cernovich lawsuit, Miami Herald FOIA, government accountability',
    files: [
      '9# Epstein and related persons lawsuits(Trump included - 4# Jane Doe vs Trump & Epstein 2016.txt',
      '9# Epstein and related persons lawsuits(Trump included - 5# Katie Johnson vs Trump 2016.txt',
      '9# Epstein and related persons lawsuits(Trump included - 6# Cernovich-Lawsuit-Epstein 2017.txt',
      '9# Epstein and related persons lawsuits(Trump included - 12# Miami-Herald vs Epstein 2018.txt',
      '9# Epstein and related persons lawsuits(Trump included - 11# Doe 1 & 2vs. USA 2019.txt',
      '9# Epstein and related persons lawsuits(Trump included - 9# Araoz vs Epstein 2019.txt',
      '9# Epstein and related persons lawsuits(Trump included - 3# Edwards vs Epstein & Rothstein 2015.txt',
    ],
    baseDir: 'text',
  },
  {
    name: 'Epstein Depositions & Key Testimony',
    query: 'Jeffrey Epstein depositions - Edwards vs Epstein testimony, victim depositions, witness statements',
    files: [
      "12# Epstein deposition's - Edwards vs Epstein + attachments.txt",
    ],
    baseDir: 'text',
  },
  {
    name: 'Plea Deal & Bail Documents',
    query: 'Jeffrey Epstein plea deal 2008 and bail memo 2019 - legal maneuvering, prosecutorial failures, conditions',
    files: [
      '10# Epstein Plea Deal - Epstein Plea Deal 2008.txt',
      '14# Epstein Bail memo - U S v Jeffrey Epstein, Bail Memo 2019 Arrest.txt',
    ],
    baseDir: 'text',
  },
  {
    name: 'Alan Dershowitz Documents',
    query: 'Alan Dershowitz involvement with Epstein - rebuttal documents, correspondence with investigators',
    files: [
      '11# Alan Dershowits assorted documents - 2015 01 - Dershowitz Rebuttal.txt',
      '11# Alan Dershowits assorted documents - dersh letter to dectective.txt',
    ],
    baseDir: 'text',
  },
  {
    name: 'Black Book & Contact Network',
    query: "Jeffrey Epstein's black book - contact network, associates, relationship web",
    files: [
      "Jeffrey Epstein's Black Book (OCR).txt",
    ],
    baseDir: 'ocr',
  },
  {
    name: 'House Oversight Committee Documents (Part 1)',
    query: 'House Oversight Committee Epstein investigation documents - congressional findings, witness testimony, evidence submissions (batch 1)',
    files: [
      'House Oversight 001-OCR.txt',
      'House Oversight 002-OCR.txt',
      'House Oversight 003-OCR.txt',
      'House Oversight 004-OCR.txt',
    ],
    baseDir: 'ocr',
  },
  {
    name: 'House Oversight Committee Documents (Part 2)',
    query: 'House Oversight Committee Epstein investigation - additional evidence, correspondence, institutional failures (batch 2)',
    files: [
      'House Oversight 005-OCR.txt',
      'House Oversight 006-OCR.txt',
      'House Oversight 007-OCR.txt',
      'House Oversight 008-OCR.txt',
    ],
    baseDir: 'ocr',
  },
  {
    name: 'House Oversight Committee Documents (Part 3)',
    query: 'House Oversight Committee Epstein investigation - final batch of congressional oversight documents (batch 3)',
    files: [
      'House Oversight 009-OCR.txt',
      'House Oversight 010-OCR.txt',
      'House Oversight 011-OCR.txt',
      'House Oversight 012-OCR.txt',
    ],
    baseDir: 'ocr',
  },
  {
    name: 'Virginia Giuffre Depositions & Exhibits',
    query: 'Virginia Giuffre deposition exhibits - testimony details, corroborating evidence, abuse documentation',
    files: [
      'Virgina Gieuffre Deposition exhbit-6 (ocr).txt',
      'Virigina Giueffre Deposition exhibit-1 (OCR).txt',
    ],
    baseDir: 'ocr',
  },
  {
    name: 'Katie Johnson Testimony',
    query: 'Katie Johnson testimony against Trump and Epstein - witness statements, timeline of events',
    files: [
      'katie-johnson-testimony-2016-Nov-5.txt',
      'Katie Johnson Testiomony Summary.rtf',
    ],
    baseDir: 'ocr',
  },
  {
    name: 'Epstein Network & Timeline Intelligence',
    query: 'Jeffrey Epstein network connections, case timeline, intelligence leads, and incriminating evidence summary',
    files: [
      'Epstein connections and leads.txt',
      'Epstein case timeline.txt',
      'EPSTEIN_INCRIMINATING_DOCUMENT.rtf',
      'Email Gmax Epstein.txt',
      'm3#Epstein Notes - 416214831-Jeff-Epstein-Notes-pdf.txt',
      'Evidence List (OCR).txt',
      'Birthday Book The First Fifty Years.txt',
    ],
    baseDir: 'text',
  },
  {
    name: 'DOJ Audio Transcript & Trafficking Indictment',
    query: 'DOJ audio transcript summary and sex trafficking indictment - federal investigation details',
    files: [
      'DOJ-OGR-00030343-mp3-transcript-summary.txt',
      'trafficking-indictment.txt',
      'gov.uscourts.flsd.317867.341.2.txt',
    ],
    baseDir: 'text',
  },
  {
    name: 'Epstein Court Records (OCR)',
    query: 'Jeffrey Epstein court records - unsealed documents, judicial proceedings, evidence submissions',
    files: [
      'jeffery_epstein_records_4_2 (OCR).txt',
    ],
    baseDir: 'ocr',
  },
];

// ============================================
// EXTRACTION PROMPT TEMPLATE
// ============================================

function buildExtractionPrompt(groupName: string, query: string, documentText: string, chunkInfo?: string): string {
  const chunkNote = chunkInfo ? `\n**Note:** This is ${chunkInfo}. Extract all findings from this portion.\n` : '';

  return `# Investigative Document Analysis: ${groupName}

**Research Query:** ${query}
**Template:** investigative
${chunkNote}
---

## Your Task

You are an expert investigative analyst. When the user says "analyze", analyze the following primary source document(s) and extract structured investigative findings. This is a document analysis task - you are extracting intelligence from provided text, NOT conducting web searches.

DO NOT use any tools. DO NOT search the web. Simply analyze the document text provided below and extract findings.
RESPOND WITH ONLY THE JSON OUTPUT - no explanations, no markdown, just the raw JSON object.

---

## Finding Types to Extract

For each finding, assign one of these types:

**actor** - People, organizations, entities involved. Include: name, role, affiliations, significance, aliases.
Schema: {"name": "...", "role": "...", "affiliations": [...], "significance": "...", "aliases": [...]}

**event** - Key incidents, actions, decisions. Include: date, location, participants, outcome, causation.
Schema: {"date": "...", "location": "...", "participants": [...], "outcome": "...", "causation": "..."}

**relationship** - Connections between actors. Types: personal, professional, political, criminal. Include evidence strength.
Schema: {"actor_a": "...", "actor_b": "...", "relationship_type": "...", "evidence_strength": "strong/moderate/weak"}

**financial** - ANY money movement: payments, gifts, loans, settlements, property, investments, donations. Extract ALL amounts.
Schema: {"amount": 0, "currency": "USD", "payer": "...", "payee": "...", "transaction_date": "...", "transaction_type": "...", "purpose": "..."}

**evidence** - Documents, statements, data points. Include: type, source, significance, verification status.
Schema: {"evidence_type": "document/statement/data", "source": "...", "significance": "...", "verified": true}

**pattern** - Recurring behaviors, methods, structures. Include: description, frequency, participants.
Schema: {"description": "...", "frequency": "...", "participants": [...], "time_span": "..."}

**gap** - Missing information, unanswered questions. What we don't know and why it matters.
Schema: {"question": "...", "importance": "high/medium/low", "suggested_followup": [...]}

**narrative_frame** - How the story is framed. Dominant narrative, language patterns, what is emphasized vs minimized.
Schema: {"dominant_frame": "...", "framing_techniques": [...], "language_patterns": [...], "emphasized": [...], "minimized": [...]}

**network_inference** - Implied relationships not explicitly documented. Board seats, funding connections, social ties.
Schema: {"actor_a": "...", "actor_b": "...", "connection_type": "...", "intermediaries": [...], "strength": "strong/moderate/weak"}

**incentive_alignment** - Who benefits from claims or narratives being believed. Conflicts of interest.
Schema: {"beneficiaries": [...], "incentive_type": "financial/career/political/reputational", "conflicts_of_interest": [...], "cui_bono": "..."}

---

## Extraction Guidelines

CRITICAL: The "analysis" field must provide SUBSTANTIVE reasoning:
- BAD: "This is an important financial transaction."
- GOOD: "This payment pattern suggests a quid pro quo arrangement because the timing coincides with the policy change."

IMPORTANT:
- Prioritize extracting ALL financial transactions with specific dollar amounts
- Note corroboration status for key claims
- Flag connections that warrant further investigation
- Include dates whenever mentioned in the documents
- For each finding, cite the specific document section it comes from

---

## Expert Perspectives to Generate

After extracting findings, provide analysis from these investigative perspectives:

1. **Forensic Financial Analyst** - Follow the money. Trace financial flows, unusual transactions, shell structures.
2. **Power Network Analyst** - Map relationships, influence, access patterns, gatekeepers.
3. **Legal/Liability Expert** - Identify legal exposure, prosecutorial decisions, institutional failures.
4. **Intelligence Analyst** - Pattern recognition, operational security indicators, network analysis.

---

## Output Format

Return a JSON object with this structure:

\`\`\`json
{
  "query": "${query}",
  "template": "investigative",
  "status": "completed",
  "findings": [
    {
      "finding_type": "actor|event|relationship|financial|evidence|pattern|gap|narrative_frame|network_inference|incentive_alignment",
      "content": "Detailed description of the finding",
      "summary": "One-line summary",
      "analysis": "Expert analytical commentary (2-4 sentences) explaining significance",
      "confidence_score": 0.0-1.0,
      "temporal_context": "past|present|ongoing",
      "extracted_data": { ... },
      "supporting_sources": ["document-reference"]
    }
  ],
  "sources": [
    {
      "url": "archive://epstein-archive/data/text/filename.txt",
      "title": "Document title",
      "domain": "epstein-archive",
      "credibility_score": 0.9,
      "credibility_label": "high"
    }
  ],
  "perspectives": [
    {
      "perspective_type": "forensic_financial|power_network|legal_liability|intelligence_analyst",
      "analysis_text": "Expert analysis from this perspective",
      "key_insights": ["insight1", "insight2"],
      "recommendations": ["recommendation1"],
      "warnings": ["warning1"]
    }
  ],
  "contradictions": [],
  "knowledge_gaps": [
    {
      "gap_type": "evidence|actor|temporal",
      "description": "What information is missing",
      "priority": "high|medium|low",
      "suggested_queries": ["follow-up query"]
    }
  ],
  "meta_analysis": {
    "cross_cutting_patterns": [
      {"pattern": "...", "significance": "...", "confidence": 0.8}
    ],
    "synthesis_summary": "2-3 paragraph synthesis of key findings"
  }
}
\`\`\`

Extract as many findings as the document supports. Be thorough - extract 15-50+ findings per substantial document.

---

## DOCUMENT TEXT

${documentText}
`;
}

// ============================================
// JSON SCHEMA FOR STRUCTURED OUTPUT
// ============================================

function getJsonSchema(): object {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    properties: {
      query: { type: 'string' },
      template: { type: 'string' },
      status: { type: 'string', enum: ['completed', 'partial', 'failed'] },
      findings: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            finding_type: { type: 'string' },
            content: { type: 'string' },
            summary: { type: 'string' },
            analysis: { type: 'string' },
            confidence_score: { type: 'number', minimum: 0, maximum: 1 },
            temporal_context: { type: 'string' },
            extracted_data: { type: 'object', additionalProperties: true },
            supporting_sources: { type: 'array', items: { type: 'string' } },
          },
          required: ['finding_type', 'content', 'confidence_score'],
        },
      },
      sources: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            url: { type: 'string' },
            title: { type: 'string' },
            domain: { type: 'string' },
            credibility_score: { type: 'number' },
            credibility_label: { type: 'string', enum: ['high', 'medium', 'low'] },
          },
          required: ['url'],
        },
      },
      perspectives: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            perspective_type: { type: 'string' },
            analysis_text: { type: 'string' },
            key_insights: { type: 'array', items: { type: 'string' } },
            recommendations: { type: 'array', items: { type: 'string' } },
            warnings: { type: 'array', items: { type: 'string' } },
          },
          required: ['perspective_type', 'analysis_text'],
        },
      },
      contradictions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            claim_1: { type: 'string' },
            claim_2: { type: 'string' },
            significance: { type: 'string' },
          },
          required: ['claim_1', 'claim_2'],
        },
      },
      knowledge_gaps: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            gap_type: { type: 'string' },
            description: { type: 'string' },
            priority: { type: 'string', enum: ['high', 'medium', 'low'] },
            suggested_queries: { type: 'array', items: { type: 'string' } },
          },
          required: ['gap_type', 'description', 'priority'],
        },
      },
      meta_analysis: {
        type: 'object',
        properties: {
          cross_cutting_patterns: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                pattern: { type: 'string' },
                significance: { type: 'string' },
                confidence: { type: 'number', minimum: 0, maximum: 1 },
              },
              required: ['pattern', 'significance'],
            },
          },
          synthesis_summary: { type: 'string' },
        },
      },
    },
    required: ['query', 'template', 'status', 'findings', 'sources'],
  };
}

// ============================================
// CLAUDE CLI EXECUTION
// ============================================

interface ClaudeResult {
  success: boolean;
  output?: Record<string, unknown>;
  error?: string;
  rawOutput?: string;
}

async function runClaude(promptPath: string): Promise<ClaudeResult> {
  return new Promise((resolve) => {
    // Use single-word prompt after -p to avoid shell quoting issues
    // All real instructions are in the system prompt file
    const args = [
      '-p', 'analyze',
      '--output-format', 'json',
      '--max-turns', '3',
      '--system-prompt-file', promptPath,
    ];

    console.log(`  [Claude] Executing analysis...`);

    const child = spawn('claude', args, {
      shell: true,
      timeout: 600_000,
    });

    const chunks: Buffer[] = [];
    let stderr = '';

    child.stdout?.on('data', (data: Buffer) => {
      chunks.push(data);
    });

    child.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    child.on('close', (code: number | null) => {
      const stdout = Buffer.concat(chunks).toString('utf-8');

      if (code !== 0 && !stdout) {
        resolve({
          success: false,
          error: stderr || `Process exited with code ${code}`,
          rawOutput: stderr.slice(0, 2000),
        });
        return;
      }

      try {
        const response = JSON.parse(stdout);

        if (response.is_error) {
          resolve({
            success: false,
            error: `Claude error: ${response.subtype || 'unknown'} - ${(response.result || '').slice(0, 200)}`,
          });
          return;
        }

        // structured_output is present when --json-schema is used
        if (response.structured_output) {
          resolve({ success: true, output: response.structured_output });
          return;
        }

        // Parse from result string (Claude returns JSON in markdown code blocks)
        const resultStr = response.result || '';
        const jsonMatch = resultStr.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          resolve({ success: true, output: JSON.parse(jsonMatch[1]) });
          return;
        }

        // Try direct JSON parse of result
        if (resultStr.trim().startsWith('{')) {
          resolve({ success: true, output: JSON.parse(resultStr) });
          return;
        }

        resolve({
          success: false,
          error: 'No structured output found in response',
          rawOutput: resultStr.slice(0, 2000),
        });
      } catch (parseError) {
        resolve({
          success: false,
          error: `JSON parse failed: ${(parseError as Error).message}`,
          rawOutput: stdout?.slice(0, 1000),
        });
      }
    });

    child.on('error', (err: Error) => {
      resolve({ success: false, error: err.message });
    });
  });
}

// ============================================
// SUPABASE PERSISTENCE
// ============================================

async function createSession(query: string, groupName: string): Promise<string> {
  const sessionId = uuid();

  const { error } = await supabase.from('research_sessions').insert({
    id: sessionId,
    workspace_id: WORKSPACE_ID,
    title: `Epstein Archive: ${groupName}`,
    query,
    template_type: TEMPLATE_ID,
    parameters: {
      granularity: 'deep',
      max_searches: 0,
      source: 'archive-ingest',
      archive_group: groupName,
    },
    status: 'analyzing',
    thematic_group: THEMATIC_GROUP,
    created_at: new Date().toISOString(),
  });

  if (error) throw new Error(`Failed to create session: ${error.message}`);
  return sessionId;
}

async function saveSources(
  sessionId: string,
  sources: Array<{ url: string; title?: string; domain?: string; credibility_score?: number; credibility_label?: string }>
): Promise<Map<string, string>> {
  const urlToId = new Map<string, string>();
  if (!sources?.length) return urlToId;

  const records = sources.map((s) => {
    const id = uuid();
    const url = s.url || '';
    urlToId.set(url, id);
    return {
      id,
      session_id: sessionId,
      url,
      url_hash: generateUrlHash(url),
      title: s.title || '',
      domain: s.domain || 'epstein-archive',
      source_type: 'government' as const,
      credibility_score: s.credibility_score ?? 0.85,
      credibility_factors: s.credibility_label ? { label: s.credibility_label } : null,
      is_global: false,
      discovered_at: new Date().toISOString(),
    };
  });

  const { error } = await supabase.from('research_sources').insert(records);
  if (error) throw new Error(`Failed to save sources: ${error.message}`);
  return urlToId;
}

async function saveFindings(
  sessionId: string,
  findings: Array<Record<string, unknown>>,
  sourceUrlToId: Map<string, string>
): Promise<number> {
  if (!findings?.length) return 0;

  const records = findings.map((f) => {
    const { schemaType, originalType } = mapFindingType(f.finding_type as string);
    const supportingSources = ((f.supporting_sources as string[]) || [])
      .map((url) => sourceUrlToId.get(url))
      .filter((id): id is string => Boolean(id));

    return {
      id: uuid(),
      session_id: sessionId,
      finding_type: schemaType,
      content: f.content as string,
      summary: (f.summary as string) ?? null,
      confidence_score: f.confidence_score as number,
      temporal_context: mapTemporal(f.temporal_context as string | undefined),
      extracted_data: {
        ...(f.extracted_data as Record<string, unknown> || {}),
        original_finding_type: originalType,
        analysis: f.analysis || null,
      },
      supporting_sources: supportingSources,
      related_findings: [],
      contradicts: [],
      is_promoted: false,
      created_at: new Date().toISOString(),
    };
  });

  // Insert in batches of 50 to avoid payload limits
  const BATCH_SIZE = 50;
  let inserted = 0;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('research_findings').insert(batch);
    if (error) throw new Error(`Failed to save findings batch ${i}: ${error.message}`);
    inserted += batch.length;
  }
  return inserted;
}

async function savePerspectives(
  sessionId: string,
  perspectives: Array<Record<string, unknown>>
): Promise<number> {
  if (!perspectives?.length) return 0;

  const records = perspectives.map((p) => {
    const { schemaType, originalType } = mapPerspectiveType(p.perspective_type as string);
    return {
      id: uuid(),
      session_id: sessionId,
      perspective_type: schemaType,
      analysis_text: p.analysis_text as string,
      key_insights: (p.key_insights as string[]) || [],
      recommendations: (p.recommendations as string[]) || [],
      warnings: (p.warnings as string[]) || [],
      confidence: 0.7,
      findings_analyzed: [],
      sources_cited: [],
      specialized_data: { original_perspective_type: originalType },
      created_at: new Date().toISOString(),
    };
  });

  const { error } = await supabase.from('research_perspectives').insert(records);
  if (error) throw new Error(`Failed to save perspectives: ${error.message}`);
  return records.length;
}

async function completeSession(sessionId: string, findingsCount: number, sourcesCount: number): Promise<void> {
  const { error } = await supabase.from('research_sessions').update({
    status: 'completed',
    completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    claim_count: findingsCount,
    source_count: sourcesCount,
  }).eq('id', sessionId);

  if (error) throw new Error(`Failed to complete session: ${error.message}`);
}

async function failSession(sessionId: string, errorMsg: string): Promise<void> {
  await supabase.from('research_sessions').update({
    status: 'failed',
    updated_at: new Date().toISOString(),
    parameters: { error: errorMsg },
  }).eq('id', sessionId);
}

// ============================================
// DOCUMENT READING & CHUNKING
// ============================================

function readDocuments(group: DocGroup): { text: string; filesSummary: string } {
  const baseDir = group.baseDir === 'ocr' ? OCR_DIR : TEXT_DIR;
  const parts: string[] = [];
  const loaded: string[] = [];

  for (const file of group.files) {
    const filePath = path.join(baseDir, file);
    // Also check the other directory if not found
    const altPath = group.baseDir === 'ocr'
      ? path.join(TEXT_DIR, file)
      : path.join(OCR_DIR, file);

    let content = '';
    if (fs.existsSync(filePath)) {
      content = fs.readFileSync(filePath, 'utf-8');
    } else if (fs.existsSync(altPath)) {
      content = fs.readFileSync(altPath, 'utf-8');
    } else {
      console.warn(`  [WARN] File not found: ${file}`);
      continue;
    }

    parts.push(`\n\n=== DOCUMENT: ${file} ===\n\n${content}`);
    loaded.push(file);
  }

  return {
    text: parts.join(''),
    filesSummary: loaded.join(', '),
  };
}

function chunkText(text: string): string[] {
  if (text.length <= MAX_CHUNK_CHARS) return [text];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + MAX_CHUNK_CHARS, text.length);

    // Try to break at a paragraph boundary
    if (end < text.length) {
      const lastParagraph = text.lastIndexOf('\n\n', end);
      if (lastParagraph > start + MAX_CHUNK_CHARS * 0.5) {
        end = lastParagraph;
      }
    }

    chunks.push(text.slice(start, end));
    start = end;
  }

  return chunks;
}

// ============================================
// MAIN PROCESSING
// ============================================

async function processGroup(group: DocGroup, index: number): Promise<{
  sessionId: string;
  findings: number;
  sources: number;
  perspectives: number;
  chunks: number;
  duration: number;
}> {
  const startTime = Date.now();
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[${index + 1}/${DOCUMENT_GROUPS.length}] ${group.name}`);
  console.log(`${'='.repeat(60)}`);

  // 1. Read documents
  const { text, filesSummary } = readDocuments(group);
  if (!text.trim()) {
    throw new Error('No document text loaded');
  }
  console.log(`  [Docs] Loaded: ${filesSummary}`);
  console.log(`  [Docs] Total size: ${(text.length / 1024).toFixed(0)}KB`);

  // 2. Create session
  const sessionId = await createSession(group.query, group.name);
  console.log(`  [Session] Created: ${sessionId}`);

  // 3. Chunk if needed
  const chunks = chunkText(text);
  console.log(`  [Chunks] ${chunks.length} chunk(s)`);

  // 4. Process each chunk
  let allFindings: Array<Record<string, unknown>> = [];
  let allSources: Array<Record<string, unknown>> = [];
  let allPerspectives: Array<Record<string, unknown>> = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunkInfo = chunks.length > 1
      ? `chunk ${i + 1} of ${chunks.length}`
      : undefined;

    if (chunkInfo) {
      console.log(`  [Chunk ${i + 1}/${chunks.length}] Processing...`);
    }

    // Build prompt with document text
    const prompt = buildExtractionPrompt(group.name, group.query, chunks[i], chunkInfo);

    // Write prompt to temp file
    const promptDir = path.join(process.cwd(), '.prompts', 'archive');
    if (!fs.existsSync(promptDir)) {
      fs.mkdirSync(promptDir, { recursive: true });
    }
    const promptFile = path.join(promptDir, `${group.name.replace(/[^a-zA-Z0-9]/g, '_')}_chunk${i}.md`);
    fs.writeFileSync(promptFile, prompt, 'utf-8');

    // Run Claude
    const result = await runClaude(promptFile);

    if (!result.success) {
      console.error(`  [ERROR] Claude failed: ${result.error}`);
      if (chunks.length > 1) {
        console.log(`  [SKIP] Skipping chunk ${i + 1}, continuing...`);
        continue;
      }
      throw new Error(result.error || 'Claude execution failed');
    }

    const output = result.output!;
    const findings = (output.findings as Array<Record<string, unknown>>) || [];
    const sources = (output.sources as Array<Record<string, unknown>>) || [];
    const perspectives = (output.perspectives as Array<Record<string, unknown>>) || [];

    console.log(`  [Result] ${findings.length} findings, ${sources.length} sources, ${perspectives.length} perspectives`);

    allFindings.push(...findings);
    allSources.push(...sources);
    // Only take perspectives from first chunk (or merge unique types)
    if (i === 0) {
      allPerspectives.push(...perspectives);
    }

    // Clean up prompt file
    try { fs.unlinkSync(promptFile); } catch { /* ignore */ }
  }

  // 5. Ensure source entries for all document files
  const existingUrls = new Set(allSources.map((s) => s.url as string));
  for (const file of group.files) {
    const url = `archive://epstein-archive/data/${group.baseDir === 'ocr' ? 'ocr_clean/text' : 'text'}/${file}`;
    if (!existingUrls.has(url)) {
      allSources.push({
        url,
        title: file.replace(/\.txt$|\.rtf$/, ''),
        domain: 'epstein-archive',
        credibility_score: 0.9,
        credibility_label: 'high',
      });
    }
  }

  // 6. Persist to Supabase
  console.log(`  [DB] Saving ${allSources.length} sources...`);
  const sourceUrlToId = await saveSources(sessionId, allSources as Array<{
    url: string; title?: string; domain?: string; credibility_score?: number; credibility_label?: string;
  }>);

  console.log(`  [DB] Saving ${allFindings.length} findings...`);
  const savedFindings = await saveFindings(sessionId, allFindings, sourceUrlToId);

  console.log(`  [DB] Saving ${allPerspectives.length} perspectives...`);
  const savedPerspectives = await savePerspectives(sessionId, allPerspectives);

  console.log(`  [DB] Completing session...`);
  await completeSession(sessionId, savedFindings, allSources.length);

  const duration = (Date.now() - startTime) / 1000;
  console.log(`  [DONE] ${group.name} completed in ${duration.toFixed(1)}s`);

  return {
    sessionId,
    findings: savedFindings,
    sources: allSources.length,
    perspectives: savedPerspectives,
    chunks: chunks.length,
    duration,
  };
}

// ============================================
// CLI ENTRY POINT
// ============================================

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const listOnly = args.includes('--list');
  const skipIndex = args.indexOf('--skip');
  const limitIndex = args.indexOf('--limit');
  const groupIndex = args.indexOf('--group');

  const skip = skipIndex >= 0 ? parseInt(args[skipIndex + 1], 10) : 0;
  const limit = limitIndex >= 0 ? parseInt(args[limitIndex + 1], 10) : Infinity;
  const targetGroup = groupIndex >= 0 ? args[groupIndex + 1] : null;

  console.log('');
  console.log('='.repeat(60));
  console.log('EPSTEIN ARCHIVE INGESTION');
  console.log('='.repeat(60));
  console.log(`Archive:    ${ARCHIVE_BASE}`);
  console.log(`Groups:     ${DOCUMENT_GROUPS.length}`);
  console.log(`Template:   ${TEMPLATE_ID}`);
  console.log(`Thematic:   ${THEMATIC_GROUP}`);
  console.log(`Mode:       ${isDryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log('='.repeat(60));

  // Filter groups
  let groups = DOCUMENT_GROUPS;
  if (targetGroup) {
    const idx = parseInt(targetGroup, 10);
    if (!isNaN(idx)) {
      groups = [DOCUMENT_GROUPS[idx]];
    } else {
      groups = DOCUMENT_GROUPS.filter((g) =>
        g.name.toLowerCase().includes(targetGroup.toLowerCase())
      );
    }
    if (groups.length === 0) {
      console.error(`No groups matching "${targetGroup}"`);
      process.exit(1);
    }
  }

  groups = groups.slice(skip, skip + limit);

  // List mode
  if (listOnly) {
    console.log('\nDocument Groups:\n');
    DOCUMENT_GROUPS.forEach((g, i) => {
      const baseDir = g.baseDir === 'ocr' ? OCR_DIR : TEXT_DIR;
      let totalSize = 0;
      for (const file of g.files) {
        const fp = path.join(baseDir, file);
        const altFp = g.baseDir === 'ocr' ? path.join(TEXT_DIR, file) : path.join(OCR_DIR, file);
        try {
          totalSize += fs.statSync(fs.existsSync(fp) ? fp : altFp).size;
        } catch { /* ignore */ }
      }
      const chunks = Math.ceil(totalSize / MAX_CHUNK_CHARS) || 1;
      console.log(`  [${i}] ${g.name}`);
      console.log(`      Files: ${g.files.length}, Size: ${(totalSize / 1024).toFixed(0)}KB, Chunks: ${chunks}`);
      console.log(`      Query: ${g.query.slice(0, 80)}...`);
    });
    return;
  }

  // Dry run mode
  if (isDryRun) {
    console.log('\nDRY RUN - Documents that would be processed:\n');
    for (const group of groups) {
      const { text } = readDocuments(group);
      const chunks = chunkText(text);
      console.log(`  ${group.name}`);
      console.log(`    Size: ${(text.length / 1024).toFixed(0)}KB, Chunks: ${chunks.length}`);
      console.log(`    Files: ${group.files.length}`);
      group.files.forEach((f) => console.log(`      - ${f}`));
    }
    console.log(`\nTotal groups: ${groups.length}`);
    return;
  }

  // Check for already-completed groups (resume support)
  const { data: existingSessions } = await supabase
    .from('research_sessions')
    .select('title, id, claim_count')
    .eq('thematic_group', THEMATIC_GROUP)
    .eq('workspace_id', WORKSPACE_ID)
    .eq('status', 'completed');

  const completedGroups = new Set(
    (existingSessions || [])
      .filter((s: { claim_count: number }) => s.claim_count > 0)
      .map((s: { title: string }) => s.title.replace('Epstein Archive: ', ''))
  );

  if (completedGroups.size > 0) {
    console.log(`\nSkipping ${completedGroups.size} already-completed group(s):`);
    completedGroups.forEach((g) => console.log(`  - ${g}`));
  }

  groups = groups.filter((g) => !completedGroups.has(g.name));
  console.log(`\nProcessing ${groups.length} remaining group(s)...\n`);

  // Live processing
  const results: Array<{
    group: string;
    sessionId: string;
    findings: number;
    sources: number;
    duration: number;
    error?: string;
  }> = [];

  for (let i = 0; i < groups.length; i++) {
    try {
      const result = await processGroup(groups[i], skip + i);
      results.push({
        group: groups[i].name,
        sessionId: result.sessionId,
        findings: result.findings,
        sources: result.sources,
        duration: result.duration,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`  [FAILED] ${groups[i].name}: ${errorMsg}`);
      results.push({
        group: groups[i].name,
        sessionId: '',
        findings: 0,
        sources: 0,
        duration: 0,
        error: errorMsg,
      });
    }

    // Brief pause between groups to avoid rate limits
    if (i < groups.length - 1) {
      console.log('\n  [Wait] 5s pause before next group...');
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  // Summary
  console.log('\n');
  console.log('='.repeat(60));
  console.log('INGESTION SUMMARY');
  console.log('='.repeat(60));

  const successful = results.filter((r) => !r.error);
  const failed = results.filter((r) => r.error);
  const totalFindings = successful.reduce((sum, r) => sum + r.findings, 0);
  const totalSources = successful.reduce((sum, r) => sum + r.sources, 0);
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`Processed:  ${successful.length}/${results.length} groups`);
  console.log(`Findings:   ${totalFindings}`);
  console.log(`Sources:    ${totalSources}`);
  console.log(`Duration:   ${(totalDuration / 60).toFixed(1)} minutes`);

  if (failed.length > 0) {
    console.log(`\nFailed groups:`);
    failed.forEach((r) => console.log(`  - ${r.group}: ${r.error}`));
  }

  console.log('\nSession IDs:');
  successful.forEach((r) => {
    console.log(`  ${r.group}: ${r.sessionId} (${r.findings} findings)`);
  });
}

main().catch((err) => {
  console.error('\nFatal error:', err);
  process.exit(1);
});
