'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useVisualizationTheme } from './useVisualizationTheme';
import type { KnowledgeEntity } from '@/src/types/research';

interface EntityConstellationProps {
  entities: KnowledgeEntity[];
  onEntitySelect?: (id: string) => void;
  selectedEntity?: string;
}

interface StarNode {
  id: string;
  x: number;
  y: number;
  size: number;
  type: string;
  name: string;
  brightness: number;
}

export function EntityConstellation({ entities, onEntitySelect, selectedEntity }: EntityConstellationProps) {
  const { colors, isRadar, cardClasses, surfaceClasses, tooltipClasses, getEntityColor } = useVisualizationTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 350 });
  const [hoveredEntity, setHoveredEntity] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setDimensions({ width: rect.width, height: 350 });
  }, []);

  const stars = useMemo(() => {
    const { width, height } = dimensions;
    const centerX = width / 2;
    const centerY = height / 2;

    // Group by type and position in orbits
    const grouped: Record<string, KnowledgeEntity[]> = {};
    entities.forEach(e => {
      const type = e.entity_type?.toLowerCase() || 'other';
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(e);
    });

    const types = Object.keys(grouped);
    const result: StarNode[] = [];

    types.forEach((type, typeIdx) => {
      const orbit = 50 + typeIdx * 60;
      const items = grouped[type];

      items.forEach((e, i) => {
        const angle = (i / items.length) * Math.PI * 2 + typeIdx * 0.5;
        const jitter = Math.random() * 20 - 10;
        const mentions = e.mention_count || 1;

        result.push({
          id: e.id,
          x: centerX + Math.cos(angle) * (orbit + jitter),
          y: centerY + Math.sin(angle) * (orbit + jitter),
          size: Math.min(20, 4 + Math.sqrt(mentions) * 3),
          type,
          name: e.canonical_name,
          brightness: Math.min(1, 0.3 + mentions * 0.1),
        });
      });
    });

    return result;
  }, [entities, dimensions]);

  // Draw constellation lines between entities of same type
  const lines = useMemo(() => {
    const result: Array<{ x1: number; y1: number; x2: number; y2: number; type: string }> = [];
    const byType: Record<string, StarNode[]> = {};

    stars.forEach(s => {
      if (!byType[s.type]) byType[s.type] = [];
      byType[s.type].push(s);
    });

    Object.values(byType).forEach(group => {
      for (let i = 0; i < group.length - 1; i++) {
        result.push({
          x1: group[i].x, y1: group[i].y,
          x2: group[i + 1].x, y2: group[i + 1].y,
          type: group[i].type,
        });
      }
    });

    return result;
  }, [stars]);

  // Get entity types that exist in data for legend
  const legendTypes = useMemo(() => {
    const types = new Set(stars.map(s => s.type));
    return ['person', 'organization', 'location', 'event'].filter(t => types.has(t));
  }, [stars]);

  return (
    <div
      ref={containerRef}
      className={`relative rounded-xl overflow-hidden ${cardClasses}`}
      style={{ height: 350 }}
    >
      {/* Star field background for radar */}
      {isRadar && (
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-px h-px bg-white rounded-full"
              style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
              animate={{ opacity: [0.2, 0.8, 0.2] }}
              transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 2 }}
            />
          ))}
        </div>
      )}

      <svg className="absolute inset-0" width={dimensions.width} height={dimensions.height}>
        {/* Constellation lines */}
        {lines.map((line, i) => (
          <motion.line
            key={i}
            x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
            stroke={getEntityColor(line.type)}
            strokeWidth={1}
            strokeOpacity={0.2}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: i * 0.05, duration: 0.5 }}
          />
        ))}

        {/* Stars */}
        {stars.map((star, i) => {
          const isHovered = hoveredEntity === star.id;
          const isSelected = selectedEntity === star.id;
          const color = getEntityColor(star.type);

          return (
            <g key={star.id}>
              {/* Glow effect */}
              {(isHovered || isSelected) && (
                <motion.circle
                  cx={star.x} cy={star.y}
                  r={star.size * 2}
                  fill={color}
                  opacity={0.2}
                  initial={{ scale: 0 }}
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}

              {/* Star */}
              <motion.circle
                cx={star.x} cy={star.y}
                r={star.size}
                fill={color}
                opacity={star.brightness}
                initial={{ scale: 0 }}
                animate={{ scale: isHovered || isSelected ? 1.3 : 1 }}
                transition={{ delay: i * 0.02 }}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredEntity(star.id)}
                onMouseLeave={() => setHoveredEntity(null)}
                onClick={() => onEntitySelect?.(star.id)}
              />
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoveredEntity && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg text-sm ${tooltipClasses}`}
        >
          {stars.find(s => s.id === hoveredEntity)?.name}
        </motion.div>
      )}

      {/* Legend */}
      <div className={`absolute top-3 right-3 p-2 rounded-lg text-[10px] space-y-1 ${surfaceClasses}`}>
        {legendTypes.map(type => (
          <div key={type} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getEntityColor(type) }} />
            <span style={{ color: colors.textSecondary, textTransform: 'capitalize' }}>{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
