'use client';

/**
 * AnimatedValue - A data visualization primitive for animated value changes.
 *
 * Animation in data-heavy interfaces serves a cognitive purpose - it directs
 * attention to what changed. This module provides a systematic approach to
 * animation-on-change for any data type.
 *
 * @example
 * // Number animation
 * <AnimatedValue value={score}>
 *   {(v) => <span>{v.toFixed(1)}</span>}
 * </AnimatedValue>
 *
 * @example
 * // String animation with crossfade
 * <AnimatedText value={status} />
 *
 * @example
 * // List animation with stagger
 * <AnimatedList items={findings}>
 *   {(item) => <FindingCard {...item} />}
 * </AnimatedList>
 */

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type ReactNode,
  type CSSProperties,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReportTheme } from './ThemeContext';
import { easeOutCubic, easeOutQuart, type EasingFunction } from '@/src/lib/animation';

// =============================================================================
// Types
// =============================================================================

/** Transition visualization style */
export type TransitionStyle =
  | 'instant'     // No animation
  | 'tween'       // Linear interpolation (numbers)
  | 'crossfade'   // Fade out old, fade in new
  | 'slide'       // Slide direction based on value change
  | 'morph'       // Smooth transform between values
  | 'flash'       // Brief highlight on change
  | 'pulse'       // Pulse effect on change
  | 'scale'       // Scale bounce on change
  | 'count';      // Counting animation for numbers

/** Direction hint for directional animations */
export type ChangeDirection = 'up' | 'down' | 'left' | 'right' | 'auto';

export interface AnimatedValueConfig {
  /** Animation duration in milliseconds */
  duration?: number;
  /** Delay before animation starts */
  delay?: number;
  /** Easing function */
  easing?: EasingFunction;
  /** Transition visualization style */
  transitionStyle?: TransitionStyle;
  /** Direction for slide animations ('auto' detects from value) */
  direction?: ChangeDirection;
  /** Flash/highlight color on change */
  highlightColor?: string;
  /** Whether to animate on initial mount */
  animateOnMount?: boolean;
  /** Custom CSS class applied during transition */
  transitionClassName?: string;
}

export interface AnimatedValueProps<T> extends AnimatedValueConfig {
  /** The value to animate */
  value: T;
  /** Render function receiving the animated value */
  children: (animatedValue: T, isAnimating: boolean) => ReactNode;
  /** Compare function to detect changes (default: strict equality) */
  compareValues?: (prev: T, next: T) => boolean;
  /** Interpolation function for custom types (required for non-number types with tween) */
  interpolate?: (from: T, to: T, progress: number) => T;
  /** Additional className */
  className?: string;
  /** Additional styles */
  style?: CSSProperties;
}

// =============================================================================
// Hook: useValueTransition
// =============================================================================

interface UseValueTransitionOptions<T> {
  duration?: number;
  easing?: EasingFunction;
  interpolate?: (from: T, to: T, progress: number) => T;
  compareValues?: (prev: T, next: T) => boolean;
  reducedMotion?: boolean;
}

interface ValueTransitionState<T> {
  displayValue: T;
  isAnimating: boolean;
  previousValue: T | null;
  direction: 'increase' | 'decrease' | 'change' | null;
}

/**
 * Hook that manages animated transitions between values.
 */
export function useValueTransition<T>(
  value: T,
  options: UseValueTransitionOptions<T> = {}
): ValueTransitionState<T> {
  const {
    duration = 300,
    easing = easeOutCubic,
    interpolate,
    compareValues = (a, b) => a === b,
    reducedMotion = false,
  } = options;

  const [state, setState] = useState<ValueTransitionState<T>>({
    displayValue: value,
    isAnimating: false,
    previousValue: null,
    direction: null,
  });

  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const startValueRef = useRef<T>(value);

  // Detect direction for numeric values
  const detectDirection = useCallback(
    (prev: T, next: T): 'increase' | 'decrease' | 'change' => {
      if (typeof prev === 'number' && typeof next === 'number') {
        return next > prev ? 'increase' : next < prev ? 'decrease' : 'change';
      }
      return 'change';
    },
    []
  );

  useEffect(() => {
    // No animation needed if values are equal
    if (compareValues(startValueRef.current, value)) {
      return;
    }

    // For reduced motion, just update immediately
    if (reducedMotion) {
      setState({
        displayValue: value,
        isAnimating: false,
        previousValue: startValueRef.current,
        direction: detectDirection(startValueRef.current, value),
      });
      startValueRef.current = value;
      return;
    }

    // Cancel any existing animation
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
    }

    const fromValue = startValueRef.current;
    const toValue = value;
    const direction = detectDirection(fromValue, toValue);
    startTimeRef.current = null;

    // Set animating state
    setState((s) => ({
      ...s,
      isAnimating: true,
      previousValue: fromValue,
      direction,
    }));

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const rawProgress = Math.min(elapsed / duration, 1);
      const progress = easing(rawProgress);

      // Interpolate value
      let displayValue: T;
      if (interpolate) {
        displayValue = interpolate(fromValue, toValue, progress);
      } else if (typeof fromValue === 'number' && typeof toValue === 'number') {
        displayValue = (fromValue + (toValue - fromValue) * progress) as T;
      } else {
        // For non-interpolatable types, snap at midpoint
        displayValue = progress < 0.5 ? fromValue : toValue;
      }

      setState((s) => ({
        ...s,
        displayValue,
      }));

      if (rawProgress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
        startValueRef.current = toValue;
        setState({
          displayValue: toValue,
          isAnimating: false,
          previousValue: fromValue,
          direction,
        });
        animationRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration, easing, interpolate, compareValues, reducedMotion, detectDirection]);

  return state;
}

// =============================================================================
// Component: AnimatedValue
// =============================================================================

/**
 * Universal primitive for animating any changing value.
 *
 * Wraps a value with configurable transition visualization,
 * helping users track what changed in data-heavy interfaces.
 */
export function AnimatedValue<T>({
  value,
  children,
  duration = 300,
  delay = 0,
  easing = easeOutCubic,
  transitionStyle = 'tween',
  direction = 'auto',
  highlightColor,
  animateOnMount = false,
  transitionClassName,
  compareValues,
  interpolate,
  className = '',
  style,
}: AnimatedValueProps<T>) {
  const { reducedMotion, theme } = useReportTheme();
  const isFirstRender = useRef(true);
  const [showHighlight, setShowHighlight] = useState(false);

  // Determine effective transition style
  const effectiveStyle = reducedMotion ? 'instant' : transitionStyle;

  // Use transition hook
  const { displayValue, isAnimating, previousValue, direction: changeDirection } =
    useValueTransition(value, {
      duration,
      easing,
      interpolate,
      compareValues,
      reducedMotion: effectiveStyle === 'instant',
    });

  // Handle highlight effect
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (!animateOnMount) return;
    }

    if (
      (effectiveStyle === 'flash' || effectiveStyle === 'pulse') &&
      previousValue !== null
    ) {
      setShowHighlight(true);
      const timer = setTimeout(() => setShowHighlight(false), duration);
      return () => clearTimeout(timer);
    }
  }, [value, effectiveStyle, duration, animateOnMount, previousValue]);

  // Compute slide direction
  const slideDirection = useMemo(() => {
    if (direction !== 'auto') return direction;
    if (changeDirection === 'increase') return 'up';
    if (changeDirection === 'decrease') return 'down';
    return 'up';
  }, [direction, changeDirection]);

  // Default highlight color based on theme
  const effectiveHighlightColor = highlightColor || (theme === 'swiss' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.15)');

  // Render based on transition style
  const renderContent = () => {
    const content = children(displayValue, isAnimating);

    switch (effectiveStyle) {
      case 'flash':
        return (
          <span
            className={`animated-value-flash ${transitionClassName || ''}`}
            style={{
              backgroundColor: showHighlight ? effectiveHighlightColor : 'transparent',
              transition: `background-color ${duration}ms ease-out`,
              borderRadius: '2px',
              padding: '0 2px',
              margin: '0 -2px',
            }}
          >
            {content}
          </span>
        );

      case 'pulse':
        return (
          <span
            className={`animated-value-pulse ${transitionClassName || ''}`}
            style={{
              transform: showHighlight ? 'scale(1.05)' : 'scale(1)',
              transition: `transform ${duration}ms ease-out`,
              display: 'inline-block',
            }}
          >
            {content}
          </span>
        );

      case 'scale':
        return (
          <motion.span
            className={`animated-value-scale ${transitionClassName || ''}`}
            animate={{ scale: isAnimating ? [1, 1.1, 1] : 1 }}
            transition={{ duration: duration / 1000 }}
            style={{ display: 'inline-block' }}
          >
            {content}
          </motion.span>
        );

      default:
        return content;
    }
  };

  return (
    <span
      className={`animated-value ${className}`}
      style={{
        ...style,
        transitionDelay: delay > 0 ? `${delay}ms` : undefined,
      }}
      data-animating={isAnimating}
      data-direction={changeDirection}
    >
      {renderContent()}
    </span>
  );
}

// =============================================================================
// Component: AnimatedNumber (Enhanced)
// =============================================================================

export interface AnimatedNumberEnhancedProps extends Omit<AnimatedValueConfig, 'transitionStyle'> {
  /** The numeric value to animate */
  value: number;
  /** Number of decimal places */
  decimals?: number;
  /** Prefix (e.g., "$") */
  prefix?: string;
  /** Suffix (e.g., "%") */
  suffix?: string;
  /** Format function for custom number formatting */
  format?: (value: number) => string;
  /** Transition style (defaults to 'count' for numbers) */
  transitionStyle?: TransitionStyle;
  /** Additional className */
  className?: string;
}

/**
 * Enhanced animated number with formatting support.
 */
export function AnimatedNumberEnhanced({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  format,
  transitionStyle = 'count',
  className = '',
  ...config
}: AnimatedNumberEnhancedProps) {
  const formatValue = useCallback(
    (v: number) => {
      if (format) return format(v);
      return v.toFixed(decimals);
    },
    [format, decimals]
  );

  return (
    <AnimatedValue
      value={value}
      transitionStyle={transitionStyle}
      className={className}
      {...config}
    >
      {(animatedValue) => (
        <>
          {prefix}
          {formatValue(animatedValue)}
          {suffix}
        </>
      )}
    </AnimatedValue>
  );
}

// =============================================================================
// Component: AnimatedText
// =============================================================================

export interface AnimatedTextProps extends AnimatedValueConfig {
  /** The text value to animate */
  value: string;
  /** Additional className */
  className?: string;
  /** Text element to render as */
  as?: 'span' | 'p' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

/**
 * Animated text with crossfade transition on change.
 */
export function AnimatedText({
  value,
  transitionStyle = 'crossfade',
  duration = 200,
  className = '',
  as: Tag = 'span',
  ...config
}: AnimatedTextProps) {
  const { reducedMotion } = useReportTheme();
  const [currentValue, setCurrentValue] = useState(value);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (value === currentValue) return;

    if (reducedMotion || transitionStyle === 'instant') {
      setCurrentValue(value);
      return;
    }

    // Trigger exit animation
    setIsExiting(true);
    const timer = setTimeout(() => {
      setCurrentValue(value);
      setIsExiting(false);
    }, duration / 2);

    return () => clearTimeout(timer);
  }, [value, currentValue, duration, reducedMotion, transitionStyle]);

  if (transitionStyle === 'crossfade' && !reducedMotion) {
    return (
      <AnimatePresence mode="wait">
        <motion.span
          key={currentValue}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: duration / 1000 }}
          className={className}
        >
          <Tag>{currentValue}</Tag>
        </motion.span>
      </AnimatePresence>
    );
  }

  if (transitionStyle === 'slide' && !reducedMotion) {
    return (
      <AnimatePresence mode="wait">
        <motion.span
          key={currentValue}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: duration / 1000, ease: 'easeOut' }}
          className={className}
        >
          <Tag>{currentValue}</Tag>
        </motion.span>
      </AnimatePresence>
    );
  }

  return (
    <Tag
      className={`${className} ${isExiting ? 'opacity-50' : ''}`}
      style={{
        transition: `opacity ${duration}ms ease-out`,
      }}
    >
      {currentValue}
    </Tag>
  );
}

// =============================================================================
// Component: AnimatedList
// =============================================================================

export interface AnimatedListProps<T> {
  /** Items to render */
  items: T[];
  /** Render function for each item */
  children: (item: T, index: number, isAnimating: boolean) => ReactNode;
  /** Key extractor */
  keyExtractor: (item: T, index: number) => string | number;
  /** Stagger delay between items (ms) */
  staggerDelay?: number;
  /** Animation duration per item (ms) */
  duration?: number;
  /** Animation direction */
  direction?: 'up' | 'down' | 'left' | 'right';
  /** Distance to animate from */
  distance?: number;
  /** Additional className for container */
  className?: string;
  /** Additional className for items */
  itemClassName?: string;
}

/**
 * Animated list with staggered entry/exit animations.
 */
export function AnimatedList<T>({
  items,
  children,
  keyExtractor,
  staggerDelay = 50,
  duration = 300,
  direction = 'up',
  distance = 20,
  className = '',
  itemClassName = '',
}: AnimatedListProps<T>) {
  const { reducedMotion } = useReportTheme();

  // Compute initial position based on direction
  const getInitialPosition = useCallback(() => {
    switch (direction) {
      case 'up':
        return { y: distance, x: 0 };
      case 'down':
        return { y: -distance, x: 0 };
      case 'left':
        return { y: 0, x: distance };
      case 'right':
        return { y: 0, x: -distance };
    }
  }, [direction, distance]);

  if (reducedMotion) {
    return (
      <div className={className}>
        {items.map((item, index) => (
          <div key={keyExtractor(item, index)} className={itemClassName}>
            {children(item, index, false)}
          </div>
        ))}
      </div>
    );
  }

  const initial = getInitialPosition();

  return (
    <div className={className}>
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => (
          <motion.div
            key={keyExtractor(item, index)}
            layout
            initial={{ opacity: 0, ...initial }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
              duration: duration / 1000,
              delay: (index * staggerDelay) / 1000,
              ease: 'easeOut',
            }}
            className={itemClassName}
          >
            {children(item, index, false)}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// Component: AnimatedPresence
// =============================================================================

export interface AnimatedPresenceProps {
  /** Whether content is visible */
  show: boolean;
  /** Content to animate */
  children: ReactNode;
  /** Animation type */
  type?: 'fade' | 'slide' | 'scale' | 'slideUp' | 'slideDown';
  /** Duration in ms */
  duration?: number;
  /** Additional className */
  className?: string;
}

/**
 * Wrapper for conditional rendering with enter/exit animations.
 */
export function AnimatedPresenceWrapper({
  show,
  children,
  type = 'fade',
  duration = 200,
  className = '',
}: AnimatedPresenceProps) {
  const { reducedMotion } = useReportTheme();

  if (reducedMotion) {
    return show ? <div className={className}>{children}</div> : null;
  }

  const variants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    scale: {
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.9 },
    },
    slide: {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 },
    },
    slideUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
    },
    slideDown: {
      initial: { opacity: 0, y: -20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 20 },
    },
  };

  const variant = variants[type];

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          initial={variant.initial}
          animate={variant.animate}
          exit={variant.exit}
          transition={{ duration: duration / 1000, ease: 'easeOut' }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// =============================================================================
// Component: AnimatedDiff
// =============================================================================

export interface AnimatedDiffProps {
  /** Previous value */
  previous: number;
  /** Current value */
  current: number;
  /** Format function */
  format?: (value: number, diff: number) => string;
  /** Show direction indicator */
  showDirection?: boolean;
  /** Duration in ms */
  duration?: number;
  /** Additional className */
  className?: string;
}

/**
 * Shows animated difference between two values with direction indicator.
 */
export function AnimatedDiff({
  previous,
  current,
  format,
  showDirection = true,
  duration = 300,
  className = '',
}: AnimatedDiffProps) {
  const diff = current - previous;
  const isPositive = diff > 0;
  const isNegative = diff < 0;

  const formatDiff = useCallback(
    (val: number, d: number) => {
      if (format) return format(val, d);
      const sign = d > 0 ? '+' : '';
      return `${sign}${d.toFixed(0)}`;
    },
    [format]
  );

  if (diff === 0) return null;

  return (
    <AnimatedValue
      value={diff}
      duration={duration}
      transitionStyle="scale"
      className={className}
    >
      {(animatedDiff) => (
        <span
          className={`inline-flex items-center gap-1 text-sm font-medium ${
            isPositive ? 'text-emerald-500' : isNegative ? 'text-red-500' : 'text-gray-500'
          }`}
        >
          {showDirection && (
            <span className="text-xs">
              {isPositive ? '↑' : isNegative ? '↓' : ''}
            </span>
          )}
          {formatDiff(animatedDiff, diff)}
        </span>
      )}
    </AnimatedValue>
  );
}

// =============================================================================
// Component: AnimatedScore
// =============================================================================

export interface AnimatedScoreProps {
  /** Score value (0-100) */
  value: number;
  /** Label for the score */
  label?: string;
  /** Whether to show change indicator */
  showChange?: boolean;
  /** Previous value for change calculation */
  previousValue?: number;
  /** Duration in ms */
  duration?: number;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional className */
  className?: string;
}

/**
 * Animated score display with optional change indicator.
 */
export function AnimatedScore({
  value,
  label,
  showChange = false,
  previousValue,
  duration = 500,
  size = 'md',
  className = '',
}: AnimatedScoreProps) {
  const { theme } = useReportTheme();

  const sizeStyles = {
    sm: 'text-lg font-semibold',
    md: 'text-2xl font-bold',
    lg: 'text-4xl font-black',
  };

  // Color based on score
  const getScoreColor = useCallback((score: number) => {
    if (score >= 80) return theme === 'swiss' ? 'text-black' : 'text-emerald-400';
    if (score >= 60) return theme === 'swiss' ? 'text-gray-700' : 'text-blue-400';
    if (score >= 40) return theme === 'swiss' ? 'text-gray-500' : 'text-yellow-400';
    return theme === 'swiss' ? 'text-gray-400' : 'text-red-400';
  }, [theme]);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <AnimatedValue
        value={value}
        duration={duration}
        transitionStyle="count"
        easing={easeOutQuart}
      >
        {(animatedValue) => (
          <span className={`${sizeStyles[size]} ${getScoreColor(animatedValue)}`}>
            {Math.round(animatedValue)}
          </span>
        )}
      </AnimatedValue>

      {label && (
        <span className="text-xs text-gray-500 uppercase tracking-wider mt-1">
          {label}
        </span>
      )}

      {showChange && previousValue !== undefined && previousValue !== value && (
        <AnimatedDiff
          previous={previousValue}
          current={value}
          duration={duration}
          className="mt-1"
        />
      )}
    </div>
  );
}

// =============================================================================
// Hook: useAnimationOnChange
// =============================================================================

interface UseAnimationOnChangeOptions {
  /** Duration of the animation state */
  duration?: number;
  /** Callback when animation starts */
  onAnimationStart?: () => void;
  /** Callback when animation ends */
  onAnimationEnd?: () => void;
}

/**
 * Hook that tracks when a value changes and provides animation state.
 *
 * @example
 * const { isAnimating, direction } = useAnimationOnChange(count);
 * return <div className={isAnimating ? 'pulse' : ''}>{count}</div>;
 */
export function useAnimationOnChange<T>(
  value: T,
  options: UseAnimationOnChangeOptions = {}
): {
  isAnimating: boolean;
  direction: 'increase' | 'decrease' | 'change' | null;
  previousValue: T | null;
} {
  const { duration = 300, onAnimationStart, onAnimationEnd } = options;
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'increase' | 'decrease' | 'change' | null>(null);
  const [previousValue, setPreviousValue] = useState<T | null>(null);
  const prevValueRef = useRef(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (prevValueRef.current === value) return;

    // Determine direction
    let newDirection: 'increase' | 'decrease' | 'change' = 'change';
    if (typeof prevValueRef.current === 'number' && typeof value === 'number') {
      newDirection = value > prevValueRef.current ? 'increase' : 'decrease';
    }

    setPreviousValue(prevValueRef.current);
    setDirection(newDirection);
    setIsAnimating(true);
    onAnimationStart?.();

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set timeout to end animation
    timeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
      setDirection(null);
      onAnimationEnd?.();
    }, duration);

    prevValueRef.current = value;

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, duration, onAnimationStart, onAnimationEnd]);

  return { isAnimating, direction, previousValue };
}

// =============================================================================
// Exports
// =============================================================================

export {
  AnimatedValue as default,
};
