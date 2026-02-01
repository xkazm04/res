'use client';

/**
 * React hooks for using layout algorithms.
 *
 * Provides:
 * - useForceLayout - Force-directed layout with edge connections
 * - useCircularLayout - Simple circular arrangement
 * - useConcentricLayout - Radial layout by value
 * - useClusterLayout - Grouped nodes with orbiting children
 * - useContainerDimensions - Track container size
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type {
  LayoutNode,
  LayoutEdge,
  GroupedNode,
  ForceLayoutConfig,
  CircularLayoutConfig,
  ConcentricLayoutConfig,
  ClusterLayoutConfig,
  LayoutDimensions,
  PositionMap,
  Point,
} from './types';
import { forceDirectedLayout, getPositionMap } from './force-directed';
import { circularLayout, concentricLayout, clusterLayout } from './circular';

// ============================================================================
// Dimension Tracking Hook
// ============================================================================

/**
 * Track the dimensions of a container element.
 *
 * @returns [ref, dimensions] - Attach ref to container element
 *
 * @example
 * const [containerRef, dimensions] = useContainerDimensions();
 * return <div ref={containerRef}>...</div>;
 */
export function useContainerDimensions(): [
  React.RefObject<HTMLDivElement | null>,
  LayoutDimensions
] {
  const ref = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<LayoutDimensions>({
    width: 400,
    height: 300,
  });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const updateDimensions = () => {
      const rect = element.getBoundingClientRect();
      setDimensions({ width: rect.width, height: rect.height });
    };

    updateDimensions();

    const observer = new ResizeObserver(updateDimensions);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return [ref, dimensions];
}

// ============================================================================
// Force Layout Hook
// ============================================================================

/**
 * Use force-directed layout for graph visualization.
 *
 * @param nodes - Nodes to layout
 * @param edges - Edges connecting nodes
 * @param dimensions - Container dimensions
 * @param config - Layout configuration
 * @returns Position map for quick lookups
 *
 * @example
 * const [ref, dims] = useContainerDimensions();
 * const positions = useForceLayout(nodes, edges, dims);
 *
 * return (
 *   <div ref={ref}>
 *     {nodes.map(n => {
 *       const pos = positions.get(n.id);
 *       return <circle cx={pos?.x} cy={pos?.y} />;
 *     })}
 *   </div>
 * );
 */
export function useForceLayout<T extends LayoutNode>(
  nodes: T[],
  edges: LayoutEdge[],
  dimensions: LayoutDimensions,
  config?: ForceLayoutConfig
): PositionMap {
  const [positions, setPositions] = useState<PositionMap>(new Map());

  // Memoize node IDs to detect actual changes
  const nodeIds = useMemo(() => nodes.map((n) => n.id).join(','), [nodes]);
  const edgeIds = useMemo(
    () => edges.map((e) => `${e.source}-${e.target}`).join(','),
    [edges]
  );

  useEffect(() => {
    if (nodes.length === 0 || dimensions.width === 0 || dimensions.height === 0) {
      return;
    }

    const result = forceDirectedLayout(nodes, edges, dimensions, config);
    setPositions(getPositionMap(result.nodes));
  }, [nodeIds, edgeIds, dimensions.width, dimensions.height, config]);

  return positions;
}

/**
 * Force layout with positioned nodes returned directly.
 */
export function useForceLayoutNodes<T extends LayoutNode>(
  nodes: T[],
  edges: LayoutEdge[],
  dimensions: LayoutDimensions,
  config?: ForceLayoutConfig
): (T & { x: number; y: number })[] {
  const [positioned, setPositioned] = useState<(T & { x: number; y: number })[]>([]);

  const nodeIds = useMemo(() => nodes.map((n) => n.id).join(','), [nodes]);
  const edgeIds = useMemo(
    () => edges.map((e) => `${e.source}-${e.target}`).join(','),
    [edges]
  );

  useEffect(() => {
    if (nodes.length === 0 || dimensions.width === 0 || dimensions.height === 0) {
      return;
    }

    const result = forceDirectedLayout(nodes, edges, dimensions, config);
    setPositioned(result.nodes);
  }, [nodeIds, edgeIds, dimensions.width, dimensions.height, config]);

  return positioned;
}

// ============================================================================
// Circular Layout Hook
// ============================================================================

/**
 * Use circular layout for arranging nodes in a ring.
 *
 * @example
 * const [ref, dims] = useContainerDimensions();
 * const positions = useCircularLayout(nodes, dims);
 */
export function useCircularLayout<T extends LayoutNode>(
  nodes: T[],
  dimensions: LayoutDimensions,
  config?: CircularLayoutConfig
): PositionMap {
  const [positions, setPositions] = useState<PositionMap>(new Map());

  const nodeIds = useMemo(() => nodes.map((n) => n.id).join(','), [nodes]);

  useEffect(() => {
    if (nodes.length === 0 || dimensions.width === 0 || dimensions.height === 0) {
      return;
    }

    const result = circularLayout(nodes, dimensions, config);
    setPositions(getPositionMap(result.nodes));
  }, [nodeIds, dimensions.width, dimensions.height, config]);

  return positions;
}

// ============================================================================
// Concentric Layout Hook
// ============================================================================

/**
 * Use concentric layout for radial arrangement by value.
 * Ideal for showing nodes by credibility, importance, etc.
 *
 * @example
 * const nodes = sources.map(s => ({ ...s, value: s.credibility_score }));
 * const positions = useConcentricLayout(nodes, dims, {
 *   radiusProperty: 'value',
 *   invertRadius: true, // High values near center
 * });
 */
export function useConcentricLayout<T extends LayoutNode & Record<string, unknown>>(
  nodes: T[],
  dimensions: LayoutDimensions,
  config?: ConcentricLayoutConfig
): PositionMap {
  const [positions, setPositions] = useState<PositionMap>(new Map());

  const nodeIds = useMemo(() => nodes.map((n) => n.id).join(','), [nodes]);

  useEffect(() => {
    if (nodes.length === 0 || dimensions.width === 0 || dimensions.height === 0) {
      return;
    }

    const result = concentricLayout(nodes, dimensions, config);
    setPositions(getPositionMap(result.nodes));
  }, [nodeIds, dimensions.width, dimensions.height, config]);

  return positions;
}

/**
 * Concentric layout returning positioned nodes directly.
 */
export function useConcentricLayoutNodes<T extends LayoutNode & Record<string, unknown>>(
  nodes: T[],
  dimensions: LayoutDimensions,
  config?: ConcentricLayoutConfig
): (T & { x: number; y: number })[] {
  const [positioned, setPositioned] = useState<(T & { x: number; y: number })[]>([]);

  const nodeIds = useMemo(() => nodes.map((n) => n.id).join(','), [nodes]);

  useEffect(() => {
    if (nodes.length === 0 || dimensions.width === 0 || dimensions.height === 0) {
      return;
    }

    const result = concentricLayout(nodes, dimensions, config);
    setPositioned(result.nodes);
  }, [nodeIds, dimensions.width, dimensions.height, config]);

  return positioned;
}

// ============================================================================
// Cluster Layout Hook
// ============================================================================

/**
 * Use cluster layout for grouped nodes with orbital arrangement.
 *
 * @example
 * const positions = useClusterLayout(nodes, dims, {
 *   groupBy: 'template',
 *   clusterRadius: 250,
 * });
 */
export function useClusterLayout<T extends GroupedNode>(
  nodes: T[],
  dimensions: LayoutDimensions,
  config?: ClusterLayoutConfig
): PositionMap {
  const [positions, setPositions] = useState<PositionMap>(new Map());

  const nodeIds = useMemo(() => nodes.map((n) => n.id).join(','), [nodes]);

  useEffect(() => {
    if (nodes.length === 0 || dimensions.width === 0 || dimensions.height === 0) {
      return;
    }

    const result = clusterLayout(nodes, dimensions, config);
    setPositions(getPositionMap(result.nodes));
  }, [nodeIds, dimensions.width, dimensions.height, config]);

  return positions;
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Get center point of container.
 */
export function useCenter(dimensions: LayoutDimensions): Point {
  return useMemo(
    () => ({
      x: dimensions.width / 2,
      y: dimensions.height / 2,
    }),
    [dimensions.width, dimensions.height]
  );
}

/**
 * Find node at a given position (for hover/click detection).
 */
export function useFindNodeAtPosition<T extends LayoutNode>(
  nodes: T[],
  positions: PositionMap
): (x: number, y: number, hitRadius?: number) => T | null {
  return useCallback(
    (x: number, y: number, hitRadius: number = 1.5) => {
      for (const node of nodes) {
        const pos = positions.get(node.id);
        if (!pos) continue;

        const dx = x - pos.x;
        const dy = y - pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const nodeRadius = node.radius ?? 10;

        if (dist < nodeRadius * hitRadius) {
          return node;
        }
      }
      return null;
    },
    [nodes, positions]
  );
}
