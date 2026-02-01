'use client';

/**
 * TimelineTrack
 *
 * Individual swimlane for a category of events with collapse/expand
 * functionality and event rendering.
 */

import { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizationTheme } from '../useVisualizationTheme';
import { EventClusterNode } from './EventClusterNode';
import {
  type TimelineEvent,
  type TimeRange,
  type EventCluster,
  type TimelineTrackInfo,
  getTimeInMs,
} from '@/src/lib/temporalClustering';
import { cn } from '@/src/lib/utils';
import { ChevronDown, ChevronRight, Circle, Star, AlertTriangle } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface TimelineTrackProps {
  track: TimelineTrackInfo;
  events: TimelineEvent[];
  clusters: EventCluster[];
  width: number;
  height: number;
  visibleRange: TimeRange;
  dateToPosition: (date: Date) => number;
  selectedEventId: string | null;
  hoveredEventId: string | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onEventClick: (event: TimelineEvent) => void;
  onEventHover: (event: TimelineEvent | null) => void;
  onClusterExpand: (cluster: EventCluster) => void;
}

// ============================================================================
// Component
// ============================================================================

export function TimelineTrack({
  track,
  events,
  clusters,
  width,
  height,
  visibleRange,
  dateToPosition,
  selectedEventId,
  hoveredEventId,
  isCollapsed,
  onToggleCollapse,
  onEventClick,
  onEventHover,
  onClusterExpand,
}: TimelineTrackProps) {
  const { colors, isRadar } = useVisualizationTheme();

  // Filter events visible in current range
  const visibleEvents = useMemo(() => {
    const startTime = visibleRange.start.getTime();
    const endTime = visibleRange.end.getTime();

    return events.filter((event) => {
      const time = getTimeInMs(event);
      return time >= startTime && time <= endTime;
    });
  }, [events, visibleRange]);

  // Get icon for event importance
  const getEventIcon = useCallback((importance?: string) => {
    switch (importance) {
      case 'high':
        return Star;
      case 'low':
        return Circle;
      default:
        return Circle;
    }
  }, []);

  // Calculate event positions and detect overlaps
  const eventPositions = useMemo(() => {
    const positions: Array<{
      event: TimelineEvent;
      x: number;
      row: number;
    }> = [];

    const sortedEvents = [...visibleEvents].sort(
      (a, b) => getTimeInMs(a) - getTimeInMs(b)
    );

    const rows: number[] = []; // End position of each row

    sortedEvents.forEach((event) => {
      const x = dateToPosition(new Date(event.date));
      const eventWidth = 24; // Approximate width of event node

      // Find available row
      let row = 0;
      while (rows[row] !== undefined && rows[row] > x - eventWidth - 4) {
        row++;
      }

      rows[row] = x + eventWidth;
      positions.push({ event, x, row });
    });

    return positions;
  }, [visibleEvents, dateToPosition]);

  const maxRows = Math.max(1, ...eventPositions.map((p) => p.row + 1));
  const nodeHeight = Math.min(24, (height - 24) / maxRows);

  if (isCollapsed) {
    return (
      <div
        className="border-b"
        style={{
          height: 32,
          borderColor: colors.border,
          backgroundColor: colors.surfaceBg,
        }}
      >
        <button
          onClick={onToggleCollapse}
          className="w-full h-full flex items-center gap-2 px-3 hover:bg-white/5 transition-colors"
        >
          <ChevronRight size={14} style={{ color: colors.textMuted }} />
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: track.color }}
          />
          <span className="text-xs font-medium" style={{ color: colors.textPrimary }}>
            {track.label}
          </span>
          <span className="text-[10px]" style={{ color: colors.textMuted }}>
            ({track.eventCount} events)
          </span>
        </button>
      </div>
    );
  }

  return (
    <div
      className="relative border-b"
      style={{
        height,
        borderColor: colors.border,
      }}
    >
      {/* Track header */}
      <div
        className="absolute left-0 top-0 z-10 flex items-center gap-2 px-3 py-1"
        style={{ backgroundColor: `${colors.surfaceBg}CC` }}
      >
        <button
          onClick={onToggleCollapse}
          className="p-0.5 hover:bg-white/10 rounded"
        >
          <ChevronDown size={14} style={{ color: colors.textMuted }} />
        </button>
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: track.color }}
        />
        <span className="text-xs font-medium" style={{ color: colors.textPrimary }}>
          {track.label}
        </span>
        <span className="text-[10px]" style={{ color: colors.textMuted }}>
          {visibleEvents.length} visible
        </span>
      </div>

      {/* Event nodes */}
      <div className="absolute inset-0 pt-6 overflow-hidden">
        <AnimatePresence>
          {eventPositions.map(({ event, x, row }) => {
            const isSelected = selectedEventId === event.id;
            const isHovered = hoveredEventId === event.id;
            const Icon = getEventIcon(event.importance);
            const y = row * (nodeHeight + 2);

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{
                  opacity: 1,
                  scale: isSelected ? 1.2 : isHovered ? 1.1 : 1,
                }}
                exit={{ opacity: 0, scale: 0.5 }}
                className={cn(
                  'absolute cursor-pointer',
                  isSelected && 'z-10'
                )}
                style={{
                  left: x - nodeHeight / 2,
                  top: y,
                  width: nodeHeight,
                  height: nodeHeight,
                }}
                onClick={() => onEventClick(event)}
                onMouseEnter={() => onEventHover(event)}
                onMouseLeave={() => onEventHover(null)}
              >
                <div
                  className={cn(
                    'w-full h-full rounded-full flex items-center justify-center',
                    isSelected && 'ring-2 ring-offset-1'
                  )}
                  style={{
                    backgroundColor: track.color,
                    boxShadow: isHovered || isSelected
                      ? `0 0 12px ${track.color}80`
                      : undefined,
                    '--tw-ring-color': colors.textPrimary,
                    '--tw-ring-offset-color': colors.cardBg,
                  } as React.CSSProperties}
                >
                  <Icon
                    size={nodeHeight * 0.5}
                    style={{ color: colors.textOnDark }}
                  />
                </div>

                {/* Tooltip on hover */}
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-20 pointer-events-none"
                  >
                    <div
                      className="px-3 py-2 rounded-lg shadow-lg whitespace-nowrap max-w-xs"
                      style={{
                        backgroundColor: colors.cardBg,
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      <p
                        className="text-xs font-medium truncate"
                        style={{ color: colors.textPrimary }}
                      >
                        {event.title}
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: colors.textMuted }}>
                        {new Date(event.date).toLocaleDateString()}
                      </p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Clusters */}
        <AnimatePresence>
          {clusters.map((cluster) => {
            const x = dateToPosition(cluster.centerDate);

            return (
              <EventClusterNode
                key={cluster.id}
                cluster={cluster}
                x={x}
                y={(height - 24) / 2}
                trackColor={track.color}
                isSelected={cluster.events.some((e) => e.id === selectedEventId)}
                onExpand={() => onClusterExpand(cluster)}
                onEventClick={onEventClick}
              />
            );
          })}
        </AnimatePresence>
      </div>

      {/* Track background pattern */}
      <svg
        className="absolute inset-0 pointer-events-none"
        width={width}
        height={height}
      >
        <defs>
          <pattern
            id={`grid-${track.id}`}
            width="100"
            height={height}
            patternUnits="userSpaceOnUse"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2={height}
              stroke={colors.border}
              strokeWidth="0.5"
              strokeOpacity="0.3"
            />
          </pattern>
        </defs>
        <rect
          width={width}
          height={height}
          fill={`url(#grid-${track.id})`}
        />
      </svg>
    </div>
  );
}

export default TimelineTrack;
