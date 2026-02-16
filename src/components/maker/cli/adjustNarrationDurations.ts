/**
 * Adjusts scene durations based on narration length.
 *
 * Estimates speaking time from word count (~2.5 words/sec at normal pace)
 * and extends scene durations when narration exceeds the allotted time.
 * This ensures narration audio doesn't get cut off mid-sentence.
 */

import type { ComposedScene } from './types';

/** Average speaking rate in words per second.
 *  Calibrated against voice 3DR8c2yd30eztg65o4jV with eleven_flash_v2_5:
 *    Short (6w): ~2.4-3.2 WPS, Medium (17w): ~2.6 WPS,
 *    Long (35w): ~2.25 WPS, Full narration (74w): ~2.35 WPS.
 *  Using 2.35 (full-narration rate) to prevent audio cutoff. */
const WORDS_PER_SECOND = 2.35;

/** Minimum buffer in seconds between narration end and scene end */
const BUFFER_SECONDS = 0.5;

/** Maximum duration a single scene can be extended to */
const MAX_SCENE_DURATION = 15;

/** Minimum scene duration (don't shrink below this) */
const MIN_SCENE_DURATION = 2;

/**
 * Estimate speaking duration for a narration text.
 */
function estimateNarrationDuration(text: string): number {
  const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  return words / WORDS_PER_SECOND;
}

/**
 * Adjusts scene durations so narration fits within each scene.
 * Returns a new array with updated durationSeconds values.
 */
export function adjustNarrationDurations(scenes: ComposedScene[]): ComposedScene[] {
  let totalExtension = 0;

  const adjusted = scenes.map(scene => {
    if (!scene.narration) return scene;

    const narrationDuration = estimateNarrationDuration(scene.narration);
    const requiredDuration = narrationDuration + BUFFER_SECONDS;

    if (requiredDuration > scene.durationSeconds) {
      const newDuration = Math.min(
        Math.ceil(requiredDuration),
        MAX_SCENE_DURATION,
      );
      const extension = newDuration - scene.durationSeconds;
      totalExtension += extension;

      return {
        ...scene,
        durationSeconds: Math.max(newDuration, MIN_SCENE_DURATION),
      };
    }

    return scene;
  });

  if (totalExtension > 0) {
    console.log(
      `[narration] Extended total duration by ${totalExtension}s to fit narration`,
    );
  }

  return adjusted;
}
