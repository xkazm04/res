/**
 * ClaudeRunner
 *
 * Executes Claude Code CLI with generated prompts.
 * Handles JSON output parsing and validation.
 */

import { execa, type ExecaError } from 'execa';
import { ActorOutput, ActorOutputSchema, getActorOutputJsonSchema } from '../types';

// ============================================
// INTERFACES
// ============================================

/**
 * Options for running Claude CLI.
 */
export interface RunOptions {
  /** Maximum conversation turns (default: 30) */
  maxTurns?: number;

  /** Maximum budget in USD (default: 3.00) */
  maxBudgetUsd?: number;

  /** Timeout in milliseconds (default: 300000 = 5 min) */
  timeout?: number;

  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * Result of a Claude CLI execution.
 */
export interface RunResult {
  /** Whether execution succeeded and produced valid output */
  success: boolean;

  /** Validated research output (if successful) */
  output?: ActorOutput;

  /** Error message (if failed) */
  error?: string;

  /** Raw CLI output (for debugging) */
  rawOutput?: string;
}

// ============================================
// CLAUDE RUNNER CLASS
// ============================================

/**
 * Executes Claude Code CLI with research prompts.
 *
 * @example
 * ```typescript
 * const runner = new ClaudeRunner();
 * const result = await runner.run('./prompts/tech-market-query.md', {
 *   maxTurns: 30,
 *   maxBudgetUsd: 3.00,
 * });
 * if (result.success) {
 *   console.log(result.output.findings);
 * }
 * ```
 */
export class ClaudeRunner {
  /**
   * Run Claude CLI with a prompt file and return structured output.
   *
   * @param promptPath - Path to the prompt file (.md)
   * @param options - Execution options
   * @returns Execution result with validated output or error
   */
  async run(promptPath: string, options: RunOptions = {}): Promise<RunResult> {
    const {
      maxTurns = 30,
      maxBudgetUsd = 3.0,
      timeout = 300000, // 5 minutes default
      verbose = false,
    } = options;

    const jsonSchema = JSON.stringify(getActorOutputJsonSchema());

    const args = [
      '-p',
      '--output-format', 'json',
      '--json-schema', jsonSchema,
      '--allowedTools', 'WebSearch,Read',
      '--max-turns', String(maxTurns),
      '--max-budget-usd', String(maxBudgetUsd),
      '--system-prompt-file', promptPath,
    ];

    if (verbose) {
      console.log(`[ClaudeRunner] Executing: claude ${args.join(' ')}`);
    }

    try {
      const { stdout } = await execa('claude', args, { timeout });

      // Parse JSON output
      let response: unknown;
      try {
        response = JSON.parse(stdout);
      } catch (parseError) {
        return {
          success: false,
          error: `Failed to parse JSON output: ${(parseError as Error).message}`,
          rawOutput: stdout,
        };
      }

      // Extract structured output from response
      const output = (response as Record<string, unknown>).structured_output
        || (response as Record<string, unknown>).result
        || response;

      // Validate against schema
      const parsed = ActorOutputSchema.safeParse(output);
      if (!parsed.success) {
        return {
          success: false,
          error: `Schema validation failed: ${parsed.error.message}`,
          rawOutput: stdout,
        };
      }

      return {
        success: true,
        output: parsed.data,
        rawOutput: stdout,
      };
    } catch (error) {
      const execaError = error as ExecaError;
      return {
        success: false,
        error: execaError.message || 'Unknown error during CLI execution',
        rawOutput: execaError.stdout as string | undefined,
      };
    }
  }

  /**
   * Run Claude CLI with inline prompt (for testing/development).
   *
   * @param prompt - The prompt text
   * @param options - Execution options
   * @returns Execution result with validated output or error
   */
  async runInline(prompt: string, options: RunOptions = {}): Promise<RunResult> {
    const {
      maxTurns = 30,
      maxBudgetUsd = 3.0,
      timeout = 300000,
      verbose = false,
    } = options;

    const jsonSchema = JSON.stringify(getActorOutputJsonSchema());

    const args = [
      '-p', prompt,
      '--output-format', 'json',
      '--json-schema', jsonSchema,
      '--allowedTools', 'WebSearch,Read',
      '--max-turns', String(maxTurns),
      '--max-budget-usd', String(maxBudgetUsd),
    ];

    if (verbose) {
      console.log(`[ClaudeRunner] Executing inline prompt (${prompt.length} chars)`);
    }

    try {
      const { stdout } = await execa('claude', args, { timeout });

      let response: unknown;
      try {
        response = JSON.parse(stdout);
      } catch (parseError) {
        return {
          success: false,
          error: `Failed to parse JSON output: ${(parseError as Error).message}`,
          rawOutput: stdout,
        };
      }

      const output = (response as Record<string, unknown>).structured_output
        || (response as Record<string, unknown>).result
        || response;

      const parsed = ActorOutputSchema.safeParse(output);
      if (!parsed.success) {
        return {
          success: false,
          error: `Schema validation failed: ${parsed.error.message}`,
          rawOutput: stdout,
        };
      }

      return {
        success: true,
        output: parsed.data,
        rawOutput: stdout,
      };
    } catch (error) {
      const execaError = error as ExecaError;
      return {
        success: false,
        error: execaError.message || 'Unknown error during CLI execution',
        rawOutput: execaError.stdout as string | undefined,
      };
    }
  }

  /**
   * Check if Claude CLI is available.
   *
   * @returns True if claude command is accessible
   */
  async isAvailable(): Promise<boolean> {
    try {
      await execa('claude', ['--version']);
      return true;
    } catch {
      return false;
    }
  }
}
