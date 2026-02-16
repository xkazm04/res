'use client';

/**
 * SceneTransition — enter/exit animation wrapper for video scenes.
 *
 * Wraps scene content in RemotionComposition to create professional
 * transitions between scenes instead of hard cuts.
 */

import { spring } from '@/src/lib/animation/spring';
import { easeOutExpo, easeOutCubic, easeInCubic, easeInOutSine } from '@/src/lib/animation/easing';
import { flashIntensity } from '@/src/lib/animation/motion';

export type TransitionType = 'flash-cut' | 'wipe-right' | 'wipe-left' | 'zoom-through' | 'slide-up' | 'fade';

interface SceneTransitionProps {
  children: React.ReactNode;
  frame: number;
  fps: number;
  sceneDuration: number;
  enterType?: TransitionType;
  exitType?: TransitionType;
  enterFrames?: number;
  exitFrames?: number;
  /** Scene index for alternating zoom drift direction. */
  sceneIndex?: number;
  /** Enable subtle zoom drift across scene duration. Default true. */
  zoomDrift?: boolean;
}

export function SceneTransition({
  children,
  frame,
  fps,
  sceneDuration,
  enterType = 'flash-cut',
  exitType = 'fade',
  enterFrames = 8,
  exitFrames = 6,
  sceneIndex = 0,
  zoomDrift = true,
}: SceneTransitionProps) {
  // Calculate enter/exit progress (0-1)
  const enterProgress = frame < enterFrames
    ? spring({ frame, fps, delay: 0, durationFrames: enterFrames, easing: easeOutExpo })
    : 1;

  const exitStart = sceneDuration - exitFrames;
  const exitProgress = frame >= exitStart
    ? spring({ frame: frame - exitStart, fps, delay: 0, durationFrames: exitFrames, easing: easeInCubic })
    : 0;

  // Compute enter styles
  const enterStyle = getEnterStyle(enterType, enterProgress);
  // Compute exit styles
  const exitStyle = getExitStyle(exitType, exitProgress);

  // Merge styles (exit overrides enter when active)
  const isExiting = frame >= exitStart;
  const activeStyle = isExiting ? exitStyle : enterStyle;

  // Zoom drift — subtle scale change across scene for camera energy
  let driftScale = 1;
  if (zoomDrift && sceneDuration > 0) {
    const t = easeInOutSine(Math.min(frame / sceneDuration, 1));
    const zoomIn = sceneIndex % 2 === 0;
    driftScale = zoomIn ? 1 + t * 0.035 : 1.035 - t * 0.035;
  }

  // Flash overlay
  const showFlash = (enterType === 'flash-cut' && frame < 4) ||
    (exitType === 'flash-cut' && frame >= exitStart && frame < exitStart + 3);
  const flashOpacity = showFlash
    ? flashIntensity(frame, enterType === 'flash-cut' ? 0 : exitStart, { durationFrames: 3, peak: 0.6 })
    : 0;

  // Merge zoom drift into the active transition style transform
  const combinedStyle: React.CSSProperties = { ...activeStyle };
  if (driftScale !== 1) {
    const existing = (combinedStyle.transform as string) || '';
    combinedStyle.transform = existing
      ? `${existing} scale(${driftScale})`
      : `scale(${driftScale})`;
  }

  return (
    <div className="absolute inset-0 overflow-hidden" style={combinedStyle}>
      {children}

      {/* Flash overlay */}
      {flashOpacity > 0 && (
        <div
          className="absolute inset-0 pointer-events-none z-50"
          style={{
            background: 'white',
            opacity: flashOpacity,
            mixBlendMode: 'screen',
          }}
        />
      )}
    </div>
  );
}

function getEnterStyle(type: TransitionType, progress: number): React.CSSProperties {
  switch (type) {
    case 'flash-cut': {
      const scale = 1 + (1 - progress) * 0.03;
      return {
        opacity: Math.min(progress * 2.5, 1),
        transform: `scale(${scale})`,
      };
    }
    case 'wipe-right':
      return {
        clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)`,
      };
    case 'wipe-left':
      return {
        clipPath: `inset(0 0 0 ${(1 - progress) * 100}%)`,
      };
    case 'zoom-through': {
      const scale = 0.5 + progress * 0.5;
      const blur = (1 - progress) * 8;
      return {
        opacity: progress,
        transform: `scale(${scale})`,
        filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
      };
    }
    case 'slide-up':
      return {
        opacity: progress,
        transform: `translateY(${(1 - progress) * 100}%)`,
      };
    case 'fade':
      return {
        opacity: progress,
      };
    default:
      return { opacity: 1 };
  }
}

function getExitStyle(type: TransitionType, progress: number): React.CSSProperties {
  if (progress <= 0) return { opacity: 1 };

  switch (type) {
    case 'flash-cut': {
      const scale = 1 + progress * 0.05;
      return {
        opacity: 1 - progress,
        transform: `scale(${scale})`,
      };
    }
    case 'wipe-right':
      return {
        clipPath: `inset(0 0 0 ${progress * 100}%)`,
      };
    case 'wipe-left':
      return {
        clipPath: `inset(0 ${progress * 100}% 0 0)`,
      };
    case 'zoom-through': {
      const scale = 1 + progress * 0.5;
      const blur = progress * 6;
      return {
        opacity: 1 - progress,
        transform: `scale(${scale})`,
        filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
      };
    }
    case 'slide-up':
      return {
        opacity: 1 - progress,
        transform: `translateY(${-progress * 30}%)`,
      };
    case 'fade':
      return {
        opacity: 1 - progress,
      };
    default:
      return { opacity: 1 - progress };
  }
}
