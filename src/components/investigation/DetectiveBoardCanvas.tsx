'use client';

import { useRef, useCallback, useState } from 'react';
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { cn } from '@/src/lib/utils';
import { useInvestigationStore } from '@/src/stores/investigationStore';
import { FindingCard } from './FindingCard';
import { ConnectionLayer } from './ConnectionThread';

// ============================================================================
// BRUTALIST DESIGN SYSTEM
// ============================================================================
const BRUTALIST = {
  border: '3px solid black',
  borderLight: '2px solid black',
  shadow: '6px 6px 0 black',
  shadowSm: '4px 4px 0 black',
  font: "'JetBrains Mono', 'SF Mono', 'Consolas', monospace",
} as const;

interface DetectiveBoardCanvasProps {
  className?: string;
}

export function DetectiveBoardCanvas({ className }: DetectiveBoardCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const {
    session,
    cardPositions,
    selectedFindingId,
    hoveredFindingId,
    zoom,
    panOffset,
    setPanOffset,
    setCardPosition,
    getFilteredFindings,
    getContradictionsForFinding,
  } = useInvestigationStore();

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, delta } = event;
      const cardPos = cardPositions.get(active.id as string);
      if (cardPos) {
        setCardPosition(
          active.id as string,
          cardPos.x + delta.x / zoom,
          cardPos.y + delta.y / zoom
        );
      }
    },
    [cardPositions, setCardPosition, zoom]
  );

  // Pan handling
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === containerRef.current || (e.target as HTMLElement).classList.contains('board-background')) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      }
    },
    [panOffset]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setPanOffset({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
      }
    },
    [isPanning, panStart, setPanOffset]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  if (!session) return null;

  const filteredFindings = getFilteredFindings();
  const relationships = session.relationships;

  // Convert Map to object for ConnectionLayer
  const positionsObject = new Map<string, { x: number; y: number }>();
  cardPositions.forEach((value, key) => {
    positionsObject.set(key, { x: value.x, y: value.y });
  });

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden bg-white',
        isPanning && 'cursor-grabbing',
        className
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Brutalist grid background */}
      <div
        className="board-background absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
      />

      {/* Zoomable/pannable content */}
      <div
        className="absolute"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          width: '3000px',
          height: '2000px',
        }}
      >
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          {/* Connection threads layer */}
          <ConnectionLayer relationships={relationships} cardPositions={positionsObject} />

          {/* Finding cards */}
          {filteredFindings.map((finding) => {
            const position = cardPositions.get(finding.id);
            if (!position) return null;

            const hasContradiction = getContradictionsForFinding(finding.id).length > 0;

            return (
              <FindingCard
                key={finding.id}
                finding={finding}
                position={{ x: position.x, y: position.y }}
                rotation={position.rotation}
                pinned={position.pinned}
                isSelected={selectedFindingId === finding.id}
                isHovered={hoveredFindingId === finding.id}
                hasContradiction={hasContradiction}
              />
            );
          })}
        </DndContext>
      </div>

      {/* Minimap */}
      <Minimap
        findings={filteredFindings}
        cardPositions={cardPositions}
        panOffset={panOffset}
        zoom={zoom}
        containerWidth={3000}
        containerHeight={2000}
      />
    </div>
  );
}

// Minimap component
interface MinimapProps {
  findings: { id: string }[];
  cardPositions: Map<string, { x: number; y: number }>;
  panOffset: { x: number; y: number };
  zoom: number;
  containerWidth: number;
  containerHeight: number;
}

function Minimap({
  findings,
  cardPositions,
  panOffset,
  zoom,
  containerWidth,
  containerHeight,
}: MinimapProps) {
  const scale = 0.05;
  const width = containerWidth * scale;
  const height = containerHeight * scale;

  return (
    <div
      className="absolute bottom-4 right-4 bg-white overflow-hidden"
      style={{
        width,
        height,
        border: BRUTALIST.borderLight,
        boxShadow: BRUTALIST.shadowSm,
      }}
    >
      {/* Cards as dots */}
      {findings.map((finding) => {
        const pos = cardPositions.get(finding.id);
        if (!pos) return null;

        return (
          <div
            key={finding.id}
            className="absolute w-1.5 h-1.5 bg-black"
            style={{
              left: pos.x * scale,
              top: pos.y * scale,
            }}
          />
        );
      })}

      {/* Viewport indicator */}
      <div
        className="absolute bg-gray-200"
        style={{
          border: '1px solid black',
          left: -panOffset.x * scale / zoom,
          top: -panOffset.y * scale / zoom,
          width: (typeof window !== 'undefined' ? window.innerWidth : 1200) * scale / zoom,
          height: (typeof window !== 'undefined' ? window.innerHeight : 800) * scale / zoom,
        }}
      />
    </div>
  );
}
