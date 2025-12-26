'use client';

import { useMemo } from 'react';
import { cn } from '@/src/lib/utils';
import { useInvestigationStore } from '@/src/stores/investigationStore';
import { formatDate } from '@/src/lib/utils';
import { AlertTriangle, Calendar } from '@/src/components/ui/icons';
import type { ResearchFinding, ResearchGap } from '@/src/types/research';

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

interface TimelineStripProps {
  findings: ResearchFinding[];
  gaps: ResearchGap[];
  className?: string;
}

interface TimelineItem {
  id: string;
  date: Date;
  type: 'finding' | 'gap';
  data: ResearchFinding | ResearchGap;
}

export function TimelineStrip({ findings, gaps, className }: TimelineStripProps) {
  const { selectedFindingId, selectFinding, setHoveredFinding } = useInvestigationStore();

  // Build timeline items from findings with dates
  const timelineItems = useMemo(() => {
    const items: TimelineItem[] = [];

    // Add findings with dates
    findings.forEach((finding) => {
      if (finding.event_date) {
        items.push({
          id: finding.id,
          date: new Date(finding.event_date),
          type: 'finding',
          data: finding,
        });
      }
    });

    // Add temporal gaps
    gaps
      .filter((gap) => gap.gap_type === 'temporal' && gap.gap_start)
      .forEach((gap) => {
        items.push({
          id: gap.id,
          date: new Date(gap.gap_start!),
          type: 'gap',
          data: gap,
        });
      });

    // Sort by date
    items.sort((a, b) => a.date.getTime() - b.date.getTime());

    return items;
  }, [findings, gaps]);

  // Calculate date range
  const dateRange = useMemo(() => {
    if (timelineItems.length === 0) return null;
    const dates = timelineItems.map((i) => i.date.getTime());
    return {
      min: new Date(Math.min(...dates)),
      max: new Date(Math.max(...dates)),
    };
  }, [timelineItems]);

  if (timelineItems.length === 0) {
    return (
      <div
        className={cn('bg-white flex items-center justify-center', className)}
        style={{
          borderTop: BRUTALIST.border,
          fontFamily: BRUTALIST.font,
        }}
      >
        <p className="text-sm text-gray-500 uppercase tracking-widest">No dated events to display</p>
      </div>
    );
  }

  const timeSpan = dateRange ? dateRange.max.getTime() - dateRange.min.getTime() : 0;

  return (
    <div
      className={cn('bg-white flex flex-col', className)}
      style={{
        borderTop: BRUTALIST.border,
        fontFamily: BRUTALIST.font,
      }}
    >
      {/* Timeline header */}
      <div
        className="flex items-center justify-between px-4 py-2 bg-black text-white"
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span className="text-sm font-bold uppercase tracking-widest">Timeline</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest">
          <span>{timelineItems.filter((i) => i.type === 'finding').length} EVENTS</span>
          <span>{timelineItems.filter((i) => i.type === 'gap').length} GAPS</span>
        </div>
      </div>

      {/* Timeline scroll area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden px-4 py-3">
        <div className="relative h-full min-w-max">
          {/* Timeline axis */}
          <div
            className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-black"
          />

          {/* Date markers */}
          <div className="flex h-full items-end pb-2" style={{ minWidth: `${timelineItems.length * 120}px` }}>
            {dateRange && (
              <>
                <span
                  className="absolute left-0 top-2 text-[10px] font-bold uppercase tracking-widest bg-white px-1"
                  style={{ border: BRUTALIST.borderLight }}
                >
                  {formatDate(dateRange.min)}
                </span>
                <span
                  className="absolute right-0 top-2 text-[10px] font-bold uppercase tracking-widest bg-white px-1"
                  style={{ border: BRUTALIST.borderLight }}
                >
                  {formatDate(dateRange.max)}
                </span>
              </>
            )}

            {/* Timeline items */}
            <div className="relative flex-1 flex items-center justify-around">
              {timelineItems.map((item, index) => {
                const position = timeSpan > 0
                  ? ((item.date.getTime() - dateRange!.min.getTime()) / timeSpan) * 100
                  : (index / (timelineItems.length - 1)) * 100;

                return (
                  <TimelineMarker
                    key={item.id}
                    item={item}
                    position={position}
                    isSelected={item.type === 'finding' && selectedFindingId === item.id}
                    onSelect={() => {
                      if (item.type === 'finding') {
                        selectFinding(item.id);
                      }
                    }}
                    onHover={(isHovered) => {
                      if (item.type === 'finding') {
                        setHoveredFinding(isHovered ? item.id : null);
                      }
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TimelineMarkerProps {
  item: TimelineItem;
  position: number;
  isSelected: boolean;
  onSelect: () => void;
  onHover: (isHovered: boolean) => void;
}

function TimelineMarker({ item, position, isSelected, onSelect, onHover }: TimelineMarkerProps) {
  const isFinding = item.type === 'finding';
  const finding = isFinding ? (item.data as ResearchFinding) : null;
  const gap = !isFinding ? (item.data as ResearchGap) : null;

  // Color based on finding type or gap
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

  const getColor = () => {
    if (!isFinding) return 'bg-gray-400';
    return typeColors[finding?.finding_type || 'event'] || 'bg-black';
  };

  return (
    <div
      className="absolute flex flex-col items-center group cursor-pointer"
      style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
      onClick={onSelect}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      {/* Marker dot */}
      <div
        className={cn(
          'relative z-10 transition-transform',
          isSelected && 'scale-150',
          'group-hover:scale-125'
        )}
      >
        {isFinding ? (
          <div
            className={cn('w-4 h-4', getColor())}
            style={{ border: BRUTALIST.borderLight }}
          />
        ) : (
          <div
            className="w-4 h-4 bg-amber-100 flex items-center justify-center"
            style={{ border: '2px dashed black' }}
          >
            <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
          </div>
        )}
      </div>

      {/* Connector line */}
      <div className="w-0.5 h-4 bg-black" />

      {/* Label tooltip */}
      <div
        className={cn(
          'absolute bottom-full mb-2 px-2 py-1 bg-white text-[10px] whitespace-nowrap',
          'opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none'
        )}
        style={{
          border: BRUTALIST.borderLight,
          boxShadow: BRUTALIST.shadowSm,
          fontFamily: BRUTALIST.font,
        }}
      >
        <div className="font-bold uppercase">{formatDate(item.date)}</div>
        <div className="text-gray-600 max-w-[200px] truncate">
          {isFinding ? finding?.summary || finding?.content : gap?.description}
        </div>
      </div>

      {/* Date label */}
      <span
        className="text-[9px] font-bold uppercase tracking-widest mt-1"
        style={{ fontFamily: BRUTALIST.font }}
      >
        {item.date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
      </span>
    </div>
  );
}
