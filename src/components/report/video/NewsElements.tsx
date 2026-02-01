'use client';

import { spring, easeOutCubic, easeOutQuart } from './useVideoPlayback';

interface HeadlineProps {
  text: string;
  frame: number;
  fps: number;
  isRadar?: boolean;
}

export function Headline({ text, frame, fps, isRadar = true }: HeadlineProps) {
  const progress = spring({ frame, fps, delay: 0, durationFrames: 20, easing: easeOutCubic });
  const words = text.split(' ');

  return (
    <h1 className={`text-2xl font-bold tracking-tight ${isRadar ? 'text-white' : 'text-stone-900'}`}>
      {words.map((word, i) => {
        const wordProgress = spring({ frame, fps, delay: i * 2, durationFrames: 18, easing: easeOutCubic });
        return (
          <span key={i} className="inline-block mr-2" style={{ opacity: wordProgress, transform: `translateY(${(1 - wordProgress) * 15}px)` }}>
            {word}
          </span>
        );
      })}
    </h1>
  );
}

interface LowerThirdProps {
  title: string;
  subtitle?: string;
  frame: number;
  fps: number;
  isRadar?: boolean;
}

export function LowerThird({ title, subtitle, frame, fps, isRadar = true }: LowerThirdProps) {
  const slideIn = spring({ frame, fps, delay: 0, durationFrames: 20, easing: easeOutCubic });
  const titleFade = spring({ frame, fps, delay: 5, durationFrames: 18, easing: easeOutCubic });
  const subtitleFade = spring({ frame, fps, delay: 10, durationFrames: 18, easing: easeOutCubic });

  return (
    <div
      className={`absolute bottom-8 left-8 right-8 overflow-hidden`}
      style={{ transform: `translateX(${(1 - slideIn) * -100}%)` }}
    >
      <div className={`${isRadar ? 'bg-gradient-to-r from-cyan-600 to-blue-600' : 'bg-gradient-to-r from-stone-800 to-stone-700'} px-4 py-3 rounded-lg shadow-xl`}>
        <div className="flex items-center gap-3">
          <div className={`w-1 h-10 ${isRadar ? 'bg-cyan-300' : 'bg-white'} rounded-full`} />
          <div>
            <h3 className="text-white font-bold text-lg" style={{ opacity: titleFade }}>{title}</h3>
            {subtitle && <p className="text-white/70 text-sm" style={{ opacity: subtitleFade }}>{subtitle}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: number;
  suffix?: string;
  frame: number;
  fps: number;
  delay?: number;
  color?: 'cyan' | 'emerald' | 'amber' | 'rose';
  isRadar?: boolean;
}

export function MetricCard({ label, value, suffix = '', frame, fps, delay = 0, color = 'cyan', isRadar = true }: MetricCardProps) {
  const scaleIn = spring({ frame, fps, delay, durationFrames: 20, easing: easeOutQuart });
  const countProgress = spring({ frame, fps, delay: delay + 5, durationFrames: 28, easing: easeOutCubic });

  const colorClasses = {
    cyan: isRadar ? 'border-cyan-500/30 bg-cyan-500/10' : 'border-blue-200 bg-blue-50',
    emerald: isRadar ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-emerald-200 bg-emerald-50',
    amber: isRadar ? 'border-amber-500/30 bg-amber-500/10' : 'border-amber-200 bg-amber-50',
    rose: isRadar ? 'border-rose-500/30 bg-rose-500/10' : 'border-rose-200 bg-rose-50',
  };

  const textColors = {
    cyan: isRadar ? 'text-cyan-400' : 'text-blue-600',
    emerald: isRadar ? 'text-emerald-400' : 'text-emerald-600',
    amber: isRadar ? 'text-amber-400' : 'text-amber-600',
    rose: isRadar ? 'text-rose-400' : 'text-rose-600',
  };

  return (
    <div
      className={`p-4 rounded-xl border ${colorClasses[color]} transition-all`}
      style={{ opacity: scaleIn, transform: `scale(${0.85 + scaleIn * 0.15})` }}
    >
      <div className={`text-[10px] uppercase tracking-wider mb-1 ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
        {label}
      </div>
      <div className={`text-3xl font-bold ${textColors[color]}`}>
        {Math.round(value * countProgress)}{suffix}
      </div>
    </div>
  );
}

interface InsightBulletProps {
  text: string;
  frame: number;
  fps: number;
  delay?: number;
  type?: 'insight' | 'warning' | 'action';
  isRadar?: boolean;
}

export function InsightBullet({ text, frame, fps, delay = 0, type = 'insight', isRadar = true }: InsightBulletProps) {
  const slideIn = spring({ frame, fps, delay, durationFrames: 20, easing: easeOutCubic });

  const icons = { insight: '💡', warning: '⚠️', action: '🎯' };
  const colors = {
    insight: isRadar ? 'text-emerald-400' : 'text-emerald-600',
    warning: isRadar ? 'text-amber-400' : 'text-amber-600',
    action: isRadar ? 'text-blue-400' : 'text-blue-600',
  };

  return (
    <div
      className="flex items-start gap-3"
      style={{ opacity: slideIn, transform: `translateX(${(1 - slideIn) * 25}px)` }}
    >
      <span className="text-lg flex-shrink-0">{icons[type]}</span>
      <p className={`text-sm ${colors[type]}`}>{text}</p>
    </div>
  );
}

interface TransitionWipeProps {
  frame: number;
  fps: number;
  direction?: 'left' | 'right';
  isRadar?: boolean;
}

export function TransitionWipe({ frame, fps, direction = 'right', isRadar = true }: TransitionWipeProps) {
  const progress = spring({ frame, fps, delay: 0, durationFrames: 15, easing: easeOutCubic });
  const fadeOut = frame >= 10 ? spring({ frame: frame - 10, fps, delay: 0, durationFrames: 10, easing: easeOutCubic }) : 0;

  if (fadeOut >= 1) return null;

  return (
    <div
      className={`absolute inset-0 ${isRadar ? 'bg-gradient-to-r from-cyan-500 to-blue-600' : 'bg-gradient-to-r from-stone-700 to-stone-900'}`}
      style={{
        opacity: 1 - fadeOut,
        clipPath: direction === 'right' ? `inset(0 ${(1 - progress) * 100}% 0 0)` : `inset(0 0 0 ${(1 - progress) * 100}%)`,
      }}
    />
  );
}
