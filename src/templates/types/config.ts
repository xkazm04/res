/**
 * Template Builder Configuration Types
 *
 * TypeScript equivalents of Python template architecture.
 * These types define the structure for research template configurations.
 */

// ============================================
// FINDING TYPE CONFIGURATION
// ============================================

/**
 * Configuration for a finding type within a template.
 * Matches Python FindingTypeConfig dataclass.
 *
 * @example
 * ```typescript
 * const techTrend: FindingTypeConfig = {
 *   name: 'tech_trend',
 *   displayName: 'Tech Trend',
 *   description: 'New technologies gaining adoption',
 *   extractedDataSchema: '{"technology": "...", "maturity": "adopt|trial|assess|hold"}',
 *   analysisFallback: 'This technology trend reflects evolving developer preferences.',
 * };
 * ```
 */
export interface FindingTypeConfig {
  /** Internal identifier (e.g., "tech_trend", "red_flag") */
  name: string;

  /** Human-readable name for UI display (e.g., "Tech Trend") */
  displayName: string;

  /** Instructions for the LLM on what to extract for this type */
  description: string;

  /** JSON schema hint describing expected extracted_data structure */
  extractedDataSchema: string;

  /** Fallback analysis text if LLM doesn't provide analysis */
  analysisFallback: string;
}

// ============================================
// SEARCH CONFIGURATION
// ============================================

/**
 * A group of related search focus items.
 * Templates organize searches into thematic angles.
 *
 * @example
 * ```typescript
 * const searchAngle: SearchAngle = {
 *   name: 'SOFTWARE DEVELOPMENT ECOSYSTEM',
 *   items: [
 *     'Programming languages: adoption trends, new releases',
 *     'Frameworks: frontend (React, Vue, Svelte)',
 *   ],
 * };
 * ```
 */
export interface SearchAngle {
  /** Category name (e.g., "SOFTWARE DEVELOPMENT ECOSYSTEM") */
  name: string;

  /** List of specific search focus items within this category */
  items: string[];
}

// ============================================
// VERIFICATION CONFIGURATION
// ============================================

/**
 * Levels of verification intensity.
 * Higher levels use more resources but provide better accuracy.
 */
export type VerificationLevel = 'none' | 'light' | 'standard' | 'thorough';

/**
 * Configuration for verification phases.
 * Different templates need different verification intensities.
 *
 * @example
 * ```typescript
 * // Tech market needs maximum verification (hype detection)
 * const techMarketVerification: VerificationConfig = {
 *   crossReference: 'thorough',
 *   biasDetection: 'thorough',
 *   expertSanityCheck: 'thorough',
 *   sourceQuality: 'thorough',
 * };
 * ```
 */
export interface VerificationConfig {
  /** Level of cross-referencing findings across sources */
  crossReference: VerificationLevel;

  /** Level of bias detection (vendor marketing, opinion pieces) */
  biasDetection: VerificationLevel;

  /** Level of expert sanity checking (flag unrealistic claims) */
  expertSanityCheck: VerificationLevel;

  /** Level of source quality assessment */
  sourceQuality: VerificationLevel;
}

// ============================================
// MAIN TEMPLATE CONFIGURATION
// ============================================

/**
 * Complete configuration for a research template.
 * Defines how Claude Code should conduct research for this template type.
 *
 * @example
 * ```typescript
 * const techMarketConfig: TemplateConfig = {
 *   templateId: 'tech_market',
 *   templateName: 'Tech Market Analysis',
 *   description: 'Technology market trends and predictions',
 *   searchIntro: 'You are a technology market analyst...',
 *   searchAngles: [...],
 *   // ... other fields
 * };
 * ```
 */
export interface TemplateConfig {
  // ---- Identity ----

  /** Unique template identifier (e.g., "tech_market", "due_diligence") */
  templateId: string;

  /** Human-readable template name (e.g., "Tech Market Analysis") */
  templateName: string;

  /** Template description for UI display */
  description: string;

  // ---- Search Phase Configuration ----

  /** System prompt prefix for the search planning phase */
  searchIntro: string;

  /** Organized groups of search focus areas */
  searchAngles: SearchAngle[];

  /** Guidance for search depth at each granularity level */
  searchDepthGuidance: Record<'quick' | 'standard' | 'deep', string>;

  // ---- Extraction Phase Configuration ----

  /** System prompt prefix for the finding extraction phase */
  extractionIntro: string;

  /** Valid finding types for this template with extraction instructions */
  findingTypes: FindingTypeConfig[];

  /** Additional extraction guidelines and quality requirements */
  extractionGuidelines: string;

  /** Instructions for writing the analysis field */
  analysisInstruction: string;

  // ---- Ordering & Grouping ----

  /** Priority order for findings in reports (most important first) */
  priorityFindingTypes: string[];

  /** Grouping order for display in UI */
  groupingOrder: string[];

  // ---- Perspectives ----

  /** Default perspective types for this template */
  perspectives: string[];

  // ---- Verification ----

  /** Verification intensity configuration */
  verificationConfig: VerificationConfig;

  // ---- Resource Limits ----

  /** Default maximum number of web searches */
  defaultMaxSearches: number;
}

// ============================================
// HELPER TYPES
// ============================================

/**
 * Partial template config for template extension/inheritance.
 * Allows templates to extend a base config with overrides.
 */
export type TemplateConfigOverride = Partial<TemplateConfig>;

/**
 * Template metadata for listing/selection UI.
 */
export interface TemplateMetadata {
  templateId: string;
  templateName: string;
  description: string;
  category: 'analysis' | 'investigation' | 'decision' | 'general';
  icon?: string;
}
