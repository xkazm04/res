'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ResearchSource, ResearchFinding } from '@/src/types/research';
import { useReportTheme, useThemeStyles } from '../core/ThemeContext';
import { useFocusSafe, useFocusState } from '../core/FocusContext';
import { ThemedBadge } from '../ThemedCards';
import { AnimatedNumber, AnimatedProgressRing } from '../core/AnimatedNumber';
import { SourceNetwork } from '../visualizations/SourceNetwork';
import { TrustRadar } from '../visualizations/TrustRadar';
import { ViewHeader } from '../shared/ViewHeader';
import { ViewModeToggle, type ViewModeOption } from '../shared/ViewModeToggle';
import { EmptyState } from '../shared/EmptyState';
import { useDebouncedValue } from '@/src/hooks/useDebouncedValue';
import { CollapsibleSection, SectionGroup } from '../shared/CollapsibleSection';
import { matchesConfidenceFilter, type ConfidenceFilterOption } from '../shared/typeConfig';
import { categorizeByCredibility } from '@/src/hooks/useFilteredData';

interface SourcesViewProps {
  sources: ResearchSource[];
  /** Optional findings for building related-items map */
  findings?: ResearchFinding[];
  initialSelectedId?: string | null;
}

type ViewMode = 'cards' | 'network' | 'radar';

const viewModeOptions: ViewModeOption<ViewMode>[] = [
  { value: 'cards', label: 'Cards' },
  { value: 'network', label: 'Network' },
  { value: 'radar', label: 'Radar' },
];

// Stagger animation variants - calculated once at parent level
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95 },
};

export function SourcesView({ sources, findings, initialSelectedId }: SourcesViewProps) {
  const { theme } = useReportTheme();
  const styles = useThemeStyles();
  const isRadar = theme === 'radar';
  const focusCtx = useFocusSafe();

  // Local filter state - no prop drilling from ReportView
  const [searchQuery, setSearchQuery] = useState('');
  const [filterConfidence, setFilterConfidence] = useState('all');
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 150);

  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [selectedSource, setSelectedSource] = useState<string | null>(initialSelectedId || null);

  // Build a map of source ID -> finding IDs that reference it
  const sourceToFindingsMap = useMemo(() => {
    const map = new Map<string, string[]>();
    findings?.forEach(f => {
      f.supporting_sources?.forEach(srcId => {
        const existing = map.get(srcId) || [];
        existing.push(f.id);
        map.set(srcId, existing);
      });
    });
    return map;
  }, [findings]);

  // Sync selection when navigating from another view
  useEffect(() => {
    if (initialSelectedId) {
      setSelectedSource(initialSelectedId);
    }
  }, [initialSelectedId]);

  // Handle selecting a source and updating global focus
  const handleSelectSource = useCallback((id: string | null) => {
    setSelectedSource(id);

    // Update global focus context if available
    if (focusCtx && id) {
      const relatedFindingIds = sourceToFindingsMap.get(id);
      focusCtx.focusSource(id, relatedFindingIds);
    } else if (focusCtx && !id) {
      focusCtx.clearFocus();
    }
  }, [focusCtx, sourceToFindingsMap]);

  const filtered = useMemo(() => {
    return sources.filter((s) => {
      if (debouncedSearchQuery) {
        const q = debouncedSearchQuery.toLowerCase();
        if (!s.title?.toLowerCase().includes(q) && !s.domain?.toLowerCase().includes(q)) return false;
      }
      if (!matchesConfidenceFilter(s.credibility_score || 0, filterConfidence as ConfidenceFilterOption)) return false;
      return true;
    });
  }, [sources, debouncedSearchQuery, filterConfidence]);

  const stats = useMemo(() => {
    const buckets = categorizeByCredibility(filtered, s => s.credibility_score || 0);
    return { high: buckets.high.length, med: buckets.medium.length, low: buckets.low.length };
  }, [filtered]);

  if (filtered.length === 0) {
    return (
      <EmptyState
        type="search"
        title="No sources match your filters"
        description="Try adjusting your search or confidence filters to see more results."
      />
    );
  }

  return (
    <div className="space-y-4">
      <ViewHeader
        title="Sources"
        count={filtered.length}
        persona="source"
        actions={<ViewModeToggle options={viewModeOptions} value={viewMode} onChange={setViewMode} />}
      />

      {/* Inline Toolbar */}
      <div className={`flex flex-wrap gap-3 p-3 rounded-lg ${isRadar ? 'bg-slate-900/50 border border-cyan-500/10' : 'bg-stone-50 border border-stone-200'}`}>
        <input
          type="text"
          placeholder="Search sources..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`flex-1 min-w-[180px] px-3 py-1.5 text-sm rounded-lg ${isRadar ? 'bg-slate-800 border-cyan-500/20 text-white placeholder:text-slate-500' : 'bg-white border-stone-300 text-stone-900 placeholder:text-stone-400'} border focus:outline-none`}
        />
        <select
          value={filterConfidence}
          onChange={(e) => setFilterConfidence(e.target.value)}
          className={`px-3 py-1.5 text-sm rounded-lg ${isRadar ? 'bg-slate-800 border-cyan-500/20 text-white' : 'bg-white border-stone-300 text-stone-900'} border`}
        >
          <option value="all">All Credibility</option>
          <option value="high">High (80%+)</option>
          <option value="medium">Medium (50-79%)</option>
          <option value="low">Low (&lt;50%)</option>
        </select>
      </div>

      {/* Credibility summary bar */}
      <CredibilityBar stats={stats} total={filtered.length} />

      {/* Network View */}
      {viewMode === 'network' && (
        <CollapsibleSection
          sectionId="sources-network"
          title="Source Network"
          subtitle="Visual connections between sources"
          icon="🔗"
          count={filtered.length}
          variant="card"
        >
          <SourceNetwork sources={filtered} selectedSource={selectedSource || undefined} onSourceSelect={handleSelectSource} />
        </CollapsibleSection>
      )}

      {/* Radar View */}
      {viewMode === 'radar' && (
        <CollapsibleSection
          sectionId="sources-radar"
          title="Trust Radar"
          subtitle="Source credibility distribution"
          icon="📡"
          count={filtered.length}
          variant="card"
        >
          <TrustRadar sources={filtered} />
        </CollapsibleSection>
      )}

      {/* Cards View */}
      {viewMode === 'cards' && (
        <CollapsibleSection
          sectionId="sources-cards"
          title="Source Cards"
          subtitle="Detailed source information"
          icon="📄"
          count={filtered.length}
          variant="card"
        >
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 gap-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence>
              {filtered.map((source) => (
                <SourceCard key={source.id} source={source} isSelected={selectedSource === source.id} onSelect={handleSelectSource} />
              ))}
            </AnimatePresence>
          </motion.div>
        </CollapsibleSection>
      )}
    </div>
  );
}

function CredibilityBar({ stats, total }: { stats: { high: number; med: number; low: number }; total: number }) {
  const { theme } = useReportTheme();
  const styles = useThemeStyles();
  const isRadar = theme === 'radar';

  return (
    <div className={`flex items-center gap-4`}>
      <div className={`text-sm ${styles.textMuted}`}><AnimatedNumber value={total} /> sources</div>
      <div className="flex items-center gap-1 h-2 w-32 rounded-full overflow-hidden bg-slate-700/20">
        <motion.div initial={{ width: 0 }} animate={{ width: `${(stats.high / total) * 100}%` }} className="h-full bg-emerald-500" />
        <motion.div initial={{ width: 0 }} animate={{ width: `${(stats.med / total) * 100}%` }} className="h-full bg-amber-500" />
        <motion.div initial={{ width: 0 }} animate={{ width: `${(stats.low / total) * 100}%` }} className="h-full bg-rose-500" />
      </div>
    </div>
  );
}

function SourceCard({ source, isSelected, onSelect }: {
  source: ResearchSource;
  isSelected: boolean;
  onSelect: (id: string | null) => void;
}) {
  const { theme } = useReportTheme();
  const styles = useThemeStyles();
  const focusState = useFocusState('source', source.id);
  const isRadar = theme === 'radar';
  const cred = source.credibility_score || 0;

  // Cross-view highlighting: when a related finding is focused, highlight this source
  const isRelatedHighlight = focusState === 'related';

  return (
    <motion.div
      layout
      variants={itemVariants}
      exit="exit"
      onClick={() => onSelect(isSelected ? null : source.id)}
      className={`p-4 rounded-xl cursor-pointer transition-all ${
        isRelatedHighlight
          ? isRadar
            ? 'bg-cyan-500/10 border-2 border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.15)]'
            : 'bg-blue-50 border-2 border-blue-400 shadow-md'
          : isRadar
            ? `bg-slate-900/60 border ${isSelected ? 'border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]' : 'border-cyan-500/10 hover:border-cyan-500/30'}`
            : `bg-white border ${isSelected ? 'border-stone-800 shadow-lg' : 'border-stone-200 hover:border-stone-400'}`
      }`}
    >
      <div className="flex items-start gap-3">
        <AnimatedProgressRing
          value={cred * 100}
          size={44}
          strokeWidth={3}
          color={cred >= 0.8 ? '#34d399' : cred >= 0.5 ? '#fbbf24' : '#f87171'}
          bgColor={isRadar ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <ThemedBadge>{source.source_type || 'web'}</ThemedBadge>
            <span className={`text-[10px] ${styles.textMuted}`}>{Math.round(cred * 100)}%</span>
          </div>
          <a href={source.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
            className={`text-sm font-medium line-clamp-1 transition-colors ${isRadar ? 'text-cyan-300 hover:text-cyan-200' : 'text-blue-600 hover:text-blue-800'}`}>
            {source.title || source.domain}
          </a>
          <p className={`text-[10px] ${styles.textMuted} mt-0.5`}>{source.domain}</p>
          {source.snippet && (
            <p className={`text-xs ${styles.textMuted} mt-2 line-clamp-2 italic`}>"{source.snippet}"</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
