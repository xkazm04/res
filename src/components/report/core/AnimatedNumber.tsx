'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useReportTheme } from './ThemeContext';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  className?: string;
}

// Easing function for smooth deceleration (ease-out cubic)
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function AnimatedNumber({
  value,
  duration = 1,
  suffix = '',
  prefix = '',
  decimals = 0,
  className = '',
}: AnimatedNumberProps) {
  const { reducedMotion } = useReportTheme();
  const [displayValue, setDisplayValue] = useState(value);
  const animationRef = useRef<number | null>(null);
  const startValueRef = useRef(value);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // For reduced motion, just set the value immediately
    if (reducedMotion) {
      setDisplayValue(value);
      return;
    }

    const startValue = startValueRef.current;
    const targetValue = value;
    const durationMs = duration * 1000;

    // Cancel any existing animation
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
    }

    // If values are the same, no animation needed
    if (startValue === targetValue) {
      return;
    }

    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / durationMs, 1);
      const easedProgress = easeOutCubic(progress);

      const currentValue = startValue + (targetValue - startValue) * easedProgress;
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete, update start value for next animation
        startValueRef.current = targetValue;
        animationRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration, reducedMotion]);

  // Update startValueRef when animation completes or is interrupted
  useEffect(() => {
    return () => {
      startValueRef.current = displayValue;
    };
  }, [displayValue]);

  return (
    <span className={className}>
      {prefix}{displayValue.toFixed(decimals)}{suffix}
    </span>
  );
}

interface AnimatedProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  showValue?: boolean;
  className?: string;
  /** Accessible label describing what this progress ring represents */
  'aria-label'?: string;
}

export function AnimatedProgressRing({
  value,
  size = 60,
  strokeWidth = 4,
  color = 'currentColor',
  bgColor = 'rgba(255,255,255,0.1)',
  showValue = true,
  className = '',
  'aria-label': ariaLabel,
}: AnimatedProgressRingProps) {
  const { reducedMotion } = useReportTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(100, Math.max(0, value));
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel || 'Progress'}
      aria-live="polite"
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress ring - static or animated based on reduced motion preference */}
        {reducedMotion ? (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        ) : (
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{ strokeDasharray: circumference }}
          />
        )}
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <AnimatedNumber value={progress} suffix="%" className="text-xs font-bold" />
        </div>
      )}
    </div>
  );
}

export function PulsingDot({ color = 'bg-blue-500', size = 'w-2 h-2' }: { color?: string; size?: string }) {
  const { reducedMotion } = useReportTheme();

  // Skip pulsing animation when reduced motion is enabled
  if (reducedMotion) {
    return <span className={`inline-flex rounded-full ${size} ${color}`} />;
  }

  return (
    <span className="relative flex">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75`} />
      <span className={`relative inline-flex rounded-full ${size} ${color}`} />
    </span>
  );
}
