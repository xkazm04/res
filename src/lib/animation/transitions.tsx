'use client';

/**
 * Theme-aware transition components for consistent animations.
 *
 * These components provide ready-to-use animations that work with both
 * frame-based (video) and time-based (UI) animations.
 */

import React, { useMemo } from 'react';
import { spring, interpolate } from './spring';
import { easeOutCubic, easeInOutCubic, type EasingFunction } from './easing';

// ============================================================================
// Types
// ============================================================================

interface BaseTransitionProps {
  children: React.ReactNode;
}

interface FrameTransitionProps extends BaseTransitionProps {
  frame: number;
  fps: number;
  delay?: number;
  durationFrames?: number;
}

// ============================================================================
// Crossfade Transition
// ============================================================================

interface CrossfadeProps extends FrameTransitionProps {
  fadeInFrames?: number;
  fadeOutStart: number;
  fadeOutFrames?: number;
}

/**
 * Simple crossfade transition for video scenes.
 *
 * @example
 * <Crossfade frame={frame} fps={30} fadeOutStart={90}>
 *   <Content />
 * </Crossfade>
 */
export function Crossfade({
  frame,
  fps,
  fadeInFrames = 15,
  fadeOutStart,
  fadeOutFrames = 15,
  children,
}: CrossfadeProps) {
  const fadeIn = spring({ frame, fps, delay: 0, durationFrames: fadeInFrames, easing: easeOutCubic });
  const fadeOut = frame >= fadeOutStart
    ? 1 - spring({ frame: frame - fadeOutStart, fps, delay: 0, durationFrames: fadeOutFrames, easing: easeOutCubic })
    : 1;

  const opacity = Math.min(fadeIn, fadeOut);

  return <div style={{ opacity }}>{children}</div>;
}

// ============================================================================
// Slide Transition
// ============================================================================

interface SlideProps extends FrameTransitionProps {
  direction?: 'left' | 'right' | 'up' | 'down';
  distance?: number;
  easing?: EasingFunction;
}

/**
 * Slide with fade transition.
 *
 * @example
 * <Slide frame={frame} fps={30} direction="up" delay={10}>
 *   <Card />
 * </Slide>
 */
export function Slide({
  frame,
  fps,
  direction = 'up',
  delay = 0,
  durationFrames = 20,
  distance = 20,
  easing = easeOutCubic,
  children,
}: SlideProps) {
  const progress = spring({ frame, fps, delay, durationFrames, easing });

  const transforms: Record<string, string> = {
    left: `translateX(${(1 - progress) * -distance}px)`,
    right: `translateX(${(1 - progress) * distance}px)`,
    up: `translateY(${(1 - progress) * distance}px)`,
    down: `translateY(${(1 - progress) * -distance}px)`,
  };

  return (
    <div style={{ opacity: progress, transform: transforms[direction] }}>
      {children}
    </div>
  );
}

// ============================================================================
// Scale Transition
// ============================================================================

interface ScaleProps extends FrameTransitionProps {
  from?: number;
  easing?: EasingFunction;
}

/**
 * Scale with fade transition for emphasis.
 *
 * @example
 * <Scale frame={frame} fps={30} from={0.9}>
 *   <ImportantElement />
 * </Scale>
 */
export function Scale({
  frame,
  fps,
  delay = 0,
  durationFrames = 20,
  from = 0.85,
  easing = easeOutCubic,
  children,
}: ScaleProps) {
  const progress = spring({ frame, fps, delay, durationFrames, easing });

  return (
    <div style={{ opacity: progress, transform: `scale(${from + (1 - from) * progress})` }}>
      {children}
    </div>
  );
}

// ============================================================================
// Stagger Transition
// ============================================================================

interface StaggerProps extends FrameTransitionProps {
  index: number;
  stagger?: number;
  direction?: 'left' | 'right' | 'up';
  easing?: EasingFunction;
}

/**
 * Staggered animation for list items.
 *
 * @example
 * {items.map((item, i) => (
 *   <Stagger key={i} frame={frame} fps={30} index={i} stagger={3}>
 *     <ListItem>{item}</ListItem>
 *   </Stagger>
 * ))}
 */
export function Stagger({
  frame,
  fps,
  delay = 0,
  stagger = 5,
  durationFrames = 18,
  index,
  direction = 'right',
  easing = easeOutCubic,
  children,
}: StaggerProps) {
  const progress = spring({
    frame,
    fps,
    delay: delay + index * stagger,
    durationFrames,
    easing,
  });

  const transforms: Record<string, string> = {
    left: `translateX(${(1 - progress) * -20}px)`,
    right: `translateX(${(1 - progress) * 20}px)`,
    up: `translateY(${(1 - progress) * 15}px)`,
  };

  return (
    <div style={{ opacity: progress, transform: transforms[direction] }}>
      {children}
    </div>
  );
}

// ============================================================================
// Reveal Transition
// ============================================================================

interface RevealProps extends FrameTransitionProps {
  direction?: 'left' | 'right' | 'up' | 'down';
  easing?: EasingFunction;
}

/**
 * Reveal mask transition that clips content from a direction.
 *
 * @example
 * <Reveal frame={frame} fps={30} direction="left">
 *   <Image />
 * </Reveal>
 */
export function Reveal({
  frame,
  fps,
  delay = 0,
  durationFrames = 25,
  direction = 'left',
  easing = easeInOutCubic,
  children,
}: RevealProps) {
  const progress = spring({ frame, fps, delay, durationFrames, easing });

  const clipPaths: Record<string, string> = {
    left: `inset(0 ${(1 - progress) * 100}% 0 0)`,
    right: `inset(0 0 0 ${(1 - progress) * 100}%)`,
    up: `inset(${(1 - progress) * 100}% 0 0 0)`,
    down: `inset(0 0 ${(1 - progress) * 100}% 0)`,
  };

  return (
    <div style={{ clipPath: clipPaths[direction] }}>
      {children}
    </div>
  );
}

// ============================================================================
// CountUp Transition
// ============================================================================

interface CountUpProps {
  value: number;
  frame: number;
  fps: number;
  delay?: number;
  durationFrames?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  easing?: EasingFunction;
}

/**
 * Animated counter that counts up to a value.
 *
 * @example
 * <CountUp value={1234} frame={frame} fps={30} suffix="+" />
 */
export function CountUp({
  value,
  frame,
  fps,
  delay = 0,
  durationFrames = 30,
  decimals = 0,
  suffix = '',
  prefix = '',
  easing = easeOutCubic,
}: CountUpProps) {
  const progress = spring({ frame, fps, delay, durationFrames, easing });
  const current = value * progress;

  return <>{prefix}{current.toFixed(decimals)}{suffix}</>;
}

// ============================================================================
// Pulse Effect
// ============================================================================

interface PulseProps {
  frame: number;
  fps: number;
  intensity?: number;
  color: string;
}

/**
 * Background pulse effect for ambient animation.
 *
 * @example
 * <Pulse frame={frame} fps={30} color="#22d3ee" intensity={0.2} />
 */
export function Pulse({ frame, fps, intensity = 0.15, color }: PulseProps) {
  const cycle = (frame / fps) * Math.PI * 2;
  const pulse = Math.sin(cycle) * intensity + (1 - intensity);

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ backgroundColor: color, opacity: pulse * 0.1 }}
    />
  );
}

// ============================================================================
// Typewriter Effect
// ============================================================================

interface TypewriterProps {
  text: string;
  frame: number;
  fps: number;
  delay?: number;
  charsPerFrame?: number;
}

/**
 * Typewriter text reveal effect.
 *
 * @example
 * <Typewriter text="Hello, World!" frame={frame} fps={30} delay={10} />
 */
export function Typewriter({
  text,
  frame,
  fps,
  delay = 0,
  charsPerFrame = 0.5,
}: TypewriterProps) {
  const adjustedFrame = Math.max(0, frame - delay);
  const visibleChars = Math.min(text.length, Math.floor(adjustedFrame * charsPerFrame));

  return <>{text.slice(0, visibleChars)}</>;
}

// ============================================================================
// FadeInOut Transition
// ============================================================================

interface FadeInOutProps extends FrameTransitionProps {
  holdFrames?: number;
}

/**
 * Fade in, hold, and fade out transition.
 *
 * @example
 * <FadeInOut frame={frame} fps={30} durationFrames={15} holdFrames={60}>
 *   <Content />
 * </FadeInOut>
 */
export function FadeInOut({
  frame,
  fps,
  delay = 0,
  durationFrames = 15,
  holdFrames = 60,
  children,
}: FadeInOutProps) {
  const adjustedFrame = frame - delay;
  const totalFrames = durationFrames * 2 + holdFrames;

  let opacity = 0;
  if (adjustedFrame <= 0) {
    opacity = 0;
  } else if (adjustedFrame <= durationFrames) {
    // Fade in
    opacity = spring({ frame: adjustedFrame, fps, durationFrames, easing: easeOutCubic });
  } else if (adjustedFrame <= durationFrames + holdFrames) {
    // Hold
    opacity = 1;
  } else if (adjustedFrame <= totalFrames) {
    // Fade out
    const fadeOutFrame = adjustedFrame - durationFrames - holdFrames;
    opacity = 1 - spring({ frame: fadeOutFrame, fps, durationFrames, easing: easeOutCubic });
  }

  return <div style={{ opacity }}>{children}</div>;
}

// ============================================================================
// Zoom Transition
// ============================================================================

interface ZoomProps extends FrameTransitionProps {
  from?: number;
  to?: number;
  easing?: EasingFunction;
}

/**
 * Zoom transition (scale only, no fade).
 *
 * @example
 * <Zoom frame={frame} fps={30} from={0.8} to={1}>
 *   <Element />
 * </Zoom>
 */
export function Zoom({
  frame,
  fps,
  delay = 0,
  durationFrames = 20,
  from = 0.9,
  to = 1,
  easing = easeOutCubic,
  children,
}: ZoomProps) {
  const progress = spring({ frame, fps, delay, durationFrames, easing });
  const scale = from + (to - from) * progress;

  return (
    <div style={{ transform: `scale(${scale})` }}>
      {children}
    </div>
  );
}

// ============================================================================
// Transition Presets
// ============================================================================

/** Default transition configurations */
export const transitionPresets = {
  fadeIn: { durationFrames: 15 },
  fadeOut: { durationFrames: 12 },
  slideUp: { direction: 'up', durationFrames: 20, distance: 20 },
  slideDown: { direction: 'down', durationFrames: 20, distance: 20 },
  slideLeft: { direction: 'left', durationFrames: 20, distance: 20 },
  slideRight: { direction: 'right', durationFrames: 20, distance: 20 },
  scaleIn: { from: 0.9, durationFrames: 18 },
  stagger: { stagger: 5, durationFrames: 18 },
  reveal: { durationFrames: 25 },
} as const;
