'use client';

import { useRef } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/src/lib/utils';
import { FindingTypeBadge } from '@/src/components/ui/badge';
import { ConfidenceIcon, ExternalLink, Calendar, User } from '@/src/components/ui/icons';
import { formatDate, truncate } from '@/src/lib/utils';
import { useInvestigationStore } from '@/src/stores/investigationStore';
import type { ResearchFinding } from '@/src/types/research';

// ============================================================================
// BRUTALIST DESIGN SYSTEM
// ============================================================================
const BRUTALIST = {
  border: '3px solid black',
  borderLight: '2px solid black',
  shadow: '6px 6px 0 black',
  shadowSm: '4px 4px 0 black',
  shadowHover: '2px 2px 0 black',
  font: "'JetBrains Mono', 'SF Mono', 'Consolas', monospace",
} as const;

interface FindingCardProps {
  finding: ResearchFinding;
  position: { x: number; y: number };
  rotation: number;
  pinned: boolean;
  isSelected: boolean;
  isHovered: boolean;
  hasContradiction: boolean;
  className?: string;
}

const typeColors: Record<string, string> = {
  fact: 'bg-blue-500',
  claim: 'bg-purple-500',
  event: 'bg-green-500',
  actor: 'bg-rose-500',
  relationship: 'bg-cyan-500',
  pattern: 'bg-indigo-500',
  gap: 'bg-gray-500',
  evidence: 'bg-emerald-500',
};

function getTypeColor(findingType: string): string {
  return typeColors[findingType] || 'bg-gray-500';
}

export function FindingCard({
  finding,
  position,
  rotation,
  pinned,
  isSelected,
  isHovered,
  hasContradiction,
  className,
}: FindingCardProps) {
  const { selectFinding, setHoveredFinding, setCardPinned } = useInvestigationStore();
  const typeColor = getTypeColor(finding.finding_type);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: finding.id,
    disabled: pinned,
  });

  const style = {
    transform: transform
      ? `translate3d(${position.x + transform.x}px, ${position.y + transform.y}px, 0) rotate(${rotation}deg)`
      : `translate3d(${position.x}px, ${position.y}px, 0) rotate(${rotation}deg)`,
    zIndex: isSelected ? 100 : isDragging ? 99 : isHovered ? 50 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'absolute w-64 cursor-grab active:cursor-grabbing',
        'transition-all duration-200',
        isDragging && 'opacity-90',
        className
      )}
      onClick={() => selectFinding(finding.id)}
      onMouseEnter={() => setHoveredFinding(finding.id)}
      onMouseLeave={() => setHoveredFinding(null)}
      {...listeners}
      {...attributes}
    >
      {/* Brutalist Card */}
      <div
        className={cn(
          'relative bg-white',
          isSelected && 'translate-x-[2px] translate-y-[2px]',
          hasContradiction && 'bg-red-50'
        )}
        style={{
          border: BRUTALIST.border,
          boxShadow: isSelected ? BRUTALIST.shadowHover : BRUTALIST.shadow,
          fontFamily: BRUTALIST.font,
        }}
      >
        {/* Pin button */}
        <button
          className={cn(
            'absolute -top-3 left-1/2 -translate-x-1/2 z-10',
            'w-6 h-6 flex items-center justify-center',
            'bg-white transition-transform hover:scale-110',
            pinned && 'bg-black text-white'
          )}
          style={{ border: BRUTALIST.borderLight }}
          onClick={(e) => {
            e.stopPropagation();
            setCardPinned(finding.id, !pinned);
          }}
        >
          <span className="text-xs font-bold">{pinned ? '📌' : '○'}</span>
        </button>

        {/* Type indicator bar */}
        <div className={cn('h-2', typeColor)} />

        {/* Card content */}
        <div className="p-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <span
              className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-gray-100"
              style={{ border: BRUTALIST.borderLight }}
            >
              {finding.finding_type}
            </span>
            {finding.confidence_score !== undefined && (
              <div className="flex items-center gap-1">
                <div
                  className="h-2 bg-gray-200"
                  style={{ width: '40px', border: '1px solid black' }}
                >
                  <div
                    className={cn(
                      'h-full',
                      finding.confidence_score >= 0.8
                        ? 'bg-green-500'
                        : finding.confidence_score >= 0.5
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                    )}
                    style={{ width: `${finding.confidence_score * 100}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold">
                  {Math.round(finding.confidence_score * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <p className="text-xs leading-relaxed mb-2">
            {truncate(finding.summary || finding.content, 120)}
          </p>

          {/* Metadata */}
          <div className="flex items-center gap-3 text-[10px] text-gray-600">
            {finding.event_date && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(finding.event_date)}</span>
              </div>
            )}
            {finding.perspective && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span className="uppercase">{finding.perspective}</span>
              </div>
            )}
          </div>

          {/* Sources indicator */}
          {finding.supporting_sources && finding.supporting_sources.length > 0 && (
            <div
              className="mt-2 pt-2 flex items-center gap-1 text-[10px] text-gray-500"
              style={{ borderTop: '1px solid black' }}
            >
              <ExternalLink className="w-3 h-3" />
              <span className="font-bold uppercase">
                {finding.supporting_sources.length} SOURCE{finding.supporting_sources.length !== 1 ? 'S' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Contradiction indicator */}
        {hasContradiction && (
          <div
            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white flex items-center justify-center text-xs font-bold"
            style={{ border: BRUTALIST.borderLight }}
          >
            !
          </div>
        )}
      </div>
    </div>
  );
}

// Simpler card for when not dragging
export function FindingCardStatic({
  finding,
  isSelected,
  onClick,
  className,
}: {
  finding: ResearchFinding;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'bg-white p-3 cursor-pointer transition-all duration-200',
        isSelected && 'translate-x-[2px] translate-y-[2px]',
        'hover:translate-x-[2px] hover:translate-y-[2px]',
        className
      )}
      style={{
        border: BRUTALIST.border,
        boxShadow: isSelected ? BRUTALIST.shadowHover : BRUTALIST.shadowSm,
        fontFamily: BRUTALIST.font,
      }}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span
          className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-gray-100"
          style={{ border: BRUTALIST.borderLight }}
        >
          {finding.finding_type}
        </span>
        {finding.confidence_score !== undefined && (
          <span className="text-[10px] font-bold">
            {Math.round(finding.confidence_score * 100)}%
          </span>
        )}
      </div>
      <p className="text-xs leading-relaxed">
        {truncate(finding.summary || finding.content, 80)}
      </p>
      {finding.event_date && (
        <p className="mt-2 text-[10px] text-gray-500 font-bold uppercase">
          {formatDate(finding.event_date)}
        </p>
      )}
    </div>
  );
}
