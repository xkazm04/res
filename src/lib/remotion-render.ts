/**
 * Video Rendering Utilities (Client-Side Focused)
 *
 * This module provides server-side utilities for tracking render jobs.
 * Actual rendering happens client-side using MediaRecorder API.
 */

import { TEMPLATE_VIDEO_CONFIGS } from '@/src/components/report/video/configs';
import type { TemplateType } from '@/src/lib/videoShowcaseMockData';
import type { VideoRenderProgress, VideoRenderStatus } from '@/src/types/research';

// Server-side composition constants
const DIMENSIONS = {
  standard: { width: 1920, height: 1080 },
  mobile: { width: 1080, height: 1920 },
} as const;

const COMPOSITION_IDS: Record<string, string> = {
  investigative: 'investigative-video',
  financial: 'financial-video',
  competitive: 'competitive-video',
  legal: 'legal-video',
  tech_market: 'tech-market-video',
  contract: 'contract-video',
  understanding: 'understanding-video',
  due_diligence: 'due-diligence-video',
};

function getCompositionId(templateType: TemplateType, format: 'standard' | 'mobile'): string {
  const baseId = COMPOSITION_IDS[templateType] || `${templateType}-video`;
  return format === 'mobile' ? `${baseId}-shorts` : baseId;
}

// Track active renders for progress reporting
const activeRenders = new Map<string, {
  progress: number;
  status: VideoRenderStatus;
  startTime: number;
}>();

/**
 * Get the composition metadata for a template
 */
export function getCompositionMetadata(
  templateType: TemplateType,
  format: 'standard' | 'mobile'
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
 * Register a render job for tracking
 */
export function registerRender(renderId: string) {
  activeRenders.set(renderId, {
    progress: 0,
    status: 'pending',
    startTime: Date.now(),
  });
}

/**
 * Update render progress
 */
export function updateRenderProgress(
  renderId: string,
  progress: number,
  status: VideoRenderStatus
) {
  const render = activeRenders.get(renderId);
  if (render) {
    activeRenders.set(renderId, {
      ...render,
      progress,
      status,
    });
  }
}

/**
 * Get render progress for an active render
 */
export function getRenderProgress(renderId: string): VideoRenderProgress | null {
  const render = activeRenders.get(renderId);
  if (!render) {
    return null;
  }

  return {
    render_id: renderId,
    status: render.status,
    progress_percent: render.progress,
    estimated_time_remaining_seconds: undefined,
  };
}

/**
 * Clean up completed render tracking
 */
export function cleanupRenderTracking(renderId: string) {
  activeRenders.delete(renderId);
}

/**
 * Estimate render duration based on video length (client-side is ~1x real-time)
 */
export function estimateRenderDuration(durationSeconds: number): number {
  return Math.round(durationSeconds * 1.1); // Slightly more than real-time
}
