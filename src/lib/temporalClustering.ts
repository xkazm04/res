/**
 * Temporal Clustering Library
 *
 * Provides DBSCAN-based clustering for timeline events,
 * semantic zoom level calculations, and time range utilities.
 */

// ============================================================================
// Types
// ============================================================================

export interface TimelineEvent {
  id: string;
  date: Date | string;
  title: string;
  description?: string;
  category?: string;
  track?: string;
  importance?: 'high' | 'medium' | 'low';
  type?: string;
  tags?: string[];
  connections?: string[]; // IDs of related events
  metadata?: Record<string, unknown>;
}

export interface EventCluster {
  id: string;
  events: TimelineEvent[];
  startDate: Date;
  endDate: Date;
  centerDate: Date;
  category?: string;
  track?: string;
  representative: TimelineEvent; // Most important event in cluster
}

export type ZoomLevel = 'decade' | 'year' | 'quarter' | 'month' | 'week' | 'day';

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface ClusterConfig {
  /** Time distance threshold in milliseconds for clustering */
  epsilon: number;
  /** Minimum events to form a cluster */
  minPoints: number;
  /** Maximum events before forcing cluster */
  maxVisibleEvents?: number;
  /** Cluster by category/track separately */
  clusterByTrack?: boolean;
}

export interface ZoomConfig {
  level: ZoomLevel;
  range: TimeRange;
  pixelsPerDay: number;
}

// ============================================================================
// Constants
// ============================================================================

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_WEEK = 7 * MS_PER_DAY;
const MS_PER_MONTH = 30 * MS_PER_DAY;
const MS_PER_QUARTER = 90 * MS_PER_DAY;
const MS_PER_YEAR = 365 * MS_PER_DAY;
const MS_PER_DECADE = 10 * MS_PER_YEAR;

export const ZOOM_LEVEL_CONFIG: Record<ZoomLevel, {
  epsilon: number;
  tickInterval: number;
  formatPattern: string;
  minPixelsPerDay: number;
  maxPixelsPerDay: number;
}> = {
  decade: {
    epsilon: MS_PER_YEAR,
    tickInterval: MS_PER_YEAR,
    formatPattern: 'yyyy',
    minPixelsPerDay: 0.01,
    maxPixelsPerDay: 0.1,
  },
  year: {
    epsilon: MS_PER_MONTH,
    tickInterval: MS_PER_MONTH,
    formatPattern: 'MMM yyyy',
    minPixelsPerDay: 0.1,
    maxPixelsPerDay: 0.5,
  },
  quarter: {
    epsilon: MS_PER_WEEK * 2,
    tickInterval: MS_PER_WEEK,
    formatPattern: 'MMM d',
    minPixelsPerDay: 0.5,
    maxPixelsPerDay: 2,
  },
  month: {
    epsilon: MS_PER_WEEK,
    tickInterval: MS_PER_WEEK,
    formatPattern: 'MMM d',
    minPixelsPerDay: 2,
    maxPixelsPerDay: 5,
  },
  week: {
    epsilon: MS_PER_DAY,
    tickInterval: MS_PER_DAY,
    formatPattern: 'EEE, MMM d',
    minPixelsPerDay: 5,
    maxPixelsPerDay: 20,
  },
  day: {
    epsilon: MS_PER_DAY / 4,
    tickInterval: MS_PER_DAY / 4,
    formatPattern: 'h:mm a',
    minPixelsPerDay: 20,
    maxPixelsPerDay: 100,
  },
};

const DEFAULT_CLUSTER_CONFIG: ClusterConfig = {
  epsilon: MS_PER_WEEK,
  minPoints: 3,
  maxVisibleEvents: 50,
  clusterByTrack: true,
};

// ============================================================================
// Date Utilities
// ============================================================================

export function toDate(value: Date | string): Date {
  if (value instanceof Date) return value;
  return new Date(value);
}

export function getTimeInMs(event: TimelineEvent): number {
  return toDate(event.date).getTime();
}

export function formatDate(date: Date, pattern: string): string {
  const options: Intl.DateTimeFormatOptions = {};

  if (pattern.includes('yyyy')) {
    options.year = 'numeric';
  }
  if (pattern.includes('MMM')) {
    options.month = 'short';
  }
  if (pattern.includes('d')) {
    options.day = 'numeric';
  }
  if (pattern.includes('EEE')) {
    options.weekday = 'short';
  }
  if (pattern.includes('h:mm')) {
    options.hour = 'numeric';
    options.minute = '2-digit';
  }
  if (pattern.includes('a')) {
    options.hour12 = true;
  }

  return date.toLocaleDateString('en-US', options);
}

export function getTimeRangeDuration(range: TimeRange): number {
  return range.end.getTime() - range.start.getTime();
}

export function expandTimeRange(range: TimeRange, factor: number): TimeRange {
  const duration = getTimeRangeDuration(range);
  const expansion = (duration * (factor - 1)) / 2;
  return {
    start: new Date(range.start.getTime() - expansion),
    end: new Date(range.end.getTime() + expansion),
  };
}

export function centerTimeRange(range: TimeRange, centerDate: Date): TimeRange {
  const halfDuration = getTimeRangeDuration(range) / 2;
  return {
    start: new Date(centerDate.getTime() - halfDuration),
    end: new Date(centerDate.getTime() + halfDuration),
  };
}

// ============================================================================
// DBSCAN Clustering Algorithm
// ============================================================================

interface DBSCANPoint {
  event: TimelineEvent;
  time: number;
  visited: boolean;
  clusterId: number | null;
  noise: boolean;
}

/**
 * DBSCAN clustering on the time dimension
 */
export function clusterEvents(
  events: TimelineEvent[],
  config: Partial<ClusterConfig> = {}
): { clusters: EventCluster[]; unclustered: TimelineEvent[] } {
  const cfg = { ...DEFAULT_CLUSTER_CONFIG, ...config };

  if (events.length === 0) {
    return { clusters: [], unclustered: [] };
  }

  // If clustering by track, process each track separately
  if (cfg.clusterByTrack) {
    const trackGroups = new Map<string, TimelineEvent[]>();
    events.forEach((event) => {
      const track = event.track || event.category || 'default';
      const group = trackGroups.get(track) || [];
      group.push(event);
      trackGroups.set(track, group);
    });

    const allClusters: EventCluster[] = [];
    const allUnclustered: TimelineEvent[] = [];

    trackGroups.forEach((trackEvents, track) => {
      const result = dbscanCluster(trackEvents, cfg);
      result.clusters.forEach((c) => {
        c.track = track;
        allClusters.push(c);
      });
      allUnclustered.push(...result.unclustered);
    });

    return { clusters: allClusters, unclustered: allUnclustered };
  }

  return dbscanCluster(events, cfg);
}

function dbscanCluster(
  events: TimelineEvent[],
  config: ClusterConfig
): { clusters: EventCluster[]; unclustered: TimelineEvent[] } {
  // Initialize points
  const points: DBSCANPoint[] = events.map((event) => ({
    event,
    time: getTimeInMs(event),
    visited: false,
    clusterId: null,
    noise: false,
  }));

  // Sort by time
  points.sort((a, b) => a.time - b.time);

  let clusterId = 0;
  const clusters: TimelineEvent[][] = [];

  // DBSCAN algorithm
  for (const point of points) {
    if (point.visited) continue;
    point.visited = true;

    const neighbors = getNeighbors(points, point, config.epsilon);

    if (neighbors.length < config.minPoints) {
      point.noise = true;
    } else {
      // Start new cluster
      clusters[clusterId] = [];
      expandCluster(points, point, neighbors, clusterId, config);
      clusterId++;
    }
  }

  // Build cluster objects
  const eventClusters: EventCluster[] = clusters.map((clusterEvents, idx) => {
    const times = clusterEvents.map((e) => getTimeInMs(e));
    const startDate = new Date(Math.min(...times));
    const endDate = new Date(Math.max(...times));
    const centerTime = (startDate.getTime() + endDate.getTime()) / 2;

    // Find most important event as representative
    const representative =
      clusterEvents.find((e) => e.importance === 'high') ||
      clusterEvents.find((e) => e.importance === 'medium') ||
      clusterEvents[0];

    return {
      id: `cluster-${idx}`,
      events: clusterEvents,
      startDate,
      endDate,
      centerDate: new Date(centerTime),
      category: representative.category,
      representative,
    };
  });

  // Collect unclustered (noise) events
  const unclustered = points.filter((p) => p.noise).map((p) => p.event);

  return { clusters: eventClusters, unclustered };
}

function getNeighbors(
  points: DBSCANPoint[],
  point: DBSCANPoint,
  epsilon: number
): DBSCANPoint[] {
  return points.filter(
    (p) => Math.abs(p.time - point.time) <= epsilon
  );
}

function expandCluster(
  points: DBSCANPoint[],
  point: DBSCANPoint,
  neighbors: DBSCANPoint[],
  clusterId: number,
  config: ClusterConfig
): void {
  const clusters = arguments[5] as TimelineEvent[][] || [];

  point.clusterId = clusterId;
  if (!clusters[clusterId]) clusters[clusterId] = [];
  clusters[clusterId].push(point.event);

  const toProcess = [...neighbors];

  while (toProcess.length > 0) {
    const neighbor = toProcess.shift()!;

    if (!neighbor.visited) {
      neighbor.visited = true;
      const neighborNeighbors = getNeighbors(points, neighbor, config.epsilon);

      if (neighborNeighbors.length >= config.minPoints) {
        toProcess.push(...neighborNeighbors.filter((n) => !n.visited));
      }
    }

    if (neighbor.clusterId === null) {
      neighbor.clusterId = clusterId;
      neighbor.noise = false;
      clusters[clusterId].push(neighbor.event);
    }
  }
}

// ============================================================================
// Adaptive Clustering Based on Zoom
// ============================================================================

/**
 * Get cluster configuration based on zoom level and visible range
 */
export function getAdaptiveClusterConfig(
  zoomLevel: ZoomLevel,
  visibleRange: TimeRange,
  viewportWidth: number
): ClusterConfig {
  const config = ZOOM_LEVEL_CONFIG[zoomLevel];
  const rangeDuration = getTimeRangeDuration(visibleRange);
  const pixelsPerMs = viewportWidth / rangeDuration;

  // Adjust epsilon based on pixels per millisecond
  // Events closer than ~30px should cluster
  const minPixelDistance = 30;
  const adaptiveEpsilon = Math.max(
    config.epsilon,
    minPixelDistance / pixelsPerMs
  );

  return {
    epsilon: adaptiveEpsilon,
    minPoints: zoomLevel === 'day' ? 2 : 3,
    maxVisibleEvents: Math.floor(viewportWidth / 40), // ~40px per event minimum
    clusterByTrack: true,
  };
}

/**
 * Determine optimal zoom level based on time range and viewport
 */
export function determineZoomLevel(
  range: TimeRange,
  viewportWidth: number
): ZoomLevel {
  const duration = getTimeRangeDuration(range);
  const pixelsPerDay = (viewportWidth / duration) * MS_PER_DAY;

  const levels: ZoomLevel[] = ['decade', 'year', 'quarter', 'month', 'week', 'day'];

  for (const level of levels) {
    const config = ZOOM_LEVEL_CONFIG[level];
    if (pixelsPerDay >= config.minPixelsPerDay && pixelsPerDay <= config.maxPixelsPerDay) {
      return level;
    }
  }

  // Return closest match
  if (pixelsPerDay < ZOOM_LEVEL_CONFIG.decade.minPixelsPerDay) {
    return 'decade';
  }
  return 'day';
}

// ============================================================================
// Timeline Axis Generation
// ============================================================================

export interface TimelineTick {
  date: Date;
  label: string;
  position: number; // 0-1 within range
  isMajor: boolean;
}

/**
 * Generate axis ticks for the timeline
 */
export function generateTimelineTicks(
  range: TimeRange,
  zoomLevel: ZoomLevel,
  maxTicks: number = 20
): TimelineTick[] {
  const config = ZOOM_LEVEL_CONFIG[zoomLevel];
  const ticks: TimelineTick[] = [];
  const duration = getTimeRangeDuration(range);

  // Calculate tick interval
  let interval = config.tickInterval;
  const estimatedTicks = duration / interval;

  // Adjust interval if too many ticks
  if (estimatedTicks > maxTicks) {
    const multiplier = Math.ceil(estimatedTicks / maxTicks);
    interval *= multiplier;
  }

  // Generate ticks
  const startTime = Math.floor(range.start.getTime() / interval) * interval;
  let time = startTime;
  let majorTickCounter = 0;

  while (time <= range.end.getTime()) {
    const date = new Date(time);
    const position = (time - range.start.getTime()) / duration;

    if (position >= 0 && position <= 1) {
      ticks.push({
        date,
        label: formatDate(date, config.formatPattern),
        position,
        isMajor: majorTickCounter % 4 === 0,
      });
    }

    time += interval;
    majorTickCounter++;
  }

  return ticks;
}

// ============================================================================
// Event Connection Routing
// ============================================================================

export interface ConnectionPath {
  sourceId: string;
  targetId: string;
  sourcePosition: { x: number; y: number };
  targetPosition: { x: number; y: number };
  path: string; // SVG path
  type: 'cause-effect' | 'related' | 'sequence';
}

/**
 * Calculate connection paths between related events
 */
export function calculateConnectionPaths(
  events: TimelineEvent[],
  getEventPosition: (id: string) => { x: number; y: number } | null,
  timelineHeight: number
): ConnectionPath[] {
  const paths: ConnectionPath[] = [];
  const eventMap = new Map(events.map((e) => [e.id, e]));

  events.forEach((event) => {
    if (!event.connections) return;

    const sourcePos = getEventPosition(event.id);
    if (!sourcePos) return;

    event.connections.forEach((targetId) => {
      const target = eventMap.get(targetId);
      if (!target) return;

      const targetPos = getEventPosition(targetId);
      if (!targetPos) return;

      // Determine connection type based on time order
      const sourceTime = getTimeInMs(event);
      const targetTime = getTimeInMs(target);
      const type = sourceTime < targetTime ? 'cause-effect' : 'related';

      // Generate curved path
      const path = generateConnectionPath(sourcePos, targetPos, timelineHeight);

      paths.push({
        sourceId: event.id,
        targetId,
        sourcePosition: sourcePos,
        targetPosition: targetPos,
        path,
        type,
      });
    });
  });

  return paths;
}

function generateConnectionPath(
  source: { x: number; y: number },
  target: { x: number; y: number },
  timelineHeight: number
): string {
  const dx = target.x - source.x;
  const dy = target.y - source.y;

  // Calculate control points for a nice curve
  const midX = (source.x + target.x) / 2;

  // If events are on same track, curve above/below
  if (Math.abs(dy) < 10) {
    const curveHeight = Math.min(50, Math.abs(dx) * 0.3);
    return `M ${source.x} ${source.y} Q ${midX} ${source.y - curveHeight} ${target.x} ${target.y}`;
  }

  // For cross-track connections, use S-curve
  return `M ${source.x} ${source.y} C ${midX} ${source.y}, ${midX} ${target.y}, ${target.x} ${target.y}`;
}

// ============================================================================
// Period/Era Detection
// ============================================================================

export interface TimePeriod {
  id: string;
  label: string;
  start: Date;
  end: Date;
  color?: string;
  description?: string;
}

/**
 * Auto-detect periods based on event density and gaps
 */
export function detectPeriods(
  events: TimelineEvent[],
  minGapForSplit: number = MS_PER_MONTH * 2,
  minEventsPerPeriod: number = 3
): TimePeriod[] {
  if (events.length < minEventsPerPeriod) return [];

  // Sort events by time
  const sorted = [...events].sort(
    (a, b) => getTimeInMs(a) - getTimeInMs(b)
  );

  const periods: TimePeriod[] = [];
  let periodStart = getTimeInMs(sorted[0]);
  let periodEvents: TimelineEvent[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const currentTime = getTimeInMs(sorted[i]);
    const previousTime = getTimeInMs(sorted[i - 1]);
    const gap = currentTime - previousTime;

    if (gap >= minGapForSplit && periodEvents.length >= minEventsPerPeriod) {
      // End current period
      periods.push(createPeriod(periodStart, previousTime, periodEvents, periods.length));

      // Start new period
      periodStart = currentTime;
      periodEvents = [sorted[i]];
    } else {
      periodEvents.push(sorted[i]);
    }
  }

  // Add final period
  if (periodEvents.length >= minEventsPerPeriod) {
    const lastTime = getTimeInMs(sorted[sorted.length - 1]);
    periods.push(createPeriod(periodStart, lastTime, periodEvents, periods.length));
  }

  return periods;
}

function createPeriod(
  startTime: number,
  endTime: number,
  events: TimelineEvent[],
  index: number
): TimePeriod {
  // Generate label from date range
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);
  const startStr = formatDate(startDate, 'MMM yyyy');
  const endStr = formatDate(endDate, 'MMM yyyy');

  return {
    id: `period-${index}`,
    label: startStr === endStr ? startStr : `${startStr} - ${endStr}`,
    start: startDate,
    end: endDate,
    description: `${events.length} events`,
  };
}

// ============================================================================
// Track Management
// ============================================================================

export interface TimelineTrackInfo {
  id: string;
  label: string;
  color: string;
  eventCount: number;
  dateRange: TimeRange;
}

/**
 * Extract track information from events
 */
export function extractTracks(events: TimelineEvent[]): TimelineTrackInfo[] {
  const trackMap = new Map<string, TimelineEvent[]>();

  events.forEach((event) => {
    const track = event.track || event.category || 'General';
    const trackEvents = trackMap.get(track) || [];
    trackEvents.push(event);
    trackMap.set(track, trackEvents);
  });

  const colors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#06b6d4', // cyan
    '#ec4899', // pink
    '#84cc16', // lime
  ];

  const tracks: TimelineTrackInfo[] = [];
  let colorIndex = 0;

  trackMap.forEach((trackEvents, trackId) => {
    const times = trackEvents.map((e) => getTimeInMs(e));

    tracks.push({
      id: trackId,
      label: trackId,
      color: colors[colorIndex % colors.length],
      eventCount: trackEvents.length,
      dateRange: {
        start: new Date(Math.min(...times)),
        end: new Date(Math.max(...times)),
      },
    });

    colorIndex++;
  });

  return tracks.sort((a, b) => a.dateRange.start.getTime() - b.dateRange.start.getTime());
}

// ============================================================================
// Minimap Data
// ============================================================================

export interface MinimapData {
  totalRange: TimeRange;
  visibleRange: TimeRange;
  densityBuckets: Array<{
    start: Date;
    end: Date;
    count: number;
    density: number; // 0-1
  }>;
  trackPositions: Map<string, number>; // track -> y position (0-1)
}

/**
 * Generate minimap visualization data
 */
export function generateMinimapData(
  events: TimelineEvent[],
  visibleRange: TimeRange,
  bucketCount: number = 50
): MinimapData {
  if (events.length === 0) {
    return {
      totalRange: visibleRange,
      visibleRange,
      densityBuckets: [],
      trackPositions: new Map(),
    };
  }

  const times = events.map((e) => getTimeInMs(e));
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);

  const totalRange: TimeRange = {
    start: new Date(minTime),
    end: new Date(maxTime),
  };

  const duration = maxTime - minTime;
  const bucketSize = duration / bucketCount;

  // Count events per bucket
  const buckets: number[] = new Array(bucketCount).fill(0);
  events.forEach((event) => {
    const time = getTimeInMs(event);
    const bucketIndex = Math.min(
      bucketCount - 1,
      Math.floor((time - minTime) / bucketSize)
    );
    buckets[bucketIndex]++;
  });

  const maxCount = Math.max(...buckets, 1);

  const densityBuckets = buckets.map((count, i) => ({
    start: new Date(minTime + i * bucketSize),
    end: new Date(minTime + (i + 1) * bucketSize),
    count,
    density: count / maxCount,
  }));

  // Calculate track positions
  const tracks = extractTracks(events);
  const trackPositions = new Map<string, number>();
  tracks.forEach((track, i) => {
    trackPositions.set(track.id, i / (tracks.length || 1));
  });

  return {
    totalRange,
    visibleRange,
    densityBuckets,
    trackPositions,
  };
}

// ============================================================================
// Time Range Comparison
// ============================================================================

export interface PeriodComparison {
  periodA: TimeRange;
  periodB: TimeRange;
  eventsA: TimelineEvent[];
  eventsB: TimelineEvent[];
  commonCategories: string[];
  uniqueToA: string[];
  uniqueToB: string[];
  densityRatio: number; // events per day ratio
}

/**
 * Compare two time periods
 */
export function comparePeriods(
  events: TimelineEvent[],
  periodA: TimeRange,
  periodB: TimeRange
): PeriodComparison {
  const eventsA = events.filter((e) => {
    const time = getTimeInMs(e);
    return time >= periodA.start.getTime() && time <= periodA.end.getTime();
  });

  const eventsB = events.filter((e) => {
    const time = getTimeInMs(e);
    return time >= periodB.start.getTime() && time <= periodB.end.getTime();
  });

  const categoriesA = new Set(eventsA.map((e) => e.category || 'Other'));
  const categoriesB = new Set(eventsB.map((e) => e.category || 'Other'));

  const commonCategories = [...categoriesA].filter((c) => categoriesB.has(c));
  const uniqueToA = [...categoriesA].filter((c) => !categoriesB.has(c));
  const uniqueToB = [...categoriesB].filter((c) => !categoriesA.has(c));

  const daysA = getTimeRangeDuration(periodA) / MS_PER_DAY;
  const daysB = getTimeRangeDuration(periodB) / MS_PER_DAY;
  const densityA = eventsA.length / daysA;
  const densityB = eventsB.length / daysB;
  const densityRatio = densityB > 0 ? densityA / densityB : 0;

  return {
    periodA,
    periodB,
    eventsA,
    eventsB,
    commonCategories,
    uniqueToA,
    uniqueToB,
    densityRatio,
  };
}
