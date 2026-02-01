'use client';

import { useMemo, memo } from 'react';
import { spring, easeOutCubic, easeOutQuart } from '@/src/lib/animation';

interface BarChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  frame: number;
  fps: number;
  width?: number;
  height?: number;
  isRadar?: boolean;
}

export const AnimatedBarChart = memo(function AnimatedBarChart({ data, frame, fps, width = 240, height = 140, isRadar = true }: BarChartProps) {
  const max = Math.max(...data.map(d => d.value), 1);
  const barWidth = Math.floor((width - (data.length - 1) * 10) / data.length);

  // Pre-calculate all bar heights to avoid recalculation
  const bars = useMemo(() => {
    return data.map((item, i) => {
      const baseHeight = (item.value / max) * (height - 28);
      return {
        ...item,
        baseHeight,
        x: i * (barWidth + 10),
      };
    });
  }, [data, max, height, barWidth]);

  // Define gradient
  const gradientId = useMemo(() => `barGrad-${Math.random().toString(36).substr(2, 9)}`, []);

  // Only show glow during reveal animation (first ~45 frames)
  const showGlow = frame < 45;
  const glowColor = isRadar ? 'rgba(34,211,238,0.3)' : 'rgba(59,130,246,0.3)';

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={isRadar ? '#22d3ee' : '#3b82f6'} stopOpacity="1" />
          <stop offset="100%" stopColor={isRadar ? '#0891b2' : '#1d4ed8'} stopOpacity="0.8" />
        </linearGradient>
      </defs>
      {bars.map((bar, i) => {
        const progress = spring({ frame, fps, delay: i * 4, durationFrames: 28, easing: easeOutQuart });
        const barHeight = bar.baseHeight * progress;

        return (
          <g key={i}>
            {/* Glow effect - GPU-accelerated CSS drop-shadow, only during reveal */}
            {showGlow && (
              <rect
                x={bar.x + 2}
                y={height - 22 - barHeight}
                width={barWidth - 4}
                height={Math.max(0, barHeight)}
                fill={isRadar ? '#22d3ee' : '#3b82f6'}
                rx={4}
                opacity={0.2}
                style={{ filter: `drop-shadow(0 0 3px ${glowColor})` }}
              />
            )}
            {/* Bar */}
            <rect
              x={bar.x}
              y={height - 22 - barHeight}
              width={barWidth}
              height={Math.max(0, barHeight)}
              fill={`url(#${gradientId})`}
              rx={4}
            />
            {/* Top highlight */}
            {barHeight > 4 && (
              <rect
                x={bar.x + 2}
                y={height - 22 - barHeight + 2}
                width={barWidth - 4}
                height={3}
                fill="white"
                rx={2}
                opacity={0.3}
              />
            )}
            {/* Label */}
            <text
              x={bar.x + barWidth / 2}
              y={height - 6}
              textAnchor="middle"
              className={`text-[9px] font-medium ${isRadar ? 'fill-slate-400' : 'fill-stone-500'}`}
            >
              {bar.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}, (prev, next) => prev.frame === next.frame && prev.data === next.data && prev.isRadar === next.isRadar);

interface LineChartProps {
  data: number[];
  frame: number;
  fps: number;
  width?: number;
  height?: number;
  isRadar?: boolean;
}

export const AnimatedLineChart = memo(function AnimatedLineChart({ data, frame, fps, width = 240, height = 140, isRadar = true }: LineChartProps) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const padding = 12;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Pre-calculate all points
  const points = useMemo(() => {
    return data.map((v, i) => ({
      x: padding + (i / Math.max(1, data.length - 1)) * chartWidth,
      y: padding + chartHeight - ((v - min) / range) * chartHeight,
    }));
  }, [data, min, range, chartWidth, chartHeight, padding]);

  const progress = spring({ frame, fps, delay: 0, durationFrames: 45, easing: easeOutCubic });
  const visibleCount = Math.ceil(points.length * progress);
  const visiblePoints = points.slice(0, visibleCount);

  // Build path string
  const pathD = visiblePoints.length > 0
    ? visiblePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
    : '';

  const areaD = pathD && visiblePoints.length > 1
    ? `${pathD} L ${visiblePoints[visiblePoints.length - 1].x.toFixed(1)} ${height - padding} L ${padding} ${height - padding} Z`
    : '';

  // Gradient IDs
  const areaGradientId = useMemo(() => `areaGrad-${Math.random().toString(36).substr(2, 9)}`, []);
  const lineGradientId = useMemo(() => `lineGrad-${Math.random().toString(36).substr(2, 9)}`, []);

  // Only show glow during reveal animation
  const showGlow = frame < 60;
  const glowColor = isRadar ? 'rgba(34,211,238,0.4)' : 'rgba(59,130,246,0.4)';

  return (
    <svg width={width} height={height}>
      <defs>
        <linearGradient id={areaGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={isRadar ? '#22d3ee' : '#3b82f6'} stopOpacity="0.3" />
          <stop offset="100%" stopColor={isRadar ? '#22d3ee' : '#3b82f6'} stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id={lineGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={isRadar ? '#22d3ee' : '#3b82f6'} />
          <stop offset="100%" stopColor={isRadar ? '#06b6d4' : '#2563eb'} />
        </linearGradient>
      </defs>

      {/* Grid lines with fade */}
      {[0.25, 0.5, 0.75].map((p, i) => (
        <line
          key={p}
          x1={padding}
          y1={padding + chartHeight * p}
          x2={width - padding}
          y2={padding + chartHeight * p}
          stroke={isRadar ? 'rgba(34,211,238,0.08)' : 'rgba(0,0,0,0.04)'}
          strokeDasharray="4 4"
        />
      ))}

      {/* Area fill with gradient */}
      {areaD && (
        <path d={areaD} fill={`url(#${areaGradientId})`} />
      )}

      {/* Glow line - GPU-accelerated CSS drop-shadow, only during reveal */}
      {pathD && showGlow && (
        <path
          d={pathD}
          fill="none"
          stroke={isRadar ? '#22d3ee' : '#3b82f6'}
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.3}
          style={{ filter: `drop-shadow(0 0 2px ${glowColor})` }}
        />
      )}

      {/* Main line */}
      {pathD && (
        <path
          d={pathD}
          fill="none"
          stroke={`url(#${lineGradientId})`}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* End point with glow */}
      {visiblePoints.length > 0 && (
        <>
          <circle
            cx={visiblePoints[visiblePoints.length - 1].x}
            cy={visiblePoints[visiblePoints.length - 1].y}
            r={8}
            fill={isRadar ? '#22d3ee' : '#3b82f6'}
            opacity={0.2}
          />
          <circle
            cx={visiblePoints[visiblePoints.length - 1].x}
            cy={visiblePoints[visiblePoints.length - 1].y}
            r={5}
            fill={isRadar ? '#0f172a' : '#fff'}
            stroke={isRadar ? '#22d3ee' : '#3b82f6'}
            strokeWidth={2.5}
          />
        </>
      )}
    </svg>
  );
}, (prev, next) => prev.frame === next.frame && prev.data === next.data && prev.isRadar === next.isRadar);

interface PieChartProps {
  data: Array<{ label: string; value: number; color: string }>;
  frame: number;
  fps: number;
  size?: number;
  isRadar?: boolean;
}

export const AnimatedPieChart = memo(function AnimatedPieChart({ data, frame, fps, size = 120, isRadar = true }: PieChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const progress = spring({ frame, fps, delay: 0, durationFrames: 40, easing: easeOutQuart });

  const radius = size / 2 - 10;
  const innerRadius = radius * 0.55; // Donut style
  const cx = size / 2;
  const cy = size / 2;

  // Pre-calculate segments
  const segments = useMemo(() => {
    let cumulative = 0;
    return data.map((item) => {
      const startAngle = cumulative;
      const angle = (item.value / total) * Math.PI * 2;
      cumulative += angle;
      return { ...item, startAngle, angle };
    });
  }, [data, total]);

  // Create donut arc path
  const createArc = (startAngle: number, endAngle: number, outerR: number, innerR: number) => {
    const x1 = cx + Math.cos(startAngle) * outerR;
    const y1 = cy + Math.sin(startAngle) * outerR;
    const x2 = cx + Math.cos(endAngle) * outerR;
    const y2 = cy + Math.sin(endAngle) * outerR;
    const x3 = cx + Math.cos(endAngle) * innerR;
    const y3 = cy + Math.sin(endAngle) * innerR;
    const x4 = cx + Math.cos(startAngle) * innerR;
    const y4 = cy + Math.sin(startAngle) * innerR;

    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

    return `M ${x1.toFixed(1)} ${y1.toFixed(1)}
            A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}
            L ${x3.toFixed(1)} ${y3.toFixed(1)}
            A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4.toFixed(1)} ${y4.toFixed(1)} Z`;
  };

  // Only show glow during reveal animation
  const showGlow = frame < 50;

  return (
    <svg width={size} height={size}>
      {/* Background circle */}
      <circle
        cx={cx}
        cy={cy}
        r={radius + 2}
        fill="none"
        stroke={isRadar ? 'rgba(34,211,238,0.1)' : 'rgba(0,0,0,0.05)'}
        strokeWidth={1}
      />

      {segments.map((seg, i) => {
        const segProgress = spring({ frame, fps, delay: i * 3, durationFrames: 35, easing: easeOutQuart });
        const animatedAngle = seg.angle * progress * segProgress;
        const startAngle = seg.startAngle * progress - Math.PI / 2;
        const endAngle = startAngle + animatedAngle;

        if (animatedAngle < 0.02) return null;

        const d = createArc(startAngle, endAngle, radius, innerRadius);

        return (
          <g key={i}>
            {/* Glow - GPU-accelerated CSS drop-shadow, only during reveal */}
            {showGlow && (
              <path
                d={d}
                fill={seg.color}
                opacity={0.3}
                style={{ filter: `drop-shadow(0 0 2px ${seg.color}80)` }}
              />
            )}
            {/* Segment */}
            <path
              d={d}
              fill={seg.color}
              stroke={isRadar ? '#0f172a' : '#fff'}
              strokeWidth={2}
            />
          </g>
        );
      })}

      {/* Center text */}
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        className={`text-lg font-bold ${isRadar ? 'fill-white' : 'fill-stone-800'}`}
      >
        {data.length}
      </text>
      <text
        x={cx}
        y={cy + 12}
        textAnchor="middle"
        className={`text-[8px] ${isRadar ? 'fill-slate-400' : 'fill-stone-500'}`}
      >
        Types
      </text>
    </svg>
  );
}, (prev, next) => prev.frame === next.frame && prev.data === next.data && prev.isRadar === next.isRadar);

interface CounterProps {
  value: number;
  frame: number;
  fps: number;
  delay?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
}

export function AnimatedCounter({ value, frame, fps, delay = 0, suffix = '', prefix = '', decimals = 0 }: CounterProps) {
  const progress = spring({ frame, fps, delay, durationFrames: 30, easing: easeOutCubic });
  const current = value * progress;

  return (
    <span>{prefix}{current.toFixed(decimals)}{suffix}</span>
  );
}
