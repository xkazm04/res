'use client';

import { spring, easeOutCubic, easeOutQuart, easeOutExpo } from '../useVideoPlayback';
import { CompetitiveIcon, TrendUpIcon, TrendDownIcon, SuccessIcon } from '../icons';
import type { BaseSceneProps } from '../configs/types';
import { spreadEntrance } from '@/src/lib/animation/motion';

interface Competitor {
  name: string;
  position: 'leader' | 'challenger' | 'niche' | 'emerging';
  strength: number;
  description?: string;
}

interface CompetitiveLandscapeSceneProps extends BaseSceneProps {
  competitors: Competitor[];
  marketName?: string;
  accentColor: string;
}

/**
 * Market landscape visualization showing competitive positioning.
 * World-class visual with dramatic ranking animations.
 */
export function CompetitiveLandscapeScene({
  fps,
  isRadar,
  format,
  sceneFrame,
  sceneDuration,
  competitors,
  marketName = 'Market',
  accentColor,
}: CompetitiveLandscapeSceneProps) {
  const isMobile = format === 'mobile';

  // Animation timings
  const headerProgress = spring({ frame: sceneFrame, fps, delay: 0, durationFrames: 25, easing: easeOutQuart });
  const legendProgress = spring({ frame: sceneFrame, fps, delay: 5, durationFrames: 22, easing: easeOutCubic });
  const summaryProgress = spring({ frame: sceneFrame, fps, delay: 55, durationFrames: 25, easing: easeOutCubic });

  // Proportional stagger delays for competitor items
  const getCompetitorDelay = spreadEntrance(sceneDuration, competitors.length, { startPct: 0.05, endPct: 0.65 });

  // Animated pulse
  const pulse = Math.sin((sceneFrame / fps) * Math.PI * 2) * 0.5 + 0.5;

  // Background particles
  const particles = Array.from({ length: 10 }, (_, i) => {
    const angle = (i / 10) * Math.PI * 2 + (sceneFrame / fps) * 0.15;
    const radius = 180 + Math.sin((sceneFrame / fps) * 1.3 + i) * 40;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      opacity: 0.15 + Math.sin((sceneFrame / fps) * 2 + i * 0.5) * 0.1,
      size: 2 + Math.sin((sceneFrame / fps) + i) * 1,
    };
  });

  // Position styling - enhanced
  const positionStyles = {
    leader: {
      bg: isRadar ? 'bg-emerald-500/15' : 'bg-emerald-50/80',
      gradient: 'from-emerald-500/20 to-emerald-600/5',
      text: isRadar ? 'text-emerald-400' : 'text-emerald-700',
      border: '#22c55e',
      Icon: SuccessIcon,
    },
    challenger: {
      bg: isRadar ? 'bg-blue-500/15' : 'bg-blue-50/80',
      gradient: 'from-blue-500/20 to-blue-600/5',
      text: isRadar ? 'text-blue-400' : 'text-blue-700',
      border: '#3b82f6',
      Icon: TrendUpIcon,
    },
    niche: {
      bg: isRadar ? 'bg-amber-500/15' : 'bg-amber-50/80',
      gradient: 'from-amber-500/20 to-amber-600/5',
      text: isRadar ? 'text-amber-400' : 'text-amber-700',
      border: '#f59e0b',
      Icon: TrendDownIcon,
    },
    emerging: {
      bg: isRadar ? 'bg-purple-500/15' : 'bg-purple-50/80',
      gradient: 'from-purple-500/20 to-purple-600/5',
      text: isRadar ? 'text-purple-400' : 'text-purple-700',
      border: '#8b5cf6',
      Icon: TrendUpIcon,
    },
  };

  // Sort competitors by strength
  const sortedCompetitors = [...competitors].sort((a, b) => b.strength - a.strength);
  const leaderCount = competitors.filter(c => c.position === 'leader').length;
  const challengerCount = competitors.filter(c => c.position === 'challenger').length;

  return (
    <div className={`absolute inset-0 overflow-hidden ${isMobile ? 'p-5 pt-10' : 'p-7'}`}>

      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: isRadar
            ? `radial-gradient(ellipse at 30% 30%, ${accentColor}10 0%, transparent 50%)`
            : `radial-gradient(ellipse at 30% 30%, ${accentColor}06 0%, transparent 50%)`,
          opacity: headerProgress,
        }}
      />

      {/* Particles */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {particles.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: accentColor,
              transform: `translate(${p.x}px, ${p.y}px)`,
              opacity: p.opacity * headerProgress,
              filter: 'blur(1px)',
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div
        className="relative z-20 mb-4"
        style={{ opacity: headerProgress, transform: `translateX(${(1 - headerProgress) * -30}px)` }}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className="absolute inset-0 rounded-xl"
              style={{ backgroundColor: accentColor, filter: 'blur(16px)', opacity: 0.4 + pulse * 0.2, transform: `scale(${1.2 + pulse * 0.1})` }}
            />
            <div
              className={`relative flex items-center justify-center rounded-xl backdrop-blur-sm ${
                isRadar ? 'bg-purple-500/30 border border-purple-400/30' : 'bg-purple-100/80 border border-purple-200'
              }`}
              style={{ width: isMobile ? 60 : 72, height: isMobile ? 60 : 72 }}
            >
              <CompetitiveIcon size={isMobile ? 30 : 36} color={accentColor} />
            </div>
          </div>
          <div>
            <h2 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold tracking-tight ${isRadar ? 'text-white' : 'text-stone-900'}`}>
              {marketName} Landscape
            </h2>
            <p className={`text-sm ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
              {competitors.length} competitors analyzed
            </p>
          </div>
        </div>
        <div
          className="h-0.5 mt-3 rounded-full"
          style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)`, transform: `scaleX(${headerProgress})`, transformOrigin: 'left' }}
        />
      </div>

      {/* Position legend - glassmorphism */}
      <div
        className={`
          relative z-20 inline-flex flex-wrap gap-4 mb-4 px-4 py-2.5 rounded-xl backdrop-blur-sm
          ${isRadar ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-white/60 border border-stone-200'}
        `}
        style={{ opacity: legendProgress, transform: `translateY(${(1 - legendProgress) * 10}px)` }}
      >
        {(['leader', 'challenger', 'niche', 'emerging'] as const).map((pos, i) => {
          const style = positionStyles[pos];
          const itemProgress = spring({ frame: sceneFrame, fps, delay: 8 + i * 3, durationFrames: 15, easing: easeOutCubic });
          return (
            <div key={pos} className="flex items-center gap-2" style={{ opacity: itemProgress }}>
              <div className="relative">
                <div className="absolute inset-0 rounded-full" style={{ backgroundColor: style.border, filter: 'blur(4px)', opacity: 0.4 }} />
                <div className="relative w-3 h-3 rounded-full" style={{ backgroundColor: style.border }} />
              </div>
              <span className={`text-sm font-medium capitalize ${isRadar ? 'text-slate-300' : 'text-stone-600'}`}>
                {pos}
              </span>
            </div>
          );
        })}
      </div>

      {/* Competitor cards - premium */}
      <div className="relative z-20 space-y-3">
        {sortedCompetitors.slice(0, isMobile ? 4 : 5).map((comp, i) => {
          const delay = getCompetitorDelay(i);
          const cardProgress = spring({ frame: sceneFrame, fps, delay, durationFrames: 26, easing: easeOutQuart });
          const barProgress = spring({ frame: sceneFrame, fps, delay: delay + 8, durationFrames: 30, easing: easeOutExpo });
          const style = positionStyles[comp.position];
          const isTop = i === 0;

          return (
            <div
              key={i}
              className={`
                relative overflow-hidden rounded-2xl border p-4 backdrop-blur-sm
                bg-gradient-to-br ${style.gradient}
                ${isRadar ? 'border-slate-700/50' : 'border-stone-200'}
              `}
              style={{
                opacity: cardProgress,
                transform: `translateX(${(1 - cardProgress) * 30}px)`,
                boxShadow: isTop ? `0 4px 20px ${style.border}20` : undefined,
              }}
            >
              {/* Top indicator glow */}
              {isTop && (
                <div
                  className="absolute -top-10 -right-10 w-24 h-24 rounded-full"
                  style={{ background: `radial-gradient(circle, ${style.border}30 0%, transparent 70%)`, filter: 'blur(10px)', opacity: 0.6 + pulse * 0.2 }}
                />
              )}

              <div className="relative flex items-center gap-4">
                {/* Rank badge */}
                <div className="relative flex-shrink-0">
                  {isTop && (
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{ backgroundColor: '#f59e0b', filter: 'blur(10px)', opacity: 0.4 + pulse * 0.3, transform: `scale(1.4)` }}
                    />
                  )}
                  <div
                    className={`
                      relative w-12 h-12 rounded-full flex items-center justify-center text-base font-bold
                      ${isTop
                        ? (isRadar ? 'bg-amber-500/40 text-amber-300 border-2 border-amber-400/50' : 'bg-amber-100 text-amber-700 border-2 border-amber-200')
                        : (isRadar ? 'bg-slate-700/80 text-slate-300' : 'bg-stone-100 text-stone-600')}
                    `}
                  >
                    #{i + 1}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-base font-bold truncate ${isRadar ? 'text-white' : 'text-stone-800'}`}>
                      {comp.name}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[13px] font-bold uppercase ${style.text}`}
                      style={{ backgroundColor: `${style.border}20` }}
                    >
                      {comp.position}
                    </span>
                  </div>

                  {/* Strength bar */}
                  <div className={`relative h-3 rounded-full overflow-hidden ${isRadar ? 'bg-slate-700/60' : 'bg-stone-200'}`}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${comp.strength * barProgress}%`,
                        background: `linear-gradient(90deg, ${style.border}, ${style.border}cc)`,
                        boxShadow: `0 0 10px ${style.border}60`,
                      }}
                    />
                  </div>
                </div>

                {/* Strength value */}
                <div className="flex-shrink-0 text-right">
                  <span
                    className={`text-3xl font-bold tabular-nums`}
                    style={{ color: style.border }}
                  >
                    {Math.round(comp.strength * barProgress)}
                  </span>
                  <span className={`text-sm ${isRadar ? 'text-slate-500' : 'text-stone-400'}`}>%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Market summary */}
      <div
        className="relative z-20 mt-5 flex justify-center"
        style={{ opacity: summaryProgress, transform: `translateY(${(1 - summaryProgress) * 15}px)` }}
      >
        <div
          className={`
            relative overflow-hidden flex items-center gap-6 px-6 py-3 rounded-2xl backdrop-blur-sm
            ${isRadar ? 'bg-slate-800/60 border border-slate-700/50' : 'bg-white/80 border border-stone-200'}
          `}
        >
          <div
            className="absolute inset-0 rounded-2xl"
            style={{ background: `linear-gradient(90deg, transparent, rgba(255, 255, 255, ${isRadar ? '0.03' : '0.2'}), transparent)`, transform: `translateX(${-100 + (sceneFrame / fps * 30) % 200}%)` }}
          />
          <div className="relative flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className={`text-sm font-medium ${isRadar ? 'text-emerald-400' : 'text-emerald-600'}`}>
              {leaderCount} Leaders
            </span>
          </div>
          <div className={`h-6 w-px ${isRadar ? 'bg-slate-700' : 'bg-stone-200'}`} />
          <div className="relative flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className={`text-sm font-medium ${isRadar ? 'text-blue-400' : 'text-blue-600'}`}>
              {challengerCount} Challengers
            </span>
          </div>
        </div>
      </div>

      {/* Corner accents */}
      {!isMobile && (
        <>
          <svg className="absolute top-5 left-5 w-16 h-16 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path d="M 0 42 L 0 8 Q 0 0 8 0 L 42 0" fill="none" stroke={accentColor} strokeWidth={1.5} strokeDasharray={80} strokeDashoffset={80 - 80 * headerProgress} />
          </svg>
          <svg className="absolute top-5 right-5 w-16 h-16 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path d="M 64 42 L 64 8 Q 64 0 56 0 L 22 0" fill="none" stroke={accentColor} strokeWidth={1.5} strokeDasharray={80} strokeDashoffset={80 - 80 * headerProgress} />
          </svg>
          <svg className="absolute bottom-5 left-5 w-16 h-16 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path d="M 0 22 L 0 56 Q 0 64 8 64 L 42 64" fill="none" stroke={accentColor} strokeWidth={1.5} strokeDasharray={80} strokeDashoffset={80 - 80 * headerProgress} />
          </svg>
          <svg className="absolute bottom-5 right-5 w-16 h-16 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path d="M 64 22 L 64 56 Q 64 64 56 64 L 22 64" fill="none" stroke={accentColor} strokeWidth={1.5} strokeDasharray={80} strokeDashoffset={80 - 80 * headerProgress} />
          </svg>
        </>
      )}
    </div>
  );
}
