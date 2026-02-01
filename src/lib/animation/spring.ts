/**
 * Spring animation utilities for smooth, physics-based motion.
 *
 * Provides both frame-based springs (for video/canvas) and time-based springs
 * (for React components). All springs use critically damped behavior for
 * smooth motion without overshoot.
 */

import { easeOutCubic, type EasingFunction } from './easing';

// ============================================================================
// Types
// ============================================================================

export interface SpringConfig {
  /** Animation duration in frames */
  durationFrames?: number;
  /** Delay before animation starts (in frames) */
  delay?: number;
  /** Easing function to apply */
  easing?: EasingFunction;
}

export interface TimeSpringConfig {
  /** Animation duration in milliseconds */
  duration?: number;
  /** Delay before animation starts (in ms) */
  delay?: number;
  /** Easing function to apply */
  easing?: EasingFunction;
}

export interface PhysicsSpringConfig {
  /** Spring stiffness (higher = faster) */
  stiffness?: number;
  /** Damping ratio (1 = critical, <1 = bouncy, >1 = overdamped) */
  damping?: number;
  /** Object mass (higher = slower) */
  mass?: number;
  /** Velocity threshold to consider animation complete */
  restVelocity?: number;
  /** Position threshold to consider animation complete */
  restDelta?: number;
}

// ============================================================================
// Default Configurations
// ============================================================================

const DEFAULT_SPRING_CONFIG: Required<SpringConfig> = {
  durationFrames: 20,
  delay: 0,
  easing: easeOutCubic,
};

const DEFAULT_TIME_SPRING_CONFIG: Required<TimeSpringConfig> = {
  duration: 300,
  delay: 0,
  easing: easeOutCubic,
};

const DEFAULT_PHYSICS_CONFIG: Required<PhysicsSpringConfig> = {
  stiffness: 170,
  damping: 26,
  mass: 1,
  restVelocity: 0.01,
  restDelta: 0.01,
};

// ============================================================================
// Frame-Based Spring (for video/canvas animations)
// ============================================================================

/**
 * Calculate spring progress for a given frame.
 * Returns 0-1 value representing animation progress.
 *
 * @example
 * // In video component
 * const opacity = spring({ frame, fps: 30, delay: 10, durationFrames: 20 });
 * // opacity animates from 0 to 1 starting at frame 10, over 20 frames
 */
export function spring(params: {
  frame: number;
  fps: number;
  delay?: number;
  durationFrames?: number;
  easing?: EasingFunction;
}): number {
  const {
    frame,
    delay = DEFAULT_SPRING_CONFIG.delay,
    durationFrames = DEFAULT_SPRING_CONFIG.durationFrames,
    easing = DEFAULT_SPRING_CONFIG.easing,
  } = params;

  const adjustedFrame = frame - delay;
  if (adjustedFrame <= 0) return 0;
  if (adjustedFrame >= durationFrames) return 1;

  const t = adjustedFrame / durationFrames;
  return easing(t);
}

/**
 * Calculate staggered spring progress for list items.
 *
 * @example
 * items.map((item, i) => {
 *   const progress = staggeredSpring({ frame, fps: 30, index: i, stagger: 3 });
 *   return <div style={{ opacity: progress }}>{item}</div>;
 * });
 */
export function staggeredSpring(params: {
  frame: number;
  fps: number;
  index: number;
  stagger?: number;
  delay?: number;
  durationFrames?: number;
  easing?: EasingFunction;
}): number {
  const { index, stagger = 5, delay = 0, ...rest } = params;
  return spring({ ...rest, delay: delay + index * stagger });
}

// ============================================================================
// Time-Based Spring (for React components)
// ============================================================================

/**
 * Calculate spring progress for a given timestamp.
 * Useful for CSS animations and manual animation loops.
 *
 * @param elapsed - Milliseconds since animation started
 * @param config - Spring configuration
 * @returns Progress value from 0 to 1
 */
export function timeSpring(elapsed: number, config: TimeSpringConfig = {}): number {
  const { duration, delay, easing } = { ...DEFAULT_TIME_SPRING_CONFIG, ...config };

  const adjustedTime = elapsed - delay;
  if (adjustedTime <= 0) return 0;
  if (adjustedTime >= duration) return 1;

  const t = adjustedTime / duration;
  return easing(t);
}

// ============================================================================
// Physics-Based Spring (for smooth, natural motion)
// ============================================================================

export interface PhysicsSpringState {
  value: number;
  velocity: number;
  isComplete: boolean;
}

/**
 * Calculate next state for a physics-based spring.
 * Use this for smooth, natural motion in animation loops.
 *
 * @example
 * let state = { value: 0, velocity: 0, isComplete: false };
 * function animate() {
 *   state = physicsSpring(state.value, 1, state.velocity, 16, config);
 *   element.style.transform = `translateX(${state.value}px)`;
 *   if (!state.isComplete) requestAnimationFrame(animate);
 * }
 */
export function physicsSpring(
  current: number,
  target: number,
  velocity: number,
  deltaMs: number,
  config: PhysicsSpringConfig = {}
): PhysicsSpringState {
  const { stiffness, damping, mass, restVelocity, restDelta } = {
    ...DEFAULT_PHYSICS_CONFIG,
    ...config,
  };

  const dt = deltaMs / 1000; // Convert to seconds
  const displacement = target - current;

  // Spring force: F = -kx - cv
  const springForce = stiffness * displacement;
  const dampingForce = damping * velocity;
  const acceleration = (springForce - dampingForce) / mass;

  // Update velocity and position
  const newVelocity = velocity + acceleration * dt;
  const newValue = current + newVelocity * dt;

  // Check if animation is complete
  const isComplete =
    Math.abs(newVelocity) < restVelocity && Math.abs(target - newValue) < restDelta;

  return {
    value: isComplete ? target : newValue,
    velocity: isComplete ? 0 : newVelocity,
    isComplete,
  };
}

// ============================================================================
// Interpolation Utilities
// ============================================================================

/**
 * Interpolate between two values with optional easing.
 *
 * @example
 * const x = interpolate(progress, [0, 1], [100, 500], { easing: easeOutCubic });
 */
export function interpolate(
  input: number,
  inputRange: [number, number],
  outputRange: [number, number],
  options?: {
    extrapolateLeft?: 'clamp' | 'extend';
    extrapolateRight?: 'clamp' | 'extend';
    easing?: EasingFunction;
  }
): number {
  const [inMin, inMax] = inputRange;
  const [outMin, outMax] = outputRange;
  const { extrapolateLeft = 'extend', extrapolateRight = 'extend', easing } = options || {};

  // Clamp input if needed
  let clampedInput = input;
  if (extrapolateLeft === 'clamp' && input < inMin) clampedInput = inMin;
  if (extrapolateRight === 'clamp' && input > inMax) clampedInput = inMax;

  // Calculate normalized progress (0 to 1)
  let t = (clampedInput - inMin) / (inMax - inMin);
  t = Math.max(0, Math.min(1, t));

  // Apply easing if provided
  if (easing) t = easing(t);

  return outMin + t * (outMax - outMin);
}

/**
 * Interpolate across multiple values.
 *
 * @example
 * const color = interpolateMultiple(progress, [0, 0.5, 1], ['#ff0000', '#00ff00', '#0000ff']);
 */
export function interpolateMultiple(
  input: number,
  inputRange: number[],
  outputRange: number[],
  options?: { easing?: EasingFunction }
): number {
  if (inputRange.length !== outputRange.length || inputRange.length < 2) {
    throw new Error('Input and output ranges must have the same length and at least 2 values');
  }

  // Find the segment we're in
  let segmentIndex = 0;
  for (let i = 0; i < inputRange.length - 1; i++) {
    if (input >= inputRange[i] && input <= inputRange[i + 1]) {
      segmentIndex = i;
      break;
    }
    if (input > inputRange[i + 1]) {
      segmentIndex = i + 1;
    }
  }

  const clampedIndex = Math.min(segmentIndex, inputRange.length - 2);
  return interpolate(
    input,
    [inputRange[clampedIndex], inputRange[clampedIndex + 1]],
    [outputRange[clampedIndex], outputRange[clampedIndex + 1]],
    options
  );
}

/**
 * Simple linear animation progress based on frames.
 */
export function linear(frame: number, durationFrames: number): number {
  return Math.min(1, frame / durationFrames);
}

// ============================================================================
// Spring Presets
// ============================================================================

/** Common spring configurations for different use cases */
export const springPresets = {
  /** Default - smooth, versatile */
  default: { durationFrames: 20, easing: easeOutCubic } as SpringConfig,

  /** Snappy - quick response */
  snappy: { durationFrames: 12, easing: easeOutCubic } as SpringConfig,

  /** Slow - deliberate, dramatic */
  slow: { durationFrames: 40, easing: easeOutCubic } as SpringConfig,

  /** Gentle - subtle motion */
  gentle: { durationFrames: 30, easing: easeOutCubic } as SpringConfig,

  /** Stagger item delay */
  staggerDelay: 5,
} as const;

/** Physics spring presets for natural motion */
export const physicsPresets = {
  /** Default - balanced */
  default: { stiffness: 170, damping: 26, mass: 1 } as PhysicsSpringConfig,

  /** Gentle - slow, smooth */
  gentle: { stiffness: 120, damping: 20, mass: 1 } as PhysicsSpringConfig,

  /** Wobbly - playful bounce */
  wobbly: { stiffness: 180, damping: 12, mass: 1 } as PhysicsSpringConfig,

  /** Stiff - quick, no bounce */
  stiff: { stiffness: 400, damping: 40, mass: 1 } as PhysicsSpringConfig,

  /** Slow - dramatic, heavy */
  slow: { stiffness: 100, damping: 30, mass: 2 } as PhysicsSpringConfig,
} as const;
