/**
 * Granularity Configuration
 *
 * Defines resource limits for different research depths.
 * Controls Claude CLI execution: searches, turns, budget.
 */

// ============================================
// GRANULARITY TYPE
// ============================================

/**
 * Research granularity levels.
 * - quick: Fast overview with minimal resource usage
 * - standard: Balanced depth for most use cases
 * - deep: Comprehensive research with maximum resources
 */
export type Granularity = 'quick' | 'standard' | 'deep';

// ============================================
// GRANULARITY CONFIG
// ============================================

/**
 * Resource configuration for a granularity level.
 * Controls how much Claude CLI can do during research.
 */
export interface GranularityConfig {
  /** Maximum number of web searches to execute */
  maxSearches: number;

  /** Number of expert perspectives to generate */
  perspectiveCount: number;

  /** Verification intensity level */
  verificationLevel: 'light' | 'standard' | 'thorough';

  /** Maximum conversation turns for Claude CLI */
  maxTurns: number;

  /** Maximum budget in USD for Claude CLI execution */
  maxBudgetUsd: number;
}

// ============================================
// DEFAULT CONFIGURATIONS
// ============================================

/**
 * Default granularity configurations.
 * These can be overridden by template-specific settings.
 *
 * @example
 * ```typescript
 * const config = GRANULARITY_CONFIGS['standard'];
 * // { maxSearches: 8, perspectiveCount: 4, ... }
 * ```
 */
export const GRANULARITY_CONFIGS: Record<Granularity, GranularityConfig> = {
  /**
   * Quick research: Fast overview
   * - 4 searches: Key trends only
   * - 2 perspectives: Essential viewpoints
   * - Light verification: Basic fact-check
   * - 15 turns: Focused execution
   * - $1.00 budget: Cost-effective
   */
  quick: {
    maxSearches: 4,
    perspectiveCount: 2,
    verificationLevel: 'light',
    maxTurns: 15,
    maxBudgetUsd: 1.0,
  },

  /**
   * Standard research: Balanced depth
   * - 8 searches: Comprehensive coverage
   * - 4 perspectives: Multiple viewpoints
   * - Standard verification: Cross-reference claims
   * - 30 turns: Room for follow-up
   * - $3.00 budget: Typical usage
   */
  standard: {
    maxSearches: 8,
    perspectiveCount: 4,
    verificationLevel: 'standard',
    maxTurns: 30,
    maxBudgetUsd: 3.0,
  },

  /**
   * Deep research: Maximum thoroughness
   * - 12 searches: Exhaustive coverage
   * - 6 perspectives: Comprehensive analysis
   * - Thorough verification: Cross-reference + bias detection
   * - 50 turns: Deep investigation
   * - $5.00 budget: Premium research
   */
  deep: {
    maxSearches: 12,
    perspectiveCount: 6,
    verificationLevel: 'thorough',
    maxTurns: 50,
    maxBudgetUsd: 5.0,
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get granularity config with optional template overrides.
 *
 * @param granularity - The granularity level
 * @param overrides - Optional partial config to override defaults
 * @returns Merged granularity config
 */
export function getGranularityConfig(
  granularity: Granularity,
  overrides?: Partial<GranularityConfig>
): GranularityConfig {
  return {
    ...GRANULARITY_CONFIGS[granularity],
    ...overrides,
  };
}

/**
 * Check if a granularity level is valid.
 *
 * @param value - The value to check
 * @returns True if value is a valid Granularity
 */
export function isValidGranularity(value: string): value is Granularity {
  return value === 'quick' || value === 'standard' || value === 'deep';
}
