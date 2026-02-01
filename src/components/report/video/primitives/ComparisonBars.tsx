'use client';

import { spring, easeOutCubic, easeOutQuart } from '../useVideoPlayback';

export interface ComparisonItem {
  label: string;
  leftValue: number;
  rightValue: number;
  leftLabel?: string;
  rightLabel?: string;
  /** Highlight which side "wins" */
  highlight?: 'left' | 'right' | 'none';
}

interface ComparisonBarsProps {
  items: ComparisonItem[];
  frame: number;
  fps: number;
  isRadar: boolean;
  width: number;
  /** Left column header */
  leftHeader?: string;
  /** Right column header */
  rightHeader?: string;
  /** Left column color */
  leftColor?: string;
  /** Right column color */
  rightColor?: string;
  /** Max value for scaling (auto-calculated if not provided) */
  maxValue?: number;
  /** Show values as percentages */
  showPercentage?: boolean;
  /** Format values with prefix (e.g., "$") */
  valuePrefix?: string;
  /** Format values with suffix (e.g., "%") */
  valueSuffix?: string;
}

/**
 * Side-by-side bar comparison visualization.
 * Used for PriceComparison and HypeVsReality scenes.
 */
export function ComparisonBars({
  items,
  frame,
  fps,
  isRadar,
  width,
  leftHeader = 'Claimed',
  rightHeader = 'Reality',
  leftColor = '#3b82f6',
  rightColor = '#ef4444',
  maxValue,
  showPercentage = false,
  valuePrefix = '',
  valueSuffix = '',
}: ComparisonBarsProps) {
  const headerProgress = spring({ frame, fps, delay: 0, durationFrames: 18, easing: easeOutCubic });

  // Calculate max value for scaling
  const calculatedMax = maxValue ?? Math.max(
    ...items.flatMap(item => [item.leftValue, item.rightValue])
  );

  const barWidth = (width - 120) / 2; // Leave space for center labels

  return (
    <div style={{ width }} className="flex flex-col gap-3">
      {/* Headers */}
      <div
        className="flex items-center justify-between px-2"
        style={{ opacity: headerProgress }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: leftColor }}
          />
          <span className={`text-xs font-semibold ${isRadar ? 'text-slate-300' : 'text-stone-600'}`}>
            {leftHeader}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold ${isRadar ? 'text-slate-300' : 'text-stone-600'}`}>
            {rightHeader}
          </span>
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: rightColor }}
          />
        </div>
      </div>

      {/* Comparison rows */}
      {items.map((item, i) => {
        const delay = 8 + i * 6;
        const rowProgress = spring({ frame, fps, delay, durationFrames: 22, easing: easeOutCubic });
        const barProgress = spring({ frame, fps, delay: delay + 5, durationFrames: 28, easing: easeOutQuart });

        const leftWidth = (item.leftValue / calculatedMax) * barWidth * barProgress;
        const rightWidth = (item.rightValue / calculatedMax) * barWidth * barProgress;

        const formatValue = (v: number) => {
          if (showPercentage) return `${Math.round(v)}%`;
          return `${valuePrefix}${v.toLocaleString()}${valueSuffix}`;
        };

        const leftWins = item.highlight === 'left' || (item.highlight !== 'right' && item.leftValue > item.rightValue);
        const rightWins = item.highlight === 'right' || (item.highlight !== 'left' && item.rightValue > item.leftValue);

        return (
          <div
            key={i}
            className="flex items-center gap-2"
            style={{ opacity: rowProgress, transform: `translateY(${(1 - rowProgress) * 10}px)` }}
          >
            {/* Left bar (grows right-to-left) */}
            <div className="flex-1 flex items-center justify-end gap-2">
              {/* Value */}
              <span
                className={`text-[10px] font-mono ${
                  leftWins
                    ? (isRadar ? 'text-emerald-400' : 'text-emerald-600')
                    : (isRadar ? 'text-slate-400' : 'text-stone-500')
                }`}
                style={{ opacity: barProgress }}
              >
                {formatValue(item.leftValue)}
              </span>

              {/* Bar */}
              <div
                className={`h-5 rounded-l ${isRadar ? 'bg-slate-800' : 'bg-stone-200'}`}
                style={{ width: barWidth }}
              >
                <div
                  className="h-full rounded-l transition-all duration-75 ml-auto"
                  style={{
                    width: leftWidth,
                    backgroundColor: leftColor,
                    opacity: leftWins ? 1 : 0.6,
                  }}
                />
              </div>
            </div>

            {/* Center label */}
            <div
              className={`w-20 text-center px-1 py-0.5 rounded text-[10px] font-medium truncate ${
                isRadar ? 'bg-slate-800 text-slate-200' : 'bg-stone-100 text-stone-700'
              }`}
            >
              {item.label}
            </div>

            {/* Right bar (grows left-to-right) */}
            <div className="flex-1 flex items-center gap-2">
              {/* Bar */}
              <div
                className={`h-5 rounded-r ${isRadar ? 'bg-slate-800' : 'bg-stone-200'}`}
                style={{ width: barWidth }}
              >
                <div
                  className="h-full rounded-r transition-all duration-75"
                  style={{
                    width: rightWidth,
                    backgroundColor: rightColor,
                    opacity: rightWins ? 1 : 0.6,
                  }}
                />
              </div>

              {/* Value */}
              <span
                className={`text-[10px] font-mono ${
                  rightWins
                    ? (isRadar ? 'text-emerald-400' : 'text-emerald-600')
                    : (isRadar ? 'text-slate-400' : 'text-stone-500')
                }`}
                style={{ opacity: barProgress }}
              >
                {formatValue(item.rightValue)}
              </span>
            </div>
          </div>
        );
      })}

      {/* Summary indicator */}
      {items.length > 0 && (
        <div
          className={`mt-2 text-center text-[10px] ${isRadar ? 'text-slate-500' : 'text-stone-400'}`}
          style={{
            opacity: spring({ frame, fps, delay: 8 + items.length * 6 + 10, durationFrames: 18, easing: easeOutCubic }),
          }}
        >
          {items.filter(i => i.rightValue < i.leftValue).length} items below claimed value
        </div>
      )}
    </div>
  );
}
