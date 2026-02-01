'use client';

/**
 * SankeyDiagram
 *
 * Visualizes flow magnitudes between causal chain nodes using
 * a Sankey diagram layout with confidence-weighted edges.
 */

import { useRef, useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizationTheme } from '../useVisualizationTheme';
import {
  type SankeyNode,
  type SankeyLink,
  generateSankeyPath,
} from '@/src/lib/causalLayout';
import { cn } from '@/src/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface SankeyDiagramProps {
  nodes: SankeyNode[];
  links: SankeyLink[];
  width: number;
  height: number;
  nodeWidth?: number;
  selectedNodeId?: string | null;
  highlightedPath?: string[];
  onNodeClick?: (nodeId: string) => void;
  onNodeHover?: (nodeId: string | null) => void;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function SankeyDiagram({
  nodes,
  links,
  width,
  height,
  nodeWidth = 20,
  selectedNodeId,
  highlightedPath = [],
  onNodeClick,
  onNodeHover,
  className,
}: SankeyDiagramProps) {
  const { colors, isRadar, getConfidenceColor } = useVisualizationTheme();
  const svgRef = useRef<SVGSVGElement>(null);

  // Track hovered node for highlighting connected links
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Get connected links for a node
  const getConnectedLinks = useCallback(
    (nodeId: string): SankeyLink[] => {
      return links.filter(
        (link) => link.source.id === nodeId || link.target.id === nodeId
      );
    },
    [links]
  );

  // Check if a link should be highlighted
  const isLinkHighlighted = useCallback(
    (link: SankeyLink): boolean => {
      if (hoveredNodeId) {
        return (
          link.source.id === hoveredNodeId || link.target.id === hoveredNodeId
        );
      }
      if (highlightedPath.length > 0) {
        const sourceIndex = highlightedPath.indexOf(link.source.id);
        const targetIndex = highlightedPath.indexOf(link.target.id);
        return (
          sourceIndex !== -1 &&
          targetIndex !== -1 &&
          Math.abs(sourceIndex - targetIndex) === 1
        );
      }
      return false;
    },
    [hoveredNodeId, highlightedPath]
  );

  // Check if a node should be highlighted
  const isNodeHighlighted = useCallback(
    (nodeId: string): boolean => {
      return highlightedPath.includes(nodeId) || nodeId === hoveredNodeId;
    },
    [highlightedPath, hoveredNodeId]
  );

  // Handle node hover
  const handleNodeHover = useCallback(
    (nodeId: string | null) => {
      setHoveredNodeId(nodeId);
      onNodeHover?.(nodeId);
    },
    [onNodeHover]
  );

  // Get color for node based on type
  const getNodeColor = useCallback(
    (node: SankeyNode): string => {
      switch (node.type) {
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
    },
    [colors]
  );

  // Get link gradient ID
  const getLinkGradientId = (link: SankeyLink): string =>
    `sankey-gradient-${link.source.id}-${link.target.id}`;

  // Calculate max value for scaling
  const maxValue = useMemo(
    () => Math.max(...nodes.map((n) => n.value), 1),
    [nodes]
  );

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className={cn('sankey-diagram', className)}
      style={{ overflow: 'visible' }}
    >
      {/* Gradient definitions */}
      <defs>
        {links.map((link) => (
          <linearGradient
            key={getLinkGradientId(link)}
            id={getLinkGradientId(link)}
            gradientUnits="userSpaceOnUse"
            x1={(link.source.x || 0) + nodeWidth}
            y1={link.y0}
            x2={link.target.x || 0}
            y2={link.y1}
          >
            <stop offset="0%" stopColor={getNodeColor(link.source)} stopOpacity={0.5} />
            <stop offset="100%" stopColor={getNodeColor(link.target)} stopOpacity={0.5} />
          </linearGradient>
        ))}
      </defs>

      {/* Links */}
      <g className="sankey-links">
        <AnimatePresence>
          {links.map((link) => {
            const path = generateSankeyPath(link, nodeWidth);
            const highlighted = isLinkHighlighted(link);
            const dimmed = (hoveredNodeId || highlightedPath.length > 0) && !highlighted;

            return (
              <motion.path
                key={`${link.source.id}-${link.target.id}`}
                d={path}
                fill="none"
                stroke={`url(#${getLinkGradientId(link)})`}
                strokeWidth={Math.max(2, link.width || 1)}
                initial={{ opacity: 0, pathLength: 0 }}
                animate={{
                  opacity: dimmed ? 0.15 : highlighted ? 0.9 : 0.5,
                  pathLength: 1,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                style={{
                  cursor: 'pointer',
                  filter: highlighted ? `drop-shadow(0 0 4px ${colors.primary})` : undefined,
                }}
              >
                <title>
                  {link.source.label} → {link.target.label}
                  {'\n'}Value: {link.value.toFixed(2)}
                  {'\n'}Confidence: {(link.confidence * 100).toFixed(0)}%
                </title>
              </motion.path>
            );
          })}
        </AnimatePresence>
      </g>

      {/* Nodes */}
      <g className="sankey-nodes">
        <AnimatePresence>
          {nodes.map((node) => {
            const nodeHeight = (node.y1 || 0) - (node.y0 || 0);
            const highlighted = isNodeHighlighted(node.id);
            const selected = selectedNodeId === node.id;
            const dimmed =
              (hoveredNodeId || highlightedPath.length > 0) &&
              !highlighted &&
              !selected;

            return (
              <motion.g
                key={node.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: dimmed ? 0.3 : 1,
                  scale: selected ? 1.05 : 1,
                }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                onMouseEnter={() => handleNodeHover(node.id)}
                onMouseLeave={() => handleNodeHover(null)}
                onClick={() => onNodeClick?.(node.id)}
                style={{ cursor: 'pointer' }}
              >
                {/* Node rectangle */}
                <rect
                  x={node.x}
                  y={node.y0}
                  width={nodeWidth}
                  height={Math.max(10, nodeHeight)}
                  rx={4}
                  fill={getNodeColor(node)}
                  stroke={selected ? colors.textPrimary : 'none'}
                  strokeWidth={selected ? 2 : 0}
                  style={{
                    filter:
                      highlighted || selected
                        ? `drop-shadow(0 0 8px ${getNodeColor(node)})`
                        : undefined,
                  }}
                />

                {/* Confidence indicator */}
                <rect
                  x={node.x}
                  y={node.y0}
                  width={nodeWidth}
                  height={Math.max(10, nodeHeight) * node.confidence}
                  rx={4}
                  fill={getConfidenceColor(node.confidence)}
                  opacity={0.3}
                />

                {/* Node label */}
                <text
                  x={(node.x || 0) + nodeWidth + 8}
                  y={(node.y0 || 0) + Math.max(10, nodeHeight) / 2}
                  dy="0.35em"
                  fontSize={12}
                  fontWeight={selected || highlighted ? 600 : 400}
                  fill={colors.textPrimary}
                  style={{
                    textShadow: isRadar ? '0 1px 2px rgba(0,0,0,0.8)' : undefined,
                  }}
                >
                  {node.label}
                </text>

                {/* Value label */}
                <text
                  x={(node.x || 0) + nodeWidth + 8}
                  y={(node.y0 || 0) + Math.max(10, nodeHeight) / 2 + 14}
                  dy="0.35em"
                  fontSize={10}
                  fill={colors.textMuted}
                >
                  {(node.value / maxValue * 100).toFixed(0)}% flow
                </text>

                {/* Tooltip area */}
                <title>
                  {node.label}
                  {'\n'}Type: {node.type}
                  {'\n'}Value: {node.value.toFixed(2)}
                  {'\n'}Weight: {(node.weight * 100).toFixed(0)}%
                  {'\n'}Confidence: {(node.confidence * 100).toFixed(0)}%
                </title>
              </motion.g>
            );
          })}
        </AnimatePresence>
      </g>

      {/* Legend */}
      <g className="sankey-legend" transform={`translate(${width - 150}, 20)`}>
        <text
          fontSize={10}
          fontWeight={600}
          fill={colors.textSecondary}
          textAnchor="start"
        >
          Node Types
        </text>
        {[
          { type: 'cause', label: 'Cause', color: colors.primary },
          { type: 'effect', label: 'Effect', color: colors.success },
          { type: 'mediator', label: 'Mediator', color: colors.secondary },
          { type: 'moderator', label: 'Moderator', color: colors.warning },
        ].map((item, i) => (
          <g key={item.type} transform={`translate(0, ${20 + i * 18})`}>
            <rect x={0} y={0} width={12} height={12} rx={2} fill={item.color} />
            <text x={18} y={10} fontSize={10} fill={colors.textMuted}>
              {item.label}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

export default SankeyDiagram;
