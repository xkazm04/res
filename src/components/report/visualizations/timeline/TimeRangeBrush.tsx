'use client';

/**
 * TimeRangeBrush
 *
 * Selection tool for choosing a time range by dragging
 * on the timeline.
 */

import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useVisualizationTheme } from '../useVisualizationTheme';
import type { TimeRange } from '@/src/lib/temporalClustering';
import { cn } from '@/src/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface TimeRangeBrushProps {
  width: number;
  height: number;
  selectedRange: TimeRange | null;
  visibleRange: TimeRange;
  dateToPosition: (date: Date) => number;
  positionToDate: (position: number) => Date;
  onBrushStart: () => void;
  onBrushEnd: () => void;
  onChange: (range: TimeRange | null) => void;
}

// ============================================================================
// Component
// ============================================================================

export function TimeRangeBrush({
  width,
  height,
  selectedRange,
  visibleRange,
  dateToPosition,
  positionToDate,
  onBrushStart,
  onBrushEnd,
  onChange,
}: TimeRangeBrushProps) {
  const { colors } = useVisualizationTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);

  // Get position from mouse event
  const getPosition = useCallback(
    (e: React.MouseEvent): number => {
      if (!containerRef.current) return 0;
      const rect = containerRef.current.getBoundingClientRect();
      return Math.max(0, Math.min(width, e.clientX - rect.left));
    },
    [width]
  );

  // Handle mouse down to start brush
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      if (!e.shiftKey) return; // Require shift key to brush

      e.preventDefault();
      e.stopPropagation();

      const pos = getPosition(e);
      setIsDragging(true);
      setDragStart(pos);
      setDragEnd(pos);
      onBrushStart();
    },
    [getPosition, onBrushStart]
  );

  // Handle mouse move during brush
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;

      e.preventDefault();
      const pos = getPosition(e);
      setDragEnd(pos);
    },
    [isDragging, getPosition]
  );

  // Handle mouse up to end brush
  const handleMouseUp = useCallback(() => {
    if (!isDragging || dragStart === null || dragEnd === null) return;

    const startPos = Math.min(dragStart, dragEnd);
    const endPos = Math.max(dragStart, dragEnd);

    // Minimum brush size of 10 pixels
    if (endPos - startPos < 10) {
      onChange(null);
    } else {
      const startDate = positionToDate(startPos);
      const endDate = positionToDate(endPos);
      onChange({ start: startDate, end: endDate });
    }

    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
    onBrushEnd();
  }, [isDragging, dragStart, dragEnd, positionToDate, onChange, onBrushEnd]);

  // Calculate brush rectangle
  const brushRect = (() => {
    if (isDragging && dragStart !== null && dragEnd !== null) {
      return {
        x: Math.min(dragStart, dragEnd),
        width: Math.abs(dragEnd - dragStart),
      };
    }

    if (selectedRange) {
      const startX = dateToPosition(selectedRange.start);
      const endX = dateToPosition(selectedRange.end);
      return {
        x: Math.max(0, startX),
        width: Math.min(width, endX) - Math.max(0, startX),
      };
    }

    return null;
  })();

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 5 }}
    >
      {/* Interactive overlay - only captures shift+click */}
      <div
        className="absolute inset-0 pointer-events-auto"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          cursor: isDragging ? 'col-resize' : 'crosshair',
        }}
      />

      {/* Brush selection rectangle */}
      {brushRect && brushRect.width > 0 && (
        <>
          {/* Dimmed areas outside selection */}
          <div
            className="absolute top-0"
            style={{
              left: 0,
              width: brushRect.x,
              height,
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              pointerEvents: 'none',
            }}
          />
          <div
            className="absolute top-0"
            style={{
              left: brushRect.x + brushRect.width,
              width: width - brushRect.x - brushRect.width,
              height,
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              pointerEvents: 'none',
            }}
          />

          {/* Selection highlight */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-0"
            style={{
              left: brushRect.x,
              width: brushRect.width,
              height,
              backgroundColor: `${colors.primary}20`,
              borderLeft: `2px solid ${colors.primary}`,
              borderRight: `2px solid ${colors.primary}`,
              pointerEvents: 'none',
            }}
          />

          {/* Handles */}
          <div
            className="absolute top-0 w-2 cursor-col-resize pointer-events-auto"
            style={{
              left: brushRect.x - 1,
              height,
              backgroundColor: colors.primary,
            }}
          />
          <div
            className="absolute top-0 w-2 cursor-col-resize pointer-events-auto"
            style={{
              left: brushRect.x + brushRect.width - 1,
              height,
              backgroundColor: colors.primary,
            }}
          />

          {/* Date labels */}
          <div
            className="absolute -top-6 px-2 py-0.5 rounded text-[10px] font-medium"
            style={{
              left: brushRect.x,
              backgroundColor: colors.primary,
              color: colors.textOnDark,
              transform: 'translateX(-50%)',
            }}
          >
            {selectedRange
              ? selectedRange.start.toLocaleDateString()
              : isDragging && dragStart !== null
                ? positionToDate(Math.min(dragStart, dragEnd || 0)).toLocaleDateString()
                : ''}
          </div>
          <div
            className="absolute -top-6 px-2 py-0.5 rounded text-[10px] font-medium"
            style={{
              left: brushRect.x + brushRect.width,
              backgroundColor: colors.primary,
              color: colors.textOnDark,
              transform: 'translateX(-50%)',
            }}
          >
            {selectedRange
              ? selectedRange.end.toLocaleDateString()
              : isDragging && dragEnd !== null
                ? positionToDate(Math.max(dragStart || 0, dragEnd)).toLocaleDateString()
                : ''}
          </div>
        </>
      )}

      {/* Hint text when no selection */}
      {!brushRect && !isDragging && (
        <div
          className="absolute bottom-2 right-2 px-2 py-1 rounded text-[10px] pointer-events-none"
          style={{
            backgroundColor: colors.surfaceBg,
            color: colors.textMuted,
          }}
        >
          Shift+drag to select range
        </div>
      )}

      {/* Clear button when selection exists */}
      {selectedRange && !isDragging && (
        <button
          className="absolute top-2 px-2 py-1 rounded text-[10px] font-medium pointer-events-auto hover:opacity-80"
          style={{
            left: brushRect!.x + brushRect!.width / 2,
            transform: 'translateX(-50%)',
            backgroundColor: colors.danger,
            color: colors.textOnDark,
          }}
          onClick={() => onChange(null)}
        >
          Clear selection
        </button>
      )}
    </div>
  );
}

export default TimeRangeBrush;
