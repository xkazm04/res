'use client';

/**
 * EditableCausalChain
 *
 * Interactive causal chain visualization with drag-and-drop editing,
 * node selection, and visual feedback for modifications.
 */

import { useRef, useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { useVisualizationTheme } from '../useVisualizationTheme';
import {
  type CausalChain,
  type CausalNode,
  type CausalEdge,
  type PropagationResult,
  generateEdgePath,
  calculateArrowHead,
} from '@/src/lib/causalLayout';
import { cn } from '@/src/lib/utils';
import { Plus, Trash2, Link2, Unlink, GripVertical } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface EditableCausalChainProps {
  chain: CausalChain;
  width: number;
  height: number;
  nodeWidth?: number;
  nodeHeight?: number;
  editMode: boolean;
  selectedNodeId?: string | null;
  selectedEdgeId?: string | null;
  highlightedPath?: string[];
  propagations?: PropagationResult[];
  onNodeSelect?: (nodeId: string | null) => void;
  onEdgeSelect?: (edgeId: string | null) => void;
  onNodeMove?: (nodeId: string, x: number, y: number) => void;
  onNodeUpdate?: (nodeId: string, updates: Partial<CausalNode>) => void;
  onNodeRemove?: (nodeId: string) => void;
  onEdgeAdd?: (source: string, target: string) => void;
  onEdgeRemove?: (edgeId: string) => void;
  onAddNode?: () => void;
  className?: string;
}

// ============================================================================
// Draggable Node Component
// ============================================================================

interface DraggableNodeProps {
  node: CausalNode;
  nodeWidth: number;
  nodeHeight: number;
  isSelected: boolean;
  isHighlighted: boolean;
  isDimmed: boolean;
  propagation?: PropagationResult;
  editMode: boolean;
  colors: ReturnType<typeof useVisualizationTheme>['colors'];
  getConfidenceColor: (value: number) => string;
  isRadar: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
  onRemove: () => void;
  onStartEdge: () => void;
  isLinkingSource: boolean;
  isLinkingTarget: boolean;
}

function DraggableNode({
  node,
  nodeWidth,
  nodeHeight,
  isSelected,
  isHighlighted,
  isDimmed,
  propagation,
  editMode,
  colors,
  getConfidenceColor,
  isRadar,
  onSelect,
  onMove,
  onRemove,
  onStartEdge,
  isLinkingSource,
  isLinkingTarget,
}: DraggableNodeProps) {
  const dragControls = useDragControls();
  const nodeRef = useRef<HTMLDivElement>(null);

  // Get node color based on type
  const getNodeColor = (type: CausalNode['type']): string => {
    switch (type) {
      case 'cause':
        return colors.primary;
      case 'effect':
        return colors.success;
      case 'mediator':
        return colors.secondary;
      case 'moderator':
        return colors.warning;
      default:
        return colors.textMuted;
    }
  };

  const nodeColor = getNodeColor(node.type);
  const confidenceColor = getConfidenceColor(node.confidence);

  // Propagation indicator
  const propagationColor =
    propagation?.direction === 'increase'
      ? colors.success
      : propagation?.direction === 'decrease'
        ? colors.danger
        : undefined;

  return (
    <motion.div
      ref={nodeRef}
      drag={editMode}
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0}
      onDragEnd={(_, info) => {
        const x = (node.x || 0) + info.offset.x;
        const y = (node.y || 0) + info.offset.y;
        onMove(x, y);
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: isDimmed ? 0.3 : 1,
        scale: isSelected ? 1.05 : 1,
        x: node.x,
        y: node.y,
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={cn(
        'absolute rounded-xl cursor-pointer select-none',
        isSelected && 'ring-2 ring-offset-2',
        isLinkingTarget && 'ring-2 ring-dashed',
        editMode && 'hover:shadow-lg'
      )}
      style={{
        width: nodeWidth,
        height: nodeHeight,
        backgroundColor: colors.cardBg,
        border: `2px solid ${isSelected ? nodeColor : colors.border}`,
        boxShadow:
          isHighlighted || isSelected
            ? `0 0 20px ${nodeColor}40`
            : undefined,
        '--tw-ring-color': isLinkingTarget ? colors.success : nodeColor,
        '--tw-ring-offset-color': colors.cardBg,
      } as React.CSSProperties}
    >
      {/* Drag handle */}
      {editMode && (
        <div
          className="absolute -left-6 top-1/2 -translate-y-1/2 p-1 rounded cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => dragControls.start(e)}
          style={{ color: colors.textMuted }}
        >
          <GripVertical size={14} />
        </div>
      )}

      {/* Confidence bar */}
      <div
        className="absolute left-0 top-0 h-full rounded-l-xl"
        style={{
          width: 4,
          backgroundColor: confidenceColor,
        }}
      />

      {/* Propagation indicator */}
      {propagation && propagationColor && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
          style={{
            backgroundColor: propagationColor,
            color: colors.textOnDark,
          }}
        >
          {propagation.direction === 'increase' ? '↑' : '↓'}
        </motion.div>
      )}

      {/* Content */}
      <div className="h-full flex flex-col justify-center px-3 py-2">
        {/* Type badge */}
        <span
          className="text-[9px] uppercase tracking-wider font-semibold"
          style={{ color: nodeColor }}
        >
          {node.type}
        </span>

        {/* Label */}
        <span
          className="text-xs font-medium truncate mt-0.5"
          style={{ color: colors.textPrimary }}
        >
          {node.label}
        </span>

        {/* Weight indicator */}
        <div className="flex items-center gap-1 mt-1">
          <div
            className="h-1 rounded-full flex-1"
            style={{ backgroundColor: colors.border }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${node.weight * 100}%`,
                backgroundColor: nodeColor,
              }}
            />
          </div>
          <span
            className="text-[9px]"
            style={{ color: colors.textMuted }}
          >
            {Math.round(node.weight * 100)}%
          </span>
        </div>
      </div>

      {/* Edit mode controls */}
      {editMode && isSelected && (
        <div
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1 rounded-lg"
          style={{ backgroundColor: colors.surfaceBg }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStartEdge();
            }}
            className="p-1 rounded hover:bg-white/10"
            title={isLinkingSource ? 'Cancel linking' : 'Create connection'}
          >
            {isLinkingSource ? (
              <Unlink size={12} style={{ color: colors.warning }} />
            ) : (
              <Link2 size={12} style={{ color: colors.textSecondary }} />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1 rounded hover:bg-white/10"
            title="Remove node"
          >
            <Trash2 size={12} style={{ color: colors.danger }} />
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function EditableCausalChain({
  chain,
  width,
  height,
  nodeWidth = 150,
  nodeHeight = 60,
  editMode,
  selectedNodeId,
  selectedEdgeId,
  highlightedPath = [],
  propagations = [],
  onNodeSelect,
  onEdgeSelect,
  onNodeMove,
  onNodeUpdate,
  onNodeRemove,
  onEdgeAdd,
  onEdgeRemove,
  onAddNode,
  className,
}: EditableCausalChainProps) {
  const { colors, isRadar, getConfidenceColor } = useVisualizationTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  // Linking state for creating new edges
  const [linkingSourceId, setLinkingSourceId] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Track mouse position during linking
  useEffect(() => {
    if (!linkingSourceId || !containerRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [linkingSourceId]);

  // Get propagation for a node
  const getPropagation = useCallback(
    (nodeId: string): PropagationResult | undefined => {
      return propagations.find((p) => p.nodeId === nodeId);
    },
    [propagations]
  );

  // Check if node is highlighted
  const isNodeHighlighted = useCallback(
    (nodeId: string): boolean => {
      return highlightedPath.includes(nodeId);
    },
    [highlightedPath]
  );

  // Check if edge is highlighted
  const isEdgeHighlighted = useCallback(
    (edge: CausalEdge): boolean => {
      const sourceIndex = highlightedPath.indexOf(edge.source);
      const targetIndex = highlightedPath.indexOf(edge.target);
      return (
        sourceIndex !== -1 &&
        targetIndex !== -1 &&
        Math.abs(sourceIndex - targetIndex) === 1
      );
    },
    [highlightedPath]
  );

  // Handle node selection for linking
  const handleNodeSelectForLinking = useCallback(
    (nodeId: string) => {
      if (linkingSourceId) {
        if (linkingSourceId !== nodeId) {
          // Create edge
          onEdgeAdd?.(linkingSourceId, nodeId);
        }
        setLinkingSourceId(null);
      } else {
        onNodeSelect?.(nodeId);
      }
    },
    [linkingSourceId, onEdgeAdd, onNodeSelect]
  );

  // Start linking from a node
  const handleStartLinking = useCallback((nodeId: string) => {
    setLinkingSourceId((prev) => (prev === nodeId ? null : nodeId));
  }, []);

  // Cancel linking
  const handleCancelLinking = useCallback(() => {
    setLinkingSourceId(null);
  }, []);

  // Click on background
  const handleBackgroundClick = useCallback(() => {
    if (linkingSourceId) {
      setLinkingSourceId(null);
    } else {
      onNodeSelect?.(null);
      onEdgeSelect?.(null);
    }
  }, [linkingSourceId, onNodeSelect, onEdgeSelect]);

  // Get edge color based on type
  const getEdgeColor = (edge: CausalEdge): string => {
    const highlighted = isEdgeHighlighted(edge);
    const selected = selectedEdgeId === edge.id;

    if (highlighted || selected) return colors.primary;

    switch (edge.type) {
      case 'direct':
        return colors.textSecondary;
      case 'indirect':
        return colors.textMuted;
      case 'bidirectional':
        return colors.secondary;
      case 'conditional':
        return colors.warning;
      default:
        return colors.textMuted;
    }
  };

  // Build node map for quick lookup
  const nodeMap = new Map(chain.nodes.map((n) => [n.id, n]));

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden rounded-xl', className)}
      style={{
        width,
        height,
        backgroundColor: colors.surfaceBg,
      }}
      onClick={handleBackgroundClick}
    >
      {/* SVG for edges */}
      <svg
        className="absolute inset-0 pointer-events-none"
        width={width}
        height={height}
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Arrow marker */}
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill={colors.textSecondary}
            />
          </marker>
          <marker
            id="arrowhead-highlighted"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill={colors.primary} />
          </marker>
        </defs>

        {/* Edges */}
        <g className="edges">
          <AnimatePresence>
            {chain.edges.map((edge) => {
              const sourceNode = nodeMap.get(edge.source);
              const targetNode = nodeMap.get(edge.target);
              if (!sourceNode || !targetNode) return null;

              const sourceX = (sourceNode.x || 0) + nodeWidth;
              const sourceY = (sourceNode.y || 0) + nodeHeight / 2;
              const targetX = targetNode.x || 0;
              const targetY = (targetNode.y || 0) + nodeHeight / 2;

              const path = generateEdgePath(sourceX, sourceY, targetX, targetY);
              const edgeColor = getEdgeColor(edge);
              const highlighted = isEdgeHighlighted(edge);
              const selected = selectedEdgeId === edge.id;
              const dimmed =
                (highlightedPath.length > 0 || selectedEdgeId) &&
                !highlighted &&
                !selected;

              return (
                <motion.g
                  key={edge.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: dimmed ? 0.2 : 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Edge path */}
                  <motion.path
                    d={path}
                    fill="none"
                    stroke={edgeColor}
                    strokeWidth={highlighted || selected ? 3 : 2}
                    strokeDasharray={edge.type === 'indirect' ? '5,5' : undefined}
                    markerEnd={
                      highlighted || selected
                        ? 'url(#arrowhead-highlighted)'
                        : 'url(#arrowhead)'
                    }
                    style={{
                      cursor: 'pointer',
                      pointerEvents: 'stroke',
                      filter:
                        highlighted || selected
                          ? `drop-shadow(0 0 4px ${edgeColor})`
                          : undefined,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdgeSelect?.(edge.id);
                    }}
                  />

                  {/* Edge label */}
                  {edge.label && (
                    <text
                      x={(sourceX + targetX) / 2}
                      y={(sourceY + targetY) / 2 - 8}
                      textAnchor="middle"
                      fontSize={10}
                      fill={colors.textMuted}
                    >
                      {edge.label}
                    </text>
                  )}

                  {/* Confidence indicator */}
                  <text
                    x={(sourceX + targetX) / 2}
                    y={(sourceY + targetY) / 2 + 12}
                    textAnchor="middle"
                    fontSize={9}
                    fill={getConfidenceColor(edge.confidence)}
                  >
                    {Math.round(edge.confidence * 100)}%
                  </text>
                </motion.g>
              );
            })}
          </AnimatePresence>

          {/* Linking preview line */}
          {linkingSourceId && (
            <motion.line
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              x1={(nodeMap.get(linkingSourceId)?.x || 0) + nodeWidth}
              y1={(nodeMap.get(linkingSourceId)?.y || 0) + nodeHeight / 2}
              x2={mousePosition.x}
              y2={mousePosition.y}
              stroke={colors.primary}
              strokeWidth={2}
              strokeDasharray="5,5"
              pointerEvents="none"
            />
          )}
        </g>
      </svg>

      {/* Nodes */}
      <AnimatePresence>
        {chain.nodes.map((node) => {
          const highlighted = isNodeHighlighted(node.id);
          const selected = selectedNodeId === node.id;
          const dimmed: boolean =
            (highlightedPath.length > 0 || selectedNodeId !== null) &&
            !highlighted &&
            !selected;

          return (
            <DraggableNode
              key={node.id}
              node={node}
              nodeWidth={nodeWidth}
              nodeHeight={nodeHeight}
              isSelected={selected}
              isHighlighted={highlighted}
              isDimmed={dimmed}
              propagation={getPropagation(node.id)}
              editMode={editMode}
              colors={colors}
              getConfidenceColor={getConfidenceColor}
              isRadar={isRadar}
              onSelect={() => handleNodeSelectForLinking(node.id)}
              onMove={(x, y) => onNodeMove?.(node.id, x, y)}
              onRemove={() => onNodeRemove?.(node.id)}
              onStartEdge={() => handleStartLinking(node.id)}
              isLinkingSource={linkingSourceId === node.id}
              isLinkingTarget={linkingSourceId !== null && linkingSourceId !== node.id}
            />
          );
        })}
      </AnimatePresence>

      {/* Add node button (edit mode) */}
      {editMode && onAddNode && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute bottom-4 right-4 w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
          style={{
            backgroundColor: colors.primary,
            color: colors.textOnDark,
          }}
          onClick={(e) => {
            e.stopPropagation();
            onAddNode();
          }}
          title="Add node"
        >
          <Plus size={20} />
        </motion.button>
      )}

      {/* Linking instructions */}
      {linkingSourceId && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-xs"
          style={{
            backgroundColor: colors.cardBg,
            border: `1px solid ${colors.border}`,
            color: colors.textSecondary,
          }}
        >
          Click another node to connect, or click anywhere to cancel
        </motion.div>
      )}

      {/* Selected edge actions */}
      {selectedEdgeId && editMode && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-4 px-3 py-2 rounded-lg flex items-center gap-2"
          style={{
            backgroundColor: colors.cardBg,
            border: `1px solid ${colors.border}`,
          }}
        >
          <span className="text-xs" style={{ color: colors.textSecondary }}>
            Edge selected
          </span>
          <button
            onClick={() => onEdgeRemove?.(selectedEdgeId)}
            className="p-1 rounded hover:bg-white/10"
            title="Remove edge"
          >
            <Trash2 size={14} style={{ color: colors.danger }} />
          </button>
        </motion.div>
      )}
    </div>
  );
}

export default EditableCausalChain;
