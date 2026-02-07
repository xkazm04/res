'use client';

import { useMemo, useState, useEffect, useCallback, useRef, forwardRef } from 'react';
import type { ResearchFinding, ResearchSource } from '@/src/types/research';
import { ThemedSection } from '../ThemedCards';
import { EmptyState } from '../shared/EmptyState';
import { TypeBadge, ConfidenceBadge } from '../shared/Badges';
import { ProgressBar } from '../shared/ProgressBar';
import { ClockIcon, LinkIcon } from '../shared/Icons';
import { matchesConfidenceFilter, type ConfidenceFilterOption } from '../shared/typeConfig';
import { UniversalCard, CardMetaRow, CardDataPanel, CardSourcesPanel } from '../shared/UniversalCard';
import { useFilteredData } from '@/src/hooks/useFilteredData';

interface FindingsTabProps {
  findings: ResearchFinding[];
  sources: ResearchSource[];
  searchQuery: string;
  filterType: string;
  filterConfidence: string;
}

export function FindingsTab({
  findings,
  sources,
  searchQuery,
  filterType,
  filterConfidence,
}: FindingsTabProps) {
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const findingRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Stabilize filter function to prevent re-filtering when only search query changes
  const filterFn = useCallback(
    (f: ResearchFinding, debouncedQuery: string) => {
      if (debouncedQuery && !f.content.toLowerCase().includes(debouncedQuery.toLowerCase())) {
        return false;
      }
      if (filterType !== 'all' && f.finding_type !== filterType) {
        return false;
      }
      if (!matchesConfidenceFilter(f.confidence_score || 0, filterConfidence as ConfidenceFilterOption)) {
        return false;
      }
      return true;
    },
    [filterType, filterConfidence]
  );

  const { filteredData: filteredFindings, debouncedQuery } = useFilteredData({
    data: findings,
    searchQuery,
    filterFn,
  });

  const sourceMap = useMemo(() => {
    const map = new Map<string, ResearchSource>();
    sources.forEach((s) => map.set(s.id, s));
    return map;
  }, [sources]);

  // Reset focus when filters change (uses debounced query to avoid reset during typing)
  useEffect(() => {
    setFocusedIndex(-1);
  }, [debouncedQuery, filterType, filterConfidence]);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const scrollToFinding = useCallback((index: number) => {
    const el = findingRefs.current.get(index);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if container or its children have focus, or no specific element is focused
      const activeElement = document.activeElement;
      const isInContainer = containerRef.current?.contains(activeElement);
      const isBodyFocused = activeElement === document.body;

      if (!isInContainer && !isBodyFocused) return;

      // Don't interfere with input fields
      if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case 'j':
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => {
            const next = Math.min(prev + 1, filteredFindings.length - 1);
            scrollToFinding(next);
            return next;
          });
          break;
        case 'k':
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => {
            const next = Math.max(prev - 1, 0);
            scrollToFinding(next);
            return next;
          });
          break;
        case 'Enter':
        case ' ':
          if (focusedIndex >= 0 && focusedIndex < filteredFindings.length) {
            e.preventDefault();
            toggleExpanded(filteredFindings[focusedIndex].id);
          }
          break;
        case 'Escape':
          setFocusedIndex(-1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [filteredFindings, focusedIndex, toggleExpanded, scrollToFinding]);

  const setFindingRef = useCallback((index: number, el: HTMLDivElement | null) => {
    if (el) {
      findingRefs.current.set(index, el);
    } else {
      findingRefs.current.delete(index);
    }
  }, []);

  if (filteredFindings.length === 0) {
    return <EmptyState type="search" title="No findings match your filters" />;
  }

  return (
    <ThemedSection title="Findings" count={filteredFindings.length}>
      <div ref={containerRef} className="space-y-2" tabIndex={-1}>
        {filteredFindings.map((finding, index) => (
          <FindingCard
            key={finding.id}
            finding={finding}
            sourceMap={sourceMap}
            isFocused={focusedIndex === index}
            isExpanded={expandedIds.has(finding.id)}
            onToggleExpanded={() => toggleExpanded(finding.id)}
            onFocus={() => setFocusedIndex(index)}
            ref={(el) => setFindingRef(index, el)}
          />
        ))}
      </div>
      {filteredFindings.length > 0 && (
        <div className="mt-3 text-[10px] text-slate-400 flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-mono">j</kbd>
          <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-mono">k</kbd>
          <span>navigate</span>
          <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-mono">Enter</kbd>
          <span>expand</span>
        </div>
      )}
    </ThemedSection>
  );
}

interface FindingCardProps {
  finding: ResearchFinding;
  sourceMap: Map<string, ResearchSource>;
  isFocused: boolean;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onFocus: () => void;
}

const FindingCard = forwardRef<HTMLDivElement, FindingCardProps>(function FindingCard(
  { finding, sourceMap, isFocused, isExpanded, onToggleExpanded, onFocus },
  ref
) {
  const supportingSources = finding.supporting_sources || [];
  const confidence = finding.confidence_score || 0;

  // Get summary (first sentence or first 120 chars)
  const summary = finding.content.split('.')[0] + '.';

  return (
    <UniversalCard
      ref={ref}
      isFocused={isFocused}
      isExpanded={isExpanded}
      onToggleExpanded={onToggleExpanded}
      onFocus={onFocus}
      badges={<TypeBadge type={finding.finding_type} />}
      header={<span className="text-sm text-slate-700 line-clamp-1">{summary}</span>}
      actions={<ConfidenceBadge score={confidence} />}
      body={
        <>
          {/* Full content */}
          <p className="text-sm text-slate-700 leading-relaxed mb-3">{finding.content}</p>

          {/* Meta row */}
          <CardMetaRow className="mb-3">
            {finding.temporal_context && (
              <span className="flex items-center gap-1">
                <span className="w-3.5 h-3.5"><ClockIcon /></span>
                {finding.temporal_context}
                {finding.event_date && ` • ${new Date(finding.event_date).toLocaleDateString()}`}
              </span>
            )}
            <span className="flex items-center gap-1">
              Confidence:
              <span className="w-16"><ProgressBar value={confidence * 100} size="sm" /></span>
            </span>
          </CardMetaRow>

          {/* Extracted Data */}
          {finding.extracted_data && Object.keys(finding.extracted_data).length > 0 && (
            <CardDataPanel title="Extracted Data" className="mb-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(finding.extracted_data).slice(0, 6).map(([key, value]) => (
                  <div key={key} className="text-xs">
                    <span className="text-slate-500">{key}: </span>
                    <span className="text-slate-700 font-medium">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </CardDataPanel>
          )}

          {/* Supporting Sources */}
          {supportingSources.length > 0 && (
            <CardSourcesPanel count={supportingSources.length}>
              <div className="space-y-1">
                {supportingSources.slice(0, 3).map((sourceId) => {
                  const source = sourceMap.get(sourceId);
                  if (!source) return null;
                  return (
                    <a
                      key={sourceId}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs text-blue-600 hover:underline truncate"
                    >
                      {source.title || source.domain || source.url}
                      {source.credibility_score && (
                        <span className="text-slate-400 ml-1">
                          ({Math.round(source.credibility_score * 100)}% cred)
                        </span>
                      )}
                    </a>
                  );
                })}
              </div>
            </CardSourcesPanel>
          )}
        </>
      }
    />
  );
});
