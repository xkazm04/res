'use client';

/**
 * NarrationSubtitle — burn-in word-by-word subtitle overlay for video scenes.
 *
 * Two timing modes:
 *   1. Precise: Uses real per-word timestamps from ElevenLabs with-timestamps API
 *   2. Fallback: Derives pacing from scene duration when timestamps unavailable
 *
 * Displays the full narration sentence with word wrapping.
 * Active word is highlighted in accent color; past words are bright white.
 */

import { spring } from '@/src/lib/animation/spring';
import { easeOutCubic } from '@/src/lib/animation/easing';
import type { WordTimestamp } from '@/src/components/maker/cli/types';

/** Buffer frames at start/end of scene */
const START_BUFFER = 8;
const END_BUFFER = 15;
/** Fallback WPS when no timestamps and no scene duration (calibrated for voice 3DR8c2yd30eztg65o4jV) */
const FALLBACK_WPS = 2.35;

interface NarrationSubtitleProps {
  text: string;
  sceneFrame: number;
  sceneDuration: number;
  fps: number;
  accentColor?: string;
  /** Real per-word timestamps from ElevenLabs (scene-relative) */
  wordTimestamps?: WordTimestamp[];
}

export function NarrationSubtitle({
  text,
  sceneFrame,
  sceneDuration,
  fps,
  accentColor = '#06b6d4',
  wordTimestamps,
}: NarrationSubtitleProps) {
  if (!text) return null;

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;

  // Entrance animation
  const entrance = spring({
    frame: sceneFrame,
    fps,
    delay: START_BUFFER - 4,
    durationFrames: 14,
    easing: easeOutCubic,
  });

  // Exit: fade out near scene end
  const framesUntilEnd = sceneDuration - sceneFrame;
  const exitOpacity = framesUntilEnd < END_BUFFER
    ? Math.max(0, framesUntilEnd / END_BUFFER)
    : 1;

  // Determine which word is active
  const elapsed = sceneFrame - START_BUFFER;
  let currentWordIndex: number;

  if (wordTimestamps && wordTimestamps.length > 0) {
    // Precise mode: use real timestamps
    const currentTimeSec = elapsed / fps;
    currentWordIndex = -1;
    for (let i = 0; i < wordTimestamps.length; i++) {
      if (currentTimeSec >= wordTimestamps[i].start) {
        currentWordIndex = i;
      }
    }
  } else {
    // Fallback mode: derive from scene duration
    const availableFrames = sceneDuration - START_BUFFER - END_BUFFER;
    const framesPerWord = availableFrames > 0 && words.length > 0
      ? availableFrames / words.length
      : fps / FALLBACK_WPS;
    currentWordIndex = Math.floor(elapsed / framesPerWord);
  }

  // Clamp
  if (elapsed < 0) currentWordIndex = -1;
  const displayIndex = Math.min(currentWordIndex, words.length - 1);

  // After all words spoken + scene near end, hide
  if (sceneFrame >= sceneDuration - 4) return null;

  return (
    <div
      className="absolute inset-x-0 bottom-0 flex justify-center pointer-events-none"
      style={{
        paddingBottom: '6%',
        opacity: entrance * exitOpacity,
        transform: `translateY(${(1 - entrance) * 12}px)`,
      }}
    >
      <div
        className="px-5 py-3 rounded-xl"
        style={{
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(10px)',
          maxWidth: '92%',
        }}
      >
        <p
          className="text-center font-bold leading-snug"
          style={{ fontSize: '28px' }}
        >
          {words.map((word, i) => {
            const isActive = i === displayIndex;
            const isPast = i < displayIndex;
            const isFuture = i > displayIndex;

            return (
              <span
                key={i}
                style={{
                  color: isActive
                    ? accentColor
                    : isPast
                      ? '#f1f5f9'
                      : 'rgba(241, 245, 249, 0.35)',
                  textShadow: isActive
                    ? `0 0 16px ${accentColor}90, 0 2px 4px rgba(0,0,0,0.9)`
                    : '0 2px 4px rgba(0,0,0,0.9)',
                  fontWeight: isActive ? 800 : 700,
                  ...(isFuture ? { opacity: 0.4 } : {}),
                }}
              >
                {word}{i < words.length - 1 ? ' ' : ''}
              </span>
            );
          })}
        </p>
      </div>
    </div>
  );
}
