/**
 * Unified easing functions for consistent animation timing.
 *
 * All functions take a progress value from 0-1 and return a transformed value.
 * These can be used with any animation system (Framer Motion, CSS, custom springs).
 */

// ============================================================================
// Cubic Easings (smooth, natural motion)
// ============================================================================

/** Slow start, accelerating to end. Good for exits. */
export function easeInCubic(t: number): number {
  return t * t * t;
}

/** Fast start, decelerating to end. Most common for entries. */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/** Slow start and end. Good for emphasis and attention. */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ============================================================================
// Quart Easings (more pronounced, dramatic)
// ============================================================================

/** Stronger slow start. Good for heavy elements. */
export function easeInQuart(t: number): number {
  return t * t * t * t;
}

/** Stronger deceleration. Good for bouncy entries. */
export function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

/** Dramatic start and end. Good for significant transitions. */
export function easeInOutQuart(t: number): number {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
}

// ============================================================================
// Quint Easings (most dramatic, use sparingly)
// ============================================================================

/** Very pronounced slow start. */
export function easeInQuint(t: number): number {
  return t * t * t * t * t;
}

/** Very pronounced deceleration. */
export function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5);
}

/** Maximum drama for important transitions. */
export function easeInOutQuint(t: number): number {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
}

// ============================================================================
// Expo Easings (exponential, very snappy)
// ============================================================================

/** Near-instant start. Good for responding to user actions. */
export function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10);
}

/** Near-instant response, soft landing. Perfect for modals/overlays. */
export function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/** Snappy both ways. Good for toggles. */
export function easeInOutExpo(t: number): number {
  if (t === 0) return 0;
  if (t === 1) return 1;
  return t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;
}

// ============================================================================
// Sine Easings (gentle, subtle)
// ============================================================================

/** Gentle start. Good for ambient animations. */
export function easeInSine(t: number): number {
  return 1 - Math.cos((t * Math.PI) / 2);
}

/** Gentle finish. Good for continuous motion. */
export function easeOutSine(t: number): number {
  return Math.sin((t * Math.PI) / 2);
}

/** Smooth all around. Good for looping animations. */
export function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

// ============================================================================
// Circ Easings (circular, feels physical)
// ============================================================================

/** Slow then accelerating. Like a ball starting to roll. */
export function easeInCirc(t: number): number {
  return 1 - Math.sqrt(1 - Math.pow(t, 2));
}

/** Fast then decelerating. Like a ball stopping. */
export function easeOutCirc(t: number): number {
  return Math.sqrt(1 - Math.pow(t - 1, 2));
}

/** Circular motion feel. Good for transforms. */
export function easeInOutCirc(t: number): number {
  return t < 0.5
    ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
    : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2;
}

// ============================================================================
// Back Easings (overshoot - use carefully)
// ============================================================================

const OVERSHOOT = 1.70158;
const OVERSHOOT_ADJUSTED = OVERSHOOT * 1.525;

/** Pulls back before starting. Good for emphasis. */
export function easeInBack(t: number): number {
  return (OVERSHOOT + 1) * t * t * t - OVERSHOOT * t * t;
}

/** Overshoots then settles. Good for playful UI. */
export function easeOutBack(t: number): number {
  return 1 + (OVERSHOOT + 1) * Math.pow(t - 1, 3) + OVERSHOOT * Math.pow(t - 1, 2);
}

/** Pulls back, overshoots, settles. Very playful. */
export function easeInOutBack(t: number): number {
  return t < 0.5
    ? (Math.pow(2 * t, 2) * ((OVERSHOOT_ADJUSTED + 1) * 2 * t - OVERSHOOT_ADJUSTED)) / 2
    : (Math.pow(2 * t - 2, 2) * ((OVERSHOOT_ADJUSTED + 1) * (t * 2 - 2) + OVERSHOOT_ADJUSTED) + 2) / 2;
}

// ============================================================================
// Elastic Easings (bouncy, spring-like)
// ============================================================================

const ELASTIC_C4 = (2 * Math.PI) / 3;
const ELASTIC_C5 = (2 * Math.PI) / 4.5;

/** Spring pull back. */
export function easeInElastic(t: number): number {
  if (t === 0) return 0;
  if (t === 1) return 1;
  return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * ELASTIC_C4);
}

/** Spring release with bounce. Great for attention. */
export function easeOutElastic(t: number): number {
  if (t === 0) return 0;
  if (t === 1) return 1;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ELASTIC_C4) + 1;
}

/** Full spring effect both ways. */
export function easeInOutElastic(t: number): number {
  if (t === 0) return 0;
  if (t === 1) return 1;
  return t < 0.5
    ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * ELASTIC_C5)) / 2
    : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * ELASTIC_C5)) / 2 + 1;
}

// ============================================================================
// Bounce Easing (physical bounce)
// ============================================================================

/** Bounce at the end like a ball. */
export function easeOutBounce(t: number): number {
  const n1 = 7.5625;
  const d1 = 2.75;

  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    return n1 * (t -= 1.5 / d1) * t + 0.75;
  } else if (t < 2.5 / d1) {
    return n1 * (t -= 2.25 / d1) * t + 0.9375;
  } else {
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
}

/** Bounce at the start. */
export function easeInBounce(t: number): number {
  return 1 - easeOutBounce(1 - t);
}

/** Bounce at start and end. */
export function easeInOutBounce(t: number): number {
  return t < 0.5
    ? (1 - easeOutBounce(1 - 2 * t)) / 2
    : (1 + easeOutBounce(2 * t - 1)) / 2;
}

// ============================================================================
// Linear (no easing)
// ============================================================================

/** No easing, constant speed. Good for progress bars. */
export function linear(t: number): number {
  return t;
}

// ============================================================================
// Type Definitions
// ============================================================================

export type EasingFunction = (t: number) => number;

/** Preset easing configurations for common use cases */
export const easingPresets = {
  // UI interactions (fast response)
  interaction: easeOutCubic,
  buttonPress: easeOutQuart,
  modalOpen: easeOutExpo,
  modalClose: easeInExpo,

  // Content reveals
  fadeIn: easeOutCubic,
  fadeOut: easeInCubic,
  slideIn: easeOutQuart,
  slideOut: easeInQuart,

  // Data visualizations
  chartGrow: easeOutQuart,
  barReveal: easeOutCubic,
  lineTrace: easeOutCubic,
  pieExpand: easeOutQuart,

  // Ambient/decorative
  pulse: easeInOutSine,
  breathe: easeInOutSine,
  gentle: easeInOutSine,

  // Playful/attention
  bounce: easeOutBounce,
  elastic: easeOutElastic,
  overshoot: easeOutBack,

  // Video/motion
  videoReveal: easeOutCubic,
  videoExit: easeInCubic,
  stagger: easeOutCubic,
} as const;
