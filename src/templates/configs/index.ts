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
import { financialConfig } from './financial';
import { competitiveConfig } from './competitive';
import { dueDiligenceConfig } from './due_diligence';
import { investigativeConfig } from './investigative';
import { purchaseDecisionConfig } from './purchase_decision';
import { understandingConfig } from './understanding';
import { legalConfig } from './legal';
import { contractConfig } from './contract';
import { reputationConfig } from './reputation';

// ============================================
// TEMPLATE REGISTRY
// ============================================

/**
 * Registry of all available templates.
 * Templates are added here after migration from Python.
 */
export const templates: Record<string, TemplateConfig> = {
  tech_market: techMarketConfig,
  financial: financialConfig,
  competitive: competitiveConfig,
  due_diligence: dueDiligenceConfig,
  investigative: investigativeConfig,
  purchase_decision: purchaseDecisionConfig,
  understanding: understandingConfig,
  // Additional templates will be added in Phase 14:
  // legal: legalConfig,
  // contract: contractConfig,
  // reputation: reputationConfig,
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
export { financialConfig } from './financial';
export { competitiveConfig } from './competitive';
export { dueDiligenceConfig } from './due_diligence';
export { investigativeConfig } from './investigative';
export { purchaseDecisionConfig } from './purchase_decision';
export { understandingConfig } from './understanding';
