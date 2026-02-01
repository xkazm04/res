'use client';

import { spring, easeOutCubic, easeOutQuart, easeOutExpo } from '../useVideoPlayback';
import { ComparisonBars, type ComparisonItem } from '../primitives';
import { ContractIcon, WarningIcon, SuccessIcon } from '../icons';
import type { BaseSceneProps } from '../configs/types';

interface PriceItem {
  item: string;
  contractPrice: number;
  marketPrice: number;
}

interface PriceComparisonSceneProps extends BaseSceneProps {
  items: PriceItem[];
  contractName?: string;
  currency?: string;
  accentColor: string;
}

/**
 * Contract vs market rate comparison visualization.
 * World-class visual with dramatic price reveal.
 */
export function PriceComparisonScene({
  fps,
  isRadar,
  format,
  sceneFrame,
  items,
  contractName = 'Contract',
  currency = '$',
  accentColor,
}: PriceComparisonSceneProps) {
  const isMobile = format === 'mobile';

  // Animation timings
  const headerProgress = spring({ frame: sceneFrame, fps, delay: 0, durationFrames: 25, easing: easeOutQuart });
  const legendProgress = spring({ frame: sceneFrame, fps, delay: 5, durationFrames: 20, easing: easeOutCubic });
  const barsProgress = spring({ frame: sceneFrame, fps, delay: 12, durationFrames: 32, easing: easeOutExpo });
  const summaryProgress = spring({ frame: sceneFrame, fps, delay: 50, durationFrames: 28, easing: easeOutQuart });

  // Animated pulse
  const pulse = Math.sin((sceneFrame / fps) * Math.PI * 2) * 0.5 + 0.5;

  // Background particles - currency symbols floating
  const particles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2 + (sceneFrame / fps) * 0.1;
    const radius = 160 + Math.sin((sceneFrame / fps) * 1.3 + i) * 40;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius * 0.5,
      opacity: 0.1 + Math.sin((sceneFrame / fps) * 2 + i * 0.5) * 0.06,
      size: 2 + Math.sin((sceneFrame / fps) + i) * 1,
    };
  });

  // Convert to comparison items
  const comparisonItems: ComparisonItem[] = items.slice(0, isMobile ? 4 : 5).map(item => ({
    label: item.item.length > 14 ? item.item.slice(0, 12) + '...' : item.item,
    leftValue: item.contractPrice,
    rightValue: item.marketPrice,
    highlight: item.contractPrice > item.marketPrice ? 'left' : 'right',
  }));

  // Calculate overcharge
  const totalContract = items.reduce((sum, i) => sum + i.contractPrice, 0);
  const totalMarket = items.reduce((sum, i) => sum + i.marketPrice, 0);
  const overcharge = totalContract - totalMarket;
  const overchargePercent = totalMarket > 0 ? ((overcharge / totalMarket) * 100) : 0;

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `${currency}${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${currency}${(amount / 1000).toFixed(0)}K`;
    return `${currency}${amount.toFixed(0)}`;
  };

  const isOvercharged = overcharge > 0;
  const statusColor = isOvercharged ? '#ef4444' : '#22c55e';
  const statusGradient = isOvercharged ? 'from-red-500/15 to-red-600/5' : 'from-emerald-500/15 to-emerald-600/5';
  const statusBorder = isOvercharged ? 'border-red-400/30' : 'border-emerald-400/30';

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
            ? `radial-gradient(ellipse at 30% 30%, ${accentColor}12 0%, transparent 50%)`
            : `radial-gradient(ellipse at 30% 30%, ${accentColor}06 0%, transparent 50%)`,
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
              backgroundColor: accentColor,
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
              style={{ backgroundColor: '#f59e0b', filter: 'blur(16px)', opacity: 0.4 + pulse * 0.2, transform: `scale(${1.2 + pulse * 0.1})` }}
            />
            <div
              className={`relative flex items-center justify-center rounded-xl backdrop-blur-sm ${
                isRadar ? 'bg-amber-500/30 border border-amber-400/30' : 'bg-amber-100/80 border border-amber-200'
              }`}
              style={{ width: isMobile ? 42 : 50, height: isMobile ? 42 : 50 }}
            >
              <ContractIcon size={isMobile ? 22 : 26} color="#f59e0b" />
            </div>
          </div>
          <div>
            <h2 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold tracking-tight ${isRadar ? 'text-white' : 'text-stone-900'}`}>
              Price Analysis
            </h2>
            <p className={`text-xs ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
              {items.length} line items compared
            </p>
          </div>
        </div>
        <div
          className="h-0.5 mt-3 rounded-full"
          style={{ background: `linear-gradient(90deg, #f59e0b, transparent)`, transform: `scaleX(${headerProgress})`, transformOrigin: 'left' }}
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
            <div className="absolute inset-0 rounded-full bg-red-500" style={{ filter: 'blur(4px)', opacity: 0.5 }} />
            <div className="relative w-4 h-4 rounded-full bg-red-500" />
          </div>
          <span className={`text-xs font-medium ${isRadar ? 'text-slate-300' : 'text-stone-600'}`}>{contractName}</span>
        </div>
        <div className={`h-5 w-px ${isRadar ? 'bg-slate-600' : 'bg-stone-300'}`} />
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-emerald-500" style={{ filter: 'blur(4px)', opacity: 0.5 }} />
            <div className="relative w-4 h-4 rounded-full bg-emerald-500" />
          </div>
          <span className={`text-xs font-medium ${isRadar ? 'text-slate-300' : 'text-stone-600'}`}>Market Rate</span>
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
          leftHeader={contractName}
          rightHeader="Market Rate"
          leftColor="#ef4444"
          rightColor="#22c55e"
          valuePrefix={currency}
        />
      </div>

      {/* Overcharge summary - premium card */}
      <div
        className="relative z-20 mt-4 flex justify-center"
        style={{ opacity: summaryProgress, transform: `translateY(${(1 - summaryProgress) * 15}px)` }}
      >
        <div
          className={`
            relative overflow-hidden w-full max-w-lg px-6 py-4 rounded-2xl backdrop-blur-sm
            bg-gradient-to-br ${statusGradient}
            ${statusBorder} border
          `}
          style={{ boxShadow: `0 4px 30px ${statusColor}15` }}
        >
          {/* Animated glow */}
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: `radial-gradient(ellipse at center, ${statusColor}${Math.round(8 + pulse * (isOvercharged ? 12 : 8)).toString(16)} 0%, transparent 70%)`,
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

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: statusColor, filter: 'blur(10px)', opacity: 0.4 + pulse * (isOvercharged ? 0.3 : 0.1) }}
                />
                <div
                  className="relative w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${statusColor}20` }}
                >
                  {isOvercharged ? (
                    <WarningIcon size={24} color={statusColor} />
                  ) : (
                    <SuccessIcon size={24} color={statusColor} />
                  )}
                </div>
              </div>
              <div>
                <p className={`text-[10px] uppercase font-bold tracking-wider ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
                  {isOvercharged ? 'OVERCHARGE DETECTED' : 'FAIR PRICING'}
                </p>
                <p className="text-2xl font-bold tabular-nums" style={{ color: statusColor }}>
                  {isOvercharged ? '+' : ''}{formatCurrency(Math.abs(overcharge))}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-[10px] font-medium ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
                vs market
              </p>
              <p className="text-xl font-bold tabular-nums" style={{ color: statusColor }}>
                {overchargePercent > 0 ? '+' : ''}{overchargePercent.toFixed(0)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Premium corner accents */}
      {!isMobile && (
        <>
          <svg className="absolute top-[8%] left-4 w-12 h-12 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path d="M 0 32 L 0 6 Q 0 0 6 0 L 32 0" fill="none" stroke={accentColor} strokeWidth={1.5} strokeDasharray={60} strokeDashoffset={60 - 60 * headerProgress} />
          </svg>
          <svg className="absolute top-[8%] right-4 w-12 h-12 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path d="M 48 32 L 48 6 Q 48 0 42 0 L 16 0" fill="none" stroke={accentColor} strokeWidth={1.5} strokeDasharray={60} strokeDashoffset={60 - 60 * headerProgress} />
          </svg>
          <svg className="absolute bottom-[8%] left-4 w-12 h-12 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path d="M 0 16 L 0 42 Q 0 48 6 48 L 32 48" fill="none" stroke={accentColor} strokeWidth={1.5} strokeDasharray={60} strokeDashoffset={60 - 60 * headerProgress} />
          </svg>
          <svg className="absolute bottom-[8%] right-4 w-12 h-12 z-20" style={{ opacity: headerProgress * 0.5 }}>
            <path d="M 48 16 L 48 42 Q 48 48 42 48 L 16 48" fill="none" stroke={accentColor} strokeWidth={1.5} strokeDasharray={60} strokeDashoffset={60 - 60 * headerProgress} />
          </svg>
        </>
      )}
    </div>
  );
}
