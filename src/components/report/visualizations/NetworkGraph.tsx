'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useVisualizationTheme } from './useVisualizationTheme';
import { useForceLayout, useContainerDimensions, type LayoutEdge } from '@/src/lib/layout';

interface Node {
  id: string;
  label: string;
  type: 'finding' | 'source' | 'entity' | 'perspective';
  value: number; // 0-1 for sizing
  x?: number;
  y?: number;
}

interface Edge {
  source: string;
  target: string;
  strength: number; // 0-1
  type?: 'supports' | 'contradicts' | 'references';
}

interface NetworkGraphProps {
  nodes: Node[];
  edges: Edge[];
  onNodeClick?: (nodeId: string) => void;
  highlightedNode?: string;
}

export function NetworkGraph({ nodes, edges, onNodeClick, highlightedNode }: NetworkGraphProps) {
  const { colors, getEntityColor, surfaceClasses, tooltipClasses } = useVisualizationTheme();
  const [containerRef, dimensions] = useContainerDimensions();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Convert nodes to layout format and use shared force layout
  const layoutNodes = nodes.map((n) => ({
    id: n.id,
    x: n.x ?? 0,
    y: n.y ?? 0,
    value: n.value,
  }));

  const layoutEdges: LayoutEdge[] = edges.map((e) => ({
    source: e.source,
    target: e.target,
    strength: e.strength,
  }));

  // Use the shared force-directed layout hook
  const positions = useForceLayout(layoutNodes, layoutEdges, dimensions, {
    iterations: 50,
    repulsion: 1000,
    attraction: 0.01,
    damping: 0.1,
    padding: 40,
  });

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-64 rounded-xl overflow-hidden ${surfaceClasses}`}
    >
      {/* Grid pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-10">
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke={colors.primary} strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Edges */}
      <svg className="absolute inset-0 w-full h-full">
        {edges.map((edge, i) => {
          const from = positions.get(edge.source);
          const to = positions.get(edge.target);
          if (!from || !to) return null;
          const isHighlighted = hoveredNode === edge.source || hoveredNode === edge.target;
          return (
            <motion.line
              key={i}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: isHighlighted ? 0.8 : 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.02 }}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={edge.type === 'contradicts' ? colors.contradictionLine : colors.connectionLine}
              strokeWidth={isHighlighted ? 2 : 1}
              strokeDasharray={edge.type === 'contradicts' ? '4,4' : undefined}
            />
          );
        })}
      </svg>

      {/* Nodes */}
      {nodes.map((node, i) => {
        const pos = positions.get(node.id);
        if (!pos) return null;
        const color = getEntityColor(node.type);
        const size = 12 + node.value * 20;
        const isHovered = hoveredNode === node.id;
        const isHighlightedNode = highlightedNode === node.id;

        return (
          <motion.div
            key={node.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: isHovered || isHighlightedNode ? 1.3 : 1,
              opacity: 1,
              x: pos.x - size / 2,
              y: pos.y - size / 2,
            }}
            transition={{ type: 'spring', damping: 20, delay: i * 0.03 }}
            className="absolute cursor-pointer"
            style={{ width: size, height: size }}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
            onClick={() => onNodeClick?.(node.id)}
          >
            <div
              className="w-full h-full rounded-full flex items-center justify-center transition-shadow"
              style={{
                backgroundColor: color,
                boxShadow: isHovered || isHighlightedNode ? `0 0 20px ${color}` : `0 0 8px ${color}50`,
              }}
            >
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded text-[10px] font-medium ${tooltipClasses}`}
                >
                  {node.label}
                </motion.div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
