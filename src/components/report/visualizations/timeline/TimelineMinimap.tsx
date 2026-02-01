'use client';

/**
 * TimelineMinimap
 *
 * Overview navigation showing the entire timeline with
 * a viewport indicator and event density visualization.
 */

import { useMemo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useVisualizationTheme } from '../useVisualizationTheme';
import {
  type TimelineEvent,
  type TimeRange,
  generateMinimapData,
  getTimeRangeDuration,
} from '@/src/lib/temporalClustering';

// ============================================================================
// Types
// ============================================================================

interface TimelineMinimapProps {
  events: TimelineEvent[];
  width: number;
  height: number;
  visibleRange: TimeRange;
  totalRange: TimeRange;
  onRangeSelect: (range: TimeRange) => void;
}

// ============================================================================
// Component
// ============================================================================

export function TimelineMinimap({
  events,
  width,
  height,
  visibleRange,
  totalRange,
  onRangeSelect,
}: TimelineMinimapProps) {
  const { colors } = useVisualizationTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate minimap data
  const minimapData = useMemo(
    () => generateMinimapData(events, visibleRange, 100),
    [events, visibleRange]
  );

  // Calculate viewport position and size
  const viewport = useMemo(() => {
    const totalDuration = getTimeRangeDuration(totalRange);
    const visibleStart = visibleRange.start.getTime() - totalRange.start.getTime();
    const visibleDuration = getTimeRangeDuration(visibleRange);

    return {
      left: (visibleStart / totalDuration) * width,
      width: (visibleDuration / totalDuration) * width,
    };
  }, [visibleRange, totalRange, width]);

  // Handle click to navigate
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickPercent = clickX / width;

      const totalDuration = getTimeRangeDuration(totalRange);
      const visibleDuration = getTimeRangeDuration(visibleRange);

      const centerTime = totalRange.start.getTime() + clickPercent * totalDuration;
      const newStart = new Date(centerTime - visibleDuration / 2);
      const newEnd = new Date(centerTime + visibleDuration / 2);

      onRangeSelect({ start: newStart, end: newEnd });
    },
    [width, totalRange, visibleRange, onRangeSelect]
  );

  // Handle drag to pan viewport
  const handleDrag = useCallback(
    (deltaX: number) => {
      const totalDuration = getTimeRangeDuration(totalRange);
      const deltaMs = (deltaX / width) * totalDuration;

      const newStart = new Date(visibleRange.start.getTime() + deltaMs);
      const newEnd = new Date(visibleRange.end.getTime() + deltaMs);

      onRangeSelect({ start: newStart, end: newEnd });
    },
    [width, totalRange, visibleRange, onRangeSelect]
  );

  return (
    <div
      ref={containerRef}
      className="relative border-t cursor-pointer"
      style={{
        width,
        height,
        borderColor: colors.border,
        backgroundColor: colors.surfaceBg,
      }}
      onClick={handleClick}
    >
      {/* Density histogram */}
      <svg width={width} height={height - 4} className="absolute top-0 left-0">
        {minimapData.densityBuckets.map((bucket, i) => {
          const bucketWidth = width / minimapData.densityBuckets.length;
          const barHeight = bucket.density * (height - 8);

          return (
            <rect
              key={i}
              x={i * bucketWidth}
              y={height - 4 - barHeight}
              width={bucketWidth - 1}
              height={barHeight}
              fill={colors.primary}
              opacity={0.3 + bucket.density * 0.4}
            />
          );
        })}
      </svg>

      {/* Viewport indicator */}
      <motion.div
        className="absolute top-0 h-full cursor-ew-resize"
        style={{
          left: Math.max(0, viewport.left),
          width: Math.min(width - viewport.left, viewport.width),
          backgroundColor: `${colors.primary}30`,
          borderLeft: `2px solid ${colors.primary}`,
          borderRight: `2px solid ${colors.primary}`,
        }}
        drag="x"
        dragConstraints={containerRef}
        dragElastic={0}
        dragMomentum={false}
        onDrag={(_, info) => {
          handleDrag(info.delta.x);
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Viewport label */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-1 py-0.5 rounded text-[8px] font-medium whitespace-nowrap"
          style={{
            backgroundColor: colors.primary,
            color: colors.textOnDark,
          }}
        >
          {visibleRange.start.toLocaleDateString()} –{' '}
          {visibleRange.end.toLocaleDateString()}
        </div>

        {/* Resize handles */}
        <div
          className="absolute left-0 top-0 h-full w-2 cursor-ew-resize"
          style={{ backgroundColor: colors.primary }}
        />
        <div
          className="absolute right-0 top-0 h-full w-2 cursor-ew-resize"
          style={{ backgroundColor: colors.primary }}
        />
      </motion.div>

      {/* Time labels */}
      <div
        className="absolute bottom-0 left-1 text-[8px]"
        style={{ color: colors.textMuted }}
      >
        {totalRange.start.toLocaleDateString()}
      </div>
      <div
        className="absolute bottom-0 right-1 text-[8px]"
        style={{ color: colors.textMuted }}
      >
        {totalRange.end.toLocaleDateString()}
      </div>

      {/* Track color indicators */}
      <div className="absolute top-1 right-1 flex gap-0.5">
        {Array.from(minimapData.trackPositions.entries())
          .slice(0, 5)
          .map(([trackId], i) => (
            <div
              key={trackId}
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: [
                  colors.primary,
                  colors.success,
                  colors.warning,
                  colors.secondary,
                  colors.danger,
                ][i % 5],
              }}
            />
          ))}
      </div>
    </div>
  );
}

export default TimelineMinimap;
