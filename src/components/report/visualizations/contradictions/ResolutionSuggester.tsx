'use client';

/**
 * ResolutionSuggester
 *
 * AI-powered resolution strategy suggestions with voting interface
 * for team decision-making.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizationTheme } from '../useVisualizationTheme';
import type { EnrichedContradiction } from '@/src/hooks/useContradictionExplorer';
import type {
  ResolutionStrategy,
  ResolutionStrategyType,
} from '@/src/lib/contradictionResolution';
import { getStrategyIcon } from '@/src/lib/contradictionResolution';
import { cn } from '@/src/lib/utils';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  MessageSquare,
  Check,
  Sparkles,
  Users,
} from 'lucide-react';

interface ResolutionSuggesterProps {
  contradiction: EnrichedContradiction;
  strategies: ResolutionStrategy[];
  onSelectStrategy: (strategy: ResolutionStrategyType) => void;
  onVote: (
    strategy: ResolutionStrategyType,
    confidence: number,
    reasoning?: string
  ) => void;
  onFinalize: (customResolution?: string) => void;
}

export function ResolutionSuggester({
  contradiction,
  strategies,
  onSelectStrategy,
  onVote,
  onFinalize,
}: ResolutionSuggesterProps) {
  const { colors, isRadar, surfaceClasses, getButtonClasses } = useVisualizationTheme();
  const [expandedStrategy, setExpandedStrategy] = useState<string | null>(
    strategies[0]?.id ?? null
  );
  const [votingStrategy, setVotingStrategy] = useState<string | null>(null);
  const [voteConfidence, setVoteConfidence] = useState(0.7);
  const [voteReasoning, setVoteReasoning] = useState('');
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [customResolution, setCustomResolution] = useState('');

  const selectedStrategy = contradiction.resolution?.selectedStrategy;
  const votingSummary = contradiction.votingSummary;
  const totalVotes = Array.from(votingSummary.values()).reduce(
    (sum, v) => sum + v.count,
    0
  );

  const handleVoteSubmit = () => {
    if (votingStrategy) {
      onVote(votingStrategy as ResolutionStrategyType, voteConfidence, voteReasoning);
      setVotingStrategy(null);
      setVoteReasoning('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={18} style={{ color: colors.primary }} />
          <h3 className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
            Resolution Strategies
          </h3>
        </div>

        {totalVotes > 0 && (
          <div className="flex items-center gap-2 text-xs" style={{ color: colors.textSecondary }}>
            <Users size={14} />
            <span>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Strategy list */}
      <div className="space-y-3">
        {strategies.map((strategy, i) => {
          const isExpanded = expandedStrategy === strategy.id;
          const isSelected = selectedStrategy === strategy.type;
          const voteData = votingSummary.get(strategy.type);
          const votePercentage =
            totalVotes > 0 && voteData ? (voteData.count / totalVotes) * 100 : 0;

          return (
            <motion.div
              key={strategy.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                'rounded-xl overflow-hidden border transition-all',
                isSelected && 'ring-2',
                surfaceClasses
              )}
              style={{
                borderColor: isSelected ? colors.primary : colors.borderSubtle,
                ...(isSelected && { '--tw-ring-color': colors.primary } as React.CSSProperties),
              }}
            >
              {/* Strategy header */}
              <button
                onClick={() => setExpandedStrategy(isExpanded ? null : strategy.id)}
                className="w-full p-4 flex items-center gap-3 text-left"
              >
                {/* Strategy icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{
                    backgroundColor: isSelected ? colors.primaryFill : colors.surfaceBg,
                    color: isSelected ? colors.primary : colors.textSecondary,
                  }}
                >
                  {getStrategyIcon(strategy.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4
                      className="text-sm font-medium truncate"
                      style={{ color: colors.textPrimary }}
                    >
                      {strategy.title}
                    </h4>
                    {isSelected && (
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: colors.successFill,
                          color: colors.success,
                        }}
                      >
                        Selected
                      </span>
                    )}
                  </div>
                  <p
                    className="text-xs line-clamp-1 mt-0.5"
                    style={{ color: colors.textSecondary }}
                  >
                    {strategy.description}
                  </p>
                </div>

                {/* Confidence badge */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span
                    className="text-xs font-medium"
                    style={{
                      color:
                        strategy.confidence > 0.6
                          ? colors.success
                          : strategy.confidence > 0.4
                            ? colors.warning
                            : colors.textMuted,
                    }}
                  >
                    {Math.round(strategy.confidence * 100)}% match
                  </span>

                  {voteData && voteData.count > 0 && (
                    <div className="flex items-center gap-1">
                      <ThumbsUp size={10} style={{ color: colors.textMuted }} />
                      <span className="text-[10px]" style={{ color: colors.textMuted }}>
                        {voteData.count}
                      </span>
                    </div>
                  )}
                </div>

                {/* Expand icon */}
                {isExpanded ? (
                  <ChevronUp size={16} style={{ color: colors.textMuted }} />
                ) : (
                  <ChevronDown size={16} style={{ color: colors.textMuted }} />
                )}
              </button>

              {/* Vote progress bar */}
              {votePercentage > 0 && (
                <div
                  className="h-1 -mt-1"
                  style={{ backgroundColor: colors.border }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${votePercentage}%` }}
                    className="h-full"
                    style={{ backgroundColor: colors.primary }}
                  />
                </div>
              )}

              {/* Expanded content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div
                      className="px-4 pb-4 pt-2 space-y-4"
                      style={{ borderTop: `1px solid ${colors.borderSubtle}` }}
                    >
                      {/* Rationale */}
                      <div>
                        <h5
                          className="text-[10px] uppercase tracking-wider font-semibold mb-1"
                          style={{ color: colors.textSecondary }}
                        >
                          Rationale
                        </h5>
                        <p className="text-sm" style={{ color: colors.textPrimary }}>
                          {strategy.rationale}
                        </p>
                      </div>

                      {/* Required actions */}
                      {strategy.requiredActions && strategy.requiredActions.length > 0 && (
                        <div>
                          <h5
                            className="text-[10px] uppercase tracking-wider font-semibold mb-2"
                            style={{ color: colors.textSecondary }}
                          >
                            Required Actions
                          </h5>
                          <ul className="space-y-1">
                            {strategy.requiredActions.map((action, j) => (
                              <li
                                key={j}
                                className="flex items-start gap-2 text-xs"
                                style={{ color: colors.textPrimary }}
                              >
                                <Check
                                  size={12}
                                  className="mt-0.5 flex-shrink-0"
                                  style={{ color: colors.success }}
                                />
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Evidence gaps */}
                      {strategy.evidenceGaps && strategy.evidenceGaps.length > 0 && (
                        <div
                          className="p-3 rounded-lg"
                          style={{ backgroundColor: colors.warningFill }}
                        >
                          <h5
                            className="text-[10px] uppercase tracking-wider font-semibold mb-1"
                            style={{ color: colors.warning }}
                          >
                            Evidence Gaps
                          </h5>
                          <ul className="space-y-1">
                            {strategy.evidenceGaps.map((gap, j) => (
                              <li
                                key={j}
                                className="text-xs"
                                style={{ color: colors.textPrimary }}
                              >
                                • {gap}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={() => onSelectStrategy(strategy.type)}
                          disabled={isSelected}
                          className={cn(
                            'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2',
                            isSelected
                              ? 'opacity-50 cursor-not-allowed'
                              : getButtonClasses(false)
                          )}
                          style={
                            !isSelected
                              ? {
                                  backgroundColor: colors.primaryFill,
                                  color: colors.primary,
                                }
                              : undefined
                          }
                        >
                          <CheckCircle2 size={14} />
                          {isSelected ? 'Selected' : 'Select Strategy'}
                        </button>

                        <button
                          onClick={() =>
                            setVotingStrategy(votingStrategy === strategy.id ? null : strategy.id)
                          }
                          className={cn(
                            'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
                            getButtonClasses(votingStrategy === strategy.id)
                          )}
                        >
                          <ThumbsUp size={14} />
                          Vote
                        </button>
                      </div>

                      {/* Voting form */}
                      <AnimatePresence>
                        {votingStrategy === strategy.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div
                              className="p-4 rounded-lg space-y-3"
                              style={{ backgroundColor: colors.cardBg }}
                            >
                              {/* Confidence slider */}
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <label
                                    className="text-xs font-medium"
                                    style={{ color: colors.textSecondary }}
                                  >
                                    Your confidence in this strategy
                                  </label>
                                  <span
                                    className="text-sm font-semibold"
                                    style={{ color: colors.primary }}
                                  >
                                    {Math.round(voteConfidence * 100)}%
                                  </span>
                                </div>
                                <input
                                  type="range"
                                  min={0}
                                  max={100}
                                  value={voteConfidence * 100}
                                  onChange={(e) =>
                                    setVoteConfidence(parseInt(e.target.value) / 100)
                                  }
                                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                                  style={{
                                    background: `linear-gradient(to right, ${colors.primary} 0%, ${colors.primary} ${voteConfidence * 100}%, ${colors.border} ${voteConfidence * 100}%, ${colors.border} 100%)`,
                                  }}
                                />
                              </div>

                              {/* Reasoning textarea */}
                              <div>
                                <label
                                  className="text-xs font-medium mb-1 block"
                                  style={{ color: colors.textSecondary }}
                                >
                                  Reasoning (optional)
                                </label>
                                <textarea
                                  value={voteReasoning}
                                  onChange={(e) => setVoteReasoning(e.target.value)}
                                  placeholder="Why do you prefer this strategy?"
                                  rows={2}
                                  className="w-full px-3 py-2 text-sm rounded-lg bg-transparent border outline-none resize-none"
                                  style={{
                                    borderColor: colors.border,
                                    color: colors.textPrimary,
                                  }}
                                />
                              </div>

                              {/* Submit */}
                              <button
                                onClick={handleVoteSubmit}
                                className="w-full px-4 py-2 rounded-lg text-sm font-medium"
                                style={{
                                  backgroundColor: colors.primary,
                                  color: colors.textOnDark,
                                }}
                              >
                                Submit Vote
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Finalize resolution button */}
      {selectedStrategy && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-4 border-t"
          style={{ borderColor: colors.border }}
        >
          <button
            onClick={() => setShowFinalizeModal(true)}
            className="w-full px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
            style={{
              backgroundColor: colors.success,
              color: colors.textOnDark,
            }}
          >
            <CheckCircle2 size={18} />
            Finalize Resolution
          </button>
        </motion.div>
      )}

      {/* Finalize modal */}
      <AnimatePresence>
        {showFinalizeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setShowFinalizeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md p-6 rounded-2xl"
              style={{ backgroundColor: colors.cardBg }}
            >
              <h3
                className="text-lg font-semibold mb-2"
                style={{ color: colors.textPrimary }}
              >
                Finalize Resolution
              </h3>
              <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
                This will mark the contradiction as resolved. You can add a custom resolution
                note below.
              </p>

              <textarea
                value={customResolution}
                onChange={(e) => setCustomResolution(e.target.value)}
                placeholder="Optional: Add a resolution summary..."
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-lg bg-transparent border outline-none resize-none mb-4"
                style={{
                  borderColor: colors.border,
                  color: colors.textPrimary,
                }}
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setShowFinalizeModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium border"
                  style={{
                    borderColor: colors.border,
                    color: colors.textSecondary,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onFinalize(customResolution || undefined);
                    setShowFinalizeModal(false);
                  }}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium"
                  style={{
                    backgroundColor: colors.success,
                    color: colors.textOnDark,
                  }}
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
