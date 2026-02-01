/**
 * ActorOutput Schema
 *
 * Zod schema for validating research output from Claude Code CLI.
 * Designed to accept template-specific finding types from the Python actor
 * and map to Supabase schema for storage.
 *
 * TYPE MAPPING NOTES:
 * - finding_type: Uses flexible string to accept template-specific types
 *   (e.g., "tech_trend", "market_trend", "adoption_pattern", "financial_metric")
 * - These map to Supabase FindingType enum for storage via a mapping layer
 * - The mapping preserves template context in extracted_data while using canonical types
 *
 * SUPABASE MAPPING (for reference):
 * - tech_trend -> "pattern" (with extracted_data.original_type = "tech_trend")
 * - market_trend -> "pattern" (with extracted_data.original_type = "market_trend")
 * - adoption_pattern -> "pattern" (with extracted_data.original_type = "adoption_pattern")
 * - financial_metric -> "evidence" (with extracted_data.original_type = "financial_metric")
 * - prediction -> "claim" (with temporal_context = "predicted")
 * - red_flag -> "gap" (with extracted_data.original_type = "red_flag")
 */

import { z } from 'zod';

// ============================================
// SUB-SCHEMAS
// ============================================

/**
 * Finding schema - uses flexible string for finding_type.
 * Template-specific types: "tech_trend", "market_trend", "prediction", etc.
 */
const FindingSchema = z.object({
  /** Template-specific finding type (e.g., "tech_trend", "market_trend") */
  finding_type: z.string(),

  /** Main content of the finding */
  content: z.string(),

  /** Brief summary (optional) */
  summary: z.string().optional(),

  /** Expert analytical commentary (optional) */
  analysis: z.string().optional(),

  /** Confidence score from 0 to 1 */
  confidence_score: z.number().min(0).max(1),

  /** Temporal context: "current", "historical", "predicted" */
  temporal_context: z.string().optional(),

  /** Template-specific structured data */
  extracted_data: z.record(z.string(), z.unknown()).optional(),

  /** URLs of supporting sources */
  supporting_sources: z.array(z.string()).optional(),
});

/**
 * Source schema - aligns with ResearchSource interface.
 */
const SourceSchema = z.object({
  /** Source URL (required) */
  url: z.string(),

  /** Page title */
  title: z.string().optional(),

  /** Domain name */
  domain: z.string().optional(),

  /** Credibility score from 0 to 1 */
  credibility_score: z.number().optional(),

  /** Credibility label */
  credibility_label: z.enum(['high', 'medium', 'low']).optional(),
});

/**
 * Perspective schema - uses flexible string for perspective_type.
 * Template-specific types: "venture_capitalist", "senior_engineer", etc.
 */
const PerspectiveSchema = z.object({
  /** Template-specific perspective identifier */
  perspective_type: z.string(),

  /** Main analysis text */
  analysis_text: z.string(),

  /** Key insights extracted */
  key_insights: z.array(z.string()).optional(),

  /** Recommendations */
  recommendations: z.array(z.string()).optional(),

  /** Warnings and caveats */
  warnings: z.array(z.string()).optional(),
});

/**
 * Contradiction schema - aligns with ResearchContradiction interface.
 */
const ContradictionSchema = z.object({
  /** First conflicting claim */
  claim_1: z.string(),

  /** Second conflicting claim */
  claim_2: z.string(),

  /** Source of first claim */
  source_1: z.string().optional(),

  /** Source of second claim */
  source_2: z.string().optional(),

  /** Significance of the contradiction */
  significance: z.string().optional(),

  /** Hint for resolution */
  resolution_hint: z.string().optional(),
});

/**
 * Knowledge gap schema - aligns with ResearchGap interface.
 */
const KnowledgeGapSchema = z.object({
  /** Type of gap: "temporal", "actor", "topic", "evidence", "geographic" */
  gap_type: z.string(),

  /** Description of the gap */
  description: z.string(),

  /** Priority level */
  priority: z.enum(['high', 'medium', 'low']),

  /** Suggested queries to fill the gap */
  suggested_queries: z.array(z.string()).optional(),
});

// ============================================
// MAIN SCHEMA
// ============================================

/**
 * Main ActorOutput schema.
 * Validates the complete output from Claude Code research execution.
 */
export const ActorOutputSchema = z.object({
  /** Session ID (optional, may be assigned by caller) */
  session_id: z.string().optional(),

  /** Original research query */
  query: z.string(),

  /** Template used for research */
  template: z.string(),

  /** Execution status */
  status: z.enum(['completed', 'partial', 'failed']),

  /** Research findings */
  findings: z.array(FindingSchema),

  /** Sources discovered and used */
  sources: z.array(SourceSchema),

  /** Expert perspectives (optional) */
  perspectives: z.array(PerspectiveSchema).optional(),

  /** Detected contradictions (optional) */
  contradictions: z.array(ContradictionSchema).optional(),

  /** Identified knowledge gaps (optional) */
  knowledge_gaps: z.array(KnowledgeGapSchema).optional(),

  /** Search queries that were executed (optional) */
  search_queries_executed: z.array(z.string()).optional(),
});

// ============================================
// EXPORTED TYPES
// ============================================

/** Inferred TypeScript type from ActorOutputSchema */
export type ActorOutput = z.infer<typeof ActorOutputSchema>;

/** Finding type from schema */
export type ActorFinding = z.infer<typeof FindingSchema>;

/** Source type from schema */
export type ActorSource = z.infer<typeof SourceSchema>;

/** Perspective type from schema */
export type ActorPerspective = z.infer<typeof PerspectiveSchema>;

/** Contradiction type from schema */
export type ActorContradiction = z.infer<typeof ContradictionSchema>;

/** Knowledge gap type from schema */
export type ActorKnowledgeGap = z.infer<typeof KnowledgeGapSchema>;

// ============================================
// JSON SCHEMA EXPORT
// ============================================

/**
 * Get JSON Schema for ActorOutput.
 * Used with Claude CLI --json-schema flag for structured output.
 *
 * @returns JSON Schema object matching ActorOutputSchema
 */
export function getActorOutputJsonSchema(): object {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    properties: {
      session_id: { type: 'string' },
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
            source_1: { type: 'string' },
            source_2: { type: 'string' },
            significance: { type: 'string' },
            resolution_hint: { type: 'string' },
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
      search_queries_executed: {
        type: 'array',
        items: { type: 'string' },
      },
    },
    required: ['query', 'template', 'status', 'findings', 'sources'],
  };
}
