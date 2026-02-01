'use client';

/**
 * React hooks for animations.
 *
 * Provides hooks for spring animations, staggered reveals, and other
 * common animation patterns with theme-awareness.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { spring, timeSpring, physicsSpring, interpolate, type TimeSpringConfig, type PhysicsSpringConfig } from './spring';
import { easeOutCubic, type EasingFunction } from './easing';

// ============================================================================
// Types
// ============================================================================

export interface UseSpringOptions {
  /** Animation duration in milliseconds */
  duration?: number;
  /** Delay before animation starts */
  delay?: number;
  /** Easing function */
  easing?: EasingFunction;
  /** Whether to animate on initial mount */
  animateOnMount?: boolean;
}

export interface UseStaggerOptions extends UseSpringOptions {
  /** Delay between each item in milliseconds */
  staggerDelay?: number;
}

export interface UseRevealOptions extends UseSpringOptions {
  /** Direction of reveal */
  direction?: 'left' | 'right' | 'up' | 'down';
  /** Distance to slide (in pixels) */
  distance?: number;
  /** Whether to trigger based on viewport visibility */
  triggerOnVisible?: boolean;
}

// ============================================================================
// useSpring - Animate a value from 0 to 1
// ============================================================================

/**
 * Animate a value from 0 to 1 with spring physics.
 *
 * @example
 * const progress = useSpring({ duration: 300, delay: 100 });
 * return <div style={{ opacity: progress }}>Fading in</div>;
 */
export function useSpring(options: UseSpringOptions = {}): number {
  const {
    duration = 300,
    delay = 0,
    easing = easeOutCubic,
    animateOnMount = true,
  } = options;

  const [progress, setProgress] = useState(animateOnMount ? 0 : 1);
  const startTimeRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!animateOnMount) return;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;

      const value = timeSpring(elapsed, { duration, delay, easing });
      setProgress(value);

      if (value < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [duration, delay, easing, animateOnMount]);

  return progress;
}

/**
 * Manually trigger spring animation.
 *
 * @example
 * const [progress, trigger] = useSpringTrigger({ duration: 300 });
 * return <button onClick={trigger}>Animate: {progress}</button>;
 */
export function useSpringTrigger(
  options: Omit<UseSpringOptions, 'animateOnMount'> = {}
): [number, () => void, () => void] {
  const { duration = 300, delay = 0, easing = easeOutCubic } = options;

  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const isForward = useRef(true);

  const animate = useCallback((timestamp: number) => {
    if (!startTimeRef.current) startTimeRef.current = timestamp;
    const elapsed = timestamp - startTimeRef.current;

    let value = timeSpring(elapsed, { duration, delay, easing });
    if (!isForward.current) value = 1 - value;

    setProgress(value);

    const isComplete = isForward.current ? value >= 1 : value <= 0;
    if (!isComplete) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [duration, delay, easing]);

  const trigger = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    isForward.current = true;
    startTimeRef.current = null;
    animationRef.current = requestAnimationFrame(animate);
  }, [animate]);

  const reverse = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    isForward.current = false;
    startTimeRef.current = null;
    animationRef.current = requestAnimationFrame(animate);
  }, [animate]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return [progress, trigger, reverse];
}

// ============================================================================
// useStagger - Staggered animations for lists
// ============================================================================

/**
 * Get staggered animation progress for list items.
 *
 * @example
 * const getProgress = useStagger({ staggerDelay: 50, duration: 300 });
 * return items.map((item, i) => (
 *   <div key={i} style={{ opacity: getProgress(i) }}>{item}</div>
 * ));
 */
export function useStagger(options: UseStaggerOptions = {}): (index: number) => number {
  const {
    duration = 300,
    delay = 0,
    staggerDelay = 50,
    easing = easeOutCubic,
    animateOnMount = true,
  } = options;

  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!animateOnMount) return;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      setElapsed(timestamp - startTimeRef.current);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animateOnMount]);

  const getProgress = useCallback(
    (index: number) => {
      const itemDelay = delay + index * staggerDelay;
      return timeSpring(elapsed, { duration, delay: itemDelay, easing });
    },
    [elapsed, delay, staggerDelay, duration, easing]
  );

  return getProgress;
}

// ============================================================================
// useReveal - Slide + fade reveal animation
// ============================================================================

export interface RevealStyles {
  opacity: number;
  transform: string;
}

/**
 * Get styles for reveal animation (slide + fade).
 *
 * @example
 * const styles = useReveal({ direction: 'up', distance: 20 });
 * return <div style={styles}>Revealing content</div>;
 */
export function useReveal(options: UseRevealOptions = {}): RevealStyles {
  const {
    duration = 400,
    delay = 0,
    easing = easeOutCubic,
    direction = 'up',
    distance = 20,
    animateOnMount = true,
  } = options;

  const progress = useSpring({ duration, delay, easing, animateOnMount });

  const styles = useMemo(() => {
    const remaining = 1 - progress;
    const transforms: Record<string, string> = {
      left: `translateX(${remaining * -distance}px)`,
      right: `translateX(${remaining * distance}px)`,
      up: `translateY(${remaining * distance}px)`,
      down: `translateY(${remaining * -distance}px)`,
    };

    return {
      opacity: progress,
      transform: transforms[direction],
    };
  }, [progress, direction, distance]);

  return styles;
}

// ============================================================================
// usePhysicsSpring - Physics-based spring with target
// ============================================================================

/**
 * Physics-based spring that follows a target value.
 *
 * @example
 * const [value, setTarget] = usePhysicsSpring(0);
 * return (
 *   <div
 *     style={{ transform: `translateX(${value}px)` }}
 *     onMouseEnter={() => setTarget(100)}
 *     onMouseLeave={() => setTarget(0)}
 *   />
 * );
 */
export function usePhysicsSpring(
  initialValue: number,
  config: PhysicsSpringConfig = {}
): [number, (target: number) => void] {
  const [state, setState] = useState({
    value: initialValue,
    target: initialValue,
    velocity: 0,
  });

  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const setTarget = useCallback((newTarget: number) => {
    setState((s) => ({ ...s, target: newTarget }));
  }, []);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaMs = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      setState((s) => {
        if (Math.abs(s.target - s.value) < 0.01 && Math.abs(s.velocity) < 0.01) {
          return { ...s, value: s.target, velocity: 0 };
        }

        const result = physicsSpring(s.value, s.target, s.velocity, deltaMs, config);
        return { ...s, value: result.value, velocity: result.velocity };
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [config]);

  return [state.value, setTarget];
}

// ============================================================================
// usePulse - Continuous pulsing animation
// ============================================================================

/**
 * Continuous pulsing animation for ambient effects.
 *
 * @example
 * const pulse = usePulse({ frequency: 2 }); // 2 cycles per second
 * return <div style={{ opacity: 0.5 + pulse * 0.5 }}>Pulsing</div>;
 */
export function usePulse(options: { frequency?: number } = {}): number {
  const { frequency = 1 } = options;
  const [value, setValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = (timestamp - startTimeRef.current) / 1000;
      setValue(Math.sin(elapsed * frequency * Math.PI * 2) * 0.5 + 0.5);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [frequency]);

  return value;
}

// ============================================================================
// useAnimatedValue - Smooth value transitions
// ============================================================================

/**
 * Smoothly animate between numeric values.
 *
 * @example
 * const [displayValue] = useAnimatedValue(count, { duration: 200 });
 * return <span>{Math.round(displayValue)}</span>;
 */
export function useAnimatedValue(
  targetValue: number,
  options: TimeSpringConfig = {}
): [number] {
  const { duration = 200, easing = easeOutCubic } = options;
  const [value, setValue] = useState(targetValue);
  const previousValueRef = useRef(targetValue);
  const startTimeRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (targetValue === previousValueRef.current) return;

    const startValue = value;
    const endValue = targetValue;
    previousValueRef.current = targetValue;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = timeSpring(elapsed, { duration, easing });

      setValue(startValue + (endValue - startValue) * progress);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetValue, duration, easing]);

  return [value];
}
