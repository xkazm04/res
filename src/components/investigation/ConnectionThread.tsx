'use client';

import { useMemo } from 'react';
import { useInvestigationStore } from '@/src/stores/investigationStore';
import type { FindingRelationship } from '@/src/types/research';

interface ConnectionThreadProps {
  relationship: FindingRelationship;
  sourcePos: { x: number; y: number };
  targetPos: { x: number; y: number };
  isHighlighted?: boolean;
}

// Card dimensions for connection point calculation
const CARD_WIDTH = 256;
const CARD_HEIGHT = 150;

export function ConnectionThread({
  relationship,
  sourcePos,
  targetPos,
  isHighlighted = false,
}: ConnectionThreadProps) {
  const { threadColors, hoveredFindingId, selectedFindingId } = useInvestigationStore();

  const color = threadColors[relationship.relationship_type] || '#888888';

  const isActive =
    isHighlighted ||
    hoveredFindingId === relationship.source_finding_id ||
    hoveredFindingId === relationship.target_finding_id ||
    selectedFindingId === relationship.source_finding_id ||
    selectedFindingId === relationship.target_finding_id;

  // Calculate bezier curve path
  const path = useMemo(() => {
    // Center points of cards
    const sx = sourcePos.x + CARD_WIDTH / 2;
    const sy = sourcePos.y + CARD_HEIGHT / 2;
    const tx = targetPos.x + CARD_WIDTH / 2;
    const ty = targetPos.y + CARD_HEIGHT / 2;

    // Calculate control points for a smooth curve
    const dx = tx - sx;
    const dy = ty - sy;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Control point offset based on distance
    const curvature = Math.min(distance * 0.3, 100);

    // Perpendicular offset for curve
    const mx = (sx + tx) / 2;
    const my = (sy + ty) / 2;
    const perpX = -dy / distance;
    const perpY = dx / distance;

    // Add some variation based on relationship type to prevent overlap
    const offset = (relationship.relationship_type.charCodeAt(0) % 3 - 1) * 20;
    const cx = mx + perpX * (curvature + offset);
    const cy = my + perpY * (curvature + offset);

    return `M ${sx} ${sy} Q ${cx} ${cy} ${tx} ${ty}`;
  }, [sourcePos, targetPos, relationship.relationship_type]);

  // Arrow marker for direction
  const markerId = `arrow-${relationship.id}`;

  return (
    <g className={isActive ? 'opacity-100' : 'opacity-40'}>
      {/* Define arrow marker */}
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
        </marker>
      </defs>

      {/* Thread shadow */}
      <path
        d={path}
        fill="none"
        stroke="rgba(0,0,0,0.2)"
        strokeWidth={isActive ? 4 : 2}
        strokeLinecap="round"
        style={{ transform: 'translate(2px, 2px)' }}
      />

      {/* Main thread */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={isActive ? 3 : 1.5}
        strokeLinecap="round"
        strokeDasharray={relationship.relationship_type === 'contradicts' ? '8,4' : 'none'}
        markerEnd={`url(#${markerId})`}
        className="transition-all duration-200"
      />

      {/* Relationship label */}
      {isActive && (
        <ThreadLabel
          path={path}
          label={relationship.relationship_type.replace('_', ' ')}
          color={color}
        />
      )}
    </g>
  );
}

function ThreadLabel({ path, label, color }: { path: string; label: string; color: string }) {
  const labelId = `label-path-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <>
      <defs>
        <path id={labelId} d={path} />
      </defs>
      <text
        className="text-[10px] font-medium uppercase tracking-wide"
        fill={color}
        dy="-6"
      >
        <textPath href={`#${labelId}`} startOffset="50%" textAnchor="middle">
          {label}
        </textPath>
      </text>
    </>
  );
}

// Render all connections as an SVG layer
interface ConnectionLayerProps {
  relationships: FindingRelationship[];
  cardPositions: Map<string, { x: number; y: number }>;
}

export function ConnectionLayer({ relationships, cardPositions }: ConnectionLayerProps) {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
      {relationships.map((rel) => {
        const sourcePos = cardPositions.get(rel.source_finding_id || '');
        const targetPos = cardPositions.get(rel.target_finding_id || '');

        if (!sourcePos || !targetPos) return null;

        return (
          <ConnectionThread
            key={rel.id}
            relationship={rel}
            sourcePos={sourcePos}
            targetPos={targetPos}
          />
        );
      })}
    </svg>
  );
}
