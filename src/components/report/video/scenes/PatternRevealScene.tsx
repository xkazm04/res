'use client';

import { spring, easeOutCubic, easeOutQuart } from '../useVideoPlayback';
import { InvestigativeIcon, CriticalIcon } from '../icons';
import type { BaseSceneProps } from '../configs/types';
import { spreadEntrance } from '@/src/lib/animation/motion';

interface Pattern {
  pattern: string;
  evidence: string;
  implication: string;
}

interface PatternRevealSceneProps extends BaseSceneProps {
  patterns: Pattern[];
  title?: string;
  accentColor: string;
  variant?: 'cards' | 'timeline';
}

// Lightning bolt icon for patterns
function PatternIcon({ size = 16, color = '#f59e0b' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M13 2L4 14H11L10 22L20 10H13L13 2Z" stroke={color} strokeWidth="2" strokeLinejoin="round" fill={`${color}20`} />
    </svg>
  );
}

/**
 * Pattern reveal scene showing discovered patterns with evidence.
 * Used in Investigative template to highlight suspicious patterns.
 */
export function PatternRevealScene({
  fps,
  isRadar,
  format,
  sceneFrame,
  sceneDuration,
  patterns,
  title = 'Patterns Detected',
  accentColor,
  variant = 'cards',
}: PatternRevealSceneProps) {
  const isMobile = format === 'mobile';

  // Animation timings
  const headerProgress = spring({ frame: sceneFrame, fps, delay: 0, durationFrames: 22, easing: easeOutCubic });

  // Proportional stagger delays for pattern items
  const getPatternDelay = spreadEntrance(sceneDuration, patterns.length, { startPct: 0.05, endPct: 0.65 });

  // ── Timeline variant ──
  if (variant === 'timeline') {
    const lineProgress = spring({ frame: sceneFrame, fps, delay: 5, durationFrames: 30, easing: easeOutQuart });

    return (
      <div className={`absolute inset-0 ${isMobile ? 'p-5 pt-10' : 'p-7'}`}>
        {/* Header */}
        <div
          className="mb-5"
          style={{ opacity: headerProgress, transform: `translateX(${(1 - headerProgress) * -20}px)` }}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center justify-center rounded-lg ${isRadar ? 'bg-amber-500/20' : 'bg-amber-100'}`}
              style={{ width: isMobile ? 40 : 48, height: isMobile ? 40 : 48 }}
            >
              <InvestigativeIcon size={isMobile ? 22 : 26} color="#f59e0b" />
            </div>
            <div>
              <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold ${isRadar ? 'text-white' : 'text-stone-900'}`}>
                {title}
              </h2>
              <p className={`text-xs ${isRadar ? 'text-slate-500' : 'text-stone-500'}`}>
                {patterns.length} patterns identified
              </p>
            </div>
          </div>
        </div>

        {/* Horizontal timeline */}
        <div className="relative flex items-center" style={{ minHeight: isMobile ? 140 : 160 }}>
          {/* Timeline line */}
          <div
            className="absolute left-0 right-0"
            style={{
              top: '50%',
              height: 2,
              background: `linear-gradient(90deg, ${accentColor}60, ${accentColor}30)`,
              transform: `scaleX(${lineProgress})`,
              transformOrigin: 'left',
            }}
          />

          {/* Pattern nodes */}
          <div className="relative w-full flex justify-around">
            {patterns.slice(0, 3).map((pattern, i) => {
              const nodeDelay = getPatternDelay(i);
              const nodeProgress = spring({ frame: sceneFrame, fps, delay: nodeDelay, durationFrames: 24, easing: easeOutQuart });
              const contentDelay = nodeDelay + 8;
              const contentProgress = spring({ frame: sceneFrame, fps, delay: contentDelay, durationFrames: 20, easing: easeOutCubic });

              return (
                <div key={i} className="flex flex-col items-center" style={{ opacity: nodeProgress, transform: `scale(${0.8 + nodeProgress * 0.2})`, width: `${100 / Math.min(patterns.length, 3)}%` }}>
                  {/* Name above */}
                  <div className="text-center mb-3" style={{ opacity: contentProgress }}>
                    <span className={`text-xs font-bold ${isRadar ? 'text-amber-400' : 'text-amber-700'}`}>
                      {pattern.pattern}
                    </span>
                  </div>

                  {/* Node dot */}
                  <div
                    className="w-4 h-4 rounded-full border-2 flex-shrink-0"
                    style={{
                      borderColor: '#f59e0b',
                      backgroundColor: isRadar ? '#1e293b' : '#fffbeb',
                      boxShadow: `0 0 8px #f59e0b60`,
                    }}
                  />

                  {/* Evidence below */}
                  <div className="text-center mt-3" style={{ opacity: contentProgress }}>
                    <p className={`text-xs leading-snug ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
                      {pattern.evidence.length > 40 ? pattern.evidence.slice(0, 37) + '...' : pattern.evidence}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Cards variant (default) ──
  return (
    <div className={`absolute inset-0 ${isMobile ? 'p-5 pt-10' : 'p-7'}`}>
      {/* Header */}
      <div
        className="mb-4"
        style={{
          opacity: headerProgress,
          transform: `translateX(${(1 - headerProgress) * -20}px)`,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center justify-center rounded-lg ${
              isRadar ? 'bg-amber-500/20' : 'bg-amber-100'
            }`}
            style={{ width: isMobile ? 52 : 64, height: isMobile ? 52 : 64 }}
          >
            <InvestigativeIcon size={isMobile ? 28 : 32} color="#f59e0b" />
          </div>
          <div>
            <h2 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold ${isRadar ? 'text-white' : 'text-stone-900'}`}>
              {title}
            </h2>
            <p className={`text-sm ${isRadar ? 'text-slate-500' : 'text-stone-500'}`}>
              {patterns.length} suspicious patterns identified
            </p>
          </div>
        </div>
        <div
          className={`h-px mt-3 ${isRadar ? 'bg-amber-500/30' : 'bg-amber-200'}`}
          style={{
            transform: `scaleX(${headerProgress})`,
            transformOrigin: 'left',
          }}
        />
      </div>

      {/* Pattern cards - compact layout */}
      <div className={`space-y-2 ${isMobile ? '' : 'px-1'}`}>
        {patterns.slice(0, 2).map((pattern, i) => {
          const delay = getPatternDelay(i);
          const cardProgress = spring({ frame: sceneFrame, fps, delay, durationFrames: 28, easing: easeOutQuart });
          const contentProgress = spring({ frame: sceneFrame, fps, delay: delay + 10, durationFrames: 22, easing: easeOutCubic });

          return (
            <div
              key={i}
              className={`
                relative overflow-hidden rounded-xl border
                ${isRadar ? 'bg-slate-800/60 border-amber-500/30' : 'bg-white/80 border-amber-200'}
              `}
              style={{
                opacity: cardProgress,
                transform: `translateY(${(1 - cardProgress) * 15}px)`,
              }}
            >
              {/* Left accent bar */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ backgroundColor: '#f59e0b' }}
              />

              <div className="py-2.5 px-3 pl-4">
                {/* Pattern title row */}
                <div className="flex items-center gap-2 mb-1.5">
                  <PatternIcon size={18} color="#f59e0b" />
                  <h3 className={`text-sm font-bold ${isRadar ? 'text-amber-400' : 'text-amber-700'}`}>
                    {pattern.pattern}
                  </h3>
                </div>

                {/* Evidence — compact single line */}
                <p
                  className={`text-sm leading-snug mb-1.5 ${isRadar ? 'text-slate-300' : 'text-stone-600'}`}
                  style={{ opacity: contentProgress }}
                >
                  {pattern.evidence}
                </p>

                {/* Implication — inline pill */}
                <div
                  className={`
                    inline-flex items-center gap-1.5 px-2 py-1 rounded-md
                    ${isRadar ? 'bg-red-500/10' : 'bg-red-50'}
                  `}
                  style={{ opacity: contentProgress }}
                >
                  <CriticalIcon size={14} color="#ef4444" />
                  <span className={`text-xs font-medium ${isRadar ? 'text-red-400' : 'text-red-600'}`}>
                    {pattern.implication}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
