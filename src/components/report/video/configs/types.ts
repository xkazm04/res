/**
 * Template Video Configuration System
 *
 * Defines the structure for template-specific video output with differentiated
 * scene flows, timing, and visual treatments for each research template.
 */

import type { TemplateType } from '@/src/lib/videoShowcaseMockData';

/**
 * A single scene definition within a template's video flow
 */
export interface SceneDefinition {
  /** Unique identifier for this scene */
  id: string;
  /** Display name for the scene (shown in UI/debug) */
  name: string;
  /** Component name to render (maps to scene registry) */
  component: SceneComponentType;
  /** Frame at which this scene begins (0-indexed) */
  startFrame: number;
  /** Frame at which this scene ends (exclusive) */
  endFrame: number;
  /** Additional props to pass to the scene component */
  props?: Record<string, unknown>;
}

/**
 * Available scene component types
 * Each maps to a specific React component for rendering
 */
export type SceneComponentType =
  // Universal scenes
  | 'HookScene'
  | 'VerdictScene'
  // Investigative scenes
  | 'ActorNetworkScene'
  | 'MoneyTrailScene'
  | 'PatternRevealScene'
  // Financial scenes
  | 'BullBearScene'
  | 'RiskMeterScene'
  // Competitive scenes
  | 'CompetitiveLandscapeScene'
  | 'BattleMapScene'
  // Legal scenes
  | 'RulingImpactScene'
  | 'AtRiskScene'
  // Tech Market scenes
  | 'HypeVsRealityScene'
  | 'AdoptionCurveScene'
  // Contract scenes
  | 'PriceComparisonScene'
  | 'ShellCompanyWebScene'
  | 'CorruptionFlagsScene'
  // Understanding scenes
  | 'NarrativeComparisonScene'
  | 'CausalChainScene'
  // Due Diligence scenes
  | 'RedFlagCompilationScene'
  | 'LeadershipHistoryScene'
  // Purchase Decision scenes
  | 'HiddenCostBreakdownScene'
  | 'AlternativeComparisonScene'
  // Reputation scenes
  | 'TrustMeterScene'
  | 'ComplaintPatternScene';

/**
 * Hook patterns for opening/closing the video
 */
export interface HookPatterns {
  /** Pattern for the opening hook (e.g., "What they don't want you to know...") */
  openingPattern: string;
  /** Pattern for the closing CTA */
  closingPattern: string;
}

/**
 * Visual styling configuration
 */
export interface VisualConfig {
  /** Primary accent color for this template (hex) */
  accentColor: string;
  /** Secondary color for gradients/accents */
  secondaryColor: string;
  /** Icon character/emoji for template identification */
  icon: string;
}

/**
 * Complete configuration for a template's video output
 */
export interface TemplateVideoConfig {
  /** The template type this config applies to */
  templateType: TemplateType;
  /** Human-readable name for the template */
  name: string;
  /** Frames per second (typically 30) */
  fps: number;
  /** Total frames in the video */
  totalFrames: number;
  /** Duration in seconds (totalFrames / fps) */
  durationSeconds: number;
  /** Ordered list of scenes to render */
  scenes: SceneDefinition[];
  /** Hook text patterns */
  hooks: HookPatterns;
  /** Visual styling */
  visuals: VisualConfig;
}

/**
 * Props passed to all scene components
 */
export interface BaseSceneProps {
  /** Current frame number (0-indexed) */
  frame: number;
  /** Frames per second */
  fps: number;
  /** Whether to use dark (radar) theme */
  isRadar: boolean;
  /** Video format (standard 16:9 or mobile 9:16) */
  format: 'standard' | 'mobile';
  /** Frame within this scene (relative to scene start) */
  sceneFrame: number;
  /** Total frames for this scene */
  sceneDuration: number;
  /** Progress through scene (0 to 1) */
  sceneProgress: number;
}

/**
 * Helper to calculate scene-relative values
 */
export function getSceneProgress(
  frame: number,
  startFrame: number,
  endFrame: number
): { sceneFrame: number; sceneDuration: number; sceneProgress: number } {
  const sceneFrame = Math.max(0, frame - startFrame);
  const sceneDuration = endFrame - startFrame;
  const sceneProgress = Math.min(1, sceneFrame / sceneDuration);
  return { sceneFrame, sceneDuration, sceneProgress };
}

/**
 * Helper to check if a frame is within a scene
 */
export function isFrameInScene(
  frame: number,
  scene: SceneDefinition
): boolean {
  return frame >= scene.startFrame && frame < scene.endFrame;
}

/**
 * Get the current scene for a given frame
 */
export function getCurrentScene(
  frame: number,
  scenes: SceneDefinition[]
): SceneDefinition | null {
  return scenes.find(scene => isFrameInScene(frame, scene)) || null;
}
