'use client';

/**
 * ContradictionExplorer
 *
 * Main container component for interactive contradiction exploration.
 * Features a list/detail split view with filtering and status management.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizationTheme } from '../useVisualizationTheme';
import {
  useContradictionExplorer,
  type FilterStatus,
  type SortOption,
} from '@/src/hooks/useContradictionExplorer';
import type {
  ResearchContradiction,
  ResearchFinding,
  ResearchSource,
} from '@/src/types/research';
import { ClaimComparison } from './ClaimComparison';
import { SourceQualityCompare } from './SourceQualityCompare';
import { ResolutionSuggester } from './ResolutionSuggester';
import { ConfidenceImpactSim } from './ConfidenceImpactSim';
import { ResolutionTracker } from './ResolutionTracker';
import { getSeverityColor } from '@/src/lib/contradictionResolution';
import { cn } from '@/src/lib/utils';
import {
  AlertTriangle,
  Search,
  SlidersHorizontal,
  ChevronRight,
  X,
  BarChart3,
  GitCompare,
  Lightbulb,
  History,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface ContradictionExplorerProps {
  contradictions: ResearchContradiction[];
  findings: ResearchFinding[];
  sources: ResearchSource[];
  className?: string;
  onResolutionChange?: (contradictionId: string, status: string) => void;
}

type DetailTab = 'compare' | 'sources' | 'strategies' | 'impact' | 'history';

// ============================================================================
// Main Component
// ============================================================================

export function ContradictionExplorer({
  contradictions,
  findings,
  sources,
  className,
  onResolutionChange,
}: ContradictionExplorerProps) {
  const { colors, isRadar, cardClasses, surfaceClasses, tooltipClasses, getButtonClasses } =
    useVisualizationTheme();

  const explorer = useContradictionExplorer({
    contradictions,
    findings,
    sources,
    onResolutionChange: (res) => onResolutionChange?.(res.contradictionId, res.status),
  });

  const [activeTab, setActiveTab] = useState<DetailTab>('compare');
  const [showFilters, setShowFilters] = useState(false);

  // Empty state
  if (contradictions.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12', cardClasses, className)}>
        <AlertTriangle size={48} style={{ color: colors.textMuted }} className="mb-4" />
        <h3 className="text-lg font-medium mb-2" style={{ color: colors.textPrimary }}>
          No Contradictions Found
        </h3>
        <p className="text-sm text-center max-w-md" style={{ color: colors.textSecondary }}>
          No conflicting claims were identified in the research. This could indicate strong
          source agreement or limited source diversity.
        </p>
      </div>
    );
  }

  const tabs: Array<{ id: DetailTab; label: string; icon: typeof GitCompare }> = [
    { id: 'compare', label: 'Compare', icon: GitCompare },
    { id: 'sources', label: 'Sources', icon: BarChart3 },
    { id: 'strategies', label: 'Resolve', icon: Lightbulb },
    { id: 'impact', label: 'Impact', icon: BarChart3 },
    { id: 'history', label: 'History', icon: History },
  ];

  return (
    <div className={cn('grid grid-cols-[350px_1fr] gap-4 h-[600px]', className)}>
      {/* Left Panel: Contradiction List */}
      <div className={cn('flex flex-col rounded-xl overflow-hidden', cardClasses)}>
        {/* Header with stats */}
        <div className="p-4 border-b" style={{ borderColor: colors.border }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
              Contradictions
            </h2>
            <div className="flex items-center gap-1">
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: colors.dangerFill,
                  color: colors.danger,
                }}
              >
                {explorer.stats.unresolved} unresolved
              </span>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: colors.textMuted }}
            />
            <input
              type="text"
              placeholder="Search contradictions..."
              value={explorer.searchQuery}
              onChange={(e) => explorer.setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm rounded-lg bg-transparent border outline-none"
              style={{ borderColor: colors.border, color: colors.textPrimary }}
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded transition-colors',
                showFilters && 'bg-white/10'
              )}
            >
              <SlidersHorizontal size={14} style={{ color: colors.textSecondary }} />
            </button>
          </div>

          {/* Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-3 space-y-2">
                  {/* Status filter */}
                  <div className="flex flex-wrap gap-1">
                    {(['all', 'unresolved', 'investigating', 'resolved', 'dismissed'] as FilterStatus[]).map(
                      (status) => (
                        <button
                          key={status}
                          onClick={() => explorer.setFilterStatus(status)}
                          className={cn(
                            'px-2 py-1 text-xs rounded capitalize transition-colors',
                            getButtonClasses(explorer.filterStatus === status)
                          )}
                        >
                          {status}
                        </button>
                      )
                    )}
                  </div>

                  {/* Sort */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: colors.textMuted }}>
                      Sort:
                    </span>
                    {(['severity', 'date', 'status'] as SortOption[]).map((sort) => (
                      <button
                        key={sort}
                        onClick={() => explorer.setSortBy(sort)}
                        className={cn(
                          'px-2 py-1 text-xs rounded capitalize transition-colors',
                          getButtonClasses(explorer.sortBy === sort)
                        )}
                      >
                        {sort}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {explorer.enrichedContradictions.map((c, i) => {
            const isSelected = explorer.selectedId === c.id;
            const status = c.resolution?.status ?? 'unresolved';

            return (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => explorer.selectContradiction(c.id)}
                className={cn(
                  'w-full p-3 text-left border-b transition-colors',
                  isSelected && (isRadar ? 'bg-cyan-500/10' : 'bg-stone-100')
                )}
                style={{ borderColor: colors.borderSubtle }}
              >
                <div className="flex items-start gap-3">
                  {/* Severity indicator */}
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                    style={{ backgroundColor: getSeverityColor(c.severity.level) }}
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-[10px] uppercase tracking-wider font-medium"
                        style={{ color: getSeverityColor(c.severity.level) }}
                      >
                        {c.severity.level}
                      </span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded capitalize"
                        style={{
                          backgroundColor:
                            status === 'resolved'
                              ? colors.successFill
                              : status === 'investigating'
                                ? colors.warningFill
                                : status === 'dismissed'
                                  ? colors.surfaceBg
                                  : colors.dangerFill,
                          color:
                            status === 'resolved'
                              ? colors.success
                              : status === 'investigating'
                                ? colors.warning
                                : status === 'dismissed'
                                  ? colors.textMuted
                                  : colors.danger,
                        }}
                      >
                        {status}
                      </span>
                    </div>

                    <p
                      className="text-sm line-clamp-2"
                      style={{ color: colors.textPrimary }}
                    >
                      {c.claim_1?.slice(0, 60)}...
                    </p>
                    <p
                      className="text-xs mt-1 line-clamp-1"
                      style={{ color: colors.textSecondary }}
                    >
                      vs: {c.claim_2?.slice(0, 50)}...
                    </p>
                  </div>

                  {/* Arrow */}
                  <ChevronRight
                    size={16}
                    className={cn(
                      'flex-shrink-0 transition-transform',
                      isSelected && 'rotate-90'
                    )}
                    style={{ color: colors.textMuted }}
                  />
                </div>
              </motion.button>
            );
          })}

          {explorer.enrichedContradictions.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-sm" style={{ color: colors.textMuted }}>
                No contradictions match your filters
              </p>
            </div>
          )}
        </div>

        {/* Footer stats */}
        <div
          className="px-4 py-2 border-t text-[10px] flex items-center justify-between"
          style={{ borderColor: colors.border, color: colors.textMuted }}
        >
          <span>
            {explorer.stats.criticalCount} critical · {explorer.stats.highCount} high
          </span>
          <span>
            {explorer.stats.resolved}/{explorer.stats.total} resolved
          </span>
        </div>
      </div>

      {/* Right Panel: Detail View */}
      <div className={cn('flex flex-col rounded-xl overflow-hidden', cardClasses)}>
        {explorer.selectedContradiction ? (
          <>
            {/* Header */}
            <div
              className="p-4 border-b flex items-center justify-between"
              style={{ borderColor: colors.border }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: getSeverityColor(
                      explorer.selectedContradiction.severity.level
                    ),
                  }}
                />
                <div>
                  <h3 className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                    {explorer.selectedContradiction.severity.level.charAt(0).toUpperCase() +
                      explorer.selectedContradiction.severity.level.slice(1)}{' '}
                    Severity Contradiction
                  </h3>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>
                    {explorer.selectedContradiction.severity.reasoning.slice(0, 80)}...
                  </p>
                </div>
              </div>

              <button
                onClick={() => explorer.selectContradiction(null)}
                className="p-2 rounded hover:bg-white/10 transition-colors"
              >
                <X size={16} style={{ color: colors.textMuted }} />
              </button>
            </div>

            {/* Tabs */}
            <div
              className="flex border-b px-2"
              style={{ borderColor: colors.border }}
            >
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    'px-4 py-3 text-xs font-medium flex items-center gap-2 border-b-2 transition-colors -mb-px',
                    activeTab === id
                      ? 'border-current'
                      : 'border-transparent hover:bg-white/5'
                  )}
                  style={{
                    color: activeTab === id ? colors.primary : colors.textSecondary,
                  }}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-4">
              <AnimatePresence mode="wait">
                {activeTab === 'compare' && (
                  <motion.div
                    key="compare"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <ClaimComparison contradiction={explorer.selectedContradiction} />
                  </motion.div>
                )}

                {activeTab === 'sources' && (
                  <motion.div
                    key="sources"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <SourceQualityCompare contradiction={explorer.selectedContradiction} />
                  </motion.div>
                )}

                {activeTab === 'strategies' && (
                  <motion.div
                    key="strategies"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <ResolutionSuggester
                      contradiction={explorer.selectedContradiction}
                      strategies={explorer.strategies}
                      onSelectStrategy={(strategy) =>
                        explorer.selectStrategy(explorer.selectedContradiction!.id, strategy)
                      }
                      onVote={(strategy, confidence, reasoning) =>
                        explorer.submitVote(
                          explorer.selectedContradiction!.id,
                          strategy,
                          confidence,
                          reasoning
                        )
                      }
                      onFinalize={(customResolution) =>
                        explorer.finalizeResolution(
                          explorer.selectedContradiction!.id,
                          customResolution
                        )
                      }
                    />
                  </motion.div>
                )}

                {activeTab === 'impact' && (
                  <motion.div
                    key="impact"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <ConfidenceImpactSim
                      contradiction={explorer.selectedContradiction}
                      strategies={explorer.strategies}
                      confidenceImpacts={explorer.confidenceImpacts}
                      findings={findings}
                    />
                  </motion.div>
                )}

                {activeTab === 'history' && (
                  <motion.div
                    key="history"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <ResolutionTracker
                      contradiction={explorer.selectedContradiction}
                      onStatusChange={(status) =>
                        explorer.updateStatus(explorer.selectedContradiction!.id, status)
                      }
                      onAddNote={(note) =>
                        explorer.addNote(explorer.selectedContradiction!.id, note)
                      }
                      history={explorer.getHistory(explorer.selectedContradiction.id)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          /* Empty selection state */
          <div className="flex-1 flex flex-col items-center justify-center">
            <AlertTriangle size={48} style={{ color: colors.textMuted }} className="mb-4" />
            <h3 className="text-lg font-medium mb-2" style={{ color: colors.textPrimary }}>
              Select a Contradiction
            </h3>
            <p className="text-sm text-center max-w-md" style={{ color: colors.textSecondary }}>
              Choose a contradiction from the list to view details, compare claims, and explore
              resolution strategies.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
