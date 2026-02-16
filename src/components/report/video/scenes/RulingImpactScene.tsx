'use client';

import { spring, easeOutCubic, easeOutQuart } from '../useVideoPlayback';
import { LegalIcon, CriticalIcon, WarningIcon, InfoIcon } from '../icons';
import type { BaseSceneProps } from '../configs/types';
import { spreadEntrance } from '@/src/lib/animation/motion';

interface RulingImpact {
  area: string;
  impact: string;
  severity: 'high' | 'medium' | 'low';
}

interface RulingImpactSceneProps extends BaseSceneProps {
  ruling: string;
  impacts: RulingImpact[];
  jurisdiction?: string;
  accentColor: string;
}

/**
 * Legal ruling visualization with cascading impact arrows.
 * Compact layout optimized for 960x540 viewport.
 */
export function RulingImpactScene({
  fps,
  isRadar,
  format,
  sceneFrame,
  sceneDuration,
  ruling,
  impacts,
  jurisdiction = 'Federal',
  accentColor,
}: RulingImpactSceneProps) {
  const isMobile = format === 'mobile';

  // Animation timings
  const headerProgress = spring({ frame: sceneFrame, fps, delay: 0, durationFrames: 25, easing: easeOutQuart });
  const rulingProgress = spring({ frame: sceneFrame, fps, delay: 8, durationFrames: 28, easing: easeOutQuart });
  const cascadeProgress = spring({ frame: sceneFrame, fps, delay: 20, durationFrames: 35, easing: easeOutCubic });

  // Proportional stagger delays for impact items
  const getImpactDelay = spreadEntrance(sceneDuration, impacts.length, { startPct: 0.05, endPct: 0.65 });

  // Animated pulse
  const pulse = Math.sin((sceneFrame / fps) * Math.PI * 2) * 0.5 + 0.5;

  // Severity styling
  const severityStyles = {
    high: {
      text: isRadar ? 'text-red-400' : 'text-red-700',
      border: '#ef4444',
      color: '#ef4444',
      Icon: CriticalIcon,
    },
    medium: {
      text: isRadar ? 'text-amber-400' : 'text-amber-700',
      border: '#f59e0b',
      color: '#f59e0b',
      Icon: WarningIcon,
    },
    low: {
      text: isRadar ? 'text-blue-400' : 'text-blue-700',
      border: '#3b82f6',
      color: '#3b82f6',
      Icon: InfoIcon,
    },
  };

  return (
    <div className={`absolute inset-0 overflow-hidden ${isMobile ? 'p-5 pt-10' : 'p-7'}`}>
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: isRadar
            ? `radial-gradient(ellipse at 30% 20%, ${accentColor}12 0%, transparent 50%)`
            : `radial-gradient(ellipse at 30% 20%, ${accentColor}06 0%, transparent 50%)`,
          opacity: headerProgress,
        }}
      />

      {/* Header - compact */}
      <div
        className="relative z-20 mb-3"
        style={{ opacity: headerProgress, transform: `translateX(${(1 - headerProgress) * -30}px)` }}
      >
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div
              className="absolute inset-0 rounded-lg"
              style={{ backgroundColor: '#0ea5e9', filter: 'blur(12px)', opacity: 0.3 + pulse * 0.15 }}
            />
            <div
              className={`relative flex items-center justify-center rounded-lg backdrop-blur-sm ${
                isRadar ? 'bg-sky-500/30 border border-sky-400/30' : 'bg-sky-100/80 border border-sky-200'
              }`}
              style={{ width: 52, height: 52 }}
            >
              <LegalIcon size={28} color="#0ea5e9" />
            </div>
          </div>
          <div>
            <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold tracking-tight ${isRadar ? 'text-white' : 'text-stone-900'}`}>
              Legal Ruling
            </h2>
            <div className="flex items-center gap-2">
              <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${isRadar ? 'bg-sky-500/20 text-sky-300' : 'bg-sky-100 text-sky-700'}`}>
                {jurisdiction}
              </span>
              <span className={`text-[13px] ${isRadar ? 'text-slate-500' : 'text-stone-400'}`}>
                {impacts.length} areas impacted
              </span>
            </div>
          </div>
        </div>
        <div
          className="h-px mt-2 rounded-full"
          style={{ background: `linear-gradient(90deg, #0ea5e9, transparent)`, transform: `scaleX(${headerProgress})`, transformOrigin: 'left' }}
        />
      </div>

      {/* Ruling text - compact inline card */}
      <div
        className="relative z-20 mb-3"
        style={{ opacity: rulingProgress, transform: `translateY(${(1 - rulingProgress) * 10}px)` }}
      >
        <div
          className={`
            relative overflow-hidden px-3 py-2 rounded-xl border backdrop-blur-sm
            ${isRadar ? 'bg-slate-800/60 border-sky-500/30' : 'bg-white/80 border-sky-200'}
          `}
        >
          <p className={`text-sm leading-snug ${isRadar ? 'text-slate-200' : 'text-stone-700'}`}>
            {ruling.length > 140 ? ruling.slice(0, 137) + '...' : ruling}
          </p>
        </div>
      </div>

      {/* Cascade Effects label */}
      <div className="relative z-20">
        <p
          className={`text-[13px] font-bold uppercase tracking-wider mb-2 ${isRadar ? 'text-slate-500' : 'text-stone-400'}`}
          style={{ opacity: cascadeProgress }}
        >
          CASCADE EFFECTS
        </p>

        {/* Connecting line */}
        <div
          className="absolute left-3 top-6 bottom-0 w-px"
          style={{
            background: `linear-gradient(180deg, #0ea5e9, transparent)`,
            transform: `scaleY(${cascadeProgress})`,
            transformOrigin: 'top',
          }}
        />

        {/* Impact cards - compact */}
        <div className="space-y-1.5 pl-7">
          {impacts.slice(0, 3).map((impact, i) => {
            const delay = getImpactDelay(i);
            const itemProgress = spring({ frame: sceneFrame, fps, delay, durationFrames: 24, easing: easeOutQuart });
            const style = severityStyles[impact.severity];

            return (
              <div
                key={i}
                className={`
                  relative overflow-hidden px-3 py-2 rounded-lg border backdrop-blur-sm
                  ${isRadar ? 'border-slate-700/50' : 'border-stone-200'}
                `}
                style={{
                  opacity: itemProgress,
                  transform: `translateX(${(1 - itemProgress) * 20}px)`,
                  borderLeftWidth: 3,
                  borderLeftColor: style.border,
                  backgroundColor: isRadar ? 'rgba(30,41,59,0.5)' : 'rgba(255,255,255,0.7)',
                }}
              >
                {/* Connection dot */}
                <div
                  className="absolute -left-[18px] top-1/2 -translate-y-1/2 rounded-full"
                  style={{
                    width: 7,
                    height: 7,
                    backgroundColor: style.border,
                    boxShadow: `0 0 0 2px ${isRadar ? '#0f172a' : '#fff'}`,
                  }}
                />

                <div className="relative flex items-center gap-2">
                  <span className={`text-[13px] font-bold uppercase flex-shrink-0 ${style.text}`}>
                    {impact.area}
                  </span>
                  <span className={`text-[13px] truncate ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
                    {impact.impact.length > 70 ? impact.impact.slice(0, 67) + '...' : impact.impact}
                  </span>
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase flex-shrink-0"
                    style={{ backgroundColor: `${style.color}15`, color: style.color }}
                  >
                    {impact.severity}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Premium corner accents */}
      {!isMobile && (
        <>
          <svg className="absolute top-4 left-4 w-14 h-14 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path d="M 0 38 L 0 6 Q 0 0 6 0 L 38 0" fill="none" stroke="#0ea5e9" strokeWidth={1.5} strokeDasharray={70} strokeDashoffset={70 - 70 * headerProgress} />
          </svg>
          <svg className="absolute top-4 right-4 w-14 h-14 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path d="M 56 38 L 56 6 Q 56 0 50 0 L 18 0" fill="none" stroke="#0ea5e9" strokeWidth={1.5} strokeDasharray={70} strokeDashoffset={70 - 70 * headerProgress} />
          </svg>
          <svg className="absolute bottom-4 left-4 w-14 h-14 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path d="M 0 18 L 0 50 Q 0 56 6 56 L 38 56" fill="none" stroke="#0ea5e9" strokeWidth={1.5} strokeDasharray={70} strokeDashoffset={70 - 70 * headerProgress} />
          </svg>
          <svg className="absolute bottom-4 right-4 w-14 h-14 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path d="M 56 18 L 56 50 Q 56 56 50 56 L 18 56" fill="none" stroke="#0ea5e9" strokeWidth={1.5} strokeDasharray={70} strokeDashoffset={70 - 70 * headerProgress} />
          </svg>
        </>
      )}
    </div>
  );
}
