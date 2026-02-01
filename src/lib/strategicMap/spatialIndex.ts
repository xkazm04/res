/**
 * Spatial Index using D3 Quadtree
 *
 * Provides O(log n) spatial queries for:
 * - Hit detection (finding node under cursor)
 * - Viewport culling (finding nodes in view)
 * - Nearest neighbor search
 */

import * as d3 from 'd3';
import type { StrategicMapNode, Viewport, QuadtreeNode } from './types';

// D3 quadtree visitor node - can be leaf (has .data) or internal (has .length = 4)
// Using simplified type to avoid complex d3 generics issues
interface QuadVisitorNode {
  data?: QuadtreeNode;
  length?: number;
}

// Type guard for leaf nodes (leaves have data, internals have length = 4)
function isLeafNode(node: QuadVisitorNode): node is { data: QuadtreeNode } {
  return node.length === undefined && node.data !== undefined;
}

// ============================================================================
// Spatial Index Class
// ============================================================================

export class SpatialIndex {
  private quadtree: d3.Quadtree<QuadtreeNode> | null = null;
  private nodes: Map<string, QuadtreeNode> = new Map();

  /**
   * Build or rebuild the quadtree from nodes
   */
  build(nodes: StrategicMapNode[]): void {
    // Convert to quadtree nodes
    this.nodes.clear();
    const quadtreeNodes: QuadtreeNode[] = [];

    for (const node of nodes) {
      const qnode: QuadtreeNode = {
        id: node.id,
        x: node.x,
        y: node.y,
        radius: node.radius,
        data: node,
      };
      this.nodes.set(node.id, qnode);
      quadtreeNodes.push(qnode);
    }

    // Build quadtree
    this.quadtree = d3.quadtree<QuadtreeNode>()
      .x(d => d.x)
      .y(d => d.y)
      .addAll(quadtreeNodes);
  }

  /**
   * Update a single node's position (more efficient than rebuilding)
   */
  update(nodeId: string, x: number, y: number, radius?: number): void {
    const existingNode = this.nodes.get(nodeId);
    if (!existingNode || !this.quadtree) return;

    // Remove old position
    this.quadtree.remove(existingNode);

    // Update position
    existingNode.x = x;
    existingNode.y = y;
    if (radius !== undefined) {
      existingNode.radius = radius;
    }

    // Re-add at new position
    this.quadtree.add(existingNode);
  }

  /**
   * Find the node at a given point (with hit radius consideration)
   * Returns null if no node found
   */
  findNodeAt(x: number, y: number, hitPadding: number = 1.5): StrategicMapNode | null {
    const candidates = this.findAllNodesAt(x, y, hitPadding);
    return candidates.length > 0 ? candidates[0] : null;
  }

  /**
   * Find ALL nodes at a given point (with hit radius consideration)
   * Returns array sorted by distance (closest first)
   * This is useful when multiple nodes overlap (e.g., cluster and template at same position)
   */
  findAllNodesAt(x: number, y: number, hitPadding: number = 1.5): StrategicMapNode[] {
    return this.findAllNodesAtWithMinRadius(x, y, hitPadding, 0);
  }

  /**
   * Find ALL nodes at a given point with both multiplier and minimum radius
   * @param x - World X coordinate
   * @param y - World Y coordinate
   * @param hitMultiplier - Multiply node radius by this (e.g., 1.5 = 50% larger)
   * @param minRadius - Minimum hit radius in world coordinates (ensures small nodes are clickable)
   */
  findAllNodesAtWithMinRadius(
    x: number,
    y: number,
    hitMultiplier: number = 1.5,
    minRadius: number = 0
  ): StrategicMapNode[] {
    if (!this.quadtree) return [];

    // Use d3.quadtree.find with radius search
    // We search in expanding circles until we find hits
    const searchRadius = 500; // Max search radius (increased for zoomed out views)

    const candidates: Array<{ node: StrategicMapNode; dist: number }> = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.quadtree.visit((quad: any, x1: number, y1: number, x2: number, y2: number) => {
      // Check if this quadrant could contain a closer point
      const dx = Math.max(x1 - x, 0, x - x2);
      const dy = Math.max(y1 - y, 0, y - y2);
      const minDist = Math.sqrt(dx * dx + dy * dy);

      if (minDist > searchRadius) {
        return true; // Skip this quadrant
      }

      // Check leaf nodes (leaves have data, internals have length = 4)
      if (isLeafNode(quad as QuadVisitorNode)) {
        const qnode = (quad as QuadVisitorNode).data!;
        const dist = Math.sqrt((qnode.x - x) ** 2 + (qnode.y - y) ** 2);
        // Use max of (radius * multiplier) and minRadius for hit detection
        const hitRadius = Math.max(qnode.radius * hitMultiplier, minRadius);

        if (dist < hitRadius) {
          candidates.push({ node: qnode.data, dist });
        }
      }

      return false; // Continue visiting
    });

    // Sort by distance and return nodes
    candidates.sort((a, b) => a.dist - b.dist);
    return candidates.map(c => c.node);
  }

  /**
   * Find all nodes within a viewport (for culling)
   */
  findNodesInViewport(viewport: Viewport, padding: number = 100): StrategicMapNode[] {
    if (!this.quadtree) return [];

    const results: StrategicMapNode[] = [];
    const left = viewport.left - padding;
    const top = viewport.top - padding;
    const right = viewport.right + padding;
    const bottom = viewport.bottom + padding;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.quadtree.visit((quad: any, x1: number, y1: number, x2: number, y2: number) => {
      // Check if this quadrant intersects our viewport
      if (x1 > right || x2 < left || y1 > bottom || y2 < top) {
        return true; // Skip this quadrant entirely
      }

      // Check leaf nodes
      if (isLeafNode(quad as QuadVisitorNode)) {
        const node = (quad as QuadVisitorNode).data!;
        // Include node if its bounds intersect viewport
        const nodeLeft = node.x - node.radius;
        const nodeRight = node.x + node.radius;
        const nodeTop = node.y - node.radius;
        const nodeBottom = node.y + node.radius;

        if (
          nodeRight >= left &&
          nodeLeft <= right &&
          nodeBottom >= top &&
          nodeTop <= bottom
        ) {
          results.push(node.data);
        }
      }

      return false; // Continue visiting
    });

    return results;
  }

  /**
   * Find the N nearest nodes to a point
   */
  findNearestNodes(x: number, y: number, count: number): StrategicMapNode[] {
    if (!this.quadtree) return [];

    const results: Array<{ node: StrategicMapNode; dist: number }> = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.quadtree.visit((quad: any, x1: number, y1: number, x2: number, y2: number) => {
      if (isLeafNode(quad as QuadVisitorNode)) {
        const node = (quad as QuadVisitorNode).data!;
        const dist = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);

        if (results.length < count) {
          results.push({ node: node.data, dist });
          results.sort((a, b) => a.dist - b.dist);
        } else if (dist < results[results.length - 1].dist) {
          results[results.length - 1] = { node: node.data, dist };
          results.sort((a, b) => a.dist - b.dist);
        }
      }
      return false;
    });

    return results.map(r => r.node);
  }

  /**
   * Find nodes within a radius of a point
   */
  findNodesInRadius(x: number, y: number, radius: number): StrategicMapNode[] {
    if (!this.quadtree) return [];

    const results: StrategicMapNode[] = [];
    const r2 = radius * radius;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.quadtree.visit((quad: any, x1: number, y1: number, x2: number, y2: number) => {
      // Check if this quadrant could contain nodes within radius
      const dx = Math.max(x1 - x, 0, x - x2);
      const dy = Math.max(y1 - y, 0, y - y2);

      if (dx * dx + dy * dy > r2) {
        return true; // Skip this quadrant
      }

      if (isLeafNode(quad as QuadVisitorNode)) {
        const node = (quad as QuadVisitorNode).data!;
        const dist2 = (node.x - x) ** 2 + (node.y - y) ** 2;
        if (dist2 <= r2) {
          results.push(node.data);
        }
      }

      return false;
    });

    return results;
  }

  /**
   * Get all nodes (for debugging)
   */
  getAllNodes(): StrategicMapNode[] {
    return Array.from(this.nodes.values()).map(n => n.data);
  }

  /**
   * Clear the index
   */
  clear(): void {
    this.quadtree = null;
    this.nodes.clear();
  }

  /**
   * Get statistics about the index
   */
  getStats(): { nodeCount: number; depth: number } {
    if (!this.quadtree) {
      return { nodeCount: 0, depth: 0 };
    }

    let maxDepth = 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.quadtree.visit((quad: any, x1: number, y1: number, x2: number, y2: number) => {
      // Estimate depth from quad size
      const size = Math.max(x2 - x1, y2 - y1);
      const depth = Math.ceil(Math.log2(1000 / size));
      maxDepth = Math.max(maxDepth, depth);
      return false;
    });

    return {
      nodeCount: this.nodes.size,
      depth: maxDepth,
    };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate viewport from view state and canvas dimensions
 */
export function calculateViewport(
  canvasWidth: number,
  canvasHeight: number,
  offsetX: number,
  offsetY: number,
  scale: number
): Viewport {
  const centerX = canvasWidth / 2 + offsetX;
  const centerY = canvasHeight / 2 + offsetY;

  // Calculate world-space bounds
  const halfWidth = (canvasWidth / 2) / scale;
  const halfHeight = (canvasHeight / 2) / scale;

  return {
    left: -offsetX / scale - halfWidth,
    top: -offsetY / scale - halfHeight,
    right: -offsetX / scale + halfWidth,
    bottom: -offsetY / scale + halfHeight,
    width: canvasWidth / scale,
    height: canvasHeight / scale,
    centerX: -offsetX / scale,
    centerY: -offsetY / scale,
  };
}

/**
 * Convert screen coordinates to world coordinates
 */
export function screenToWorld(
  screenX: number,
  screenY: number,
  canvasWidth: number,
  canvasHeight: number,
  offsetX: number,
  offsetY: number,
  scale: number
): { x: number; y: number } {
  const centerX = canvasWidth / 2 + offsetX;
  const centerY = canvasHeight / 2 + offsetY;

  return {
    x: (screenX - centerX) / scale,
    y: (screenY - centerY) / scale,
  };
}

/**
 * Convert world coordinates to screen coordinates
 */
export function worldToScreen(
  worldX: number,
  worldY: number,
  canvasWidth: number,
  canvasHeight: number,
  offsetX: number,
  offsetY: number,
  scale: number
): { x: number; y: number } {
  const centerX = canvasWidth / 2 + offsetX;
  const centerY = canvasHeight / 2 + offsetY;

  return {
    x: centerX + worldX * scale,
    y: centerY + worldY * scale,
  };
}
