'use client';

import { spring, easeOutCubic, easeInOutCubic } from '../useVideoPlayback';
import type { VideoFormat } from '../VideoOverview';

/**
 * Shared scene primitives for consistent layout and animation patterns.
 */

// Re-export types for scene components
export type { VideoFormat } from '../VideoOverview';

/**
 * Shared SceneProps interface used by all basic scenes
 */
export interface SceneProps {
  frame: number;
  fps: number;
  isRadar: boolean;
  format: VideoFormat;
}

/**
 * Subtle pulse effect for breathing animations
 */
export function pulse(frame: number, fps: number, speed: number = 1): number {
  return 0.97 + Math.sin((frame / fps) * Math.PI * speed) * 0.03;
}

/**
 * Props for SceneHeader component
 */
interface SceneHeaderProps {
  title: string;
  frame: number;
  fps: number;
  isRadar: boolean;
  isMobile: boolean;
  accentGradient?: string;
  delay?: number;
}

/**
 * Reusable scene header with animated title bar and underline
 */
export function SceneHeader({
  title,
  frame,
  fps,
  isRadar,
  isMobile,
  accentGradient = 'from-cyan-400 to-cyan-600',
  delay = 0,
}: SceneHeaderProps) {
  const headerProgress = spring({ frame, fps, delay, durationFrames: 18, easing: easeOutCubic });
  const lineProgress = spring({ frame, fps, delay: delay + 3, durationFrames: 22, easing: easeInOutCubic });

  return (
    <div className={isMobile ? 'mb-3' : 'mb-4'}>
      <div
        className="flex items-center gap-2"
        style={{ opacity: headerProgress, transform: `translateX(${(1 - headerProgress) * -12}px)` }}
      >
        <div className={`w-1 ${isMobile ? 'h-6' : 'h-7'} rounded-full bg-gradient-to-b ${accentGradient}`} />
        <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold ${isRadar ? 'text-white' : 'text-stone-900'}`}>
          {title}
        </h2>
      </div>
      <div
        className={`h-px ${isMobile ? 'mt-2' : 'mt-3'} ${isRadar ? 'bg-cyan-500/20' : 'bg-stone-300'}`}
        style={{ transform: `scaleX(${lineProgress})`, transformOrigin: 'left' }}
      />
    </div>
  );
}

/**
 * Props for SceneContainer component
 */
interface SceneContainerProps {
  children: React.ReactNode;
  isMobile: boolean;
  className?: string;
}

/**
 * Consistent scene container with padding
 */
export function SceneContainer({ children, isMobile, className = '' }: SceneContainerProps) {
  return (
    <div className={`absolute inset-0 ${isMobile ? 'p-4 pt-8' : 'p-5'} ${className}`}>
      {children}
    </div>
  );
}

/**
 * Background accent orb for visual interest
 */
interface BackgroundOrbProps {
  position?: 'top-right' | 'bottom-left' | 'center' | 'top-left';
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  opacity: number;
  isMobile?: boolean;
}

export function BackgroundOrb({
  position = 'top-right',
  color = 'bg-cyan-500/5',
  size = 'md',
  opacity,
  isMobile = false,
}: BackgroundOrbProps) {
  const positionClasses: Record<string, string> = {
    'top-right': isMobile ? 'top-1/3 right-0' : 'top-0 right-0',
    'bottom-left': 'bottom-0 left-0',
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
    'top-left': 'top-0 left-0',
  };

  const sizeClasses: Record<string, string> = {
    sm: 'w-32 h-32',
    md: 'w-48 h-48',
    lg: 'w-64 h-64',
  };

  return (
    <div
      className={`absolute ${positionClasses[position]} ${sizeClasses[size]} rounded-full blur-3xl ${color}`}
      style={{ opacity }}
    />
  );
}

/**
 * Color mapping for metric cards and themed elements
 */
export type MetricColor = 'cyan' | 'emerald' | 'amber' | 'rose';

export function getColorClasses(color: MetricColor, isRadar: boolean): {
  bg: string;
  border: string;
  text: string;
  glow: string;
} {
  const colorMap: Record<MetricColor, { bg: string; border: string; text: string; glow: string }> = {
    cyan: {
      bg: isRadar ? 'bg-cyan-500/8' : 'bg-blue-50',
      border: isRadar ? 'border-cyan-500/25' : 'border-blue-200',
      text: isRadar ? 'text-cyan-400' : 'text-blue-600',
      glow: isRadar ? 'bg-cyan-500/20' : 'bg-blue-500/10',
    },
    emerald: {
      bg: isRadar ? 'bg-emerald-500/8' : 'bg-emerald-50',
      border: isRadar ? 'border-emerald-500/25' : 'border-emerald-200',
      text: isRadar ? 'text-emerald-400' : 'text-emerald-600',
      glow: isRadar ? 'bg-emerald-500/20' : 'bg-emerald-500/10',
    },
    amber: {
      bg: isRadar ? 'bg-amber-500/8' : 'bg-amber-50',
      border: isRadar ? 'border-amber-500/25' : 'border-amber-200',
      text: isRadar ? 'text-amber-400' : 'text-amber-600',
      glow: isRadar ? 'bg-amber-500/20' : 'bg-amber-500/10',
    },
    rose: {
      bg: isRadar ? 'bg-rose-500/8' : 'bg-rose-50',
      border: isRadar ? 'border-rose-500/25' : 'border-rose-200',
      text: isRadar ? 'text-rose-400' : 'text-rose-600',
      glow: isRadar ? 'bg-rose-500/20' : 'bg-rose-500/10',
    },
  };

  return colorMap[color] || colorMap.cyan;
}
