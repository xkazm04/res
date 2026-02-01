/**
 * Template Registry
 *
 * Central registry for all available research templates.
 * Templates are loaded statically to avoid dynamic import issues.
 *
 * Usage:
 *   import { getTemplate, getAvailableTemplates } from './configs';
 *   const config = getTemplate('tech_market');
 */

import { TemplateConfig } from '../types';
import { techMarketConfig } from './tech_market';

// ============================================
// TEMPLATE REGISTRY
// ============================================

/**
 * Registry of all available templates.
 * Templates are added here after migration from Python.
 */
export const templates: Record<string, TemplateConfig> = {
  tech_market: techMarketConfig,
  // Additional templates will be added in Phase 14:
  // financial: financialConfig,
  // competitive: competitiveConfig,
  // investigative: investigativeConfig,
  // due_diligence: dueDiligenceConfig,
  // legal: legalConfig,
  // contract: contractConfig,
  // reputation: reputationConfig,
  // purchase_decision: purchaseDecisionConfig,
  // understanding: understandingConfig,
};

// ============================================
// REGISTRY FUNCTIONS
// ============================================

/**
 * Get template config by ID.
 *
 * @param templateId - Template identifier (e.g., "tech_market")
 * @returns TemplateConfig if found, undefined otherwise
 *
 * @example
 * const config = getTemplate('tech_market');
 * if (config) {
 *   console.log(config.templateName); // "Tech Market Analysis"
 * }
 */
export function getTemplate(templateId: string): TemplateConfig | undefined {
  return templates[templateId];
}

/**
 * Get list of available template IDs.
 *
 * @returns Array of template identifiers
 *
 * @example
 * const available = getAvailableTemplates();
 * // ['tech_market', 'financial', ...]
 */
export function getAvailableTemplates(): string[] {
  return Object.keys(templates);
}

/**
 * Check if a template ID is registered.
 *
 * @param templateId - Template identifier to check
 * @returns true if template exists in registry
 */
export function isValidTemplate(templateId: string): boolean {
  return templateId in templates;
}

// ============================================
// RE-EXPORTS
// ============================================

// Re-export individual configs for direct import
export { techMarketConfig } from './tech_market';
