'use client';

import { useState, useMemo, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizationTheme } from './useVisualizationTheme';
import {
  useForceLayout,
  useConcentricLayoutNodes,
  useContainerDimensions,
  type LayoutEdge,
} from '@/src/lib/layout';

// ========== TYPES ==========

/** Node in a graph visualization */
export interface GraphNode {
  id: string;
  label: string;
  type?: string;
  value?: number; // 0-1 for sizing/positioning
  color?: string; // Override default color
  data?: Record<string, unknown>; // Arbitrary node data
}

/** Edge connecting two nodes */
export interface GraphEdge {
  source: string;
  target: string;
  strength?: number; // 0-1 for visual weight
  type?: 'default' | 'dashed' | 'dotted';
  label?: string;
}

/** Layout strategy for the graph */
export type GraphLayoutStrategy =
  | 'force-directed'
  | 'concentric'
  | 'radial'
  | 'tree'
  | 'grid';

/** Configuration for force-directed layout */
export interface ForceLayoutOptions {
  iterations?: number;
  repulsion?: number;
  attraction?: number;
  damping?: number;
  padding?: number;
}

/** Configuration for concentric layout */
export interface ConcentricLayoutOptions {
  radiusProperty?: string;
  invertRadius?: boolean;
  jitter?: number;
}

/** Configuration for radial layout (orbital/constellation) */
export interface RadialLayoutOptions {
  groupBy?: string;
  orbitSpacing?: number;
  startAngle?: number;
}

/** Union of all layout options */
export type GraphLayoutOptions =
  | { strategy: 'force-directed'; options?: ForceLayoutOptions }
  | { strategy: 'concentric'; options?: ConcentricLayoutOptions }
  | { strategy: 'radial'; options?: RadialLayoutOptions }
  | { strategy: 'tree'; options?: Record<string, never> }
  | { strategy: 'grid'; options?: { columns?: number } };

/** Props for the GraphVisualization component */
export interface GraphVisualizationProps {
  nodes: GraphNode[];
  edges?: GraphEdge[];
  layout: GraphLayoutOptions;
  height?: number;

  // Interaction callbacks
  onNodeClick?: (node: GraphNode) => void;
  onNodeHover?: (node: GraphNode | null) => void;
  onEdgeClick?: (edge: GraphEdge) => void;

  // Selection state
  selectedNodeId?: string;
  highlightedNodeId?: string;

  // Customization
  showLabels?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  legendTypes?: string[];
  centerLabel?: ReactNode;

  // Custom node renderer (optional)
  renderNode?: (node: GraphNode, position: { x: number; y: number }, isHovered: boolean, isSelected: boolean) => ReactNode;
}

// ========== INTERNAL POSITION TYPE ==========

interface NodePosition {
  x: number;
  y: number;
  id: string;
}

// ========== COMPONENT ==========

export function GraphVisualization({
  nodes,
  edges = [],
  layout,
  height = 300,
  onNodeClick,
  onNodeHover,
  onEdgeClick,
  selectedNodeId,
  highlightedNodeId,
  showLabels = false,
  showGrid = false,
  showLegend = false,
  legendTypes,
  centerLabel,
  renderNode,
}: GraphVisualizationProps) {
  const { colors, surfaceClasses, tooltipClasses, getEntityColor, isRadar } = useVisualizationTheme();
  const [containerRef, dimensions] = useContainerDimensions();
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Calculate positions based on layout strategy
  const positions = useGraphLayout(nodes, edges, layout, dimensions, height);

  // Node radius calculation
  const getNodeRadius = useCallback((node: GraphNode) => {
    const baseSize = 8;
    const maxSize = 20;
    return baseSize + (node.value ?? 0.5) * (maxSize - baseSize);
  }, []);

  // Get node color
  const getNodeColor = useCallback((node: GraphNode) => {
    if (node.color) return node.color;
    if (node.type) return getEntityColor(node.type);
    return colors.primary;
  }, [colors.primary, getEntityColor]);

  // Handle hover
  const handleNodeHover = useCallback((node: GraphNode | null) => {
    setHoveredNodeId(node?.id ?? null);
    onNodeHover?.(node);
  }, [onNodeHover]);

  // Determine legend types to show
  const legendItems = useMemo(() => {
    if (!showLegend) return [];
    if (legendTypes) return legendTypes;
    const types = new Set(nodes.map(n => n.type).filter(Boolean));
    return Array.from(types) as string[];
  }, [showLegend, legendTypes, nodes]);

  return (
    <div
      ref={containerRef}
      className={`relative rounded-xl overflow-hidden ${surfaceClasses}`}
      style={{ height }}
    >
      {/* Grid pattern */}
      {showGrid && (
        <svg className="absolute inset-0 w-full h-full opacity-10">
          <defs>
            <pattern id="graph-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke={colors.primary} strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#graph-grid)" />
        </svg>
      )}

      {/* Concentric rings for concentric layout */}
      {layout.strategy === 'concentric' && (
        <svg className="absolute inset-0" width={dimensions.width} height={height}>
          {[0.8, 0.5, 0.2].map((level) => (
            <circle
              key={level}
              cx={dimensions.width / 2}
              cy={height / 2}
              r={Math.min(dimensions.width, height) * 0.4 * (1 - level * 0.8)}
              fill="none"
              stroke={colors.gridLine}
              strokeDasharray="4 4"
            />
          ))}
        </svg>
      )}

      {/* Edges */}
      <svg className="absolute inset-0 w-full h-full">
        {edges.map((edge, i) => {
          const fromPos = positions.find(p => p.id === edge.source);
          const toPos = positions.find(p => p.id === edge.target);
          if (!fromPos || !toPos) return null;

          const isHighlighted = hoveredNodeId === edge.source || hoveredNodeId === edge.target;
          const strokeDasharray = edge.type === 'dashed' ? '4,4' : edge.type === 'dotted' ? '2,2' : undefined;

          return (
            <motion.line
              key={`${edge.source}-${edge.target}-${i}`}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: isHighlighted ? 0.8 : 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.02 }}
              x1={fromPos.x}
              y1={fromPos.y}
              x2={toPos.x}
              y2={toPos.y}
              stroke={colors.connectionLine}
              strokeWidth={isHighlighted ? 2 : 1}
              strokeDasharray={strokeDasharray}
              className={onEdgeClick ? 'cursor-pointer' : undefined}
              onClick={() => onEdgeClick?.(edge)}
            />
          );
        })}
      </svg>

      {/* Nodes */}
      {positions.map((pos, i) => {
        const node = nodes.find(n => n.id === pos.id);
        if (!node) return null;

        const isHovered = hoveredNodeId === node.id;
        const isSelected = selectedNodeId === node.id;
        const isHighlighted = highlightedNodeId === node.id;
        const radius = getNodeRadius(node);
        const color = getNodeColor(node);

        // Custom renderer
        if (renderNode) {
          return (
            <div
              key={node.id}
              className="absolute"
              style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)' }}
              onMouseEnter={() => handleNodeHover(node)}
              onMouseLeave={() => handleNodeHover(null)}
              onClick={() => onNodeClick?.(node)}
            >
              {renderNode(node, pos, isHovered, isSelected)}
            </div>
          );
        }

        // Default node rendering
        return (
          <motion.div
            key={node.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: isHovered || isSelected || isHighlighted ? 1.3 : 1,
              opacity: hoveredNodeId && hoveredNodeId !== node.id ? 0.4 : 1,
              x: pos.x - radius,
              y: pos.y - radius,
            }}
            transition={{ type: 'spring', damping: 20, delay: i * 0.02 }}
            className="absolute cursor-pointer"
            style={{ width: radius * 2, height: radius * 2 }}
            onMouseEnter={() => handleNodeHover(node)}
            onMouseLeave={() => handleNodeHover(null)}
            onClick={() => onNodeClick?.(node)}
          >
            <div
              className="w-full h-full rounded-full flex items-center justify-center transition-shadow"
              style={{
                backgroundColor: color,
                boxShadow: isHovered || isSelected || isHighlighted
                  ? `0 0 20px ${color}`
                  : `0 0 8px ${color}50`,
                border: isSelected ? `2px solid ${isRadar ? '#fff' : '#000'}` : undefined,
              }}
            />

            {/* Label on hover or always if showLabels */}
            <AnimatePresence>
              {(showLabels || isHovered) && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className={`absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded text-[10px] font-medium ${tooltipClasses}`}
                >
                  {node.label}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {/* Center label */}
      {centerLabel && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none"
          style={{ color: isRadar ? colors.primaryMuted : colors.textMuted }}
        >
          {centerLabel}
        </div>
      )}

      {/* Legend */}
      {showLegend && legendItems.length > 0 && (
        <div className={`absolute top-3 right-3 p-2 rounded-lg text-[10px] space-y-1 ${surfaceClasses}`}>
          {legendItems.map(type => (
            <div key={type} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getEntityColor(type) }} />
              <span style={{ color: colors.textSecondary, textTransform: 'capitalize' }}>{type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ========== LAYOUT HOOK ==========

function useGraphLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  layout: GraphLayoutOptions,
  dimensions: { width: number; height: number },
  height: number
): NodePosition[] {
  // Convert to layout node format
  const layoutNodes = useMemo(() =>
    nodes.map(n => ({
      id: n.id,
      x: 0,
      y: 0,
      value: n.value ?? 0.5,
      type: n.type,
    })),
    [nodes]
  );

  const layoutEdges: LayoutEdge[] = useMemo(() =>
    edges.map(e => ({
      source: e.source,
      target: e.target,
      strength: e.strength ?? 0.5,
    })),
    [edges]
  );

  // Force-directed layout
  const forcePositions = useForceLayout(
    layout.strategy === 'force-directed' ? layoutNodes : [],
    layout.strategy === 'force-directed' ? layoutEdges : [],
    dimensions,
    layout.strategy === 'force-directed' ? (layout.options ?? {}) : {}
  );

  // Concentric layout
  const concentricNodes = useConcentricLayoutNodes(
    layout.strategy === 'concentric' ? layoutNodes : [],
    { width: dimensions.width, height },
    layout.strategy === 'concentric' ? (layout.options ?? {}) : {}
  );

  // Radial layout (custom implementation for orbital/constellation)
  const radialPositions = useMemo(() => {
    if (layout.strategy !== 'radial') return [];

    const opts = layout.options ?? {};
    const groupBy = opts.groupBy ?? 'type';
    const orbitSpacing = opts.orbitSpacing ?? 60;
    const startAngle = opts.startAngle ?? 0;

    const centerX = dimensions.width / 2;
    const centerY = height / 2;

    // Group nodes by specified property
    const groups: Record<string, GraphNode[]> = {};
    nodes.forEach(n => {
      let key = 'default';
      if (groupBy === 'type' && n.type) {
        key = n.type;
      } else if (groupBy === 'id') {
        key = n.id;
      } else if (n.data && groupBy in n.data) {
        key = String(n.data[groupBy]);
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(n);
    });

    const result: NodePosition[] = [];
    const groupKeys = Object.keys(groups);

    groupKeys.forEach((key, groupIdx) => {
      const orbit = 50 + groupIdx * orbitSpacing;
      const items = groups[key];

      items.forEach((node, i) => {
        const angle = startAngle + (i / items.length) * Math.PI * 2 + groupIdx * 0.5;
        const jitter = Math.random() * 20 - 10;

        result.push({
          id: node.id,
          x: centerX + Math.cos(angle) * (orbit + jitter),
          y: centerY + Math.sin(angle) * (orbit + jitter),
        });
      });
    });

    return result;
  }, [layout, nodes, dimensions.width, height]);

  // Grid layout
  const gridPositions = useMemo(() => {
    if (layout.strategy !== 'grid') return [];

    const columns = (layout.options as { columns?: number })?.columns ?? Math.ceil(Math.sqrt(nodes.length));
    const cellWidth = dimensions.width / columns;
    const cellHeight = height / Math.ceil(nodes.length / columns);

    return nodes.map((node, i) => ({
      id: node.id,
      x: (i % columns) * cellWidth + cellWidth / 2,
      y: Math.floor(i / columns) * cellHeight + cellHeight / 2,
    }));
  }, [layout, nodes, dimensions.width, height]);

  // Tree layout (simplified horizontal tree)
  const treePositions = useMemo(() => {
    if (layout.strategy !== 'tree') return [];

    // Build adjacency for depth calculation
    const children: Record<string, string[]> = {};
    const hasParent = new Set<string>();

    edges.forEach(e => {
      if (!children[e.source]) children[e.source] = [];
      children[e.source].push(e.target);
      hasParent.add(e.target);
    });

    // Find roots
    const roots = nodes.filter(n => !hasParent.has(n.id));

    const result: NodePosition[] = [];
    const levelWidth = dimensions.width / (Object.keys(children).length + 1);

    const traverse = (nodeId: string, level: number, yOffset: number, yRange: number) => {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;

      const x = levelWidth * (level + 1);
      const y = yOffset + yRange / 2;

      result.push({ id: nodeId, x, y });

      const nodeChildren = children[nodeId] || [];
      const childRange = yRange / Math.max(nodeChildren.length, 1);

      nodeChildren.forEach((childId, i) => {
        traverse(childId, level + 1, yOffset + i * childRange, childRange);
      });
    };

    const rootRange = height / Math.max(roots.length, 1);
    roots.forEach((root, i) => {
      traverse(root.id, 0, i * rootRange, rootRange);
    });

    return result;
  }, [layout, nodes, edges, dimensions.width, height]);

  // Return appropriate positions based on strategy
  return useMemo(() => {
    switch (layout.strategy) {
      case 'force-directed':
        return nodes.map(n => {
          const pos = forcePositions.get(n.id);
          return { id: n.id, x: pos?.x ?? 0, y: pos?.y ?? 0 };
        });
      case 'concentric':
        return concentricNodes.map(n => ({ id: n.id, x: n.x, y: n.y }));
      case 'radial':
        return radialPositions;
      case 'tree':
        return treePositions;
      case 'grid':
        return gridPositions;
      default:
        return [];
    }
  }, [layout.strategy, nodes, forcePositions, concentricNodes, radialPositions, treePositions, gridPositions]);
}
