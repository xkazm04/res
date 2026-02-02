/**
 * ResearchOrchestrator
 *
 * Coordinates the full research flow with persistence:
 * 1. Creates session with 'started' status
 * 2. Builds prompt using TemplateBuilder
 * 3. Updates status to 'searching'
 * 4. Executes via ClaudeRunner
 * 5. Updates status to 'analyzing'
 * 6. Persists results via SupabasePersistence
 * 7. Completes session or fails with error
 */

import { TemplateBuilder } from './TemplateBuilder';
import { ClaudeRunner } from './ClaudeRunner';
import { SupabasePersistence } from '../persistence';
import { getTemplate } from '../configs';
import { GRANULARITY_CONFIGS } from '../types/granularity';
import type { ActorOutput } from '../types';
import type { Granularity } from '../types/granularity';

// ============================================
// INTERFACES
// ============================================

/**
 * Options for research execution.
 */
export interface ResearchOptions {
  /** Template ID (e.g., 'tech_market', 'financial') */
  templateId: string;

  /** Research query */
  query: string;

  /** Research depth: 'quick', 'standard', 'deep' */
  granularity?: Granularity;

  /** Whether to persist results to Supabase (default: true) */
  saveToDb?: boolean;

  /** Workspace ID for multi-tenant support */
  workspaceId?: string;

  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * Result of research execution.
 */
export interface ResearchResult {
  /** Session ID (null if saveToDb=false) */
  sessionId: string | null;

  /** Validated research output (null if failed) */
  output: ActorOutput | null;

  /** Path to generated prompt file */
  promptPath: string;

  /** Whether execution succeeded */
  success: boolean;

  /** Error message (if failed) */
  error?: string;
}

// ============================================
// RESEARCH ORCHESTRATOR CLASS
// ============================================

/**
 * Orchestrates complete research flow with persistence.
 *
 * @example
 * ```typescript
 * const orchestrator = new ResearchOrchestrator();
 *
 * const result = await orchestrator.execute({
 *   templateId: 'tech_market',
 *   query: 'AI chip market trends',
 *   granularity: 'standard',
 *   verbose: true,
 * });
 *
 * if (result.success) {
 *   console.log(`Session: ${result.sessionId}`);
 *   console.log(`Findings: ${result.output?.findings?.length}`);
 * }
 * ```
 */
export class ResearchOrchestrator {
  private builder: TemplateBuilder;
  private runner: ClaudeRunner;
  private persistence: SupabasePersistence | null = null;

  constructor() {
    this.builder = new TemplateBuilder();
    this.runner = new ClaudeRunner();
  }

  /**
   * Execute research with full persistence flow.
   *
   * Status transitions: started -> searching -> analyzing -> completed/failed
   *
   * @param options - Research execution options
   * @returns Research result with session ID, output, and status
   */
  async execute(options: ResearchOptions): Promise<ResearchResult> {
    const {
      templateId,
      query,
      granularity = 'standard',
      saveToDb = true,
      workspaceId = 'claude-code',
      verbose = false,
    } = options;

    let sessionId: string | null = null;
    let promptPath = '';

    try {
      // 1. Get template config
      const config = getTemplate(templateId);
      if (!config) {
        throw new Error(`Template not found: ${templateId}`);
      }

      // Get granularity config for max searches
      const granularityConfig = GRANULARITY_CONFIGS[granularity];

      // 2. Initialize persistence if saving to DB
      if (saveToDb) {
        this.persistence = new SupabasePersistence({ workspaceId });

        // Create session with 'started' status
        const session = await this.persistence.createSession({
          query,
          templateType: templateId,
          granularity,
          maxSearches: config.defaultMaxSearches || granularityConfig.maxSearches,
        });
        sessionId = session.sessionId;

        if (verbose) {
          console.log(`[Session] Created: ${sessionId}`);
        }
      }

      // 3. Build prompt
      const buildResult = this.builder.build(config, { query, granularity });
      promptPath = buildResult.promptPath;

      if (verbose) {
        console.log(`[Prompt] Generated: ${promptPath}`);
      }

      // 4. Update status to 'searching'
      if (this.persistence && sessionId) {
        await this.persistence.updateStatus(sessionId, 'searching');
        if (verbose) {
          console.log(`[Status] searching`);
        }
      }

      // 5. Execute research via Claude CLI
      if (verbose) {
        console.log(`[Research] Executing Claude Code...`);
      }

      const runResult = await this.runner.run(promptPath, {
        maxTurns: granularityConfig.maxTurns,
        maxBudgetUsd: granularityConfig.maxBudgetUsd,
        timeout: 300000, // 5 minutes
        verbose,
      });

      if (!runResult.success || !runResult.output) {
        throw new Error(runResult.error || 'Research execution failed');
      }

      // 6. Update status to 'analyzing' and persist results
      if (this.persistence && sessionId) {
        if (verbose) {
          console.log(`[Status] analyzing`);
        }
        await this.persistence.updateStatus(sessionId, 'analyzing');

        // Persist research results (sources, findings, perspectives)
        await this.persistence.persistResearch(sessionId, runResult.output);

        if (verbose) {
          console.log(`[Status] completed`);
          console.log(
            `[Results] ${runResult.output.findings?.length || 0} findings, ${runResult.output.sources?.length || 0} sources`
          );
        }
      }

      return {
        sessionId,
        output: runResult.output,
        promptPath,
        success: true,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Update session to failed status
      if (this.persistence && sessionId) {
        try {
          await this.persistence.failSession(sessionId, errorMessage);
        } catch {
          // Ignore errors from failSession to prevent masking original error
        }
        if (verbose) {
          console.log(`[Status] failed: ${errorMessage}`);
        }
      }

      return {
        sessionId,
        output: null,
        promptPath,
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Check if all dependencies (Claude CLI, Supabase) are available.
   *
   * @returns Object with availability status for each dependency
   */
  async checkDependencies(): Promise<{
    claude: boolean;
    supabase: boolean;
  }> {
    const claudeAvailable = await this.runner.isAvailable();

    // Check Supabase by attempting a simple query
    let supabaseAvailable = false;
    try {
      const persistence = new SupabasePersistence();
      // We can't easily test without making a request, so just check construction
      supabaseAvailable = persistence !== null;
    } catch {
      supabaseAvailable = false;
    }

    return {
      claude: claudeAvailable,
      supabase: supabaseAvailable,
    };
  }
}
