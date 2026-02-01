'use client';

import { spring, easeOutCubic, easeOutQuart } from '../useVideoPlayback';
import { InvestigativeIcon, CriticalIcon } from '../icons';
import type { BaseSceneProps } from '../configs/types';

interface Pattern {
  pattern: string;
  evidence: string;
  implication: string;
}

interface PatternRevealSceneProps extends BaseSceneProps {
  patterns: Pattern[];
  title?: string;
  accentColor: string;
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
  patterns,
  title = 'Patterns Detected',
  accentColor,
}: PatternRevealSceneProps) {
  const isMobile = format === 'mobile';

  // Animation timings
  const headerProgress = spring({ frame: sceneFrame, fps, delay: 0, durationFrames: 22, easing: easeOutCubic });

  return (
    <div className={`absolute inset-0 ${isMobile ? 'p-4 pt-8' : 'p-6'}`}>
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
            style={{ width: isMobile ? 36 : 44, height: isMobile ? 36 : 44 }}
          >
            <InvestigativeIcon size={isMobile ? 20 : 24} color="#f59e0b" />
          </div>
          <div>
            <h2 className={`${isMobile ? 'text-base' : 'text-xl'} font-bold ${isRadar ? 'text-white' : 'text-stone-900'}`}>
              {title}
            </h2>
            <p className={`text-xs ${isRadar ? 'text-slate-500' : 'text-stone-500'}`}>
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

      {/* Pattern cards - larger and better spaced */}
      <div className={`space-y-3 ${isMobile ? '' : 'px-1'}`}>
        {patterns.slice(0, isMobile ? 2 : 3).map((pattern, i) => {
          const delay = 10 + i * 10;
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
                transform: `translateY(${(1 - cardProgress) * 20}px)`,
              }}
            >
              {/* Left accent bar */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl"
                style={{ backgroundColor: '#f59e0b' }}
              />

              <div className="p-4 pl-5">
                {/* Pattern title */}
                <div className="flex items-center gap-2 mb-2">
                  <PatternIcon size={18} color="#f59e0b" />
                  <h3 className={`text-sm font-bold ${isRadar ? 'text-amber-400' : 'text-amber-700'}`}>
                    {pattern.pattern}
                  </h3>
                </div>

                {/* Evidence */}
                <div
                  className="mb-3"
                  style={{ opacity: contentProgress }}
                >
                  <p className={`text-[10px] font-medium uppercase tracking-wider mb-1 ${isRadar ? 'text-slate-500' : 'text-stone-400'}`}>
                    Evidence
                  </p>
                  <p className={`text-xs ${isRadar ? 'text-slate-300' : 'text-stone-600'}`}>
                    {pattern.evidence.length > 100 ? pattern.evidence.slice(0, 97) + '...' : pattern.evidence}
                  </p>
                </div>

                {/* Implication */}
                <div
                  className={`
                    p-2.5 rounded-lg flex items-start gap-2
                    ${isRadar ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-100'}
                  `}
                  style={{ opacity: contentProgress }}
                >
                  <CriticalIcon size={14} color="#ef4444" />
                  <p className={`text-xs font-medium ${isRadar ? 'text-red-400' : 'text-red-600'}`}>
                    {pattern.implication.length > 70 ? pattern.implication.slice(0, 67) + '...' : pattern.implication}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pattern count indicator */}
      {patterns.length > (isMobile ? 2 : 3) && (
        <div
          className={`mt-4 text-center`}
          style={{
            opacity: spring({ frame: sceneFrame, fps, delay: 55, durationFrames: 20, easing: easeOutCubic }),
          }}
        >
          <span className={`text-sm ${isRadar ? 'text-slate-500' : 'text-stone-400'}`}>
            +{patterns.length - (isMobile ? 2 : 3)} more patterns identified
          </span>
        </div>
      )}
    </div>
  );
}
