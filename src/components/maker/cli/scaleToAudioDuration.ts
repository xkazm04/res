/**
 * Scales scene durations proportionally so total video duration
 * matches the actual audio narration duration from ElevenLabs.
 *
 * Only narrated scenes are scaled. Non-narrated scenes (e.g. stock footage
 * transitions) keep their original duration.
 */

import type { ComposedScene } from './types';

const MIN_SCENE_DURATION = 2;
const MAX_SCENE_DURATION = 15;

/**
 * Scale narrated scene durations to match actual audio duration.
 *
 * @param scenes - The composed scenes (already validated + stock-resolved)
 * @param actualAudioDuration - Real audio duration in seconds from ElevenLabs
 * @returns New scenes array with adjusted durations
 */
export function scaleToAudioDuration(
  scenes: ComposedScene[],
  actualAudioDuration: number,
): ComposedScene[] {
  // Sum current narrated scene durations
  const narratedScenes = scenes.filter(s => s.narration);
  if (narratedScenes.length === 0) return scenes;

  const currentNarratedTotal = narratedScenes.reduce(
    (sum, s) => sum + s.durationSeconds,
    0,
  );

  // If no meaningful duration to scale, return as-is
  if (currentNarratedTotal <= 0 || actualAudioDuration <= 0) return scenes;

  const scaleFactor = actualAudioDuration / currentNarratedTotal;

  // Don't scale if already within 10% — close enough
  if (Math.abs(scaleFactor - 1) < 0.1) return scenes;

  let totalAdjustment = 0;

  const scaled = scenes.map(scene => {
    if (!scene.narration) return scene;

    const newDuration = Math.min(
      MAX_SCENE_DURATION,
      Math.max(
        MIN_SCENE_DURATION,
        Math.round(scene.durationSeconds * scaleFactor * 10) / 10,
      ),
    );

    totalAdjustment += newDuration - scene.durationSeconds;

    return { ...scene, durationSeconds: newDuration };
  });

  if (Math.abs(totalAdjustment) > 0.5) {
    console.log(
      `[audio-scale] Adjusted total duration by ${totalAdjustment > 0 ? '+' : ''}${totalAdjustment.toFixed(1)}s to match ${actualAudioDuration.toFixed(1)}s audio`,
    );
  }

  return scaled;
}
