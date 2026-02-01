'use client';

import { spring, easeOutCubic, easeOutQuart, easeInOutCubic } from '../useVideoPlayback';
import { SceneHeader, SceneContainer, BackgroundOrb, pulse, getColorClasses, type SceneProps, type MetricColor } from './primitives';

interface MetricsSceneProps extends SceneProps {
  metrics: Array<{ label: string; value: number; suffix?: string; color: string }>;
}

/**
 * Metrics scene with animated counter cards in a responsive grid.
 */
export function MetricsScene({ frame, fps, isRadar, format, metrics }: MetricsSceneProps) {
  const isMobile = format === 'mobile';
  const headerProgress = spring({ frame, fps, delay: 0, durationFrames: 18, easing: easeOutCubic });

  return (
    <SceneContainer isMobile={isMobile}>
      {/* Background accent */}
      <BackgroundOrb
        position="top-right"
        color={isRadar ? 'bg-cyan-500/5' : 'bg-stone-400/5'}
        opacity={headerProgress}
        isMobile={isMobile}
      />

      {/* Header */}
      <SceneHeader
        title="Key Metrics"
        frame={frame}
        fps={fps}
        isRadar={isRadar}
        isMobile={isMobile}
        accentGradient="from-cyan-400 to-cyan-600"
      />

      {/* Metrics grid */}
      <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-4 gap-3'}`}>
        {metrics.map((m, i) => (
          <MetricCard
            key={i}
            label={m.label}
            value={m.value}
            suffix={m.suffix}
            color={m.color as MetricColor}
            index={i}
            frame={frame}
            fps={fps}
            isRadar={isRadar}
            isMobile={isMobile}
          />
        ))}
      </div>
    </SceneContainer>
  );
}

interface MetricCardProps {
  label: string;
  value: number;
  suffix?: string;
  color: MetricColor;
  index: number;
  frame: number;
  fps: number;
  isRadar: boolean;
  isMobile: boolean;
}

function MetricCard({
  label,
  value,
  suffix = '',
  color,
  index,
  frame,
  fps,
  isRadar,
  isMobile,
}: MetricCardProps) {
  const progress = spring({ frame, fps, delay: 6 + index * 4, durationFrames: 22, easing: easeOutQuart });
  const countProgress = spring({ frame, fps, delay: 12 + index * 4, durationFrames: 32, easing: easeOutCubic });
  const glowProgress = spring({ frame, fps, delay: 16 + index * 4, durationFrames: 18, easing: easeOutCubic });
  const breathe = pulse(frame, fps, 0.6);

  const colors = getColorClasses(color, isRadar);

  return (
    <div className="relative">
      <div
        className={`absolute inset-0 rounded-xl blur-xl ${colors.glow}`}
        style={{ opacity: glowProgress * 0.4, transform: `scale(${1.1 * breathe})` }}
      />
      <div
        className={`relative ${isMobile ? 'p-3' : 'p-3'} rounded-xl border backdrop-blur-sm ${colors.bg} ${colors.border}`}
        style={{ opacity: progress, transform: `translateY(${(1 - progress) * 15}px)` }}
      >
        <div className={`${isMobile ? 'text-[9px]' : 'text-[10px]'} uppercase tracking-wider font-medium mb-1 ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
          {label}
        </div>
        <div className={`${isMobile ? 'text-2xl' : 'text-2xl'} font-bold tabular-nums ${colors.text}`}>
          {Math.round(value * countProgress)}{suffix}
        </div>
        {/* Mini progress bar */}
        <div className={`mt-2 h-0.5 rounded-full ${isRadar ? 'bg-slate-800' : 'bg-stone-200'}`}>
          <div
            className={`h-full rounded-full ${colors.text.replace('text-', 'bg-')}`}
            style={{ width: `${countProgress * 100}%`, opacity: 0.5 }}
          />
        </div>
      </div>
    </div>
  );
}
