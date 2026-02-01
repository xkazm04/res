/**
 * Circular and radial layout algorithms.
 *
 * Provides:
 * - Simple circular arrangement
 * - Concentric circles by value (like SourceNetwork credibility rings)
 * - Cluster layout with nodes arranged around group centers
 */

import type {
  LayoutNode,
  GroupedNode,
  CircularLayoutConfig,
  ConcentricLayoutConfig,
  ClusterLayoutConfig,
  LayoutResult,
  LayoutDimensions,
  Point,
} from './types';

// ============================================================================
// Default Configurations
// ============================================================================

const DEFAULT_CIRCULAR_CONFIG: Required<CircularLayoutConfig> = {
  radius: 0, // 0 means calculate from container
  startAngle: -Math.PI / 2, // Start at top
  sortBy: 'id',
  sortOrder: 'asc',
  jitter: 0,
};

const DEFAULT_CONCENTRIC_CONFIG: Required<ConcentricLayoutConfig> = {
  maxRadius: 0, // 0 means calculate from container
  radiusProperty: 'value',
  invertRadius: true, // Higher values closer to center
  jitter: 0.3,
};

const DEFAULT_CLUSTER_CONFIG: Required<ClusterLayoutConfig> = {
  clusterRadius: 300,
  nodeRadius: 180,
  groupBy: 'group',
};

// ============================================================================
// Circular Layout
// ============================================================================

/**
 * Arrange nodes in a simple circle.
 *
 * @example
 * const result = circularLayout(nodes, { width: 400, height: 400 });
 */
export function circularLayout<T extends LayoutNode>(
  nodes: T[],
  dimensions: LayoutDimensions,
  config: CircularLayoutConfig = {}
): LayoutResult<T & { x: number; y: number }> {
  const cfg = { ...DEFAULT_CIRCULAR_CONFIG, ...config };
  const { width, height } = dimensions;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = cfg.radius || Math.min(width, height) * 0.35;

  // Sort nodes if requested
  let sortedNodes = [...nodes];
  if (cfg.sortBy !== 'id') {
    sortedNodes.sort((a, b) => {
      const aVal = cfg.sortBy === 'value' ? (a.value ?? 0) : a.id;
      const bVal = cfg.sortBy === 'value' ? (b.value ?? 0) : b.id;
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return cfg.sortOrder === 'desc' ? -cmp : cmp;
    });
  }

  const resultNodes = sortedNodes.map((node, i) => {
    const angle = cfg.startAngle + (i / nodes.length) * Math.PI * 2;
    const jitter = cfg.jitter > 0 ? (Math.random() - 0.5) * cfg.jitter : 0;

    return {
      ...node,
      x: centerX + Math.cos(angle + jitter) * radius,
      y: centerY + Math.sin(angle + jitter) * radius,
    };
  });

  return {
    nodes: resultNodes,
    bounds: {
      minX: centerX - radius,
      maxX: centerX + radius,
      minY: centerY - radius,
      maxY: centerY + radius,
      width: radius * 2,
      height: radius * 2,
    },
  };
}

// ============================================================================
// Concentric Circles Layout
// ============================================================================

/**
 * Arrange nodes in concentric circles based on a value property.
 * Used by SourceNetwork to show sources by credibility.
 *
 * @example
 * const result = concentricLayout(sources, dimensions, {
 *   radiusProperty: 'credibility',
 *   invertRadius: true, // High credibility = close to center
 * });
 */
export function concentricLayout<T extends LayoutNode & Record<string, unknown>>(
  nodes: T[],
  dimensions: LayoutDimensions,
  config: ConcentricLayoutConfig = {}
): LayoutResult<T & { x: number; y: number }> {
  const cfg = { ...DEFAULT_CONCENTRIC_CONFIG, ...config };
  const { width, height } = dimensions;
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = cfg.maxRadius || Math.min(width, height) * 0.4;

  const resultNodes = nodes.map((node, i) => {
    // Get the radial value (0-1)
    let radialValue = (node[cfg.radiusProperty] as number) ?? 0.5;
    if (cfg.invertRadius) {
      radialValue = 1 - radialValue * 0.8; // Higher value = closer to center
    }

    const radius = maxRadius * radialValue;
    const angle = (i / nodes.length) * Math.PI * 2 + (Math.random() * cfg.jitter);

    return {
      ...node,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    };
  });

  return {
    nodes: resultNodes,
    bounds: {
      minX: centerX - maxRadius,
      maxX: centerX + maxRadius,
      minY: centerY - maxRadius,
      maxY: centerY + maxRadius,
      width: maxRadius * 2,
      height: maxRadius * 2,
    },
  };
}

// ============================================================================
// Cluster Layout
// ============================================================================

/**
 * Group nodes by a property and arrange clusters in a circle,
 * with individual nodes orbiting their cluster centers.
 * Used by RadarView for template/topic hierarchy.
 *
 * @example
 * const result = clusterLayout(nodes, dimensions, {
 *   groupBy: 'template',
 *   clusterRadius: 300,
 *   nodeRadius: 150,
 * });
 */
export function clusterLayout<T extends GroupedNode>(
  nodes: T[],
  dimensions: LayoutDimensions,
  config: ClusterLayoutConfig = {}
): LayoutResult<T & { x: number; y: number; clusterCenter?: Point }> {
  const cfg = { ...DEFAULT_CLUSTER_CONFIG, ...config };
  const { width, height } = dimensions;
  const centerX = width / 2;
  const centerY = height / 2;

  // Group nodes
  const groups = new Map<string, T[]>();
  for (const node of nodes) {
    const groupKey = (node[cfg.groupBy as keyof T] as string) ?? 'default';
    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(node);
  }

  const groupKeys = Array.from(groups.keys());
  const groupCenters = new Map<string, Point>();

  // Position group centers in a circle
  groupKeys.forEach((key, i) => {
    const angle = (i / groupKeys.length) * Math.PI * 2 - Math.PI / 2;
    groupCenters.set(key, {
      x: centerX + Math.cos(angle) * cfg.clusterRadius,
      y: centerY + Math.sin(angle) * cfg.clusterRadius,
    });
  });

  // Position nodes around their group centers
  const resultNodes: (T & { x: number; y: number; clusterCenter?: Point })[] = [];

  for (const [groupKey, groupNodes] of groups) {
    const center = groupCenters.get(groupKey)!;

    groupNodes.forEach((node, i) => {
      const angle = (i / groupNodes.length) * Math.PI * 2 - Math.PI / 2;
      // Scale orbit radius by node value if present
      const orbitRadius = cfg.nodeRadius * (0.8 + (node.value ?? 0.5) * 0.4);

      resultNodes.push({
        ...node,
        x: center.x + Math.cos(angle) * orbitRadius,
        y: center.y + Math.sin(angle) * orbitRadius,
        clusterCenter: center,
      });
    });
  }

  const totalRadius = cfg.clusterRadius + cfg.nodeRadius;
  return {
    nodes: resultNodes,
    bounds: {
      minX: centerX - totalRadius,
      maxX: centerX + totalRadius,
      minY: centerY - totalRadius,
      maxY: centerY + totalRadius,
      width: totalRadius * 2,
      height: totalRadius * 2,
    },
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate positions for nodes at specified angles on a ring.
 * Useful for creating custom radial layouts.
 */
export function positionOnRing(
  center: Point,
  radius: number,
  angles: number[]
): Point[] {
  return angles.map((angle) => ({
    x: center.x + Math.cos(angle) * radius,
    y: center.y + Math.sin(angle) * radius,
  }));
}

/**
 * Calculate evenly spaced angles for n items.
 */
export function evenAngles(count: number, startAngle: number = -Math.PI / 2): number[] {
  return Array.from({ length: count }, (_, i) => startAngle + (i / count) * Math.PI * 2);
}

/**
 * Get the angle from center to a point.
 */
export function angleFromCenter(center: Point, point: Point): number {
  return Math.atan2(point.y - center.y, point.x - center.x);
}

/**
 * Get distance between two points.
 */
export function distance(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}
