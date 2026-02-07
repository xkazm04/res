/**
 * Remotion Root Component
 *
 * Registers all template compositions for Remotion Player and Lambda rendering.
 * Each template type has its own composition with specific dimensions and duration.
 *
 * Note: The actual Composition registration will be set up in Phase 21
 * when @remotion/cli is installed for Lambda rendering.
 */

import { TEMPLATE_VIDEO_CONFIGS } from '@/src/components/report/video/configs';
import type { TemplateType } from '@/src/lib/videoShowcaseMockData';

// Define locally to avoid import from client component
export type VideoFormat = 'standard' | 'mobile';

/**
 * Standard dimensions for each format
 */
export const DIMENSIONS = {
  standard: { width: 1920, height: 1080 }, // 16:9 Full HD
  mobile: { width: 1080, height: 1920 },   // 9:16 Full HD vertical
} as const;

/**
 * Preview dimensions (smaller for faster preview)
 */
export const PREVIEW_DIMENSIONS = {
  standard: { width: 640, height: 360 },  // 16:9
  mobile: { width: 360, height: 640 },    // 9:16
} as const;

/**
 * Template composition IDs
 * These are used to reference compositions when rendering
 */
export const COMPOSITION_IDS = {
  investigative: 'investigative-video',
  financial: 'financial-video',
  competitive: 'competitive-video',
  legal: 'legal-video',
  tech_market: 'tech-market-video',
  contract: 'contract-video',
  understanding: 'understanding-video',
  due_diligence: 'due-diligence-video',
} as const;

/**
 * All supported template types
 */
export const TEMPLATE_TYPES: TemplateType[] = [
  'investigative',
  'financial',
  'competitive',
  'legal',
  'tech_market',
  'contract',
  'understanding',
  'due_diligence',
];

/**
 * Get composition ID for a template type
 */
export function getCompositionId(templateType: TemplateType, format: VideoFormat = 'standard'): string {
  const baseId = COMPOSITION_IDS[templateType] || `${templateType}-video`;
  return format === 'mobile' ? `${baseId}-shorts` : baseId;
}

/**
 * Export composition metadata for Lambda rendering
 */
export function getCompositionMetadata(
  templateType: TemplateType,
  format: VideoFormat = 'standard'
) {
  const config = TEMPLATE_VIDEO_CONFIGS[templateType];
  if (!config) {
    throw new Error(`No config found for template type: ${templateType}`);
  }

  const dimensions = format === 'mobile' ? DIMENSIONS.mobile : DIMENSIONS.standard;

  return {
    compositionId: getCompositionId(templateType, format),
    durationInFrames: config.totalFrames,
    fps: config.fps,
    width: dimensions.width,
    height: dimensions.height,
  };
}

/**
 * Get all composition metadata for a template type (both formats)
 */
export function getAllCompositionMetadata(templateType: TemplateType) {
  return {
    standard: getCompositionMetadata(templateType, 'standard'),
    mobile: getCompositionMetadata(templateType, 'mobile'),
  };
}

/**
 * Get template config for a template type
 */
export function getTemplateVideoConfig(templateType: TemplateType) {
  const config = TEMPLATE_VIDEO_CONFIGS[templateType];
  if (!config) {
    throw new Error(`No config found for template type: ${templateType}`);
  }
  return config;
}
