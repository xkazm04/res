/**
 * Force-directed graph layout algorithm.
 *
 * Implements a simple force simulation with:
 * - Repulsion between all nodes
 * - Attraction along edges
 * - Boundary constraints
 * - Center gravity (optional)
 */

import type {
  LayoutNode,
  ForceNode,
  LayoutEdge,
  ForceLayoutConfig,
  LayoutResult,
  LayoutDimensions,
  PositionMap,
  Point,
} from './types';

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: Required<ForceLayoutConfig> = {
  iterations: 50,
  repulsion: 1000,
  attraction: 0.01,
  damping: 0.1,
  minDistance: 1,
  padding: 40,
  centerGravity: 0,
};

// ============================================================================
// Core Force Simulation
// ============================================================================

/**
 * Initialize nodes with positions and velocities.
 * Places nodes in a circular arrangement to start.
 */
export function initializeForceNodes<T extends LayoutNode>(
  nodes: T[],
  dimensions: LayoutDimensions
): ForceNode[] {
  const { width, height } = dimensions;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.35;

  return nodes.map((node, i) => {
    // Use existing position if provided, otherwise arrange in circle
    if (node.x !== undefined && node.y !== undefined && node.x !== 0 && node.y !== 0) {
      return { ...node, vx: 0, vy: 0 };
    }

    const angle = (i / nodes.length) * Math.PI * 2;
    return {
      ...node,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      vx: 0,
      vy: 0,
    };
  });
}

/**
 * Apply repulsion forces between all nodes.
 */
function applyRepulsion(
  nodes: ForceNode[],
  repulsion: number,
  minDistance: number,
  damping: number
): void {
  for (let i = 0; i < nodes.length; i++) {
    const nodeA = nodes[i];
    if (nodeA.fixed) continue;

    for (let j = i + 1; j < nodes.length; j++) {
      const nodeB = nodes[j];
      const dx = nodeA.x - nodeB.x;
      const dy = nodeA.y - nodeB.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || minDistance;
      const force = repulsion / (dist * dist);
      const fx = (dx / dist) * force * damping;
      const fy = (dy / dist) * force * damping;

      nodeA.x += fx;
      nodeA.y += fy;

      if (!nodeB.fixed) {
        nodeB.x -= fx;
        nodeB.y -= fy;
      }
    }
  }
}

/**
 * Apply attraction forces along edges.
 */
function applyAttraction(
  nodes: ForceNode[],
  edges: LayoutEdge[],
  attraction: number,
  nodeMap: Map<string, ForceNode>
): void {
  for (const edge of edges) {
    const nodeA = nodeMap.get(edge.source);
    const nodeB = nodeMap.get(edge.target);
    if (!nodeA || !nodeB) continue;

    const dx = nodeB.x - nodeA.x;
    const dy = nodeB.y - nodeA.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const strength = edge.strength ?? 1;
    const force = dist * attraction * strength;
    const fx = (dx / dist) * force;
    const fy = (dy / dist) * force;

    if (!nodeA.fixed) {
      nodeA.x += fx;
      nodeA.y += fy;
    }
    if (!nodeB.fixed) {
      nodeB.x -= fx;
      nodeB.y -= fy;
    }
  }
}

/**
 * Apply center gravity to pull nodes toward center.
 */
function applyCenterGravity(
  nodes: ForceNode[],
  centerX: number,
  centerY: number,
  strength: number
): void {
  if (strength <= 0) return;

  for (const node of nodes) {
    if (node.fixed) continue;
    const dx = centerX - node.x;
    const dy = centerY - node.y;
    node.x += dx * strength;
    node.y += dy * strength;
  }
}

/**
 * Constrain nodes to stay within bounds.
 */
function applyBounds(
  nodes: ForceNode[],
  dimensions: LayoutDimensions,
  padding: number
): void {
  const { width, height } = dimensions;
  const minX = padding;
  const maxX = width - padding;
  const minY = padding;
  const maxY = height - padding;

  for (const node of nodes) {
    node.x = Math.max(minX, Math.min(maxX, node.x));
    node.y = Math.max(minY, Math.min(maxY, node.y));
  }
}

/**
 * Calculate layout bounds from positioned nodes.
 */
function calculateBounds(nodes: ForceNode[]): LayoutResult['bounds'] {
  if (nodes.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    const r = node.radius ?? 0;
    minX = Math.min(minX, node.x - r);
    maxX = Math.max(maxX, node.x + r);
    minY = Math.min(minY, node.y - r);
    maxY = Math.max(maxY, node.y + r);
  }

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Run force-directed layout simulation.
 *
 * @param nodes - Nodes to layout (will be cloned, not mutated)
 * @param edges - Edges connecting nodes
 * @param dimensions - Container dimensions
 * @param config - Layout configuration
 * @returns Layout result with positioned nodes
 *
 * @example
 * const result = forceDirectedLayout(nodes, edges, { width: 400, height: 300 });
 * // Use result.nodes for positioned nodes
 */
export function forceDirectedLayout<T extends LayoutNode>(
  nodes: T[],
  edges: LayoutEdge[],
  dimensions: LayoutDimensions,
  config: ForceLayoutConfig = {}
): LayoutResult<T & { x: number; y: number }> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const { width, height } = dimensions;
  const centerX = width / 2;
  const centerY = height / 2;

  // Initialize force nodes
  const forceNodes = initializeForceNodes(nodes, dimensions);
  const nodeMap = new Map(forceNodes.map((n) => [n.id, n]));

  // Run simulation
  for (let iter = 0; iter < cfg.iterations; iter++) {
    applyRepulsion(forceNodes, cfg.repulsion, cfg.minDistance, cfg.damping);
    applyAttraction(forceNodes, edges, cfg.attraction, nodeMap);
    applyCenterGravity(forceNodes, centerX, centerY, cfg.centerGravity);
    applyBounds(forceNodes, dimensions, cfg.padding);
  }

  // Map back to original node type with updated positions
  const resultNodes = nodes.map((originalNode) => {
    const forceNode = nodeMap.get(originalNode.id);
    return {
      ...originalNode,
      x: forceNode?.x ?? originalNode.x ?? 0,
      y: forceNode?.y ?? originalNode.y ?? 0,
    };
  });

  return {
    nodes: resultNodes,
    bounds: calculateBounds(forceNodes),
  };
}

/**
 * Get positions as a Map for quick lookup.
 *
 * @param nodes - Nodes with positions
 * @returns Map of node ID to position
 */
export function getPositionMap(nodes: LayoutNode[]): PositionMap {
  const map = new Map<string, Point>();
  for (const node of nodes) {
    map.set(node.id, { x: node.x, y: node.y });
  }
  return map;
}

/**
 * Create a partial layout update for incremental changes.
 * Useful for adding/removing nodes without full re-layout.
 *
 * @param existingPositions - Current position map
 * @param newNodes - New nodes to add
 * @param dimensions - Container dimensions
 * @returns Position map with new nodes added
 */
export function incrementalLayout(
  existingPositions: PositionMap,
  newNodes: LayoutNode[],
  dimensions: LayoutDimensions
): PositionMap {
  const { width, height } = dimensions;
  const centerX = width / 2;
  const centerY = height / 2;
  const result = new Map(existingPositions);

  // Add new nodes near center with some randomization
  for (const node of newNodes) {
    if (!result.has(node.id)) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 50 + 20;
      result.set(node.id, {
        x: centerX + Math.cos(angle) * dist,
        y: centerY + Math.sin(angle) * dist,
      });
    }
  }

  return result;
}
