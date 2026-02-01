'use client';

import { spring, easeOutCubic, easeOutQuart, easeOutExpo } from '../useVideoPlayback';
import { AlertStack, type AlertItem } from '../primitives';
import { FlagIcon, CriticalIcon, WarningIcon } from '../icons';
import type { BaseSceneProps } from '../configs/types';

interface CorruptionFlag {
  flag: string;
  evidence: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

interface CorruptionFlagsSceneProps extends BaseSceneProps {
  flags: CorruptionFlag[];
  title?: string;
  accentColor: string;
}

/**
 * Corruption flags visualization with stacked alert cards.
 * World-class visual with dramatic red flag reveal.
 */
export function CorruptionFlagsScene({
  fps,
  isRadar,
  format,
  sceneFrame,
  flags,
  title = 'Red Flags Detected',
  accentColor,
}: CorruptionFlagsSceneProps) {
  const isMobile = format === 'mobile';

  // Animation timings
  const headerProgress = spring({ frame: sceneFrame, fps, delay: 0, durationFrames: 25, easing: easeOutQuart });
  const badgesProgress = spring({ frame: sceneFrame, fps, delay: 8, durationFrames: 22, easing: easeOutCubic });
  const stackProgress = spring({ frame: sceneFrame, fps, delay: 15, durationFrames: 35, easing: easeOutExpo });
  const warningProgress = spring({ frame: sceneFrame, fps, delay: 55, durationFrames: 25, easing: easeOutQuart });

  // Animated pulse - more intense for critical issues
  const criticalCount = flags.filter(f => f.severity === 'critical').length;
  const highCount = flags.filter(f => f.severity === 'high').length;
  const pulseIntensity = criticalCount > 0 ? 0.4 : highCount > 0 ? 0.25 : 0.15;
  const pulse = Math.sin((sceneFrame / fps) * Math.PI * 2.5) * 0.5 + 0.5;

  // Warning particles - floating red flags
  const particles = Array.from({ length: 10 }, (_, i) => {
    const angle = (i / 10) * Math.PI * 2 + (sceneFrame / fps) * 0.15;
    const radius = 150 + Math.sin((sceneFrame / fps) * 1.5 + i) * 40;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius * 0.5 - 30,
      opacity: 0.12 + Math.sin((sceneFrame / fps) * 2 + i * 0.5) * 0.08,
      size: 2 + Math.sin((sceneFrame / fps) + i) * 1,
    };
  });

  // Convert to AlertItem format
  const alertItems: AlertItem[] = flags.map(flag => ({
    title: flag.flag,
    description: flag.evidence,
    severity: flag.severity,
  }));

  return (
    <div className={`absolute inset-0 overflow-hidden ${isMobile ? 'p-4 pt-8' : 'p-6'}`}>
      {/* Cinematic letterbox */}
      {!isMobile && (
        <>
          <div className="absolute top-0 left-0 right-0 bg-black z-10" style={{ height: '6%', opacity: headerProgress * 0.9 }} />
          <div className="absolute bottom-0 left-0 right-0 bg-black z-10" style={{ height: '6%', opacity: headerProgress * 0.9 }} />
        </>
      )}

      {/* Background gradient - danger red */}
      <div
        className="absolute inset-0"
        style={{
          background: isRadar
            ? `radial-gradient(ellipse at 30% 20%, rgba(239, 68, 68, ${0.12 + pulse * pulseIntensity * 0.08}) 0%, transparent 50%)`
            : `radial-gradient(ellipse at 30% 20%, rgba(239, 68, 68, ${0.06 + pulse * pulseIntensity * 0.04}) 0%, transparent 50%)`,
          opacity: headerProgress,
        }}
      />

      {/* Pulsing danger ring */}
      <div
        className="absolute top-20 left-1/4 pointer-events-none"
        style={{ opacity: headerProgress * pulseIntensity }}
      >
        <div
          className="rounded-full"
          style={{
            width: 200,
            height: 200,
            border: '1px solid rgba(239, 68, 68, 0.3)',
            opacity: 0.3 + pulse * 0.4,
            transform: `scale(${0.8 + pulse * 0.3})`,
          }}
        />
      </div>

      {/* Animated particles */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {particles.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: '#ef4444',
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
              style={{ backgroundColor: '#ef4444', filter: 'blur(16px)', opacity: 0.4 + pulse * pulseIntensity, transform: `scale(${1.2 + pulse * 0.15})` }}
            />
            <div
              className={`relative flex items-center justify-center rounded-xl backdrop-blur-sm ${
                isRadar ? 'bg-red-500/30 border border-red-400/30' : 'bg-red-100/80 border border-red-200'
              }`}
              style={{ width: isMobile ? 42 : 50, height: isMobile ? 42 : 50 }}
            >
              <FlagIcon size={isMobile ? 22 : 26} color="#ef4444" />
            </div>
          </div>
          <div>
            <h2 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold tracking-tight ${isRadar ? 'text-white' : 'text-stone-900'}`}>
              {title}
            </h2>
            <p className={`text-xs ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
              {flags.length} issues identified
            </p>
          </div>
        </div>
        <div
          className="h-0.5 mt-3 rounded-full"
          style={{ background: `linear-gradient(90deg, #ef4444, transparent)`, transform: `scaleX(${headerProgress})`, transformOrigin: 'left' }}
        />
      </div>

      {/* Severity summary - glassmorphism badges */}
      <div
        className="relative z-20 flex gap-3 mb-4"
        style={{ opacity: badgesProgress, transform: `translateY(${(1 - badgesProgress) * 10}px)` }}
      >
        {criticalCount > 0 && (
          <div
            className={`
              relative overflow-hidden flex items-center gap-2 px-4 py-2.5 rounded-xl backdrop-blur-sm
              bg-gradient-to-br from-red-500/20 to-red-600/5
              ${isRadar ? 'border border-red-500/40' : 'border border-red-200'}
            `}
            style={{ boxShadow: `0 4px 20px rgba(239, 68, 68, ${0.1 + pulse * 0.1})` }}
          >
            <div
              className="absolute inset-0 rounded-xl"
              style={{ background: `radial-gradient(ellipse at center, rgba(239, 68, 68, ${0.1 + pulse * 0.1}) 0%, transparent 70%)` }}
            />
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-red-500" style={{ filter: 'blur(6px)', opacity: 0.5 + pulse * 0.3 }} />
              <CriticalIcon size={18} color="#ef4444" />
            </div>
            <span className={`relative text-sm font-bold ${isRadar ? 'text-red-400' : 'text-red-700'}`}>
              {criticalCount} Critical
            </span>
          </div>
        )}
        {highCount > 0 && (
          <div
            className={`
              relative overflow-hidden flex items-center gap-2 px-4 py-2.5 rounded-xl backdrop-blur-sm
              bg-gradient-to-br from-orange-500/20 to-orange-600/5
              ${isRadar ? 'border border-orange-500/40' : 'border border-orange-200'}
            `}
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-orange-500" style={{ filter: 'blur(6px)', opacity: 0.4 }} />
              <WarningIcon size={18} color="#f97316" />
            </div>
            <span className={`relative text-sm font-bold ${isRadar ? 'text-orange-400' : 'text-orange-700'}`}>
              {highCount} High
            </span>
          </div>
        )}
      </div>

      {/* Alert stack */}
      <div
        className="relative z-20 flex justify-center"
        style={{ opacity: stackProgress, transform: `scale(${0.92 + stackProgress * 0.08})` }}
      >
        <AlertStack
          alerts={alertItems}
          frame={sceneFrame - 15}
          fps={fps}
          isRadar={isRadar}
          width={isMobile ? 300 : 750}
          maxVisible={isMobile ? 3 : 4}
          stackStyle="cascade"
        />
      </div>

      {/* Warning message - premium alert card */}
      {(criticalCount > 0 || highCount > 1) && (
        <div
          className="relative z-20 mt-4 flex justify-center"
          style={{ opacity: warningProgress, transform: `translateY(${(1 - warningProgress) * 15}px)` }}
        >
          <div
            className={`
              relative overflow-hidden px-6 py-4 rounded-2xl backdrop-blur-sm
              bg-gradient-to-br from-red-500/15 to-red-600/5
              ${isRadar ? 'border border-red-500/40' : 'border border-red-200'}
            `}
            style={{ boxShadow: `0 4px 30px rgba(239, 68, 68, ${0.1 + pulse * pulseIntensity * 0.15})` }}
          >
            {/* Animated danger glow */}
            <div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: `radial-gradient(ellipse at center, rgba(239, 68, 68, ${0.1 + pulse * pulseIntensity * 0.1}) 0%, transparent 70%)`,
              }}
            />

            {/* Shine effect */}
            <div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: `linear-gradient(90deg, transparent, rgba(255, 255, 255, ${isRadar ? '0.03' : '0.1'}), transparent)`,
                transform: `translateX(${-100 + (sceneFrame / fps * 30) % 200}%)`,
              }}
            />

            <div className="relative flex items-center justify-center gap-3">
              <div className="relative">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: '#ef4444', filter: 'blur(8px)', opacity: 0.4 + pulse * pulseIntensity }}
                />
                <div className="relative w-10 h-10 rounded-full flex items-center justify-center bg-red-500/20">
                  <WarningIcon size={20} color="#ef4444" />
                </div>
              </div>
              <p className={`text-sm font-medium ${isRadar ? 'text-red-400' : 'text-red-700'}`}>
                Multiple high-severity issues require immediate attention
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Premium corner accents */}
      {!isMobile && (
        <>
          <svg className="absolute top-[8%] left-4 w-12 h-12 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path d="M 0 32 L 0 6 Q 0 0 6 0 L 32 0" fill="none" stroke="#ef4444" strokeWidth={1.5} strokeDasharray={60} strokeDashoffset={60 - 60 * headerProgress} />
          </svg>
          <svg className="absolute top-[8%] right-4 w-12 h-12 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path d="M 48 32 L 48 6 Q 48 0 42 0 L 16 0" fill="none" stroke="#ef4444" strokeWidth={1.5} strokeDasharray={60} strokeDashoffset={60 - 60 * headerProgress} />
          </svg>
          <svg className="absolute bottom-[8%] left-4 w-12 h-12 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path d="M 0 16 L 0 42 Q 0 48 6 48 L 32 48" fill="none" stroke="#ef4444" strokeWidth={1.5} strokeDasharray={60} strokeDashoffset={60 - 60 * headerProgress} />
          </svg>
          <svg className="absolute bottom-[8%] right-4 w-12 h-12 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path d="M 48 16 L 48 42 Q 48 48 42 48 L 16 48" fill="none" stroke="#ef4444" strokeWidth={1.5} strokeDasharray={60} strokeDashoffset={60 - 60 * headerProgress} />
          </svg>
        </>
      )}
    </div>
  );
}
