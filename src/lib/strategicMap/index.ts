/**
 * Strategic Map Module
 *
 * A Total War-style strategic map visualization with:
 * - Semantic zoom levels (clusters → templates → topics → sessions)
 * - Level of Detail (LOD) rendering
 * - D3 quadtree spatial indexing for O(log n) operations
 * - On-demand rendering (no infinite animation loops)
 * - Keyboard and mouse navigation
 *
 * @example
 * ```tsx
 * import { StrategicMapView } from '@/src/components/visualizations';
 *
 * function MyComponent() {
 *   return (
 *     <StrategicMapView
 *       sessions={sessions}
 *       onSessionSelect={(session) => openReport(session.id)}
 *     />
 *   );
 * }
 * ```
 */

// Types
export type {
  ZoomLevel,
  ZoomLevelConfig,
  StrategicNodeType,
  LODLevel,
  StrategicMapNode,
  ViewState,
  Viewport,
  InteractionState,
  RenderState,
  NodeHierarchy,
  AnimationConfig,
  Animation,
  StrategicMapConfig,
  StrategicMapEvents,
  QuadtreeNode,
  DrillLevel,
  DrillDownState,
  BreadcrumbItem,
} from './types';

export { ZOOM_LEVELS, DEFAULT_CONFIG } from './types';

// Spatial Index
export {
  SpatialIndex,
  calculateViewport,
  screenToWorld,
  worldToScreen,
} from './spatialIndex';

// Zoom Controller
export {
  getZoomLevel,
  getZoomLevelName,
  isNodeTypeVisible,
  determineLOD,
  updateNodeLODs,
  filterVisibleNodes,
  getNodesForRender,
  scaleToFitNode,
  offsetToCenterNode,
  zoomTowardPoint,
  interpolateViewState,
  shouldShowLabel,
  shouldShowCount,
  generateDynamicZoomLevels,
  clearZoomLevelCache,
  type DynamicZoomLevelConfig,
} from './zoomController';

// Aggregation
export {
  buildNodeHierarchy,
  getNodeChildren,
  getNodeParent,
  getNodeAncestors,
  calculateHierarchyBounds,
  calculateDynamicLayout,
  extractDataStats,
  fibonacciSpiralLayout,
  type DataStats,
  type LayoutParams,
} from './aggregation';

// Renderer
export {
  StrategicMapRenderer,
  type RenderOptions,
  type RenderMode,
} from './renderer';

// Animation
export {
  AnimationController,
  easeOutCubic,
  easeInOutCubic,
  easeOutQuart,
  easeOutBack,
  easeOutElastic,
  stepSpring,
  isSpringAtRest,
  type SpringConfig,
  type SpringState,
  type DrillTransition,
  type NodeTransitionState,
} from './animation';

// Interactions
export {
  InteractionManager,
  type InteractionCallbacks,
  type KeyboardShortcuts,
} from './interactions';

// Focus Controller (Drill-down navigation)
export {
  FocusController,
  getScaleForLevel,
  getVisibleTypesForLevel,
} from './focusController';
