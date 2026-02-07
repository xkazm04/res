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

// Research templates
import { techMarketConfig } from '../research/tech_market';
import { financialConfig } from '../research/financial';
import { competitiveConfig } from '../research/competitive';
import { dueDiligenceConfig } from '../research/due_diligence';
import { investigativeConfig } from '../research/investigative';
import { purchaseDecisionConfig } from '../research/purchase_decision';
import { understandingConfig } from '../research/understanding';
import { legalConfig } from '../research/legal';
import { contractConfig } from '../research/contract';
import { reputationConfig } from '../research/reputation';

// Feed templates
import { newsFeedConfig } from '../feed/news_feed';

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
  legal: legalConfig,
  contract: contractConfig,
  reputation: reputationConfig,
  news_feed: newsFeedConfig,
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
// Research templates
export { techMarketConfig } from '../research/tech_market';
export { financialConfig } from '../research/financial';
export { competitiveConfig } from '../research/competitive';
export { dueDiligenceConfig } from '../research/due_diligence';
export { investigativeConfig } from '../research/investigative';
export { purchaseDecisionConfig } from '../research/purchase_decision';
export { understandingConfig } from '../research/understanding';
export { legalConfig } from '../research/legal';
export { contractConfig } from '../research/contract';
export { reputationConfig } from '../research/reputation';

// Feed templates
export { newsFeedConfig } from '../feed/news_feed';
