/**
 * Template Video Config Registry
 *
 * Central registry for all template-specific video configurations.
 * Maps template types to their video output configurations.
 */

import type { TemplateType } from '@/src/lib/videoShowcaseMockData';
import type { TemplateVideoConfig, SceneDefinition } from './types';

import { investigativeConfig } from './investigative';
import { financialConfig } from './financial';
import { competitiveConfig } from './competitive';
import { legalConfig } from './legal';
import { techMarketConfig } from './tech_market';
import { contractConfig } from './contract';
import { understandingConfig } from './understanding';
import { dueDiligenceConfig } from './due_diligence';

/**
 * Registry of all template video configurations
 */
export const TEMPLATE_VIDEO_CONFIGS: Record<TemplateType, TemplateVideoConfig> = {
  investigative: investigativeConfig,
  financial: financialConfig,
  competitive: competitiveConfig,
  legal: legalConfig,
  tech_market: techMarketConfig,
  contract: contractConfig,
  understanding: understandingConfig,
  due_diligence: dueDiligenceConfig,
};

/**
 * Get the video configuration for a specific template type
 */
export function getTemplateConfig(templateType: TemplateType): TemplateVideoConfig {
  const config = TEMPLATE_VIDEO_CONFIGS[templateType];
  if (!config) {
    throw new Error(`No video config found for template type: ${templateType}`);
  }
  return config;
}

/**
 * Get all available template types
 */
export function getAvailableTemplates(): TemplateType[] {
  return Object.keys(TEMPLATE_VIDEO_CONFIGS) as TemplateType[];
}

/**
 * Get scene by frame number for a template
 */
export function getSceneAtFrame(
  templateType: TemplateType,
  frame: number
): SceneDefinition | null {
  const config = getTemplateConfig(templateType);
  return config.scenes.find(
    scene => frame >= scene.startFrame && frame < scene.endFrame
  ) || null;
}

/**
 * Get all scenes for a template
 */
export function getTemplateScenes(templateType: TemplateType): SceneDefinition[] {
  return getTemplateConfig(templateType).scenes;
}

/**
 * Get template visual config
 */
export function getTemplateVisuals(templateType: TemplateType) {
  return getTemplateConfig(templateType).visuals;
}

// Re-export types for convenience
export * from './types';
