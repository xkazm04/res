/**
 * Shared type definitions for graph layout algorithms.
 *
 * This module provides a common interface for all layout algorithms in the system,
 * enabling consistent node/edge representations across different visualizations.
 */

// ============================================================================
// Core Node Types
// ============================================================================

/** Base node interface with position and sizing */
export interface LayoutNode {
  id: string;
  x: number;
  y: number;
  radius?: number;
  /** Value from 0-1 for sizing calculations */
  value?: number;
  /** Optional fixed position (won't be moved by layout) */
  fixed?: boolean;
}

/** Extended node with velocity for force simulation */
export interface ForceNode extends LayoutNode {
  vx: number;
  vy: number;
}

/** Node grouping for hierarchical layouts */
export interface GroupedNode extends LayoutNode {
  group?: string;
  parentId?: string;
}

// ============================================================================
// Edge Types
// ============================================================================

/** Base edge connecting two nodes */
export interface LayoutEdge {
  source: string;
  target: string;
  /** Edge weight/strength from 0-1 */
  strength?: number;
}

/** Edge with additional visual metadata */
export interface StyledEdge extends LayoutEdge {
  type?: 'supports' | 'contradicts' | 'references' | 'default';
}

// ============================================================================
// Layout Configuration
// ============================================================================

/** Configuration for force-directed layout */
export interface ForceLayoutConfig {
  /** Number of simulation iterations (default: 50) */
  iterations?: number;
  /** Repulsion force multiplier (default: 1000) */
  repulsion?: number;
  /** Attraction force multiplier (default: 0.01) */
  attraction?: number;
  /** Damping factor to reduce velocity each iteration (default: 0.1) */
  damping?: number;
  /** Minimum distance between nodes (default: 1) */
  minDistance?: number;
  /** Padding from container bounds (default: 40) */
  padding?: number;
  /** Center gravity strength (default: 0) */
  centerGravity?: number;
}

/** Configuration for circular/radial layout */
export interface CircularLayoutConfig {
  /** Radius of the circle (calculated from container if not provided) */
  radius?: number;
  /** Starting angle in radians (default: 0) */
  startAngle?: number;
  /** Sort nodes by this property before layout */
  sortBy?: 'value' | 'id' | 'group';
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
  /** Random angle offset range (default: 0) */
  jitter?: number;
}

/** Configuration for concentric circles layout (like SourceNetwork) */
export interface ConcentricLayoutConfig {
  /** Maximum radius (calculated from container if not provided) */
  maxRadius?: number;
  /** Property to use for radial position (0-1 value) */
  radiusProperty?: string;
  /** Whether higher values are closer to center (default: true) */
  invertRadius?: boolean;
  /** Random angle offset range (default: 0.3) */
  jitter?: number;
}

/** Configuration for cluster layout */
export interface ClusterLayoutConfig {
  /** Radius for cluster arrangement */
  clusterRadius?: number;
  /** Radius for nodes within clusters */
  nodeRadius?: number;
  /** Property to group by */
  groupBy?: string;
}

// ============================================================================
// Layout Results
// ============================================================================

/** Result of a layout calculation */
export interface LayoutResult<T extends LayoutNode = LayoutNode> {
  nodes: T[];
  /** Bounds of the laid out nodes */
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    width: number;
    height: number;
  };
}

// ============================================================================
// Container Types
// ============================================================================

/** Dimensions for layout calculations */
export interface LayoutDimensions {
  width: number;
  height: number;
}

/** Center point */
export interface Point {
  x: number;
  y: number;
}

// ============================================================================
// Utility Types
// ============================================================================

/** Generic node with any additional properties */
export type NodeWithData<T extends LayoutNode, D = Record<string, unknown>> = T & {
  data?: D;
};

/** Position update for a node */
export interface PositionUpdate {
  id: string;
  x: number;
  y: number;
}

/** Map of node positions by ID */
export type PositionMap = Map<string, Point>;
