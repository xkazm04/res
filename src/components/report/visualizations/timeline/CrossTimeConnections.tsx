'use client';

/**
 * CrossTimeConnections
 *
 * SVG overlay showing connections between related events
 * across different times and tracks.
 */

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizationTheme } from '../useVisualizationTheme';
import {
  type TimelineEvent,
  calculateConnectionPaths,
  type ConnectionPath,
} from '@/src/lib/temporalClustering';

// ============================================================================
// Types
// ============================================================================

interface CrossTimeConnectionsProps {
  events: TimelineEvent[];
  getEventPosition: (id: string) => { x: number; y: number } | null;
  selectedEventId: string | null;
  hoveredEventId: string | null;
  width: number;
  height: number;
}

// ============================================================================
// Component
// ============================================================================

export function CrossTimeConnections({
  events,
  getEventPosition,
  selectedEventId,
  hoveredEventId,
  width,
  height,
}: CrossTimeConnectionsProps) {
  const { colors } = useVisualizationTheme();

  // Calculate all connection paths
  const paths = useMemo(
    () => calculateConnectionPaths(events, getEventPosition, height),
    [events, getEventPosition, height]
  );

  // Filter paths to show based on selection/hover
  const visiblePaths = useMemo(() => {
    if (selectedEventId) {
      return paths.filter(
        (p) => p.sourceId === selectedEventId || p.targetId === selectedEventId
      );
    }
    if (hoveredEventId) {
      return paths.filter(
        (p) => p.sourceId === hoveredEventId || p.targetId === hoveredEventId
      );
    }
    // Show all paths dimmed when nothing selected
    return paths;
  }, [paths, selectedEventId, hoveredEventId]);

  // Determine if a path is highlighted
  const isPathHighlighted = (path: ConnectionPath): boolean => {
    return (
      path.sourceId === selectedEventId ||
      path.targetId === selectedEventId ||
      path.sourceId === hoveredEventId ||
      path.targetId === hoveredEventId
    );
  };

  // Get path color based on type
  const getPathColor = (path: ConnectionPath): string => {
    switch (path.type) {
      case 'cause-effect':
        return colors.primary;
      case 'related':
        return colors.secondary;
      case 'sequence':
        return colors.warning;
      default:
        return colors.textMuted;
    }
  };

  if (paths.length === 0) return null;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={width}
      height={height}
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Arrow markers for different connection types */}
        <marker
          id="connection-arrow-primary"
          markerWidth="8"
          markerHeight="6"
          refX="8"
          refY="3"
          orient="auto"
        >
          <polygon
            points="0 0, 8 3, 0 6"
            fill={colors.primary}
          />
        </marker>
        <marker
          id="connection-arrow-secondary"
          markerWidth="8"
          markerHeight="6"
          refX="8"
          refY="3"
          orient="auto"
        >
          <polygon
            points="0 0, 8 3, 0 6"
            fill={colors.secondary}
          />
        </marker>
        <marker
          id="connection-arrow-muted"
          markerWidth="8"
          markerHeight="6"
          refX="8"
          refY="3"
          orient="auto"
        >
          <polygon
            points="0 0, 8 3, 0 6"
            fill={colors.textMuted}
          />
        </marker>

        {/* Glow filter */}
        <filter id="connection-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <AnimatePresence>
        {visiblePaths.map((path) => {
          const highlighted = isPathHighlighted(path);
          const pathColor = getPathColor(path);
          const showAll = !selectedEventId && !hoveredEventId;

          // Get marker ID
          const markerId =
            path.type === 'cause-effect'
              ? 'connection-arrow-primary'
              : path.type === 'related'
                ? 'connection-arrow-secondary'
                : 'connection-arrow-muted';

          return (
            <motion.g
              key={`${path.sourceId}-${path.targetId}`}
              initial={{ opacity: 0 }}
              animate={{
                opacity: highlighted ? 1 : showAll ? 0.2 : 0.1,
              }}
              exit={{ opacity: 0 }}
            >
              {/* Background glow for highlighted paths */}
              {highlighted && (
                <motion.path
                  d={path.path}
                  fill="none"
                  stroke={pathColor}
                  strokeWidth={6}
                  opacity={0.3}
                  filter="url(#connection-glow)"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5 }}
                />
              )}

              {/* Main path */}
              <motion.path
                d={path.path}
                fill="none"
                stroke={pathColor}
                strokeWidth={highlighted ? 2 : 1}
                strokeDasharray={path.type === 'related' ? '4,4' : undefined}
                markerEnd={`url(#${markerId})`}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              />

              {/* Animated particle for highlighted cause-effect paths */}
              {highlighted && path.type === 'cause-effect' && (
                <motion.circle
                  r={3}
                  fill={pathColor}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: [0, 1, 1, 0],
                    offsetDistance: ['0%', '100%'],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  style={{
                    offsetPath: `path("${path.path}")`,
                  }}
                />
              )}

              {/* Connection type label for highlighted paths */}
              {highlighted && (
                <motion.text
                  x={(path.sourcePosition.x + path.targetPosition.x) / 2}
                  y={(path.sourcePosition.y + path.targetPosition.y) / 2 - 8}
                  textAnchor="middle"
                  fontSize={9}
                  fill={pathColor}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {path.type === 'cause-effect' ? 'causes' : 'related to'}
                </motion.text>
              )}
            </motion.g>
          );
        })}
      </AnimatePresence>

      {/* Legend when showing all connections */}
      {!selectedEventId && !hoveredEventId && paths.length > 0 && (
        <g transform={`translate(${width - 120}, 10)`}>
          <rect
            x={0}
            y={0}
            width={110}
            height={50}
            rx={6}
            fill={colors.surfaceBg}
            opacity={0.9}
          />
          <text x={8} y={16} fontSize={9} fill={colors.textMuted}>
            Connections
          </text>

          {/* Cause-effect */}
          <line
            x1={8}
            y1={28}
            x2={30}
            y2={28}
            stroke={colors.primary}
            strokeWidth={2}
          />
          <text x={36} y={31} fontSize={8} fill={colors.textSecondary}>
            Cause-effect
          </text>

          {/* Related */}
          <line
            x1={8}
            y1={42}
            x2={30}
            y2={42}
            stroke={colors.secondary}
            strokeWidth={1}
            strokeDasharray="4,4"
          />
          <text x={36} y={45} fontSize={8} fill={colors.textSecondary}>
            Related
          </text>
        </g>
      )}
    </svg>
  );
}

export default CrossTimeConnections;
