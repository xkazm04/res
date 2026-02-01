'use client';

import { spring, easeOutCubic, easeOutQuart, easeOutExpo } from '../useVideoPlayback';
import { TargetIcon, CriticalIcon, WarningIcon, InfoIcon } from '../icons';
import type { BaseSceneProps } from '../configs/types';

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
  entities,
  title = 'Who Is At Risk',
  accentColor,
}: AtRiskSceneProps) {
  const isMobile = format === 'mobile';

  // Animation timings
  const headerProgress = spring({ frame: sceneFrame, fps, delay: 0, durationFrames: 25, easing: easeOutQuart });
  const summaryProgress = spring({ frame: sceneFrame, fps, delay: 8, durationFrames: 22, easing: easeOutCubic });
  const cardsProgress = spring({ frame: sceneFrame, fps, delay: 15, durationFrames: 35, easing: easeOutExpo });

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
              style={{ width: isMobile ? 42 : 50, height: isMobile ? 42 : 50 }}
            >
              <TargetIcon size={isMobile ? 22 : 26} color="#ef4444" />
            </div>
          </div>
          <div>
            <h2 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold tracking-tight ${isRadar ? 'text-white' : 'text-stone-900'}`}>
              {title}
            </h2>
            <p className={`text-xs ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
              {entities.length} entities analyzed
            </p>
          </div>
        </div>
        <div
          className="h-0.5 mt-3 rounded-full"
          style={{ background: `linear-gradient(90deg, #ef4444, transparent)`, transform: `scaleX(${headerProgress})`, transformOrigin: 'left' }}
        />
      </div>

      {/* Risk summary badges - glassmorphism */}
      <div
        className={`
          relative z-20 inline-flex flex-wrap gap-2 mb-4 p-3 rounded-xl backdrop-blur-sm
          ${isRadar ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-white/60 border border-stone-200'}
        `}
        style={{ opacity: summaryProgress, transform: `translateY(${(1 - summaryProgress) * 10}px)` }}
      >
        {(['critical', 'high', 'moderate', 'low'] as const).map((level, i) => {
          const count = entities.filter(e => e.riskLevel === level).length;
          if (count === 0) return null;
          const style = getRiskStyle(level);
          const itemProgress = spring({ frame: sceneFrame, fps, delay: 10 + i * 3, durationFrames: 15, easing: easeOutCubic });

          return (
            <div
              key={level}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full`}
              style={{ backgroundColor: `${style.color}15`, opacity: itemProgress }}
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-full" style={{ backgroundColor: style.color, filter: 'blur(3px)', opacity: 0.4 }} />
                <style.Icon size={12} color={style.color} />
              </div>
              <span className={`text-xs font-bold ${style.text}`}>
                {count} {level}
              </span>
            </div>
          );
        })}
      </div>

      {/* Entity cards - premium */}
      <div className={`relative z-20 space-y-3 ${isMobile ? '' : 'px-1'}`}>
        {sortedEntities.slice(0, isMobile ? 3 : 4).map((entity, i) => {
          const delay = 18 + i * 7;
          const cardProgress = spring({ frame: sceneFrame, fps, delay, durationFrames: 28, easing: easeOutQuart });
          const style = getRiskStyle(entity.riskLevel);

          return (
            <div
              key={i}
              className={`
                relative overflow-hidden p-4 rounded-2xl border backdrop-blur-sm
                bg-gradient-to-br ${style.gradient}
                ${isRadar ? 'border-slate-700/50' : 'border-stone-200'}
              `}
              style={{
                opacity: cardProgress,
                transform: `translateX(${(1 - cardProgress) * 30}px)`,
                borderLeftWidth: 4,
                borderLeftColor: style.border,
                boxShadow: `0 4px 20px ${style.color}10`,
              }}
            >
              {/* Card inner glow */}
              <div
                className="absolute inset-0 rounded-2xl"
                style={{ background: `radial-gradient(ellipse at top left, ${style.color}${Math.round(8 + pulse * 5).toString(16)} 0%, transparent 50%)` }}
              />

              <div className="relative flex items-start gap-3">
                <div className="relative flex-shrink-0">
                  <div
                    className="absolute inset-0 rounded-xl"
                    style={{ backgroundColor: style.color, filter: 'blur(8px)', opacity: 0.25 + pulse * 0.1 }}
                  />
                  <div
                    className="relative flex items-center justify-center rounded-xl"
                    style={{ width: 40, height: 40, backgroundColor: `${style.color}20` }}
                  >
                    <style.Icon size={20} color={style.color} />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-sm font-bold ${isRadar ? 'text-white' : 'text-stone-800'}`}>
                      {entity.name}
                    </span>
                    <span
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase"
                      style={{ backgroundColor: `${style.color}20`, color: style.color }}
                    >
                      {entity.riskLevel}
                    </span>
                  </div>

                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium mb-2 ${
                    isRadar ? 'bg-slate-700/80 text-slate-300' : 'bg-stone-100 text-stone-600'
                  }`}>
                    {entity.type}
                  </span>

                  <p className={`text-xs leading-relaxed ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
                    {entity.reason.length > 80 ? entity.reason.slice(0, 77) + '...' : entity.reason}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* More indicator */}
      {entities.length > (isMobile ? 3 : 4) && (
        <div
          className="relative z-20 mt-4 text-center"
          style={{ opacity: spring({ frame: sceneFrame, fps, delay: 55, durationFrames: 20, easing: easeOutCubic }) }}
        >
          <span className={`text-sm font-medium ${isRadar ? 'text-slate-500' : 'text-stone-400'}`}>
            +{entities.length - (isMobile ? 3 : 4)} more entities at risk
          </span>
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
