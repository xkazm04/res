'use client';

/**
 * MultiTrackTimeline
 *
 * Main container for the interactive multi-track timeline with
 * semantic zoom, event clustering, and parallel storyline visualization.
 */

import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizationTheme } from '../useVisualizationTheme';
import { useTimelineZoom } from '@/src/hooks/useTimelineZoom';
import { TimelineTrack } from './TimelineTrack';
import { SemanticZoomController } from './SemanticZoomController';
import { EventClusterNode } from './EventClusterNode';
import { TimeRangeBrush } from './TimeRangeBrush';
import { CrossTimeConnections } from './CrossTimeConnections';
import { TimelineMinimap } from './TimelineMinimap';
import {
  type TimelineEvent,
  type TimeRange,
  type ZoomLevel,
  type EventCluster,
  type TimePeriod,
  extractTracks,
  generateTimelineTicks,
  detectPeriods,
  getTimeInMs,
  formatDate,
} from '@/src/lib/temporalClustering';
import { cn } from '@/src/lib/utils';
import {
  Calendar,
  Maximize2,
  Minimize2,
  Layers,
  Eye,
  EyeOff,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface MultiTrackTimelineProps {
  events: TimelineEvent[];
  width?: number;
  height?: number;
  trackHeight?: number;
  initialRange?: TimeRange;
  showMinimap?: boolean;
  showConnections?: boolean;
  showPeriods?: boolean;
  onEventClick?: (event: TimelineEvent) => void;
  onEventHover?: (event: TimelineEvent | null) => void;
  onRangeSelect?: (range: TimeRange) => void;
  onZoomChange?: (level: ZoomLevel, range: TimeRange) => void;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function MultiTrackTimeline({
  events,
  width = 1000,
  height = 500,
  trackHeight = 80,
  initialRange,
  showMinimap = true,
  showConnections = true,
  showPeriods = true,
  onEventClick,
  onEventHover,
  onRangeSelect,
  onZoomChange,
  className,
}: MultiTrackTimelineProps) {
  const { colors, isRadar, surfaceClasses } = useVisualizationTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // State
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAllTracks, setShowAllTracks] = useState(true);
  const [collapsedTracks, setCollapsedTracks] = useState<Set<string>>(new Set());
  const [isBrushing, setIsBrushing] = useState(false);

  // Extract tracks from events
  const tracks = useMemo(() => extractTracks(events), [events]);

  // Detect periods for annotations
  const periods = useMemo(
    () => (showPeriods ? detectPeriods(events) : []),
    [events, showPeriods]
  );

  // Calculate actual height based on visible tracks
  const visibleTracks = useMemo(
    () => tracks.filter((t) => showAllTracks || !collapsedTracks.has(t.id)),
    [tracks, showAllTracks, collapsedTracks]
  );

  const headerHeight = 60;
  const axisHeight = 40;
  const minimapHeight = showMinimap ? 60 : 0;
  const tracksAreaHeight = visibleTracks.length * trackHeight;
  const totalHeight = headerHeight + axisHeight + tracksAreaHeight + minimapHeight;

  // Timeline zoom hook
  const { state, actions } = useTimelineZoom(events, {
    initialRange,
    viewportWidth: width,
    onViewChange: (range, level) => {
      onZoomChange?.(level, range);
    },
  });

  // Generate axis ticks
  const ticks = useMemo(
    () => generateTimelineTicks(state.zoom.range, state.zoom.level),
    [state.zoom.range, state.zoom.level]
  );

  // Event position lookup
  const getEventPosition = useCallback(
    (eventId: string): { x: number; y: number } | null => {
      const event = events.find((e) => e.id === eventId);
      if (!event) return null;

      const x = actions.dateToPosition(new Date(event.date));
      const trackIndex = visibleTracks.findIndex(
        (t) => t.id === (event.track || event.category || 'General')
      );
      const y = headerHeight + axisHeight + trackIndex * trackHeight + trackHeight / 2;

      return { x, y };
    },
    [events, actions, visibleTracks, trackHeight, headerHeight, axisHeight]
  );

  // Handle wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const rect = timelineRef.current?.getBoundingClientRect();
        if (!rect) return;

        const mouseX = e.clientX - rect.left;
        const centerDate = actions.positionToDate(mouseX);

        if (e.deltaY < 0) {
          actions.zoomIn(centerDate);
        } else {
          actions.zoomOut(centerDate);
        }
      } else {
        // Horizontal scroll for panning
        actions.panBy(e.deltaX || e.deltaY);
      }
    },
    [actions]
  );

  // Handle mouse pan
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0 || isBrushing) return;
      actions.startPan(e.clientX);
    },
    [actions, isBrushing]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (state.pan.isPanning) {
        actions.updatePan(e.clientX);
      }
    },
    [state.pan.isPanning, actions]
  );

  const handleMouseUp = useCallback(() => {
    actions.endPan();
  }, [actions]);

  // Handle event interactions
  const handleEventClick = useCallback(
    (event: TimelineEvent) => {
      setSelectedEventId(event.id);
      onEventClick?.(event);
    },
    [onEventClick]
  );

  const handleEventHover = useCallback(
    (event: TimelineEvent | null) => {
      setHoveredEventId(event?.id || null);
      onEventHover?.(event);
    },
    [onEventHover]
  );

  // Handle cluster expand
  const handleClusterExpand = useCallback(
    (cluster: EventCluster) => {
      actions.zoomToRange({
        start: cluster.startDate,
        end: cluster.endDate,
      });
    },
    [actions]
  );

  // Handle brush selection
  const handleBrushChange = useCallback(
    (range: TimeRange | null) => {
      actions.setSelectedRange(range);
      if (range) {
        onRangeSelect?.(range);
      }
    },
    [actions, onRangeSelect]
  );

  // Toggle track visibility
  const toggleTrack = useCallback((trackId: string) => {
    setCollapsedTracks((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) {
        next.delete(trackId);
      } else {
        next.add(trackId);
      }
      return next;
    });
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (isFullscreen) {
      document.exitFullscreen?.();
    } else {
      containerRef.current.requestFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      switch (e.key) {
        case '+':
        case '=':
          e.preventDefault();
          actions.zoomIn();
          break;
        case '-':
          e.preventDefault();
          actions.zoomOut();
          break;
        case '0':
          e.preventDefault();
          actions.zoomToFit();
          break;
        case 'ArrowLeft':
          actions.panBy(-100);
          break;
        case 'ArrowRight':
          actions.panBy(100);
          break;
        case 'f':
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions, toggleFullscreen]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative rounded-xl overflow-hidden',
        isFullscreen && 'fixed inset-0 z-50',
        surfaceClasses,
        className
      )}
      style={{
        width: isFullscreen ? '100vw' : width,
        height: isFullscreen ? '100vh' : totalHeight,
        backgroundColor: colors.cardBg,
      }}
    >
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 border-b"
        style={{
          height: headerHeight,
          borderColor: colors.border,
          backgroundColor: colors.surfaceBg,
        }}
      >
        <div className="flex items-center gap-3">
          <Calendar size={18} style={{ color: colors.primary }} />
          <div>
            <h2 className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
              Timeline
            </h2>
            <p className="text-[10px]" style={{ color: colors.textMuted }}>
              {events.length} events across {tracks.length} tracks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Track visibility toggle */}
          <button
            onClick={() => setShowAllTracks(!showAllTracks)}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            title={showAllTracks ? 'Collapse tracks' : 'Expand all tracks'}
          >
            <Layers size={16} style={{ color: colors.textSecondary }} />
          </button>

          {/* Zoom controller */}
          <SemanticZoomController
            currentLevel={state.zoom.level}
            onZoomToLevel={actions.zoomToLevel}
            onZoomIn={actions.zoomIn}
            onZoomOut={actions.zoomOut}
            onZoomToFit={actions.zoomToFit}
          />

          {/* Fullscreen toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 size={16} style={{ color: colors.textSecondary }} />
            ) : (
              <Maximize2 size={16} style={{ color: colors.textSecondary }} />
            )}
          </button>
        </div>
      </header>

      {/* Timeline area */}
      <div
        ref={timelineRef}
        className="relative select-none"
        style={{
          height: totalHeight - headerHeight - minimapHeight,
          cursor: state.pan.isPanning ? 'grabbing' : 'grab',
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Time axis */}
        <div
          className="sticky top-0 z-10 border-b"
          style={{
            height: axisHeight,
            backgroundColor: colors.cardBg,
            borderColor: colors.border,
          }}
        >
          <svg width={width} height={axisHeight}>
            {/* Period backgrounds */}
            {periods.map((period) => {
              const startX = actions.dateToPosition(period.start);
              const endX = actions.dateToPosition(period.end);
              if (endX < 0 || startX > width) return null;

              return (
                <g key={period.id}>
                  <rect
                    x={Math.max(0, startX)}
                    y={0}
                    width={Math.min(width, endX) - Math.max(0, startX)}
                    height={axisHeight}
                    fill={colors.primaryFill}
                    opacity={0.3}
                  />
                  <text
                    x={(startX + endX) / 2}
                    y={axisHeight - 8}
                    textAnchor="middle"
                    fontSize={9}
                    fill={colors.textMuted}
                  >
                    {period.label}
                  </text>
                </g>
              );
            })}

            {/* Tick marks and labels */}
            {ticks.map((tick, i) => {
              const x = tick.position * width;
              if (x < 0 || x > width) return null;

              return (
                <g key={i}>
                  <line
                    x1={x}
                    y1={tick.isMajor ? 0 : axisHeight - 15}
                    x2={x}
                    y2={axisHeight}
                    stroke={colors.border}
                    strokeWidth={tick.isMajor ? 1 : 0.5}
                  />
                  {tick.isMajor && (
                    <text
                      x={x}
                      y={14}
                      textAnchor="middle"
                      fontSize={10}
                      fill={colors.textSecondary}
                    >
                      {tick.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Tracks */}
        <div className="relative">
          {visibleTracks.map((track, index) => (
            <TimelineTrack
              key={track.id}
              track={track}
              events={events.filter(
                (e) => (e.track || e.category || 'General') === track.id
              )}
              clusters={state.clusters.filter((c) => c.track === track.id)}
              width={width}
              height={trackHeight}
              visibleRange={state.zoom.range}
              dateToPosition={actions.dateToPosition}
              selectedEventId={selectedEventId}
              hoveredEventId={hoveredEventId}
              isCollapsed={collapsedTracks.has(track.id)}
              onToggleCollapse={() => toggleTrack(track.id)}
              onEventClick={handleEventClick}
              onEventHover={handleEventHover}
              onClusterExpand={handleClusterExpand}
            />
          ))}

          {/* Cross-time connections overlay */}
          {showConnections && (
            <CrossTimeConnections
              events={events}
              getEventPosition={getEventPosition}
              selectedEventId={selectedEventId}
              hoveredEventId={hoveredEventId}
              width={width}
              height={tracksAreaHeight}
            />
          )}

          {/* Brush selection overlay */}
          <TimeRangeBrush
            width={width}
            height={tracksAreaHeight}
            selectedRange={state.selectedRange}
            visibleRange={state.zoom.range}
            dateToPosition={actions.dateToPosition}
            positionToDate={actions.positionToDate}
            onBrushStart={() => setIsBrushing(true)}
            onBrushEnd={() => setIsBrushing(false)}
            onChange={handleBrushChange}
          />
        </div>

        {/* Now indicator line */}
        {actions.isDateVisible(new Date()) && (
          <div
            className="absolute top-0 w-0.5 pointer-events-none z-20"
            style={{
              left: actions.dateToPosition(new Date()),
              height: tracksAreaHeight + axisHeight,
              backgroundColor: colors.danger,
            }}
          >
            <div
              className="absolute -top-1 left-1/2 -translate-x-1/2 px-1 py-0.5 rounded text-[8px] font-medium"
              style={{
                backgroundColor: colors.danger,
                color: colors.textOnDark,
              }}
            >
              Now
            </div>
          </div>
        )}
      </div>

      {/* Minimap */}
      {showMinimap && (
        <TimelineMinimap
          events={events}
          width={width}
          height={minimapHeight}
          visibleRange={state.zoom.range}
          totalRange={state.totalRange}
          onRangeSelect={(range) => actions.zoomToRange(range)}
        />
      )}
    </div>
  );
}

export default MultiTrackTimeline;
