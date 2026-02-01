'use client';

/**
 * useTimelineZoom Hook
 *
 * Manages zoom state, pan/scroll, and visible range for the
 * multi-track timeline with smooth transitions.
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  type TimelineEvent,
  type TimeRange,
  type ZoomLevel,
  type EventCluster,
  type ClusterConfig,
  ZOOM_LEVEL_CONFIG,
  determineZoomLevel,
  clusterEvents,
  getAdaptiveClusterConfig,
  expandTimeRange,
  centerTimeRange,
  getTimeRangeDuration,
  toDate,
  getTimeInMs,
} from '@/src/lib/temporalClustering';

// ============================================================================
// Types
// ============================================================================

export interface ZoomState {
  level: ZoomLevel;
  range: TimeRange;
  pixelsPerDay: number;
  isAnimating: boolean;
}

export interface PanState {
  isPanning: boolean;
  startX: number;
  startRange: TimeRange | null;
}

export interface TimelineZoomState {
  zoom: ZoomState;
  pan: PanState;
  clusters: EventCluster[];
  visibleEvents: TimelineEvent[];
  totalRange: TimeRange;
  selectedRange: TimeRange | null;
}

export interface TimelineZoomActions {
  // Zoom controls
  zoomIn: (centerDate?: Date) => void;
  zoomOut: (centerDate?: Date) => void;
  zoomToLevel: (level: ZoomLevel, centerDate?: Date) => void;
  zoomToRange: (range: TimeRange) => void;
  zoomToFit: () => void;

  // Pan controls
  panBy: (deltaPixels: number) => void;
  panTo: (date: Date) => void;
  startPan: (x: number) => void;
  updatePan: (x: number) => void;
  endPan: () => void;

  // Range selection
  setSelectedRange: (range: TimeRange | null) => void;
  selectBetweenDates: (start: Date, end: Date) => void;

  // Utilities
  dateToPosition: (date: Date) => number;
  positionToDate: (position: number) => Date;
  isDateVisible: (date: Date) => boolean;
  getVisibleEventIds: () => Set<string>;
}

export interface UseTimelineZoomOptions {
  /** Initial visible range */
  initialRange?: TimeRange;
  /** Initial zoom level (auto-detected if not provided) */
  initialZoomLevel?: ZoomLevel;
  /** Viewport width in pixels */
  viewportWidth: number;
  /** Minimum zoom (largest time range) */
  minPixelsPerDay?: number;
  /** Maximum zoom (smallest time range) */
  maxPixelsPerDay?: number;
  /** Zoom animation duration in ms */
  animationDuration?: number;
  /** Callback when zoom/pan changes */
  onViewChange?: (range: TimeRange, level: ZoomLevel) => void;
}

export interface UseTimelineZoomReturn {
  state: TimelineZoomState;
  actions: TimelineZoomActions;
}

// ============================================================================
// Constants
// ============================================================================

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const ZOOM_STEP = 1.5; // Zoom by 50% per step
const MIN_RANGE_MS = MS_PER_DAY / 4; // Minimum 6 hours visible
const MAX_RANGE_MS = MS_PER_DAY * 365 * 50; // Maximum 50 years visible

// ============================================================================
// Hook Implementation
// ============================================================================

export function useTimelineZoom(
  events: TimelineEvent[],
  options: UseTimelineZoomOptions
): UseTimelineZoomReturn {
  const {
    initialRange,
    initialZoomLevel,
    viewportWidth,
    minPixelsPerDay = 0.005,
    maxPixelsPerDay = 200,
    animationDuration = 300,
    onViewChange,
  } = options;

  // Calculate total range from events
  const totalRange = useMemo<TimeRange>(() => {
    if (events.length === 0) {
      const now = new Date();
      return {
        start: new Date(now.getTime() - MS_PER_DAY * 30),
        end: new Date(now.getTime() + MS_PER_DAY * 30),
      };
    }

    const times = events.map((e) => getTimeInMs(e));
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    // Add 10% padding
    const duration = maxTime - minTime;
    const padding = Math.max(duration * 0.1, MS_PER_DAY);

    return {
      start: new Date(minTime - padding),
      end: new Date(maxTime + padding),
    };
  }, [events]);

  // Initialize zoom state
  const [zoomState, setZoomState] = useState<ZoomState>(() => {
    const range = initialRange || totalRange;
    const duration = getTimeRangeDuration(range);
    const pixelsPerDay = (viewportWidth / duration) * MS_PER_DAY;
    const level = initialZoomLevel || determineZoomLevel(range, viewportWidth);

    return {
      level,
      range,
      pixelsPerDay,
      isAnimating: false,
    };
  });

  // Pan state
  const [panState, setPanState] = useState<PanState>({
    isPanning: false,
    startX: 0,
    startRange: null,
  });

  // Selected range (for brush selection)
  const [selectedRange, setSelectedRange] = useState<TimeRange | null>(null);

  // Animation frame ref
  const animationRef = useRef<number | undefined>(undefined);

  // Track if we should notify of view change
  const prevRangeRef = useRef<TimeRange>(zoomState.range);

  // Notify on view change
  useEffect(() => {
    const rangeChanged =
      prevRangeRef.current.start.getTime() !== zoomState.range.start.getTime() ||
      prevRangeRef.current.end.getTime() !== zoomState.range.end.getTime();

    if (rangeChanged) {
      prevRangeRef.current = zoomState.range;
      onViewChange?.(zoomState.range, zoomState.level);
    }
  }, [zoomState.range, zoomState.level, onViewChange]);

  // Calculate clusters based on current zoom
  const { clusters, visibleEvents } = useMemo(() => {
    const clusterConfig = getAdaptiveClusterConfig(
      zoomState.level,
      zoomState.range,
      viewportWidth
    );

    // Filter events in visible range (with buffer)
    const buffer = getTimeRangeDuration(zoomState.range) * 0.2;
    const bufferedStart = zoomState.range.start.getTime() - buffer;
    const bufferedEnd = zoomState.range.end.getTime() + buffer;

    const visibleEvts = events.filter((e) => {
      const time = getTimeInMs(e);
      return time >= bufferedStart && time <= bufferedEnd;
    });

    const result = clusterEvents(visibleEvts, clusterConfig);

    return {
      clusters: result.clusters,
      visibleEvents: result.unclustered,
    };
  }, [events, zoomState.level, zoomState.range, viewportWidth]);

  // ============================================================================
  // Zoom Actions
  // ============================================================================

  const animateToRange = useCallback(
    (targetRange: TimeRange, onComplete?: () => void) => {
      const startRange = { ...zoomState.range };
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(1, elapsed / animationDuration);

        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);

        const newStart = new Date(
          startRange.start.getTime() +
            (targetRange.start.getTime() - startRange.start.getTime()) * eased
        );
        const newEnd = new Date(
          startRange.end.getTime() +
            (targetRange.end.getTime() - startRange.end.getTime()) * eased
        );

        const newRange = { start: newStart, end: newEnd };
        const duration = getTimeRangeDuration(newRange);
        const pixelsPerDay = (viewportWidth / duration) * MS_PER_DAY;
        const level = determineZoomLevel(newRange, viewportWidth);

        setZoomState({
          level,
          range: newRange,
          pixelsPerDay,
          isAnimating: progress < 1,
        });

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          onComplete?.();
        }
      };

      setZoomState((prev) => ({ ...prev, isAnimating: true }));
      animationRef.current = requestAnimationFrame(animate);
    },
    [zoomState.range, viewportWidth, animationDuration]
  );

  const zoomIn = useCallback(
    (centerDate?: Date) => {
      const center = centerDate || new Date(
        (zoomState.range.start.getTime() + zoomState.range.end.getTime()) / 2
      );

      const currentDuration = getTimeRangeDuration(zoomState.range);
      const newDuration = Math.max(MIN_RANGE_MS, currentDuration / ZOOM_STEP);

      const newRange = {
        start: new Date(center.getTime() - newDuration / 2),
        end: new Date(center.getTime() + newDuration / 2),
      };

      animateToRange(newRange);
    },
    [zoomState.range, animateToRange]
  );

  const zoomOut = useCallback(
    (centerDate?: Date) => {
      const center = centerDate || new Date(
        (zoomState.range.start.getTime() + zoomState.range.end.getTime()) / 2
      );

      const currentDuration = getTimeRangeDuration(zoomState.range);
      const newDuration = Math.min(MAX_RANGE_MS, currentDuration * ZOOM_STEP);

      const newRange = {
        start: new Date(center.getTime() - newDuration / 2),
        end: new Date(center.getTime() + newDuration / 2),
      };

      animateToRange(newRange);
    },
    [zoomState.range, animateToRange]
  );

  const zoomToLevel = useCallback(
    (level: ZoomLevel, centerDate?: Date) => {
      const center = centerDate || new Date(
        (zoomState.range.start.getTime() + zoomState.range.end.getTime()) / 2
      );

      const config = ZOOM_LEVEL_CONFIG[level];
      const targetPixelsPerDay = (config.minPixelsPerDay + config.maxPixelsPerDay) / 2;
      const newDuration = (viewportWidth / targetPixelsPerDay) * MS_PER_DAY;

      const newRange = {
        start: new Date(center.getTime() - newDuration / 2),
        end: new Date(center.getTime() + newDuration / 2),
      };

      animateToRange(newRange);
    },
    [zoomState.range, viewportWidth, animateToRange]
  );

  const zoomToRange = useCallback(
    (range: TimeRange) => {
      // Add small padding
      const duration = getTimeRangeDuration(range);
      const padding = duration * 0.1;
      const paddedRange = {
        start: new Date(range.start.getTime() - padding),
        end: new Date(range.end.getTime() + padding),
      };

      animateToRange(paddedRange);
    },
    [animateToRange]
  );

  const zoomToFit = useCallback(() => {
    animateToRange(totalRange);
  }, [totalRange, animateToRange]);

  // ============================================================================
  // Pan Actions
  // ============================================================================

  const panBy = useCallback(
    (deltaPixels: number) => {
      const msPerPixel = getTimeRangeDuration(zoomState.range) / viewportWidth;
      const deltaMs = deltaPixels * msPerPixel;

      const newRange = {
        start: new Date(zoomState.range.start.getTime() + deltaMs),
        end: new Date(zoomState.range.end.getTime() + deltaMs),
      };

      const duration = getTimeRangeDuration(newRange);
      const pixelsPerDay = (viewportWidth / duration) * MS_PER_DAY;

      setZoomState((prev) => ({
        ...prev,
        range: newRange,
        pixelsPerDay,
      }));
    },
    [zoomState.range, viewportWidth]
  );

  const panTo = useCallback(
    (date: Date) => {
      const newRange = centerTimeRange(zoomState.range, date);
      animateToRange(newRange);
    },
    [zoomState.range, animateToRange]
  );

  const startPan = useCallback(
    (x: number) => {
      setPanState({
        isPanning: true,
        startX: x,
        startRange: { ...zoomState.range },
      });
    },
    [zoomState.range]
  );

  const updatePan = useCallback(
    (x: number) => {
      if (!panState.isPanning || !panState.startRange) return;

      const deltaX = panState.startX - x;
      const msPerPixel = getTimeRangeDuration(panState.startRange) / viewportWidth;
      const deltaMs = deltaX * msPerPixel;

      const newRange = {
        start: new Date(panState.startRange.start.getTime() + deltaMs),
        end: new Date(panState.startRange.end.getTime() + deltaMs),
      };

      const duration = getTimeRangeDuration(newRange);
      const pixelsPerDay = (viewportWidth / duration) * MS_PER_DAY;
      const level = determineZoomLevel(newRange, viewportWidth);

      setZoomState((prev) => ({
        ...prev,
        level,
        range: newRange,
        pixelsPerDay,
      }));
    },
    [panState, viewportWidth]
  );

  const endPan = useCallback(() => {
    setPanState({
      isPanning: false,
      startX: 0,
      startRange: null,
    });
  }, []);

  // ============================================================================
  // Range Selection
  // ============================================================================

  const selectBetweenDates = useCallback((start: Date, end: Date) => {
    setSelectedRange({
      start: start < end ? start : end,
      end: start < end ? end : start,
    });
  }, []);

  // ============================================================================
  // Utilities
  // ============================================================================

  const dateToPosition = useCallback(
    (date: Date): number => {
      const time = date.getTime();
      const startTime = zoomState.range.start.getTime();
      const duration = getTimeRangeDuration(zoomState.range);
      return ((time - startTime) / duration) * viewportWidth;
    },
    [zoomState.range, viewportWidth]
  );

  const positionToDate = useCallback(
    (position: number): Date => {
      const startTime = zoomState.range.start.getTime();
      const duration = getTimeRangeDuration(zoomState.range);
      const time = startTime + (position / viewportWidth) * duration;
      return new Date(time);
    },
    [zoomState.range, viewportWidth]
  );

  const isDateVisible = useCallback(
    (date: Date): boolean => {
      const time = date.getTime();
      return (
        time >= zoomState.range.start.getTime() &&
        time <= zoomState.range.end.getTime()
      );
    },
    [zoomState.range]
  );

  const getVisibleEventIds = useCallback((): Set<string> => {
    const ids = new Set<string>();
    visibleEvents.forEach((e) => ids.add(e.id));
    clusters.forEach((c) => c.events.forEach((e) => ids.add(e.id)));
    return ids;
  }, [visibleEvents, clusters]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current !== undefined) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // ============================================================================
  // Return
  // ============================================================================

  const state: TimelineZoomState = {
    zoom: zoomState,
    pan: panState,
    clusters,
    visibleEvents,
    totalRange,
    selectedRange,
  };

  const actions: TimelineZoomActions = {
    zoomIn,
    zoomOut,
    zoomToLevel,
    zoomToRange,
    zoomToFit,
    panBy,
    panTo,
    startPan,
    updatePan,
    endPan,
    setSelectedRange,
    selectBetweenDates,
    dateToPosition,
    positionToDate,
    isDateVisible,
    getVisibleEventIds,
  };

  return { state, actions };
}

export default useTimelineZoom;
