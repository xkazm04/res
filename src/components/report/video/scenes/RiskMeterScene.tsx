'use client';

import { spring, easeOutCubic, easeOutQuart, easeOutExpo } from '../useVideoPlayback';
import { GaugeMeter, type GaugeFactor } from '../primitives';
import { WarningIcon, SuccessIcon, CriticalIcon } from '../icons';
import type { BaseSceneProps } from '../configs/types';

interface RiskMeterSceneProps extends BaseSceneProps {
  riskScore: number;
  riskFactors: Array<{ label: string; value: number; type?: 'positive' | 'negative' | 'neutral' }>;
  title?: string;
  accentColor: string;
}

/**
 * Risk meter visualization with gauge and contributing factors.
 * World-class visual with dramatic gauge animation.
 */
export function RiskMeterScene({
  fps,
  isRadar,
  format,
  sceneFrame,
  riskScore,
  riskFactors,
  title = 'Risk Assessment',
  accentColor,
}: RiskMeterSceneProps) {
  const isMobile = format === 'mobile';

  // Animation timings
  const headerProgress = spring({ frame: sceneFrame, fps, delay: 0, durationFrames: 25, easing: easeOutQuart });
  const gaugeProgress = spring({ frame: sceneFrame, fps, delay: 8, durationFrames: 40, easing: easeOutExpo });
  const factorsProgress = spring({ frame: sceneFrame, fps, delay: 30, durationFrames: 28, easing: easeOutCubic });
  const interpretProgress = spring({ frame: sceneFrame, fps, delay: 50, durationFrames: 25, easing: easeOutQuart });

  // Animated pulse based on risk level
  const pulse = Math.sin((sceneFrame / fps) * Math.PI * 2) * 0.5 + 0.5;

  // Convert to GaugeFactor format
  const factors: GaugeFactor[] = riskFactors.slice(0, isMobile ? 4 : 6).map(f => ({
    label: f.label,
    value: f.value,
    type: f.type,
  }));

  // Risk level styling
  const getRiskLevel = (score: number) => {
    if (score <= 30) return {
      text: 'Low Risk',
      color: '#22c55e',
      gradient: 'from-emerald-500/15 to-emerald-600/5',
      borderColor: 'border-emerald-400/30',
      Icon: SuccessIcon,
      description: 'Risk factors are within acceptable parameters',
      pulseIntensity: 0.1,
    };
    if (score <= 60) return {
      text: 'Moderate Risk',
      color: '#f59e0b',
      gradient: 'from-amber-500/15 to-amber-600/5',
      borderColor: 'border-amber-400/30',
      Icon: WarningIcon,
      description: 'Some concerning risk factors require attention',
      pulseIntensity: 0.2,
    };
    return {
      text: 'High Risk',
      color: '#ef4444',
      gradient: 'from-red-500/15 to-red-600/5',
      borderColor: 'border-red-400/30',
      Icon: CriticalIcon,
      description: 'Multiple high-severity risk factors identified',
      pulseIntensity: 0.4,
    };
  };

  const riskLevel = getRiskLevel(riskScore);

  // Background particles that vary by risk level
  const particles = Array.from({ length: 10 }, (_, i) => {
    const angle = (i / 10) * Math.PI * 2 + (sceneFrame / fps) * (0.1 + riskScore * 0.002);
    const radius = 160 + Math.sin((sceneFrame / fps) * 1.5 + i) * 40;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      opacity: 0.15 + Math.sin((sceneFrame / fps) * 2 + i * 0.5) * 0.1,
      size: 2 + Math.sin((sceneFrame / fps) + i) * 1,
    };
  });

  // Count factors by type
  const positiveCount = riskFactors.filter(f => f.type === 'positive').length;
  const negativeCount = riskFactors.filter(f => f.type === 'negative').length;

  return (
    <div className={`absolute inset-0 overflow-hidden ${isMobile ? 'p-4 pt-8' : 'p-6'}`}>
      {/* Cinematic letterbox for desktop */}
      {!isMobile && (
        <>
          <div
            className="absolute top-0 left-0 right-0 bg-black z-10"
            style={{ height: '6%', opacity: headerProgress * 0.9 }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 bg-black z-10"
            style={{ height: '6%', opacity: headerProgress * 0.9 }}
          />
        </>
      )}

      {/* Background gradient - varies by risk */}
      <div
        className="absolute inset-0"
        style={{
          background: isRadar
            ? `radial-gradient(ellipse at 50% 30%, ${riskLevel.color}15 0%, transparent 60%)`
            : `radial-gradient(ellipse at 50% 30%, ${riskLevel.color}08 0%, transparent 60%)`,
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
              backgroundColor: riskLevel.color,
              transform: `translate(${p.x}px, ${p.y}px)`,
              opacity: p.opacity * headerProgress,
              filter: 'blur(1px)',
            }}
          />
        ))}
      </div>

      {/* Pulsing risk indicator ring */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ opacity: gaugeProgress * riskLevel.pulseIntensity }}
      >
        <div
          className="rounded-full"
          style={{
            width: isMobile ? 250 : 350,
            height: isMobile ? 250 : 350,
            border: `2px solid ${riskLevel.color}`,
            opacity: 0.2 + pulse * 0.3,
            transform: `scale(${1 + pulse * 0.05})`,
          }}
        />
      </div>

      {/* Header */}
      <div
        className="relative z-20 mb-4 text-center"
        style={{
          opacity: headerProgress,
          transform: `translateY(${(1 - headerProgress) * -20}px)`,
        }}
      >
        <div className="inline-flex items-center gap-3">
          {/* Icon with glow */}
          <div className="relative">
            <div
              className="absolute inset-0 rounded-xl"
              style={{
                backgroundColor: riskLevel.color,
                filter: 'blur(16px)',
                opacity: 0.4 + pulse * riskLevel.pulseIntensity,
                transform: `scale(${1.2 + pulse * 0.1})`,
              }}
            />
            <div
              className={`relative flex items-center justify-center rounded-xl backdrop-blur-sm border`}
              style={{
                width: isMobile ? 42 : 50,
                height: isMobile ? 42 : 50,
                backgroundColor: `${riskLevel.color}20`,
                borderColor: `${riskLevel.color}40`,
              }}
            >
              <riskLevel.Icon size={isMobile ? 22 : 26} color={riskLevel.color} />
            </div>
          </div>
          <div className="text-left">
            <h2 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold tracking-tight ${isRadar ? 'text-white' : 'text-stone-900'}`}>
              {title}
            </h2>
            <p className={`text-xs ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
              {riskFactors.length} factors analyzed
            </p>
          </div>
        </div>
      </div>

      {/* Main content - Gauge and factors side by side on desktop */}
      <div className={`relative z-20 flex ${isMobile ? 'flex-col items-center' : 'items-start justify-center gap-8'}`}>
        {/* Gauge meter */}
        <div
          style={{
            opacity: gaugeProgress,
            transform: `scale(${0.85 + gaugeProgress * 0.15})`,
          }}
        >
          <GaugeMeter
            value={riskScore}
            label={riskLevel.text}
            sublabel="Overall risk score"
            factors={factors}
            frame={sceneFrame}
            fps={fps}
            isRadar={isRadar}
            size={isMobile ? 200 : 260}
            colorMode="risk"
            showValue={true}
            showFactors={false}
          />
        </div>

        {/* Factors list - desktop only beside gauge */}
        {!isMobile && (
          <div
            className="flex-shrink-0"
            style={{
              width: 280,
              opacity: factorsProgress,
              transform: `translateX(${(1 - factorsProgress) * 30}px)`,
            }}
          >
            <h3 className={`text-sm font-bold mb-3 ${isRadar ? 'text-slate-300' : 'text-stone-700'}`}>
              Risk Factors
            </h3>
            <div className="space-y-2">
              {riskFactors.slice(0, 5).map((factor, i) => {
                const itemDelay = 35 + i * 5;
                const itemProgress = spring({ frame: sceneFrame, fps, delay: itemDelay, durationFrames: 18, easing: easeOutCubic });
                const factorColor = factor.type === 'positive' ? '#22c55e' : factor.type === 'negative' ? '#ef4444' : '#64748b';

                return (
                  <div
                    key={i}
                    className={`
                      relative p-3 rounded-xl backdrop-blur-sm
                      ${isRadar
                        ? 'bg-slate-800/50 border border-slate-700/50'
                        : 'bg-white/70 border border-stone-200'}
                    `}
                    style={{
                      opacity: itemProgress,
                      transform: `translateX(${(1 - itemProgress) * 20}px)`,
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: factorColor }}
                        />
                        <span className={`text-xs truncate ${isRadar ? 'text-slate-300' : 'text-stone-700'}`}>
                          {factor.label}
                        </span>
                      </div>
                      <div
                        className="flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-bold"
                        style={{
                          backgroundColor: `${factorColor}20`,
                          color: factorColor,
                        }}
                      >
                        {factor.value}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Risk interpretation card */}
      <div
        className="relative z-20 mt-5 flex justify-center"
        style={{
          opacity: interpretProgress,
          transform: `translateY(${(1 - interpretProgress) * 15}px)`,
        }}
      >
        <div
          className={`
            relative overflow-hidden w-full max-w-lg px-5 py-4 rounded-2xl backdrop-blur-sm
            bg-gradient-to-br ${riskLevel.gradient}
            ${riskLevel.borderColor} border
          `}
          style={{
            boxShadow: `0 4px 30px ${riskLevel.color}15`,
          }}
        >
          {/* Animated glow based on risk */}
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: `radial-gradient(ellipse at center, ${riskLevel.color}${Math.round(10 + pulse * riskLevel.pulseIntensity * 20).toString(16)} 0%, transparent 70%)`,
            }}
          />

          {/* Shine effect */}
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: `linear-gradient(90deg, transparent, rgba(255, 255, 255, ${isRadar ? '0.03' : '0.15'}), transparent)`,
              transform: `translateX(${-100 + (sceneFrame / fps * 25) % 200}%)`,
            }}
          />

          <div className="relative flex items-start gap-4">
            {/* Icon with pulsing glow */}
            <div className="relative flex-shrink-0">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  backgroundColor: riskLevel.color,
                  filter: 'blur(10px)',
                  opacity: 0.3 + pulse * riskLevel.pulseIntensity,
                  transform: `scale(${1.4 + pulse * 0.2})`,
                }}
              />
              <div
                className="relative w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${riskLevel.color}25` }}
              >
                <riskLevel.Icon size={24} color={riskLevel.color} />
              </div>
            </div>

            <div className="flex-1">
              <div
                className="text-base font-bold mb-1"
                style={{ color: riskLevel.color }}
              >
                {riskLevel.text}
              </div>
              <p className={`text-xs leading-relaxed ${isRadar ? 'text-slate-400' : 'text-stone-600'}`}>
                {riskLevel.description}
              </p>

              {/* Factor summary */}
              <div className={`mt-3 pt-3 border-t ${isRadar ? 'border-slate-700/50' : 'border-stone-200/50'}`}>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className={isRadar ? 'text-emerald-400' : 'text-emerald-600'}>
                      {positiveCount} positive
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className={isRadar ? 'text-red-400' : 'text-red-600'}>
                      {negativeCount} concerns
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium corner accents */}
      {!isMobile && (
        <>
          <svg className="absolute top-[8%] left-4 w-12 h-12 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path
              d="M 0 32 L 0 6 Q 0 0 6 0 L 32 0"
              fill="none"
              stroke={riskLevel.color}
              strokeWidth={1.5}
              strokeDasharray={60}
              strokeDashoffset={60 - 60 * headerProgress}
            />
          </svg>
          <svg className="absolute top-[8%] right-4 w-12 h-12 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path
              d="M 48 32 L 48 6 Q 48 0 42 0 L 16 0"
              fill="none"
              stroke={riskLevel.color}
              strokeWidth={1.5}
              strokeDasharray={60}
              strokeDashoffset={60 - 60 * headerProgress}
            />
          </svg>
          <svg className="absolute bottom-[8%] left-4 w-12 h-12 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path
              d="M 0 16 L 0 42 Q 0 48 6 48 L 32 48"
              fill="none"
              stroke={riskLevel.color}
              strokeWidth={1.5}
              strokeDasharray={60}
              strokeDashoffset={60 - 60 * headerProgress}
            />
          </svg>
          <svg className="absolute bottom-[8%] right-4 w-12 h-12 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path
              d="M 48 16 L 48 42 Q 48 48 42 48 L 16 48"
              fill="none"
              stroke={riskLevel.color}
              strokeWidth={1.5}
              strokeDasharray={60}
              strokeDashoffset={60 - 60 * headerProgress}
            />
          </svg>
        </>
      )}
    </div>
  );
}
