'use client';

/**
 * ImpactPropagation
 *
 * Visual overlay showing how changes ripple through the causal chain,
 * with animated paths and magnitude indicators.
 */

import { useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizationTheme } from '../useVisualizationTheme';
import type {
  CausalChain,
  CausalNode,
  PropagationResult,
} from '@/src/lib/causalLayout';
import { cn } from '@/src/lib/utils';
import { Zap, TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface ImpactPropagationProps {
  chain: CausalChain;
  propagations: PropagationResult[];
  modifiedNodeId?: string;
  nodeWidth?: number;
  nodeHeight?: number;
  width: number;
  height: number;
  showRipples?: boolean;
  showMagnitudes?: boolean;
  animationSpeed?: number;
  className?: string;
}

interface RippleCircle {
  id: string;
  x: number;
  y: number;
  delay: number;
  color: string;
  maxRadius: number;
}

// ============================================================================
// Component
// ============================================================================

export function ImpactPropagation({
  chain,
  propagations,
  modifiedNodeId,
  nodeWidth = 150,
  nodeHeight = 60,
  width,
  height,
  showRipples = true,
  showMagnitudes = true,
  animationSpeed = 1,
  className,
}: ImpactPropagationProps) {
  const { colors, isRadar, getConfidenceColor } = useVisualizationTheme();
  const [animationKey, setAnimationKey] = useState(0);

  // Restart animation when propagations change
  useEffect(() => {
    setAnimationKey((k) => k + 1);
  }, [propagations]);

  // Build node map
  const nodeMap = useMemo(
    () => new Map(chain.nodes.map((n) => [n.id, n])),
    [chain.nodes]
  );

  // Build propagation map
  const propagationMap = useMemo(
    () => new Map(propagations.map((p) => [p.nodeId, p])),
    [propagations]
  );

  // Calculate ripple circles
  const ripples = useMemo<RippleCircle[]>(() => {
    if (!showRipples || !modifiedNodeId) return [];

    const sourceNode = nodeMap.get(modifiedNodeId);
    if (!sourceNode) return [];

    // Order propagations by distance from source
    const ordered = propagations
      .map((p) => {
        const node = nodeMap.get(p.nodeId);
        if (!node) return null;

        // Calculate distance from source
        const dx = (node.x || 0) - (sourceNode.x || 0);
        const dy = (node.y || 0) - (sourceNode.y || 0);
        const distance = Math.sqrt(dx * dx + dy * dy);

        return {
          ...p,
          node,
          distance,
        };
      })
      .filter(Boolean)
      .sort((a, b) => (a?.distance || 0) - (b?.distance || 0));

    // Create ripple circles
    return ordered.map((p, i) => {
      if (!p || !p.node) return null;

      const color =
        p.direction === 'increase'
          ? colors.success
          : p.direction === 'decrease'
            ? colors.danger
            : colors.textMuted;

      return {
        id: `ripple-${p.nodeId}`,
        x: (p.node.x || 0) + nodeWidth / 2,
        y: (p.node.y || 0) + nodeHeight / 2,
        delay: (i * 0.2) / animationSpeed,
        color,
        maxRadius: Math.abs(p.changePercent) * 2 + 20,
      };
    }).filter(Boolean) as RippleCircle[];
  }, [
    showRipples,
    modifiedNodeId,
    propagations,
    nodeMap,
    nodeWidth,
    nodeHeight,
    colors,
    animationSpeed,
  ]);

  // Calculate propagation paths
  const propagationPaths = useMemo(() => {
    if (!modifiedNodeId) return [];

    const sourceNode = nodeMap.get(modifiedNodeId);
    if (!sourceNode) return [];

    // Build forward edges
    const forwardEdges = new Map<string, string[]>();
    chain.edges.forEach((edge) => {
      const targets = forwardEdges.get(edge.source) || [];
      targets.push(edge.target);
      forwardEdges.set(edge.source, targets);
    });

    // BFS to find paths
    const paths: Array<{
      id: string;
      points: Array<{ x: number; y: number }>;
      color: string;
      delay: number;
    }> = [];

    const visited = new Set<string>();
    const queue: Array<{ nodeId: string; path: string[]; depth: number }> = [
      { nodeId: modifiedNodeId, path: [modifiedNodeId], depth: 0 },
    ];

    while (queue.length > 0) {
      const { nodeId, path, depth } = queue.shift()!;

      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      const neighbors = forwardEdges.get(nodeId) || [];
      neighbors.forEach((neighbor) => {
        const prop = propagationMap.get(neighbor);
        if (!prop || prop.direction === 'unchanged') return;

        const node = nodeMap.get(nodeId);
        const targetNode = nodeMap.get(neighbor);
        if (!node || !targetNode) return;

        const color =
          prop.direction === 'increase' ? colors.success : colors.danger;

        paths.push({
          id: `path-${nodeId}-${neighbor}`,
          points: [
            { x: (node.x || 0) + nodeWidth, y: (node.y || 0) + nodeHeight / 2 },
            { x: targetNode.x || 0, y: (targetNode.y || 0) + nodeHeight / 2 },
          ],
          color,
          delay: (depth * 0.3) / animationSpeed,
        });

        queue.push({
          nodeId: neighbor,
          path: [...path, neighbor],
          depth: depth + 1,
        });
      });
    }

    return paths;
  }, [
    modifiedNodeId,
    nodeMap,
    chain.edges,
    propagationMap,
    nodeWidth,
    nodeHeight,
    colors,
    animationSpeed,
  ]);

  // No propagations to show
  if (propagations.length === 0) {
    return null;
  }

  return (
    <svg
      key={animationKey}
      className={cn('absolute inset-0 pointer-events-none', className)}
      width={width}
      height={height}
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Glow filter */}
        <filter id="impact-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Animated dash pattern */}
        <pattern
          id="impact-dash"
          patternUnits="userSpaceOnUse"
          width="20"
          height="4"
        >
          <line
            x1="0"
            y1="2"
            x2="10"
            y2="2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </pattern>
      </defs>

      {/* Propagation paths with animation */}
      <g className="propagation-paths">
        <AnimatePresence>
          {propagationPaths.map((path) => {
            const d = `M ${path.points[0].x} ${path.points[0].y} L ${path.points[1].x} ${path.points[1].y}`;

            return (
              <motion.g key={path.id}>
                {/* Background glow */}
                <motion.path
                  d={d}
                  fill="none"
                  stroke={path.color}
                  strokeWidth={8}
                  opacity={0.2}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{
                    duration: 0.5 / animationSpeed,
                    delay: path.delay,
                    ease: 'easeOut',
                  }}
                  filter="url(#impact-glow)"
                />

                {/* Main path */}
                <motion.path
                  d={d}
                  fill="none"
                  stroke={path.color}
                  strokeWidth={3}
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{
                    duration: 0.5 / animationSpeed,
                    delay: path.delay,
                    ease: 'easeOut',
                  }}
                />

                {/* Animated particle along path */}
                <motion.circle
                  r={4}
                  fill={path.color}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: [0, 1, 1, 0],
                    cx: [path.points[0].x, path.points[1].x],
                    cy: [path.points[0].y, path.points[1].y],
                  }}
                  transition={{
                    duration: 0.8 / animationSpeed,
                    delay: path.delay + 0.2,
                    repeat: Infinity,
                    repeatDelay: 1,
                  }}
                  filter="url(#impact-glow)"
                />
              </motion.g>
            );
          })}
        </AnimatePresence>
      </g>

      {/* Ripple effects */}
      {showRipples && (
        <g className="ripple-effects">
          <AnimatePresence>
            {ripples.map((ripple) => (
              <motion.circle
                key={ripple.id}
                cx={ripple.x}
                cy={ripple.y}
                fill="none"
                stroke={ripple.color}
                strokeWidth={2}
                initial={{ r: 0, opacity: 0.8 }}
                animate={{ r: ripple.maxRadius, opacity: 0 }}
                transition={{
                  duration: 1 / animationSpeed,
                  delay: ripple.delay,
                  ease: 'easeOut',
                  repeat: Infinity,
                  repeatDelay: 2,
                }}
              />
            ))}
          </AnimatePresence>
        </g>
      )}

      {/* Impact magnitude indicators */}
      {showMagnitudes && (
        <g className="magnitude-indicators">
          <AnimatePresence>
            {propagations
              .filter((p) => p.direction !== 'unchanged')
              .map((p) => {
                const node = nodeMap.get(p.nodeId);
                if (!node) return null;

                const x = (node.x || 0) + nodeWidth + 8;
                const y = (node.y || 0) - 8;
                const isIncrease = p.direction === 'increase';
                const color = isIncrease ? colors.success : colors.danger;

                return (
                  <motion.g
                    key={`magnitude-${p.nodeId}`}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ duration: 0.3 / animationSpeed }}
                  >
                    {/* Badge background */}
                    <rect
                      x={x}
                      y={y}
                      width={48}
                      height={20}
                      rx={10}
                      fill={color}
                      opacity={0.9}
                    />

                    {/* Icon */}
                    <motion.g
                      animate={{ y: [0, -2, 0] }}
                      transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        repeatDelay: 1,
                      }}
                    >
                      {isIncrease ? (
                        <path
                          d={`M ${x + 8} ${y + 14} l 4 -6 l 4 6`}
                          fill="none"
                          stroke="white"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      ) : (
                        <path
                          d={`M ${x + 8} ${y + 8} l 4 6 l 4 -6`}
                          fill="none"
                          stroke="white"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}
                    </motion.g>

                    {/* Value */}
                    <text
                      x={x + 28}
                      y={y + 14}
                      fontSize={10}
                      fontWeight={600}
                      fill="white"
                      textAnchor="start"
                    >
                      {isIncrease ? '+' : ''}
                      {p.changePercent.toFixed(0)}%
                    </text>
                  </motion.g>
                );
              })}
          </AnimatePresence>
        </g>
      )}

      {/* Source indicator */}
      {modifiedNodeId && (
        <g className="source-indicator">
          {(() => {
            const sourceNode = nodeMap.get(modifiedNodeId);
            if (!sourceNode) return null;

            const cx = (sourceNode.x || 0) + nodeWidth / 2;
            const cy = (sourceNode.y || 0) + nodeHeight / 2;

            return (
              <>
                {/* Pulsing ring */}
                <motion.circle
                  cx={cx}
                  cy={cy}
                  fill="none"
                  stroke={colors.warning}
                  strokeWidth={2}
                  initial={{ r: 20, opacity: 0.8 }}
                  animate={{ r: 40, opacity: 0 }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                />

                {/* Source badge */}
                <motion.g
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <rect
                    x={cx - 35}
                    y={(sourceNode.y || 0) - 24}
                    width={70}
                    height={20}
                    rx={10}
                    fill={colors.warning}
                  />
                  <text
                    x={cx}
                    y={(sourceNode.y || 0) - 10}
                    fontSize={10}
                    fontWeight={600}
                    fill={colors.textOnDark}
                    textAnchor="middle"
                  >
                    <tspan>⚡ Source</tspan>
                  </text>
                </motion.g>
              </>
            );
          })()}
        </g>
      )}
    </svg>
  );
}

export default ImpactPropagation;
