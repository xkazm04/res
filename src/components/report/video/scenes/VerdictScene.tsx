'use client';

import { spring, easeOutCubic, easeOutQuart, easeOutExpo } from '../useVideoPlayback';
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
}

/**
 * Cinematic closing verdict scene with premium animations.
 * Designed for maximum social media impact and shareability.
 */
export function VerdictScene({
  fps,
  isRadar,
  format,
  sceneFrame,
  verdict,
  verdictType,
  accentColor,
  warnings = [],
  cta = 'Follow for more insights',
}: VerdictSceneProps) {
  const isMobile = format === 'mobile';

  // Animation timings - dramatic reveal sequence
  const bgProgress = spring({ frame: sceneFrame, fps, delay: 0, durationFrames: 30, easing: easeOutQuart });
  const flashProgress = spring({ frame: sceneFrame, fps, delay: 0, durationFrames: 10, easing: easeOutExpo });
  const iconProgress = spring({ frame: sceneFrame, fps, delay: 5, durationFrames: 25, easing: easeOutExpo });
  const labelProgress = spring({ frame: sceneFrame, fps, delay: 8, durationFrames: 22, easing: easeOutCubic });
  const badgeProgress = spring({ frame: sceneFrame, fps, delay: 15, durationFrames: 30, easing: easeOutQuart });
  const verdictProgress = spring({ frame: sceneFrame, fps, delay: 30, durationFrames: 25, easing: easeOutCubic });
  const warningsProgress = spring({ frame: sceneFrame, fps, delay: 45, durationFrames: 25, easing: easeOutCubic });
  const ctaProgress = spring({ frame: sceneFrame, fps, delay: 60, durationFrames: 20, easing: easeOutCubic });

  // Dynamic effects
  const time = sceneFrame / fps;
  const pulse = Math.sin(time * Math.PI * 2) * 0.5 + 0.5;
  const slowPulse = Math.sin(time * Math.PI * 0.8) * 0.5 + 0.5;
  const breathe = 1 + Math.sin(time * Math.PI * 0.5) * 0.02;

  // Verdict-specific styling
  const getVerdictStyle = () => {
    const styles = {
      positive: {
        primary: '#22c55e',
        secondary: '#10b981',
        gradient: 'from-emerald-500 to-green-500',
        bg: isRadar ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)',
        label: 'POSITIVE',
        Icon: SuccessIcon,
        emoji: '✓',
      },
      negative: {
        primary: '#ef4444',
        secondary: '#dc2626',
        gradient: 'from-red-500 to-rose-500',
        bg: isRadar ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
        label: 'NEGATIVE',
        Icon: CriticalIcon,
        emoji: '✗',
      },
      caution: {
        primary: '#f59e0b',
        secondary: '#d97706',
        gradient: 'from-amber-500 to-orange-500',
        bg: isRadar ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.05)',
        label: 'CAUTION',
        Icon: WarningIcon,
        emoji: '!',
      },
      mixed: {
        primary: '#3b82f6',
        secondary: '#2563eb',
        gradient: 'from-blue-500 to-indigo-500',
        bg: isRadar ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
        label: 'MIXED',
        Icon: InfoIcon,
        emoji: '~',
      },
    };
    return styles[verdictType] || styles.mixed;
  };

  const style = getVerdictStyle();

  // Split verdict text for animation
  const verdictWords = verdict.split(' ');

  return (
    <div className={`absolute inset-0 flex flex-col items-center overflow-hidden ${isMobile ? 'justify-start pt-12' : 'justify-center'}`}>
      {/* Cinematic letterbox */}
      {!isMobile && (
        <>
          <div className="absolute top-0 left-0 right-0 h-10 z-20" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)' }} />
          <div className="absolute bottom-0 left-0 right-0 h-10 z-20" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }} />
        </>
      )}

      {/* Initial verdict flash */}
      <div
        className="absolute inset-0 pointer-events-none z-30"
        style={{
          background: `radial-gradient(circle at 50% ${isMobile ? '25%' : '40%'}, ${style.primary} 0%, transparent 50%)`,
          opacity: (1 - flashProgress) * 0.6,
          mixBlendMode: 'screen',
        }}
      />

      {/* Dynamic gradient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 100% 60% at 50% ${isMobile ? '20%' : '35%'}, ${style.primary}25 0%, transparent 50%),
            radial-gradient(ellipse 80% 40% at 30% 70%, ${style.secondary}15 0%, transparent 40%),
            radial-gradient(ellipse 60% 50% at 80% 30%, ${style.primary}10 0%, transparent 35%)
          `,
          opacity: bgProgress,
        }}
      />

      {/* Animated concentric rings */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: isMobile ? '20%' : '35%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        {[1, 1.5, 2, 2.5, 3].map((scale, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: (isMobile ? 70 : 100) * scale,
              height: (isMobile ? 70 : 100) * scale,
              left: '50%',
              top: '50%',
              transform: `translate(-50%, -50%) scale(${0.8 + bgProgress * 0.3})`,
              border: `${i === 0 ? 2 : 1}px solid ${style.primary}`,
              opacity: bgProgress * (0.5 - i * 0.1) * (1 + slowPulse * 0.2),
              boxShadow: i === 0 ? `0 0 30px ${style.primary}50, inset 0 0 30px ${style.primary}20` : 'none',
            }}
          />
        ))}
      </div>

      {/* Verdict Icon with dramatic entrance */}
      <div className="relative z-10">
        {/* Multi-layer glow */}
        <div
          className="absolute rounded-full"
          style={{
            width: isMobile ? 160 : 220,
            height: isMobile ? 160 : 220,
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%) scale(${breathe})`,
            background: `radial-gradient(circle, ${style.primary}50 0%, transparent 60%)`,
            opacity: iconProgress * 0.7,
            filter: 'blur(40px)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: isMobile ? 120 : 160,
            height: isMobile ? 120 : 160,
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%) scale(${1 + pulse * 0.06})`,
            background: `radial-gradient(circle, ${style.primary}70 0%, transparent 50%)`,
            opacity: iconProgress * 0.5,
            filter: 'blur(20px)',
          }}
        />

        {/* Main verdict badge */}
        <div
          className="relative flex items-center justify-center rounded-full"
          style={{
            width: isMobile ? 90 : 130,
            height: isMobile ? 90 : 130,
            opacity: badgeProgress,
            transform: `scale(${0.3 + badgeProgress * 0.7})`,
            background: `linear-gradient(135deg, ${style.primary}, ${style.secondary})`,
            boxShadow: `
              0 0 60px ${style.primary}60,
              0 0 120px ${style.primary}30,
              inset 0 2px 0 rgba(255,255,255,0.3),
              0 25px 50px rgba(0,0,0,0.4)
            `,
          }}
        >
          {/* Inner ring */}
          <div
            className="absolute inset-2 rounded-full"
            style={{
              border: '2px solid rgba(255,255,255,0.3)',
            }}
          />

          {/* Icon */}
          <style.Icon size={isMobile ? 44 : 60} color="white" />
        </div>
      </div>

      {/* Verdict type label */}
      <div
        className="mt-5 relative z-10"
        style={{
          opacity: labelProgress,
          transform: `translateY(${(1 - labelProgress) * 15}px) scale(${0.8 + labelProgress * 0.2})`,
        }}
      >
        <div
          className="px-6 py-2 rounded-full font-black tracking-[0.25em] text-sm"
          style={{
            background: isRadar
              ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(250, 250, 249, 0.95))',
            color: style.primary,
            border: `2px solid ${style.primary}50`,
            boxShadow: `0 4px 30px ${style.primary}40`,
          }}
        >
          {style.label} VERDICT
        </div>
      </div>

      {/* Main verdict text with word animation */}
      <div className={`${isMobile ? 'mt-6 px-5' : 'mt-8 px-10'} text-center max-w-2xl z-10`}>
        <p className={`font-bold leading-snug ${isMobile ? 'text-lg' : 'text-2xl'}`}>
          {verdictWords.map((word, i) => {
            const wordDelay = 30 + i * 2;
            const wordProgress = spring({ frame: sceneFrame, fps, delay: wordDelay, durationFrames: 18, easing: easeOutCubic });
            return (
              <span
                key={i}
                className={`inline-block mr-2 ${isRadar ? 'text-white' : 'text-stone-800'}`}
                style={{
                  opacity: wordProgress,
                  transform: `translateY(${(1 - wordProgress) * 15}px)`,
                }}
              >
                {word}
              </span>
            );
          })}
        </p>
      </div>

      {/* Key warnings/points */}
      {warnings.length > 0 && (
        <div
          className={`${isMobile ? 'mt-5 px-4' : 'mt-6 px-8'} w-full max-w-xl z-10`}
          style={{ opacity: warningsProgress }}
        >
          <div
            className="rounded-2xl p-4 backdrop-blur-sm"
            style={{
              background: style.bg,
              border: `1px solid ${style.primary}30`,
              boxShadow: `0 4px 30px ${style.primary}15`,
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${style.primary}20` }}
              >
                <WarningIcon size={12} color={style.primary} />
              </div>
              <span
                className="text-[10px] font-bold tracking-widest uppercase"
                style={{ color: style.primary }}
              >
                Key Takeaways
              </span>
            </div>
            <div className="space-y-2.5">
              {warnings.slice(0, isMobile ? 2 : 3).map((warning, i) => {
                const itemDelay = 48 + i * 5;
                const itemProgress = spring({ frame: sceneFrame, fps, delay: itemDelay, durationFrames: 20, easing: easeOutCubic });
                return (
                  <div
                    key={i}
                    className="flex items-start gap-3"
                    style={{
                      opacity: itemProgress,
                      transform: `translateX(${(1 - itemProgress) * 15}px)`,
                    }}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                      style={{
                        backgroundColor: style.primary,
                        boxShadow: `0 0 6px ${style.primary}`,
                      }}
                    />
                    <span className={`text-sm leading-relaxed ${isRadar ? 'text-slate-300' : 'text-stone-600'}`}>
                      {warning.length > 70 ? warning.slice(0, 67) + '...' : warning}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CTA with premium styling */}
      <div
        className={`${isMobile ? 'absolute bottom-14' : 'mt-8'} z-10`}
        style={{
          opacity: ctaProgress,
          transform: `translateY(${(1 - ctaProgress) * 10}px)`,
        }}
      >
        <div
          className="flex items-center gap-3 px-5 py-2.5 rounded-full"
          style={{
            background: `linear-gradient(135deg, ${style.primary}20, ${style.secondary}10)`,
            border: `1px solid ${style.primary}40`,
            boxShadow: `0 4px 20px ${style.primary}20`,
          }}
        >
          <span
            className="text-sm font-semibold"
            style={{ color: style.primary }}
          >
            {cta}
          </span>
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke={style.primary}
            strokeWidth={2.5}
            style={{
              transform: `translateX(${pulse * 3}px)`,
            }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>
      </div>

      {/* Premium corner accents */}
      {!isMobile && (
        <>
          <div className="absolute top-8 left-8" style={{ opacity: bgProgress * 0.5 }}>
            <svg width="50" height="50" viewBox="0 0 50 50">
              <path
                d="M0 25 L0 0 L25 0"
                fill="none"
                stroke={style.primary}
                strokeWidth="2"
                style={{
                  strokeDasharray: 50,
                  strokeDashoffset: 50 - bgProgress * 50,
                }}
              />
            </svg>
          </div>
          <div className="absolute top-8 right-8" style={{ opacity: bgProgress * 0.5 }}>
            <svg width="50" height="50" viewBox="0 0 50 50">
              <path
                d="M25 0 L50 0 L50 25"
                fill="none"
                stroke={style.primary}
                strokeWidth="2"
                style={{
                  strokeDasharray: 50,
                  strokeDashoffset: 50 - bgProgress * 50,
                }}
              />
            </svg>
          </div>
          <div className="absolute bottom-8 left-8" style={{ opacity: bgProgress * 0.5 }}>
            <svg width="50" height="50" viewBox="0 0 50 50">
              <path
                d="M0 25 L0 50 L25 50"
                fill="none"
                stroke={style.primary}
                strokeWidth="2"
                style={{
                  strokeDasharray: 50,
                  strokeDashoffset: 50 - bgProgress * 50,
                }}
              />
            </svg>
          </div>
          <div className="absolute bottom-8 right-8" style={{ opacity: bgProgress * 0.5 }}>
            <svg width="50" height="50" viewBox="0 0 50 50">
              <path
                d="M50 25 L50 50 L25 50"
                fill="none"
                stroke={style.primary}
                strokeWidth="2"
                style={{
                  strokeDasharray: 50,
                  strokeDashoffset: 50 - bgProgress * 50,
                }}
              />
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
