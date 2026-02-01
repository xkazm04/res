/**
 * Unified Animation Library
 *
 * A consolidated animation system providing consistent timing, easing,
 * and transitions across all visualizations and video components.
 *
 * @example
 * // Frame-based animation (video)
 * import { spring, easeOutCubic, Slide, Stagger } from '@/src/lib/animation';
 *
 * function VideoScene({ frame, fps }) {
 *   const progress = spring({ frame, fps, delay: 10, durationFrames: 20 });
 *   return (
 *     <Slide frame={frame} fps={fps} direction="up">
 *       <div style={{ opacity: progress }}>Content</div>
 *     </Slide>
 *   );
 * }
 *
 * @example
 * // React hooks (UI components)
 * import { useSpring, useStagger, useReveal } from '@/src/lib/animation';
 *
 * function AnimatedList({ items }) {
 *   const getProgress = useStagger({ staggerDelay: 50 });
 *   return items.map((item, i) => (
 *     <div key={i} style={{ opacity: getProgress(i) }}>{item}</div>
 *   ));
 * }
 */

// ============================================================================
// Easing Functions
// ============================================================================

export {
  // Cubic (most common)
  easeInCubic,
  easeOutCubic,
  easeInOutCubic,

  // Quart (dramatic)
  easeInQuart,
  easeOutQuart,
  easeInOutQuart,

  // Quint (most dramatic)
  easeInQuint,
  easeOutQuint,
  easeInOutQuint,

  // Expo (snappy)
  easeInExpo,
  easeOutExpo,
  easeInOutExpo,

  // Sine (gentle)
  easeInSine,
  easeOutSine,
  easeInOutSine,

  // Circ (physical)
  easeInCirc,
  easeOutCirc,
  easeInOutCirc,

  // Back (overshoot)
  easeInBack,
  easeOutBack,
  easeInOutBack,

  // Elastic (bouncy)
  easeInElastic,
  easeOutElastic,
  easeInOutElastic,

  // Bounce
  easeInBounce,
  easeOutBounce,
  easeInOutBounce,

  // Linear
  linear as linearEasing,

  // Presets
  easingPresets,

  // Types
  type EasingFunction,
} from './easing';

// ============================================================================
// Spring Physics
// ============================================================================

export {
  // Frame-based spring
  spring,
  staggeredSpring,

  // Time-based spring
  timeSpring,

  // Physics spring
  physicsSpring,

  // Interpolation
  interpolate,
  interpolateMultiple,

  // Linear animation
  linear,

  // Presets
  springPresets,
  physicsPresets,

  // Types
  type SpringConfig,
  type TimeSpringConfig,
  type PhysicsSpringConfig,
  type PhysicsSpringState,
} from './spring';

// ============================================================================
// React Hooks
// ============================================================================

export {
  // Core hooks
  useSpring,
  useSpringTrigger,
  useStagger,
  useReveal,

  // Advanced hooks
  usePhysicsSpring,
  usePulse,
  useAnimatedValue,

  // Types
  type UseSpringOptions,
  type UseStaggerOptions,
  type UseRevealOptions,
  type RevealStyles,
} from './hooks';

// ============================================================================
// Transition Components
// ============================================================================

export {
  // Basic transitions
  Crossfade,
  Slide,
  Scale,
  Stagger,
  Reveal,
  Zoom,

  // Special effects
  CountUp,
  Pulse,
  Typewriter,
  FadeInOut,

  // Presets
  transitionPresets,
} from './transitions';
