'use client';

import { spring, easeOutCubic, easeOutQuart, easeOutExpo } from '../useVideoPlayback';
import { ComparisonBars, type ComparisonItem } from '../primitives';
import { MaskIcon, WarningIcon, SuccessIcon, InfoIcon } from '../icons';
import type { BaseSceneProps } from '../configs/types';

interface HypeRealityItem {
  claim: string;
  hypeScore: number;
  realityScore: number;
}

interface HypeVsRealitySceneProps extends BaseSceneProps {
  items: HypeRealityItem[];
  title?: string;
  accentColor: string;
}

/**
 * Hype vs Reality comparison visualization.
 * World-class visual with dramatic split animations.
 */
export function HypeVsRealityScene({
  fps,
  isRadar,
  format,
  sceneFrame,
  items,
  title = 'Hype vs Reality',
  accentColor,
}: HypeVsRealitySceneProps) {
  const isMobile = format === 'mobile';

  // Animation timings
  const headerProgress = spring({ frame: sceneFrame, fps, delay: 0, durationFrames: 25, easing: easeOutQuart });
  const legendProgress = spring({ frame: sceneFrame, fps, delay: 5, durationFrames: 20, easing: easeOutCubic });
  const barsProgress = spring({ frame: sceneFrame, fps, delay: 12, durationFrames: 32, easing: easeOutExpo });
  const insightProgress = spring({ frame: sceneFrame, fps, delay: 50, durationFrames: 25, easing: easeOutQuart });

  // Animated pulse
  const pulse = Math.sin((sceneFrame / fps) * Math.PI * 2) * 0.5 + 0.5;

  // Background particles - split between hype (purple) and reality (cyan)
  const particles = Array.from({ length: 14 }, (_, i) => {
    const isHypeSide = i < 7;
    const localIndex = isHypeSide ? i : i - 7;
    const angle = (localIndex / 7) * Math.PI + (isHypeSide ? Math.PI : 0) + (sceneFrame / fps) * (isHypeSide ? 0.12 : -0.12);
    const radius = 150 + Math.sin((sceneFrame / fps) * 1.2 + i) * 35;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius * 0.6,
      opacity: 0.12 + Math.sin((sceneFrame / fps) * 2 + i * 0.4) * 0.08,
      size: 2 + Math.sin((sceneFrame / fps) + i) * 1,
      color: isHypeSide ? '#8b5cf6' : '#06b6d4',
    };
  });

  // Convert to comparison items
  const comparisonItems: ComparisonItem[] = items.slice(0, isMobile ? 4 : 5).map(item => ({
    label: item.claim.length > 16 ? item.claim.slice(0, 14) + '...' : item.claim,
    leftValue: item.hypeScore,
    rightValue: item.realityScore,
    highlight: item.realityScore >= item.hypeScore ? 'right' : 'left',
  }));

  // Calculate gap analysis
  const avgHype = items.reduce((sum, i) => sum + i.hypeScore, 0) / items.length;
  const avgReality = items.reduce((sum, i) => sum + i.realityScore, 0) / items.length;
  const hypeGap = avgHype - avgReality;

  // Get insight styling
  const getInsightStyle = () => {
    if (hypeGap > 30) return {
      Icon: WarningIcon,
      color: '#f59e0b',
      gradient: 'from-amber-500/15 to-amber-600/5',
      borderColor: 'border-amber-400/30',
      text: isRadar ? 'text-amber-400' : 'text-amber-700',
      message: 'Significant hype gap detected',
      pulseIntensity: 0.3,
    };
    if (hypeGap > 10) return {
      Icon: InfoIcon,
      color: '#3b82f6',
      gradient: 'from-blue-500/15 to-blue-600/5',
      borderColor: 'border-blue-400/30',
      text: isRadar ? 'text-blue-400' : 'text-blue-700',
      message: 'Moderate hype inflation',
      pulseIntensity: 0.2,
    };
    if (hypeGap > 0) return {
      Icon: SuccessIcon,
      color: '#22c55e',
      gradient: 'from-emerald-500/15 to-emerald-600/5',
      borderColor: 'border-emerald-400/30',
      text: isRadar ? 'text-emerald-400' : 'text-emerald-700',
      message: 'Claims mostly aligned with reality',
      pulseIntensity: 0.1,
    };
    return {
      Icon: SuccessIcon,
      color: '#22c55e',
      gradient: 'from-emerald-500/15 to-emerald-600/5',
      borderColor: 'border-emerald-400/30',
      text: isRadar ? 'text-emerald-400' : 'text-emerald-700',
      message: 'Reality exceeds expectations',
      pulseIntensity: 0.1,
    };
  };

  const insight = getInsightStyle();

  return (
    <div className={`absolute inset-0 overflow-hidden ${isMobile ? 'p-4 pt-8' : 'p-6'}`}>
      {/* Cinematic letterbox */}
      {!isMobile && (
        <>
          <div className="absolute top-0 left-0 right-0 bg-black z-10" style={{ height: '6%', opacity: headerProgress * 0.9 }} />
          <div className="absolute bottom-0 left-0 right-0 bg-black z-10" style={{ height: '6%', opacity: headerProgress * 0.9 }} />
        </>
      )}

      {/* Split background gradients */}
      <div
        className="absolute inset-0"
        style={{
          background: isRadar
            ? `linear-gradient(90deg, rgba(139, 92, 246, 0.08) 0%, transparent 50%, rgba(6, 182, 212, 0.08) 100%)`
            : `linear-gradient(90deg, rgba(139, 92, 246, 0.04) 0%, transparent 50%, rgba(6, 182, 212, 0.04) 100%)`,
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
              backgroundColor: p.color,
              transform: `translate(${p.x}px, ${p.y}px)`,
              opacity: p.opacity * headerProgress,
              filter: 'blur(1px)',
            }}
          />
        ))}
      </div>

      {/* Central divider glow */}
      <div
        className="absolute top-[10%] bottom-[10%] left-1/2 w-px pointer-events-none"
        style={{
          background: `linear-gradient(180deg, transparent, ${accentColor}40, transparent)`,
          opacity: barsProgress * 0.6,
          boxShadow: `0 0 20px ${accentColor}30`,
        }}
      />

      {/* Header */}
      <div
        className="relative z-20 mb-4"
        style={{ opacity: headerProgress, transform: `translateX(${(1 - headerProgress) * -30}px)` }}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className="absolute inset-0 rounded-xl"
              style={{ backgroundColor: '#8b5cf6', filter: 'blur(16px)', opacity: 0.4 + pulse * 0.2, transform: `scale(${1.2 + pulse * 0.1})` }}
            />
            <div
              className={`relative flex items-center justify-center rounded-xl backdrop-blur-sm ${
                isRadar ? 'bg-purple-500/30 border border-purple-400/30' : 'bg-purple-100/80 border border-purple-200'
              }`}
              style={{ width: isMobile ? 42 : 50, height: isMobile ? 42 : 50 }}
            >
              <MaskIcon size={isMobile ? 22 : 26} color="#8b5cf6" />
            </div>
          </div>
          <div>
            <h2 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold tracking-tight ${isRadar ? 'text-white' : 'text-stone-900'}`}>
              {title}
            </h2>
            <p className={`text-xs ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
              {items.length} claims analyzed
            </p>
          </div>
        </div>
        <div
          className="h-0.5 mt-3 rounded-full"
          style={{ background: `linear-gradient(90deg, #8b5cf6, ${accentColor}, #06b6d4)`, transform: `scaleX(${headerProgress})`, transformOrigin: 'left' }}
        />
      </div>

      {/* Legend - glassmorphism */}
      <div
        className={`
          relative z-20 flex justify-center gap-8 mb-4 p-3 rounded-xl backdrop-blur-sm
          ${isRadar ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-white/60 border border-stone-200'}
        `}
        style={{ opacity: legendProgress, transform: `translateY(${(1 - legendProgress) * 10}px)` }}
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-purple-500" style={{ filter: 'blur(4px)', opacity: 0.5 }} />
            <div className="relative w-4 h-4 rounded-full bg-purple-500" />
          </div>
          <span className={`text-xs font-medium ${isRadar ? 'text-slate-300' : 'text-stone-600'}`}>Media Hype</span>
        </div>
        <div className={`h-5 w-px ${isRadar ? 'bg-slate-600' : 'bg-stone-300'}`} />
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-cyan-500" style={{ filter: 'blur(4px)', opacity: 0.5 }} />
            <div className="relative w-4 h-4 rounded-full bg-cyan-500" />
          </div>
          <span className={`text-xs font-medium ${isRadar ? 'text-slate-300' : 'text-stone-600'}`}>Developer Reality</span>
        </div>
      </div>

      {/* Comparison bars */}
      <div
        className="relative z-20 flex-1 flex items-center justify-center"
        style={{ opacity: barsProgress, transform: `scale(${0.92 + barsProgress * 0.08})` }}
      >
        <ComparisonBars
          items={comparisonItems}
          frame={sceneFrame - 12}
          fps={fps}
          isRadar={isRadar}
          width={isMobile ? 300 : 800}
          leftHeader="Hype"
          rightHeader="Reality"
          leftColor="#8b5cf6"
          rightColor="#06b6d4"
          maxValue={100}
          showPercentage={true}
        />
      </div>

      {/* Gap analysis - premium card */}
      <div
        className="relative z-20 mt-4 flex justify-center"
        style={{ opacity: insightProgress, transform: `translateY(${(1 - insightProgress) * 15}px)` }}
      >
        <div
          className={`
            relative overflow-hidden px-6 py-4 rounded-2xl backdrop-blur-sm
            bg-gradient-to-br ${insight.gradient}
            ${insight.borderColor} border
          `}
          style={{ boxShadow: `0 4px 30px ${insight.color}15` }}
        >
          {/* Animated glow */}
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: `radial-gradient(ellipse at center, ${insight.color}${Math.round(8 + pulse * insight.pulseIntensity * 15).toString(16)} 0%, transparent 70%)`,
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

          <div className="relative flex items-center justify-center gap-3">
            <div className="relative">
              <div
                className="absolute inset-0 rounded-full"
                style={{ backgroundColor: insight.color, filter: 'blur(8px)', opacity: 0.4 + pulse * insight.pulseIntensity }}
              />
              <div
                className="relative w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${insight.color}20` }}
              >
                <insight.Icon size={20} color={insight.color} />
              </div>
            </div>
            <div className="text-left">
              <p className={`text-sm font-bold ${insight.text}`}>
                {insight.message}
              </p>
              <p className={`text-xs ${isRadar ? 'text-slate-500' : 'text-stone-400'}`}>
                Average gap: <span className="font-semibold" style={{ color: insight.color }}>{hypeGap > 0 ? '+' : ''}{hypeGap.toFixed(0)}</span> points
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Premium corner accents */}
      {!isMobile && (
        <>
          <svg className="absolute top-[8%] left-4 w-12 h-12 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path d="M 0 32 L 0 6 Q 0 0 6 0 L 32 0" fill="none" stroke="#8b5cf6" strokeWidth={1.5} strokeDasharray={60} strokeDashoffset={60 - 60 * headerProgress} />
          </svg>
          <svg className="absolute top-[8%] right-4 w-12 h-12 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path d="M 48 32 L 48 6 Q 48 0 42 0 L 16 0" fill="none" stroke="#06b6d4" strokeWidth={1.5} strokeDasharray={60} strokeDashoffset={60 - 60 * headerProgress} />
          </svg>
          <svg className="absolute bottom-[8%] left-4 w-12 h-12 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path d="M 0 16 L 0 42 Q 0 48 6 48 L 32 48" fill="none" stroke="#8b5cf6" strokeWidth={1.5} strokeDasharray={60} strokeDashoffset={60 - 60 * headerProgress} />
          </svg>
          <svg className="absolute bottom-[8%] right-4 w-12 h-12 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path d="M 48 16 L 48 42 Q 48 48 42 48 L 16 48" fill="none" stroke="#06b6d4" strokeWidth={1.5} strokeDasharray={60} strokeDashoffset={60 - 60 * headerProgress} />
          </svg>
        </>
      )}
    </div>
  );
}
