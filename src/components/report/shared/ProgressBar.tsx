'use client';

import { useReportTheme } from '../core/ThemeContext';
import { getConfidenceColorName, confidenceGradientColors, confidenceBarColors, type ConfidenceColorName } from './typeConfig';

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: 'blue' | 'emerald' | 'amber' | 'red' | 'auto';
  size?: 'sm' | 'md';
  showLabel?: boolean;
  /** Accessible label describing what this progress bar represents */
  'aria-label'?: string;
}

export function ProgressBar({
  value,
  max = 100,
  color = 'auto',
  size = 'md',
  showLabel = false,
  'aria-label': ariaLabel,
}: ProgressBarProps) {
  const { theme } = useReportTheme();
  const isRadar = theme === 'radar';
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  const getColor = (): ConfidenceColorName | 'blue' => {
    if (color !== 'auto') return color;
    return getConfidenceColorName(percent);
  };

  const colorClass: Record<ConfidenceColorName | 'blue', string> = {
    blue: 'bg-gradient-to-r from-blue-500 to-blue-600',
    ...confidenceGradientColors,
  };

  const sizeClass = {
    sm: 'h-1',
    md: 'h-1.5',
  };

  // Theme-aware track and label colors
  const trackBg = isRadar ? 'bg-slate-700' : 'bg-slate-200';
  const labelColor = isRadar ? 'text-slate-400' : 'text-slate-600';

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex-1 ${trackBg} rounded-full overflow-hidden ${sizeClass[size]}`}
        role="progressbar"
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel || 'Progress'}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass[getColor()]}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showLabel && (
        <span className={`text-[10px] font-medium ${labelColor} w-8 text-right`} aria-hidden="true">
          {Math.round(percent)}%
        </span>
      )}
    </div>
  );
}

interface MiniChartProps {
  data: number[];
  color?: 'blue' | 'emerald' | 'amber' | 'auto';
  height?: number;
}

export function MiniChart({ data, color = 'blue', height = 20 }: MiniChartProps) {
  const max = Math.max(...data, 1);

  const staticColors: Record<'blue' | 'emerald' | 'amber', string> = {
    blue: 'bg-blue-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
  };

  const getBarColor = (value: number) => {
    if (color !== 'auto') {
      return staticColors[color];
    }
    const percent = (value / max) * 100;
    return confidenceBarColors[getConfidenceColorName(percent)];
  };

  return (
    <div className="flex gap-0.5 items-end" style={{ height }}>
      {data.map((value, i) => (
        <div
          key={i}
          className={`flex-1 rounded-t-sm transition-all ${getBarColor(value)}`}
          style={{ height: `${(value / max) * 100}%`, minWidth: 3 }}
        />
      ))}
    </div>
  );
}

interface ConfidenceDistributionProps {
  high: number;
  medium: number;
  low: number;
}

export function ConfidenceDistribution({ high, medium, low }: ConfidenceDistributionProps) {
  const { theme } = useReportTheme();
  const isRadar = theme === 'radar';
  const total = high + medium + low || 1;

  // Theme-aware background
  const trackBg = isRadar ? 'bg-slate-700' : 'bg-slate-200';

  return (
    <div className={`flex h-1.5 rounded-full overflow-hidden ${trackBg}`}>
      <div
        className="bg-emerald-500 transition-all"
        style={{ width: `${(high / total) * 100}%` }}
      />
      <div
        className="bg-amber-500 transition-all"
        style={{ width: `${(medium / total) * 100}%` }}
      />
      <div
        className="bg-red-500 transition-all"
        style={{ width: `${(low / total) * 100}%` }}
      />
    </div>
  );
}
