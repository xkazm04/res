/**
 * Utilities for converting ComposedScene arrays into Remotion-compatible
 * SceneDefinition arrays with calculated frame timing.
 */

import type { ComposedScene } from './cli/types';
import type { SceneDefinition, SceneComponentType } from '@/src/components/report/video/configs/types';

/**
 * Convert a ComposedScene array to SceneDefinition array with frame timing.
 */
export function compositionToSceneDefinitions(
  scenes: ComposedScene[],
  fps: number,
): SceneDefinition[] {
  let currentFrame = 0;

  return scenes.map(scene => {
    const frames = Math.round(scene.durationSeconds * fps);
    const def: SceneDefinition = {
      id: scene.sceneId,
      name: scene.component,
      component: scene.component as SceneComponentType,
      startFrame: currentFrame,
      endFrame: currentFrame + frames,
    };
    currentFrame += frames;
    return def;
  });
}

/**
 * Calculate total frame count from a composition.
 */
export function compositionTotalFrames(scenes: ComposedScene[], fps: number): number {
  return scenes.reduce((total, scene) => total + Math.round(scene.durationSeconds * fps), 0);
}

/**
 * Calculate total duration in seconds from a composition.
 */
export function compositionDurationSeconds(scenes: ComposedScene[]): number {
  return scenes.reduce((total, scene) => total + scene.durationSeconds, 0);
}
