'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { ResearchFinding, ResearchSource } from '@/src/types/research';
import { useReportTheme, useThemeStyles } from '../core/ThemeContext';
import { useNavigation } from '../core/NavigationContext';
import { useFocusSafe, useFocusState } from '../core/FocusContext';
import { AnimatedNumber } from '../core/AnimatedNumber';
import { ViewHeader } from '../shared/ViewHeader';
import { EmptyState } from '../shared/EmptyState';
import { useDebouncedValue } from '@/src/hooks/useDebouncedValue';
import { matchesConfidenceFilter, type ConfidenceFilterOption } from '../shared/typeConfig';

interface FindingsViewProps {
  findings: ResearchFinding[];
  sources: ResearchSource[];
  /** Initial finding ID to expand (from navigation) */
  initialFocusedId?: string | null;
}

type SortKey = 'confidence' | 'type' | 'date' | 'sources';
type SortDir = 'asc' | 'desc';

export function FindingsView({ findings, sources, initialFocusedId }: FindingsViewProps) {
  const { theme } = useReportTheme();
  const styles = useThemeStyles();
  const isRadar = theme === 'radar';
  const focusCtx = useFocusSafe();

  // Local filter state - no prop drilling from ReportView
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterConfidence, setFilterConfidence] = useState('all');
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 150);

  const [sortKey, setSortKey] = useState<SortKey>('confidence');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expandedId, setExpandedId] = useState<string | null>(initialFocusedId || null);

  // Sync with initial focus or navigation
  useEffect(() => {
    if (initialFocusedId) {
      setExpandedId(initialFocusedId);
    }
  }, [initialFocusedId]);

  // Handle expanding a finding and updating global focus
  const handleExpand = useCallback((finding: ResearchFinding) => {
    const newId = expandedId === finding.id ? null : finding.id;
    setExpandedId(newId);

    // Update global focus context if available
    if (focusCtx && newId) {
      focusCtx.focusFinding(newId, finding.supporting_sources);
    } else if (focusCtx && !newId) {
      focusCtx.clearFocus();
    }
  }, [expandedId, focusCtx]);

  const sourceMap = useMemo(() => new Map(sources.map(s => [s.id, s])), [sources]);

  const findingTypes = useMemo(() =>
    Array.from(new Set(findings.map(f => f.finding_type).filter(Boolean))),
    [findings]
  );

  const filtered = useMemo(() => {
    return findings.filter((f) => {
      if (debouncedSearchQuery && !f.content.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) return false;
      if (filterType !== 'all' && f.finding_type !== filterType) return false;
      if (!matchesConfidenceFilter(f.confidence_score || 0, filterConfidence as ConfidenceFilterOption)) return false;
      return true;
    });
  }, [findings, debouncedSearchQuery, filterType, filterConfidence]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'confidence': cmp = (a.confidence_score || 0) - (b.confidence_score || 0); break;
        case 'type': cmp = (a.finding_type || '').localeCompare(b.finding_type || ''); break;
        case 'date': cmp = new Date(a.event_date || 0).getTime() - new Date(b.event_date || 0).getTime(); break;
        case 'sources': cmp = (a.supporting_sources?.length || 0) - (b.supporting_sources?.length || 0); break;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  // Virtualization setup
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: sorted.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback((index: number) => {
      // Estimate larger size for expanded rows
      return expandedId === sorted[index]?.id ? 180 : 44;
    }, [expandedId, sorted]),
    overscan: 5,
  });

  if (filtered.length === 0) {
    return (
      <EmptyState
        type="search"
        title="No findings match your filters"
        description="Try adjusting your search terms or filter criteria to see more results."
      />
    );
  }

  return (
    <div className="space-y-4">
      <ViewHeader title="Findings" count={filtered.length} persona="evidence" />

      {/* Inline Toolbar */}
      <div className={`flex flex-wrap gap-3 p-3 rounded-lg ${isRadar ? 'bg-slate-900/50 border border-cyan-500/10' : 'bg-stone-50 border border-stone-200'}`}>
        <input
          type="text"
          placeholder="Search findings..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`flex-1 min-w-[180px] px-3 py-1.5 text-sm rounded-lg ${isRadar ? 'bg-slate-800 border-cyan-500/20 text-white placeholder:text-slate-500' : 'bg-white border-stone-300 text-stone-900 placeholder:text-stone-400'} border focus:outline-none`}
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className={`px-3 py-1.5 text-sm rounded-lg ${isRadar ? 'bg-slate-800 border-cyan-500/20 text-white' : 'bg-white border-stone-300 text-stone-900'} border`}
        >
          <option value="all">All Types</option>
          {findingTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={filterConfidence}
          onChange={(e) => setFilterConfidence(e.target.value)}
          className={`px-3 py-1.5 text-sm rounded-lg ${isRadar ? 'bg-slate-800 border-cyan-500/20 text-white' : 'bg-white border-stone-300 text-stone-900'} border`}
        >
          <option value="all">All Confidence</option>
          <option value="high">High (80%+)</option>
          <option value="medium">Medium (50-79%)</option>
          <option value="low">Low (&lt;50%)</option>
        </select>
      </div>

      {/* Table */}
      <div className={`rounded-xl overflow-hidden border ${isRadar ? 'border-cyan-500/10' : 'border-stone-200'}`}>
        {/* Header */}
        <div className={`grid grid-cols-12 gap-2 px-3 py-2 text-[10px] uppercase tracking-wider font-semibold ${isRadar ? 'bg-slate-900/80 text-slate-400' : 'bg-stone-100 text-stone-500'}`}>
          <SortHeader label="Conf" col={1} sortKey="confidence" current={sortKey} dir={sortDir} onSort={toggleSort} />
          <SortHeader label="Type" col={2} sortKey="type" current={sortKey} dir={sortDir} onSort={toggleSort} />
          <div className="col-span-7">Finding</div>
          <SortHeader label="Src" col={1} sortKey="sources" current={sortKey} dir={sortDir} onSort={toggleSort} />
          <SortHeader label="Date" col={1} sortKey="date" current={sortKey} dir={sortDir} onSort={toggleSort} />
        </div>

        {/* Virtualized Rows */}
        <div
          ref={parentRef}
          className={`max-h-[600px] overflow-auto ${isRadar ? 'divide-cyan-500/5' : 'divide-stone-100'}`}
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const f = sorted[virtualRow.index];
              return (
                <div
                  key={f.id}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className={`border-b ${isRadar ? 'border-cyan-500/5' : 'border-stone-100'}`}
                >
                  <FindingRow
                    finding={f}
                    sourceMap={sourceMap}
                    isExpanded={expandedId === f.id}
                    onToggle={() => handleExpand(f)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function SortHeader({ label, col, sortKey, current, dir, onSort }: {
  label: string; col: number; sortKey: SortKey; current: SortKey; dir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const { theme } = useReportTheme();
  const isRadar = theme === 'radar';
  const isActive = current === sortKey;

  return (
    <button
      onClick={() => onSort(sortKey)}
      className={`col-span-${col} flex items-center gap-1 hover:text-white transition-colors ${isActive ? (isRadar ? 'text-cyan-400' : 'text-stone-900') : ''}`}
    >
      {label}
      {isActive && <span className="text-[8px]">{dir === 'desc' ? '▼' : '▲'}</span>}
    </button>
  );
}

function FindingRow({ finding, sourceMap, isExpanded, onToggle }: {
  finding: ResearchFinding;
  sourceMap: Map<string, ResearchSource>;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { theme } = useReportTheme();
  const styles = useThemeStyles();
  const { navigateTo } = useNavigation();
  const focusState = useFocusState('finding', finding.id);
  const isRadar = theme === 'radar';
  const conf = finding.confidence_score || 0;
  const srcCount = finding.supporting_sources?.length || 0;

  const confColor = conf >= 0.8 ? 'text-emerald-500' : conf >= 0.5 ? 'text-amber-500' : 'text-rose-500';
  const confBg = conf >= 0.8 ? 'bg-emerald-500' : conf >= 0.5 ? 'bg-amber-500' : 'bg-rose-500';

  // Cross-view highlighting: when a related source is focused, highlight this finding
  const isRelatedHighlight = focusState === 'related';

  const handleSourceClick = (sourceId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigateTo({ tab: 'sources', sourceId });
  };

  return (
    <div className={`transition-colors ${
      isRelatedHighlight
        ? isRadar ? 'bg-cyan-500/10 border-l-2 border-cyan-400' : 'bg-blue-50 border-l-2 border-blue-500'
        : isRadar ? 'hover:bg-slate-800/50' : 'hover:bg-stone-50'
    }`}>
      <button onClick={onToggle} className="w-full grid grid-cols-12 gap-2 px-3 py-2 text-left items-center">
        {/* Confidence */}
        <div className="col-span-1 flex items-center gap-1">
          <div className={`w-1.5 h-1.5 rounded-full ${confBg}`} />
          <span className={`text-xs font-mono ${confColor}`}>{Math.round(conf * 100)}</span>
        </div>

        {/* Type */}
        <div className="col-span-2">
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${isRadar ? 'bg-slate-800 text-slate-300' : 'bg-stone-200 text-stone-600'}`}>
            {finding.finding_type}
          </span>
        </div>

        {/* Content */}
        <div className={`col-span-7 text-xs ${styles.text} ${!isExpanded ? 'truncate' : ''}`}>
          {finding.content.split('.')[0]}.
        </div>

        {/* Sources */}
        <div className={`col-span-1 text-xs text-center ${styles.textMuted}`}>{srcCount}</div>

        {/* Date */}
        <div className={`col-span-1 text-[10px] ${styles.textMuted}`}>
          {finding.event_date ? new Date(finding.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`px-3 pb-3 ${isRadar ? 'bg-slate-900/50' : 'bg-stone-50'}`}
          >
            <div className="pl-3 border-l-2 border-cyan-500/30 space-y-2">
              <p className={`text-xs leading-relaxed ${styles.text}`}>{finding.content}</p>

              {finding.extracted_data && Object.keys(finding.extracted_data).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(finding.extracted_data).slice(0, 4).map(([k, v]) => (
                    <span key={k} className={`text-[10px] px-2 py-1 rounded ${isRadar ? 'bg-indigo-500/10 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
                      {k}: {String(v)}
                    </span>
                  ))}
                </div>
              )}

              {srcCount > 0 && (
                <div className="flex flex-wrap gap-1">
                  {finding.supporting_sources?.slice(0, 3).map(id => {
                    const src = sourceMap.get(id);
                    return src ? (
                      <button
                        key={id}
                        onClick={(e) => handleSourceClick(id, e)}
                        className={`text-[10px] ${isRadar ? 'text-cyan-400 hover:text-cyan-300' : 'text-blue-600 hover:underline'} flex items-center gap-1`}
                        title="View source details"
                      >
                        <span className="underline">{src.domain}</span>
                        <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </button>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
