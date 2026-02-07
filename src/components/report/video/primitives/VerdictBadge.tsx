'use client';

import { spring, easeOutCubic, easeOutQuart } from '../useVideoPlayback';

export type VerdictType = 'positive' | 'negative' | 'caution' | 'mixed';

interface VerdictBadgeProps {
  verdict: string;
  type: VerdictType;
  frame: number;
  fps: number;
  isRadar: boolean;
  size?: 'small' | 'medium' | 'large';
  /** Show pulsing glow effect */
  showGlow?: boolean;
  /** Show verdict icon */
  showIcon?: boolean;
  /** Additional context text */
  context?: string;
  /** Call to action text */
  cta?: string;
}

/**
 * Large verdict display with animated reveal.
 * Used in VerdictScene across all templates.
 */
export function VerdictBadge({
  verdict,
  type,
  frame,
  fps,
  isRadar,
  size = 'large',
  showGlow = true,
  showIcon = true,
  context,
  cta,
}: VerdictBadgeProps) {
  const glowProgress = spring({ frame, fps, delay: 0, durationFrames: 30, easing: easeOutCubic });
  const badgeProgress = spring({ frame, fps, delay: 5, durationFrames: 28, easing: easeOutQuart });
  const textProgress = spring({ frame, fps, delay: 12, durationFrames: 25, easing: easeOutCubic });
  const contextProgress = spring({ frame, fps, delay: 25, durationFrames: 22, easing: easeOutCubic });
  const ctaProgress = spring({ frame, fps, delay: 35, durationFrames: 20, easing: easeOutCubic });

  // Subtle breathing animation
  const breathe = 1 + Math.sin((frame / fps) * Math.PI * 0.8) * 0.02;

  const getColors = () => {
    const colors = {
      positive: {
        bg: isRadar ? 'bg-emerald-500/20' : 'bg-emerald-100',
        border: isRadar ? 'border-emerald-500' : 'border-emerald-400',
        text: isRadar ? 'text-emerald-400' : 'text-emerald-700',
        glow: isRadar ? 'bg-emerald-500/30' : 'bg-emerald-500/20',
        icon: '✓',
        label: 'VERIFIED',
      },
      negative: {
        bg: isRadar ? 'bg-red-500/20' : 'bg-red-100',
        border: isRadar ? 'border-red-500' : 'border-red-400',
        text: isRadar ? 'text-red-400' : 'text-red-700',
        glow: isRadar ? 'bg-red-500/30' : 'bg-red-500/20',
        icon: '✗',
        label: 'WARNING',
      },
      caution: {
        bg: isRadar ? 'bg-amber-500/20' : 'bg-amber-100',
        border: isRadar ? 'border-amber-500' : 'border-amber-400',
        text: isRadar ? 'text-amber-400' : 'text-amber-700',
        glow: isRadar ? 'bg-amber-500/30' : 'bg-amber-500/20',
        icon: '⚠',
        label: 'CAUTION',
      },
      mixed: {
        bg: isRadar ? 'bg-blue-500/20' : 'bg-blue-100',
        border: isRadar ? 'border-blue-500' : 'border-blue-400',
        text: isRadar ? 'text-blue-400' : 'text-blue-700',
        glow: isRadar ? 'bg-blue-500/30' : 'bg-blue-500/20',
        icon: '~',
        label: 'MIXED',
      },
    };
    return colors[type];
  };

  const getSizeClasses = () => {
    const sizes = {
      small: {
        badge: 'px-3 py-1.5',
        text: 'text-sm',
        icon: 'text-base',
        glow: 'w-32 h-32',
      },
      medium: {
        badge: 'px-4 py-2',
        text: 'text-base',
        icon: 'text-xl',
        glow: 'w-40 h-40',
      },
      large: {
        badge: 'px-6 py-3',
        text: 'text-xl',
        icon: 'text-2xl',
        glow: 'w-56 h-56',
      },
    };
    return sizes[size];
  };

  const colors = getColors();
  const sizeClasses = getSizeClasses();

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Glow effect */}
      {showGlow && (
        <div
          className={`absolute rounded-full blur-3xl ${colors.glow} ${sizeClasses.glow}`}
          style={{
            opacity: glowProgress * 0.6,
            transform: `scale(${0.5 + glowProgress * 0.5 * breathe})`,
          }}
        />
      )}

      {/* Type label */}
      <div
        className={`
          px-3 py-1 rounded-full font-bold uppercase tracking-wider text-[10px]
          ${colors.bg} ${colors.text}
        `}
        style={{
          opacity: badgeProgress,
          transform: `scale(${0.8 + badgeProgress * 0.2})`,
        }}
      >
        {colors.label}
      </div>

      {/* Main verdict badge */}
      <div
        className={`
          relative flex items-center gap-3 rounded-2xl border-2
          ${sizeClasses.badge} ${colors.bg} ${colors.border}
        `}
        style={{
          opacity: badgeProgress,
          transform: `scale(${0.9 + badgeProgress * 0.1 * breathe})`,
        }}
      >
        {/* Icon */}
        {showIcon && (
          <span className={`${sizeClasses.icon} ${colors.text}`}>
            {colors.icon}
          </span>
        )}

        {/* Verdict text */}
        <span
          className={`font-bold ${sizeClasses.text} ${colors.text}`}
          style={{ opacity: textProgress }}
        >
          {verdict}
        </span>
      </div>

      {/* Context */}
      {context && (
        <p
          className={`
            text-center max-w-sm
            ${size === 'large' ? 'text-sm' : 'text-xs'}
            ${isRadar ? 'text-slate-400' : 'text-stone-600'}
          `}
          style={{
            opacity: contextProgress,
            transform: `translateY(${(1 - contextProgress) * 10}px)`,
          }}
        >
          {context}
        </p>
      )}

      {/* CTA */}
      {cta && (
        <p
          className={`
            text-center
            ${size === 'large' ? 'text-xs' : 'text-[10px]'}
            ${isRadar ? 'text-slate-500' : 'text-stone-400'}
          `}
          style={{ opacity: ctaProgress }}
        >
          {cta}
        </p>
      )}
    </div>
  );
}

/**
 * Compact verdict indicator for inline use
 */
interface VerdictIndicatorProps {
  type: VerdictType;
  frame: number;
  fps: number;
  delay?: number;
  isRadar: boolean;
  label?: string;
}

export function VerdictIndicator({
  type,
  frame,
  fps,
  delay = 0,
  isRadar,
  label,
}: VerdictIndicatorProps) {
  const progress = spring({ frame, fps, delay, durationFrames: 20, easing: easeOutQuart });

  const colors = {
    positive: { dot: 'bg-emerald-500', text: isRadar ? 'text-emerald-400' : 'text-emerald-600' },
    negative: { dot: 'bg-red-500', text: isRadar ? 'text-red-400' : 'text-red-600' },
    caution: { dot: 'bg-amber-500', text: isRadar ? 'text-amber-400' : 'text-amber-600' },
    mixed: { dot: 'bg-blue-500', text: isRadar ? 'text-blue-400' : 'text-blue-600' },
  };

  return (
    <div
      className="inline-flex items-center gap-1.5"
      style={{ opacity: progress }}
    >
      <div
        className={`w-2 h-2 rounded-full ${colors[type].dot}`}
        style={{ transform: `scale(${progress})` }}
      />
      {label && (
        <span className={`text-xs font-medium ${colors[type].text}`}>
          {label}
        </span>
      )}
    </div>
  );
}
