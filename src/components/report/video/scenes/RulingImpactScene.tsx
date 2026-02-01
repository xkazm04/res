'use client';

import { spring, easeOutCubic, easeOutQuart, easeOutExpo } from '../useVideoPlayback';
import { LegalIcon, CriticalIcon, WarningIcon, InfoIcon, ArrowRightIcon } from '../icons';
import type { BaseSceneProps } from '../configs/types';

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
 * World-class visual with dramatic cascade reveal.
 */
export function RulingImpactScene({
  fps,
  isRadar,
  format,
  sceneFrame,
  ruling,
  impacts,
  jurisdiction = 'Federal',
  accentColor,
}: RulingImpactSceneProps) {
  const isMobile = format === 'mobile';

  // Animation timings
  const headerProgress = spring({ frame: sceneFrame, fps, delay: 0, durationFrames: 25, easing: easeOutQuart });
  const rulingProgress = spring({ frame: sceneFrame, fps, delay: 10, durationFrames: 32, easing: easeOutExpo });
  const cascadeProgress = spring({ frame: sceneFrame, fps, delay: 25, durationFrames: 40, easing: easeOutCubic });

  // Animated pulse
  const pulse = Math.sin((sceneFrame / fps) * Math.PI * 2) * 0.5 + 0.5;

  // Background particles - legal document feel
  const particles = Array.from({ length: 10 }, (_, i) => {
    const angle = (i / 10) * Math.PI * 2 + (sceneFrame / fps) * 0.1;
    const radius = 160 + Math.sin((sceneFrame / fps) * 1.3 + i) * 40;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius * 0.5,
      opacity: 0.1 + Math.sin((sceneFrame / fps) * 2 + i * 0.5) * 0.06,
      size: 2 + Math.sin((sceneFrame / fps) + i) * 1,
    };
  });

  // Severity styling with gradients
  const severityStyles = {
    high: {
      bg: isRadar ? 'bg-red-500/15' : 'bg-red-50/80',
      gradient: 'from-red-500/15 to-red-600/5',
      text: isRadar ? 'text-red-400' : 'text-red-700',
      border: '#ef4444',
      Icon: CriticalIcon,
      color: '#ef4444',
    },
    medium: {
      bg: isRadar ? 'bg-amber-500/15' : 'bg-amber-50/80',
      gradient: 'from-amber-500/15 to-amber-600/5',
      text: isRadar ? 'text-amber-400' : 'text-amber-700',
      border: '#f59e0b',
      Icon: WarningIcon,
      color: '#f59e0b',
    },
    low: {
      bg: isRadar ? 'bg-blue-500/15' : 'bg-blue-50/80',
      gradient: 'from-blue-500/15 to-blue-600/5',
      text: isRadar ? 'text-blue-400' : 'text-blue-700',
      border: '#3b82f6',
      Icon: InfoIcon,
      color: '#3b82f6',
    },
  };

  return (
    <div className={`absolute inset-0 overflow-hidden ${isMobile ? 'p-4 pt-8' : 'p-6'}`}>
      {/* Cinematic letterbox */}
      {!isMobile && (
        <>
          <div className="absolute top-0 left-0 right-0 bg-black z-10" style={{ height: '6%', opacity: headerProgress * 0.9 }} />
          <div className="absolute bottom-0 left-0 right-0 bg-black z-10" style={{ height: '6%', opacity: headerProgress * 0.9 }} />
        </>
      )}

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

      {/* Animated particles */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {particles.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: '#0ea5e9',
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
              style={{ backgroundColor: '#0ea5e9', filter: 'blur(16px)', opacity: 0.4 + pulse * 0.2, transform: `scale(${1.2 + pulse * 0.1})` }}
            />
            <div
              className={`relative flex items-center justify-center rounded-xl backdrop-blur-sm ${
                isRadar ? 'bg-sky-500/30 border border-sky-400/30' : 'bg-sky-100/80 border border-sky-200'
              }`}
              style={{ width: isMobile ? 42 : 50, height: isMobile ? 42 : 50 }}
            >
              <LegalIcon size={isMobile ? 22 : 26} color="#0ea5e9" />
            </div>
          </div>
          <div>
            <h2 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold tracking-tight ${isRadar ? 'text-white' : 'text-stone-900'}`}>
              Legal Ruling
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${isRadar ? 'bg-sky-500/20 text-sky-300' : 'bg-sky-100 text-sky-700'}`}>
                {jurisdiction}
              </span>
              <span className={`text-xs ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
                {impacts.length} areas impacted
              </span>
            </div>
          </div>
        </div>
        <div
          className="h-0.5 mt-3 rounded-full"
          style={{ background: `linear-gradient(90deg, #0ea5e9, transparent)`, transform: `scaleX(${headerProgress})`, transformOrigin: 'left' }}
        />
      </div>

      {/* Ruling box - premium glassmorphism */}
      <div
        className="relative z-20 mb-4"
        style={{ opacity: rulingProgress, transform: `scale(${0.92 + rulingProgress * 0.08})` }}
      >
        <div
          className={`
            relative overflow-hidden p-4 rounded-2xl border-2 backdrop-blur-sm
            ${isRadar ? 'bg-slate-800/60 border-sky-500/40' : 'bg-white/80 border-sky-300'}
          `}
          style={{ boxShadow: `0 4px 30px rgba(14, 165, 233, 0.15)` }}
        >
          {/* Inner glow */}
          <div
            className="absolute inset-0 rounded-2xl"
            style={{ background: `radial-gradient(ellipse at top left, rgba(14, 165, 233, ${0.1 + pulse * 0.05}) 0%, transparent 50%)` }}
          />

          {/* Shine effect */}
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: `linear-gradient(90deg, transparent, rgba(255, 255, 255, ${isRadar ? '0.03' : '0.15'}), transparent)`,
              transform: `translateX(${-100 + (sceneFrame / fps * 20) % 200}%)`,
            }}
          />

          <div className="relative flex items-start gap-3">
            <div
              className={`flex-shrink-0 flex items-center justify-center rounded-xl ${
                isRadar ? 'bg-sky-500/25' : 'bg-sky-100'
              }`}
              style={{ width: 44, height: 44 }}
            >
              <LegalIcon size={24} color="#0ea5e9" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isRadar ? 'text-sky-400' : 'text-sky-700'}`}>
                THE RULING
              </p>
              <p className={`text-sm leading-relaxed ${isRadar ? 'text-slate-300' : 'text-stone-700'}`}>
                {ruling.length > 120 ? ruling.slice(0, 117) + '...' : ruling}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Impact cascade */}
      <div className="relative z-20">
        <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
          CASCADE EFFECTS
        </p>

        {/* Connecting line - glowing */}
        <div
          className="absolute left-5 top-12 bottom-2 w-0.5"
          style={{
            background: `linear-gradient(180deg, #0ea5e9, transparent)`,
            boxShadow: `0 0 10px rgba(14, 165, 233, 0.3)`,
            transform: `scaleY(${cascadeProgress})`,
            transformOrigin: 'top',
          }}
        />

        <div className={`space-y-3 ${isMobile ? 'pl-8' : 'pl-10'}`}>
          {impacts.slice(0, isMobile ? 3 : 4).map((impact, i) => {
            const delay = 25 + i * 10;
            const itemProgress = spring({ frame: sceneFrame, fps, delay, durationFrames: 28, easing: easeOutQuart });
            const style = severityStyles[impact.severity];

            return (
              <div
                key={i}
                className={`
                  relative overflow-hidden p-3.5 rounded-xl border backdrop-blur-sm
                  bg-gradient-to-br ${style.gradient}
                  ${isRadar ? 'border-slate-700/50' : 'border-stone-200'}
                `}
                style={{
                  opacity: itemProgress,
                  transform: `translateX(${(1 - itemProgress) * 30}px)`,
                  borderLeftWidth: 3,
                  borderLeftColor: style.border,
                  boxShadow: `0 2px 15px ${style.color}10`,
                }}
              >
                {/* Connection dot with glow */}
                <div
                  className={`absolute ${isMobile ? '-left-[22px]' : '-left-[26px]'} top-1/2 -translate-y-1/2`}
                >
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{ backgroundColor: style.border, filter: 'blur(4px)', opacity: 0.5 + pulse * 0.2 }}
                  />
                  <div
                    className="relative rounded-full"
                    style={{
                      width: 10,
                      height: 10,
                      backgroundColor: style.border,
                      boxShadow: `0 0 0 3px ${isRadar ? '#0f172a' : '#fff'}`,
                    }}
                  />
                </div>

                {/* Arrow icon */}
                <div
                  className={`absolute ${isMobile ? '-left-[14px]' : '-left-[18px]'} top-1/2 -translate-y-1/2`}
                >
                  <ArrowRightIcon size={12} color={style.border} />
                </div>

                <div className="relative flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 flex-1">
                    <div className="relative flex-shrink-0">
                      <div className="absolute inset-0 rounded" style={{ backgroundColor: style.color, filter: 'blur(4px)', opacity: 0.3 }} />
                      <style.Icon size={16} color={style.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`text-xs font-bold uppercase ${style.text}`}>
                        {impact.area}
                      </span>
                      <p className={`text-xs mt-1 ${isRadar ? 'text-slate-300' : 'text-stone-600'}`}>
                        {impact.impact.length > 60 ? impact.impact.slice(0, 57) + '...' : impact.impact}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase flex-shrink-0`}
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

      {/* More indicator */}
      {impacts.length > (isMobile ? 3 : 4) && (
        <div
          className="relative z-20 mt-4 text-center"
          style={{ opacity: spring({ frame: sceneFrame, fps, delay: 60, durationFrames: 20, easing: easeOutCubic }) }}
        >
          <span className={`text-sm font-medium ${isRadar ? 'text-slate-500' : 'text-stone-400'}`}>
            +{impacts.length - (isMobile ? 3 : 4)} more areas affected
          </span>
        </div>
      )}

      {/* Premium corner accents */}
      {!isMobile && (
        <>
          <svg className="absolute top-[8%] left-4 w-12 h-12 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path d="M 0 32 L 0 6 Q 0 0 6 0 L 32 0" fill="none" stroke="#0ea5e9" strokeWidth={1.5} strokeDasharray={60} strokeDashoffset={60 - 60 * headerProgress} />
          </svg>
          <svg className="absolute top-[8%] right-4 w-12 h-12 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path d="M 48 32 L 48 6 Q 48 0 42 0 L 16 0" fill="none" stroke="#0ea5e9" strokeWidth={1.5} strokeDasharray={60} strokeDashoffset={60 - 60 * headerProgress} />
          </svg>
          <svg className="absolute bottom-[8%] left-4 w-12 h-12 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path d="M 0 16 L 0 42 Q 0 48 6 48 L 32 48" fill="none" stroke="#0ea5e9" strokeWidth={1.5} strokeDasharray={60} strokeDashoffset={60 - 60 * headerProgress} />
          </svg>
          <svg className="absolute bottom-[8%] right-4 w-12 h-12 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path d="M 48 16 L 48 42 Q 48 48 42 48 L 16 48" fill="none" stroke="#0ea5e9" strokeWidth={1.5} strokeDasharray={60} strokeDashoffset={60 - 60 * headerProgress} />
          </svg>
        </>
      )}
    </div>
  );
}
