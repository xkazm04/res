'use client';

/**
 * Timeline Visualizations Module
 *
 * Interactive multi-track timeline with semantic zoom levels,
 * event clustering, parallel storylines, and time-based connections.
 *
 * Features:
 * - Multi-track swimlane visualization
 * - Semantic zoom (decade → year → quarter → month → week → day)
 * - Automatic event clustering at low zoom
 * - Brush selection for time ranges
 * - Cross-time connection routing
 * - Minimap for orientation
 * - Keyboard navigation support
 */

// Main Components
export { MultiTrackTimeline } from './MultiTrackTimeline';
export { TimelineTrack } from './TimelineTrack';
export { SemanticZoomController } from './SemanticZoomController';
export { EventClusterNode } from './EventClusterNode';
export { TimeRangeBrush } from './TimeRangeBrush';
export { CrossTimeConnections } from './CrossTimeConnections';
export { TimelineMinimap } from './TimelineMinimap';

// Default export for convenience
export { MultiTrackTimeline as default } from './MultiTrackTimeline';

// Re-export types from the clustering library
export type {
  TimelineEvent,
  TimeRange,
  ZoomLevel,
  EventCluster,
  TimePeriod,
  TimelineTrackInfo,
  MinimapData,
  TimelineTick,
  ClusterConfig,
} from '@/src/lib/temporalClustering';

// Re-export hook types
export type {
  ZoomState,
  PanState,
  TimelineZoomState,
  TimelineZoomActions,
  UseTimelineZoomOptions,
  UseTimelineZoomReturn,
} from '@/src/hooks/useTimelineZoom';

// Re-export hook
export { useTimelineZoom } from '@/src/hooks/useTimelineZoom';
