/**
 * Motion Primitives — punchy, high-energy effects for video scenes.
 *
 * All functions are frame-based (no React hooks, no Remotion deps).
 * They compose with the existing spring() and easing functions.
 */

import { spring } from './spring';
import { easeOutExpo, easeOutBack, easeOutCubic } from './easing';

// ============================================================================
// Camera Shake
// ============================================================================

interface ImpactShakeOpts {
  /** Pixel displacement amplitude. Default 3. */
  intensity?: number;
  /** Frames to decay to zero. Default 8. */
  decayFrames?: number;
  /** Oscillation speed multiplier. Default 7. */
  frequency?: number;
}

/**
 * Decaying camera-shake displacement. Apply to a container's transform.
 *
 * @example
 * const shake = impactShake(sceneFrame, 0, { intensity: 4 });
 * style={{ transform: `translate(${shake.x}px, ${shake.y}px) rotate(${shake.rotate}deg)` }}
 */
export function impactShake(
  frame: number,
  triggerFrame: number,
  opts: ImpactShakeOpts = {},
): { x: number; y: number; rotate: number } {
  const { intensity = 3, decayFrames = 8, frequency = 7 } = opts;
  const elapsed = frame - triggerFrame;

  if (elapsed < 0 || elapsed >= decayFrames) {
    return { x: 0, y: 0, rotate: 0 };
  }

  const decay = 1 - elapsed / decayFrames;
  const amp = intensity * decay * decay; // quadratic decay for snappy settle

  return {
    x: Math.sin(elapsed * frequency) * amp,
    y: Math.cos(elapsed * frequency * 0.7) * amp * 0.6,
    rotate: Math.sin(elapsed * frequency * 1.3) * amp * 0.15,
  };
}

// ============================================================================
// Flash
// ============================================================================

interface FlashOpts {
  /** Total flash duration in frames. Default 3. */
  durationFrames?: number;
  /** Peak opacity (0-1). Default 0.5. */
  peak?: number;
}

/**
 * Returns 0-1 opacity for a white flash overlay.
 * Peaks instantly then decays exponentially.
 *
 * @example
 * const flash = flashIntensity(sceneFrame, 0);
 * <div style={{ opacity: flash, background: 'white', mixBlendMode: 'screen' }} />
 */
export function flashIntensity(
  frame: number,
  triggerFrame: number,
  opts: FlashOpts = {},
): number {
  const { durationFrames = 3, peak = 0.5 } = opts;
  const elapsed = frame - triggerFrame;

  if (elapsed < 0 || elapsed >= durationFrames) return 0;

  // Instant peak on first frame, exponential decay
  const t = elapsed / durationFrames;
  return peak * (1 - t) * (1 - t);
}

// ============================================================================
// Scale Punch
// ============================================================================

interface ScalePunchOpts {
  /** Max scale (e.g. 1.18 = 18% overshoot). Default 1.18. */
  overshoot?: number;
  /** Frames for full punch cycle. Default 12. */
  durationFrames?: number;
}

/**
 * Returns a scale multiplier that overshoots then settles to 1.0.
 * Use for badge reveals, icon entrances, emphasis moments.
 *
 * @example
 * const s = scalePunch(sceneFrame, 12);
 * style={{ transform: `scale(${s})` }}
 */
export function scalePunch(
  frame: number,
  triggerFrame: number,
  opts: ScalePunchOpts = {},
): number {
  const { overshoot = 1.18, durationFrames = 12 } = opts;
  const elapsed = frame - triggerFrame;

  if (elapsed < 0) return 0;
  if (elapsed >= durationFrames) return 1;

  const t = elapsed / durationFrames;
  // Use easeOutBack for natural overshoot, then remap
  const raw = easeOutBack(t);
  // raw goes 0 → ~1.15 → 1.0 with easeOutBack
  // Scale the overshoot amount
  const overshootAmount = overshoot - 1;
  if (raw > 1) {
    return 1 + (raw - 1) * (overshootAmount / 0.15);
  }
  return raw;
}

// ============================================================================
// Bounce Entrance
// ============================================================================

interface BounceInOpts {
  /** Delay in frames before animation starts. Default 0. */
  delay?: number;
  /** Animation duration in frames. Default 20. */
  durationFrames?: number;
  /** Overshoot amount (0.15 = 15%). Default 0.15. */
  overshoot?: number;
}

/**
 * Progress value that overshoots ~1.15 then settles to 1.0.
 * Wraps spring() with easeOutBack for natural bounce.
 *
 * @example
 * const p = bounceIn(sceneFrame, fps, { delay: 10 });
 * style={{ opacity: Math.min(p, 1), transform: `scale(${0.5 + p * 0.5})` }}
 */
export function bounceIn(
  frame: number,
  fps: number,
  opts: BounceInOpts = {},
): number {
  const { delay = 0, durationFrames = 20, overshoot = 0.15 } = opts;

  const raw = spring({
    frame,
    fps,
    delay,
    durationFrames,
    easing: easeOutBack,
  });

  // easeOutBack naturally overshoots to ~1.15
  // Scale the overshoot proportionally
  if (raw > 1) {
    return 1 + (raw - 1) * (overshoot / 0.15);
  }
  return raw;
}

// ============================================================================
// Slam Entrance
// ============================================================================

interface SlamInOpts {
  /** Delay in frames. Default 0. */
  delay?: number;
  /** Duration in frames. Default 15. */
  durationFrames?: number;
  /** Start offset in pixels. Default 40. */
  from?: number;
}

/**
 * Element slams in from offset, hits target, micro-rebounds.
 * Returns offset (px), scale, and opacity values.
 *
 * @example
 * const slam = slamIn(sceneFrame, fps, { delay: 5, from: 50 });
 * style={{
 *   transform: `translateY(${slam.offset}px) scale(${slam.scale})`,
 *   opacity: slam.opacity,
 * }}
 */
export function slamIn(
  frame: number,
  fps: number,
  opts: SlamInOpts = {},
): { offset: number; scale: number; opacity: number } {
  const { delay = 0, durationFrames = 15, from = 40 } = opts;

  const progress = spring({
    frame,
    fps,
    delay,
    durationFrames,
    easing: easeOutExpo,
  });

  // Offset: from → 0, very fast
  const offset = from * (1 - progress);

  // Opacity: snap to visible quickly
  const opacity = Math.min(progress * 3, 1);

  // Scale: slight compression on impact then settle
  const elapsed = frame - delay;
  let scale = 1;
  if (elapsed >= 0 && elapsed < durationFrames) {
    const t = elapsed / durationFrames;
    if (t < 0.3) {
      // Approaching — slight stretch
      scale = 1 + (1 - t / 0.3) * 0.04;
    } else if (t < 0.5) {
      // Impact — compress
      const impactT = (t - 0.3) / 0.2;
      scale = 1 + easeOutCubic(impactT) * 0.06;
    } else {
      // Settle
      const settleT = (t - 0.5) / 0.5;
      scale = 1.06 - easeOutCubic(settleT) * 0.06;
    }
  }

  return { offset, scale, opacity };
}

// ============================================================================
// Spread Entrance — proportional stagger delays based on scene duration
// ============================================================================

interface SpreadEntranceOpts {
  /** Fraction of scene duration where first item animates. Default 0.05. */
  startPct?: number;
  /** Fraction of scene duration where last item animates. Default 0.65. */
  endPct?: number;
  /** Minimum frames between consecutive items. Default 4. */
  minGapFrames?: number;
}

/**
 * Returns a function that calculates proportional delay frames for staggered
 * item entrances, spreading animations across a percentage of the scene duration
 * instead of using hardcoded frame values.
 *
 * @example
 * const getDelay = spreadEntrance(sceneDuration, metrics.length);
 * // Per item:
 * const progress = spring({ frame: sceneFrame, fps, delay: getDelay(i), durationFrames: 22 });
 */
export function spreadEntrance(
  sceneDuration: number,
  itemCount: number,
  opts: SpreadEntranceOpts = {},
): (index: number) => number {
  const { startPct = 0.05, endPct = 0.65, minGapFrames = 4 } = opts;

  const startFrame = Math.round(sceneDuration * startPct);
  const endFrame = Math.round(sceneDuration * endPct);
  const range = endFrame - startFrame;

  return (index: number): number => {
    if (itemCount <= 1) return startFrame;
    const raw = startFrame + Math.round((index / (itemCount - 1)) * range);
    // Ensure minimum gap between consecutive items
    const gapBased = startFrame + index * minGapFrames;
    return Math.max(raw, gapBased);
  };
}
