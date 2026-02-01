/**
 * TemplateBuilder
 *
 * Orchestrates prompt composition and Claude CLI execution.
 * Main entry point for template-based research.
 */

import * as fs from 'fs';
import * as path from 'path';
import { TemplateConfig, Granularity, GRANULARITY_CONFIGS } from '../types';
import { PromptComposer, ResearchParams } from './PromptComposer';
import { ClaudeRunner, RunOptions, RunResult } from './ClaudeRunner';

// ============================================
// INTERFACES
// ============================================

/**
 * Result of building a prompt file.
 */
export interface BuildResult {
  /** Path to the generated prompt file */
  promptPath: string;

  /** Content of the generated prompt */
  promptContent: string;
}

/**
 * Options for TemplateBuilder construction.
 */
export interface TemplateBuilderOptions {
  /** Path to sections directory */
  sectionsDir?: string;

  /** Path to output directory for prompts */
  outputDir?: string;
}

// ============================================
// TEMPLATE BUILDER CLASS
// ============================================

/**
 * Builds and executes research prompts from template configurations.
 *
 * @example
 * ```typescript
 * const builder = new TemplateBuilder();
 *
 * // Build prompt only
 * const { promptPath } = builder.build(config, { query: 'AI chips', granularity: 'standard' });
 *
 * // Build and execute
 * const result = await builder.buildAndRun(config, { query: 'AI chips', granularity: 'deep' });
 * ```
 */
export class TemplateBuilder {
  private composer: PromptComposer;
  private runner: ClaudeRunner;
  private outputDir: string;

  /**
   * Create a new TemplateBuilder.
   *
   * @param options - Builder options
   */
  constructor(options?: TemplateBuilderOptions) {
    this.composer = new PromptComposer(options?.sectionsDir);
    this.runner = new ClaudeRunner();
    this.outputDir = options?.outputDir || path.join(process.cwd(), '.prompts');
  }

  // ----------------------------------------
  // PUBLIC: Building
  // ----------------------------------------

  /**
   * Build a prompt file from template config and params.
   *
   * Creates a .md file in .prompts/ directory ready for Claude CLI execution.
   *
   * @param config - Template configuration
   * @param params - Research parameters
   * @returns Path and content of generated prompt
   */
  build(config: TemplateConfig, params: ResearchParams): BuildResult {
    const prompt = this.composer.buildResearchPrompt(config, params);

    // Create output directory if needed
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    // Generate filename from template and query
    const sanitizedQuery = params.query
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') // Trim leading/trailing dashes
      .slice(0, 30);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `${config.templateId}-${sanitizedQuery}-${timestamp}.md`;
    const promptPath = path.join(this.outputDir, filename);

    // Write prompt file
    fs.writeFileSync(promptPath, prompt, 'utf-8');

    return {
      promptPath,
      promptContent: prompt,
    };
  }

  // ----------------------------------------
  // PUBLIC: Building & Running
  // ----------------------------------------

  /**
   * Build prompt and execute with Claude CLI.
   *
   * @param config - Template configuration
   * @param params - Research parameters
   * @param runOptions - Optional CLI execution options
   * @returns Execution result including prompt path
   */
  async buildAndRun(
    config: TemplateConfig,
    params: ResearchParams,
    runOptions?: RunOptions
  ): Promise<RunResult & { promptPath: string }> {
    const { promptPath } = this.build(config, params);
    const granularityConfig = GRANULARITY_CONFIGS[params.granularity];

    // Merge granularity defaults with provided options
    const options: RunOptions = {
      maxTurns: granularityConfig.maxTurns,
      maxBudgetUsd: granularityConfig.maxBudgetUsd,
      ...runOptions,
    };

    const result = await this.runner.run(promptPath, options);
    return { ...result, promptPath };
  }

  // ----------------------------------------
  // PUBLIC: Utilities
  // ----------------------------------------

  /**
   * Get granularity config for informational purposes.
   *
   * @param granularity - The granularity level
   * @returns Resource configuration for that level
   */
  getGranularityConfig(granularity: Granularity) {
    return GRANULARITY_CONFIGS[granularity];
  }

  /**
   * Check if Claude CLI is available for execution.
   *
   * @returns True if claude command is accessible
   */
  async isClaudeAvailable(): Promise<boolean> {
    return this.runner.isAvailable();
  }

  /**
   * Get the output directory for prompts.
   *
   * @returns Path to output directory
   */
  getOutputDir(): string {
    return this.outputDir;
  }

  /**
   * Get the PromptComposer instance for direct access.
   * Useful for testing or custom prompt composition.
   *
   * @returns The underlying PromptComposer
   */
  getComposer(): PromptComposer {
    return this.composer;
  }

  /**
   * Get the ClaudeRunner instance for direct access.
   * Useful for testing or custom execution.
   *
   * @returns The underlying ClaudeRunner
   */
  getRunner(): ClaudeRunner {
    return this.runner;
  }
}
