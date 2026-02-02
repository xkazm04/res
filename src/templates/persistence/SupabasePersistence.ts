/**
 * SupabasePersistence Service
 *
 * Persists research results from Claude Code CLI to Supabase database.
 * Follows the same schema patterns as the Python actor system.
 */

import { supabaseServer } from '../../lib/supabase-server';
import { v4 as uuid } from 'uuid';
import * as crypto from 'crypto';
import {
  mapFindingType,
  mapPerspectiveType,
  mapTemporalContext,
} from './typeMapping';
import type { ActorOutput } from '../types';

// ============================================
// TYPES
// ============================================

export interface PersistenceOptions {
  /** Workspace ID for multi-tenant support */
  workspaceId?: string;
}

export interface CreateSessionParams {
  /** Research query */
  query: string;
  /** Template type (e.g., 'tech_market', 'financial') */
  templateType: string;
  /** Research granularity ('quick', 'standard', 'deep') */
  granularity: string;
  /** Maximum number of searches allowed */
  maxSearches: number;
  /** Optional thematic group for organizing related sessions */
  thematicGroup?: string;
}

export interface CreateSessionResult {
  /** Generated session ID */
  sessionId: string;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Generates a consistent hash for URL deduplication.
 * Matches Python implementation in serverless/src/clients/supabase.py
 */
function generateUrlHash(url: string): string {
  return crypto.createHash('sha256').update(url).digest('hex').slice(0, 32);
}

// ============================================
// MAIN CLASS
// ============================================

/**
 * Supabase persistence service for research results.
 *
 * Usage:
 * ```typescript
 * const persistence = new SupabasePersistence();
 *
 * // Create session at start
 * const { sessionId } = await persistence.createSession({
 *   query: 'AI framework comparison',
 *   templateType: 'tech_market',
 *   granularity: 'standard',
 *   maxSearches: 8,
 * });
 *
 * // Persist results when complete
 * await persistence.persistResearch(sessionId, actorOutput);
 * ```
 */
export class SupabasePersistence {
  private workspaceId: string;

  constructor(options: PersistenceOptions = {}) {
    this.workspaceId = options.workspaceId || 'claude-code';
  }

  // ============================================
  // SESSION MANAGEMENT
  // ============================================

  /**
   * Creates a new research session in the database.
   * Status is set to 'started' initially.
   */
  async createSession(params: CreateSessionParams): Promise<CreateSessionResult> {
    const sessionId = uuid();

    const { error } = await supabaseServer.from('research_sessions').insert({
      id: sessionId,
      workspace_id: this.workspaceId,
      title: `Research: ${params.query.slice(0, 50)}${params.query.length > 50 ? '...' : ''}`,
      query: params.query,
      template_type: params.templateType,
      parameters: {
        granularity: params.granularity,
        max_searches: params.maxSearches,
      },
      status: 'started',
      thematic_group: params.thematicGroup || null,
      created_at: new Date().toISOString(),
    });

    if (error) {
      throw new Error(`Failed to create session: ${error.message}`);
    }

    return { sessionId };
  }

  /**
   * Updates the status of a research session.
   */
  async updateStatus(sessionId: string, status: string): Promise<void> {
    const { error } = await supabaseServer
      .from('research_sessions')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (error) {
      throw new Error(`Failed to update session status: ${error.message}`);
    }
  }

  /**
   * Marks a session as completed with final counts.
   */
  async completeSession(
    sessionId: string,
    findingsCount: number,
    sourcesCount: number
  ): Promise<void> {
    const { error } = await supabaseServer
      .from('research_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        claim_count: findingsCount,
        source_count: sourcesCount,
      })
      .eq('id', sessionId);

    if (error) {
      throw new Error(`Failed to complete session: ${error.message}`);
    }
  }

  /**
   * Marks a session as failed with error information.
   */
  async failSession(sessionId: string, errorMessage: string): Promise<void> {
    // Get current parameters to merge with error
    const { data: current } = await supabaseServer
      .from('research_sessions')
      .select('parameters')
      .eq('id', sessionId)
      .limit(1)
      .single();

    const currentParams = current?.parameters || {};

    const { error } = await supabaseServer
      .from('research_sessions')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
        parameters: {
          ...currentParams,
          error: errorMessage,
        },
      })
      .eq('id', sessionId);

    if (error) {
      throw new Error(`Failed to mark session as failed: ${error.message}`);
    }
  }

  // ============================================
  // SOURCES
  // ============================================

  /**
   * Saves sources to database and returns URL -> UUID mapping.
   * The mapping is used to link findings to their supporting sources.
   */
  async saveSources(
    sessionId: string,
    sources: ActorOutput['sources']
  ): Promise<Map<string, string>> {
    const urlToId = new Map<string, string>();

    if (!sources?.length) {
      return urlToId;
    }

    const records = sources.map((source) => {
      const id = uuid();
      const url = source.url || '';
      urlToId.set(url, id);

      // Build credibility_factors JSONB from available data
      const credibilityFactors: Record<string, unknown> = {};
      if (source.credibility_label) {
        credibilityFactors.label = source.credibility_label;
      }
      if (source.credibility_score !== undefined) {
        credibilityFactors.score = source.credibility_score;
      }

      return {
        id,
        session_id: sessionId,
        url,
        url_hash: generateUrlHash(url),
        title: source.title || '',
        domain: source.domain || '',
        source_type: 'unknown' as const, // Schema requires valid type
        credibility_score: source.credibility_score ?? null,
        credibility_factors:
          Object.keys(credibilityFactors).length > 0 ? credibilityFactors : null,
        is_global: false,
        discovered_at: new Date().toISOString(),
      };
    });

    const { error } = await supabaseServer.from('research_sources').insert(records);

    if (error) {
      throw new Error(`Failed to save sources: ${error.message}`);
    }

    return urlToId;
  }

  // ============================================
  // FINDINGS
  // ============================================

  /**
   * Saves findings to database with type mapping and source linking.
   *
   * @param sessionId - Research session ID
   * @param findings - Findings from ActorOutput
   * @param sourceUrlToId - URL to UUID mapping from saveSources
   */
  async saveFindings(
    sessionId: string,
    findings: ActorOutput['findings'],
    sourceUrlToId: Map<string, string>
  ): Promise<void> {
    if (!findings?.length) {
      return;
    }

    const records = findings.map((finding) => {
      const { schemaType, originalType } = mapFindingType(finding.finding_type);

      // Map supporting source URLs to UUIDs
      const supportingSourceIds = (finding.supporting_sources || [])
        .map((url) => sourceUrlToId.get(url))
        .filter((id): id is string => Boolean(id));

      return {
        id: uuid(),
        session_id: sessionId,
        finding_type: schemaType,
        content: finding.content,
        summary: finding.summary ?? null,
        confidence_score: finding.confidence_score,
        temporal_context: mapTemporalContext(finding.temporal_context),
        extracted_data: {
          ...finding.extracted_data,
          original_finding_type: originalType,
        },
        supporting_sources: supportingSourceIds,
        related_findings: [],
        contradicts: [],
        is_promoted: false,
        created_at: new Date().toISOString(),
      };
    });

    const { error } = await supabaseServer.from('research_findings').insert(records);

    if (error) {
      throw new Error(`Failed to save findings: ${error.message}`);
    }
  }

  // ============================================
  // PERSPECTIVES
  // ============================================

  /**
   * Saves perspective analyses to database with type mapping.
   */
  async savePerspectives(
    sessionId: string,
    perspectives: ActorOutput['perspectives']
  ): Promise<void> {
    if (!perspectives?.length) {
      return;
    }

    const records = perspectives.map((perspective) => {
      const { schemaType, originalType } = mapPerspectiveType(
        perspective.perspective_type
      );

      return {
        id: uuid(),
        session_id: sessionId,
        perspective_type: schemaType,
        analysis_text: perspective.analysis_text,
        key_insights: perspective.key_insights || [],
        recommendations: perspective.recommendations || [],
        warnings: perspective.warnings || [],
        confidence: 0.5, // Default confidence
        findings_analyzed: [],
        sources_cited: [],
        specialized_data: {
          original_perspective_type: originalType,
        },
        created_at: new Date().toISOString(),
      };
    });

    const { error } = await supabaseServer
      .from('research_perspectives')
      .insert(records);

    if (error) {
      throw new Error(`Failed to save perspectives: ${error.message}`);
    }
  }

  // ============================================
  // HIGH-LEVEL API
  // ============================================

  /**
   * Persists complete ActorOutput to database.
   *
   * This is the main method to use after research completes.
   * It handles sources, findings, perspectives, and marks the session complete.
   *
   * @param sessionId - Research session ID (from createSession)
   * @param output - Complete ActorOutput from Claude Code CLI
   */
  async persistResearch(sessionId: string, output: ActorOutput): Promise<void> {
    try {
      // 1. Save sources first to get URL -> ID mapping
      const sourceUrlToId = await this.saveSources(sessionId, output.sources);

      // 2. Save findings with source links
      await this.saveFindings(sessionId, output.findings, sourceUrlToId);

      // 3. Save perspectives
      await this.savePerspectives(sessionId, output.perspectives);

      // 4. Complete session with counts
      await this.completeSession(
        sessionId,
        output.findings?.length || 0,
        output.sources?.length || 0
      );
    } catch (error) {
      // Mark session as failed if persistence fails
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.failSession(sessionId, errorMessage).catch(() => {
        // Ignore errors from failSession to prevent masking original error
      });
      throw error;
    }
  }
}
