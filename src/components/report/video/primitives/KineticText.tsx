'use client';

/**
 * KineticText — high-energy text animation component for video scenes.
 *
 * Replaces manual word-by-word spring patterns with 6 distinct animation modes
 * optimized for social media short-form video engagement.
 */

import { spring } from '@/src/lib/animation/spring';
import { easeOutBack, easeOutExpo, easeOutCubic } from '@/src/lib/animation/easing';
import { bounceIn, scalePunch } from '@/src/lib/animation/motion';

type KineticMode =
  | 'word-cascade'
  | 'letter-burst'
  | 'punch'
  | 'highlight'
  | 'typewriter'
  | 'gradient-sweep';

interface KineticTextProps {
  text: string;
  mode: KineticMode;
  frame: number;
  fps: number;
  startFrame?: number;
  className?: string;
  accentColor?: string;
  staggerFrames?: number;
  highlightWords?: number[];
}

// Deterministic pseudo-random from index (no Math.random in render)
function seeded(index: number, seed: number = 0): number {
  const x = Math.sin((index + 1) * 9301 + seed * 4973) * 49297;
  return x - Math.floor(x);
}

export function KineticText({
  text,
  mode,
  frame,
  fps,
  startFrame = 0,
  className = '',
  accentColor = '#06b6d4',
  staggerFrames,
  highlightWords,
}: KineticTextProps) {
  const f = frame - startFrame; // local frame

  switch (mode) {
    case 'word-cascade':
      return <WordCascade text={text} frame={f} fps={fps} className={className} stagger={staggerFrames ?? 3} />;
    case 'letter-burst':
      return <LetterBurst text={text} frame={f} fps={fps} className={className} accentColor={accentColor} stagger={staggerFrames ?? 1} />;
    case 'punch':
      return <PunchText text={text} frame={f} fps={fps} className={className} stagger={staggerFrames ?? 8} />;
    case 'highlight':
      return <HighlightText text={text} frame={f} fps={fps} className={className} accentColor={accentColor} highlightWords={highlightWords} />;
    case 'typewriter':
      return <TypewriterText text={text} frame={f} fps={fps} className={className} accentColor={accentColor} />;
    case 'gradient-sweep':
      return <GradientSweep text={text} frame={f} fps={fps} className={className} accentColor={accentColor} />;
    default:
      return <span className={className}>{text}</span>;
  }
}

// ============================================================================
// Mode: word-cascade — words slide up with overshoot, staggered
// ============================================================================

function WordCascade({ text, frame, fps, className, stagger }: {
  text: string; frame: number; fps: number; className: string; stagger: number;
}) {
  const words = text.split(' ');

  return (
    <span className={className}>
      {words.map((word, i) => {
        const p = bounceIn(frame, fps, { delay: i * stagger, durationFrames: 18, overshoot: 0.12 });
        const opacity = Math.min(p * 2, 1);
        const translateY = (1 - Math.min(p, 1)) * 25;
        const scale = p > 1 ? p : Math.min(p, 1);

        return (
          <span
            key={i}
            className="inline-block"
            style={{
              opacity,
              transform: `translateY(${translateY}px) scale(${scale})`,
              marginRight: '0.25em',
            }}
          >
            {word}
          </span>
        );
      })}
    </span>
  );
}

// ============================================================================
// Mode: letter-burst — letters fly in from random angles
// ============================================================================

function LetterBurst({ text, frame, fps, className, accentColor, stagger }: {
  text: string; frame: number; fps: number; className: string; accentColor: string; stagger: number;
}) {
  const chars = text.split('');
  let charIndex = 0;

  return (
    <span className={className}>
      {chars.map((char, i) => {
        if (char === ' ') {
          return <span key={i} style={{ display: 'inline-block', width: '0.3em' }} />;
        }

        const ci = charIndex++;
        const angle = seeded(ci, 1) * Math.PI * 2;
        const radius = 30 + seeded(ci, 2) * 50;
        const startRotation = (seeded(ci, 3) - 0.5) * 120;

        const p = spring({
          frame,
          fps,
          delay: ci * stagger,
          durationFrames: 16,
          easing: easeOutBack,
        });

        const opacity = Math.min(p * 3, 1);
        const x = Math.cos(angle) * radius * (1 - p);
        const y = Math.sin(angle) * radius * (1 - p);
        const rotate = startRotation * (1 - p);
        const scale = 0.3 + p * 0.7;

        return (
          <span
            key={i}
            className="inline-block"
            style={{
              opacity,
              transform: `translate(${x}px, ${y}px) rotate(${rotate}deg) scale(${scale})`,
              textShadow: p > 0.5 ? `0 0 20px ${accentColor}40` : 'none',
            }}
          >
            {char}
          </span>
        );
      })}
    </span>
  );
}

// ============================================================================
// Mode: punch — each word slams in with scale overshoot, one at a time
// ============================================================================

function PunchText({ text, frame, fps, className, stagger }: {
  text: string; frame: number; fps: number; className: string; stagger: number;
}) {
  const words = text.split(' ');

  return (
    <span className={className}>
      {words.map((word, i) => {
        const triggerFrame = i * stagger;
        const s = scalePunch(frame, triggerFrame, { overshoot: 1.3, durationFrames: stagger });
        const opacity = frame >= triggerFrame ? Math.min((frame - triggerFrame) * 0.5, 1) : 0;

        return (
          <span
            key={i}
            className="inline-block"
            style={{
              opacity,
              transform: `scale(${s || 0})`,
              marginRight: '0.25em',
            }}
          >
            {word}
          </span>
        );
      })}
    </span>
  );
}

// ============================================================================
// Mode: highlight — text appears, colored box sweeps behind key words
// ============================================================================

function HighlightText({ text, frame, fps, className, accentColor, highlightWords }: {
  text: string; frame: number; fps: number; className: string; accentColor: string;
  highlightWords?: number[];
}) {
  const words = text.split(' ');
  const highlighted = new Set(highlightWords ?? []);

  // Phase 1: all words fade in (frames 0-15)
  const textProgress = spring({ frame, fps, delay: 0, durationFrames: 15, easing: easeOutCubic });

  // Phase 2: highlight boxes sweep in (frames 10+)
  return (
    <span className={className}>
      {words.map((word, i) => {
        const isHighlighted = highlighted.has(i);
        const boxProgress = isHighlighted
          ? spring({ frame, fps, delay: 10 + (highlightWords?.indexOf(i) ?? 0) * 5, durationFrames: 14, easing: easeOutExpo })
          : 0;

        return (
          <span
            key={i}
            className="inline-block relative"
            style={{
              opacity: textProgress,
              transform: `translateY(${(1 - textProgress) * 10}px)`,
              marginRight: '0.25em',
            }}
          >
            {isHighlighted && (
              <span
                className="absolute inset-0 rounded-sm"
                style={{
                  backgroundColor: `${accentColor}25`,
                  transform: `scaleX(${boxProgress})`,
                  transformOrigin: 'left',
                  top: '-2px',
                  bottom: '-2px',
                  left: '-4px',
                  right: '-4px',
                }}
              />
            )}
            <span className="relative z-10">{word}</span>
          </span>
        );
      })}
    </span>
  );
}

// ============================================================================
// Mode: typewriter — characters appear left to right with cursor
// ============================================================================

function TypewriterText({ text, frame, fps, className, accentColor }: {
  text: string; frame: number; fps: number; className: string; accentColor: string;
}) {
  const charsPerFrame = 1.5; // ~45 chars/sec at 30fps
  const visibleChars = Math.min(Math.floor(frame * charsPerFrame), text.length);
  const isComplete = visibleChars >= text.length;

  // Cursor blinks at 2Hz after complete
  const cursorVisible = isComplete
    ? Math.sin((frame / fps) * Math.PI * 4) > 0
    : true;

  return (
    <span className={className}>
      <span>{text.slice(0, visibleChars)}</span>
      {cursorVisible && (
        <span
          className="inline-block w-[2px] ml-0.5"
          style={{
            height: '1em',
            backgroundColor: accentColor,
            verticalAlign: 'text-bottom',
            boxShadow: `0 0 4px ${accentColor}`,
          }}
        />
      )}
    </span>
  );
}

// ============================================================================
// Mode: gradient-sweep — color wave sweeps across text
// ============================================================================

function GradientSweep({ text, frame, fps, className, accentColor }: {
  text: string; frame: number; fps: number; className: string; accentColor: string;
}) {
  const sweepProgress = spring({ frame, fps, delay: 5, durationFrames: 30, easing: easeOutCubic });
  const fadeIn = spring({ frame, fps, delay: 0, durationFrames: 12, easing: easeOutCubic });

  // Base text (muted color) with accent-colored overlay clipped by sweep
  return (
    <span className={`relative inline-block ${className}`} style={{ opacity: fadeIn }}>
      {/* Base text */}
      <span className="relative">{text}</span>
      {/* Accent sweep overlay */}
      <span
        className="absolute inset-0"
        style={{
          color: accentColor,
          clipPath: `inset(0 ${(1 - sweepProgress) * 100}% 0 0)`,
          textShadow: `0 0 20px ${accentColor}60`,
        }}
        aria-hidden="true"
      >
        {text}
      </span>
    </span>
  );
}
