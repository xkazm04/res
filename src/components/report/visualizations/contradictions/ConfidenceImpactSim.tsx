'use client';

/**
 * ConfidenceImpactSim
 *
 * What-if analysis showing how resolving a contradiction would affect
 * overall confidence scores across related findings.
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizationTheme } from '../useVisualizationTheme';
import type { EnrichedContradiction } from '@/src/hooks/useContradictionExplorer';
import type { ResearchFinding } from '@/src/types/research';
import type {
  ResolutionStrategy,
  ConfidenceImpact,
} from '@/src/lib/contradictionResolution';
import { formatConfidenceDelta, getStrategyIcon } from '@/src/lib/contradictionResolution';
import { cn } from '@/src/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  Activity,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface ConfidenceImpactSimProps {
  contradiction: EnrichedContradiction;
  strategies: ResolutionStrategy[];
  confidenceImpacts: Map<string, ConfidenceImpact[]>;
  findings: ResearchFinding[];
}

export function ConfidenceImpactSim({
  contradiction,
  strategies,
  confidenceImpacts,
  findings,
}: ConfidenceImpactSimProps) {
  const { colors, isRadar, surfaceClasses } = useVisualizationTheme();
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(
    strategies[0]?.id ?? null
  );
  const [showPropagation, setShowPropagation] = useState(false);

  // Get impacts for selected strategy
  const impacts = selectedStrategyId
    ? confidenceImpacts.get(selectedStrategyId) ?? []
    : [];

  // Calculate overall impact summary
  const impactSummary = useMemo(() => {
    if (impacts.length === 0) {
      return { totalDelta: 0, affectedCount: 0, trend: 'neutral' as const };
    }

    const totalDelta = impacts.reduce((sum, i) => sum + i.delta, 0);
    const affectedCount = new Set(impacts.flatMap((i) => i.affectedFindings)).size;
    const trend =
      totalDelta > 0.05 ? 'positive' : totalDelta < -0.05 ? 'negative' : 'neutral';

    return { totalDelta, affectedCount, trend };
  }, [impacts]);

  // Get finding by ID
  const getFinding = (id: string) => findings.find((f) => f.id === id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Activity size={18} style={{ color: colors.primary }} />
        <h3 className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
          Confidence Impact Simulation
        </h3>
      </div>

      {/* Info box */}
      <div
        className="p-3 rounded-lg flex items-start gap-3"
        style={{ backgroundColor: colors.primaryFill }}
      >
        <Info size={16} className="flex-shrink-0 mt-0.5" style={{ color: colors.primary }} />
        <p className="text-xs" style={{ color: colors.textSecondary }}>
          See how choosing different resolution strategies would affect the confidence scores
          of the conflicting claims and related findings.
        </p>
      </div>

      {/* Strategy selector */}
      <div>
        <label
          className="text-xs font-medium mb-2 block"
          style={{ color: colors.textSecondary }}
        >
          Select a strategy to simulate
        </label>
        <div className="flex flex-wrap gap-2">
          {strategies.slice(0, 5).map((strategy) => (
            <button
              key={strategy.id}
              onClick={() => setSelectedStrategyId(strategy.id)}
              className={cn(
                'px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2',
                selectedStrategyId === strategy.id
                  ? 'ring-2'
                  : 'hover:bg-white/5'
              )}
              style={{
                backgroundColor:
                  selectedStrategyId === strategy.id
                    ? colors.primaryFill
                    : colors.surfaceBg,
                color:
                  selectedStrategyId === strategy.id
                    ? colors.primary
                    : colors.textSecondary,
                ...(selectedStrategyId === strategy.id && {
                  '--tw-ring-color': colors.primary,
                } as React.CSSProperties),
              }}
            >
              <span>{getStrategyIcon(strategy.type)}</span>
              {strategy.title.split('(')[0].trim()}
            </button>
          ))}
        </div>
      </div>

      {/* Impact visualization */}
      {selectedStrategyId && impacts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Summary card */}
          <div
            className={cn('p-4 rounded-xl', surfaceClasses)}
            style={{
              borderLeft: `4px solid ${
                impactSummary.trend === 'positive'
                  ? colors.success
                  : impactSummary.trend === 'negative'
                    ? colors.danger
                    : colors.warning
              }`,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                Overall Impact
              </h4>
              <div className="flex items-center gap-1">
                {impactSummary.trend === 'positive' && (
                  <TrendingUp size={16} style={{ color: colors.success }} />
                )}
                {impactSummary.trend === 'negative' && (
                  <TrendingDown size={16} style={{ color: colors.danger }} />
                )}
                {impactSummary.trend === 'neutral' && (
                  <Minus size={16} style={{ color: colors.warning }} />
                )}
                <span
                  className="text-sm font-semibold"
                  style={{
                    color:
                      impactSummary.trend === 'positive'
                        ? colors.success
                        : impactSummary.trend === 'negative'
                          ? colors.danger
                          : colors.warning,
                  }}
                >
                  {formatConfidenceDelta(impactSummary.totalDelta / impacts.length)}
                </span>
              </div>
            </div>

            <p className="text-xs" style={{ color: colors.textSecondary }}>
              This resolution would affect {impacts.length} claim
              {impacts.length !== 1 ? 's' : ''} directly and{' '}
              {impactSummary.affectedCount} related finding
              {impactSummary.affectedCount !== 1 ? 's' : ''}.
            </p>
          </div>

          {/* Individual claim impacts */}
          <div className="space-y-3">
            {impacts.map((impact, i) => {
              const finding = getFinding(impact.claimId);
              const isPositive = impact.delta >= 0;

              return (
                <motion.div
                  key={impact.claimId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn('p-4 rounded-xl', surfaceClasses)}
                >
                  {/* Claim header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-[10px] uppercase tracking-wider font-bold"
                          style={{ color: i === 0 ? colors.primary : colors.secondary }}
                        >
                          Claim {i === 0 ? 'A' : 'B'}
                        </span>
                        {finding?.finding_type && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded capitalize"
                            style={{
                              backgroundColor: colors.surfaceBg,
                              color: colors.textMuted,
                            }}
                          >
                            {finding.finding_type}
                          </span>
                        )}
                      </div>
                      <p
                        className="text-xs line-clamp-2"
                        style={{ color: colors.textPrimary }}
                      >
                        {finding?.content?.slice(0, 100) ??
                          (i === 0 ? contradiction.claim_1 : contradiction.claim_2)?.slice(0, 100)}
                        ...
                      </p>
                    </div>
                  </div>

                  {/* Confidence change visualization */}
                  <div className="space-y-2">
                    {/* Before/After bars */}
                    <div className="grid grid-cols-[60px_1fr_60px] gap-3 items-center">
                      <span className="text-xs text-right" style={{ color: colors.textMuted }}>
                        Before
                      </span>
                      <div
                        className="h-2 rounded-full overflow-hidden"
                        style={{ backgroundColor: colors.border }}
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${impact.originalConfidence * 100}%` }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: colors.textMuted }}
                        />
                      </div>
                      <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                        {Math.round(impact.originalConfidence * 100)}%
                      </span>
                    </div>

                    <div className="grid grid-cols-[60px_1fr_60px] gap-3 items-center">
                      <span className="text-xs text-right" style={{ color: colors.textMuted }}>
                        After
                      </span>
                      <div
                        className="h-2 rounded-full overflow-hidden"
                        style={{ backgroundColor: colors.border }}
                      >
                        <motion.div
                          initial={{ width: `${impact.originalConfidence * 100}%` }}
                          animate={{ width: `${impact.newConfidence * 100}%` }}
                          transition={{ delay: 0.3, duration: 0.5 }}
                          className="h-full rounded-full"
                          style={{
                            backgroundColor: isPositive ? colors.success : colors.danger,
                          }}
                        />
                      </div>
                      <span
                        className="text-xs font-semibold"
                        style={{ color: isPositive ? colors.success : colors.danger }}
                      >
                        {Math.round(impact.newConfidence * 100)}%
                      </span>
                    </div>

                    {/* Delta indicator */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <span className="text-xs" style={{ color: colors.textMuted }}>
                        Change:
                      </span>
                      <span
                        className="text-sm font-bold flex items-center gap-1"
                        style={{ color: isPositive ? colors.success : colors.danger }}
                      >
                        {isPositive ? (
                          <TrendingUp size={14} />
                        ) : (
                          <TrendingDown size={14} />
                        )}
                        {formatConfidenceDelta(impact.delta)}
                      </span>
                    </div>
                  </div>

                  {/* Affected findings */}
                  {impact.affectedFindings.length > 0 && (
                    <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${colors.borderSubtle}` }}>
                      <button
                        onClick={() => setShowPropagation(!showPropagation)}
                        className="flex items-center gap-2 text-xs hover:underline"
                        style={{ color: colors.textSecondary }}
                      >
                        <ChevronRight
                          size={12}
                          className={cn('transition-transform', showPropagation && 'rotate-90')}
                        />
                        {impact.affectedFindings.length} related finding
                        {impact.affectedFindings.length !== 1 ? 's' : ''} affected
                      </button>

                      <AnimatePresence>
                        {showPropagation && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <ul className="mt-2 space-y-1 pl-4">
                              {impact.affectedFindings.slice(0, 5).map((findingId) => {
                                const affectedFinding = getFinding(findingId);
                                return (
                                  <li
                                    key={findingId}
                                    className="text-xs"
                                    style={{ color: colors.textMuted }}
                                  >
                                    • {affectedFinding?.content?.slice(0, 50) ?? findingId}...
                                  </li>
                                );
                              })}
                              {impact.affectedFindings.length > 5 && (
                                <li className="text-xs" style={{ color: colors.textMuted }}>
                                  ... and {impact.affectedFindings.length - 5} more
                                </li>
                              )}
                            </ul>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Warning for significant negative impact */}
          {impactSummary.trend === 'negative' && impactSummary.totalDelta < -0.2 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg flex items-start gap-3"
              style={{ backgroundColor: colors.dangerFill }}
            >
              <AlertTriangle
                size={18}
                className="flex-shrink-0 mt-0.5"
                style={{ color: colors.danger }}
              />
              <div>
                <p className="text-sm font-medium" style={{ color: colors.danger }}>
                  Significant Confidence Reduction
                </p>
                <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                  This resolution strategy would significantly reduce confidence in one or more
                  claims. Consider whether this is the intended outcome.
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Empty state */}
      {(!selectedStrategyId || impacts.length === 0) && (
        <div className="text-center py-8">
          <Activity size={32} style={{ color: colors.textMuted }} className="mx-auto mb-3" />
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Select a resolution strategy to see its impact on confidence scores
          </p>
        </div>
      )}
    </div>
  );
}
