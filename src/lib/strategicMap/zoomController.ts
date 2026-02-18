/**
 * Zoom Controller
 *
 * Manages semantic zoom levels and LOD determination.
 * Determines what nodes are visible and at what detail level
 * based on the current zoom scale.
 *
 * Now supports dynamic zoom level generation based on data density.
 */

import type {
  ZoomLevel,
  ZoomLevelConfig,
  StrategicMapNode,
  StrategicNodeType,
  LODLevel,
  ViewState,
  NodeHierarchy,
  ZOOM_LEVELS,
} from './types';

// Re-export for convenience
export { ZOOM_LEVELS } from './types';

// ============================================================================
// Dynamic Zoom Level Configuration
// ============================================================================

/**
 * Extended zoom level config with node limits for scalability
 */
export interface DynamicZoomLevelConfig extends ZoomLevelConfig {
  /** Maximum nodes to render at this level (for performance) */
  nodeLimit: number;
}

/**
 * Default static zoom levels (fallback)
 */
const DEFAULT_ZOOM_LEVELS: DynamicZoomLevelConfig[] = [
  {
    level: 'L1',
    minScale: 0.05,
    maxScale: 0.25,
    visibleNodeTypes: ['cluster'],
    showLabels: true, // Always show labels at L1 for categories
    showCounts: true,
    showConnections: false,
    nodeLimit: 50,
  },
  {
    level: 'L2',
    minScale: 0.25,
    maxScale: 0.6,
    visibleNodeTypes: ['template'],
    showLabels: true,
    showCounts: true,
    showConnections: false,
    nodeLimit: 100,
  },
  {
    level: 'L3',
    minScale: 0.6,
    maxScale: 1.2,
    visibleNodeTypes: ['template', 'thematic_group', 'topic'],
    showLabels: true,
    showCounts: true,
    showConnections: true,
    nodeLimit: 200,
  },
  {
    level: 'L4',
    minScale: 1.2,
    maxScale: 3.0,
    visibleNodeTypes: ['thematic_group', 'topic', 'session'],
    showLabels: true,
    showCounts: false,
    showConnections: true,
    nodeLimit: 500,
  },
];

// Cached dynamic levels
let cachedDynamicLevels: DynamicZoomLevelConfig[] | null = null;
let cachedHierarchyStats: { clusters: number; templates: number; topics: number } | null = null;

/**
 * Generate dynamic zoom levels based on node hierarchy
 *
 * Adapts scale thresholds based on actual data density:
 * - More clusters → L1 extends to higher scales
 * - More templates → L2 adapts
 * - Dense topics → L3/L4 thresholds adjust
 */
export function generateDynamicZoomLevels(hierarchy: NodeHierarchy): DynamicZoomLevelConfig[] {
  const clusterCount = hierarchy.clusters.length;
  const templateCount = hierarchy.templates.length;
  const topicCount = hierarchy.topics.length;

  // Check if we can use cached levels
  if (
    cachedDynamicLevels &&
    cachedHierarchyStats &&
    cachedHierarchyStats.clusters === clusterCount &&
    cachedHierarchyStats.templates === templateCount &&
    cachedHierarchyStats.topics === topicCount
  ) {
    return cachedDynamicLevels;
  }

  // Calculate adaptive scale thresholds

  // L1 max scale adapts to cluster count (more clusters = stay zoomed out longer)
  // Base: 0.2, can go up to 0.35 for many clusters
  const l1MaxScale = Math.min(0.35, 0.2 * Math.sqrt(Math.max(clusterCount, 5) / 5));

  // L2 max scale adapts to template density
  // More templates = need more zoom to see them clearly
  const l2MaxScale = l1MaxScale + 0.25 * (10 / Math.max(templateCount, 1));
  const l2MaxScaleClamped = Math.min(l1MaxScale + 0.4, Math.max(l1MaxScale + 0.15, l2MaxScale));

  // L3 max scale fills gap before L4
  const l3MaxScale = Math.min(l2MaxScaleClamped + 0.6, 1.5);

  // Calculate node limits based on density
  const baseLimits = {
    l1: 50,
    l2: 100,
    l3: Math.min(200, topicCount * 2),
    l4: Math.min(500, topicCount * 3),
  };

  const levels: DynamicZoomLevelConfig[] = [
    {
      level: 'L1',
      minScale: 0.05,
      maxScale: l1MaxScale,
      visibleNodeTypes: ['cluster'],
      showLabels: true, // Always show labels at L1 - categories should be visible
      showCounts: true,
      showConnections: false,
      nodeLimit: baseLimits.l1,
    },
    {
      level: 'L2',
      minScale: l1MaxScale,
      maxScale: l2MaxScaleClamped,
      visibleNodeTypes: ['template'],
      showLabels: true,
      showCounts: true,
      showConnections: false,
      nodeLimit: baseLimits.l2,
    },
    {
      level: 'L3',
      minScale: l2MaxScaleClamped,
      maxScale: l3MaxScale,
      visibleNodeTypes: ['template', 'thematic_group', 'topic'],
      showLabels: true,
      showCounts: true,
      showConnections: topicCount <= 50, // Only show connections if not too dense
      nodeLimit: baseLimits.l3,
    },
    {
      level: 'L4',
      minScale: l3MaxScale,
      maxScale: 5.0,
      visibleNodeTypes: ['thematic_group', 'topic', 'session'],
      showLabels: true,
      showCounts: false,
      showConnections: true,
      nodeLimit: baseLimits.l4,
    },
  ];

  // Cache the results
  cachedDynamicLevels = levels;
  cachedHierarchyStats = { clusters: clusterCount, templates: templateCount, topics: topicCount };

  return levels;
}

/**
 * Clear the cached zoom levels (call when hierarchy changes significantly)
 */
export function clearZoomLevelCache(): void {
  cachedDynamicLevels = null;
  cachedHierarchyStats = null;
}

// ============================================================================
// Zoom Level Detection
// ============================================================================

/**
 * Get the current zoom level configuration based on scale
 * Uses dynamic levels if available, otherwise falls back to defaults
 */
export function getZoomLevel(
  scale: number,
  dynamicLevels?: DynamicZoomLevelConfig[]
): DynamicZoomLevelConfig {
  const levels = dynamicLevels || cachedDynamicLevels || DEFAULT_ZOOM_LEVELS;

  for (const config of levels) {
    if (scale >= config.minScale && scale < config.maxScale) {
      return config;
    }
  }

  // Handle edge cases
  if (scale < levels[0].minScale) {
    return levels[0];
  }
  if (scale >= levels[levels.length - 1].maxScale) {
    return levels[levels.length - 1];
  }

  // Default to L3 (normal zoom)
  return levels[2];
}

/**
 * Get the zoom level enum value
 */
export function getZoomLevelName(scale: number): ZoomLevel {
  return getZoomLevel(scale).level;
}

/**
 * Check if a node type should be visible at the current zoom level
 */
export function isNodeTypeVisible(
  nodeType: StrategicNodeType,
  scale: number
): boolean {
  const config = getZoomLevel(scale);
  return config.visibleNodeTypes.includes(nodeType);
}

// ============================================================================
// LOD Determination
// ============================================================================

/**
 * Determine the LOD level for a node based on zoom and distance from center
 */
export function determineLOD(
  node: StrategicMapNode,
  scale: number,
  viewportCenterX: number,
  viewportCenterY: number,
  viewportWidth: number,
  viewportHeight: number
): LODLevel {
  // Get base LOD from zoom level
  const zoomConfig = getZoomLevel(scale);

  // Calculate distance from viewport center (normalized 0-1)
  const dx = node.x - viewportCenterX;
  const dy = node.y - viewportCenterY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const maxDist = Math.sqrt(viewportWidth * viewportWidth + viewportHeight * viewportHeight) / 2;
  const normalizedDist = Math.min(1, dist / maxDist);

  // Nodes closer to center get more detail
  if (normalizedDist < 0.3) {
    return 'detailed';
  } else if (normalizedDist < 0.6) {
    return 'standard';
  } else {
    return 'minimal';
  }
}

/**
 * Batch update LOD for all visible nodes
 */
export function updateNodeLODs(
  nodes: StrategicMapNode[],
  scale: number,
  viewportCenterX: number,
  viewportCenterY: number,
  viewportWidth: number,
  viewportHeight: number
): void {
  for (const node of nodes) {
    node.lod = determineLOD(
      node,
      scale,
      viewportCenterX,
      viewportCenterY,
      viewportWidth,
      viewportHeight
    );
  }
}

// ============================================================================
// Visibility Filtering
// ============================================================================

/**
 * Filter nodes by visibility at current zoom level
 */
export function filterVisibleNodes(
  nodes: StrategicMapNode[],
  scale: number
): StrategicMapNode[] {
  const config = getZoomLevel(scale);

  return nodes.filter(node => {
    // Check if node type is visible at this zoom level
    if (!config.visibleNodeTypes.includes(node.type)) {
      return false;
    }

    // Mark as visible
    node.visible = true;
    return true;
  });
}

/**
 * Get nodes that should be rendered (visible + in viewport)
 */
export function getNodesForRender(
  allNodes: StrategicMapNode[],
  visibleInViewport: StrategicMapNode[],
  scale: number
): StrategicMapNode[] {
  const config = getZoomLevel(scale);

  // Filter viewport nodes by zoom-level visibility
  return visibleInViewport.filter(node =>
    config.visibleNodeTypes.includes(node.type)
  );
}

// ============================================================================
// Zoom Calculations
// ============================================================================

/**
 * Calculate the scale needed to fit a node in view with padding
 */
export function scaleToFitNode(
  node: StrategicMapNode,
  viewportWidth: number,
  viewportHeight: number,
  padding: number = 100
): number {
  const nodeRadius = node.radius * 2; // Diameter
  const targetSize = Math.min(viewportWidth, viewportHeight) - padding * 2;
  const scale = targetSize / (nodeRadius * 4); // Give some context around the node

  // Clamp to valid range
  return Math.max(0.1, Math.min(3.0, scale));
}

/**
 * Calculate the offset needed to center on a node
 */
export function offsetToCenterNode(
  node: StrategicMapNode,
  scale: number
): { offsetX: number; offsetY: number } {
  return {
    offsetX: -node.x * scale,
    offsetY: -node.y * scale,
  };
}

/**
 * Calculate zoom toward a point (for mouse wheel zoom)
 */
export function zoomTowardPoint(
  view: ViewState,
  targetX: number,
  targetY: number,
  canvasWidth: number,
  canvasHeight: number,
  zoomFactor: number,
  minScale: number,
  maxScale: number
): ViewState {
  // Calculate the point in world space before zoom
  const centerX = canvasWidth / 2 + view.offsetX;
  const centerY = canvasHeight / 2 + view.offsetY;
  const worldX = (targetX - centerX) / view.scale;
  const worldY = (targetY - centerY) / view.scale;

  // Calculate new scale
  const newScale = Math.max(minScale, Math.min(maxScale, view.scale * zoomFactor));

  // Calculate new offset to keep the world point under the mouse
  const newCenterX = canvasWidth / 2;
  const newCenterY = canvasHeight / 2;
  const newOffsetX = targetX - newCenterX - worldX * newScale;
  const newOffsetY = targetY - newCenterY - worldY * newScale;

  return {
    offsetX: newOffsetX,
    offsetY: newOffsetY,
    scale: newScale,
  };
}

/**
 * Interpolate between two view states
 */
export function interpolateViewState(
  from: ViewState,
  to: ViewState,
  t: number
): ViewState {
  return {
    offsetX: from.offsetX + (to.offsetX - from.offsetX) * t,
    offsetY: from.offsetY + (to.offsetY - from.offsetY) * t,
    scale: from.scale + (to.scale - from.scale) * t,
  };
}

// ============================================================================
// Label Visibility
// ============================================================================

/**
 * Determine if labels should be shown for a node
 */
export function shouldShowLabel(
  node: StrategicMapNode,
  scale: number,
  lod: LODLevel
): boolean {
  const config = getZoomLevel(scale);

  if (!config.showLabels) {
    return false;
  }

  // Clusters and templates are primary navigation anchors — always label them
  // so the user can orient themselves regardless of viewport position.
  if (node.type === 'cluster' || node.type === 'template') {
    return true;
  }

  // Topics/thematic-groups are secondary — only label them when zoomed in enough
  // or when they are in the detailed LOD zone near the viewport centre.
  if (scale < 0.7 && lod !== 'detailed') {
    return false;
  }

  // Session nodes only get labels at high zoom
  if (node.type === 'session' && scale < 1.2) {
    return false;
  }

  return true;
}

/**
 * Determine if counts should be shown for a node
 */
export function shouldShowCount(
  node: StrategicMapNode,
  scale: number,
  lod: LODLevel
): boolean {
  const config = getZoomLevel(scale);

  if (!config.showCounts) {
    return false;
  }

  // Sessions don't show counts
  if (node.type === 'session') {
    return false;
  }

  return true;
}
