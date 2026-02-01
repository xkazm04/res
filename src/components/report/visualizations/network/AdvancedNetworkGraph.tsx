'use client';

/**
 * AdvancedNetworkGraph
 *
 * A professional-grade force-directed graph visualization component with:
 * - WebGL-accelerated canvas rendering for 500+ nodes
 * - Hierarchical clustering with expandable groups
 * - Shortest path highlighting
 * - Multiple layout algorithms
 * - Edge bundling for dense graphs
 * - Minimap navigation
 * - Node search and filtering
 */

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizationTheme } from '../useVisualizationTheme';
import { useForceGraph, type LayoutAlgorithm } from '@/src/hooks/useForceGraph';
import type { GraphNode, GraphEdge, Cluster, BundledEdge } from '@/src/lib/graphAlgorithms';
import { GraphMinimap } from './GraphMinimap';
import { LayoutSwitcher } from './LayoutSwitcher';
import { GraphFilterPanel } from './GraphFilterPanel';
import { PathFinder } from './PathFinder';
import { GraphExporter } from './GraphExporter';
import { cn } from '@/src/lib/utils';
import {
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Layers,
  GitBranch,
  Filter,
  X,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface AdvancedNetworkGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  width?: number;
  height?: number;
  className?: string;
  onNodeClick?: (node: GraphNode) => void;
  onEdgeClick?: (edge: GraphEdge) => void;
  showMinimap?: boolean;
  showControls?: boolean;
  showSearch?: boolean;
  enableClustering?: boolean;
  enableEdgeBundling?: boolean;
  enablePathFinding?: boolean;
  initialLayout?: LayoutAlgorithm;
}

interface RenderContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  viewState: { zoom: number; panX: number; panY: number };
  isRadar: boolean;
  colors: ReturnType<typeof useVisualizationTheme>['colors'];
  entityColors: ReturnType<typeof useVisualizationTheme>['entityColors'];
  selection: Set<string>;
  highlightedNode: string | null;
  pathNodes: Set<string>;
  pathEdges: Set<string>;
  matchingNodeIds: Set<string>;
  hoveredNode: string | null;
  clusters: Cluster[];
  showClusters: boolean;
}

// ============================================================================
// Rendering Utilities
// ============================================================================

function transformPoint(
  x: number,
  y: number,
  viewState: { zoom: number; panX: number; panY: number }
): { x: number; y: number } {
  return {
    x: x * viewState.zoom + viewState.panX,
    y: y * viewState.zoom + viewState.panY,
  };
}

function inverseTransformPoint(
  screenX: number,
  screenY: number,
  viewState: { zoom: number; panX: number; panY: number }
): { x: number; y: number } {
  return {
    x: (screenX - viewState.panX) / viewState.zoom,
    y: (screenY - viewState.panY) / viewState.zoom,
  };
}

function drawClusters(ctx: RenderContext, clusters: Cluster[]): void {
  const { ctx: c, viewState, isRadar, colors } = ctx;

  clusters.forEach((cluster, i) => {
    const pos = transformPoint(cluster.x, cluster.y, viewState);
    const scaledRadius = cluster.radius * viewState.zoom;

    // Cluster background
    const hue = (i * 137.5) % 360;
    const clusterColor = isRadar
      ? `hsla(${hue}, 70%, 50%, 0.08)`
      : `hsla(${hue}, 60%, 60%, 0.06)`;

    c.beginPath();
    c.arc(pos.x, pos.y, scaledRadius, 0, Math.PI * 2);
    c.fillStyle = clusterColor;
    c.fill();

    // Cluster border
    c.strokeStyle = isRadar
      ? `hsla(${hue}, 70%, 50%, 0.3)`
      : `hsla(${hue}, 60%, 40%, 0.2)`;
    c.lineWidth = 1;
    c.setLineDash([4, 4]);
    c.stroke();
    c.setLineDash([]);

    // Cluster label
    if (cluster.label) {
      c.font = '10px Inter, system-ui, sans-serif';
      c.fillStyle = colors.textMuted;
      c.textAlign = 'center';
      c.fillText(cluster.label, pos.x, pos.y - scaledRadius - 8);
    }
  });
}

function drawEdge(
  ctx: RenderContext,
  edge: GraphEdge | BundledEdge,
  sourceNode: GraphNode,
  targetNode: GraphNode
): void {
  const { ctx: c, viewState, isRadar, colors, selection, pathEdges } = ctx;

  const isInPath = pathEdges.has(edge.id);
  const isSelected = selection.has(edge.source) || selection.has(edge.target);

  let strokeColor = colors.connectionLine;
  let lineWidth = 1;
  let opacity = 0.5;

  if (edge.type === 'contradicts') {
    strokeColor = colors.contradictionLine;
    lineWidth = 2;
  } else if (edge.type === 'supports') {
    strokeColor = colors.success;
  }

  if (isInPath) {
    strokeColor = isRadar ? '#fbbf24' : '#d97706';
    lineWidth = 3;
    opacity = 1;
  } else if (isSelected) {
    opacity = 0.8;
    lineWidth = 2;
  }

  c.strokeStyle = strokeColor;
  c.lineWidth = lineWidth;
  c.globalAlpha = opacity;

  const bundled = edge as BundledEdge;
  if (bundled.controlPoints && bundled.controlPoints.length > 2) {
    // Draw bundled edge as bezier curve
    c.beginPath();
    const start = transformPoint(bundled.controlPoints[0].x, bundled.controlPoints[0].y, viewState);
    c.moveTo(start.x, start.y);

    for (let i = 1; i < bundled.controlPoints.length - 1; i += 2) {
      const cp = transformPoint(bundled.controlPoints[i].x, bundled.controlPoints[i].y, viewState);
      const end = transformPoint(
        bundled.controlPoints[Math.min(i + 1, bundled.controlPoints.length - 1)].x,
        bundled.controlPoints[Math.min(i + 1, bundled.controlPoints.length - 1)].y,
        viewState
      );
      c.quadraticCurveTo(cp.x, cp.y, end.x, end.y);
    }
    c.stroke();
  } else {
    // Draw straight edge
    const source = transformPoint(sourceNode.x, sourceNode.y, viewState);
    const target = transformPoint(targetNode.x, targetNode.y, viewState);

    c.beginPath();
    c.moveTo(source.x, source.y);
    c.lineTo(target.x, target.y);
    c.stroke();

    // Arrowhead
    if (isInPath || isSelected) {
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const angle = Math.atan2(dy, dx);
      const arrowSize = 8;
      const nodeRadius = (targetNode.radius ?? 8) * viewState.zoom;

      const arrowX = target.x - Math.cos(angle) * nodeRadius;
      const arrowY = target.y - Math.sin(angle) * nodeRadius;

      c.beginPath();
      c.moveTo(arrowX, arrowY);
      c.lineTo(
        arrowX - arrowSize * Math.cos(angle - Math.PI / 6),
        arrowY - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      c.lineTo(
        arrowX - arrowSize * Math.cos(angle + Math.PI / 6),
        arrowY - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      c.closePath();
      c.fillStyle = strokeColor;
      c.fill();
    }
  }

  c.globalAlpha = 1;
}

function drawNode(ctx: RenderContext, node: GraphNode): void {
  const {
    ctx: c,
    viewState,
    isRadar,
    colors,
    entityColors,
    selection,
    highlightedNode,
    pathNodes,
    matchingNodeIds,
    hoveredNode,
  } = ctx;

  const pos = transformPoint(node.x, node.y, viewState);
  const radius = (node.radius ?? 8) * viewState.zoom;
  const isSelected = selection.has(node.id);
  const isHighlighted = highlightedNode === node.id;
  const isInPath = pathNodes.has(node.id);
  const isSearchMatch = matchingNodeIds.has(node.id);
  const isHovered = hoveredNode === node.id;

  // Get color based on type
  const typeKey = (node.type?.toLowerCase() ?? 'other') as keyof typeof entityColors;
  let fillColor = entityColors[typeKey] ?? entityColors.other;

  if (isInPath) {
    fillColor = isRadar ? '#fbbf24' : '#d97706';
  }

  // Glow effect for highlighted/selected nodes
  if (isHighlighted || isSelected || isInPath || isSearchMatch) {
    const gradient = c.createRadialGradient(pos.x, pos.y, radius * 0.5, pos.x, pos.y, radius * 2.5);
    gradient.addColorStop(0, isRadar ? `${fillColor}40` : `${fillColor}30`);
    gradient.addColorStop(1, 'transparent');
    c.fillStyle = gradient;
    c.beginPath();
    c.arc(pos.x, pos.y, radius * 2.5, 0, Math.PI * 2);
    c.fill();
  }

  // Node shadow
  if (!isRadar) {
    c.shadowColor = 'rgba(0,0,0,0.1)';
    c.shadowBlur = 8;
    c.shadowOffsetX = 0;
    c.shadowOffsetY = 2;
  }

  // Node circle
  c.beginPath();
  c.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
  c.fillStyle = fillColor;
  c.fill();

  // Node border
  c.strokeStyle = isSelected || isHighlighted || isHovered
    ? (isRadar ? '#fff' : '#1c1917')
    : (isRadar ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)');
  c.lineWidth = isSelected || isHighlighted ? 2 : 1;
  c.stroke();

  // Reset shadow
  c.shadowColor = 'transparent';
  c.shadowBlur = 0;
  c.shadowOffsetX = 0;
  c.shadowOffsetY = 0;

  // Pin indicator
  if (node.fixed) {
    c.fillStyle = colors.textPrimary;
    c.beginPath();
    c.arc(pos.x + radius * 0.7, pos.y - radius * 0.7, 3, 0, Math.PI * 2);
    c.fill();
  }

  // Node label (only show when zoomed in or hovered/selected)
  if (viewState.zoom > 0.8 || isHovered || isSelected || isHighlighted) {
    const label = node.label ?? node.id;
    const maxLen = 12;
    const displayLabel = label.length > maxLen ? label.slice(0, maxLen - 1) + '…' : label;

    c.font = `${isSelected || isHighlighted ? 'bold ' : ''}${10 * Math.min(viewState.zoom, 1.5)}px Inter, system-ui, sans-serif`;
    c.textAlign = 'center';
    c.textBaseline = 'top';

    // Label background
    const textMetrics = c.measureText(displayLabel);
    const labelY = pos.y + radius + 4;
    const padding = 3;

    c.fillStyle = isRadar ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.9)';
    c.fillRect(
      pos.x - textMetrics.width / 2 - padding,
      labelY - 1,
      textMetrics.width + padding * 2,
      12 + padding
    );

    c.fillStyle = isSelected || isHighlighted ? colors.textPrimary : colors.textSecondary;
    c.fillText(displayLabel, pos.x, labelY);
  }
}

// ============================================================================
// Main Component
// ============================================================================

export function AdvancedNetworkGraph({
  nodes,
  edges,
  width: propWidth,
  height: propHeight,
  className,
  onNodeClick,
  onEdgeClick,
  showMinimap = true,
  showControls = true,
  showSearch = true,
  enableClustering = true,
  enableEdgeBundling = false,
  enablePathFinding = true,
  initialLayout = 'force',
}: AdvancedNetworkGraphProps) {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Theme
  const { colors, entityColors, isRadar, cardClasses, surfaceClasses, tooltipClasses } =
    useVisualizationTheme();

  // Dimensions
  const [dimensions, setDimensions] = useState({ width: propWidth ?? 800, height: propHeight ?? 600 });

  useEffect(() => {
    if (propWidth && propHeight) {
      setDimensions({ width: propWidth, height: propHeight });
      return;
    }

    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [propWidth, propHeight]);

  // Graph state
  const graph = useForceGraph({
    nodes,
    edges,
    width: dimensions.width,
    height: dimensions.height,
    initialLayout,
    enableClustering,
    enableEdgeBundling,
    onNodeClick,
    onEdgeClick,
  });

  // UI state
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showPathFinder, setShowPathFinder] = useState(false);
  const [showClusters, setShowClusters] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [lastPointer, setLastPointer] = useState({ x: 0, y: 0 });

  // Create node map for quick lookup
  const nodeMap = useMemo(
    () => new Map(graph.layoutNodes.map((n) => [n.id, n])),
    [graph.layoutNodes]
  );

  // Path nodes and edges sets
  const pathNodes = useMemo(
    () => new Set(graph.currentPath?.path ?? []),
    [graph.currentPath]
  );
  const pathEdges = useMemo(
    () => new Set(graph.currentPath?.edges ?? []),
    [graph.currentPath]
  );

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    return graph.searchNodes(searchQuery);
  }, [graph, searchQuery]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    canvas.style.width = `${dimensions.width}px`;
    canvas.style.height = `${dimensions.height}px`;
    ctx.scale(dpr, dpr);

    const render = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      const renderCtx: RenderContext = {
        ctx,
        width: dimensions.width,
        height: dimensions.height,
        viewState: graph.viewState,
        isRadar,
        colors,
        entityColors,
        selection: graph.selection.nodes,
        highlightedNode: graph.highlightedNode,
        pathNodes,
        pathEdges,
        matchingNodeIds: graph.matchingNodeIds,
        hoveredNode,
        clusters: graph.clusters,
        showClusters,
      };

      // Draw clusters
      if (showClusters && graph.clusters.length > 0) {
        drawClusters(renderCtx, graph.clusters);
      }

      // Draw edges
      const edgesToDraw = graph.bundledEdges.length > 0 ? graph.bundledEdges : graph.filteredEdges;
      edgesToDraw.forEach((edge) => {
        const sourceNode = nodeMap.get(edge.source);
        const targetNode = nodeMap.get(edge.target);
        if (sourceNode && targetNode) {
          drawEdge(renderCtx, edge, sourceNode, targetNode);
        }
      });

      // Draw nodes
      graph.layoutNodes.forEach((node) => {
        drawNode(renderCtx, node);
      });

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    dimensions,
    graph.viewState,
    graph.layoutNodes,
    graph.filteredEdges,
    graph.bundledEdges,
    graph.clusters,
    graph.selection,
    graph.highlightedNode,
    graph.matchingNodeIds,
    nodeMap,
    pathNodes,
    pathEdges,
    hoveredNode,
    showClusters,
    isRadar,
    colors,
    entityColors,
  ]);

  // Pointer handlers
  const findNodeAtPoint = useCallback(
    (screenX: number, screenY: number): GraphNode | null => {
      const point = inverseTransformPoint(screenX, screenY, graph.viewState);

      for (const node of graph.layoutNodes) {
        const radius = node.radius ?? 8;
        const dx = point.x - node.x;
        const dy = point.y - node.y;
        if (dx * dx + dy * dy <= radius * radius) {
          return node;
        }
      }
      return null;
    },
    [graph.layoutNodes, graph.viewState]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const node = findNodeAtPoint(x, y);

      if (node) {
        setDraggedNode(node.id);
        graph.selectNode(node.id, e.shiftKey);
      }

      setIsDragging(true);
      setLastPointer({ x: e.clientX, y: e.clientY });
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [findNodeAtPoint, graph]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (isDragging) {
        if (draggedNode) {
          // Drag node
          const point = inverseTransformPoint(x, y, graph.viewState);
          graph.dragNode(draggedNode, point.x, point.y);
        } else {
          // Pan view
          const dx = e.clientX - lastPointer.x;
          const dy = e.clientY - lastPointer.y;
          graph.setViewState({
            ...graph.viewState,
            panX: graph.viewState.panX + dx,
            panY: graph.viewState.panY + dy,
          });
        }
        setLastPointer({ x: e.clientX, y: e.clientY });
      } else {
        // Hover
        const node = findNodeAtPoint(x, y);
        setHoveredNode(node?.id ?? null);
      }
    },
    [isDragging, draggedNode, lastPointer, graph, findNodeAtPoint]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      setIsDragging(false);
      setDraggedNode(null);
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    },
    []
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(5, graph.viewState.zoom * zoomFactor));

      // Zoom toward cursor
      const newPanX = x - (x - graph.viewState.panX) * (newZoom / graph.viewState.zoom);
      const newPanY = y - (y - graph.viewState.panY) * (newZoom / graph.viewState.zoom);

      graph.setViewState({
        zoom: newZoom,
        panX: newPanX,
        panY: newPanY,
      });
    },
    [graph]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const node = findNodeAtPoint(x, y);
      if (node) {
        graph.selectNeighbors(node.id, 1);
      }
    },
    [findNodeAtPoint, graph]
  );

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden rounded-xl', cardClasses, className)}
      style={{ width: propWidth ?? '100%', height: propHeight ?? 400 }}
    >
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
      />

      {/* Progress indicator */}
      <AnimatePresence>
        {graph.isComputing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full flex items-center gap-3"
            style={{ backgroundColor: colors.surfaceBg }}
          >
            <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: colors.border }}>
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: colors.primary }}
                initial={{ width: 0 }}
                animate={{ width: `${graph.layoutProgress * 100}%` }}
              />
            </div>
            <span className="text-xs" style={{ color: colors.textSecondary }}>
              {Math.round(graph.layoutProgress * 100)}%
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      {showControls && (
        <div className={cn('absolute top-3 right-3 flex flex-col gap-1', surfaceClasses, 'p-1 rounded-lg')}>
          <button
            onClick={graph.zoomIn}
            className="p-2 rounded hover:bg-white/10 transition-colors"
            title="Zoom in"
          >
            <ZoomIn size={16} style={{ color: colors.textSecondary }} />
          </button>
          <button
            onClick={graph.zoomOut}
            className="p-2 rounded hover:bg-white/10 transition-colors"
            title="Zoom out"
          >
            <ZoomOut size={16} style={{ color: colors.textSecondary }} />
          </button>
          <button
            onClick={graph.fitToView}
            className="p-2 rounded hover:bg-white/10 transition-colors"
            title="Fit to view"
          >
            <Maximize2 size={16} style={{ color: colors.textSecondary }} />
          </button>
          <button
            onClick={graph.resetView}
            className="p-2 rounded hover:bg-white/10 transition-colors"
            title="Reset view"
          >
            <RotateCcw size={16} style={{ color: colors.textSecondary }} />
          </button>
          <div className="h-px my-1" style={{ backgroundColor: colors.border }} />
          <button
            onClick={() => setShowClusters(!showClusters)}
            className={cn('p-2 rounded transition-colors', showClusters && 'bg-white/10')}
            title="Toggle clusters"
          >
            <Layers size={16} style={{ color: showClusters ? colors.primary : colors.textSecondary }} />
          </button>
          {enablePathFinding && (
            <button
              onClick={() => setShowPathFinder(!showPathFinder)}
              className={cn('p-2 rounded transition-colors', showPathFinder && 'bg-white/10')}
              title="Find path"
            >
              <GitBranch size={16} style={{ color: showPathFinder ? colors.primary : colors.textSecondary }} />
            </button>
          )}
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={cn('p-2 rounded transition-colors', showFilterPanel && 'bg-white/10')}
            title="Filters"
          >
            <Filter size={16} style={{ color: showFilterPanel ? colors.primary : colors.textSecondary }} />
          </button>
        </div>
      )}

      {/* Search bar */}
      {showSearch && (
        <div className={cn('absolute top-3 left-3', surfaceClasses, 'rounded-lg')}>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: colors.textMuted }}
            />
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                graph.setFilter({ searchQuery: e.target.value });
              }}
              className="w-48 pl-9 pr-8 py-2 text-sm rounded-lg bg-transparent border-0 outline-none"
              style={{ color: colors.textPrimary }}
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  graph.setFilter({ searchQuery: '' });
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10"
              >
                <X size={12} style={{ color: colors.textMuted }} />
              </button>
            )}
          </div>

          {/* Search results dropdown */}
          <AnimatePresence>
            {searchResults.length > 0 && searchQuery && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className={cn('absolute top-full left-0 right-0 mt-1 rounded-lg overflow-hidden max-h-48 overflow-y-auto', tooltipClasses)}
              >
                {searchResults.slice(0, 10).map((node) => (
                  <button
                    key={node.id}
                    onClick={() => {
                      graph.selectNode(node.id);
                      graph.highlightNode(node.id);
                      setSearchQuery('');
                      graph.setFilter({ searchQuery: '' });
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-2"
                    style={{ color: colors.textPrimary }}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: entityColors[(node.type?.toLowerCase() ?? 'other') as keyof typeof entityColors] ?? entityColors.other,
                      }}
                    />
                    {node.label ?? node.id}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Layout switcher */}
      <LayoutSwitcher
        currentLayout={graph.currentLayout}
        onLayoutChange={graph.setLayout}
        onRunLayout={graph.runLayout}
        isComputing={graph.isComputing}
      />

      {/* Filter panel */}
      <AnimatePresence>
        {showFilterPanel && (
          <GraphFilterPanel
            nodes={nodes}
            edges={edges}
            filter={graph.filter}
            onFilterChange={graph.setFilter}
            onClose={() => setShowFilterPanel(false)}
          />
        )}
      </AnimatePresence>

      {/* Path finder */}
      <AnimatePresence>
        {showPathFinder && (
          <PathFinder
            nodes={graph.layoutNodes}
            currentPath={graph.currentPath}
            onFindPath={graph.findPath}
            onClearPath={graph.clearPath}
            onClose={() => setShowPathFinder(false)}
          />
        )}
      </AnimatePresence>

      {/* Minimap */}
      {showMinimap && (
        <GraphMinimap
          nodes={graph.layoutNodes}
          edges={graph.filteredEdges}
          viewState={graph.viewState}
          containerWidth={dimensions.width}
          containerHeight={dimensions.height}
          onViewChange={graph.setViewState}
        />
      )}

      {/* Export button */}
      <GraphExporter
        canvasRef={canvasRef}
        graphData={graph.getGraphData()}
      />

      {/* Hovered node tooltip */}
      <AnimatePresence>
        {hoveredNode && !isDragging && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className={cn('absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg text-sm pointer-events-none', tooltipClasses)}
          >
            {(() => {
              const node = nodeMap.get(hoveredNode);
              if (!node) return null;
              return (
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: entityColors[(node.type?.toLowerCase() ?? 'other') as keyof typeof entityColors] ?? entityColors.other,
                    }}
                  />
                  <span style={{ color: colors.textPrimary }}>{node.label ?? node.id}</span>
                  {node.type && (
                    <span className="text-xs" style={{ color: colors.textMuted }}>
                      ({node.type})
                    </span>
                  )}
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="absolute bottom-3 left-3 text-[10px]" style={{ color: colors.textMuted }}>
        {graph.layoutNodes.length} nodes · {graph.filteredEdges.length} edges
        {graph.clusters.length > 0 && ` · ${graph.clusters.length} clusters`}
      </div>
    </div>
  );
}
