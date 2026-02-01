'use client';

import { spring, easeOutCubic, easeOutQuart, easeInOutCubic } from '../useVideoPlayback';

export interface GaugeFactor {
  label: string;
  value: number; // 0-100
  type?: 'positive' | 'negative' | 'neutral';
}

interface GaugeMeterProps {
  value: number; // 0-100
  label: string;
  sublabel?: string;
  factors?: GaugeFactor[];
  frame: number;
  fps: number;
  isRadar: boolean;
  size?: number;
  /** Color gradient: 'risk' (green-yellow-red) or 'trust' (red-yellow-green) */
  colorMode?: 'risk' | 'trust';
  /** Show the numeric value */
  showValue?: boolean;
  /** Show the factors list */
  showFactors?: boolean;
}

/**
 * Animated gauge/dial visualization.
 * Used for RiskMeter and TrustMeter scenes.
 */
export function GaugeMeter({
  value,
  label,
  sublabel,
  factors = [],
  frame,
  fps,
  isRadar,
  size = 180,
  colorMode = 'risk',
  showValue = true,
  showFactors = true,
}: GaugeMeterProps) {
  const gaugeProgress = spring({ frame, fps, delay: 5, durationFrames: 35, easing: easeInOutCubic });
  const labelProgress = spring({ frame, fps, delay: 0, durationFrames: 20, easing: easeOutCubic });
  const valueProgress = spring({ frame, fps, delay: 25, durationFrames: 25, easing: easeOutQuart });

  // Animated value
  const animatedValue = Math.round(value * gaugeProgress);

  // Calculate arc parameters
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // Semi-circle
  const startAngle = 180;
  const endAngle = 0;

  // Color based on value and mode
  const getColor = (v: number) => {
    if (colorMode === 'risk') {
      // Risk: low is green, high is red
      if (v <= 30) return '#22c55e';
      if (v <= 60) return '#f59e0b';
      return '#ef4444';
    } else {
      // Trust: low is red, high is green
      if (v <= 30) return '#ef4444';
      if (v <= 60) return '#f59e0b';
      return '#22c55e';
    }
  };

  const currentColor = getColor(animatedValue);

  // Arc path
  const createArc = (startDeg: number, endDeg: number) => {
    const startRad = (startDeg * Math.PI) / 180;
    const endRad = (endDeg * Math.PI) / 180;
    const cx = size / 2;
    const cy = size / 2;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy - radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy - radius * Math.sin(endRad);

    const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;

    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 0 ${x2} ${y2}`;
  };

  // Value arc (animated)
  const valueAngle = startAngle - (animatedValue / 100) * 180;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Label */}
      <div
        className="text-center"
        style={{ opacity: labelProgress }}
      >
        <h3 className={`text-sm font-bold ${isRadar ? 'text-white' : 'text-stone-900'}`}>
          {label}
        </h3>
        {sublabel && (
          <p className={`text-xs ${isRadar ? 'text-slate-400' : 'text-stone-500'}`}>
            {sublabel}
          </p>
        )}
      </div>

      {/* Gauge */}
      <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
        <svg width={size} height={size / 2 + 20} className="overflow-visible">
          {/* Background arc */}
          <path
            d={createArc(180, 0)}
            fill="none"
            stroke={isRadar ? '#1e293b' : '#e7e5e4'}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Color gradient segments */}
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              {colorMode === 'risk' ? (
                <>
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ef4444" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#22c55e" />
                </>
              )}
            </linearGradient>
          </defs>

          {/* Value arc */}
          <path
            d={createArc(180, valueAngle)}
            fill="none"
            stroke={currentColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity={gaugeProgress}
          />

          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const tickAngle = 180 - (tick / 100) * 180;
            const tickRad = (tickAngle * Math.PI) / 180;
            const innerRadius = radius - strokeWidth / 2 - 4;
            const outerRadius = radius - strokeWidth / 2 - 12;
            const cx = size / 2;
            const cy = size / 2;

            return (
              <g key={tick} opacity={labelProgress * 0.6}>
                <line
                  x1={cx + innerRadius * Math.cos(tickRad)}
                  y1={cy - innerRadius * Math.sin(tickRad)}
                  x2={cx + outerRadius * Math.cos(tickRad)}
                  y2={cy - outerRadius * Math.sin(tickRad)}
                  stroke={isRadar ? '#475569' : '#a8a29e'}
                  strokeWidth={1}
                />
                <text
                  x={cx + (outerRadius - 10) * Math.cos(tickRad)}
                  y={cy - (outerRadius - 10) * Math.sin(tickRad)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={`text-[8px] ${isRadar ? 'fill-slate-500' : 'fill-stone-400'}`}
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Needle */}
          <g
            transform={`translate(${size / 2}, ${size / 2})`}
            style={{ transformOrigin: 'center' }}
          >
            <circle r={8} fill={currentColor} opacity={gaugeProgress} />
            <line
              x1={0}
              y1={0}
              x2={(radius - 25) * Math.cos((valueAngle * Math.PI) / 180)}
              y2={-(radius - 25) * Math.sin((valueAngle * Math.PI) / 180)}
              stroke={currentColor}
              strokeWidth={3}
              strokeLinecap="round"
              opacity={gaugeProgress}
            />
          </g>
        </svg>

        {/* Value display */}
        {showValue && (
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2"
            style={{ opacity: valueProgress }}
          >
            <div
              className="text-3xl font-bold tabular-nums"
              style={{ color: currentColor }}
            >
              {animatedValue}
              <span className="text-lg">%</span>
            </div>
          </div>
        )}
      </div>

      {/* Factors list */}
      {showFactors && factors.length > 0 && (
        <div className="w-full max-w-xs space-y-1">
          {factors.map((factor, i) => {
            const factorDelay = 30 + i * 5;
            const factorProgress = spring({ frame, fps, delay: factorDelay, durationFrames: 18, easing: easeOutCubic });

            const factorColor = factor.type === 'positive'
              ? (isRadar ? 'text-emerald-400' : 'text-emerald-600')
              : factor.type === 'negative'
                ? (isRadar ? 'text-red-400' : 'text-red-600')
                : (isRadar ? 'text-slate-400' : 'text-stone-500');

            return (
              <div
                key={i}
                className="flex items-center justify-between gap-2 text-xs"
                style={{ opacity: factorProgress, transform: `translateX(${(1 - factorProgress) * 10}px)` }}
              >
                <span className={isRadar ? 'text-slate-300' : 'text-stone-600'}>
                  {factor.label}
                </span>
                <span className={`font-semibold ${factorColor}`}>
                  {factor.value}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
