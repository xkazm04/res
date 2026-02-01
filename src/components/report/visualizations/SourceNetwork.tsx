'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useVisualizationTheme } from './useVisualizationTheme';
import { useConcentricLayoutNodes, useContainerDimensions } from '@/src/lib/layout';
import type { ResearchSource } from '@/src/types/research';

interface SourceNetworkProps {
  sources: ResearchSource[];
  onSourceSelect?: (id: string) => void;
  selectedSource?: string;
}

interface SourceNode {
  id: string;
  x: number;
  y: number;
  radius: number;
  credibility: number;
  domain: string;
  type: string;
}

export function SourceNetwork({ sources, onSourceSelect, selectedSource }: SourceNetworkProps) {
  const { colors, isRadar, surfaceClasses, getCredibilityColor } = useVisualizationTheme();
  const [containerRef, dimensions] = useContainerDimensions();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Convert sources to layout nodes with credibility as the value property
  const layoutNodes = sources.map((s) => ({
    id: s.id,
    x: 0,
    y: 0,
    value: s.credibility_score ?? 0.5,
    credibility: s.credibility_score ?? 0.5,
    domain: s.domain || 'unknown',
    type: s.source_type || 'web',
  }));

  // Use the shared concentric layout hook
  const nodes = useConcentricLayoutNodes(layoutNodes, {
    width: dimensions.width,
    height: 300,
  }, {
    radiusProperty: 'value',
    invertRadius: true, // Higher credibility = closer to center
    jitter: 0.3,
  });

  // Calculate node radius from credibility
  const getNodeRadius = (credibility: number) => 6 + credibility * 14;

  return (
    <div ref={containerRef} className={`relative rounded-xl overflow-hidden ${surfaceClasses}`} style={{ height: 300 }}>
      {/* Trust rings */}
      <svg className="absolute inset-0" width={dimensions.width} height={300}>
        {[0.8, 0.5, 0.2].map((level) => (
          <circle
            key={level}
            cx={dimensions.width / 2}
            cy={150}
            r={Math.min(dimensions.width, 300) * 0.4 * (1 - level * 0.8)}
            fill="none"
            stroke={colors.gridLine}
            strokeDasharray="4 4"
          />
        ))}

        {/* Nodes */}
        {nodes.map((node) => {
          const radius = getNodeRadius(node.credibility);
          return (
            <g key={node.id}>
              <motion.circle
                initial={{ scale: 0 }}
                animate={{
                  scale: hoveredNode === node.id || selectedSource === node.id ? 1.5 : 1,
                  opacity: hoveredNode && hoveredNode !== node.id ? 0.4 : 1
                }}
                cx={node.x}
                cy={node.y}
                r={radius}
                fill={getCredibilityColor(node.credibility)}
                stroke={selectedSource === node.id ? (isRadar ? '#fff' : '#000') : 'transparent'}
                strokeWidth={2}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => onSourceSelect?.(node.id)}
              />
            </g>
          );
        })}
      </svg>

      {/* Labels */}
      <div className="absolute bottom-3 left-3 flex items-center gap-4 text-[10px]" style={{ color: colors.textSecondary }}>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.success }} /> High
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.warning }} /> Medium
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.danger }} /> Low
        </span>
      </div>

      {/* Center label */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none"
        style={{ color: isRadar ? colors.primaryMuted : colors.textMuted }}
      >
        <div className="text-[10px] uppercase tracking-wider">Trust Core</div>
      </div>
    </div>
  );
}
