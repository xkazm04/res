'use client';

import { spring, easeOutCubic, easeOutQuart, easeOutExpo } from '../useVideoPlayback';
import { impactShake, flashIntensity, spreadEntrance } from '@/src/lib/animation/motion';
import { KineticText } from '../primitives/KineticText';
import { WarningIcon, SuccessIcon, CriticalIcon, InfoIcon } from '../icons';
import type { BaseSceneProps } from '../configs/types';
import type { VerdictType } from '../primitives';

interface VerdictSceneProps extends BaseSceneProps {
  verdict: string;
  verdictType: VerdictType;
  accentColor: string;
  warnings?: string[];
  keyTakeaway?: string;
  cta?: string;
  variant?: 'standard' | 'fullscreen' | 'minimal';
}

/**
 * Compact closing verdict scene focused on key takeaways.
 * Optimized for 960x540 viewport — no icon badge, no label.
 */
export function VerdictScene({
  fps,
  isRadar,
  format,
  sceneFrame,
  sceneDuration,
  verdict,
  verdictType,
  accentColor,
  warnings = [],
  cta = 'Follow for more insights',
  variant = 'standard',
}: VerdictSceneProps) {
  const isMobile = format === 'mobile';

  // Proportional delays for main elements (background, verdict, warnings, CTA)
  const getMainDelay = spreadEntrance(sceneDuration, 4, { startPct: 0.05, endPct: 0.65 });

  // Proportional delays for warning items
  const getWarningDelay = spreadEntrance(sceneDuration, warnings.length, { startPct: 0.25, endPct: 0.55 });

  // Animation timings
  const bgProgress = spring({ frame: sceneFrame, fps, delay: getMainDelay(0), durationFrames: 25, easing: easeOutQuart });
  const flashProgress = spring({ frame: sceneFrame, fps, delay: getMainDelay(0), durationFrames: 8, easing: easeOutExpo });
  const warningsProgress = spring({ frame: sceneFrame, fps, delay: getMainDelay(2), durationFrames: 25, easing: easeOutCubic });
  const ctaProgress = spring({ frame: sceneFrame, fps, delay: getMainDelay(3), durationFrames: 20, easing: easeOutCubic });

  // Camera shake on entry
  const shake = impactShake(sceneFrame, 0, { intensity: 3, decayFrames: 8, frequency: 8 });

  // Flash on verdict text
  const verdictFlash = flashIntensity(sceneFrame, getMainDelay(1), { durationFrames: 4, peak: 0.3 });

  // Dynamic effects
  const time = sceneFrame / fps;
  const pulse = Math.sin(time * Math.PI * 2) * 0.5 + 0.5;

  // Verdict-specific styling
  const getVerdictStyle = () => {
    const styles = {
      positive: {
        primary: '#22c55e',
        secondary: '#10b981',
        bg: isRadar ? 'rgba(34, 197, 94, 0.08)' : 'rgba(34, 197, 94, 0.04)',
        label: 'POSITIVE',
        Icon: SuccessIcon,
      },
      negative: {
        primary: '#ef4444',
        secondary: '#dc2626',
        bg: isRadar ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.04)',
        label: 'NEGATIVE',
        Icon: CriticalIcon,
      },
      caution: {
        primary: '#f59e0b',
        secondary: '#d97706',
        bg: isRadar ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.04)',
        label: 'CAUTION',
        Icon: WarningIcon,
      },
      mixed: {
        primary: '#3b82f6',
        secondary: '#2563eb',
        bg: isRadar ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.04)',
        label: 'MIXED',
        Icon: InfoIcon,
      },
    };
    return styles[verdictType] || styles.mixed;
  };

  const style = getVerdictStyle();

  // ── Fullscreen variant ──
  if (variant === 'fullscreen') {
    return (
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center overflow-hidden ${isMobile ? 'p-6' : 'p-10'}`}
        style={{ transform: `translate(${shake.x}px, ${shake.y}px) rotate(${shake.rotate}deg)` }}
      >
        {/* Flash */}
        <div
          className="absolute inset-0 pointer-events-none z-30"
          style={{
            background: `radial-gradient(circle at 50% 40%, ${style.primary} 0%, transparent 50%)`,
            opacity: (1 - flashProgress) * 0.5,
            mixBlendMode: 'screen',
          }}
        />
        {verdictFlash > 0 && (
          <div className="absolute inset-0 pointer-events-none z-30" style={{ background: 'white', opacity: verdictFlash, mixBlendMode: 'screen' }} />
        )}

        {/* Background gradient */}
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 50% 40%, ${style.primary}15 0%, transparent 60%)`, opacity: bgProgress }} />

        {/* Verdict text — large centered */}
        <div className="relative z-10 text-center max-w-[90%]">
          <KineticText
            text={verdict}
            mode="highlight"
            frame={sceneFrame}
            fps={fps}
            startFrame={8}
            accentColor={style.primary}
            highlightWords={[0, 1]}
            className={`font-bold leading-snug ${isMobile ? 'text-3xl' : 'text-4xl'} ${isRadar ? 'text-white' : 'text-stone-800'}`}
          />
        </div>

        {/* Warnings below as large text */}
        {warnings.length > 0 && (
          <div className="relative z-10 mt-6 text-center" style={{ opacity: warningsProgress }}>
            {warnings.slice(0, 3).map((warning, i) => {
              const itemProgress = spring({ frame: sceneFrame, fps, delay: getWarningDelay(i), durationFrames: 20, easing: easeOutCubic });
              return (
                <p
                  key={i}
                  className={`text-lg leading-relaxed ${isRadar ? 'text-slate-300' : 'text-stone-600'}`}
                  style={{ opacity: itemProgress, transform: `translateY(${(1 - itemProgress) * 8}px)` }}
                >
                  {warning.length > 80 ? warning.slice(0, 77) + '...' : warning}
                </p>
              );
            })}
          </div>
        )}

        {/* Noise texture */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }} />
      </div>
    );
  }

  // ── Minimal variant ──
  if (variant === 'minimal') {
    return (
      <div
        className={`absolute inset-0 flex flex-col overflow-hidden ${isMobile ? 'p-5 pt-12' : 'p-7'}`}
        style={{ transform: `translate(${shake.x}px, ${shake.y}px) rotate(${shake.rotate}deg)` }}
      >
        {/* Flash */}
        <div
          className="absolute inset-0 pointer-events-none z-30"
          style={{
            background: `radial-gradient(circle at 50% 30%, ${style.primary} 0%, transparent 50%)`,
            opacity: (1 - flashProgress) * 0.3,
            mixBlendMode: 'screen',
          }}
        />

        {/* Inline small pill badge */}
        <div className="relative z-10 mb-2" style={{ opacity: bgProgress }}>
          <span
            className="text-xs font-bold tracking-widest uppercase"
            style={{ color: style.primary }}
          >
            {style.label}
          </span>
        </div>

        {/* Verdict text — compact */}
        <div className="relative z-10 mb-4">
          <KineticText
            text={verdict}
            mode="highlight"
            frame={sceneFrame}
            fps={fps}
            startFrame={8}
            accentColor={style.primary}
            highlightWords={[0, 1]}
            className={`font-bold leading-snug ${isMobile ? 'text-lg' : 'text-xl'} ${isRadar ? 'text-white' : 'text-stone-800'}`}
          />
        </div>

        {/* Warnings as simple list */}
        {warnings.length > 0 && (
          <div className="relative z-10 flex-1" style={{ opacity: warningsProgress }}>
            <div className="space-y-1.5">
              {warnings.slice(0, 3).map((warning, i) => {
                const itemProgress = spring({ frame: sceneFrame, fps, delay: getWarningDelay(i), durationFrames: 20, easing: easeOutCubic });
                return (
                  <div
                    key={i}
                    className="flex items-start gap-2"
                    style={{ opacity: itemProgress, transform: `translateX(${(1 - itemProgress) * 12}px)` }}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                      style={{ backgroundColor: style.primary }}
                    />
                    <span className={`text-sm leading-snug ${isRadar ? 'text-slate-300' : 'text-stone-600'}`}>
                      {warning.length > 80 ? warning.slice(0, 77) + '...' : warning}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Noise texture */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }} />
      </div>
    );
  }

  // ── Standard variant (default) ──
  return (
    <div
      className={`absolute inset-0 flex flex-col overflow-hidden ${isMobile ? 'p-5 pt-12' : 'p-7'}`}
      style={{
        transform: `translate(${shake.x}px, ${shake.y}px) rotate(${shake.rotate}deg)`,
      }}
    >
      {/* Initial verdict flash */}
      <div
        className="absolute inset-0 pointer-events-none z-30"
        style={{
          background: `radial-gradient(circle at 50% 30%, ${style.primary} 0%, transparent 50%)`,
          opacity: (1 - flashProgress) * 0.5,
          mixBlendMode: 'screen',
        }}
      />

      {/* Secondary flash */}
      {verdictFlash > 0 && (
        <div
          className="absolute inset-0 pointer-events-none z-30"
          style={{
            background: 'white',
            opacity: verdictFlash,
            mixBlendMode: 'screen',
          }}
        />
      )}

      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 20%, ${style.primary}15 0%, transparent 60%)`,
          opacity: bgProgress,
        }}
      />

      {/* Verdict type pill - small inline badge */}
      <div
        className="relative z-10 mb-3"
        style={{ opacity: bgProgress, transform: `translateY(${(1 - bgProgress) * -10}px)` }}
      >
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{
            background: `${style.primary}15`,
            border: `1px solid ${style.primary}30`,
          }}
        >
          <style.Icon size={14} color={style.primary} />
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: style.primary }}>
            {style.label} VERDICT
          </span>
        </div>
      </div>

      {/* Main verdict text */}
      <div className="relative z-10 mb-4">
        <KineticText
          text={verdict}
          mode="highlight"
          frame={sceneFrame}
          fps={fps}
          startFrame={8}
          accentColor={style.primary}
          highlightWords={[0, 1]}
          className={`font-bold leading-snug ${isMobile ? 'text-lg' : 'text-2xl'} ${isRadar ? 'text-white' : 'text-stone-800'}`}
        />
      </div>

      {/* Key takeaways - the main content */}
      {warnings.length > 0 && (
        <div
          className="relative z-10 flex-1"
          style={{ opacity: warningsProgress }}
        >
          <div
            className="rounded-xl px-3 py-2.5 backdrop-blur-sm"
            style={{
              background: style.bg,
              border: `1px solid ${style.primary}25`,
            }}
          >
            <span
              className="text-xs font-bold tracking-widest uppercase"
              style={{ color: style.primary }}
            >
              Key Takeaways
            </span>
            <div className="space-y-2 mt-2">
              {warnings.slice(0, 3).map((warning, i) => {
                const itemProgress = spring({ frame: sceneFrame, fps, delay: getWarningDelay(i), durationFrames: 20, easing: easeOutCubic });
                return (
                  <div
                    key={i}
                    className="flex items-start gap-2"
                    style={{
                      opacity: itemProgress,
                      transform: `translateX(${(1 - itemProgress) * 12}px)`,
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                      style={{
                        backgroundColor: style.primary,
                        boxShadow: `0 0 4px ${style.primary}`,
                      }}
                    />
                    <span className={`text-sm leading-snug ${isRadar ? 'text-slate-300' : 'text-stone-600'}`}>
                      {warning.length > 80 ? warning.slice(0, 77) + '...' : warning}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CTA - compact bottom bar */}
      <div
        className="relative z-10 mt-3 flex justify-center"
        style={{
          opacity: ctaProgress,
          transform: `translateY(${(1 - ctaProgress) * 8}px)`,
        }}
      >
        <div
          className="flex items-center gap-2 px-4 py-1.5 rounded-full"
          style={{
            background: `${style.primary}12`,
            border: `1px solid ${style.primary}30`,
          }}
        >
          <span className="text-sm font-medium" style={{ color: style.primary }}>
            {cta}
          </span>
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke={style.primary}
            strokeWidth={2.5}
            style={{ transform: `translateX(${pulse * 2}px)` }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>
      </div>

      {/* Premium corner accents */}
      {!isMobile && (
        <>
          <div className="absolute top-5 left-5" style={{ opacity: bgProgress * 0.5 }}>
            <svg width="56" height="56" viewBox="0 0 56 56">
              <path d="M0 28 L0 0 L28 0" fill="none" stroke={style.primary} strokeWidth="1.5"
                style={{ strokeDasharray: 56, strokeDashoffset: 56 - bgProgress * 56 }} />
            </svg>
          </div>
          <div className="absolute top-5 right-5" style={{ opacity: bgProgress * 0.5 }}>
            <svg width="56" height="56" viewBox="0 0 56 56">
              <path d="M28 0 L56 0 L56 28" fill="none" stroke={style.primary} strokeWidth="1.5"
                style={{ strokeDasharray: 56, strokeDashoffset: 56 - bgProgress * 56 }} />
            </svg>
          </div>
          <div className="absolute bottom-5 left-5" style={{ opacity: bgProgress * 0.5 }}>
            <svg width="56" height="56" viewBox="0 0 56 56">
              <path d="M0 28 L0 56 L28 56" fill="none" stroke={style.primary} strokeWidth="1.5"
                style={{ strokeDasharray: 56, strokeDashoffset: 56 - bgProgress * 56 }} />
            </svg>
          </div>
          <div className="absolute bottom-5 right-5" style={{ opacity: bgProgress * 0.5 }}>
            <svg width="56" height="56" viewBox="0 0 56 56">
              <path d="M56 28 L56 56 L28 56" fill="none" stroke={style.primary} strokeWidth="1.5"
                style={{ strokeDasharray: 56, strokeDashoffset: 56 - bgProgress * 56 }} />
            </svg>
          </div>
        </>
      )}

      {/* Subtle noise texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
