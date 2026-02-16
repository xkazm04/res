'use client';

import { spring, easeOutQuart } from '../useVideoPlayback';
import { TargetIcon, CriticalIcon, WarningIcon, InfoIcon } from '../icons';
import type { BaseSceneProps } from '../configs/types';
import { spreadEntrance } from '@/src/lib/animation/motion';

interface AtRiskEntity {
  name: string;
  type: string;
  riskLevel: 'critical' | 'high' | 'moderate' | 'low';
  reason: string;
}

interface AtRiskSceneProps extends BaseSceneProps {
  entities: AtRiskEntity[];
  title?: string;
  accentColor: string;
}

/**
 * At-risk entities visualization showing who is affected by a ruling/event.
 * World-class visual with dramatic target reveal.
 */
export function AtRiskScene({
  fps,
  isRadar,
  format,
  sceneFrame,
  sceneDuration,
  entities,
  title = 'Who Is At Risk',
  accentColor,
}: AtRiskSceneProps) {
  const isMobile = format === 'mobile';

  // Animation timings
  const headerProgress = spring({ frame: sceneFrame, fps, delay: 0, durationFrames: 25, easing: easeOutQuart });

  // Proportional stagger delays for entity items
  const getEntityDelay = spreadEntrance(sceneDuration, entities.length, { startPct: 0.05, endPct: 0.65 });

  // Animated pulse
  const pulse = Math.sin((sceneFrame / fps) * Math.PI * 2) * 0.5 + 0.5;

  // Count critical for pulse intensity
  const criticalCount = entities.filter(e => e.riskLevel === 'critical').length;
  const pulseIntensity = criticalCount > 0 ? 0.4 : 0.2;

  // Target ring animation
  const targetRings = Array.from({ length: 3 }, (_, i) => ({
    radius: 100 + i * 50,
    opacity: 0.1 - i * 0.03,
    animatedRadius: 100 + i * 50 + pulse * (10 - i * 3),
  }));

  // Background particles
  const particles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2 + (sceneFrame / fps) * 0.12;
    const radius = 140 + Math.sin((sceneFrame / fps) * 1.4 + i) * 35;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius * 0.5,
      opacity: 0.1 + Math.sin((sceneFrame / fps) * 2 + i * 0.5) * 0.06,
      size: 2 + Math.sin((sceneFrame / fps) + i) * 1,
    };
  });

  // Risk level styling with gradients
  const getRiskStyle = (level: 'critical' | 'high' | 'moderate' | 'low') => {
    switch (level) {
      case 'critical':
        return {
          bg: isRadar ? 'bg-red-500/15' : 'bg-red-50/80',
          gradient: 'from-red-500/20 to-red-600/5',
          text: isRadar ? 'text-red-400' : 'text-red-700',
          border: '#ef4444',
          Icon: CriticalIcon,
          color: '#ef4444',
        };
      case 'high':
        return {
          bg: isRadar ? 'bg-orange-500/15' : 'bg-orange-50/80',
          gradient: 'from-orange-500/20 to-orange-600/5',
          text: isRadar ? 'text-orange-400' : 'text-orange-700',
          border: '#f97316',
          Icon: WarningIcon,
          color: '#f97316',
        };
      case 'moderate':
        return {
          bg: isRadar ? 'bg-amber-500/15' : 'bg-amber-50/80',
          gradient: 'from-amber-500/20 to-amber-600/5',
          text: isRadar ? 'text-amber-400' : 'text-amber-700',
          border: '#f59e0b',
          Icon: WarningIcon,
          color: '#f59e0b',
        };
      default:
        return {
          bg: isRadar ? 'bg-blue-500/15' : 'bg-blue-50/80',
          gradient: 'from-blue-500/20 to-blue-600/5',
          text: isRadar ? 'text-blue-400' : 'text-blue-700',
          border: '#3b82f6',
          Icon: InfoIcon,
          color: '#3b82f6',
        };
    }
  };

  // Sort by risk level
  const riskOrder = ['critical', 'high', 'moderate', 'low'];
  const sortedEntities = [...entities].sort((a, b) =>
    riskOrder.indexOf(a.riskLevel) - riskOrder.indexOf(b.riskLevel)
  );

  return (
    <div className={`absolute inset-0 overflow-hidden ${isMobile ? 'p-5 pt-10' : 'p-7'}`}>

      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: isRadar
            ? `radial-gradient(ellipse at 70% 30%, rgba(239, 68, 68, ${0.1 + pulse * pulseIntensity * 0.05}) 0%, transparent 50%)`
            : `radial-gradient(ellipse at 70% 30%, rgba(239, 68, 68, ${0.05 + pulse * pulseIntensity * 0.03}) 0%, transparent 50%)`,
          opacity: headerProgress,
        }}
      />

      {/* Target rings - pulsing crosshair effect */}
      <div className="absolute top-20 right-20 pointer-events-none" style={{ opacity: headerProgress * 0.3 }}>
        {targetRings.map((ring, i) => (
          <div
            key={i}
            className="absolute rounded-full border"
            style={{
              width: ring.animatedRadius * 2,
              height: ring.animatedRadius * 2,
              top: -ring.animatedRadius,
              left: -ring.animatedRadius,
              borderColor: `rgba(239, 68, 68, ${ring.opacity})`,
              borderWidth: 1,
            }}
          />
        ))}
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
              style={{ backgroundColor: '#ef4444', filter: 'blur(16px)', opacity: 0.4 + pulse * pulseIntensity, transform: `scale(${1.2 + pulse * 0.1})` }}
            />
            <div
              className={`relative flex items-center justify-center rounded-xl backdrop-blur-sm ${
                isRadar ? 'bg-red-500/30 border border-red-400/30' : 'bg-red-100/80 border border-red-200'
              }`}
              style={{ width: isMobile ? 60 : 72, height: isMobile ? 60 : 72 }}
            >
              <TargetIcon size={isMobile ? 30 : 36} color="#ef4444" />
            </div>
          </div>
          <div>
            <h2 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold tracking-tight ${isRadar ? 'text-white' : 'text-stone-900'}`}>
              {title}
            </h2>
            <p className={`text-sm ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
              {entities.length} entities analyzed
            </p>
          </div>
        </div>
        <div
          className="h-0.5 mt-3 rounded-full"
          style={{ background: `linear-gradient(90deg, #ef4444, transparent)`, transform: `scaleX(${headerProgress})`, transformOrigin: 'left' }}
        />
      </div>

      {/* Entity cards - compact layout */}
      <div className={`relative z-20 space-y-2 ${isMobile ? '' : 'px-1'}`}>
        {sortedEntities.slice(0, 3).map((entity, i) => {
          const delay = getEntityDelay(i);
          const cardProgress = spring({ frame: sceneFrame, fps, delay, durationFrames: 28, easing: easeOutQuart });
          const style = getRiskStyle(entity.riskLevel);

          return (
            <div
              key={i}
              className={`
                relative overflow-hidden px-3 py-2.5 rounded-xl border backdrop-blur-sm
                ${isRadar ? 'border-slate-700/50' : 'border-stone-200'}
              `}
              style={{
                opacity: cardProgress,
                transform: `translateX(${(1 - cardProgress) * 20}px)`,
                borderLeftWidth: 3,
                borderLeftColor: style.border,
                backgroundColor: isRadar ? 'rgba(30,41,59,0.5)' : 'rgba(255,255,255,0.7)',
              }}
            >
              <div className="relative flex items-center gap-3">
                {/* Icon */}
                <div
                  className="relative flex items-center justify-center rounded-lg flex-shrink-0"
                  style={{ width: 44, height: 44, backgroundColor: `${style.color}18` }}
                >
                  <style.Icon size={22} color={style.color} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-sm font-bold ${isRadar ? 'text-white' : 'text-stone-800'}`}>
                      {entity.name}
                    </span>
                    <span
                      className="px-1.5 py-0.5 rounded text-xs font-bold uppercase flex-shrink-0"
                      style={{ backgroundColor: `${style.color}18`, color: style.color }}
                    >
                      {entity.riskLevel}
                    </span>
                    <span className={`text-xs flex-shrink-0 ${isRadar ? 'text-slate-500' : 'text-stone-400'}`}>
                      {entity.type}
                    </span>
                  </div>
                  <p className={`text-[13px] leading-snug truncate ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
                    {entity.reason}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Premium corner accents */}
      {!isMobile && (
        <>
          <svg className="absolute top-5 left-5 w-16 h-16 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path d="M 0 40 L 0 8 Q 0 0 8 0 L 40 0" fill="none" stroke="#ef4444" strokeWidth={1.5} strokeDasharray={80} strokeDashoffset={80 - 80 * headerProgress} />
          </svg>
          <svg className="absolute top-5 right-5 w-16 h-16 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path d="M 64 40 L 64 8 Q 64 0 56 0 L 24 0" fill="none" stroke="#ef4444" strokeWidth={1.5} strokeDasharray={80} strokeDashoffset={80 - 80 * headerProgress} />
          </svg>
          <svg className="absolute bottom-5 left-5 w-16 h-16 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path d="M 0 24 L 0 56 Q 0 64 8 64 L 40 64" fill="none" stroke="#ef4444" strokeWidth={1.5} strokeDasharray={80} strokeDashoffset={80 - 80 * headerProgress} />
          </svg>
          <svg className="absolute bottom-5 right-5 w-16 h-16 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path d="M 64 24 L 64 56 Q 64 64 56 64 L 24 64" fill="none" stroke="#ef4444" strokeWidth={1.5} strokeDasharray={80} strokeDashoffset={80 - 80 * headerProgress} />
          </svg>
        </>
      )}
    </div>
  );
}
